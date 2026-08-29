<script lang="ts">
  import AdminPageLayout from '$lib/components/layouts/AdminPageLayout.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import { Route } from '$lib/route';
  import { getUserGroupActions, getUserGroupsActions } from '$lib/services/user-group.service';
  import { getUserGroups, type UserGroupResponseDto } from '$lib/api/user-group.api';
  import {
    CommandPaletteDefaultProvider,
    Container,
    ContextMenuButton,
    Link,
    MenuItemType,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableHeading,
    TableRow,
    Text,
  } from '@immich/ui';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { LayoutData } from './$types';

  type Props = {
    children?: Snippet;
    data: LayoutData;
  };

  let { children, data }: Props = $props();

  let groups: UserGroupResponseDto[] = $state(data.groups);

  const onUserGroupCreate = async () => {
    groups = await getUserGroups();
  };

  const onUserGroupUpdate = async () => {
    groups = await getUserGroups();
  };

  const onUserGroupDelete = ({ id }: { id: string }) => {
    groups = groups.filter((g) => g.id !== id);
  };

  const { Create } = $derived(getUserGroupsActions($t));

  const getActionsForGroup = (group: UserGroupResponseDto) => {
    const { Detail, Update, Delete } = getUserGroupActions($t, group);
    return [Detail, Update, MenuItemType.Divider, Delete];
  };

  const classes = {
    column1: 'w-6/12 md:w-5/12',
    column2: 'hidden md:block md:w-3/12',
    column3: 'w-6/12 md:w-4/12 flex justify-end',
  };
</script>

<OnEvents {onUserGroupCreate} {onUserGroupUpdate} {onUserGroupDelete} />

<CommandPaletteDefaultProvider name={$t('user_groups')} actions={[Create]} />

<AdminPageLayout breadcrumbs={[{ title: data.meta.title }]} actions={[Create]}>
  <Container center size="large">
    {#if groups.length === 0}
      <Text class="mt-8 text-center" color="muted">{$t('user_groups_no_groups')}</Text>
    {:else}
      <Table class="mt-4" striped spacing="small" size="small">
        <TableHeader>
          <TableHeading class={classes.column1}>{$t('name')}</TableHeading>
          <TableHeading class={classes.column2}>{$t('user_groups_members')}</TableHeading>
        </TableHeader>

        <TableBody>
          {#each groups as group (group.id)}
            <TableRow>
              <TableCell class={classes.column1}>
                <Link href={Route.viewUserGroup(group)}>{group.name}</Link>
              </TableCell>
              <TableCell class={classes.column2}>
                {$t('user_groups_member_count', { values: { count: group.members?.length ?? 0 } })}
              </TableCell>
              <TableCell class={classes.column3}>
                <ContextMenuButton color="primary" aria-label={$t('open')} items={getActionsForGroup(group)} />
              </TableCell>
            </TableRow>
          {/each}
        </TableBody>
      </Table>
    {/if}

    {@render children?.()}
  </Container>
</AdminPageLayout>
