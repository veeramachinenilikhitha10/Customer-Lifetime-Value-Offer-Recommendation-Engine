/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ModelPerformance, FeatureImportanceItem } from "../types";
import { Cpu, RotateCcw, AlertTriangle, Eye, Sliders, Play, CheckCircle, BarChart3, Clock } from "lucide-react";

interface Props {
  models: ModelPerformance[];
  activeModelId: string;
  lastRetrainedAt: string;
  token: string | null;
  onTrainedSuccess: (updatedModels: ModelPerformance[], activeModelId: string, lastRetrainedAt: string) => void;
}

export default function MLOverview({ models, activeModelId, lastRetrainedAt, token, onTrainedSuccess }: Props) {
  const [modelTrainingId, setModelTrainingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"performance" | "comparisons">("performance");

  // Train selected models via REST route
  const handleTrainModel = async (id: "xgboost" | "random_forest" | "decision_tree") => {
    setModelTrainingId(id);
    try {
      const res = await fetch("/api/models/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ modelId: id }),
      });
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Modeling platform server updating. Please retry in a few seconds.");
      }
      const data = await res.json();
      if (res.ok) {
        onTrainedSuccess(data.models, data.activeModelId, data.lastRetrainedAt);
      }
    } catch (err) {
      console.error("ML Training aborted:", err);
    } finally {
      setModelTrainingId(null);
    }
  };

  const getModelCardStyles = (mId: string) => {
    const isActive = mId === activeModelId;
    if (isActive) {
      return "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-300";
    }
    return "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400";
  };

  // Safe extract active model feature importance data for visualization
  const currentModel = models.find(m => m.id === activeModelId) || models[0];
  const featureImportances: FeatureImportanceItem[] = currentModel?.featureImportances || [];

  return (
    <div className="space-y-6">
      
      {/* Workspace title block */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight text-slate-900 dark:text-slate-100">
            Model comparison & Training hub
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans">
            Real-time evaluation tracking of XGBoost, Random Forest, and Decision Tree CLV prediction parameters.
          </p>
        </div>
        <div className="text-sm font-sans flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Pipeline Last fit:</span>
          <strong className="font-mono text-xs p-1 px-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg">
            {new Date(lastRetrainedAt).toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit"
            })}
          </strong>
        </div>
      </div>

      {/* Model Cards mapping */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {models.map((m) => {
          const isActive = m.id === activeModelId;
          const isTraining = modelTrainingId === m.id;
          return (
            <div
              key={m.id}
              className={`enterprise-card border p-6 flex flex-col justify-between transition hover:-translate-y-0.5 shadow-xs relative overflow-hidden ${getModelCardStyles(m.id)}`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] uppercase font-bold tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Active Model
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg border ${isActive ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200" : "bg-slate-100 dark:bg-slate-950 border-slate-200 text-slate-500"}`}>
                    <Cpu className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-50">
                    {m.name}
                  </h3>
                </div>

                <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                  {m.id === "xgboost"
                    ? "Gradient Boosting tree ensemble optimized for high accuracy on tabular numeric parameters."
                    : m.id === "random_forest"
                    ? "Bootstrap aggregate model minimizing variance error across deciders."
                    : "Low depth, highly interpretable decision tree partitioning records recursively."}
                </p>

                {/* Accuracy metrics list representation */}
                <div className="pt-4 grid grid-cols-2 gap-4 border-t border-slate-100/60 dark:border-slate-800/60 text-xs font-sans">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block">R² Score (Variance)</span>
                    <strong className="font-mono text-sm text-slate-800 dark:text-slate-200">{(m.r2 * 100).toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Mean Absolute Error</span>
                    <strong className="font-mono text-sm text-slate-800 dark:text-slate-200">${m.mae.toFixed(1)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Classification Acc.</span>
                    <strong className="font-mono text-sm text-slate-800 dark:text-slate-200">{(m.accuracy * 100).toFixed(1)}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide block">Precision Ration</span>
                    <strong className="font-mono text-sm text-slate-800 dark:text-slate-200">{(m.precision * 100).toFixed(1)}%</strong>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100/60 dark:border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Fit time: {m.trainingTimeMs}ms</span>
                </div>

                <button
                  onClick={() => handleTrainModel(m.id as any)}
                  disabled={isTraining || !!modelTrainingId}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                    isActive
                      ? "bg-emerald-500 hover:bg-emerald-600 border border-emerald-500/20 text-white"
                      : "bg-slate-900 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white"
                  }`}
                >
                  {isTraining ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Fitting...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-emerald-100" />
                      <span>{isActive ? "Re-Fit" : "Deploy & Fit"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Model explanation panel featuring vertical SVG charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG vertical feature importance mapping */}
        <div className="enterprise-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 lg:col-span-2 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                Feature significance parameters - {currentModel?.name}
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-sans">
              Significance metrics calculating informational gain reductions per split. Total spend represents the key weight.
            </p>

            <div className="space-y-4">
              {featureImportances.map((item, index) => {
                const percentage = item.importance * 100;
                return (
                  <div key={item.feature} className="space-y-1.5 font-sans">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300">{item.feature}</span>
                      <strong className="font-mono text-indigo-600 dark:text-emerald-400">{percentage.toFixed(1)}%</strong>
                    </div>

                    <div className="w-full h-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 rounded-lg overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-md transition-all duration-750"
                        style={{ width: `${Math.max(2, percentage)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[10.5px] text-slate-400 flex justify-between">
            <span>Aggregated results derived over split constraints.</span>
            <span>XGBoost parameters validated</span>
          </div>
        </div>

        {/* Detailed stats and insights bento */}
        <div id="ml-pipeline-insight-card" className="enterprise-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-5">
            <h3 className="font-bold text-slate-900 dark:text-slate-300 text-xs uppercase tracking-wider">
              Model Performance Insight
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/20 dark:bg-slate-950 border border-indigo-200/20 dark:border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 block tracking-wider">Overfitting Prevention</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                  All metrics are measured using a strict 75% train / 25% test data isolation split. Variance levels are kept low.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/20 dark:bg-slate-950 border border-emerald-250/20 dark:border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block tracking-wider">Dynamic Re-calibration</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                  Refitting is calculated instantly using live data. Predicted values are saved back to customers collection logs.
                </p>
              </div>

              <div id="data-pipeline-status" className="p-4 bg-amber-50/20 dark:bg-slate-950 border border-amber-250/20 dark:border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block tracking-wider">Explainability footprint</span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal">
                  Gradient attribution weights dictate the recommended promotion logic, decreasing attrition profiles.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-[10.5px] text-slate-400">
            Pipeline Framework: Standard Tree Nodes
          </div>
        </div>

      </div>

    </div>
  );
}
