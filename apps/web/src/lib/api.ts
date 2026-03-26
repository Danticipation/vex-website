const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export interface InventoryItem {
  id: string;
  source: string;
  vehicleId: string;
  listedByUserId: string | null;
  location: string | null;
  listPrice: number;
  mileage: number | null;
  status: string;
  vin: string | null;
  verificationStatus: string | null;
  imageUrls: string[] | null;
  specs: Record<string, unknown> | null;
  modelGlbUrl: string | null;
  modelSource: string | null;
  modelSourcePhotoIds: string[] | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    trimLevel: string;
    year: number;
    basePrice: number;
    bodyType: string | null;
    imageUrls: unknown;
  };
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  trimLevel: string;
  year: number;
  basePrice: number;
  bodyType: string | null;
  imageUrls: string[] | null;
  isActive: boolean;
}

export interface GetInventoryParams {
  source?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  make?: string;
  model?: string;
  year?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export async function getInventory(params: GetInventoryParams = {}): Promise<InventoryListResponse> {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") search.set(k, String(v));
  });
  const res = await fetch(`${API_BASE}/inventory?${search}`);
  if (!res.ok) throw new Error("Failed to fetch inventory");
  return res.json();
}

export async function getInventoryItem(id: string): Promise<InventoryItem> {
  const res = await fetch(`${API_BASE}/inventory/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Not found");
    throw new Error("Failed to fetch vehicle");
  }
  return res.json();
}

export async function getVehicles(params?: { make?: string }): Promise<Vehicle[]> {
  const search = params?.make ? `?make=${encodeURIComponent(params.make)}` : "";
  const res = await fetch(`${API_BASE}/vehicles${search}`);
  if (!res.ok) throw new Error("Failed to fetch vehicles");
  return res.json();
}

export interface ConfigOption {
  id: string;
  vehicleId: string | null;
  category: string;
  name: string;
  priceDelta: number;
  isRequired: boolean;
}

export async function getVehicleOptions(vehicleId: string): Promise<ConfigOption[]> {
  const res = await fetch(`${API_BASE}/vehicles/${vehicleId}/options`);
  if (!res.ok) throw new Error("Failed to fetch options");
  return res.json();
}

export interface CreateOrderPayload {
  type: "INVENTORY" | "CUSTOM_BUILD";
  inventoryId?: string;
  vehicleId?: string;
  configSnapshot?: Record<string, unknown>;
  depositAmount?: number;
  totalAmount?: number;
  financingSnapshot?: Record<string, unknown>;
  tradeInSnapshot?: Record<string, unknown>;
  shippingSnapshot?: Record<string, unknown>;
  stylingAddonsSnapshot?: Record<string, unknown>;
  status?: "DRAFT" | "DEPOSIT_PAID";
}

export async function createOrder(payload: CreateOrderPayload, token: string): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Failed to create order");
  }
  return res.json();
}

export interface ShippingQuotePayload {
  origin: string;
  destination: string;
  openEnclosed: "OPEN" | "ENCLOSED";
}

export async function getShippingQuote(payload: ShippingQuotePayload): Promise<{ amount: number; distance: number; breakdown: unknown }> {
  const res = await fetch(`${API_BASE}/shipping/quote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to get shipping quote");
  return res.json();
}

export interface FinancingCalculatePayload {
  price: number;
  termMonths: number;
  apr: number;
}

export async function getFinancingCalculate(payload: FinancingCalculatePayload): Promise<{
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
}> {
  const res = await fetch(`${API_BASE}/financing/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to calculate financing");
  return res.json();
}

export interface CreateAppraisalPayload {
  make: string;
  model: string;
  year: number;
  mileage: number;
  condition?: string;
}

function publicAppraisalTenantQuery(): string {
  const id = process.env.NEXT_PUBLIC_PUBLIC_APPRAISAL_TENANT_ID;
  return id ? `?tenantId=${encodeURIComponent(id)}` : "";
}

/** Public instant estimate (no auth) — uses /public/quick-appraisal + tenant resolution. */
export async function createAppraisal(
  payload: CreateAppraisalPayload
): Promise<{ id: string; value: number | null; notes: string | null }> {
  const res = await fetch(`${API_BASE}/public/quick-appraisal${publicAppraisalTenantQuery()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof body.message === "string" ? body.message : "Failed to get appraisal");
  const data = unwrap<{ id: string; value: number | null; notes: string | null }>(body);
  return data;
}

export async function getAppraisal(id: string): Promise<{ id: string; value: number | null; notes: string | null }> {
  const res = await fetch(`${API_BASE}/public/quick-appraisal/${encodeURIComponent(id)}${publicAppraisalTenantQuery()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Appraisal not found");
  return unwrap<{ id: string; value: number | null; notes: string | null }>(body);
}

export interface OrderItem {
  id: string;
  type: string;
  status: string;
  totalAmount: number | null;
  depositAmount: number | null;
  createdAt: string;
  shipments?: Array<{
    id: string;
    carrier: string | null;
    trackingUrl: string | null;
    status: string;
    estimatedDelivery: string | null;
    origin: string | null;
    destination: string | null;
  }>;
}

export async function getOrders(token: string): Promise<{ items: OrderItem[]; total: number }> {
  const res = await fetch(`${API_BASE}/orders?limit=50`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export interface SavedVehicleItem {
  id: string;
  inventoryId: string | null;
  configSnapshot: unknown;
  createdAt: string;
  inventory?: { id: string; listPrice: number; vehicle?: { make: string; model: string; year: number } };
}

export async function getSavedVehicles(token: string): Promise<SavedVehicleItem[]> {
  const res = await fetch(`${API_BASE}/saved-vehicles`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch saved vehicles");
  const data = await res.json();
  return Array.isArray(data) ? data : data.items ?? data;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export async function getNotifications(token: string): Promise<{ items: NotificationItem[]; total: number }> {
  const res = await fetch(`${API_BASE}/notifications?limit=20`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export async function markNotificationRead(id: string, token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to mark read");
}

export interface SubscriptionItem {
  id: string;
  plan: string;
  status: string;
  billingInterval: string | null;
  amount: number | null;
  expiresAt: string | null;
  createdAt: string;
}

export async function getSubscriptions(token: string): Promise<SubscriptionItem[]> {
  const res = await fetch(`${API_BASE}/subscriptions/me`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch subscriptions");
  return res.json();
}

export async function createSubscription(
  payload: { plan: string; billingInterval?: string; amount?: number },
  token: string
): Promise<SubscriptionItem> {
  const res = await fetch(`${API_BASE}/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to subscribe");
  return res.json();
}

export async function createStripeCheckoutSession(
  payload: { plan: string; billingInterval?: "monthly" | "yearly" },
  token: string
): Promise<{ id: string; url: string | null }> {
  const res = await fetch(`${API_BASE}/subscriptions/stripe/checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Failed to start Stripe checkout");
  }
  return res.json();
}

export async function getPricingPlans(): Promise<{
  plans: Array<{ tier: "STARTER" | "PRO" | "ENTERPRISE"; name: string; monthly: number; yearly: number; features: string[] }>;
}> {
  const res = await fetch(`${API_BASE}/pricing/plans`);
  if (!res.ok) throw new Error("Failed to fetch pricing plans");
  return unwrap(await res.json());
}

export async function createTierCheckoutSession(
  payload: { tier: "STARTER" | "PRO" | "ENTERPRISE"; interval?: "monthly" | "yearly" },
  token: string
): Promise<{ id: string; url: string | null }> {
  const res = await fetch(`${API_BASE}/stripe/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ planId: payload.tier, interval: payload.interval ?? "monthly" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Failed to start tier checkout");
  }
  return unwrap(await res.json());
}

export async function createBillingPortalSession(
  payload: { returnUrl?: string },
  token: string
): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE}/pricing/portal/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Failed to create billing portal session");
  }
  return unwrap(await res.json());
}

export async function getCurrentTenantBilling(token: string): Promise<{
  id: string;
  name: string;
  billingTier: string;
  stripeSubscriptionStatus: string | null;
  customDomain: string | null;
  themeJson: Record<string, unknown> | null;
  onboardedAt: string | null;
}> {
  const res = await fetch(`${API_BASE}/pricing/current`, { headers: authHeaders(token) });
  if (!res.ok) throw new Error("Failed to fetch tenant billing");
  return unwrap(await res.json());
}

export async function completeOnboarding(token: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/auth/onboarding/complete`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error("Failed to complete onboarding");
  return unwrap(await res.json());
}

export async function runDealAnalysis(
  payload: { vehicle?: unknown; financing?: unknown; shipping?: unknown; addOns?: unknown; totalAmount?: number },
  token: string
): Promise<{ recommendations: string[] }> {
  const res = await fetch(`${API_BASE}/deal-analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Deal analysis failed");
  }
  return res.json();
}

export async function createLead(payload: { source?: string; email?: string; phone?: string; name?: string; vehicleInterest?: string; notes?: string }): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to submit");
  return res.json();
}


export async function getOwnerAdminOverview(token: string): Promise<{
  mrr: number;
  activeTenants: number;
  tenants: Array<{
    id: string;
    name: string;
    billingTier: string;
    stripeSubscriptionStatus: string | null;
    customDomain: string | null;
    createdAt: string;
  }>;
}> {
  const res = await fetch(`${API_BASE}/admin/overview`, { headers: authHeaders(token) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || "Failed to load admin overview");
  }
  return unwrap(await res.json());
}

export async function onboardingStart(input: { email: string; dealerName: string; password: string; captchaToken: string }) {
  const res = await fetch(`${API_BASE}/onboard/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message || "Failed to start onboarding");
  return unwrap<{ tenantId: string; userId: string; onboardingToken: string }>(body);
}

export async function onboardingStripe(
  input: { tenantId: string; tier: "STARTER" | "PRO" | "ENTERPRISE"; interval?: "monthly" | "yearly" },
  onboardingToken: string
) {
  const res = await fetch(`${API_BASE}/onboard/stripe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${onboardingToken}` },
    body: JSON.stringify({ ...input, interval: input.interval ?? "monthly" }),
  });
  if (!res.ok) throw new Error("Failed onboarding billing step");
}

export async function onboardingTheme(
  input: { tenantId: string; customDomain?: string; themeJson?: Record<string, unknown> },
  onboardingToken: string
) {
  const res = await fetch(`${API_BASE}/onboard/theme`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${onboardingToken}` },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed onboarding theme step");
}

export async function onboardingSeed(input: { tenantId: string; enableDemoData: boolean }, onboardingToken: string) {
  const res = await fetch(`${API_BASE}/onboard/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${onboardingToken}` },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed onboarding seed step");
}

export async function onboardingConfirm(input: { tenantId: string }, onboardingToken: string) {
  const res = await fetch(`${API_BASE}/onboard/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${onboardingToken}` },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Failed onboarding confirm step");
  return unwrap<{ magicLink: string }>(body);
}

export async function applyPilot(input: { name: string; email: string; dealership: string; phone?: string }) {
  const res = await fetch(`${API_BASE}/pilot/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message || "Pilot application failed");
  return unwrap<{ leadId: string; status: string; autoApprove: boolean }>(body);
}
