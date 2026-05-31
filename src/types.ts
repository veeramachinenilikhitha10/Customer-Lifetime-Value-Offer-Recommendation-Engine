/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  gender: string;
  age: number;
  segment: "High-Value" | "Loyal" | "Medium-Value" | "New" | "At-Risk";
  loyaltyYears: number;
  totalSpend: number;
  totalTransactions: number;
  averageOrderValue: number;
  recencyDays: number;
  predictedCLV: number;
  actualCLV: number;
  riskScore: number; // 0 to 1
  recommendedOfferId: string;
  recommendedOfferName: string;
  acceptanceProb: number; // 0 to 1
  explainableFactors: string[];
  featureImportance: Record<string, number>;
  createdAt: string;
  // Authentic Kaggle Bank Churn and Segmentation variables
  creditScore?: number;
  geography?: string;
  estimatedSalary?: number;
  balance?: number;
  hasCrCard?: boolean;
  isActiveMember?: boolean;
}

export interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  category: "Digital" | "Retail" | "Mobile" | "Enterprise" | "Direct";
  channel: "Email" | "In-App" | "Social" | "Direct" | "SMS";
  date: string;
}

export interface Campaign {
  id: string;
  name: string;
  variant: string;
  segment: string;
  offerName: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  roi: number;
  status: "Active" | "Completed" | "Draft";
  startDate: string;
  endDate: string;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  metric: string;
  status: "Active" | "Completed" | "Draft";
  variantA: {
    name: string;
    conversions: number;
    size: number;
    conversionRate: number;
  };
  variantB: {
    name: string;
    conversions: number;
    size: number;
    conversionRate: number;
  };
  pValue: number;
  significanceReached: boolean;
  uplift: number; // Uplift percentage
  createdAt: string;
}

export interface Offer {
  id: string;
  name: string;
  type: "Discount" | "Cashback" | "LoyaltyPoints" | "FreeUpgrade" | "PremiumGift";
  discount: number;
  minSpend: number;
  description: string;
  revenueImpact: number;
}

export interface FeatureImportanceItem {
  feature: string;
  importance: number;
}

export interface ModelPerformance {
  id: "xgboost" | "random_forest" | "decision_tree";
  name: string;
  mae: number;
  rmse: number;
  r2: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainingTimeMs: number;
  featureImportances: FeatureImportanceItem[];
}

export interface ModelComparisonData {
  models: ModelPerformance[];
  activeModelId: string;
  lastRetrainedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
