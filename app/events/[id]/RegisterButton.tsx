"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterButton({ eventId, isPreRegistration = false }: { eventId: string; isPreRegistration?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState("");
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

      // 檢查名額是否已滿（需加上線下報名人數）
      const { data: event } = await supabase
        .from('events')
        .select('max_participants, offline_registrations')
        .eq('id', eventId)
        .single();

      console.log('活動資訊:', event);

      if (event?.max_participants) {
        const { count: confirmedCount } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId)
          .eq('status', 'confirmed');

        const offlineRegistrations = event.offline_registrations || 0;
        const totalRegistrations = (confirmedCount || 0) + offlineRegistrations;

        console.log('名額檢查:', {
          已確認線上: confirmedCount,
          線下報名: offlineRegistrations,
          總計: totalRegistrations,
          上限: event.max_participants
        });

        if (totalRegistrations >= event.max_participants) {
          setError("抱歉，名額已滿");
          return;
        }
      }

      // 驗證邀請碼（如有輸入）
      let invitedByUserId: string | null = null;
      if (inviteCode.trim()) {
        // 不允許用自己的邀請碼
        const { data: myProfile } = await supabase
          .from('profiles')
          .select('invitation_code')
          .eq('id', user.id)
          .single();
        
        if (myProfile?.invitation_code === inviteCode.trim().toUpperCase()) {
          setInviteError("不能使用自己的邀請碼喔！");
          return;
        }

        // 查找邀請人
        const { data: inviter } = await supabase
          .from('profiles')
          .select('id')
          .eq('invitation_code', inviteCode.trim().toUpperCase())
          .single();

        if (!inviter) {
          setInviteError("找不到這個邀請碼，請確認後再試");
          return;
        }

        invitedByUserId = inviter.id;
      }

      // 建立報名記錄
      const insertPayload: Record<string, unknown> = {
        event_id: eventId,
        user_id: user.id,
        status: 'pending',
      };
      if (invitedByUserId) {
        insertPayload.invited_by_user_id = invitedByUserId;
      }

      const { data: insertData, error: insertError } = await supabase
        .from('registrations')
        .insert([insertPayload])
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
      {/* 邀請碼輸入 */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => { setInviteCode(e.target.value); setInviteError(""); }}
            placeholder="輸入邀請碼（選填）"
            disabled={loading}
            className="flex-1 rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 disabled:opacity-50"
            maxLength={20}
            autoComplete="off"
          />
        </div>
        {inviteError && (
          <p className="text-xs text-red-300">{inviteError}</p>
        )}
      </div>

      <button
        onClick={handleRegister}
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-purple-500/80 to-pink-500/80 px-4 py-3 text-center text-sm font-semibold text-white transition hover:from-purple-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "報名中..." : isPreRegistration ? "📋 預報名" : "🎉 立即報名"}
      </button>
      
      {error && (
        <p className="text-xs text-red-300">{error}</p>
      )}
    </div>
  );
}
