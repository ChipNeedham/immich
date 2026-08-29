import {
  createUserGroup,
  deleteUserGroup,
  updateUserGroup,
  addUserGroupMembers,
  removeUserGroupMembers,
  type UserGroupResponseDto,
} from '$lib/api/user-group.api';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiDeleteOutline, mdiInformationOutline, mdiPencilOutline, mdiPlusBoxOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { goto } from '$app/navigation';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { Route } from '$lib/route';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';

export const getUserGroupsActions = ($t: MessageFormatter) => {
  const Create: ActionItem = {
    title: $t('user_groups_create'),
    icon: mdiPlusBoxOutline,
    onAction: () => goto(Route.newUserGroup()),
    shortcuts: { shift: true, key: 'n' },
  };

  return { Create };
};

export const getUserGroupActions = ($t: MessageFormatter, group: UserGroupResponseDto) => {
  const Detail: ActionItem = {
    icon: mdiInformationOutline,
    title: $t('details'),
    onAction: () => goto(Route.viewUserGroup(group)),
  };

  const Update: ActionItem = {
    icon: mdiPencilOutline,
    title: $t('edit'),
    onAction: () => goto(Route.editUserGroup(group)),
  };

  const Delete: ActionItem = {
    icon: mdiDeleteOutline,
    title: $t('delete'),
    color: 'danger',
    onAction: () => handleDeleteUserGroup(group),
  };

  return { Detail, Update, Delete };
};

export const handleCreateUserGroup = async (dto: { name: string; userIds?: string[] }) => {
  const $t = await getFormatter();

  try {
    const response = await createUserGroup(dto);
    eventManager.emit('UserGroupCreate', response);
    toastManager.primary();
    return response;
  } catch (error) {
    handleError(error, $t('user_groups_unable_to_create'));
  }
};

export const handleUpdateUserGroup = async (group: UserGroupResponseDto, dto: { name?: string }) => {
  const $t = await getFormatter();

  try {
    const response = await updateUserGroup(group.id, dto);
    eventManager.emit('UserGroupUpdate', response);
    toastManager.primary();
    return true;
  } catch (error) {
    handleError(error, $t('user_groups_unable_to_update'));
    return false;
  }
};

export const handleDeleteUserGroup = async (group: UserGroupResponseDto) => {
  const $t = await getFormatter();
  const prompt = $t('user_groups_confirm_delete', { values: { name: group.name } });
  const success = await modalManager.showDialog({ prompt });
  if (!success) {
    return;
  }

  try {
    await deleteUserGroup(group.id);
    eventManager.emit('UserGroupDelete', { id: group.id });
    toastManager.primary();
    return true;
  } catch (error) {
    handleError(error, $t('user_groups_unable_to_delete'));
  }
};

export const handleAddUserGroupMembers = async (groupId: string, userIds: string[]) => {
  const $t = await getFormatter();

  try {
    await addUserGroupMembers(groupId, { userIds });
    toastManager.primary();
    return true;
  } catch (error) {
    handleError(error, $t('user_groups_unable_to_add_members'));
    return false;
  }
};

export const handleRemoveUserGroupMember = async (groupId: string, userId: string) => {
  const $t = await getFormatter();

  try {
    await removeUserGroupMembers(groupId, { userIds: [userId] });
    toastManager.primary();
    return true;
  } catch (error) {
    handleError(error, $t('user_groups_unable_to_remove_member'));
    return false;
  }
};
