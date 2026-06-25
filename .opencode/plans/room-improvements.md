# Room Improvements Plan

## 1. Migration: `supabase/migrations/005_password_verify.sql`
```sql
ALTER TABLE room_members ADD COLUMN password_verified_at TIMESTAMPTZ;
ALTER TABLE room_settings ADD COLUMN password_updated_at TIMESTAMPTZ DEFAULT NOW();
UPDATE room_settings SET password_updated_at = updated_at WHERE has_password = true;
```

## 2. Types: `src/types/index.ts`
- `RoomMember`: add `password_verified_at: string | null`
- `RoomSettings`: add `password_updated_at: string`

## 3. RoomRepository: `src/repositories/room.repository.ts`
Add:
```ts
async updateMemberPasswordVerified(memberId: string) {
  await this.supabase
    .from("room_members")
    .update({ password_verified_at: new Date().toISOString() })
    .eq("id", memberId);
}
```

## 4. RoomService: `src/services/room.service.ts`
`joinRoom(code, device, password?)` revised:
- Get room settings (has_password, room_password, password_updated_at)
- If has_password && !is_host:
  - Existing member with `password_verified_at >= password_updated_at` → skip (remembered)
  - No/existing but expired → if password matches → updateMemberPasswordVerified, proceed
  - No match → throw "Kata sandi room diperlukan"
  - Host → always skip

## 5. Actions: `src/actions/index.ts`
- `joinRoomSchema` add `password: z.string().optional()`
- `joinRoomAction` pass password to service, catch needsPassword → `{ success: false, needsPassword: true, error: "..." }`
- `updateRoomPasswordAction` update `password_updated_at: new Date().toISOString()`

## 6. JoinRoomForm: `src/modules/rooms/components/join-room-form.tsx`
- Add `passwordDialog` state for `{ code: string } | null`
- Add `passwordInput` state
- On joinRoomAction returning needsPassword → open password dialog
- Retry with password on submit
- Add `Lock` icon to Dialog

## 7. Dashboard: `src/modules/dashboard/components/user-dashboard.tsx`
- Extract `doJoinRoom(code, password?)` from handleJoinRoom
- `handleJoinRoom` calls `doJoinRoom(joinCode)`
- `handleDashboardQRScan` calls `doJoinRoom(code)` directly → auto-join
- Add password dialog (same pattern as JoinRoomForm)
- Change `<Header />` to `<Header showNav={false} />`
- Add pair session token handling to QR handler

## 8. Build verify
`npm run build` → 0 errors, 0 warnings
