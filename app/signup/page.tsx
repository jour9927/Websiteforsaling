"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // 如果有填写邀请码，更新 profile
      if (invitationCode.trim() && authData.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ invitation_code: invitationCode.trim() })
          .eq('id', authData.user.id);

        if (updateError) {
          console.error('更新邀请码失败:', updateError);
          // 不阻止注册流程，只记录错误
        }
      }

      setSuccess(true);
      
      // 如果不需要 email 確認，直接登入並導向首頁
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "註冊失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <section className="glass-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold">註冊成功！</h1>
          <p className="mt-2 text-sm text-slate-200/70">
            歡迎加入，正在為你導向首頁...
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <section className="glass-card p-8">
        <h1 className="text-2xl font-semibold">建立帳號</h1>
        <p className="mt-2 text-sm text-slate-200/70">註冊後即可參與活動報名、抽選與兌換。</p>
        
        {error && (
          <div className="mt-4 rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="mt-6 flex flex-col gap-4">
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
              minLength={6}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" 
              placeholder="至少 6 個字元"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-200/80">暱稱</span>
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" 
              placeholder="顯示名稱（可選）"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-200/80">邀請碼</span>
            <input 
              type="text" 
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none" 
              placeholder="如有邀請碼請填寫（可選）"
              maxLength={50}
            />
            <span className="text-xs text-slate-200/50">
              如果您有邀請碼，填寫後可享有特定優惠或權限
            </span>
          </label>
          <button 
            type="submit" 
            disabled={loading}
            className="rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "建立中..." : "建立帳號"}
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-200/70">
          已有帳號？<Link href="/login" className="ml-2 text-white/90 hover:text-white">直接登入</Link>
        </p>
      </section>
    </div>
  );
}
