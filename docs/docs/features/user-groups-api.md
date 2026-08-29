# User Groups & Ownership Transfer API

## Overview

User Groups allow multiple Immich users to share ownership of albums. When a group owns an album, all group members have full owner-level access (create, read, update, delete, share, add/remove assets).

Ownership transfer allows moving album ownership from one user to another user or to a user group.

## Data Model

### Tables

- **`user_group`** — A named group of users
  - `id` (uuid, PK)
  - `name` (varchar, required)
  - `createdById` (uuid, FK → user, cascade delete)
  - `createdAt`, `updatedAt`, `updateId`

- **`user_group_member`** — Join table linking users to groups
  - `groupId` (uuid, FK → user_group, cascade delete, PK)
  - `userId` (uuid, FK → user, cascade delete, PK)
  - `createdAt`

- **`album.ownerGroupId`** — Nullable FK on album table pointing to `user_group`
  - When set, the group owns the album and all group members get owner access
  - When null, ownership follows the existing `album_user` role=owner model
  - ON DELETE SET NULL (if group is deleted, album reverts to needing a user owner)

### Ownership Rules

1. An album is owned by either a single user (via `album_user` with `role='owner'`) OR a user group (via `album.ownerGroupId`). Never both simultaneously.
2. When transferring to a group: the existing user owner row is removed from `album_user`, and `ownerGroupId` is set.
3. When transferring from a group to a user: `ownerGroupId` is cleared, and the user gets `role='owner'` in `album_user`.
4. The `album_user_delete` trigger skips album deletion when `ownerGroupId` is set (group-owned albums survive having no user owner row).

### Access Control

Group ownership is checked at the same priority level as individual ownership in all album permission checks:

| Permission | Individual Owner | Group Owner | Shared User |
|---|---|---|---|
| AlbumRead | ✓ | ✓ | ✓ (viewer+) |
| AlbumUpdate | ✓ | ✓ | ✓ (editor) |
| AlbumDelete | ✓ | ✓ | ✗ |
| AlbumShare | ✓ | ✓ | ✓ (editor) |
| AlbumDownload | ✓ | ✓ | ✓ (viewer+) |
| AlbumAssetCreate | ✓ | ✓ | ✓ (editor) |
| AlbumAssetDelete | ✓ | ✓ | ✓ (editor) |
| AlbumTransferOwnership | ✓ | ✓ | ✗ |

## API Endpoints

### User Groups

All endpoints require authentication.

#### `GET /user-groups`
List all user groups the authenticated user belongs to.

**Response:** `UserGroupResponseDto[]`

#### `GET /user-groups/:id`
Get a user group by ID, including members.

**Permission:** Must be a member of the group.

**Response:** `UserGroupResponseDto`

#### `POST /user-groups`
Create a new user group. The creator is automatically added as a member.

**Body:**
```json
{
  "name": "Family",
  "userIds": ["uuid-1", "uuid-2"]  // optional initial members
}
```

**Response:** `UserGroupResponseDto`

#### `PATCH /user-groups/:id`
Update a user group's name.

**Permission:** Must be the group creator.

**Body:**
```json
{
  "name": "New Name"
}
```

**Response:** `UserGroupResponseDto`

#### `DELETE /user-groups/:id`
Delete a user group.

**Permission:** Must be the group creator.

**Response:** 204 No Content

#### `PUT /user-groups/:id/members`
Add members to a user group.

**Permission:** Must be the group creator.

**Body:**
```json
{
  "userIds": ["uuid-1", "uuid-2"]
}
```

**Response:** `UserGroupResponseDto`

#### `DELETE /user-groups/:id/members`
Remove members from a user group. Cannot remove all members.

**Permission:** Must be the group creator.

**Body:**
```json
{
  "userIds": ["uuid-1"]
}
```

**Response:** `UserGroupResponseDto`

### Ownership Transfer

#### `POST /albums/:id/transfer-ownership`
Transfer ownership of an album to another user or a user group.

**Permission:** Must be the current owner (individual or group member).

**Body (transfer to group):**
```json
{
  "groupId": "uuid-of-group"
}
```

**Body (transfer to user):**
```json
{
  "userId": "uuid-of-user"
}
```

**Response:** `AlbumResponseDto` (includes `ownerGroupId` field)

## Response DTOs

### UserGroupResponseDto
```json
{
  "id": "uuid",
  "name": "Family",
  "createdById": "uuid",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "members": [
    {
      "userId": "uuid",
      "groupId": "uuid",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### AlbumResponseDto (updated)
The existing `AlbumResponseDto` now includes:
```json
{
  "ownerGroupId": "uuid-or-null",
  ...existingFields
}
```

## Web UI

The admin panel includes a **User Groups** management page at `/admin/user-groups`.

### Pages

- **List** (`/admin/user-groups`) — Table of all user groups with member count and context menu actions
- **Create** (`/admin/user-groups/new`) — Modal form to create a new group
- **Detail** (`/admin/user-groups/:id`) — Group details, member list with add/remove functionality
- **Edit** (`/admin/user-groups/:id/edit`) — Modal form to rename a group

### Navigation

- Admin sidebar: "User Groups" link with group icon
- Command palette: searchable "User Groups" entry

### API Client

Since the SDK is auto-generated and needs a running server, the web UI uses a manual API client at `web/src/lib/api/user-group.api.ts` that calls the backend endpoints directly using the SDK's configured fetch.

## Files Changed

### New files — Server (isolated from upstream)
- `server/src/schema/tables/user-group.table.ts`
- `server/src/schema/tables/user-group-member.table.ts`
- `server/src/schema/migrations/1788000000000-UserGroups.ts`
- `server/src/repositories/user-group.repository.ts`
- `server/src/services/user-group.service.ts`
- `server/src/controllers/user-group.controller.ts`
- `server/src/dtos/user-group.dto.ts`

### New files — Web UI
- `web/src/lib/api/user-group.api.ts` — Manual API client for user group endpoints
- `web/src/lib/services/user-group.service.ts` — Service with actions and CRUD handlers
- `web/src/lib/modals/UserGroupAddMembersModal.svelte` — Modal for adding members to a group
- `web/src/routes/admin/user-groups/(list)/+layout.ts` — List data loader
- `web/src/routes/admin/user-groups/(list)/+layout.svelte` — List page with table
- `web/src/routes/admin/user-groups/(list)/+page.svelte` — Empty (list rendered by layout)
- `web/src/routes/admin/user-groups/(list)/+page.ts` — Auth guard
- `web/src/routes/admin/user-groups/(list)/new/+page.ts` — Auth guard
- `web/src/routes/admin/user-groups/(list)/new/+page.svelte` — Create group form modal
- `web/src/routes/admin/user-groups/[id]/+layout.ts` — Detail data loader
- `web/src/routes/admin/user-groups/[id]/+layout.svelte` — Detail page with member management
- `web/src/routes/admin/user-groups/[id]/+page.svelte` — Empty (detail rendered by layout)
- `web/src/routes/admin/user-groups/[id]/+page.ts` — Auth guard
- `web/src/routes/admin/user-groups/[id]/edit/+page.ts` — Auth guard
- `web/src/routes/admin/user-groups/[id]/edit/+page.svelte` — Edit group name form modal

### Modified files — Server (minimal, targeted edits)
- `server/src/schema/tables/album.table.ts` — Added `ownerGroupId` column
- `server/src/schema/index.ts` — Registered new tables
- `server/src/schema/functions.ts` — Updated `album_user_delete` trigger to respect group ownership
- `server/src/enum.ts` — Added `Permission.UserGroup*`, `Permission.AlbumTransferOwnership`, `ApiTag.UserGroups`
- `server/src/repositories/access.repository.ts` — Added `UserGroupAccess` class, `AlbumAccess.checkGroupOwnerAccess`
- `server/src/utils/access.ts` — Wired group ownership into all album permission checks
- `server/src/services/base.service.ts` — Registered `UserGroupRepository`
- `server/src/services/album.service.ts` — Added `transferOwnership` method
- `server/src/controllers/album.controller.ts` — Added transfer-ownership endpoint
- `server/src/dtos/album.dto.ts` — Added `ownerGroupId` to response DTO
- `server/src/controllers/index.ts` — Registered `UserGroupController`
- `server/src/services/index.ts` — Registered `UserGroupService`

### Modified files — Web UI
- `web/src/lib/route.ts` — Added `userGroups`, `newUserGroup`, `viewUserGroup`, `editUserGroup` routes
- `web/src/lib/managers/event-manager.svelte.ts` — Added `UserGroupCreate`, `UserGroupUpdate`, `UserGroupDelete` events
- `web/src/lib/components/layouts/AdminPageLayout.svelte` — Added "User Groups" sidebar link
- `web/src/lib/commands.ts` — Added "User Groups" to command palette
- `i18n/en.json` — Added user group translation strings
