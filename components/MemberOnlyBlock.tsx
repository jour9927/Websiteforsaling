"use client";

import Link from "next/link";
import { FC, ReactNode } from "react";

interface MemberOnlyBlockProps {
  title: string;
  description?: string;
  itemCount?: number;
  children?: ReactNode;
}

export const MemberOnlyBlock: FC<MemberOnlyBlockProps> = ({ 
  title, 
  description = "探索更多精彩內容", 
  itemCount = 3 
}) => {
  return (
    <div className="glass-card relative overflow-hidden p-8">
      {/* 背景模糊內容 */}
      <div className="absolute inset-0 flex flex-col gap-4 p-8 blur-md">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-white/10" />
        ))}
      </div>

      {/* 會員限定提示 */}
      <div className="relative z-10 flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/20 to-purple-400/20 backdrop-blur-xl">
          <svg 
            className="h-10 w-10 text-sky-200" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
        </div>
        
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-3 max-w-md text-sm text-white/70">
          {description}
        </p>
        
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link 
            href="/login" 
            className="rounded-full bg-gradient-to-r from-sky-500 to-purple-500 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl hover:scale-105"
          >
            立即登入
          </Link>
          <Link 
            href="/signup" 
            className="rounded-full border border-white/40 px-8 py-3 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
          >
            註冊會員
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-2 text-xs text-white/50">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>登入後即可查看完整內容</span>
        </div>
      </div>
    </div>
  );
};
