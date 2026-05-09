"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface PresenceUser {
  userId: string;
  name: string;
  imageUrl: string | null;
  /** ISO timestamp of when they joined */
  joinedAt: string;
}

/**
 * Tracks who is currently viewing a document using Supabase Realtime Presence.
 * Returns the list of OTHER viewers (excludes the current user).
 */
export function useDocPresence(docId: string | null): PresenceUser[] {
  const { user } = useUser();
  const [viewers, setViewers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!docId || !user) return;

    const myPresence: PresenceUser = {
      userId: user.id,
      name: user.fullName ?? user.primaryEmailAddress?.emailAddress ?? "Someone",
      imageUrl: user.imageUrl ?? null,
      joinedAt: new Date().toISOString(),
    };

    const channel = supabase.channel(`doc-presence-${docId}`, {
      config: { presence: { key: user.id } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const others: PresenceUser[] = [];
        for (const key of Object.keys(state)) {
          if (key === user.id) continue;
          const entries = state[key];
          if (entries && entries.length > 0) {
            others.push(entries[0] as PresenceUser);
          }
        }
        setViewers(others);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(myPresence);
        }
      });

    channelRef.current = channel;

    return () => {
      void supabase.removeChannel(channel);
      channelRef.current = null;
      setViewers([]);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId, user?.id]);

  return viewers;
}
