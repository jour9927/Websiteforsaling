"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function LogoutPage() {
  useEffect(() => {
    const handleLogout = async () => {
      await supabase.auth.signOut();
      // 延遲一下讓使用者看到登出訊息
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    };
    handleLogout();
  }, []);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-8">
      <section className="glass-card p-8 text-center">
        <h1 className="text-2xl font-semibold">已登出</h1>
        <p className="mt-3 text-sm text-slate-200/70">我們已清除你的登入資訊，期待再次見到你。</p>
        <div className="mt-6 flex justify-center">
          <a href="/" className="rounded-xl bg-white/20 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/30">
            返回首頁
          </a>
        </div>
      </section>
    </div>
  );
}
