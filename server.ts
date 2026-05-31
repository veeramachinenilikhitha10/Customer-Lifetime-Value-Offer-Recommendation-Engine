/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import {
  dbInstance,
  generateSalt,
  hashPassword,
  generateToken,
  verifyToken,
} from "./server-db";
import { executeModelModeling } from "./server-ml";
import { Customer } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry user-agent header
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "apex-analytics-hub",
          },
        },
      });
    }
  }
  return aiClient;
}

// REST Authentication Middleware
interface CustomReq extends Request {
  user?: { id: string; email: string; name: string };
}

function authenticate(req: CustomReq, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. Valid session token is required." });
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Session expired or invalid. Please verify." });
  }
  req.user = payload;
  next();
}

// AUTH API ENDPOINTS

app.post("/api/auth/register", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Metadata criteria missing. Name, email, and password required." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUsers = dbInstance.getUsers();
  if (existingUsers.some(u => u.email === normalizedEmail)) {
    return res.status(400).json({ error: "Account mapping mismatch. Email address is already registered." });
  }

  const salt = generateSalt();
  const pHash = hashPassword(password, salt);

  const newUser = {
    id: `usr_${crypto.randomUUID()}`,
    name,
    email: normalizedEmail,
    role: "Analytics Strategist",
  };

  dbInstance.registerUser(newUser, pHash, salt);
  const token = generateToken(newUser);

  res.status(201).json({ user: newUser, token });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required credentials." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const users = dbInstance.getUsers();
  const user = users.find(u => u.email === normalizedEmail);
  const passwordsObj = dbInstance.getPasswords();

  if (!user || !passwordsObj[normalizedEmail]) {
    return res.status(401).json({ error: "Authentication footprint mismatch. Invalid credentials." });
  }

  const record = passwordsObj[normalizedEmail];
  const givenHash = hashPassword(password, record.salt);

  if (givenHash !== record.hash) {
    return res.status(401).json({ error: "Authentication footprint mismatch. Invalid credentials." });
  }

  const token = generateToken({ id: user.id, email: user.email, name: user.name });
  res.json({ user, token });
});

app.get("/api/auth/me", authenticate, (req: CustomReq, res) => {
  res.json({ user: req.user });
});

// CUSTOMERS API

app.get("/api/customers", authenticate, (req, res) => {
  const { search, segment } = req.query;
  let matches = dbInstance.getCustomers();

  if (segment && segment !== "All") {
    matches = matches.filter(c => c.segment === segment);
  }

  if (search) {
    const q = String(search).toLowerCase();
    matches = matches.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }

  res.json({ customers: matches });
});

app.get("/api/customers/:id", authenticate, (req, res) => {
  const { id } = req.params;
  const customers = dbInstance.getCustomers();
  const mainCust = customers.find(c => c.id === id);

  if (!mainCust) {
    return res.status(404).json({ error: "Requested customer profile not located." });
  }

  const allTransactions = dbInstance.getTransactions();
  const customerTransactions = allTransactions
    .filter(t => t.customerId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({
    customer: mainCust,
    transactions: customerTransactions,
  });
});

// OFFERS API

app.get("/api/offers", authenticate, (req, res) => {
  res.json({ offers: dbInstance.getOffers() });
});

// CAMPAIGNS API

app.get("/api/campaigns", authenticate, (req, res) => {
  res.json({ campaigns: dbInstance.getCampaigns() });
});

app.post("/api/campaigns/create", authenticate, (req, res) => {
  const { name, segment, variant, offerName, spend } = req.body;
  if (!name || !segment || !offerName) {
    return res.status(400).json({ error: "Missing required metadata parameters for campaign drafting." });
  }

  const currentOffers = dbInstance.getOffers();
  const offer = currentOffers.find(o => o.name === offerName) || currentOffers[0];

  // Calculate high quality realistic projections
  const budget = Number(spend) || 5000;
  const impressions = budget * 4;
  const clicks = Math.floor(impressions * 0.12);
  const conversions = Math.floor(clicks * 0.22);
  const estimatedRevenue = Number((conversions * offer.revenueImpact).toFixed(2));
  const estimatedROI = Number((((estimatedRevenue - budget) / budget) * 100).toFixed(1));

  const draftCampaign = {
    id: `camp_${Math.floor(Date.now() / 1000)}`,
    name,
    variant: variant || "Standard Variant",
    segment,
    offerName,
    impressions,
    clicks,
    conversions,
    spend: budget,
    revenue: estimatedRevenue,
    roi: estimatedROI,
    status: "Draft",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  } as any;

  const campaigns = dbInstance.getCampaigns();
  campaigns.unshift(draftCampaign);
  dbInstance.updateCampaigns(campaigns);

  res.status(201).json({ campaign: draftCampaign });
});

// AB TESTS API

app.get("/api/ab-tests", authenticate, (req, res) => {
  res.json({ abTests: dbInstance.getAbTests() });
});

app.post("/api/ab-tests/create", authenticate, (req, res) => {
  const { name, description, variantA, variantB, sizeA, sizeB } = req.body;
  if (!name || !variantA || !variantB) {
    return res.status(400).json({ error: "Experiment metrics creation requires test titles and option mapping names." });
  }

  const sampleSizeA = Math.max(100, Number(sizeA) || 1000);
  const sampleSizeB = Math.max(100, Number(sizeB) || 1000);

  // Math probability simulation for genuine differences
  const rateA = 0.10 + Math.random() * 0.04;
  const rateB = rateA * (1.05 + Math.random() * 0.2); // Elevate variant B slightly in simulation

  const convA = Math.floor(sampleSizeA * rateA);
  const convB = Math.floor(sampleSizeB * rateB);

  const realRateA = Number(((convA / sampleSizeA) * 100).toFixed(2));
  const realRateB = Number(((convB / sampleSizeB) * 100).toFixed(2));

  // Compute standard statistical significance P-Value using Z-Test for two proportions
  const pA = convA / sampleSizeA;
  const pB = convB / sampleSizeB;
  const pPooled = (convA + convB) / (sampleSizeA + sampleSizeB);
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / sampleSizeA + 1 / sampleSizeB));
  const zScore = se === 0 ? 0 : Math.abs(pA - pB) / se;

  // Derive normal CDF for two-tailed p-value calculation
  const pValueRaw = 2 * (1 - normalCDF(zScore));
  const pValue = Number(pValueRaw.toFixed(4));
  const significanceReached = pValue < 0.05;
  const uplift = Number((((realRateB - realRateA) / realRateA) * 100).toFixed(2));

  const draftTest = {
    id: `exp_${Math.floor(Date.now() / 1000)}`,
    name,
    description: description || "Statistical evaluation splitting target conversion rates.",
    metric: "Conversion Proportions",
    status: "Active",
    variantA: {
      name: variantA,
      conversions: convA,
      size: sampleSizeA,
      conversionRate: realRateA,
    },
    variantB: {
      name: variantB,
      conversions: convB,
      size: sampleSizeB,
      conversionRate: realRateB,
    },
    pValue,
    significanceReached,
    uplift,
    createdAt: new Date().toISOString(),
  } as any;

  const tests = dbInstance.getAbTests();
  tests.unshift(draftTest);
  dbInstance.updateAbTests(tests);

  res.status(201).json({ abTest: draftTest });
});

// Helper for Normal cumulative distribution function
function normalCDF(z: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;

  if (z >= 0.0) {
    const t = 1.0 / (1.0 + p * z);
    return (1.0 - c * Math.exp(-z * z / 2.0) * t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1));
  } else {
    const t = 1.0 / (1.0 - p * z);
    return (c * Math.exp(-z * z / 2.0) * t *
      (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1));
  }
}

// MODELS API

app.get("/api/models/performance", authenticate, (req, res) => {
  const customers = dbInstance.getCustomers();
  const evaluation = executeModelModeling(customers);

  res.json({
    models: evaluation.metrics,
    activeModelId: dbInstance.getActiveModelId(),
    lastRetrainedAt: dbInstance.getLastRetrainedAt(),
  });
});

app.post("/api/models/train", authenticate, (req, res) => {
  const { modelId } = req.body;
  if (!modelId || !["xgboost", "random_forest", "decision_tree"].includes(modelId)) {
    return res.status(400).json({ error: "Operational error. Invalid model identifier requested for training." });
  }

  const customers = dbInstance.getCustomers();
  const evaluation = executeModelModeling(customers);

  // Implement modeling updates dynamically in customers DB
  const updatedCustomers = customers.map(c => {
    const item = evaluation.clvUpdates.find(u => u.customerId === c.id);
    if (item) {
      // Slightly alter predicted CLV to match trained architecture patterns
      const offset = modelId === "xgboost" ? 1.0 : modelId === "random_forest" ? 0.94 : 0.86;
      return {
        ...c,
        predictedCLV: Number((item.predictedCLV * offset).toFixed(2)),
      };
    }
    return c;
  });

  dbInstance.updateCustomers(updatedCustomers);
  const trainedAt = new Date().toISOString();
  dbInstance.updateModelInfo(modelId, trainedAt);

  res.json({
    success: true,
    activeModelId: modelId,
    lastRetrainedAt: trainedAt,
    models: evaluation.metrics,
  });
});

// THEMATIC INTEL - PROMOTIONAL PREDICTIVE COPYWRITING ENGINE

app.post("/api/generate-offer-copy", authenticate, async (req, res) => {
  const { customerId, offerId } = req.body;
  if (!customerId || !offerId) {
    return res.status(400).json({ error: "Missing metadata. Customer and offer indices are required." });
  }

  const customers = dbInstance.getCustomers();
  const targetCust = customers.find(c => c.id === customerId);
  const offers = dbInstance.getOffers();
  const targetOffer = offers.find(o => o.id === offerId);

  if (!targetCust || !targetOffer) {
    return res.status(404).json({ error: "Requested asset references could not be localized." });
  }

  const gemini = getGeminiClient();

  if (!gemini) {
    // Dynamic fallbacks when no key exists
    const fallbackCopy = `Dear ${targetCust.name},\n\nWe wanted to thank you for representing a truly valued customer. As part of our segment benefits, we have custom-designed a promotion tailored specifically to your financial portfolio: **${targetOffer.name}**.\n\nDescription: ${targetOffer.description}\n\nThis promotional program is valid immediately for account transactions. Simply launch your customer hub page to activate and benefit.\n\nBest Regards,\nElizabeth Vance\nLead Analytics Strategist`;
    return res.json({
      copy: fallbackCopy,
      modelUsed: "Apex Standard Template Engine",
      note: "Cognitive writing credentials not fully configured. Defaulting to secure internal campaign template system.",
    });
  }

  try {
    const prompt = `Write a professional, encouraging marketing email to this high-value customer. The tone must be premium, highly respectful, corporate, personalized, and human (no clichés).
Customer Info:
- Name: ${targetCust.name}
- Age: ${targetCust.age}
- Customer Segment: ${targetCust.segment}
- Years of Account Tenure: ${targetCust.loyaltyYears}
- Total Asset Spend: $${targetCust.totalSpend}
- Average Order Value: $${targetCust.averageOrderValue}
- Predicted Lifetime Value: $${targetCust.predictedCLV}

Promotional Offer:
- Name: ${targetOffer.name}
- Offer Details: ${targetOffer.description}

Requirement:
- Address the customer personally.
- Directly detail why this offer (e.g., multiplier, cashback, VIP access) is highly suitable based on their actual relationship attributes.
- Maintain a concise, beautiful, enterprise marketing copy layout. Use professional email signature: 'Enterprise Analytics Team'.
Do not output metadata, annotations, code, or markdown blocks. Just output the clean professional email text.`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const generatedText = response.text || "Failed to generate copywriting copy.";
    res.json({
      copy: generatedText.trim(),
      modelUsed: "Apex Cognitive Engine v3.5",
    });
  } catch (err: any) {
    console.error("Predictive engine call failed:", err);
    res.status(500).json({ error: "Failed to query predictive model. Check endpoint availability.", details: err.message });
  }
});

// START EXPRESS + VITE SERVER MIDDLEWARE

async function start() {
  // Vite Integration
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
    console.log(`Server executing successfully on port http://0.0.0.0:${PORT}`);
  });
}

start();
