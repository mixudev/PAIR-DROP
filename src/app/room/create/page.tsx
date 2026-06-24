import type { Metadata } from "next";
import { Header } from "@/components/layouts/header";
import { CreateRoomForm } from "@/modules/rooms/components/create-room-form";

export const metadata: Metadata = {
  title: "Create Room",
  description: "Create a shared room for real-time sync",
};

export default function CreateRoomPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <CreateRoomForm />
      </main>
    </div>
  );
}
