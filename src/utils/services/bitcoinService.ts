import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  eurToSats,
} from "../bitcoinPayment";

const API_BASE = "/api/bitcoin";

export async function createBitcoinInvoice(
  req: CreatePaymentRequest
): Promise<CreatePaymentResponse> {
  try {
    const response = await fetch(`${API_BASE}/create-invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        paymentIntentId: "",
        amountSats: 0,
        error: error.error || "Erreur lors de la création de l'invoice",
      };
    }

    return await response.json();
  } catch (err: any) {
    console.error("createBitcoinInvoice error:", err);
    return {
      success: false,
      paymentIntentId: "",
      amountSats: eurToSats(req.amountEur),
      error: err.message || "Erreur réseau",
    };
  }
}

export async function checkPaymentStatus(
  paymentIntentId: string
): Promise<{ status: string; paymentHash?: string; paidAt?: string }> {
  try {
    const response = await fetch(`${API_BASE}/status/${paymentIntentId}`);
    if (!response.ok) throw new Error("Erreur vérification statut");
    return await response.json();
  } catch (err: any) {
    console.error("checkPaymentStatus error:", err);
    return { status: "error" };
  }
}

export async function confirmOnChainTransaction(
  txid: string
): Promise<{ confirmed: boolean; blockHeight?: number }> {
  try {
    const streamUrl =
      process.env.NEXT_PUBLIC_BLOCKSTREAM_API_URL ||
      "https://blockstream.info/testnet/api";
    const response = await fetch(`${streamUrl}/tx/${txid}`);
    if (!response.ok) throw new Error("Transaction non trouvée");
    return { confirmed: true };
  } catch (err: any) {
    console.error("confirmOnChainTransaction error:", err);
    return { confirmed: false };
  }
}

export async function generateReceiveAddress(): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/address`);
    if (!response.ok) throw new Error("Erreur génération adresse");
    const data = await response.json();
    return data.address;
  } catch (err: any) {
    console.error("generateReceiveAddress error:", err);
    throw err;
  }
}

export async function fetchWalletBalance(): Promise<number> {
  try {
    const response = await fetch(`${API_BASE}/balance`);
    if (!response.ok) throw new Error("Erreur récupération solde");
    const data = await response.json();
    return data.balanceSats || 0;
  } catch (err: any) {
    console.error("fetchWalletBalance error:", err);
    return 0;
  }
}

