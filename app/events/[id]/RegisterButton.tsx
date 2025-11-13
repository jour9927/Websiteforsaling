"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterButton({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    try {
      // 取得當前用戶
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log('開始報名流程，當前用戶:', user?.id);
      
      if (!user) {
        router.push(`/login?redirect=/events/${eventId}`);
        return;
      }

      // 檢查是否已報名
      const { data: existingRegistration, error: checkError } = await supabase
        .from('registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single();

      console.log('檢查已報名:', { existingRegistration, checkError });

      if (existingRegistration) {
        setError("您已經報名過此活動了");
        return;
      }

      // 檢查名額是否已滿
      const { data: event } = await supabase
        .from('events')
        .select('max_participants')
        .eq('id', eventId)
        .single();

      console.log('活動名額:', event);

      if (event?.max_participants) {
        const { count } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);

        console.log('當前報名人數:', count, '/', event.max_participants);

        if (count && count >= event.max_participants) {
          setError("抱歉，名額已滿");
          return;
        }
      }

      // 建立報名記錄
      console.log('準備插入報名記錄:', {
        event_id: eventId,
        user_id: user.id,
        status: 'pending'
      });

      const { data: insertData, error: insertError } = await supabase
        .from('registrations')
        .insert([{
          event_id: eventId,
          user_id: user.id,
          status: 'pending'
        }])
        .select();

      console.log('插入結果:', { insertData, insertError });

      if (insertError) {
        console.error('報名插入錯誤:', insertError);
        throw new Error(`報名失敗: ${insertError.message} (代碼: ${insertError.code})`);
      }

      console.log('報名成功！重新整理頁面...');

      // 重新整理頁面以顯示最新狀態
      router.refresh();
    } catch (err) {
      console.error('報名異常:', err);
      setError(err instanceof Error ? err.message : '報名失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-purple-500/80 to-pink-500/80 px-4 py-3 text-center text-sm font-semibold text-white transition hover:from-purple-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "報名中..." : "🎉 立即報名"}
      </button>
      
      {error && (
        <p className="text-xs text-red-300">{error}</p>
      )}
    </div>
  );
}
