import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="glass-card max-w-md p-10">
        <p className="text-6xl font-black text-white/20">404</p>
        <h1 className="mt-4 text-2xl font-bold text-white/90">找不到此頁面</h1>
        <p className="mt-3 text-sm text-white/50">
          你要尋找的頁面可能已被移除、更名，或暫時無法使用。
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-white/15 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
        >
          回到首頁
        </Link>
      </div>
    </div>
  );
}
