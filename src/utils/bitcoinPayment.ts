/**
 * Santé Plus - Bitcoin Payment Service
 */

export type PaymentNetwork = "lightning" | "onchain";
export type PaymentStatus = "idle" | "creating" | "awaiting" | "processing" | "success" | "error";

export interface CreatePaymentRequest {
  appointmentId: string;
  hospitalName: string;
  specialty: string;
  amountEur: number;
  method: PaymentNetwork;
  patientName: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  paymentIntentId: string;
  amountSats: number;
  bolt11?: string;
  address?: string;
  invoiceId?: string;
  error?: string;
}

let EUR_TO_SATS = 230;

export function eurToSats(eur: number): number {
  return Math.round(eur * EUR_TO_SATS);
}

export function formatSats(sats: number): string {
  if (sats >= 1_000_000) return `${(sats / 1_000_000).toFixed(2)} MBTC`;
  if (sats >= 1_000) return `${(sats / 1_000).toFixed(2)} KBTC`;
  return `${sats} sats`;
}

export function buildBIP21(address: string, amountBtc: number, label?: string, message?: string): string {
  const url = new URL(`bitcoin:${address}`);
  url.searchParams.set("amount", amountBtc.toFixed(8));
  if (label) url.searchParams.set("label", label);
  if (message) url.searchParams.set("message", message);
  return url.toString();
}

export function generateMockPaymentIntent(req: CreatePaymentRequest): CreatePaymentResponse {
  const id = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const amountSats = eurToSats(req.amountEur);
  if (req.method === "lightning") {
    const bolt11 = `lnbc${amountSats * 1000}u1p${Array.from(crypto.getRandomValues(new Uint8Array(30))).map((b) => "qpzry9x8gf2tvdw0s3jn54khce6mua7l"[b % 34]).join("").slice(0, 90)}`;
    return { success: true, paymentIntentId: id, amountSats, bolt11 };
  } else {
    const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    const address = "bc1q" + Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => chars[b % chars.length]).join("").slice(0, 38);
    return { success: true, paymentIntentId: id, amountSats, address };
  }
}

export async function detectWebLN(): Promise<{ supported: boolean; provider?: any }> {
  try {
    const webln = (window as any).webln;
    if (!webln) return { supported: false };
    const enabled = await webln.enable?.();
    return { supported: true, provider: webln };
  } catch {
    return { supported: false };
  }
}

export async function sendViaWebLN(webln: any, bolt11: string): Promise<{ success: boolean; preimage?: string; error?: string }> {
  try {
    const result = await webln.sendPayment(bolt11);
    return { success: true, preimage: result.preimage };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
