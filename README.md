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

The Vercel Preview is for development and review. PR #5 is still a draft; the feature branch has not been merged into `main`.

## Commerce boundary

WooCommerce remains the source of truth for product details, checkout, purchases, and order history. The Next.js application reads the public WooCommerce Store API and hands shoppers back to the existing store for checkout and order management. It does not run a separate payment or order-processing system.

If the live catalog is unavailable, the application should link shoppers to the existing store. Do not replace unavailable catalog data with invented products, prices, sales totals, or seller metrics.

## Current status and launch gates (2026-09-24)

- The current feature-branch Vercel Preview is READY. The homepage and marketplace route return successfully.
- The WooCommerce product-categories Store API request currently receives a Cloudflare 403 challenge. The Next.js marketplace therefore cannot show live products from the existing store.
- The connected Supabase project has the identity, organization, marketplace, and platform-operations migrations. No Auth users or live seller/business/opportunity records have been created, so authenticated owner and seller flows still need a real owner-led walkthrough.
- The Supabase advisor reports two SECURITY DEFINER moderation RPCs callable by the authenticated role. Both functions check the server-controlled platform-admin claim inside the function before changing records. Review those grants and checks before production.
- A separate request to publish a WordPress Coming Soon page was not completed; remote WordPress REST writes were blocked by Cloudflare.

Before launch:

1. Have the site owner decide whether Cloudflare should permit read-only access to the WooCommerce Store API for the marketplace app. Until then, keep the existing-store handoff.
2. Have the owner register the first trusted platform account and provision its platform-admin claim through a secure administrative process. Never grant platform access from editable profile metadata.
3. Walk through registration, buyer request submission, seller application, organization/listing management, and admin moderation with owner-approved accounts and real approved content.
4. Review the Supabase security advisor finding and confirm the moderation RPC permissions and audit behavior.
5. Keep WordPress production, WooCommerce settings, DNS, and deployment settings unchanged unless the site owner explicitly authorizes a specific change.

## Security

- Do not commit secrets.
- Supabase publishable credentials may be used by the browser; privileged credentials stay server-side.
- WordPress credentials stay server-side.
- Authorization must use trusted database/application controls, not user-editable metadata.

Existing WordPress site: https://caribbeanstarstorett.com
