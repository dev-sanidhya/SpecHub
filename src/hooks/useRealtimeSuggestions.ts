"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Suggestion {
  id: string;
  status: string;
  [key: string]: unknown;
}

type SetSuggestions = React.Dispatch<React.SetStateAction<Suggestion[]>>;

/**
 * Subscribes to INSERT/UPDATE events on the suggestions table for a given
 * document. When a suggestion is created or its status changes, the local
 * state is updated without a full page refresh.
 */
export function useRealtimeSuggestions(docId: string | null, setSuggestions: SetSuggestions) {
  useEffect(() => {
    if (!docId) return;

    const channel = supabase
      .channel(`suggestions-${docId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "suggestions",
          filter: `document_id=eq.${docId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newSuggestion = payload.new as Suggestion & { comments?: number };
            setSuggestions((prev) => {
              // Avoid duplicates (optimistic insert already added it)
              if (prev.some((s) => s.id === newSuggestion.id)) return prev;
              return [{ ...newSuggestion, comments: newSuggestion.comments ?? 0 }, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Suggestion;
            setSuggestions((prev) =>
              prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
            );
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            setSuggestions((prev) => prev.filter((s) => s.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [docId, setSuggestions]);
}
