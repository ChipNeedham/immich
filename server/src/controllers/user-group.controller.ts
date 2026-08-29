import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Endpoint, HistoryBuilder } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import {
  AddUserGroupMembersDto,
  CreateUserGroupDto,
  RemoveUserGroupMembersDto,
  UpdateUserGroupDto,
  UserGroupResponseDto,
} from 'src/dtos/user-group.dto';
import { ApiTag, Permission } from 'src/enum';
import { Auth, Authenticated } from 'src/middleware/auth.guard';
import { UserGroupService } from 'src/services/user-group.service';
import { UUIDv7ParamDto } from 'src/validation';

@ApiTags(ApiTag.UserGroups)
@Controller('user-groups')
export class UserGroupController {
  constructor(private service: UserGroupService) {}

  @Get()
  @Authenticated({ permission: Permission.UserGroupRead })
  @Endpoint({
    summary: 'List user groups',
    description: 'Retrieve all user groups the authenticated user belongs to.',
    history: new HistoryBuilder().added('v3.3.0'),
  })
  getAll(@Auth() auth: AuthDto): Promise<UserGroupResponseDto[]> {
    return this.service.getAll(auth);
  }

  @Get(':id')
  @Authenticated({ permission: Permission.UserGroupRead })
  @Endpoint({
    summary: 'Get a user group',
    description: 'Retrieve a user group by ID, including its members.',
    history: new HistoryBuilder().added('v3.3.0'),
  })
  get(@Auth() auth: AuthDto, @Param() { id }: UUIDv7ParamDto): Promise<UserGroupResponseDto> {
    return this.service.get(auth, id);
  }

  @Post()
  @Authenticated({ permission: Permission.UserGroupCreate })
  @Endpoint({
    summary: 'Create a user group',
    description: 'Create a new user group. The creator is automatically added as a member.',
    history: new HistoryBuilder().added('v3.3.0'),
  })
  create(@Auth() auth: AuthDto, @Body() dto: CreateUserGroupDto): Promise<UserGroupResponseDto> {
    return this.service.create(auth, dto);
  }

  @Patch(':id')
  @Authenticated({ permission: Permission.UserGroupUpdate })
  @Endpoint({
    summary: 'Update a user group',
    description: 'Update the name of a user group.',
    history: new HistoryBuilder().added('v3.3.0'),
  })
  update(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDv7ParamDto,
    @Body() dto: UpdateUserGroupDto,
  ): Promise<UserGroupResponseDto> {
    return this.service.update(auth, id, dto);
  }

  @Delete(':id')
  @Authenticated({ permission: Permission.UserGroupDelete })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Endpoint({
    summary: 'Delete a user group',
    description: 'Delete a user group. Albums owned by this group will revert ownership to the group creator.',
    history: new HistoryBuilder().added('v3.3.0'),
  })
  delete(@Auth() auth: AuthDto, @Param() { id }: UUIDv7ParamDto): Promise<void> {
    return this.service.delete(auth, id);
  }

  @Put(':id/members')
  @Authenticated({ permission: Permission.UserGroupUpdate })
  @Endpoint({
    summary: 'Add members to a user group',
    description: 'Add one or more users as members of the group.',
    history: new HistoryBuilder().added('v3.3.0'),
  })
  addMembers(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDv7ParamDto,
    @Body() dto: AddUserGroupMembersDto,
  ): Promise<UserGroupResponseDto> {
    return this.service.addMembers(auth, id, dto);
  }

  @Delete(':id/members')
  @Authenticated({ permission: Permission.UserGroupUpdate })
  @Endpoint({
    summary: 'Remove members from a user group',
    description: 'Remove one or more users from the group. Cannot remove all members.',
    history: new HistoryBuilder().added('v3.3.0'),
  })
  removeMembers(
    @Auth() auth: AuthDto,
    @Param() { id }: UUIDv7ParamDto,
    @Body() dto: RemoveUserGroupMembersDto,
  ): Promise<UserGroupResponseDto> {
    return this.service.removeMembers(auth, id, dto);
  }
}
