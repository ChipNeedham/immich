<script lang="ts">
  import { goto } from '$app/navigation';
  import { Route } from '$lib/route';
  import { handleCreateUserGroup } from '$lib/services/user-group.service';
  import { Field, FormModal, Input, Stack } from '@immich/ui';
  import { t } from 'svelte-i18n';

  let name = $state('');
  let isCreating = $state(false);

  const valid = $derived(name.trim().length > 0 && !isCreating);

  const onClose = async () => {
    await goto(Route.userGroups());
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    if (!valid) {
      return;
    }

    isCreating = true;

    const group = await handleCreateUserGroup({ name: name.trim() });

    if (group) {
      await goto(Route.viewUserGroup(group), { replaceState: true });
    }

    isCreating = false;
  };
</script>

<FormModal title={$t('user_groups_create')} size="small" disabled={!valid} submitText={$t('create')} {onClose} {onSubmit}>
  <Stack gap={4}>
    <Field label={$t('user_groups_name')} required>
      <Input bind:value={name} />
    </Field>
  </Stack>
</FormModal>
