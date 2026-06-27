"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Link2, QrCode, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { JoinRoomForm } from "@/modules/rooms/components/join-room-form";

const features = [
  {
    icon: QrCode,
    title: "Pair Mode",
    description:
      "Scan a QR code to instantly connect two devices without login or setup.",
  },
  {
    icon: Link2,
    title: "Room Mode",
    description:
      "Create shared rooms with unique codes for teams and multi-device sync.",
  },
  {
    icon: Zap,
    title: "Real-time Sync",
    description:
      "Files, links, clipboard, and notes sync instantly across all devices.",
  },
];

export function DashboardHero() {
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-16 text-center"
      >
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Sync everything.
          <br />
          <span className="text-muted-foreground">Across every device.</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          PairDrop is a real-time platform for sharing files, links, text, and
          clipboard content between your devices — no account required.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/pair">
              <QrCode className="mr-2 h-4 w-4" />
              Create Pair Session
            </Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => setJoinOpen(true)}>
            Join Room
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent className="sm:max-w-md p-0 border-0 bg-transparent shadow-none">
          <JoinRoomForm />
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 * (i + 1) }}
          >
            <Card className="h-full border-border/50">
              <CardHeader>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="ghost" size="sm" className="px-0">
                  <Link href={feature.title === "Pair Mode" ? "/pair" : feature.title === "Room Mode" ? "/room/create" : "/room/join"}>
                    Get started
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
