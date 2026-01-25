"use client";

import { useState } from "react";
import Image from "next/image";

type ImagePositionEditorProps = {
  imageUrl: string;
  currentPosition?: string;
  onSave: (position: string) => void;
  onCancel: () => void;
};

export default function ImagePositionEditor({
  imageUrl,
  currentPosition = "center",
  onSave,
  onCancel
}: ImagePositionEditorProps) {
  const [position, setPosition] = useState(currentPosition);

  const positions = [
    { value: "center", label: "置中" },
    { value: "top", label: "上方" },
    { value: "bottom", label: "下方" },
    { value: "left", label: "左側" },
    { value: "right", label: "右側" },
    { value: "top left", label: "左上" },
    { value: "top right", label: "右上" },
    { value: "bottom left", label: "左下" },
    { value: "bottom right", label: "右下" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 p-6">
        <h2 className="text-xl font-semibold text-white">調整圖片位置</h2>
        <p className="mt-1 text-sm text-white/60">
          選擇圖片在縮圖中的顯示位置
        </p>

        {/* 預覽區 */}
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 卡片預覽 */}
            <div>
              <p className="mb-2 text-xs text-white/60">活動卡片預覽</p>
              <div className="overflow-hidden rounded-xl border border-white/20">
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-600/40">
                  <Image
                    src={imageUrl}
                    alt="預覽"
                    fill
                    className="object-cover transition-all"
                    style={{ objectPosition: position }}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>

            {/* 詳細頁預覽 */}
            <div>
              <p className="mb-2 text-xs text-white/60">詳細頁預覽</p>
              <div className="overflow-hidden rounded-xl border border-white/20">
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-600/40">
                  <Image
                    src={imageUrl}
                    alt="預覽"
                    fill
                    className="object-cover transition-all"
                    style={{ objectPosition: position }}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 位置選擇器 */}
          <div>
            <p className="mb-3 text-sm text-white/70">選擇圖片位置</p>
            <div className="grid grid-cols-3 gap-2">
              {positions.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => setPosition(pos.value)}
                  className={`rounded-lg border px-4 py-3 text-sm transition ${
                    position === pos.value
                      ? "border-blue-500 bg-blue-500/20 text-blue-200"
                      : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* 自訂位置 */}
          <div>
            <p className="mb-2 text-sm text-white/70">或輸入自訂位置</p>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="例如: 50% 30% 或 center top"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
            />
            <p className="mt-1 text-xs text-white/50">
              可使用 CSS object-position 值，例如: &quot;center&quot;, &quot;top&quot;, &quot;50% 30%&quot;
            </p>
          </div>
        </div>

        {/* 按鈕 */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/30 px-6 py-3 text-sm text-white/80 transition hover:bg-white/10"
          >
            取消
          </button>
          <button
            onClick={() => onSave(position)}
            className="rounded-xl bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-600"
          >
            儲存位置
          </button>
        </div>
      </div>
    </div>
  );
}
