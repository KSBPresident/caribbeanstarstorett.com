# Caribbean Star Store TT

A Next.js marketplace application for Caribbean Star Store TT.

## Architecture

```text
GitHub → Vercel application → Supabase
                         ↘ WordPress REST / WooCommerce Store API
```

The existing self-hosted WordPress site remains the CMS and commerce system. This application adds marketplace discovery, accounts, organizations, buyer requests, seller onboarding, business and opportunity listings, and platform operations.

The architecture is organized into five layers:

1. TOP / EXECUTIVE OS
2. MIDDLE OS
3. BACK OS
4. CARIBBEAN STAR STORE KERNEL
5. FRONT OS

The foundational build order is Identity → Organizations → Roles → Authorization → Trust.

## Implemented in the current feature branch

The `middle-os-identity-phase-1` branch and draft PR #5 contain:

- Supabase email/password registration, sign-in, confirmation callback, password recovery, and protected account pages
- Profile management, organization workspaces, member roles, permission checks, and audit history
- Seller applications and Build-A-Buy requests, with private account history and platform moderation
- Public business profiles and organization-owned job and real-estate listings
- Public marketplace search across WooCommerce products and published Supabase records
- A platform operations dashboard protected by the server-controlled `app_metadata.platform_role=admin` claim
- Job category handoff from the Opportunities page to the Build-A-Buy form

The Vercel Preview is for development and review. PR #5 is still a draft; the feature branch has not been merged into `main`.

## Commerce boundary

WooCommerce remains the source of truth for product details, checkout, purchases, and order history. The Next.js application reads the public WooCommerce Store API and hands shoppers back to the existing store for checkout and order management. It does not run a separate payment or order-processing system.

If the live catalog is unavailable, the application should link shoppers to the existing store. Do not replace unavailable catalog data with invented products, prices, sales totals, or seller metrics.

## Current status and launch gates (2026-09-24)

- The application behavior was last changed in commit `b0423bda1202ebcc2b0adfec9fd4931b57cc24ff` (`Keep buyer category after request validation errors`); the latest branch commit documents its status.
- The Vercel branch preview is READY and available at https://caribbeanstarstorett-com-git-middle-o-4ee650-caribbeanstarstore.vercel.app
- The homepage, sign-up, sign-in, marketplace, and opportunities pages returned HTTP 200 in preview checks. The seller, organization, buyer-request, account, and admin pages redirect anonymous visitors to sign-in.
- The Opportunities call-to-action links to `/build-a-buy?category=jobs`; the form reads and validates that category. The protected form's selected option still needs a signed-in walkthrough.
- The WooCommerce Store API product collection currently returns HTTP 403 from Cloudflare. The preview logs confirm the marketplace falls back to a link to the existing store; live product browsing through this app remains blocked.
- The latest deployment's runtime log checks showed successful public page responses and expected anonymous sign-in redirects. Earlier missing-Supabase-configuration errors were recorded on a different, older deployment; they were not present in the latest deployment log sample.
- The Supabase platform-operations migration is recorded as applied in the original implementation. The Supabase security advisor previously reported two SECURITY DEFINER moderation RPCs callable by the authenticated role; the functions check the trusted platform-admin claim before writing. Review the grants and checks before production.
- The requested WordPress Coming Soon page was not published because remote WordPress REST writes were blocked by Cloudflare.

Before launch:

1. Have the site owner decide whether Cloudflare should permit read-only access to the WooCommerce Store API for the marketplace app. Until then, keep the existing-store handoff.
2. Have the owner create and confirm an account, then walk through profile editing, a buyer request and cancellation, seller application submission, and organization and listing management with owner-approved test data.
3. Provision the first trusted platform administrator through a secure administrative process, then verify admin access and moderation with that account. Never grant platform access from editable profile metadata.
4. Review the Supabase security advisor finding and confirm the moderation RPC permissions and audit behavior.
5. Keep WordPress production, WooCommerce settings, DNS, and deployment settings unchanged unless the site owner explicitly authorizes a specific change.

## Security

- Do not commit secrets.
- Supabase publishable credentials may be used by the browser; privileged credentials stay server-side.
- WordPress credentials stay server-side.
- Authorization must use trusted database/application controls, not user-editable metadata.

Existing WordPress site: https://caribbeanstarstorett.com
