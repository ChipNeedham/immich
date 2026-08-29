import { Injectable } from '@nestjs/common';
import { Kysely } from 'kysely';
import { InjectKysely } from 'nestjs-kysely';
import { DummyValue, GenerateSql } from 'src/decorators';
import { DB } from 'src/schema';

@Injectable()
export class UserGroupRepository {
  constructor(@InjectKysely() private db: Kysely<DB>) {}

  @GenerateSql({ params: [{ name: 'Family', createdById: DummyValue.UUID }] })
  create(data: { name: string; createdById: string }) {
    return this.db
      .insertInto('user_group')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  get(id: string) {
    return this.db
      .selectFrom('user_group')
      .selectAll()
      .where('user_group.id', '=', id)
      .executeTakeFirst();
  }

  @GenerateSql()
  getAll() {
    return this.db
      .selectFrom('user_group')
      .selectAll('user_group')
      .orderBy('user_group.name', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getByUserId(userId: string) {
    return this.db
      .selectFrom('user_group')
      .selectAll('user_group')
      .innerJoin('user_group_member', 'user_group_member.groupId', 'user_group.id')
      .where('user_group_member.userId', '=', userId)
      .orderBy('user_group.name', 'asc')
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, { name: 'Updated Name' }] })
  update(id: string, data: { name?: string }) {
    return this.db
      .updateTable('user_group')
      .set(data)
      .where('user_group.id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  async delete(id: string): Promise<void> {
    await this.db
      .deleteFrom('user_group')
      .where('user_group.id', '=', id)
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID] })
  getMembers(groupId: string) {
    return this.db
      .selectFrom('user_group_member')
      .selectAll()
      .where('user_group_member.groupId', '=', groupId)
      .orderBy('user_group_member.createdAt', 'asc')
      .execute();
  }

  @GenerateSql({ params: [[{ groupId: DummyValue.UUID, userId: DummyValue.UUID }]] })
  addMembers(members: Array<{ groupId: string; userId: string }>) {
    return this.db
      .insertInto('user_group_member')
      .values(members)
      .onConflict((oc) => oc.columns(['groupId', 'userId']).doNothing())
      .returningAll()
      .execute();
  }

  @GenerateSql({ params: [DummyValue.UUID, [DummyValue.UUID]] })
  async removeMembers(groupId: string, userIds: string[]): Promise<void> {
    await this.db
      .deleteFrom('user_group_member')
      .where('user_group_member.groupId', '=', groupId)
      .where('user_group_member.userId', 'in', userIds)
      .execute();
  }
}
