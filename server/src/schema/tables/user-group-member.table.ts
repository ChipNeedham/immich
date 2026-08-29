import {
  CreateDateColumn,
  ForeignKeyColumn,
  Generated,
  Table,
  Timestamp,
} from '@immich/sql-tools';
import { UserGroupTable } from 'src/schema/tables/user-group.table';
import { UserTable } from 'src/schema/tables/user.table';

@Table('user_group_member')
export class UserGroupMemberTable {
  @ForeignKeyColumn(() => UserGroupTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
  })
  groupId!: string;

  @ForeignKeyColumn(() => UserTable, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: false,
    primary: true,
  })
  userId!: string;

  @CreateDateColumn()
  createdAt!: Generated<Timestamp>;
}
