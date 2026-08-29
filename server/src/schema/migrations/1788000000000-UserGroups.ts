import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE TABLE "user_group" (
      "id" uuid DEFAULT immich_uuid_v7() NOT NULL,
      "name" character varying NOT NULL,
      "createdById" uuid NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updateId" uuid DEFAULT immich_uuid_v7() NOT NULL,
      CONSTRAINT "PK_user_group" PRIMARY KEY ("id"),
      CONSTRAINT "FK_user_group_createdById" FOREIGN KEY ("createdById")
        REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `.execute(db);

  await sql`CREATE INDEX "IDX_user_group_updateId" ON "user_group" ("updateId");`.execute(db);

  await sql`
    CREATE TABLE "user_group_member" (
      "groupId" uuid NOT NULL,
      "userId" uuid NOT NULL,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      CONSTRAINT "PK_user_group_member" PRIMARY KEY ("groupId", "userId"),
      CONSTRAINT "FK_user_group_member_groupId" FOREIGN KEY ("groupId")
        REFERENCES "user_group"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "FK_user_group_member_userId" FOREIGN KEY ("userId")
        REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `.execute(db);

  await sql`
    ALTER TABLE "album" ADD COLUMN "ownerGroupId" uuid;
  `.execute(db);

  await sql`
    ALTER TABLE "album"
      ADD CONSTRAINT "FK_album_ownerGroupId" FOREIGN KEY ("ownerGroupId")
      REFERENCES "user_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  `.execute(db);

  await sql`CREATE INDEX "IDX_album_ownerGroupId" ON "album" ("ownerGroupId") WHERE "ownerGroupId" IS NOT NULL;`.execute(db);

  await sql`
    CREATE TRIGGER "user_group_updatedAt"
    BEFORE UPDATE ON "user_group"
    FOR EACH ROW
    EXECUTE FUNCTION updated_at();
  `.execute(db);

  await sql`
    CREATE OR REPLACE FUNCTION album_user_delete()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS $$
      BEGIN
        DELETE FROM "album"
        WHERE "album"."id" = OLD."albumId"
        AND "album"."ownerGroupId" IS NULL
        AND NOT EXISTS (SELECT "albumId" FROM "album_user" WHERE "album_user"."albumId" = "album"."id" AND "album_user"."role" = 'owner');

        RETURN NULL;
      END
    $$;
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`
    CREATE OR REPLACE FUNCTION album_user_delete()
    RETURNS TRIGGER
    LANGUAGE PLPGSQL
    AS $$
      BEGIN
        DELETE FROM "album"
        WHERE "album"."id" = OLD."albumId"
        AND NOT EXISTS (SELECT "albumId" FROM "album_user" WHERE "album_user"."albumId" = "album"."id" AND "album_user"."role" = 'owner');

        RETURN NULL;
      END
    $$;
  `.execute(db);

  await sql`ALTER TABLE "album" DROP CONSTRAINT IF EXISTS "FK_album_ownerGroupId";`.execute(db);
  await sql`DROP INDEX IF EXISTS "IDX_album_ownerGroupId";`.execute(db);
  await sql`ALTER TABLE "album" DROP COLUMN IF EXISTS "ownerGroupId";`.execute(db);
  await sql`DROP TABLE IF EXISTS "user_group_member";`.execute(db);
  await sql`DROP TABLE IF EXISTS "user_group";`.execute(db);
}
