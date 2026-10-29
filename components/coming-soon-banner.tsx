import { BetaCountdown } from "./beta-countdown";

export function ComingSoonBanner() {
  return (
    <aside className="coming-soon-banner" aria-label="Beta launch announcement">
      <span className="beta-live-label">NOW LIVE</span>
      <span className="beta-mode-label">BETA MODE</span>
      <p>
        Caribbean Star Store is live in beta. Some marketplace features are still being refined.
      </p>
      <BetaCountdown />
    </aside>
  );
}
