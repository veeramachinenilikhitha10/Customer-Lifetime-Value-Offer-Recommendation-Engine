/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Campaign, Offer } from "../types";
import { BarChart3, TrendingUp, AlertTriangle, Play, CheckCircle, FilePlus, X, Wallet, Signal, BarChart } from "lucide-react";

interface Props {
  campaigns: Campaign[];
  offers: Offer[];
  token: string | null;
  onCampaignCreated: (updatedCampaigns: Campaign[]) => void;
}

export default function CampaignPerformance({ campaigns, offers, token, onCampaignCreated }: Props) {
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Draft campaign simple form fields
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("Loyal Customers");
  const [variant, setVariant] = useState("A/B Smart Split");
  const [offerName, setOfferName] = useState(offers[0]?.name || "5x Loyalty Multiplier");
  const [spend, setSpend] = useState("5000");

  const segmentsList = ["High-Value Customers", "Loyal Customers", "Medium-Value Customers", "New Customers", "At-Risk Customers"];

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/campaigns/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          segment,
          variant,
          offerName,
          spend: Number(spend)
        })
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Enterprise campaigns service offline. Please try again shortly.");
      }

      const data = await res.json();
      if (res.ok) {
        // Redraw lists
        onCampaignCreated([data.campaign, ...campaigns]);
        setShowDraftModal(false);
        // Clear forms
        setName("");
        setSpend("5000");
      } else {
        setErrorMsg(data.error || "Failed checking parameters.");
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight text-slate-900 dark:text-slate-100">
            Campaign ROI & yield Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Oversee corporate conversion promotions, allocate budgets, and estimate expected business expansion yields.
          </p>
        </div>

        <button
          onClick={() => setShowDraftModal(true)}
          className="px-4.5 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
        >
          <FilePlus className="w-4 h-4" />
          <span>Draft New Campaign</span>
        </button>
      </div>

      {/* Campaigns Listing Grid */}
      <div className="grid grid-cols-1 gap-6">
        <div className="enterprise-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Active Marketing Portfolios
            </h3>
            <span className="font-mono text-xs text-slate-400">{campaigns.length} Active Campaigns</span>
          </div>

          <div className="overflow-x-auto text-[12px] text-slate-700 dark:text-slate-400">
            <table className="w-full text-left font-sans">
              <thead className="bg-slate-50 dark:bg-slate-950 font-bold uppercase tracking-wider text-[10px] text-slate-400">
                <tr>
                  <th className="p-4">Campaign metadata</th>
                  <th className="p-4">Applicable offer</th>
                  <th className="p-4 text-center">Impressions</th>
                  <th className="p-4 text-center">Clicks (CTR%)</th>
                  <th className="p-4 text-center">Conversions</th>
                  <th className="p-4 text-right">Budget Spend</th>
                  <th className="p-4 text-right">Forecast Yield</th>
                  <th className="p-4 text-right">ROI Ratio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-sans">
                {campaigns.map((camp) => {
                  const ctr = camp.impressions ? ((camp.clicks / camp.impressions) * 100).toFixed(1) : "0.0";
                  const cRate = camp.clicks ? ((camp.conversions / camp.clicks) * 100).toFixed(1) : "0.0";
                  const roiColor = camp.roi > 300 ? "text-emerald-500 font-bold" : camp.roi > 100 ? "text-indigo-500 font-bold" : "text-amber-500 font-semibold";
                  return (
                    <tr key={camp.id} className="hover:bg-slate-50/50 hover:dark:bg-slate-950/20">
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-slate-200">{camp.name}</span>
                            <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded leading-none ${camp.status === "Completed" ? "bg-slate-100 text-slate-500" : camp.status === "Active" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                              {camp.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 font-mono">Cohort: {camp.segment}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-350">{camp.offerName}</span>
                          <span className="block text-[10px] text-zinc-400">Variant: {camp.variant}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono font-medium text-slate-800 dark:text-slate-300">
                        {camp.impressions.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <div className="font-mono">
                          <span className="block text-slate-800 dark:text-slate-300 font-medium">{camp.clicks.toLocaleString()}</span>
                          <span className="text-[9.5px] text-slate-400">({ctr}%)</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-mono">
                        <span className="block text-slate-800 dark:text-slate-300 font-medium">{camp.conversions.toLocaleString()}</span>
                        <span className="text-[9.5px] text-slate-400">({cRate}%)</span>
                      </td>
                      <td className="p-4 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                        ${camp.spend.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-mono font-semibold text-slate-900 dark:text-slate-100">
                        ${camp.revenue.toLocaleString()}
                      </td>
                      <td className={`p-4 text-right font-mono ${roiColor}`}>
                        +{camp.roi}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Draft New Campaign Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-950 text-white">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4.5 h-4.5 text-emerald-400" />
                <h3 className="font-bold text-sm">Draft dynamic promotional Campaign</h3>
              </div>
              <button
                onClick={() => setShowDraftModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs rounded">
                  <p className="font-semibold">{errorMsg}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-455 block tracking-wide">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Wealth Expansion Portfolio"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-455 block tracking-wide">Target Segment Cohort</label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    {segmentsList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-455 block tracking-wide">Campaign Variant</label>
                  <input
                    type="text"
                    required
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    placeholder="A/B Smart Split"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-455 block tracking-wide">Corporate Business Offer</label>
                  <select
                    value={offerName}
                    onChange={(e) => setOfferName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    {offers.map((offer) => (
                      <option key={offer.id} value={offer.name}>
                        {offer.name} (${offer.revenueImpact} Rev)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-455 block tracking-wide">Target budget spend ($)</label>
                  <input
                    type="number"
                    required
                    value={spend}
                    onChange={(e) => setSpend(e.target.value)}
                    min="100"
                    placeholder="5000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="bg-indigo-50/25 dark:bg-slate-950 p-4 border border-indigo-200/20 dark:border-slate-850 rounded-xl mt-4 font-sans text-xs">
                <p className="text-slate-500 leading-normal">
                  💡 <strong>Simulator Insight:</strong> Predictions represent standard click matrices. ROI calculations are compiled automatically over historical sector conversion patterns.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDraftModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Simulating...</span>
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Launch Campaign</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
