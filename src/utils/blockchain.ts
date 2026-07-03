import { Block } from "../types";

// Helper to simulate a SHA-256 hash
export function calculateSHA256(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Convert to positive hex representation of 64 characters (padded)
  const hex = Math.abs(hash).toString(16).padStart(8, "0") + 
              Math.abs(hash * 31).toString(16).padStart(8, "0") +
              Math.abs(hash * 127).toString(16).padStart(16, "0") +
              "8a9f02c4b1d6e8";
  return hex.substring(0, 64);
}

// Generates a mock Bitcoin-like public key
export function generateBitcoinKeys(): { publicKey: string; privateKey: string } {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let pub = "1SantePlus";
  let priv = "L";
  for (let i = 0; i < 24; i++) {
    pub += chars.charAt(Math.floor(Math.random() * chars.length));
    priv += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return {
    publicKey: pub,
    privateKey: priv,
  };
}

// Simple XOR or hex cipher to simulate AES-256 encryption
export function encryptData(text: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Convert to hex with offset
    result += (code ^ 42).toString(16).padStart(2, "0");
  }
  return "ENC::" + result.toUpperCase();
}

export function decryptData(cipher: string): string {
  if (!cipher.startsWith("ENC::")) return cipher;
  const hex = cipher.replace("ENC::", "");
  let result = "";
  for (let i = 0; i < hex.length; i += 2) {
    const part = hex.substring(i, i + 2);
    const code = parseInt(part, 16);
    result += String.fromCharCode(code ^ 42);
  }
  return result;
}

// Initial Blockchain state
export const createGenesisBlock = (): Block => {
  const timestamp = new Date("2026-06-01T12:00:00.000Z").toLocaleString("fr-FR");
  const dataString = "GENESIS_BLOCK::SANTE_PLUS_PLATFORM_V1.0";
  const hash = calculateSHA256("0" + timestamp + "0" + dataString + "0");
  
  return {
    index: 0,
    timestamp,
    previousHash: "0000000000000000000000000000000000000000000000000000000000000000",
    hash,
    nonce: 42,
    transactions: [
      {
        type: "ACCOUNT_CREATED",
        details: "Lancement du réseau de santé décentralisé de Santé Plus",
        userId: "genesis",
        patientName: "Santé Plus Genesis",
        payloadHash: calculateSHA256(dataString),
      }
    ]
  };
};

// Mining simulation (returns details of mined block)
export function mineBlock(
  index: number,
  previousHash: string,
  transactions: Block["transactions"],
  difficulty: number = 3
): Promise<Block> {
  return new Promise((resolve) => {
    // Artificial timeout to show visual mining progress on screen
    setTimeout(() => {
      let nonce = 0;
      const timestamp = new Date().toLocaleString("fr-FR");
      const txsString = JSON.stringify(transactions);
      const targetPrefix = "0".repeat(difficulty);
      
      let hash = "";
      while (true) {
        hash = calculateSHA256(index + timestamp + previousHash + txsString + nonce);
        if (hash.startsWith(targetPrefix)) {
          break;
        }
        nonce++;
        if (nonce > 50000) {
          // Guard to prevent freezing in browser thread, lower target if exceeded
          break;
        }
      }

      resolve({
        index,
        timestamp,
        previousHash,
        hash,
        nonce,
        transactions,
      });
    }, 1500); // 1.5s delay for realistic premium animation
  });
}
