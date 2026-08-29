<script lang="ts">
  import { getUserGroups, transferAlbumOwnership, type UserGroupResponseDto } from '$lib/api/user-group.api';
  import { handleError } from '$lib/utils/handle-error';
  import { Modal, ModalBody, Button, Stack, Text } from '@immich/ui';
  import { toastManager } from '@immich/ui';
  import { mdiAccountGroup } from '@mdi/js';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type Props = {
    albumId: string;
    albumName: string;
    onClose: (transferred?: boolean) => void;
  };

  const { albumId, albumName, onClose }: Props = $props();

  let groups: UserGroupResponseDto[] = $state([]);
  let selectedGroupId: string | undefined = $state(undefined);
  let loading = $state(true);
  let submitting = $state(false);

  onMount(async () => {
    try {
      groups = await getUserGroups();
    } catch (error) {
      handleError(error, $t('user_groups_unable_to_load'));
    } finally {
      loading = false;
    }
  });

  const handleTransfer = async () => {
    if (!selectedGroupId) {
      return;
    }

    submitting = true;
    try {
      await transferAlbumOwnership(albumId, { groupId: selectedGroupId });
      toastManager.primary($t('album_ownership_transferred'));
      onClose(true);
    } catch (error) {
      handleError(error, $t('album_ownership_transfer_failed'));
    } finally {
      submitting = false;
    }
  };
</script>

<Modal title={$t('transfer_ownership')} {onClose} size="small">
  <ModalBody>
    <Stack gap={4}>
      <Text size="small" color="muted">
        {$t('transfer_ownership_description', { values: { album: albumName } })}
      </Text>

      {#if loading}
        <Text size="small" color="muted" class="py-4 text-center">{$t('loading')}</Text>
      {:else if groups.length === 0}
        <Text size="small" color="muted" class="py-4 text-center">{$t('user_groups_no_groups')}</Text>
      {:else}
        <div class="flex flex-col gap-2">
          {#each groups as group (group.id)}
            <button
              type="button"
              class="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors
                {selectedGroupId === group.id
                ? 'border-primary bg-primary/10 dark:border-primary dark:bg-primary/20'
                : 'border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'}"
              onclick={() => (selectedGroupId = group.id)}
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

      <div class="flex justify-end gap-2">
        <Button variant="outline" onclick={() => onClose()}>{$t('cancel')}</Button>
        <Button
          color="primary"
          onclick={handleTransfer}
          disabled={!selectedGroupId || submitting}
        >
          {$t('transfer')}
        </Button>
      </div>
    </Stack>
  </ModalBody>
</Modal>
