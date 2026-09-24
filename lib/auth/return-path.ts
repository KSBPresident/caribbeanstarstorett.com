const INTERNAL_ORIGIN = "https://caribbean-star-store.invalid";

export function safeNextPath(candidate: unknown): string {
  if (
    typeof candidate !== "string" ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return "/dashboard";
  }

  try {
    const url = new URL(candidate, INTERNAL_ORIGIN);
    if (url.origin !== INTERNAL_ORIGIN) return "/dashboard";
    return url.pathname + url.search + url.hash;
  } catch {
    return "/dashboard";
  }
}

export function signInUrl(nextPath: string): string {
  const next = safeNextPath(nextPath);
  return `/sign-in?notice=signin&next=${encodeURIComponent(next)}`;
}
