# Master Room Feature — Implementation Plan

## Database
- Migration `006_master_room.sql`: add "master" to room_type enum, create `master_room_participants`
- Types: update RoomType, add MasterRoomParticipant interface

## Pages & Routes
- `/master-room/[roomId]` — Master's view (QR + participant list + slide-in detail)
- `/master/join` — Join flow for participants (name input → create room → redirect)

## Master Flow
1. Dashboard → "Buat Room Master" button → create room type="master"
2. Redirect to `/master-room/[roomId]`
3. Left: QR encodes `appUrl/master/join?roomId=xxx&token=accessToken` + room code
4. Right: Real-time participant list (subscribe to `master_room_participants`)
5. Click participant → slide-in panel from right shows their files, links, clipboard

## Participant Flow
1. Scan QR → go to `/master/join?roomId=xxx&token=yyy`
2. Server: verify token via `verifyAccess(roomId, token)` → must be valid master member
3. Client: check localStorage `master_name_{roomId}` for saved name
4. No name → show input dialog → save to localStorage
5. Create new room type="public" (participant's personal room)
6. Insert `master_room_participants` linking master room → participant room
7. Redirect participant to `/workspace/[participantRoomId]`

## Participant Detail Panel (slide-in)
- Files: list with download button
- Links: list with "Buka" link
- Clipboard: list of text items (read-only)
- Refresh button
- Close/X button

## Backend Changes
- `RoomRepository`: add `addParticipant`, `getParticipants`, `removeParticipant`
- `MasterRepository`: queries for participant files, clipboard, messages
- `RoomService`: `createMasterRoom`, `joinMasterRoom`
- `Actions`: `createMasterRoomAction`, `joinMasterRoomAction`, `getMasterParticipantsAction`, `getParticipantContentAction`

## Frontend Components
- `master-room-view.tsx` — Main master layout (QR + list + panel)
- `master-join-flow.tsx` — Name input + room creation
- `participant-detail-panel.tsx` — Slide-in showing participant's shared items

## Navbar
- Add "Room Master" link to header nav (visible when logged in)
