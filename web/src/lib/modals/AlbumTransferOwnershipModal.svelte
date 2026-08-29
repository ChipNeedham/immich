<script lang="ts">
  import { getUserGroups, transferAlbumOwnership, type UserGroupResponseDto } from '$lib/api/user-group.api';
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { getAlbumOwnerUser } from '$lib/utils/album-utils';
  import { handleError } from '$lib/utils/handle-error';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import { searchUsers, type AlbumResponseDto, type UserResponseDto } from '@immich/sdk';
  import { Modal, ModalBody, Button, Stack, Text } from '@immich/ui';
  import { toastManager } from '@immich/ui';
  import { mdiAccountGroup, mdiAccount } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type TransferMode = 'group' | 'user';

  type Props = {
    album: AlbumResponseDto;
    onClose: (transferred?: boolean) => void;
  };

  const { album, onClose }: Props = $props();

  let mode: TransferMode = $state('group');
  let groups: UserGroupResponseDto[] = $state([]);
  let users: UserResponseDto[] = $state([]);
  let selectedGroupId: string | undefined = $state(undefined);
  let selectedUserId: string | undefined = $state(undefined);
  let search = $state('');
  let loading = $state(true);
  let submitting = $state(false);

  const currentOwnerId = $derived(getAlbumOwnerUser(album)?.id ?? authManager.user.id);

  const filteredUsers = $derived(
    users.filter(
      (user) =>
        user.id !== currentOwnerId &&
        normalizeSearchString(user.name).includes(normalizeSearchString(search)),
    ),
  );

  onMount(async () => {
    try {
      const [groupsResult, usersResult] = await Promise.all([getUserGroups(), searchUsers()]);
      groups = groupsResult;
      users = usersResult;
    } catch (error) {
      handleError(error, $t('user_groups_unable_to_load'));
    } finally {
      loading = false;
    }
  });

  const handleTransfer = async () => {
    const dto = mode === 'group' ? { groupId: selectedGroupId } : { userId: selectedUserId };
    if (!dto.groupId && !dto.userId) {
      return;
    }

    submitting = true;
    try {
      await transferAlbumOwnership(album.id, dto);
      toastManager.primary($t('album_ownership_transferred'));
      onClose(true);
    } catch (error) {
      handleError(error, $t('album_ownership_transfer_failed'));
    } finally {
      submitting = false;
    }
  };

  const switchMode = (newMode: TransferMode) => {
    mode = newMode;
    selectedGroupId = undefined;
    selectedUserId = undefined;
    search = '';
  };
</script>

<Modal title={$t('transfer_ownership')} {onClose} size="small">
  <ModalBody>
    <Stack gap={4}>
      <Text size="small" color="muted">
        {$t('transfer_ownership_description', { values: { album: album.albumName } })}
      </Text>

      <div class="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
            {mode === 'group'
            ? 'bg-white text-black shadow-sm dark:bg-gray-700 dark:text-white'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}"
          onclick={() => switchMode('group')}
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d={mdiAccountGroup} />
          </svg>
          {$t('user_group')}
        </button>
        <button
          type="button"
          class="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors
            {mode === 'user'
            ? 'bg-white text-black shadow-sm dark:bg-gray-700 dark:text-white'
            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'}"
          onclick={() => switchMode('user')}
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d={mdiAccount} />
          </svg>
          {$t('individual_user')}
        </button>
      </div>

      {#if loading}
        <Text size="small" color="muted" class="py-4 text-center">{$t('loading')}</Text>
      {:else if mode === 'group'}
        {#if groups.length === 0}
          <Text size="small" color="muted" class="py-4 text-center">{$t('user_groups_no_groups')}</Text>
        {:else}
          <div class="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {#each groups as group (group.id)}
              <button
                type="button"
                class="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors
                  {selectedGroupId === group.id
                  ? 'border-primary bg-primary/10 dark:border-primary dark:bg-primary/20'
                  : 'border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'}"
                onclick={() => { selectedGroupId = group.id; selectedUserId = undefined; }}
              >
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 dark:bg-primary/30">
                  <svg class="h-5 w-5 text-primary" viewBox="0 0 24 24">
                    <path fill="currentColor" d={mdiAccountGroup} />
                  </svg>
                </div>
                <div>
                  <Text fontWeight="medium">{group.name}</Text>
                  <Text size="tiny" color="muted">
                    {$t('user_groups_member_count', { values: { count: group.members?.length ?? 0 } })}
                  </Text>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      {:else}
        <input
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:focus:border-primary"
          placeholder={$t('search')}
          bind:value={search}
        />
        {#if filteredUsers.length === 0}
          <Text size="small" color="muted" class="py-4 text-center">{$t('no_results')}</Text>
        {:else}
          <div class="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {#each filteredUsers as user (user.id)}
              <button
                type="button"
                class="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors
                  {selectedUserId === user.id
                  ? 'border-primary bg-primary/10 dark:border-primary dark:bg-primary/20'
                  : 'border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'}"
                onclick={() => { selectedUserId = user.id; selectedGroupId = undefined; }}
              >
                <UserAvatar {user} size="md" />
                <div>
                  <Text fontWeight="medium">{user.name}</Text>
                  <Text size="tiny" color="muted">{user.email}</Text>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      {/if}

      <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={() => onClose()}>{$t('cancel')}</Button>
        <Button
          color="primary"
          onclick={handleTransfer}
          disabled={(mode === 'group' ? !selectedGroupId : !selectedUserId) || submitting}
        >
          {$t('transfer')}
        </Button>
      </div>
    </Stack>
  </ModalBody>
</Modal>
