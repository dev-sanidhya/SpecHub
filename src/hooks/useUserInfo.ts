"use client";

import { useState, useEffect } from "react";

export interface UserInfo {
  id: string;
  name: string;
  imageUrl: string | null;
}

// Module-level cache - survives re-renders and is shared across all hook instances.
// Keyed by userId. Stores the resolved value or a pending Promise.
const cache = new Map<string, UserInfo | Promise<UserInfo>>();

async function fetchUser(userId: string): Promise<UserInfo> {
  const res = await fetch(`/api/users/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json() as Promise<UserInfo>;
}

function resolveUser(userId: string): Promise<UserInfo> {
  const cached = cache.get(userId);
  if (cached instanceof Promise) return cached;
  if (cached) return Promise.resolve(cached);

  const promise = fetchUser(userId).then((info) => {
    cache.set(userId, info); // Replace promise with resolved value
    return info;
  });

  cache.set(userId, promise); // Store promise so concurrent callers deduplicate
  return promise;
}

export function useUserInfo(userId: string | null | undefined): UserInfo | null {
  const [info, setInfo] = useState<UserInfo | null>(() => {
    if (!userId) return null;
    const cached = cache.get(userId);
    return cached instanceof Promise ? null : (cached ?? null);
  });

  useEffect(() => {
    if (!userId) return;
    const cached = cache.get(userId);
    if (cached && !(cached instanceof Promise)) {
      setInfo(cached);
      return;
    }
    resolveUser(userId)
      .then(setInfo)
      .catch(() => {
        setInfo({ id: userId, name: `user_${userId.slice(0, 6)}`, imageUrl: null });
      });
  }, [userId]);

  return info;
}
