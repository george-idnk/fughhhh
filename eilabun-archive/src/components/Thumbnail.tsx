"use client";

import { useState } from "react";

/** Remote thumbnail with a decorative, icon-style fallback when missing or broken. */
export default function Thumbnail({
  src,
  alt,
  icon,
  className = "",
}: {
  src: string | null;
  alt: string;
  icon: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={`hero-pattern relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
    >
      <div className="absolute inset-3 rounded-lg border border-gold-soft/30" />
      <div className="absolute inset-5 rounded-md border border-gold-soft/15" />
      <span className="text-5xl drop-shadow-lg" aria-hidden>
        {icon}
      </span>
    </div>
  );
}
