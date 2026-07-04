export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: string;
  bloodType: string;
  publicKey: string;
  hasAccount: boolean;
}

export interface MedicalRecord {
  id: string;
  title: string;
  category: "Consultation" | "Ordonnance" | "Analyse" | "Imagerie" | "Vaccin";
  doctor: string;
  hospital: string;
  date: string;
  details: string;
  attachments?: { name: string; size: string; type: string }[];
  isEncrypted: boolean;
  blockIndex?: number;
  blockHash?: string;
}

export interface Block {
  index: number;
  timestamp: string;
  previousHash: string;
  hash: string;
  nonce: number;
  transactions: {
    type: "ACCOUNT_CREATED" | "MEDICAL_RECORD_ADDED" | "PAYMENT_COMPLETED" | "APPOINTMENT_BOOKED" | "EMERGENCY_TICKET_CREATED" | "SMART_PAYMENT_SETTLED";
    details: string;
    userId: string;
    patientName: string;
    payloadHash: string;
  }[];
}

export interface Hospital {
  id: string;
  name: string;
  specialties: string[];
  rating: number;
  address: string;
  phone: string;
  fees: { consultation: number; emergency: number };
  latOffset: number;
  lngOffset: number;
  image: string;
  distance?: number; // calculated dynamically
  travelTime?: number; // calculated dynamically
}

export interface Appointment {
  id: string;
  hospitalId: string;
  hospitalName: string;
  specialty: string;
  date: string;
  time: string;
  fees: number;
  isPaid: boolean;
  status: "Confirmed" | "Pending Payment" | "Completed";
  patientName: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export interface BitcoinPaymentIntent {
  id: string;
  appointmentId: string;
  hospitalName: string;
  specialty: string;
  amountEur: number;
  amountSats: number;
  status: "pending" | "paid" | "expired" | "failed";
  paymentMethod: "lightning" | "onchain";
  invoice?: string;
  paymentHash?: string;
  bolt11?: string;
  address?: string;
  createdAt: string;
  paidAt?: string;
}

export interface WalletInfo {
  isConnected: boolean;
  provider?: string;
  balanceSats?: number;
  address?: string;
  publicKey?: string;
}

export interface LNbitsInvoice {
  payment_hash: string;
  payment_request: string;
  checking_id: string;
  lnurl_response?: string;
  paid?: boolean;
}

