/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ABTest } from "../types";
import { FlaskConical, Play, CheckCircle, HelpCircle, X, ChevronRight, Calculator, FileSpreadsheet, PlusCircle, Sparkles } from "lucide-react";

interface Props {
  abTests: ABTest[];
  token: string | null;
  onTestCreated: (updatedTests: ABTest[]) => void;
}

export default function ABTestingPanel({ abTests, token, onTestCreated }: Props) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Split experiment formulation state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [variantA, setVariantA] = useState("Corporate Slate Layout (Control)");
  const [variantB, setVariantB] = useState("Deep Storytelling Narrative (Test)");
  const [sizeA, setSizeA] = useState("1000");
  const [sizeB, setSizeB] = useState("1200");

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/ab-tests/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          description,
          variantA,
          variantB,
          sizeA: Number(sizeA),
          sizeB: Number(sizeB),
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("A/B experimentation testing engine offline. Please retry shortly.");
      }

      const data = await res.json();
      if (res.ok) {
        onTestCreated([data.abTest, ...abTests]);
        setShowCreateModal(false);
        // Reset states
        setName("");
        setDescription("");
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
      
      {/* Title section */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight text-slate-900 dark:text-slate-100">
            A/B split Testing & Experiments
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Validate alternative marketing creatives, calculate proportional Z-statistics, and identify statistical significance boundaries.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4.5 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Split Test</span>
        </button>
      </div>

      {/* Experiments list */}
      <div className="grid grid-cols-1 gap-6">
        {abTests.map((test) => {
          const sigColor = test.significanceReached ? "emerald" : "zinc";
          const rateADifference = test.variantB.conversionRate - test.variantA.conversionRate;
          return (
            <div
              key={test.id}
              className="enterprise-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs p-6 space-y-6"
            >
              {/* Card Header metadata */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-indigo-400 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
                    <FlaskConical className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-950 dark:text-slate-50 text-sm">
                      {test.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-sans">{test.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-center font-sans">
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase ${test.status === "Completed" ? "bg-slate-100 dark:bg-slate-800 text-slate-500" : "bg-emerald-100 dark:bg-emerald-950 text-emerald-600"}`}>
                    {test.status}
                  </span>
                  
                  {/* Significance Tag */}
                  <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 border ${
                    test.significanceReached
                      ? "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800"
                  }`}>
                    {test.significanceReached ? "★ Significant" : "★ Low Significance"}
                  </span>
                </div>
              </div>

              {/* Conversion rate split indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                
                {/* Variant A Parameters */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Variant A (Control Option)</span>
                    <strong className="text-xs text-slate-805 dark:text-slate-205 mt-1 block leading-snug">{test.variantA.name}</strong>
                    <span className="text-[10.5px] font-mono text-slate-400 mt-2 block">
                      Conversions: {test.variantA.conversions.toLocaleString()} / {test.variantA.size.toLocaleString()} users
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Conv. Rate</span>
                    <strong className="text-lg font-mono text-slate-800 dark:text-slate-100">{test.variantA.conversionRate}%</strong>
                  </div>
                </div>

                {/* Variant B Parameters */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Variant B (Test Option Option)</span>
                    <strong className="text-xs text-slate-805 dark:text-slate-205 mt-1 block leading-snug">{test.variantB.name}</strong>
                    <span className="text-[10.5px] font-mono text-slate-400 mt-2 block">
                      Conversions: {test.variantB.conversions.toLocaleString()} / {test.variantB.size.toLocaleString()} users
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Conv. Rate</span>
                    <strong className="text-lg font-mono text-emerald-600 dark:text-emerald-400">{test.variantB.conversionRate}%</strong>
                  </div>
                </div>

              </div>

              {/* Calculator Statistical report summaries */}
              <div className="p-4.5 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Computed Probability Metric</span>
                  <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-200">
                    <Calculator className="w-4 h-4 text-slate-400" />
                    <span>Calculated P-Value: <strong>{test.pValue}</strong></span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Variant B Conversion Uplift</span>
                  <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-200 font-semibold">
                    <span className={`text-[11px] px-1.5 py-0.5 rounded ${test.uplift >= 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"}`}>
                      {test.uplift >= 0 ? "▲" : "▼"} {Math.abs(test.uplift)}%
                    </span>
                    <span className="text-slate-400 text-[10px] font-normal">relative elevation</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Mathematical Verdict</span>
                  <p className="text-[10.5px] text-slate-500 leading-tight">
                    {test.significanceReached
                      ? "Validated. The difference in conversion proportions is statistically significant (p < 0.05)."
                      : "Stagnant. Evidence is insufficient. The conversion lift could be attributed to standard sampling variance."}
                  </p>
                </div>

              </div>

            </div>
          );
        })}
      </div>

      {/* New Split test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-950 text-white">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4.5 h-4.5 text-emerald-400 animate-spin" />
                <h3 className="font-bold text-sm">Formulate New Split A/B Test</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border-l-4 border-rose-500 text-rose-800 text-xs rounded">
                  <p className="font-semibold">{errorMsg}</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-455 block tracking-wide">Experiment Title Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q2 Port landing page split conversion"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-455 block tracking-wide">Test Hypothesis & criteria</label>
                <textarea
                  required
                  placeholder="Summarize comparative assets being tested (e.g. Comparing flat incentives with long-term advisory multipliers)."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-455 block tracking-wide">Variant A Description</label>
                  <input
                    type="text"
                    required
                    value={variantA}
                    onChange={(e) => setVariantA(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-455 block tracking-wide">Variant B Description</label>
                  <input
                    type="text"
                    required
                    value={variantB}
                    onChange={(e) => setVariantB(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-455 block tracking-wide">Variant A Sample Size</label>
                  <input
                    type="number"
                    required
                    value={sizeA}
                    onChange={(e) => setSizeA(e.target.value)}
                    min="100"
                    placeholder="1000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-455 block tracking-wide">Variant B Sample Size</label>
                  <input
                    type="number"
                    required
                    value={sizeB}
                    onChange={(e) => setSizeB(e.target.value)}
                    min="100"
                    placeholder="1200"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-955 text-slate-900 dark:text-slate-100 border border-slate-205 dark:border-slate-800 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>

              <div className="bg-indigo-50/25 dark:bg-slate-950 p-4 border border-indigo-200/20 dark:border-slate-850 rounded-xl mt-4 font-sans text-xs">
                <p className="text-slate-500 leading-normal">
                  💡 <strong>Proportion Analysis:</strong> On submission, standard Z-Proportion algorithms evaluate whether conversion frequency differences achieve statistical threshold indicators.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                      <span>Analyzing splits...</span>
                    </>
                  ) : (
                    <>
                      <FlaskConical className="w-3.5 h-3.5" />
                      <span>Configure Experiment</span>
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
