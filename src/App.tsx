/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import ExecutiveDashboard from "./components/ExecutiveDashboard";
import CustomerProfiles from "./components/CustomerProfiles";
import CampaignPerformance from "./components/CampaignPerformance";
import ABTestingPanel from "./components/ABTestingPanel";
import MLOverview from "./components/MLOverview";
import { Customer, Campaign, ABTest, Offer, User, ModelPerformance } from "./types";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Megaphone,
  FlaskConical,
  Cpu,
  LogOut,
  Sun,
  Moon,
  ChevronsUpDown,
  BookOpen
} from "lucide-react";

export default function App() {
  // Global Auth Context
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("clv_auth_token"));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem("clv_auth_user");
    return raw ? JSON.parse(raw) : null;
  });

  // Enterprise Themes Mode: "light" or "dark". Custom toggle maps corresponding body tag classes
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("clv_app_theme") as "light" | "dark") || "dark";
  });

  // Active Workspace Panel Index
  const [activeTab, setActiveTab] = useState<"dashboard" | "customers" | "campaigns" | "abtests" | "ml">("dashboard");

  // Dynamic system models
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [modelsPerformance, setModelsPerformance] = useState<ModelPerformance[]>([]);
  const [activeModelId, setActiveModelId] = useState("random_forest");
  const [lastRetrainedAt, setLastRetrainedAt] = useState("");

  const [loadingApp, setLoadingApp] = useState(false);

  // Sync index.html body classes to matches local themes state
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("clv_app_theme", theme);
  }, [theme]);

  // Load backend arrays
  const fetchAllData = async (authToken: string) => {
    setLoadingApp(true);
    try {
      const headers = { Authorization: `Bearer ${authToken}` };

      // Batch load collections
      const [resCust, resCamp, resTests, resOffers, resML] = await Promise.all([
        fetch("/api/customers", { headers }),
        fetch("/api/campaigns", { headers }),
        fetch("/api/ab-tests", { headers }),
        fetch("/api/offers", { headers }),
        fetch("/api/models/performance", { headers }),
      ]);

      if (resCust.ok) {
        const d = await resCust.json();
        setCustomers(d.customers || []);
      }
      if (resCamp.ok) {
        const d = await resCamp.json();
        setCampaigns(d.campaigns || []);
      }
      if (resTests.ok) {
        const d = await resTests.json();
        setAbTests(d.abTests || []);
      }
      if (resOffers.ok) {
        const d = await resOffers.json();
        setOffers(d.offers || []);
      }
      if (resML.ok) {
        const d = await resML.json();
        setModelsPerformance(d.models || []);
        setActiveModelId(d.activeModelId || "random_forest");
        setLastRetrainedAt(d.lastRetrainedAt || "");
      }
    } catch (err) {
      console.error("Failed executing batch parameters retrieval:", err);
    } finally {
      setLoadingApp(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAllData(token);
    }
  }, [token]);

  const handleAuthSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem("clv_auth_token", newToken);
    localStorage.setItem("clv_auth_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("clv_auth_token");
    localStorage.removeItem("clv_auth_user");
    setToken(null);
    setUser(null);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!token || !user) {
    return <Auth onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      
      {/* Structural Sidebar Rail */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-205 dark:border-slate-850 flex flex-col justify-between shrink-0 hidden md:flex font-sans">
        <div className="space-y-6">
          
          {/* Logo Header visual */}
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0">
            <div className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-500 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-sans tracking-tight text-slate-900 dark:text-slate-50">
                Apex Analytics
              </h1>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider block">CLV & Retention Hub</span>
            </div>
          </div>

          {/* Connected User Profile badge */}
          <div className="px-5 shrink-0">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between">
              <div className="truncate pr-2">
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 block truncate">{user.name}</span>
                <span className="text-[9.5px] text-slate-400 dark:text-slate-550 block truncate font-mono">{user.role}</span>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            </div>
          </div>

          {/* Nav Rail categories */}
          <nav className="px-4 space-y-1.5 flex-1">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full h-11 px-3.5 rounded-lg text-[13px] font-medium tracking-normal text-left flex items-center gap-3.5 transition-all duration-150 cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-slate-950 text-white dark:bg-emerald-500/15 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">Executive Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab("customers")}
              className={`w-full h-11 px-3.5 rounded-lg text-[13px] font-medium tracking-normal text-left flex items-center gap-3.5 transition-all duration-150 cursor-pointer ${
                activeTab === "customers"
                  ? "bg-slate-950 text-white dark:bg-emerald-500/15 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <Users className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">Customer Profiles</span>
            </button>

            <button
              onClick={() => setActiveTab("campaigns")}
              className={`w-full h-11 px-3.5 rounded-lg text-[13px] font-medium tracking-normal text-left flex items-center gap-3.5 transition-all duration-150 cursor-pointer ${
                activeTab === "campaigns"
                  ? "bg-slate-950 text-white dark:bg-emerald-500/15 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <Megaphone className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">Campaign Performance & ROI</span>
            </button>

            <button
              onClick={() => setActiveTab("abtests")}
              className={`w-full h-11 px-3.5 rounded-lg text-[13px] font-medium tracking-normal text-left flex items-center gap-3.5 transition-all duration-150 cursor-pointer ${
                activeTab === "abtests"
                  ? "bg-slate-950 text-white dark:bg-emerald-500/15 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <FlaskConical className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">Experiment Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab("ml")}
              className={`w-full h-11 px-3.5 rounded-lg text-[13px] font-medium tracking-normal text-left flex items-center gap-3.5 transition-all duration-150 cursor-pointer ${
                activeTab === "ml"
                  ? "bg-slate-950 text-white dark:bg-emerald-500/15 dark:text-emerald-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40"
              }`}
            >
              <Cpu className="w-4.5 h-4.5 shrink-0" />
              <span className="truncate">Predictive Analytics</span>
            </button>
          </nav>
        </div>

        {/* Sidebar footer toggler & logs */}
        <div className="p-4 space-y-4 border-t border-slate-105 dark:border-slate-850">
          <div className="flex gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 py-2 px-3 border border-slate-200 dark:border-slate-800 rounded-xl justify-center items-center flex gap-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 hover:dark:bg-slate-950 cursor-pointer"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              <span>{theme === "dark" ? "Light theme" : "Dark theme"}</span>
            </button>
            <button
              onClick={handleLogout}
              className="py-2 px-3.5 border border-slate-200 dark:border-slate-800 text-rose-500 rounded-xl hover:bg-rose-50/10 hover:border-rose-500/20 flex items-center justify-center cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center">
            <span className="text-[9.5px] text-zinc-500 block uppercase font-semibold font-sans">
              © 2026 Enterprise Analytics Corp.
            </span>
          </div>
        </div>

      </aside>

      {/* Main workspace scrolling panel container */}
      <main className="flex-1 flex flex-col min-w-0 font-sans">
        
        {/* Mobile Header visual fallback */}
        <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 px-6 py-4 flex items-center justify-between font-sans">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h1 className="font-bold text-xs uppercase tracking-wide">Enterprise Analytics</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 cursor-pointer">
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-505" />}
            </button>
            <button onClick={handleLogout} className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-rose-500 cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Mobile sub navigation links */}
        <div className="md:hidden flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850 overflow-x-auto text-[10.5px] font-semibold text-slate-500 py-1.5 px-3 uppercase tracking-wider shrink-0 gap-1.5 no-scrollbar">
          <button onClick={() => setActiveTab("dashboard")} className={`px-3 py-1 rounded transition ${activeTab === "dashboard" ? "bg-slate-950 text-white dark:bg-emerald-500/20 dark:text-emerald-400" : ""}`}>Dashboard</button>
          <button onClick={() => setActiveTab("customers")} className={`px-3 py-1 rounded transition ${activeTab === "customers" ? "bg-slate-950 text-white dark:bg-emerald-500/20 dark:text-emerald-400" : ""}`}>Customers</button>
          <button onClick={() => setActiveTab("campaigns")} className={`px-3 py-1 rounded transition ${activeTab === "campaigns" ? "bg-slate-950 text-white dark:bg-emerald-500/20 dark:text-emerald-400" : ""}`}>Campaigns</button>
          <button onClick={() => setActiveTab("abtests")} className={`px-3 py-1 rounded transition ${activeTab === "abtests" ? "bg-slate-950 text-white dark:bg-emerald-500/20 dark:text-emerald-400" : ""}`}>Experiments</button>
          <button onClick={() => setActiveTab("ml")} className={`px-3 py-1 rounded transition ${activeTab === "ml" ? "bg-slate-950 text-white dark:bg-emerald-500/20 dark:text-emerald-400" : ""}`}>Predictive</button>
        </div>

        {/* Central interactive body viewport */}
        <div className="flex-1 p-6 overflow-y-auto">
          {loadingApp ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 py-20">
              <div className="w-7 h-7 border-4 border-slate-900 dark:border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-550 font-sans">Connecting to analytical data pools...</p>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && <ExecutiveDashboard customers={customers} campaigns={campaigns} />}
              {activeTab === "customers" && (
                <CustomerProfiles
                  customers={customers}
                  offers={offers}
                  token={token}
                  onRefreshCustomers={() => fetchAllData(token)}
                />
              )}
              {activeTab === "campaigns" && (
                <CampaignPerformance
                  campaigns={campaigns}
                  offers={offers}
                  token={token}
                  onCampaignCreated={(updated) => setCampaigns(updated)}
                />
              )}
              {activeTab === "abtests" && (
                <ABTestingPanel
                  abTests={abTests}
                  token={token}
                  onTestCreated={(updated) => setAbTests(updated)}
                />
              )}
              {activeTab === "ml" && (
                <MLOverview
                  models={modelsPerformance}
                  activeModelId={activeModelId}
                  lastRetrainedAt={lastRetrainedAt}
                  token={token}
                  onTrainedSuccess={(updatedModels, actModelId, fitTime) => {
                    setModelsPerformance(updatedModels);
                    setActiveModelId(actModelId);
                    setLastRetrainedAt(fitTime);
                    // Reload customer record lists to show updated values corresponding to newly selected model parameters
                    fetchAllData(token);
                  }}
                />
              )}
            </>
          )}
        </div>

      </main>
    </div>
  );
}
