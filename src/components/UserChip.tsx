"use client";

import Image from "next/image";
import { useUserInfo } from "@/hooks/useUserInfo";
import { useUser } from "@clerk/nextjs";

interface UserChipProps {
  userId: string;
  /** Prefix label rendered before the name (e.g. "Opened by"). */
  prefix?: string;
  /** Show "You" instead of the name when the userId matches the signed-in user. */
  showYou?: boolean;
}

export function UserChip({ userId, prefix, showYou = true }: UserChipProps) {
  const { user: currentUser } = useUser();
  const info = useUserInfo(userId);

  const isYou = showYou && currentUser?.id === userId;
  const displayName = isYou ? "You" : (info?.name ?? `user_${userId.slice(0, 6)}`);

  return (
    <span className="inline-flex items-center gap-1.5">
      {prefix && <span className="text-foreground-3">{prefix}</span>}
      {info?.imageUrl ? (
        <Image
          src={info.imageUrl}
          alt={displayName}
          width={18}
          height={18}
          className="rounded-full object-cover"
          unoptimized
        />
      ) : (
        <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[9px] font-bold uppercase text-indigo-500">
          {displayName.slice(0, 1)}
        </span>
      )}
      <span className="font-semibold text-foreground">{displayName}</span>
    </span>
  );
}
