"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { useWorkspaceStore } from "@/stores";
import { Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function MembersPanel() {
  const { members, activities } = useWorkspaceStore();

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="mb-4 text-sm font-medium">
          Active Members ({members.length})
        </h3>
        {members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No members"
            description="Members will appear here when they join the room"
          />
        ) : (
          <div className="space-y-2">
            {members.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 rounded-md border border-border p-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {member.device_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {member.device_name}
                    {member.is_host && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        Host
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last seen{" "}
                    {formatDistanceToNow(new Date(member.last_seen_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-4 text-sm font-medium">Recent Activity</h3>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet</p>
        ) : (
          <div className="space-y-2">
            {activities.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-2 rounded-md border border-border p-3"
              >
                <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{activity.device_name}</span>{" "}
                    {activity.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
