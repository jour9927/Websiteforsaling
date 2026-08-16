import { NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";

const BUCKET = "identity-verifications";
function validOwnedPath(path: unknown, userId: string, side: "front" | "back"): path is string {
  return path === `${userId}/${side}`;
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "請先登入" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }

  const legalName = typeof body.legal_name === "string" ? body.legal_name.trim() : "";
  const legalNameKana =
    typeof body.legal_name_kana === "string" ? body.legal_name_kana.trim() : "";
  const frontPath = body.id_front_path;
  const backPath = body.id_back_path;

  if (!legalName || legalName.length > 80) {
    return NextResponse.json({ error: "請填寫 80 字以內的真實姓名" }, { status: 400 });
  }
  if (legalNameKana.length > 80) {
    return NextResponse.json({ error: "日文讀音不可超過 80 字" }, { status: 400 });
  }
  if (!validOwnedPath(frontPath, user.id, "front") || !validOwnedPath(backPath, user.id, "back")) {
    return NextResponse.json({ error: "證件檔案路徑不正確" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("trade_identity_verifications")
    .select("status, id_front_path, id_back_path")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing?.status === "pending") {
    return NextResponse.json({ error: "你的資料正在等待人工審核" }, { status: 409 });
  }
  if (existing?.status === "approved") {
    return NextResponse.json({ error: "你已通過實名認證" }, { status: 409 });
  }

  const admin = createAdminSupabaseClient();
  const { data: uploaded, error: listError } = await admin.storage
    .from(BUCKET)
    .list(user.id, { limit: 100 });
  if (listError) {
    return NextResponse.json({ error: "無法確認證件檔案，請重新上傳" }, { status: 500 });
  }
  const names = new Set((uploaded || []).map((file) => `${user.id}/${file.name}`));
  if (!names.has(frontPath) || !names.has(backPath)) {
    return NextResponse.json({ error: "找不到完整的正反面證件檔案" }, { status: 400 });
  }

  const submittedAt = new Date().toISOString();
  const { error: upsertError } = await admin
    .from("trade_identity_verifications")
    .upsert(
      {
        user_id: user.id,
        legal_name: legalName,
        legal_name_kana: legalNameKana || null,
        id_front_path: frontPath,
        id_back_path: backPath,
        status: "pending",
        rejection_reason: null,
        submitted_at: submittedAt,
        reviewed_at: null,
        reviewed_by: null,
        documents_purge_after: null,
        documents_purged_at: null,
        updated_at: submittedAt,
      },
      { onConflict: "user_id" },
    );

  if (upsertError) {
    return NextResponse.json({ error: `提交失敗：${upsertError.message}` }, { status: 500 });
  }

  await admin
    .from("profiles")
    .update({
      real_name: legalName,
      real_name_kana: legalNameKana || null,
      real_name_submitted_at: submittedAt,
    })
    .eq("id", user.id);

  const oldPaths = [existing?.id_front_path, existing?.id_back_path].filter(
    (path): path is string => Boolean(path && path !== frontPath && path !== backPath),
  );
  if (oldPaths.length > 0) await admin.storage.from(BUCKET).remove(oldPaths);

  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  if (admins?.length) {
    await admin.from("notifications").insert(
      admins.map((profile) => ({
        user_id: profile.id,
        type: "identity_verification",
        title: "新的交易實名申請",
        message: `${legalName} 已上傳身分證正反面，請至管理員平台審核。`,
        related_user_id: user.id,
      })),
    );
  }

  return NextResponse.json({ success: true, message: "資料已送出，請等待管理員人工審核。" });
}
