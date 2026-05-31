/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Customer, Transaction, Offer } from "../types";
import {
  Search,
  Filter,
  User,
  Activity,
  History,
  TrendingUp,
  AlertOctagon,
  Cpu,
  Mail,
  Copy,
  Check,
  X,
  CreditCard,
  ChevronRight,
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
  Globe
} from "lucide-react";

interface Props {
  customers: Customer[];
  offers: Offer[];
  token: string | null;
  onRefreshCustomers: () => void;
}

export default function CustomerProfiles({ customers, offers, token, onRefreshCustomers }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSegment, setSelectedSegment] = useState<string>("All");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Tailored campaign copywriting state
  const [isWritingCopy, setIsWritingCopy] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState(false);
  const [geminiModel, setGeminiModel] = useState<string>("");

  // Target Offers mapped list
  const [activeOfferTarget, setActiveOfferTarget] = useState<string>("");

  // Synchronously set initial recommended offer on customer change
  useEffect(() => {
    if (selectedCustomer) {
      setActiveOfferTarget(selectedCustomer.recommendedOfferId);
      setGeneratedLetter(null);
    }
  }, [selectedCustomer]);

  // Load customer transaction logs asynchronously
  const fetchCustomerDetails = async (id: string) => {
    setLoadingDetails(true);
    setTransactions([]);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server responded with a non-JSON index. Server is currently reloading.");
      }
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed loading transaction history:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSelectCustomer = (cust: Customer) => {
    setSelectedCustomer(cust);
    fetchCustomerDetails(cust.id);
  };

  const handleCopyClipboard = () => {
    if (generatedLetter) {
      navigator.clipboard.writeText(generatedLetter);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
  };

  const triggerTailoredEmailCopy = async () => {
    if (!selectedCustomer || !activeOfferTarget) return;
    setIsWritingCopy(true);
    setGeneratedLetter(null);
    try {
      const res = await fetch("/api/generate-offer-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          offerId: activeOfferTarget,
        }),
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("The writing helper is temporarily offline due to a deployment restart. Please try again soon.");
      }
      const data = await res.json();
      if (res.ok) {
        setGeneratedLetter(data.copy);
        setGeminiModel(data.modelUsed);
      } else {
        setGeneratedLetter(`Server Error: ${data.error || "Failed loading data"}`);
      }
    } catch (err: any) {
      setGeneratedLetter(`Error capturing system recommendations: ${err.message}`);
    } finally {
      setIsWritingCopy(false);
    }
  };

  // Segment cohorts configuration
  const segmentOptions = ["All", "High-Value", "Loyal", "Medium-Value", "New", "At-Risk"];

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = selectedSegment === "All" || c.segment === selectedSegment;
    return matchesSearch && matchesSegment;
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Index Column: Customer list searches */}
      <div className="xl:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col h-full shadow-xs">
        <div className="space-y-4 mb-4">
          <h3 className="text-sm font-bold font-sans uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Managed Client database
          </h3>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, ID, domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-250 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <div className="relative">
              <select
                value={selectedSegment}
                onChange={(e) => setSelectedSegment(e.target.value)}
                className="pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-250 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
              >
                {segmentOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
                <Filter className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Index Records list scrollable */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-slate-400">No customer records matches filter footprint.</p>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isSelected = selectedCustomer?.id === cust.id;
              const segmentColors = {
                "High-Value": "bg-emerald-50 text-emerald-700 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800/40",
                "Loyal": "bg-blue-50 text-blue-700 border-blue-200/50 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-800/40",
                "Medium-Value": "bg-purple-50 text-purple-700 border-purple-200/50 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-800/40",
                "New": "bg-cyan-50 text-cyan-700 border-cyan-200/50 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-800/40",
                "At-Risk": "bg-rose-50 text-rose-700 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800/40",
              };
              return (
                <div
                  key={cust.id}
                  onClick={() => handleSelectCustomer(cust)}
                  className={`p-3.5 border rounded-xl flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? "bg-slate-50 border-emerald-500 dark:bg-slate-950 dark:border-emerald-400"
                      : "bg-white hover:bg-slate-50 border-slate-100 dark:bg-slate-900 hover:dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {cust.name}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${segmentColors[cust.segment]}`}>
                        {cust.segment}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      ID: {cust.id} • Spend: ${cust.totalSpend.toLocaleString()}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition ${isSelected ? "translate-x-1 text-emerald-500" : ""}`} />
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Profile/Detail Slide Columns */}
      <div className="xl:col-span-2 flex flex-col gap-6 h-full overflow-y-auto">
        {selectedCustomer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            
            {/* Meta Cohort Card */}
            <div id="customer-profile-cohort-card" className="enterprise-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-xs">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-indigo-400 rounded-xl">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950 dark:text-slate-100 text-sm">
                      {selectedCustomer.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedCustomer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Predictive CLV</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 text-lg font-mono">${selectedCustomer.predictedCLV.toLocaleString()}</strong>
                </div>
              </div>

              {/* Behavior parameters */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Actual Capital Spend</span>
                  <strong className="font-mono text-sm text-slate-900 dark:text-slate-100">${selectedCustomer.totalSpend.toLocaleString()}</strong>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Transaction count</span>
                  <strong className="font-mono text-sm text-slate-900 dark:text-slate-100">{selectedCustomer.totalTransactions} Tx</strong>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Avg Purchase value</span>
                  <strong className="font-mono text-sm text-slate-900 dark:text-slate-100">${selectedCustomer.averageOrderValue.toLocaleString()}</strong>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Recency (dormancy)</span>
                  <strong className="font-mono text-sm text-slate-900 dark:text-slate-100">{selectedCustomer.recencyDays} Days</strong>
                </div>
              </div>

              {/* Dynamic Kaggle Industry Client Variables Panel */}
              <div id="kaggle-banking-attributes-card" className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800/60 rounded-xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <Globe className="w-4 h-4 text-emerald-500" />
                  <span>Kaggle Financial Client Metas (Live Sandbox Update)</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Credit Score Rating</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {selectedCustomer.creditScore || 640} pts
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Client Geography</span>
                    <span className="font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {selectedCustomer.geography || "France"}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Est. Annual Salary</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ${(selectedCustomer.estimatedSalary || 84500).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Account Portfolio Balance</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      ${(selectedCustomer.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Core Membership Status</span>
                    <span className="font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {selectedCustomer.isActiveMember ? "Active Subscriber" : "Inactive / Dormant"}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wide">Credit Card Possession</span>
                    <span className="font-sans font-semibold text-slate-800 dark:text-slate-200">
                      {selectedCustomer.hasCrCard ? "Verified Holder" : "No CC Enrolled"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistical Predictive Attribution factors */}
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <Cpu className="w-4 h-4 text-emerald-500" />
                  <span>Statistical Predictive Attribution factors</span>
                </div>
                <ul className="space-y-2">
                  {selectedCustomer.explainableFactors.map((factor, index) => (
                    <li key={index} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Gauge */}
              <div id="attrition-risk-panel" className="p-4 bg-rose-50/30 dark:bg-slate-950 border border-rose-100 dark:border-rose-900/40 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 leading-none">
                    <AlertOctagon className="w-4 h-4 text-rose-500" />
                    Attrition Risk Score
                  </span>
                  <strong className="font-mono text-rose-600 dark:text-rose-400">
                    {(selectedCustomer.riskScore * 100).toFixed(1)}%
                  </strong>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-rose-600 rounded-full transition-all duration-500"
                    style={{ width: `${selectedCustomer.riskScore * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10.5px] text-slate-400">
                  {selectedCustomer.riskScore > 0.6
                    ? "Warning: Inactivity markers exceeds corporate thresholds. High switcher profile detected."
                    : "Stable Status: Normal account activities. Competitor affinity profiles within safe boundaries."}
                </p>
              </div>

            </div>

             {/* Custom Promotional Copywriting Portal */}
             <div id="customer-promo-engine-copywriting-panel" className="enterprise-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
               <div className="space-y-4">
                 <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                   <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                   <span>Interactive recommendation engine</span>
                 </div>

                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Best Recommended Offer</label>
                    <select
                      value={activeOfferTarget}
                      onChange={(e) => {
                        setActiveOfferTarget(e.target.value);
                        setGeneratedLetter(null);
                      }}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-205 dark:border-slate-800 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                    >
                      {offers.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name} ({o.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Acceptance Ratio</span>
                      <strong className="font-mono text-sm text-indigo-600 dark:text-emerald-400">
                        {(selectedCustomer.acceptanceProb * 100).toFixed(1)}%
                      </strong>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Offer Revenue Yield</span>
                      <strong className="font-mono text-sm text-indigo-600 dark:text-indigo-400">
                        ${(offers.find(o => o.id === activeOfferTarget)?.revenueImpact || 0).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tailored email text output */}
              <div className="flex-1 mt-5 min-h-48 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                {isWritingCopy ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-xs space-y-3">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[11px] font-sans text-slate-500">Generating Personalized Marketing Materials...</p>
                  </div>
                ) : null}

                {generatedLetter ? (
                  <div className="flex flex-col justify-between h-full space-y-4">
                    <pre className="text-[11px] text-slate-700 dark:text-slate-350 font-sans whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-56 pr-2">
                      {generatedLetter}
                    </pre>
                    <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
                      <span className="text-[9px] text-slate-400 font-mono">Engine: {geminiModel}</span>
                      <button
                        onClick={handleCopyClipboard}
                        className="p-1.5 bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition cursor-pointer flex items-center gap-1.5 text-[10px]"
                      >
                        {copyStatus ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copyStatus ? "Copied" : "Copy text"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400">Tailored Sales Promotion material has not been generated.</p>
                  </div>
                )}
              </div>

              <button
                onClick={triggerTailoredEmailCopy}
                disabled={isWritingCopy}
                className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 animate-bounce" />
                Generate Tailored Email Pitch
              </button>
            </div>

            {/* Historical transaction ledger (Full spanning columns) */}
            <div id="historical-transaction-ledger-panel" className="enterprise-card md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-slate-600" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Client Transaction ledger History
                  </h3>
                </div>
                <span className="font-mono text-xs text-slate-405">{transactions.length} Purchases logged</span>
              </div>

              <div className="overflow-x-auto max-h-52 overflow-y-auto">
                {loadingDetails ? (
                  <div className="py-10 text-center flex justify-center">
                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No verified accounts purchasing logs mapped.
                  </div>
                ) : (
                  <table className="w-full text-xs text-left text-slate-600 dark:text-slate-400">
                    <thead className="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 dark:bg-slate-950">
                      <tr>
                        <th className="p-2.5">Transaction ID</th>
                        <th className="p-2.5">Billing category</th>
                        <th className="p-2.5">Execution Channel</th>
                        <th className="p-2.5">Total Amount</th>
                        <th className="p-2.5">Logging Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/55 hover:dark:bg-slate-950/20">
                          <td className="p-2.5 font-mono text-[10.5px] text-slate-900 dark:text-slate-200 font-semibold">{t.id}</td>
                          <td className="p-2.5">{t.category}</td>
                          <td className="p-2.5">{t.channel}</td>
                          <td className="p-2.5 font-mono text-slate-900 dark:text-slate-100 font-bold">${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="p-2.5 text-slate-400 font-mono text-[10.5px]">
                            {new Date(t.date).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 rounded-2xl p-8">
            <User className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm text-slate-500 font-semibold">No profile has been selected.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Drill down into dynamic client profiles by clicking a customer ledger record on the lateral listing menu.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
