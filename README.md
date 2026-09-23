# Caribbean Star Store TT

Application foundation for Caribbean Star Store TT.

## Architecture

GitHub → Vercel application → Supabase
                         ↘ WordPress REST bridge

Layers:
1. TOP / EXECUTIVE OS
2. MIDDLE OS
3. BACK OS
4. CARIBBEAN STAR STORE KERNEL
5. FRONT OS

Foundational build order:
Identity → Organizations → Roles → Authorization → Trust

## Current state

The repository now contains the Next.js application foundation and integration adapters. The existing WordPress.org site remains the CMS/commerce system; this application accesses it through a server-side REST bridge.

## Security

- No secrets are committed to GitHub.
- Supabase publishable credentials may be used by the browser; privileged credentials stay server-side.
- WordPress credentials stay server-side.
- Authorization must use database/application controls, not user-editable metadata.

Existing WordPress site: https://caribbeanstarstorett.com
