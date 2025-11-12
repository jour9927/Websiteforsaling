"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 使用 window.location 避免 typed routes 問題
      window.location.href = redirect;
    } catch (err) {
      setError(err instanceof Error ? err.message : "登入失敗，請檢查帳號密碼");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <section className="glass-card p-8">
        <h1 className="text-2xl font-semibold">登入</h1>
        <p className="mt-2 text-sm text-slate-200/70">歡迎回來，準備探索最新活動與抽選。</p>
        
        {error && (
          <div className="mt-4 rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-200/80">Email</span>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" 
              placeholder="you@example.com" 
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-200/80">密碼</span>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" 
            />
          </label>
          <button 
            type="submit" 
            disabled={loading}
            className="rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "登入中..." : "登入"}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-200/70">
          還沒有帳號？<Link href="/signup" className="ml-2 text-white/90 hover:text-white">立即註冊</Link>
        </p>
      </section>
    </div>
  );
}
