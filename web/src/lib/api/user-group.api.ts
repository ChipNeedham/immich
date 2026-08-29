import { defaults, getBaseUrl } from '@immich/sdk';

export interface UserGroupMemberResponseDto {
  userId: string;
  groupId: string;
  createdAt: string;
}

export interface UserGroupResponseDto {
  id: string;
  name: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  members?: UserGroupMemberResponseDto[];
}

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const fetchImpl = defaults.fetch ?? fetch;
  const baseUrl = getBaseUrl();
  const response = await fetchImpl(`${baseUrl}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ message: response.statusText }));
    const error = new Error(data.message || response.statusText);
    Object.assign(error, { status: response.status, data });
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
};

export const getUserGroups = (): Promise<UserGroupResponseDto[]> => request('/user-groups');

export const getUserGroup = (id: string): Promise<UserGroupResponseDto> => request(`/user-groups/${id}`);

export const createUserGroup = (dto: { name: string; userIds?: string[] }): Promise<UserGroupResponseDto> =>
  request('/user-groups', { method: 'POST', body: JSON.stringify(dto) });

export const updateUserGroup = (id: string, dto: { name?: string }): Promise<UserGroupResponseDto> =>
  request(`/user-groups/${id}`, { method: 'PATCH', body: JSON.stringify(dto) });

export const deleteUserGroup = (id: string): Promise<void> => request(`/user-groups/${id}`, { method: 'DELETE' });

export const addUserGroupMembers = (id: string, dto: { userIds: string[] }): Promise<UserGroupResponseDto> =>
  request(`/user-groups/${id}/members`, { method: 'PUT', body: JSON.stringify(dto) });

export const removeUserGroupMembers = (id: string, dto: { userIds: string[] }): Promise<UserGroupResponseDto> =>
  request(`/user-groups/${id}/members`, { method: 'DELETE', body: JSON.stringify(dto) });

export const transferAlbumOwnership = (
  albumId: string,
  dto: { groupId?: string; userId?: string },
): Promise<void> => request(`/albums/${albumId}/transfer-ownership`, { method: 'POST', body: JSON.stringify(dto) });
