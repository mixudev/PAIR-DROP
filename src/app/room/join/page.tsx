import type { Metadata } from "next";
import { Header } from "@/components/layouts/header";
import { JoinRoomForm } from "@/modules/rooms/components/join-room-form";

export const metadata: Metadata = {
  title: "Join Room",
  description: "Join a room with a code or scan QR",
};

export default function JoinRoomPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <JoinRoomForm />
      </main>
    </div>
  );
}
