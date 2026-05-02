import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MaintenanceBanner } from "@/components/MaintenanceBanner";
import { MaintenanceProvider } from "@/components/MaintenanceContext";
import GlobalAnnouncementOverlay from "@/components/GlobalAnnouncementOverlay";
import { GlobalMessageToast } from "@/components/GlobalMessageToast";
import { GlobalBackpackToast } from "@/components/GlobalBackpackToast";
import { CheckInReminder } from "@/components/CheckInReminder";
import { CartProvider } from "@/lib/cart";
import { CartSidebar } from "@/components/CartSidebar";
import { createServerSupabaseClient } from "@/lib/auth";

// Force dynamic rendering for all pages (required for Supabase auth with cookies)
export const dynamic = "force-dynamic";

const SITE_URL = "https://eventglass.vercel.app";
const SITE_NAME = "Event Glass｜寶可夢社群活動平台";
const SITE_DESCRIPTION =
  "Event Glass 是寶可夢配布、競標與社群活動的一站式平台。參加限定配布、積分競賽與色違抽獎，打造你的專屬收藏展示間。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | Event Glass`,
  },
  description: SITE_DESCRIPTION,
  keywords: ["寶可夢", "Pokemon", "配布", "競標", "社群", "Event Glass", "活動", "色違"],
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: SITE_URL,
    siteName: "Event Glass",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  other: {
    "theme-color": "#0a0a0f",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

type RootLayoutProps = {
  children: ReactNode;
};

type UserContext = {
  displayName: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
};

async function resolveUserContext(): Promise<UserContext> {
  const fallbackName = "訪客模式";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { displayName: fallbackName, isAuthenticated: false, isAdmin: false };
  }

  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return { displayName: fallbackName, isAuthenticated: false, isAdmin: false };
    }

    // 查詢用戶角色
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    const metadata = session.user.user_metadata ?? {};
    const name =
      metadata.full_name ||
      metadata.name ||
      metadata.nickname ||
      session.user.email ||
      fallbackName;

    return { displayName: name, isAuthenticated: true, isAdmin };
  } catch (error) {
    console.warn("Failed to load Supabase session", error);
    return { displayName: fallbackName, isAuthenticated: false, isAdmin: false };
  }
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const { displayName, isAuthenticated, isAdmin } = await resolveUserContext();

  return (
    <html lang="zh-Hant">
      <body className="min-h-screen antialiased">
        <GlobalAnnouncementOverlay />
        <GlobalBackpackToast isAuthenticated={isAuthenticated} />
        <GlobalMessageToast isAuthenticated={isAuthenticated} />
        <MaintenanceBanner />
        <MaintenanceProvider isAdmin={isAdmin}>
          <CartProvider>
            <CartSidebar />
            <CheckInReminder />
            <div className="flex min-h-screen flex-col">
              <SiteHeader displayName={displayName} isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
              <main className="flex-1">
                <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6 md:py-12">{children}</div>
              </main>
              <SiteFooter />
            </div>
          </CartProvider>
        </MaintenanceProvider>
      </body>
    </html>
  );
}
