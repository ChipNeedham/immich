import { Selectable } from 'kysely';
import { createZodDto } from 'nestjs-zod';
import { UserGroupMemberTable } from 'src/schema/tables/user-group-member.table';
import { UserGroupTable } from 'src/schema/tables/user-group.table';
import { isoDatetimeToDate } from 'src/validation';
import z from 'zod';

const CreateUserGroupSchema = z
  .object({
    name: z.string().min(1).max(255).describe('Name of the user group'),
    userIds: z.array(z.uuidv4()).optional().describe('Initial member user IDs (creator is added automatically)'),
  })
  .meta({ id: 'CreateUserGroupDto' });

const UpdateUserGroupSchema = z
  .object({
    name: z.string().min(1).max(255).optional().describe('New name for the user group'),
  })
  .meta({ id: 'UpdateUserGroupDto' });

const AddUserGroupMembersSchema = z
  .object({
    userIds: z.array(z.uuidv4()).min(1).describe('User IDs to add to the group'),
  })
  .meta({ id: 'AddUserGroupMembersDto' });

const RemoveUserGroupMembersSchema = z
  .object({
    userIds: z.array(z.uuidv4()).min(1).describe('User IDs to remove from the group'),
  })
  .meta({ id: 'RemoveUserGroupMembersDto' });

const UserGroupMemberResponseSchema = z
  .object({
    userId: z.uuidv4(),
    groupId: z.uuidv4(),
    createdAt: isoDatetimeToDate,
  })
  .meta({ id: 'UserGroupMemberResponseDto' });

const UserGroupResponseSchema = z
  .object({
    id: z.uuidv4(),
    name: z.string(),
    createdById: z.uuidv4(),
    createdAt: isoDatetimeToDate,
    updatedAt: isoDatetimeToDate,
    members: z.array(UserGroupMemberResponseSchema).optional(),
  })
  .meta({ id: 'UserGroupResponseDto' });

const TransferAlbumOwnershipSchema = z
  .object({
    groupId: z.uuidv7().optional().describe('Transfer ownership to this user group'),
    userId: z.uuidv4().optional().describe('Transfer ownership to this user'),
  })
  .refine((data) => (data.groupId ? !data.userId : !!data.userId), {
    message: 'Exactly one of groupId or userId must be provided',
  })
  .meta({ id: 'TransferAlbumOwnershipDto' });

export class CreateUserGroupDto extends createZodDto(CreateUserGroupSchema) {}
export class UpdateUserGroupDto extends createZodDto(UpdateUserGroupSchema) {}
export class AddUserGroupMembersDto extends createZodDto(AddUserGroupMembersSchema) {}
export class RemoveUserGroupMembersDto extends createZodDto(RemoveUserGroupMembersSchema) {}
export class UserGroupResponseDto extends createZodDto(UserGroupResponseSchema) {}
export class UserGroupMemberResponseDto extends createZodDto(UserGroupMemberResponseSchema) {}
export class TransferAlbumOwnershipDto extends createZodDto(TransferAlbumOwnershipSchema) {}

export type UserGroupRow = Selectable<UserGroupTable>;
export type UserGroupMemberRow = Selectable<UserGroupMemberTable>;

export function mapUserGroup(group: UserGroupRow, members?: UserGroupMemberRow[]): UserGroupResponseDto {
  return {
    id: group.id,
    name: group.name,
    createdById: group.createdById,
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
    members: members?.map((m) => ({
      userId: m.userId,
      groupId: m.groupId,
      createdAt: m.createdAt,
    })),
  };
}
