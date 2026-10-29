"use client";

import { useEffect, useState } from "react";

const betaEndsAt = Date.parse("2026-11-01T00:00:00-04:00");

function getRemaining(now: number) {
  const totalSeconds = Math.max(0, Math.floor((betaEndsAt - now) / 1000));
  return {
    totalSeconds,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function BetaCountdown() {
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining> | null>(null);

  useEffect(() => {
    const update = () => setRemaining(getRemaining(Date.now()));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="beta-countdown" aria-label="Beta period countdown">
      <span className="beta-countdown-label">Beta ends in</span>
      <time dateTime="2026-11-01T00:00:00-04:00" aria-live="off">
        {remaining ? (
          remaining.totalSeconds > 0 ? (
            <span className="beta-countdown-values">
              <span><strong>{remaining.days}</strong><small>d</small></span>
              <span><strong>{String(remaining.hours).padStart(2, "0")}</strong><small>h</small></span>
              <span><strong>{String(remaining.minutes).padStart(2, "0")}</strong><small>m</small></span>
              <span><strong>{String(remaining.seconds).padStart(2, "0")}</strong><small>s</small></span>
            </span>
          ) : "Beta period ended"
        ) : "Loading…"}
      </time>
      <span className="beta-countdown-deadline">November 1, 2026 · 12:00 AM AST</span>
    </div>
  );
}
