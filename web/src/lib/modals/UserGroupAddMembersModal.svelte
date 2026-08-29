<script lang="ts">
  import { initInput } from '$lib/actions/focus';
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { handleAddUserGroupMembers } from '$lib/services/user-group.service';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import { searchUsers, type UserResponseDto } from '@immich/sdk';
  import { FormModal, ListButton, LoadingSpinner, Stack, Text } from '@immich/ui';
  import { sortBy } from 'lodash-es';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import { SvelteMap } from 'svelte/reactivity';

  type Props = {
    groupId: string;
    existingMemberIds: string[];
    onClose: (result?: boolean) => void;
  };

  let search = $state('');

  const { groupId, existingMemberIds, onClose }: Props = $props();

  let users: UserResponseDto[] = $state([]);
  const filteredUsers = $derived(
    sortBy(
      users.filter(
        (user) =>
          !existingMemberIds.includes(user.id) &&
          normalizeSearchString(user.name).includes(normalizeSearchString(search)),
      ),
      ['name'],
    ),
  );
  const selectedUsers = new SvelteMap<string, UserResponseDto>();
  let loading = $state(true);

  const handleToggle = (user: UserResponseDto) => {
    if (selectedUsers.has(user.id)) {
      selectedUsers.delete(user.id);
    } else {
      selectedUsers.set(user.id, user);
    }
  };

  const onSubmit = async () => {
    const userIds = [...selectedUsers.keys()];
    const success = await handleAddUserGroupMembers(groupId, userIds);
    if (success) {
      onClose(true);
    }
  };

  onMount(async () => {
    users = await searchUsers();
    loading = false;
  });
</script>

<FormModal
  title={$t('user_groups_add_members')}
  submitText={$t('add')}
  cancelText={$t('back')}
  {onSubmit}
  disabled={selectedUsers.size === 0}
  onClose={() => onClose()}
>
  {#if loading}
    <div class="flex w-full place-content-center place-items-center">
      <LoadingSpinner />
    </div>
  {:else}
    <Stack>
      <input
        class="border-b-4 border-immich-bg px-6 py-2 text-2xl focus:border-immich-primary dark:border-immich-dark-gray dark:focus:border-immich-dark-primary"
        placeholder={$t('search')}
        bind:value={search}
        use:initInput
      />
      {#each filteredUsers as user (user.id)}
        <ListButton selected={selectedUsers.has(user.id)} onclick={() => handleToggle(user)}>
          <UserAvatar {user} size="md" />
          <div class="grow text-start">
            <Text fontWeight="medium">{user.name}</Text>
            <Text size="tiny" color="muted">{user.email}</Text>
          </div>
        </ListButton>
      {:else}
        <Text class="py-6 text-center">{$t('user_groups_no_members')}</Text>
      {/each}
    </Stack>
  {/if}
</FormModal>
