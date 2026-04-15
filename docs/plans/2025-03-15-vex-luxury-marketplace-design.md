# VEX Luxury Automotive Marketplace — Design Document

**Date:** 2025-03-15  
**Status:** Approved  
**Scope:** Consumer-first exotic car platform with CRM, dual inventory, build-your-own, shipping, financing, trade-in, and full customer portal.

---

## Vision

A consumer-first exotic car platform where the customer is in full control of their deal—similar to Amazon’s e-commerce experience but for high-end cars. No pushy salespeople, no unnecessary friction. The platform supports buying, selling, shipping, financing, and consultation in one place: a self-service, end-to-end vehicle acquisition portal for both casual buyers and VIP clients.

---

## 1. Architecture and Repository Layout

- **Repository:** Monorepo (Turborepo or pnpm workspaces).
  - **apps/web** — Next.js customer-facing site (inventory, build-your-own, financing, trade-in, checkout, customer portal).
  - **apps/api** — Node/Express REST API (auth, inventory, configurations, orders, leads, appraisals, financing, shipping, subscriptions).
  - **apps/crm** — Next.js CRM app for staff (dashboard, leads, orders, inventory, customers). Extensible; no artificial limits on adding capabilities later.
  - **packages/shared** — Shared TypeScript types, Zod (or similar) schemas, constants.
- **Database:** Postgres; only the API talks to it.
- **Auth:** API issues JWT (or session tokens); Next.js sends them. Same auth for customer site and CRM; role-based access (customer | staff | admin).
- **Deployment:** Front-end and API deployable separately (e.g. Netlify for Next.js, Railway/Fly/Render for Node), both using the same Postgres.

---

## 2. Data Model and API

### Core Entities (Postgres)

| Entity | Purpose |
|--------|--------|
| **users** | id, email, role (customer \| staff \| admin), name, phone, tier (e.g. standard, vip), created_at |
| **vehicles** | Base catalog for build-your-own: make, model, trim_level, year, base_price, body_type, image_urls, is_active |
| **inventory** | Physical/listed units. source (company \| private_seller), vehicle_id, listed_by_user_id (private), location, list_price, mileage, status, vin, verification_status (for private), image_urls, specs (JSON) |
| **configuration_options** | Options for build-your-own: vehicle_id (nullable), category (tyres \| paint \| accessories \| styling), name, price_delta, is_required |
| **saved_vehicles** | user_id, inventory_id or config snapshot (JSON), created_at |
| **orders** | user_id, type (inventory \| custom_build), inventory_id or vehicle_id + config_snapshot, status, deposit_amount, total_amount, financing_snapshot, trade_in_snapshot, shipping_snapshot, styling_addons_snapshot, created_at, updated_at |
| **shipments** | order_id, carrier, tracking_url, status, estimated_delivery, open_enclosed (open \| enclosed), quote_amount, origin, destination |
| **shipping_quotes** | Optional cache: route/distance, transport_type, amount, expires_at |
| **leads** | source, contact info, vehicle_interest, status, assigned_to (staff user_id), notes, created_at |
| **appraisals** | user_id (optional), vehicle_info (make, model, year, mileage, condition), estimated_value, status, created_at |
| **subscriptions** | user_id, plan (check_my_deal \| vip_concierge \| etc.), status, billing_interval, amount, expires_at |
| **notifications** | user_id, type, title, body, read_at, created_at (or use a simple notifications table for in-app; email can be separate) |

### API (Node/Express) — Main Surface

- **Auth:** POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me. JWT with role.
- **Inventory:** GET /inventory (query: source, location, min_price, max_price, make, model, year, color, status), GET /inventory/:id. POST /inventory (private listing; staff or verified seller). PATCH /inventory/:id (e.g. verification_status).
- **Vehicles (catalog):** GET /vehicles, GET /vehicles/:id/options.
- **Saved vehicles:** GET /saved-vehicles, POST /saved-vehicles, DELETE /saved-vehicles/:id.
- **Orders:** POST /orders (create from inventory or custom build), GET /orders (by user or by role in CRM), PATCH /orders/:id.
- **Shipping:** POST /shipping/quote (origin, destination, open_enclosed) → returns amount (distance-based + 0.35% platform adder). POST /orders/:id/shipment (create shipment); GET /shipments/:id (tracking). Real-time pricing per spec.
- **Financing:** POST /financing/calculate (price, term, apr) → monthly payment; result stored in order snapshot.
- **Trade-in:** POST /appraisals, GET /appraisals/:id. v1: rule-based estimate; later AI/third-party.
- **Subscriptions:** POST /subscriptions (e.g. Check My Deal), GET /subscriptions/me. Deal analysis: POST /deal-analysis (vehicle + financing + shipping + add-ons) → recommendations (manual or rule-based v1).
- **CRM:** GET/POST/PATCH /leads, GET /orders (filters), GET /users (staff), GET /dashboard/stats. Extensible for future modules.
- **Notifications:** GET /notifications, PATCH /notifications/:id/read. Create notifications from order/shipment events.

---

## 3. Customer Site — Pages and Flows

| Route | Purpose |
|-------|--------|
| **/** | Home: hero (video/image + overlay), headline, CTAs (View Inventory, Build Your Ride, Book a Test Drive), featured cars, trust strip, footer |
| **/inventory** | Grid of vehicles; filters: source (company/private), location, price range, make, model, year, color, VIN; sort; saved vehicles indicator |
| **/inventory/[id]** | Detail: gallery, specs, price, shipping estimate CTA, “Configure & buy” / “Reserve / Pay deposit” |
| **/build** | Multi-step build-your-own: (1) base vehicle (2) trim (3) paint (4) tyres/wheels (5) accessories (6) summary → checkout |
| **/build/checkout** or **/checkout** | Order summary, trade-in (link to appraisal), financing calculator, shipping (open/enclosed, quote), styling add-ons, deposit, submit → confirmation |
| **/appraisal** or **/trade-in** | Form: make, model, year, mileage, condition → estimated value; “Use as trade-in” → attach to order |
| **/financing** | Optional standalone calculator |
| **/portal** or **/dashboard** | Customer portal: saved vehicles, ongoing deals, completed purchases, financing summary, shipping tracking (carrier, status, ETA), styling/upgrades, recommendations/alerts, notifications |
| **/login**, **/register** | Auth; redirect back or to checkout/portal |

**Flows:** Browse → Inventory → [id] → Reserve/Deposit (with financing + shipping + trade-in); or Build → steps → Checkout (same); Trade-in from checkout or /appraisal; Portal for all post-purchase and saved state.

---

## 4. Dual Inventory Structure

- **Company inventory:** Direct units (consignment or resale); fully managed; real-time pricing, availability, shipping options. source = company.
- **Private seller marketplace:** Individuals list vehicles (details, price); listing has verification_status; only verified or approved listings shown (or shown with badge). source = private_seller; listed_by_user_id set. CRM can manage verification.
- **Unified browse:** One interface; filter by source; total costs (vehicle + shipping + styling) visible where applicable.

---

## 5. Shipping & Logistics

- **Integrated at checkout:** Choice of open or enclosed transport.
- **Pricing:** Live market-inspired rate (e.g. distance × rate/mile) + 0.35% platform adder. Distance-based; quote endpoint returns amount.
- **Tracking:** After order/shipment creation, customer sees real-time status, carrier, tracking URL, estimated delivery in portal (and optionally email).

---

## 6. Full Customer Portal

- **Dashboard:** Saved vehicles, ongoing deals (orders in progress), completed purchases, financing summary, shipping tracking (carrier, status, ETA), styling/upgrades applied, personalized recommendations and alerts.
- **Notifications:** Vehicle status, shipping updates, price drops, VIP/concierge messages; in-app (and email later). All costs and details visible upfront; no hidden charges.

---

## 7. Upsell & Add-Ons

- **Styling/restyling:** Paint, wrap, interior, detailing, tint—shown at checkout with live pricing; stored in order and displayed in portal.
- **Subscriptions/memberships:** Check My Deal (deal analysis), VIP concierge, exclusive inventory alerts. Tiers: self-service, semi-managed, full VIP. Stored in subscriptions; CRM can manage.

---

## 8. CRM Scope (v1) — Extensible

- **Dashboard:** Leads (new/open), orders (deposit paid, in progress), inventory alerts.
- **Leads:** List, create, assign, status (new/contacted/qualified/lost); convert to order optional.
- **Orders:** List, detail, update status, internal notes.
- **Inventory:** CRUD for company and private (e.g. verification); location, price, status.
- **Customers:** List (role=customer), detail with orders/leads/appraisals.
- **Auth:** Staff/admin only; same API. Future: reports, comms, docs, AI—no design limits.

---

## 9. UI Blueprint (Dark Luxury)

- **Theme:** Backgrounds #0D0D0D / #121212; cards #1E1E1E; footer #0A0A0A. Accent gold #FFD700; optional red #FF2D55. Text: white headings, #CCCCCC body, #888888 muted.
- **Typography:** Montserrat Bold (H1/H2), Poppins Medium (H3), Inter Regular (body), Montserrat SemiBold (CTAs).
- **Header:** Sticky, blurred dark; logo (gold); nav (Inventory, Build Your Ride, Services, About, Contact); CTA “Book a Test Drive”. Shrinks on scroll.
- **Hero:** Full-width video/image, gradient overlay, large headline, two CTAs; optional parallax.
- **Inventory grid:** Cards with hover lift and accent glow; 3–4 columns desktop; swipeable mobile.
- **Build flow:** One primary CTA per step; progress indicator; option tiles; same palette.
- **Motion:** Section fade-in on scroll; card/button hover (lift, glow, scale); smooth transitions. Optional: parallax, lazy load, 360° later.
- **Trust:** Testimonials, press/certification logos; transparency on costs.

---

## 10. Integrations and Non-Functional (v1)

- **Payments:** v1 deposit recorded only (amount + status); no gateway. Later: Stripe (or similar) + webhook to update order.
- **Appraisal:** v1 rule-based; later AI or third-party API behind same endpoint.
- **Auth:** v1 email/password + JWT; later OAuth/magic links.
- **Deployment:** Next.js (Netlify or Node host); API (Railway/Render/Fly); Postgres (Neon/Supabase/self-hosted). Env: NEXT_PUBLIC_API_URL, DATABASE_URL, JWT_SECRET, etc. No secrets in front-end.
- **Performance:** Pagination on list endpoints; DB indexes on filters; Next.js Image + lazy load; shared types in packages/shared.

---

## 11. Competitive Differentiators

- Full self-service with optional VIP support.
- Integrated shipping and real-time cost in one flow.
- Styling/add-ons and subscriptions (Check My Deal, VIP) in one portal.
- End-to-end experience with visual tracking and transparency; consumer-first, no pushy sales.

---

## Document History

| Date | Change |
|------|--------|
| 2025-03-15 | Initial design approved; dual inventory, shipping, portal, subscriptions/VIP, saved vehicles, filters incorporated. |
