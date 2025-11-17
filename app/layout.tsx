import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { createServerSupabaseClient } from "@/lib/auth";

// Force dynamic rendering for all pages (required for Supabase auth with cookies)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Event Glass",
  description: "Glassmorphism event hub with Supabase backend"
};

type RootLayoutProps = {
  children: ReactNode;
};

type UserContext = {
  displayName: string;
  isAuthenticated: boolean;
};

async function resolveUserContext(): Promise<UserContext> {
  const fallbackName = "訪客模式";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { displayName: fallbackName, isAuthenticated: false };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return { displayName: fallbackName, isAuthenticated: false };
    }

    const metadata = session.user.user_metadata ?? {};
    const name =
      metadata.full_name ||
      metadata.name ||
      metadata.nickname ||
      session.user.email ||
      fallbackName;

    return { displayName: name, isAuthenticated: true };
  } catch (error) {
    console.warn("Failed to load Supabase session", error);
    return { displayName: fallbackName, isAuthenticated: false };
  }
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const { displayName, isAuthenticated } = await resolveUserContext();

  return (
    <html lang="zh-Hant">
      <body className="min-h-screen antialiased">
        <div className="flex min-h-screen flex-col">
          <SiteHeader displayName={displayName} isAuthenticated={isAuthenticated} />
          <main className="flex-1">
            <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6 md:py-12">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
