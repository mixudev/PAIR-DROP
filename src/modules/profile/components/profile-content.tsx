"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, LogOut, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/providers/auth-provider";
import { useDeviceStore } from "@/stores";
import { createClient } from "@/lib/supabase/client";

export function ProfileContent() {
  const { user, isLoading } = useAuth();
  const { deviceName, setDeviceName } = useDeviceStore();
  const router = useRouter();
  const supabase = createClient();
  const [localName, setLocalName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalName(deviceName);
  }, [deviceName]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleSaveName = () => {
    setSaving(true);
    setDeviceName(localName);
    setSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const initials = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 pt-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">Profile</h1>
      </div>

      <Card>
        <CardHeader className="items-center text-center">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <CardTitle className="mt-2 text-lg">
            {user?.email ?? "User"}
          </CardTitle>
          <CardDescription>
            Manage your account information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              Email
            </Label>
            <p className="text-sm">{user?.email ?? "Not available"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Display Name</CardTitle>
          <CardDescription>How your device appears in rooms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="displayName">Device Name</Label>
            <Input
              id="displayName"
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
            />
          </div>
          <Button onClick={handleSaveName} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      <Button
        variant="destructive"
        className="w-full"
        onClick={handleSignOut}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    </div>
  );
}
