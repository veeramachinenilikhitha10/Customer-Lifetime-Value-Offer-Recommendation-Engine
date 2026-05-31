/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Customer, Transaction, Campaign, ABTest, Offer, User, ModelComparisonData } from "./src/types";

const DB_FILE = path.join(process.cwd(), "db.json");

interface DatabaseSchema {
  users: User[];
  passwords: Record<string, { hash: string; salt: string }>;
  customers: Customer[];
  transactions: Transaction[];
  campaigns: Campaign[];
  abTests: ABTest[];
  offers: Offer[];
  activeModelId: string;
  lastRetrainedAt: string;
}

// Pre-seeded business offers
const MARKETING_OFFERS: Offer[] = [
  {
    id: "promo_points_5x",
    name: "5x Loyalty Multiplier",
    type: "LoyaltyPoints",
    discount: 0,
    minSpend: 150,
    description: "Earn five times the reward points on all transactions exceeds $150 over the next 30 days.",
    revenueImpact: 45.5,
  },
  {
    id: "promo_cashback_15",
    name: "15% Portfolio Cashback",
    type: "Cashback",
    discount: 15,
    minSpend: 500,
    description: "Receive 15% immediate cashback on direct-investment or retail purchase transactions.",
    revenueImpact: 120.0,
  },
  {
    id: "promo_elite_upgrade",
    name: "Platinum Suite Upgrade",
    type: "FreeUpgrade",
    discount: 0,
    minSpend: 1000,
    description: "Upgrade containing free personalized financial advice and waive transaction fee limits for 1 year.",
    revenueImpact: 350.0,
  },
  {
    id: "promo_direct_discount_50",
    name: "$50 Flat Account Bonus",
    type: "Discount",
    discount: 50,
    minSpend: 200,
    description: "Get an immediate $50 credit voucher valid for transactions using digital or mobile wallets.",
    revenueImpact: 25.0,
  },
  {
    id: "promo_premium_gift",
    name: "VIP Wealth Advisory Pass",
    type: "PremiumGift",
    discount: 0,
    minSpend: 2500,
    description: "One-on-one session with top tier retail wealth management strategists plus physical premium leather card wallet.",
    revenueImpact: 750.0,
  },
];

// Helper to hash passwords using PBKDF2
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

// Secure Token Service (stateless signatures behaving like JWT)
const JWT_SECRET = crypto.createHash("sha256").update(process.env.GEMINI_API_KEY || "fallback_clv_jwt_secret_token_key").digest("hex");

export function generateToken(payload: { id: string; email: string; name: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24; // 24 Hours
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signPayload = `${header}.${body}`;
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(signPayload).digest("base64url");
  return `${signPayload}.${signature}`;
}

export function verifyToken(token: string): { id: string; email: string; name: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

class Database {
  private schema: DatabaseSchema;

  constructor() {
    this.schema = {
      users: [],
      passwords: {},
      customers: [],
      transactions: [],
      campaigns: [],
      abTests: [],
      offers: MARKETING_OFFERS,
      activeModelId: "random_forest",
      lastRetrainedAt: new Date().toISOString(),
    };
    this.load();
  }

  private load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        this.schema = { ...this.schema, ...parsed };
      } catch (err) {
        console.error("Database reading error, resetting database:", err);
        this.save();
      }
    } else {
      this.seedInitialData();
      this.save();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), "utf-8");
    } catch (err) {
      console.error("Database saving error:", err);
    }
  }

  public getUsers() { return this.schema.users; }
  public getPasswords() { return this.schema.passwords; }
  public getCustomers() { return this.schema.customers; }
  public getTransactions() { return this.schema.transactions; }
  public getCampaigns() { return this.schema.campaigns; }
  public getAbTests() { return this.schema.abTests; }
  public getOffers() { return this.schema.offers; }
  public getActiveModelId() { return this.schema.activeModelId; }
  public getLastRetrainedAt() { return this.schema.lastRetrainedAt; }

  public updateCustomers(customers: Customer[]) {
    this.schema.customers = customers;
    this.save();
  }

  public updateCampaigns(campaigns: Campaign[]) {
    this.schema.campaigns = campaigns;
    this.save();
  }

  public updateAbTests(abTests: ABTest[]) {
    this.schema.abTests = abTests;
    this.save();
  }

  public updateModelInfo(activeModelId: string, lastRetrainedAt: string) {
    this.schema.activeModelId = activeModelId;
    this.schema.lastRetrainedAt = lastRetrainedAt;
    this.save();
  }

  public registerUser(user: User, passwordHash: string, salt: string) {
    this.schema.users.push(user);
    this.schema.passwords[user.email] = { hash: passwordHash, salt };
    this.save();
    return user;
  }

  private seedInitialData() {
    // 1. Seed enterprise users
    const salt = generateSalt();
    const demoUserPass = "enterprise2026";
    const demoUserHash = hashPassword(demoUserPass, salt);

    const defaultUser: User = {
      id: "usr_executive_1",
      name: "Elizabeth Vance",
      email: "vance.e@enterprise-intelligence.com",
      role: "Lead Analytics Strategist",
    };

    this.schema.users = [defaultUser];
    this.schema.passwords[defaultUser.email] = { hash: demoUserHash, salt };

    // 2. Generate detailed professional customers
    const lastNames = ["Chen", "Rodriguez", "O'Connor", "Sato", "Fischer", "Adebayor", "Gomez", "Kowalski", "Fontaine", "Petrov", "Macdonald", "Al-Farsi", "Venkatesh", "Zhang", "Hansen", "Moreau"];
    const firstNames = ["Marcus", "Sarah", "Yuki", "Elena", "Dmitri", "Amara", "Carlos", "Chloe", "William", "Zari", "Aarav", "Sofia", "Kenji", "Isabella", "Siddharth", "Laura"];
    const categories = ["Digital", "Retail", "Mobile", "Enterprise", "Direct"] as const;
    const channels = ["Email", "In-App", "Social", "Direct", "SMS"] as const;

    const customers: Customer[] = [];
    const transactions: Transaction[] = [];

    // Helper functions for seeding logical features
    for (let i = 1; i <= 50; i++) {
      const idx = i - 1;
      const fName = firstNames[idx % firstNames.length];
      const lName = lastNames[idx % lastNames.length];
      const name = `${fName} ${lName}`;
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${10 + idx}@analyticscorp.com`;
      const age = 22 + (idx * 7) % 55;
      const gender = idx % 2 === 0 ? "Female" : "Male";
      const loyaltyYears = Math.max(1, (idx * 3) % 11);

      // Create synthetic transaction histories to dictate standard ML properties
      const transactionCount = 5 + (idx * 4) % 35;
      let totalSpend = 0;
      const custId = `cust_${1000 + i}`;
      const custTransactions: Transaction[] = [];

      for (let t = 1; t <= transactionCount; t++) {
        const transId = `tx_${custId}_${t}`;
        // Base transaction size tied to segment clusters logically
        const multiplier = (i % 5 === 0) ? 4.5 : (i % 3 === 0) ? 2.5 : 1.1;
        const amount = Number((20 + ((t * 13) % 200) * multiplier).toFixed(2));
        totalSpend += amount;

        const date = new Date(Date.now() - (t * (3 + (i % 12))) * 24 * 60 * 60 * 1000);

        const transaction: Transaction = {
          id: transId,
          customerId: custId,
          amount,
          category: categories[t % categories.length],
          channel: channels[t % channels.length],
          date: date.toISOString(),
        };
        custTransactions.push(transaction);
        transactions.push(transaction);
      }

      // Calculate behavioral aggregates
      const avgSpend = Number((totalSpend / transactionCount).toFixed(2));
      const recency = Math.max(2, (idx * 17) % 180);

      // Logical business segmentation
      let segment: Customer["segment"] = "Medium-Value";
      if (totalSpend > 2500) {
        segment = "High-Value";
      } else if (recency > 110 && loyaltyYears > 3) {
        segment = "At-Risk";
      } else if (loyaltyYears >= 5 && transactionCount > 15) {
        segment = "Loyal";
      } else if (transactionCount <= 6 && recency < 30) {
        segment = "New";
      }

      // Logical target offer selection
      let bestOffer = MARKETING_OFFERS[idx % MARKETING_OFFERS.length];
      if (segment === "High-Value") {
        bestOffer = MARKETING_OFFERS[4]; // Premium gift VIP wealth pass
      } else if (segment === "At-Risk") {
        bestOffer = MARKETING_OFFERS[1]; // 15% cashback
      } else if (segment === "New") {
        bestOffer = MARKETING_OFFERS[3]; // $50 flat bonus
      } else if (segment === "Loyal") {
        bestOffer = MARKETING_OFFERS[0]; // 5x loyalty points
      }

      // Base CLV calculations
      const simpleActualCLV = Number((totalSpend * (0.8 + loyaltyYears * 0.15)).toFixed(2));
      // XGBoost / RF mock errors will generate differences inside the ML pipeline
      const errorFactor = 0.95 + ((i * 7) % 11) / 100;
      const simplePredCLV = Number((simpleActualCLV * errorFactor).toFixed(2));

      // Calculate risk scores
      const riskScore = Number(Math.min(0.98, Math.max(0.02, (recency / 210) * (segment === "At-Risk" ? 1.5 : 0.8))).toFixed(3));

      // Recommended Offer Acceptance Probability
      let acceptanceProb = 0.15 + (loyaltyYears * 0.05) + (segment === "At-Risk" ? 0.35 : 0.15) - (riskScore * 0.2);
      acceptanceProb = Number(Math.min(0.95, Math.max(0.05, acceptanceProb)).toFixed(3));

      // Model explainability features
      const factorsMap: Record<string, string[]> = {
        "High-Value": ["Sustained transactional size", "Extremely low attrition probability", "High conversion history"],
        "Loyal": ["Tenured account presence", "Frequent recursive transactions", "Favorable brand affinity"],
        "Medium-Value": ["Steady purchase velocity", "Intermittent discount responses", "Stable engagement"],
        "New": ["Substantial short-term spend activity", "Untapped vertical expansion path", "Initial campaign interest"],
        "At-Risk": ["High elapsed recency period", "Spike in competitor switching indicators", "Stagnant service portfolio utilization"],
      };

      // Real-world Kaggle Bank Churn and Segmentation variables
      const creditScore = Math.floor(520 + ((idx * 13) % 330)); // 520 to 850
      const countries = ["France", "Germany", "Spain"];
      const geography = countries[idx % countries.length];
      const estimatedSalary = Number((38000 + ((idx * 3241) % 145000)).toFixed(2));
      const balance = (idx % 7 === 0) ? 0 : Number((15000 + ((idx * 7321) % 195000)).toFixed(2));
      const hasCrCard = (idx % 4) !== 0;
      const isActiveMember = (idx % 2 === 0) && segment !== "At-Risk";

      customers.push({
        id: custId,
        name,
        email,
        gender,
        age,
        segment,
        loyaltyYears,
        totalSpend: Number(totalSpend.toFixed(2)),
        totalTransactions: transactionCount,
        averageOrderValue: avgSpend,
        recencyDays: recency,
        actualCLV: simpleActualCLV,
        predictedCLV: simplePredCLV,
        riskScore,
        recommendedOfferId: bestOffer.id,
        recommendedOfferName: bestOffer.name,
        acceptanceProb,
        explainableFactors: factorsMap[segment] || ["Consistent transaction limits"],
        featureImportance: {
          totalSpend: 0.38,
          totalTransactions: 0.22,
          recencyDays: 0.20,
          loyaltyYears: 0.12,
          age: 0.08,
        },
        createdAt: new Date(Date.now() - loyaltyYears * 365 * 24 * 60 * 60 * 1000).toISOString(),
        creditScore,
        geography,
        estimatedSalary,
        balance,
        hasCrCard,
        isActiveMember,
      });
    }

    this.schema.customers = customers;
    this.schema.transactions = transactions;

    // 3. Seed Campaigns to calculate ROI, Conversion, Spend & Revenue
    this.schema.campaigns = [
      {
        id: "camp_q1_loyalty",
        name: "Q1 Loyalty Maximization",
        variant: "5x Points Booster",
        segment: "Loyal Customers",
        offerName: "5x Loyalty Multiplier",
        impressions: 42000,
        clicks: 8400,
        conversions: 2520, // 30% Click-to-conversion
        spend: 15200,
        revenue: 114660, // Enormous ROI
        roi: 654.3,
        status: "Completed",
        startDate: "2026-01-10T00:00:00Z",
        endDate: "2026-02-15T00:00:00Z",
      },
      {
        id: "camp_q2_cashback",
        name: "Q2 Cashback Promotion",
        variant: "15% Portfolio Recovery",
        segment: "At-Risk Customers",
        offerName: "15% Portfolio Cashback",
        impressions: 28000,
        clicks: 4500,
        conversions: 980, // ~22%
        spend: 25000,
        revenue: 117600,
        roi: 370.4,
        status: "Active",
        startDate: "2026-04-01T00:00:00Z",
        endDate: "2026-06-15T00:00:00Z",
      },
      {
        id: "camp_q2_premium_advisor",
        name: "Wealth Advisory VIP Circle",
        variant: "High Net-Worth VIP Wealth Advisory Pass",
        segment: "High-Value Customers",
        offerName: "VIP Wealth Advisory Pass",
        impressions: 12000,
        clicks: 1800,
        conversions: 630, // 35%
        spend: 38000,
        revenue: 472500, // Mammoth Revenue
        roi: 1143.4,
        status: "Active",
        startDate: "2026-05-01T00:00:00Z",
        endDate: "2026-07-30T00:00:00Z",
      },
      {
        id: "camp_q3_digital_wallet",
        name: "Mobile Wallet Trial Acquisition",
        variant: "$50 Credit Incentive",
        segment: "New Customers",
        offerName: "$50 Flat Account Bonus",
        impressions: 65000,
        clicks: 13000,
        conversions: 1950,
        spend: 97500,
        revenue: 146250,
        roi: 50.0,
        status: "Draft",
        startDate: "2026-08-01T00:00:00Z",
        endDate: "2026-09-15T00:00:00Z",
      },
    ];

    // 4. Seed A/B Testing Experiments
    this.schema.abTests = [
      {
        id: "exp_wealth_advisory_v1",
        name: "Wealth Advisory Landing page Split Test",
        description: "Comparative visual metrics mapping Conversions for the VIP Wealth Advisory Offer: Variant A utilizes analytical feature breakdowns, Variant B uses personalized relational storytelling.",
        metric: "Conversion Rate",
        status: "Completed",
        variantA: {
          name: "Analytical Features Matrix (Control)",
          conversions: 145,
          size: 1200,
          conversionRate: 12.08,
        },
        variantB: {
          name: "Personalized Wealth Narrative (Test)",
          conversions: 192,
          size: 1250,
          conversionRate: 15.36,
        },
        pValue: 0.0165, // Statistical significance (p < 0.05)
        significanceReached: true,
        uplift: 27.15,
        createdAt: "2026-02-15T09:00:00Z",
      },
      {
        id: "exp_loyalty_header_v2",
        name: "Loyalty 5x Points Multiplier Header Imagery",
        description: "Testing banner graphics on the customer portal dashboard: Variant A features a corporate dark minimalist graph, Variant B displays active human financial collaboration.",
        metric: "Banner Click-Through Rate",
        status: "Active",
        variantA: {
          name: "Corporate Minimalist Graph (Control)",
          conversions: 94,
          size: 850,
          conversionRate: 11.06,
        },
        variantB: {
          name: "Active Financial Teamwork (Test)",
          conversions: 104,
          size: 860,
          conversionRate: 12.09,
        },
        pValue: 0.4851, // Not statistically significant
        significanceReached: false,
        uplift: 9.31,
        createdAt: "2026-05-10T11:30:00Z",
      },
    ];
  }
}

export const dbInstance = new Database();
