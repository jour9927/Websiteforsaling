"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { createBrowserClient } from "@supabase/ssr";

interface Distribution {
  id: string;
  pokemon_name: string;
  pokemon_name_en: string | null;
  pokemon_sprite_url: string | null;
  generation: number;
  points: number | null;
}

export default function CreateCommissionPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDist, setSelectedDist] = useState<Distribution | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  // Form state
  const [pokemonName, setPokemonName] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [priceType, setPriceType] = useState<"points" | "twd">("points");
  const [platformFee, setPlatformFee] = useState("");
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [proofLinks, setProofLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoggedIn(false);
        return;
      }
      setIsLoggedIn(true);

      // 載入配布圖鑑
      const { data } = await supabase
        .from("distributions")
        .select("id, pokemon_name, pokemon_name_en, pokemon_sprite_url, generation, points")
        .order("pokemon_name");
      setDistributions(data || []);
    }
    checkAuth();
  }, []);

  const filteredDist = distributions.filter(
    (d) =>
      d.pokemon_name.includes(searchTerm) ||
      (d.pokemon_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  function selectDistribution(d: Distribution) {
    setSelectedDist(d);
    setPokemonName(d.pokemon_name);
    if (d.points) {
      setBasePrice(d.points.toString());
    }
    setShowSearch(false);
    setSearchTerm("");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError("圖片大小不可超過 5MB");
        continue;
      }

      const ext = file.name.split(".").pop();
      const path = `commission-proofs/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("commission-proofs")
        .upload(path, file);

      if (uploadError) {
        setError(`上傳失敗：${uploadError.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("commission-proofs")
        .getPublicUrl(path);

      newImages.push(urlData.publicUrl);
    }

    setProofImages([...proofImages, ...newImages]);
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    const price = parseInt(basePrice);
    const fee = parseInt(platformFee || "0");

    if (!pokemonName) {
      setError("請選擇或輸入寶可夢名稱");
      setSubmitting(false);
      return;
    }

    if (!price || price <= 0) {
      setError("請輸入有效的底價");
      setSubmitting(false);
      return;
    }

    if (fee > (price * 4) / 5) {
      setError(`抽成不可超過底價的 4/5（上限 ${Math.floor((price * 4) / 5)}）`);
      setSubmitting(false);
      return;
    }

    const res = await fetch("/api/commissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distribution_id: selectedDist?.id || null,
        pokemon_name: pokemonName,
        description,
        base_price: price,
        price_type: priceType,
        platform_fee: fee,
        proof_images: [...proofImages, ...proofLinks],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "建立失敗");
      setSubmitting(false);
      return;
    }

    setSuccess("委託已提交，等待管理員審核！");
    setTimeout(() => router.push("/commissions"), 1500);
  }

  if (isLoggedIn === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-white/60">載入中...</div>
      </div>
    );
  }

  if (isLoggedIn === false) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-white/60">請先登入才能刊登委託</p>
        <Link
          href={"/login?redirect=/commissions/create" as Route}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm text-white hover:bg-indigo-500"
        >
          前往登入
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <header className="glass-card mb-6 p-6">
        <h1 className="text-2xl font-semibold text-white/90">📝 刊登委託</h1>
        <p className="mt-2 text-sm text-white/60">
          填寫委託資訊並上傳合法性證明，提交後將由管理員人工審核。
        </p>
      </header>

      <form onSubmit={handleSubmit} className="glass-card flex flex-col gap-6 p-6">
        {/* 選擇寶可夢 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">
            委託寶可夢 <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div
              onClick={() => setShowSearch(!showSearch)}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white/90 transition hover:border-indigo-500/30"
            >
              {selectedDist ? (
                <>
                  {selectedDist.pokemon_sprite_url && (
                    <img src={selectedDist.pokemon_sprite_url} alt="" className="h-8 w-8 object-contain" />
                  )}
                  <span>{selectedDist.pokemon_name}</span>
                  {selectedDist.pokemon_name_en && (
                    <span className="text-xs text-white/40">({selectedDist.pokemon_name_en})</span>
                  )}
                </>
              ) : (
                <span className="text-white/40">點擊搜尋配布圖鑑...</span>
              )}
            </div>

            {showSearch && (
              <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/10 bg-midnight-900/95 p-2 shadow-2xl backdrop-blur">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜尋寶可夢名稱..."
                  className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder-white/30 focus:border-indigo-500/50 focus:outline-none"
                  autoFocus
                />
                <div className="max-h-60 overflow-y-auto">
                  {filteredDist.slice(0, 20).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => selectDistribution(d)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/70 transition hover:bg-white/10"
                    >
                      {d.pokemon_sprite_url && (
                        <img src={d.pokemon_sprite_url} alt="" className="h-8 w-8 object-contain" />
                      )}
                      <div>
                        <span className="text-white/90">{d.pokemon_name}</span>
                        {d.pokemon_name_en && (
                          <span className="ml-2 text-xs text-white/40">{d.pokemon_name_en}</span>
                        )}
                      </div>
                      {d.points && (
                        <span className="ml-auto text-xs text-amber-400">{d.points.toLocaleString()} pts</span>
                      )}
                    </button>
                  ))}
                  {filteredDist.length === 0 && (
                    <p className="px-3 py-2 text-sm text-white/40">找不到符合的配布</p>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* 手動輸入 */}
          <input
            type="text"
            value={pokemonName}
            onChange={(e) => setPokemonName(e.target.value)}
            placeholder="或手動輸入寶可夢名稱"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:border-indigo-500/50 focus:outline-none"
          />
        </div>

        {/* 說明 */}
        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">備註（選填）</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="例如：要求6V、指定球種、語言版本等..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:border-indigo-500/50 focus:outline-none"
          />
        </div>

        {/* 底價 */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">
              計價方式 <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPriceType("points")}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  priceType === "points"
                    ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                🎯 點數
              </button>
              <button
                type="button"
                onClick={() => setPriceType("twd")}
                className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                  priceType === "twd"
                    ? "border-green-500 bg-green-500/20 text-green-300"
                    : "border-white/10 bg-white/5 text-white/50 hover:bg-white/10"
                }`}
              >
                💵 台幣（NT$）
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">
              底價（{priceType === "twd" ? "NT$" : "點數"}） <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder={priceType === "twd" ? "例：500" : "例：5000"}
              min="1"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:border-indigo-500/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/70">
              執行者可抽成
            </label>
            <input
              type="number"
              value={platformFee}
              onChange={(e) => setPlatformFee(e.target.value)}
              placeholder="例：500"
              min="0"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:border-indigo-500/50 focus:outline-none"
            />
            {basePrice && (
              <p className="mt-1 text-xs text-white/40">
                抽成上限：{Math.floor((parseInt(basePrice) * 4) / 5).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        </div>

        {/* 合法性證明 */}
        <div className="flex flex-col gap-4">
          <label className="block text-sm font-medium text-white/70">合法性證明</label>

          {/* 圖片上傳 */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-xs font-medium text-white/50">📸 上傳圖片</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              disabled={uploading}
              className="w-full text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-indigo-500"
            />
            {uploading && <p className="mt-1 text-xs text-amber-400">上傳中...</p>}
            {proofImages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {proofImages.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
                    <button
                      type="button"
                      onClick={() => setProofImages(proofImages.filter((_, j) => j !== i))}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 雲端連結 */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-xs font-medium text-white/50">🔗 雲端連結（Google Drive、Imgur 等）</p>
            <div className="flex gap-2">
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:border-indigo-500/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  const link = newLink.trim();
                  if (link && (link.startsWith("http://") || link.startsWith("https://"))) {
                    setProofLinks([...proofLinks, link]);
                    setNewLink("");
                  } else if (link) {
                    setError("請輸入有效的網址（以 http:// 或 https:// 開頭）");
                  }
                }}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm text-white transition hover:bg-indigo-500"
              >
                新增
              </button>
            </div>
            {proofLinks.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {proofLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-xs text-indigo-400">🔗</span>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate text-xs text-white/60 hover:text-white/80"
                    >
                      {link}
                    </a>
                    <button
                      type="button"
                      onClick={() => setProofLinks(proofLinks.filter((_, j) => j !== i))}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 押底提示 */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <h4 className="text-sm font-semibold text-amber-400">🛡️ 押底說明</h4>
          <p className="mt-1 text-xs text-white/60">
            首次進行委託任務時，需提供一隻不低於委託寶可夢價值 2/3 的寶可夢作為平台押底。
            委託完成後 10 天內如無問題即可歸還。
          </p>
        </div>

        {/* 錯誤/成功訊息 */}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-400">
            {success}
          </div>
        )}

        {/* 提交 */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {submitting ? "提交中..." : "提交委託"}
          </button>
          <Link
            href={"/commissions" as Route}
            className="rounded-xl border border-white/10 px-6 py-2.5 text-sm text-white/60 transition hover:bg-white/5"
          >
            取消
          </Link>
        </div>
      </form>
    </div>
  );
}
