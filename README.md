# Caribbean Star Store

A Next.js marketplace application for Caribbean Star Store.

## Architecture

```text
GitHub → Vercel application
                 ↓
       Supabase (later phase)
                 ↓
          n8n (after Supabase)
```

The application is organized into five layers:

1. TOP / EXECUTIVE OS
2. MIDDLE OS
3. BACK OS
4. CARIBBEAN STAR STORE KERNEL
5. FRONT OS

The foundational build order is Identity → Organizations → Roles → Authorization → Trust.

## Current site work

The `middle-os-identity-phase-1` branch and draft PR #5 contain the marketplace and account experience, including:

- Public marketplace, business directory, jobs, and real-estate pages
- Search, product-detail, cart, and seller onboarding screens
- Account identity, organization workspaces, buyer requests, and platform-operations groundwork
- Responsive styling, the company logo, and Caribbean-inspired typography
- Search metadata, page canonicals, organization and website structured data, a sitemap, and `/llms.txt`

Review changes in the Vercel preview before production promotion or merging into `main`.

## Data and launch boundaries

- WordPress and WooCommerce are not part of the selected application architecture.
- Product listing, cart, checkout, purchases, and order history are not connected yet. The storefront must not show invented products, prices, sales totals, or seller metrics.
- The repository contains Supabase account and data-layer groundwork. The owner will connect the intended Supabase account after the site experience is finished; do not apply database changes before that phase.
- Connect n8n only after the Supabase phase is complete and the owner connects the intended account.
- Account-type limits and a separate platform-owner role must be enforced by trusted authorization controls in the later Supabase phase, not by user-editable profile fields.

## Security

- Do not commit secrets.
- Supabase publishable credentials may be used by the browser; privileged credentials stay server-side.
- Authorization must use trusted database/application controls, not user-editable metadata.
- Keep preview deployments separate from production promotion.
