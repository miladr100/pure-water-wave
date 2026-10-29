"use client";

import { useState } from "react";

import { initialsOf } from "@/components/academy/format";
import { cn } from "@/lib/utils";

// The person's photo when there is one, otherwise their initials on the CTA
// gradient. Photo URLs come from our own `/api/academia/foto/<id>` route, so a
// plain <img> is used, as the course covers do.
export function UserAvatar({
  fullName,
  photoUrl,
  className,
  textClassName,
}: {
  fullName: string;
  photoUrl: string | null;
  className?: string;
  textClassName?: string;
}) {
  // The URL that failed to load, so a new photo gets its own chance.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = Boolean(photoUrl) && failedUrl !== photoUrl;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-cta text-primary-foreground",
        className,
      )}
      aria-hidden={showPhoto ? undefined : true}
    >
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl ?? ""}
          alt={fullName}
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(photoUrl)}
        />
      ) : (
        <span className={cn("font-display font-semibold leading-none", textClassName)}>
          {initialsOf(fullName)}
        </span>
      )}
    </span>
  );
}
