/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ShieldCheck, ArrowRight, CornerDownRight, Unlock, Mail, UserPlus, LogIn, Lock } from "lucide-react";

interface AuthProps {
  onSuccess: (token: string, user: { id: string; email: string; name: string; role: string }) => void;
}

export default function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetState = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    setLoading(true);

    const url = isLogin ? "/api/auth/login" : "/api/auth/register";
    const body = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("The analytics engine server is currently updating or offline. Please refresh and try again in 5-10 seconds.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong. Verify credential mapping.");
      }

      onSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    if (!email) {
      setError("Please input a valid registered corporate email address.");
      return;
    }
    setLoading(true);
    // Simulate reset recovery codes
    setTimeout(() => {
      setSuccessMsg(`Security recovery instructions successfully dispatched to ${email}. Check your spam or security vault.`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Brand Banner */}
        <div className="px-8 pt-8 pb-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-mono text-xs tracking-wider uppercase text-emerald-400 font-semibold">
              Apex Platform v2.8
            </span>
          </div>
          <h1 className="text-xl font-bold font-sans tracking-tight leading-snug">
            Customer Lifetime Value & Offer Recommendation Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Enterprise Asset Intelligence and Deep Predictive Modelling Platform
          </p>
        </div>

        {/* Content Body */}
        <div id="auth-panel" className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 text-rose-800 dark:text-rose-300 text-xs rounded-r-lg font-sans">
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 text-emerald-800 dark:text-emerald-300 text-xs rounded-r-lg font-sans">
              <p className="font-semibold">{successMsg}</p>
            </div>
          )}

          {isForgot ? (
            <form onSubmit={handleForgotSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. analyst@analyticscorp.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Processing Encryption..." : "Send Password Reset Key"}
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsForgot(false);
                  resetState();
                }}
                className="w-full text-center text-xs text-slate-500 dark:text-slate-400 hover:underline mt-2 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                Return to Login Portal
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-5">
              {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Professional Full Name
                  </label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Elizabeth Vance"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Corporate Email Target
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. analyst@analyticscorp.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Secured Passcode
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgot(true);
                        resetState();
                      }}
                      className="text-[11px] text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  "Authorizing Security Footprint..."
                ) : (
                  <>
                    <span>{isLogin ? "Authenticate Access" : "Configure New Credentials"}</span>
                    {isLogin ? <LogIn className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center text-xs">
                <span className="text-slate-500 dark:text-slate-400 mr-2">
                  {isLogin ? "Need new professional clearance?" : "Corporate credential holder?"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    resetState();
                  }}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {isLogin ? "Register Port Access" : "Log in here"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
