<script lang="ts">
  import { goto } from '$app/navigation';
  import { Route } from '$lib/route';
  import { handleUpdateUserGroup } from '$lib/services/user-group.service';
  import { Field, FormModal, Input } from '@immich/ui';
  import { mdiPencilOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();

  const group = $derived(data.group);
  let name = $derived(group.name);

  const onClose = async () => {
    await goto(Route.viewUserGroup(group));
  };

  const onSubmit = async (event: Event) => {
    event.preventDefault();

    const success = await handleUpdateUserGroup(group, { name: name.trim() });

    if (success) {
      await onClose();
    }
  };
</script>

<FormModal title={$t('user_groups_edit')} size="small" icon={mdiPencilOutline} {onClose} {onSubmit}>
  <Field label={$t('user_groups_name')} required>
    <Input bind:value={name} />
  </Field>
</FormModal>
