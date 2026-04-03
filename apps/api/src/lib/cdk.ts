import { fortellisRequest } from "./fortellis.js";

type CdkHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function cdkNamespacePath(endpoint: string): string {
  const normalized = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `/cdk/drive${normalized}`;
}

export async function cdkDriveRequest<T = unknown>(
  method: CdkHttpMethod,
  endpoint: string,
  data?: unknown
): Promise<T> {
  return fortellisRequest<T>(method, cdkNamespacePath(endpoint), data);
}

export async function subscribeToNeuronEvent(eventType: string, callbackUrl: string): Promise<unknown> {
  return fortellisRequest("POST", "/async/subscriptions", {
    eventType,
    callbackUrl,
    subscriptionId: process.env.FORTELLIS_SUBSCRIPTION_ID,
  });
}
