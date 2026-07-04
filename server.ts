import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Lazy-loaded Gemini client to prevent startup crashes if API key is not set
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 1. Assistant Chat Route using @google/genai SDK
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Le message est requis." });
    }

    const ai = getGeminiClient();

    // Prepare history format
    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.text }],
    }));

    // Start a chat session with system instruction
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: `Vous êtes l'assistant d'accueil virtuel de "Santé Plus", une plateforme de santé innovante et ultra-sécurisée. 
Votre rôle est d'aider les utilisateurs à comprendre l'application, l'infrastructure de sécurité, et à répondre à leurs questions de santé de manière bienveillante mais professionnelle.

Informations clés sur Santé Plus pour guider vos réponses :
1. Sécurité Blockchain : Le dossier médical de l'utilisateur n'est pas simplement stocké. Chaque fichier, prescription ou compte-rendu médical est chiffré localement (chiffrement symétrique fort) et son empreinte numérique (hash SHA-256) est ancrée de manière immuable sur un registre décentralisé inspiré de la blockchain Bitcoin. Cela garantit l'intégrité absolue, l'infalsifiabilité et l'auditabilité totale des données. Personne, pas même les administrateurs, ne peut modifier un dossier sans laisser de trace.
2. Création de Compte : L'utilisateur crée son compte avec son Nom, Prénom, adresse Gmail, date de naissance, groupe sanguin et numéro de téléphone. Un trousseau de clés cryptographiques unique lui est généré pour son dossier personnel.
3. Recommandation d'Hôpitaux et Localisation : L'application utilise la géolocalisation GPS en temps réel du navigateur pour chercher, filtrer et trier automatiquement les hôpitaux partenaires les plus proches de sa position. Elle affiche la distance exacte (en km), les spécialités (cardiologie, pédiatrie, urgences, maternité, etc.), le temps de trajet estimé, et permet de prendre rendez-vous directement.
4. Prise de Rendez-vous et Paiement : L'utilisateur peut choisir un créneau libre chez un médecin d'un hôpital partenaire, effectuer un paiement en ligne sécurisé (simulé via carte de crédit, Apple Pay ou Bitcoin), recevoir un reçu officiel et enregistrer l'autorisation de consultation dans son registre blockchain sécurisé.
5. Autonomie utilisateur : Si un utilisateur ne maîtrise pas complètement l'informatique ou l'infrastructure, rassurez-le avec des explications claires et simples, sans jargon complexe.

Conseils de réponse : Soyez concis, rassurant, professionnel et formulez vos réponses en français. Rappelez que vous êtes un assistant virtuel et que les urgences vitales doivent contacter le 15 ou le 112 directement.`,
      },
      history: formattedHistory,
    });

    const response = await chat.sendMessage({ message });
    const text = response.text || "Désolé, je n'ai pas pu générer de réponse.";
    
    res.json({ text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ 
      error: "Une erreur est survenue lors du traitement de votre demande avec l'IA.",
      details: error.message 
    });
  }
});

// Bitcoin / Lightning API Routes
app.post("/api/bitcoin/create-invoice", async (req, res) => {
  try {
    const { appointmentId, hospitalName, specialty, amountEur, method, patientName } = req.body;

    if (!appointmentId || !amountEur) {
      return res.status(400).json({ error: "Données manquantes" });
    }

    const amountSats = Math.round(amountEur * 230);

    // Si LNbits est configuré, on délègue
    const lnbitsUrl = process.env.LNBITS_URL;
    const lnbitsKey = process.env.LNBITS_INVOICE_KEY;

    if (lnbitsUrl && lnbitsKey && method === "lightning") {
      try {
        const invoiceRes = await fetch(`${lnbitsUrl}/api/v1/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": lnbitsKey,
          },
          body: JSON.stringify({
            out: false,
            amount: amountSats,
            memo: `Santé Plus - ${patientName} - ${specialty} @ ${hospitalName}`,
          }),
        });

        if (!invoiceRes.ok) throw new Error("LNbits invoice failed");
        const invoiceData = await invoiceRes.json();

        return res.json({
          success: true,
          paymentIntentId: `int-${Date.now()}`,
          amountSats,
          bolt11: invoiceData.payment_request,
          invoiceId: invoiceData.checking_id,
        });
      } catch (lnErr) {
        console.warn("LNbits failed, fallback mock:", lnErr);
      }
    }

    // Fallback: Mock invoice pour démo
    const mockId = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const mockBolt11 = `lnbc${amountSats * 1000}u1p${Array.from(crypto.getRandomValues(new Uint8Array(30))).map((b: number) => "qpzry9x8gf2tvdw0s3jn54khce6mua7l"[b % 34]).join("").slice(0, 90)}`;

    return res.json({
      success: true,
      paymentIntentId: mockId,
      amountSats,
      bolt11: mockBolt11,
      invoiceId: mockId,
    });
  } catch (err: any) {
    console.error("/api/bitcoin/create-invoice error:", err);
    res.status(500).json({ error: err.message || "Erreur serveur" });
  }
});

app.get("/api/bitcoin/status/:paymentIntentId", (req, res) => {
  const { paymentIntentId } = req.params;
  res.json({
    status: "pending",
    paymentHash: undefined,
    paidAt: undefined,
    paymentIntentId,
  });
});

app.get("/api/bitcoin/address", (req, res) => {
  const address = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
  res.json({ address });
});

app.get("/api/bitcoin/balance", (req, res) => {
  res.json({ balanceSats: 345000 });
});

// 2. Hospital Recommendation Route based on location
// Returns a list of reference hospitals that the client can project or shift based on user's actual GPS location.
app.get("/api/hospitals", (req, res) => {
  // We return base hospitals with relative coordinates or templates.
  // The frontend can dynamically adjust these coordinates to be near the user's real coordinates!
  const referenceHospitals = [
    {
      id: "hosp-1",
      name: "CHU de Cotonou - Centre Hospitalier Universitaire",
      specialties: ["Urgences 24/7", "Cardiologie", "Pédiatrie", "Médecine Générale"],
      rating: 4.8,
      address: "Avenue Jean-Paul II, Cotonou",
      phone: "+229 21 30 00 00",
      fees: { consultation: 15000, emergency: 30000 },
      latOffset: 0.008,
      lngOffset: -0.012,
      image: "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "hosp-2",
      name: "Clinique de l'Espérance - Cotonou",
      specialties: ["Maternité", "Gynécologie", "Radiologie", "Ostéopathie"],
      rating: 4.6,
      address: "Rue du Faubourg Saint-Antoine, Cotonou",
      phone: "+229 21 30 10 00",
      fees: { consultation: 20000, emergency: 40000 },
      latOffset: -0.015,
      lngOffset: 0.009,
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "hosp-3",
      name: "Institut Cardio-Vasculaire de Porto-Novo",
      specialties: ["Cardiologie", "Chirurgie Thoracique", "Réadaptation"],
      rating: 4.9,
      address: "Boulevard de l'Hôpital, Porto-Novo",
      phone: "+229 20 25 00 00",
      fees: { consultation: 25000, emergency: 50000 },
      latOffset: 0.021,
      lngOffset: 0.018,
      image: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "hosp-4",
      name: "Hôpital Saint-Jean de Parakou",
      specialties: ["Ophtalmologie", "ORL", "Chirurgie Ambulatoire", "Dermatologie"],
      rating: 4.4,
      address: "Avenue Kléber, Parakou",
      phone: "+229 23 40 00 00",
      fees: { consultation: 18000, emergency: 35000 },
      latOffset: -0.005,
      lngOffset: -0.022,
      image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: "hosp-5",
      name: "Centre Médical Pédiatrique de Bohicon",
      specialties: ["Pédiatrie", "Vaccination", "Psychologie", "Nutrition"],
      rating: 4.7,
      address: "Rue des Écoles, Bohicon",
      phone: "+229 22 50 00 00",
      fees: { consultation: 12000, emergency: 25000 },
      latOffset: 0.012,
      lngOffset: -0.005,
      image: "https://images.unsplash.com/photo-1504813184591-01552ff317ff?auto=format&fit=crop&q=80&w=400",
    },
  ];
  res.json(referenceHospitals);
});

// Vite Middleware & Static Files integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
