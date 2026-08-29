<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import AdminCard from '$lib/components/AdminCard.svelte';
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import UserAvatar from '$lib/components/shared-components/UserAvatar.svelte';
  import { Route } from '$lib/route';
  import { getUserGroupActions, handleRemoveUserGroupMember } from '$lib/services/user-group.service';
  import { getUserGroup, type UserGroupResponseDto } from '$lib/api/user-group.api';
  import { searchUsers, type UserResponseDto } from '@immich/sdk';
  import {
    Badge,
    Button,
    Code,
    CommandPaletteDefaultProvider,
    Container,
    Heading,
    IconButton,
    MenuItemType,
    Stack,
    Text,
  } from '@immich/ui';
  import { mdiAccountGroupOutline, mdiAccountMultipleOutline, mdiClose, mdiPlus } from '@mdi/js';
  import { modalManager } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { LayoutData } from './$types';
  import UserGroupAddMembersModal from '$lib/modals/UserGroupAddMembersModal.svelte';

  type Props = {
    children?: Snippet;
    data: LayoutData;
  };

  const { children, data }: Props = $props();

  let group: UserGroupResponseDto = $state(data.group);
  let allUsers: UserResponseDto[] = $state([]);

  const memberUsers = $derived(
    (group.members ?? [])
      .map((m) => {
        const user = allUsers.find((u) => u.id === m.userId);
        return user ? { ...m, user } : undefined;
      })
      .filter((m): m is NonNullable<typeof m> => !!m),
  );

  const creatorUser = $derived(allUsers.find((u) => u.id === group.createdById));

  onMount(async () => {
    allUsers = await searchUsers();
  });

  const { Update, Delete } = $derived(getUserGroupActions($t, group));

  const onUserGroupUpdate = async (updated: UserGroupResponseDto) => {
    if (updated.id === group.id) {
      group = updated;
      await invalidateAll();
    }
  };

  const onUserGroupDelete = async ({ id }: { id: string }) => {
    if (id === group.id) {
      await goto(Route.userGroups());
    }
  };

  const refreshGroup = async () => {
    group = await getUserGroup(group.id);
  };

  const handleRemoveMember = async (userId: string) => {
    const prompt = $t('user_groups_confirm_remove_member');
    const confirmed = await modalManager.showDialog({ prompt });
    if (!confirmed) {
      return;
    }

    const success = await handleRemoveUserGroupMember(group.id, userId);
    if (success) {
      await refreshGroup();
    }
  };

  const handleShowAddMembers = async () => {
    const result = await modalManager.show(UserGroupAddMembersModal, {
      groupId: group.id,
      existingMemberIds: (group.members ?? []).map((m) => m.userId),
    });

    if (result) {
      await refreshGroup();
    }
  };
</script>

<OnEvents {onUserGroupUpdate} {onUserGroupDelete} />

<CommandPaletteDefaultProvider name={$t('user_groups')} actions={[Update, Delete]} />

<AdminPageLayout
  breadcrumbs={[{ title: $t('user_groups'), href: Route.userGroups() }, { title: group.name }]}
  actions={[Update, MenuItemType.Divider, Delete]}
>
  <div>
    <Container size="large" center>
      <div class="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
        <div class="col-span-full my-4 flex items-center gap-4">
          <Heading tag="h1" size="large">{group.name}</Heading>
          <Badge color="primary" size="small">
            {$t('user_groups_member_count', { values: { count: group.members?.length ?? 0 } })}
          </Badge>
        </div>

        <AdminCard icon={mdiAccountGroupOutline} title={$t('details')}>
          <Stack gap={2}>
            <div>
              <Heading tag="h3" size="tiny">{$t('name')}</Heading>
              <Text>{group.name}</Text>
            </div>
            <div>
              <Heading tag="h3" size="tiny">{$t('user_groups_created_by')}</Heading>
              <Text>{creatorUser?.name ?? group.createdById}</Text>
            </div>
            <div>
              <Heading tag="h3" size="tiny">{$t('created_at')}</Heading>
              <Text>{new Date(group.createdAt).toLocaleString()}</Text>
            </div>
            <div>
              <Heading tag="h3" size="tiny">{$t('id')}</Heading>
              <Code>{group.id}</Code>
            </div>
          </Stack>
        </AdminCard>

        <AdminCard icon={mdiAccountMultipleOutline} title={$t('user_groups_members')}>
          <div class="flex flex-col gap-2">
            <div class="flex justify-end">
              <Button size="small" leadingIcon={mdiPlus} onclick={handleShowAddMembers}>
                {$t('user_groups_add_members')}
              </Button>
            </div>

            {#if memberUsers.length === 0}
              <Text color="muted" class="py-4 text-center">{$t('user_groups_no_members')}</Text>
            {:else}
              <Stack gap={2}>
                {#each memberUsers as member (member.userId)}
                  <div class="flex items-center justify-between rounded-lg border p-3 dark:border-gray-700">
                    <div class="flex items-center gap-3">
                      <UserAvatar user={member.user} size="sm" />
                      <div>
                        <Text fontWeight="medium">{member.user.name}</Text>
                        <Text size="tiny" color="muted">{member.user.email}</Text>
                      </div>
                    </div>
                    <IconButton
                      icon={mdiClose}
                      aria-label={$t('remove')}
                      size="small"
                      color="danger"
                      onclick={() => handleRemoveMember(member.userId)}
                    />
                  </div>
                {/each}
              </Stack>
            {/if}
          </div>
        </AdminCard>
      </div>

      {@render children?.()}
    </Container>
  </div>
</AdminPageLayout>
