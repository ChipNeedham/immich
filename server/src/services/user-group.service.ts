import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AddUserGroupMembersDto,
  CreateUserGroupDto,
  mapUserGroup,
  RemoveUserGroupMembersDto,
  UpdateUserGroupDto,
  UserGroupResponseDto,
} from 'src/dtos/user-group.dto';
import { Permission } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { findOrFail } from 'src/utils/misc';

@Injectable()
export class UserGroupService extends BaseService {
  async getAll(auth: AuthDto): Promise<UserGroupResponseDto[]> {
    const groups = await this.userGroupRepository.getByUserId(auth.user.id);
    const result: UserGroupResponseDto[] = [];
    for (const group of groups) {
      const members = await this.userGroupRepository.getMembers(group.id);
      result.push(mapUserGroup(group, members));
    }
    return result;
  }

  async get(auth: AuthDto, id: string): Promise<UserGroupResponseDto> {
    await this.requireAccess({ auth, permission: Permission.UserGroupRead, ids: [id] });
    const group = await findOrFail(() => this.userGroupRepository.get(id), 'User group');
    const members = await this.userGroupRepository.getMembers(id);
    return mapUserGroup(group, members);
  }

  async create(auth: AuthDto, dto: CreateUserGroupDto): Promise<UserGroupResponseDto> {
    for (const userId of dto.userIds || []) {
      if (userId === auth.user.id) {
        continue;
      }
      const exists = await this.userRepository.get(userId, {});
      if (!exists) {
        throw new BadRequestException('Invalid user');
      }
    }

    const group = await this.userGroupRepository.create({
      name: dto.name,
      createdById: auth.user.id,
    });

    const memberUserIds = new Set([auth.user.id, ...(dto.userIds || [])]);
    const memberRows = [...memberUserIds].map((userId) => ({ groupId: group.id, userId }));
    const members = await this.userGroupRepository.addMembers(memberRows);

    return mapUserGroup(group, members);
  }

  async update(auth: AuthDto, id: string, dto: UpdateUserGroupDto): Promise<UserGroupResponseDto> {
    await this.requireAccess({ auth, permission: Permission.UserGroupUpdate, ids: [id] });
    const group = await this.userGroupRepository.update(id, { name: dto.name });
    const members = await this.userGroupRepository.getMembers(id);
    return mapUserGroup(group, members);
  }

  async delete(auth: AuthDto, id: string): Promise<void> {
    await this.requireAccess({ auth, permission: Permission.UserGroupDelete, ids: [id] });
    await this.userGroupRepository.delete(id);
  }

  async addMembers(auth: AuthDto, id: string, dto: AddUserGroupMembersDto): Promise<UserGroupResponseDto> {
    await this.requireAccess({ auth, permission: Permission.UserGroupUpdate, ids: [id] });

    for (const userId of dto.userIds) {
      const exists = await this.userRepository.get(userId, {});
      if (!exists) {
        throw new BadRequestException('Invalid user');
      }
    }

    const memberRows = dto.userIds.map((userId) => ({ groupId: id, userId }));
    await this.userGroupRepository.addMembers(memberRows);

    const group = await findOrFail(() => this.userGroupRepository.get(id), 'User group');
    const members = await this.userGroupRepository.getMembers(id);
    return mapUserGroup(group, members);
  }

  async removeMembers(auth: AuthDto, id: string, dto: RemoveUserGroupMembersDto): Promise<UserGroupResponseDto> {
    await this.requireAccess({ auth, permission: Permission.UserGroupUpdate, ids: [id] });

    const members = await this.userGroupRepository.getMembers(id);
    const remainingCount = members.filter((m) => !dto.userIds.includes(m.userId)).length;
    if (remainingCount === 0) {
      throw new BadRequestException('Cannot remove all members from a group');
    }

    await this.userGroupRepository.removeMembers(id, dto.userIds);

    const group = await findOrFail(() => this.userGroupRepository.get(id), 'User group');
    const updatedMembers = await this.userGroupRepository.getMembers(id);
    return mapUserGroup(group, updatedMembers);
  }
}
