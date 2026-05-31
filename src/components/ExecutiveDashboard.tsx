/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Customer, Campaign, Transaction } from "../types";
import { DollarSign, Users, Award, TrendingUp, AlertCircle, ShoppingBag, Radio } from "lucide-react";

interface Props {
  customers: Customer[];
  campaigns: Campaign[];
}

export default function ExecutiveDashboard({ customers, campaigns }: Props) {
  // Aggregate Metrics
  const totalCustomers = customers.length;
  const totalSpendActual = customers.reduce((s, c) => s + c.totalSpend, 0);
  const totalPLVRevenue = customers.reduce((s, c) => s + c.predictedCLV, 0);
  const avgOrderVal = totalCustomers ? (totalSpendActual / customers.reduce((s, c) => s + c.totalTransactions, 0)) : 0;
  
  const avgRiskScore = totalCustomers ? (customers.reduce((s, c) => s + c.riskScore, 0) / totalCustomers) * 100 : 0;
  const avgAcceptanceProb = totalCustomers ? (customers.reduce((s, c) => s + c.acceptanceProb, 0) / totalCustomers) * 100 : 0;

  // Segment allocations count
  const segmentsCount = customers.reduce((acc, c) => {
    acc[c.segment] = (acc[c.segment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const segmentLabels: Customer["segment"][] = ["High-Value", "Loyal", "Medium-Value", "New", "At-Risk"];
  const segmentColors = {
    "High-Value": "#10b981", // Emerald
    "Loyal": "#3b82f6",      // Blue
    "Medium-Value": "#8b5cf6", // Purple
    "New": "#30b0c0",        // Cyan
    "At-Risk": "#f43f5e"     // Rose
  };

  const segmentCountsList = segmentLabels.map(l => segmentsCount[l] || 0);
  const maxSegmentVal = Math.max(...segmentCountsList, 1);

  // Campaign Metrics
  const activeCampaignsCount = campaigns.filter(c => c.status === "Active").length;
  const totalMarketingSpend = campaigns.reduce((s, c) => s + c.spend, 0);
  const totalMarketingRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
  const overallCampaignROI = totalMarketingSpend ? ((totalMarketingRevenue - totalMarketingSpend) / totalMarketingSpend) * 100 : 0;

  // Custom visual SVG calculations: Donut segment sectors representation
  const donutRadius = 50;
  const donutStrokeWidth = 14;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accumulatedAngle = 0;

  const donutSectors = segmentLabels.map((lbl) => {
    const count = segmentsCount[lbl] || 0;
    const percentage = totalCustomers ? count / totalCustomers : 0;
    const strokeDasharray = `${percentage * donutCircumference} ${donutCircumference}`;
    const strokeDashoffset = -accumulatedAngle;
    accumulatedAngle += percentage * donutCircumference;
    return {
      label: lbl,
      percentage,
      color: segmentColors[lbl],
      strokeDasharray,
      strokeDashoffset
    };
  });

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight text-slate-900 dark:text-slate-100">
            Executive Analytics Hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Global real-time overview mapping client capitalization pools and campaign conversions.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-mono text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider">
            Connected to Engine Pool
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1 */}
        <div id="kpi-total-cust" className="enterprise-card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Managed pool
            </span>
            <div className="p-1.5 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-100 dark:border-slate-800">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-mono text-2xl font-bold text-slate-950 dark:text-slate-50">
              {totalCustomers}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-sans">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Account records active</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div id="kpi-predicted-clv" className="enterprise-card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Expected CLV Pool
            </span>
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-mono text-2xl font-bold text-slate-950 dark:text-slate-50">
              ${totalPLVRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-sans">
            <Award className="w-3.5 h-3.5" />
            <span>Predicted ML Cap</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div id="kpi-avg-order" className="enterprise-card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Transaction Size
            </span>
            <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-mono text-2xl font-bold text-slate-950 dark:text-slate-50">
              ${avgOrderVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-600 dark:text-slate-400 font-sans">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Across all transactions</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div id="kpi-risk-pool" className="enterprise-card p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Average Attrition Risk
            </span>
            <div className="p-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900/40">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-mono text-2xl font-bold text-slate-950 dark:text-slate-50">
              {avgRiskScore.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-rose-600 dark:text-rose-400 font-sans">
            <span>Portfolio attrition probability</span>
          </div>
        </div>

        {/* KPI 5 */}
        <div id="kpi-conversion-probability" className="enterprise-card col-span-2 lg:col-span-1 p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Avg Offer Acceptance
            </span>
            <div className="p-1.5 bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 rounded-lg border border-violet-100 dark:border-violet-900/40">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="font-mono text-2xl font-bold text-slate-950 dark:text-slate-50">
              {avgAcceptanceProb.toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-600 dark:text-slate-400 font-sans">
            <span>Aggregated campaign uplift</span>
          </div>
        </div>
      </div>

      {/* Interactive Charts Workstation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart Card 1: Segment Distribution Pool */}
        <div className="enterprise-card bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-5">
              Demographic Segments Allocation
            </h3>
            
            <div className="relative flex items-center justify-center py-6">
              <svg width="220" height="220" viewBox="0 0 140 140" className="rotate-[-90deg]">
                {/* Donut sectors rendering */}
                {donutSectors.map((sector, index) => (
                  <circle
                    key={index}
                    cx="70"
                    cy="70"
                    r={donutRadius}
                    fill="transparent"
                    stroke={sector.color}
                    strokeWidth={donutStrokeWidth}
                    strokeDasharray={sector.strokeDasharray}
                    strokeDashoffset={sector.strokeDashoffset}
                    className="transition-all duration-500 hover:scale-105 origin-center cursor-pointer"
                  />
                ))}
                {/* Central Circle Cover for Hole */}
                <circle cx="70" cy="70" r="39" className="fill-white dark:fill-slate-900" />
              </svg>

              {/* Centered Aggregated statistics */}
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="font-mono text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                  {totalCustomers}
                </span>
                <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Managed Clients
                </span>
              </div>
            </div>
          </div>

          {/* Chart Legends */}
          <div className="mt-4 space-y-2.5 pt-4 border-t border-slate-50 dark:border-slate-800">
            {segmentLabels.map((lbl) => {
              const count = segmentsCount[lbl] || 0;
              const prob = totalCustomers ? ((count / totalCustomers) * 100).toFixed(0) : "0";
              return (
                <div key={lbl} className="flex items-center justify-between text-xs font-sans">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: segmentColors[lbl] }}></span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{lbl}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-slate-700 dark:text-slate-200 font-bold">{count}</span>
                    <span className="text-[10px] text-slate-400">({prob}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart Card 2: Cumulative CLV Value Gradient bars */}
        <div className="enterprise-card lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Segment Contribution Pools: Predicted CLV vs Actual Spend
              </h3>
              <div className="flex items-center gap-4 text-[10px] uppercase font-semibold font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-indigo-500"></span>
                  <span className="text-slate-500">Actual Spend</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-emerald-400"></span>
                  <span className="text-slate-500">Predicted CLV</span>
                </div>
              </div>
            </div>

            {/* Structured Bar Comparison Grid */}
            <div className="space-y-4 pt-4">
              {segmentLabels.map((lbl) => {
                const filteredCusts = customers.filter(c => c.segment === lbl);
                const actualSum = filteredCusts.reduce((s, c) => s + c.totalSpend, 0);
                const predictedSum = filteredCusts.reduce((s, c) => s + c.predictedCLV, 0);

                // Safe normalized percentage mapping (scale based on 45% of total sums max)
                const maxBarValue = 60000;
                const actPct = Math.min(100, (actualSum / maxBarValue) * 100);
                const predPct = Math.min(100, (predictedSum / maxBarValue) * 100);

                return (
                  <div key={lbl} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{lbl} Panel</span>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 space-x-2.5">
                        <span>Spend: <strong className="text-slate-700 dark:text-slate-200">${actualSum.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></span>
                        <span>CLV: <strong className="text-emerald-600 dark:text-emerald-400">${predictedSum.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></span>
                      </div>
                    </div>

                    <div className="h-6 w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden relative flex flex-col justify-center gap-1 p-1">
                      {/* Bar 1: Actual */}
                      <div
                        className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xs transition-all duration-700"
                        style={{ width: `${Math.max(3, actPct)}%` }}
                      ></div>
                      {/* Bar 2: Predicted */}
                      <div
                        className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xs transition-all duration-700"
                        style={{ width: `${Math.max(3, predPct)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-sans">
            <span>Note: XGBoost predictions represent predicted capitalization pools.</span>
            <span className="font-mono">Max Normalized value: $60,000 Cap</span>
          </div>
        </div>

        {/* Chart Card 3: Marketing Campaign Conversion Efficiency & Yield */}
        <div className="enterprise-card lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Marketing Portfolio Financial Allocation & Yield
              </h3>
              <p className="text-[11px] text-slate-400 font-sans mt-0.5">Budget capitalization vs actual generated portfolio revenue.</p>
            </div>
            
            <div className="font-mono text-xs text-right">
              <span className="block text-[11px] text-slate-400 uppercase tracking-wide">Overall Marketing ROI</span>
              <strong className="text-indigo-600 dark:text-indigo-400 text-lg">+{overallCampaignROI.toFixed(1)}%</strong>
            </div>
          </div>

          {/* Marketing campaigns comparative ROI cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {campaigns.map((camp) => {
              const roiColorClass = camp.roi > 300 ? "text-emerald-500 border-emerald-500/20" : camp.roi > 100 ? "text-indigo-500 border-indigo-500/20" : "text-amber-500 border-amber-500/20";
              return (
                <div key={camp.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl flex flex-col justify-between h-42">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${camp.status === "Completed" ? "bg-slate-100 dark:bg-slate-800 text-slate-500" : camp.status === "Active" ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600" : "bg-amber-100 dark:bg-amber-950 text-amber-600"}`}>
                        {camp.status}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">ROI Tracker</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-2 line-clamp-1">
                      {camp.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5 line-clamp-1">{camp.offerName}</p>
                  </div>

                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Budget Limit:</span>
                      <strong className="text-slate-700 dark:text-slate-300">${camp.spend.toLocaleString()}</strong>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono font-medium">
                      <span className="text-slate-400">Yield:</span>
                      <strong className="text-slate-900 dark:text-slate-200">${camp.revenue.toLocaleString()}</strong>
                    </div>
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between text-xs items-center">
                      <span className="text-slate-400">ROI Yield:</span>
                      <span className={`font-mono font-bold ${roiColorClass}`}>+{camp.roi}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
