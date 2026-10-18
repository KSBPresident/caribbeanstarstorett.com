# Caribbean Star Store

A Next.js marketplace application for Caribbean Star Store.

## Architecture

```text
GitHub → Vercel application
                 ↓
       Supabase (CSS project)
                 ↓
       n8n (later phase)
```

The application is organized into five layers:

1. TOP / EXECUTIVE OS
2. MIDDLE OS
3. BACK OS
4. CARIBBEAN STAR STORE KERNEL
5. FRONT OS

The foundational build order is Identity → Organizations → Roles → Authorization → Trust.

## Current site work

The `main` branch is the source for the current production deployment on Vercel at [www.caribbeanstarstorett.com](https://www.caribbeanstarstorett.com). Production now includes:

- Public marketplace, business directory, jobs, and real-estate pages
- Search, product-detail pages with published seller storefront information, cart, buyer offers, and seller messaging
- Account identity, organization workspaces, buyer requests, and seller onboarding
- Seller workspaces with inventory management, away status, coupons, broadcasts, and a paid-sales chart
- Admin tools for seller applications, platform broadcasts, and read-only marketplace message review
- Responsive styling, the company logo, and Caribbean-inspired typography
- Search metadata, page canonicals, organization and website structured data, a sitemap, and `/llms.txt`

Use the latest successful Vercel production deployment to confirm the live state. Preview deployments are for reviewing changes before they are promoted to production.

## Data and launch boundaries

- WordPress and WooCommerce are not part of the selected application architecture.
- The selected Supabase project is `CSS` in the Caribbean Star Store organization. Its initial migrations establish profiles, organizations, roles and permissions, audit history, seller applications, buyer requests, public business profiles, and jobs/real-estate listings. All exposed application tables have row-level security enabled.
- Seller inventory and the public product catalog use Supabase `inventory_items`; published catalog records are real seller listings. Approved sellers can upload JPEG, PNG, or WebP product photos up to 45 MB to the product-image bucket under organization-scoped RLS policies, or provide an HTTPS image URL. Guest carts are saved in the browser, and signed-in carts sync to Supabase under user-owned row-level security.
- Buyer-seller conversations, seller broadcasts, coupon offers, and paid sales use Supabase data. The seller sales chart must use only paid sales rows; empty states are expected until real transactions are recorded. Do not invent products, prices, messages, coupons, sales totals, or seller metrics.
- WiPay checkout and buyer order history are not in the production `main` branch yet. The release is prepared separately and requires the merchant account number and server API key as Production-only Vercel secrets before it can be promoted. Until then, checkout and coupon redemption remain unavailable.
- Account-type limits and a separate platform-owner role must be enforced by trusted authorization controls, not by user-editable profile fields.
- Connect n8n only after the Supabase work is complete and the owner connects the intended account.
- A later move to a different Supabase account must update the URL and publishable key together.

## Security

- Do not commit secret or service-role keys.
- Supabase publishable credentials may be used by the browser when RLS is enabled; privileged credentials stay server-side.
- Authorization must use trusted database/application controls, not user-editable metadata.
- Keep preview deployments separate from production promotion.
