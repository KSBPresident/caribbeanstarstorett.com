export type SafeExternalWebsite = {
  href: string;
  hostname: string;
};

/**
 * Normalize a user-submitted website for public links and structured data.
 * Only HTTPS destinations are accepted; credentials and other schemes are rejected.
 */
export function getSafeExternalWebsite(value: unknown): SafeExternalWebsite | null {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if (!input || /[\r\n]/.test(input)) return null;

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`;

  try {
    const url = new URL(candidate);
    if (
      url.protocol !== "https:" ||
      !url.hostname ||
      url.username ||
      url.password
    ) return null;

    return { href: url.toString(), hostname: url.hostname };
  } catch {
    return null;
  }
}
