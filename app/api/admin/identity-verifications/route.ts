import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/auth";
import { requireAdmin } from "@/lib/adminGuard";

const BUCKET = "identity-verifications";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("trade_identity_verifications")
    .select(`
      id,
      user_id,
      legal_name,
      legal_name_kana,
      id_front_path,
      id_back_path,
      status,
      rejection_reason,
      submitted_at,
      reviewed_at,
      documents_purged_at,
      profiles!trade_identity_verifications_user_id_fkey(email, full_name, username)
    `)
    .order("submitted_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = await Promise.all(
    (data || []).map(async (row) => {
      if (row.documents_purged_at) return { ...row, front_url: null, back_url: null };
      const [{ data: front }, { data: back }] = await Promise.all([
        admin.storage.from(BUCKET).createSignedUrl(row.id_front_path, 300),
        admin.storage.from(BUCKET).createSignedUrl(row.id_back_path, 300),
      ]);
      return {
        ...row,
        id_front_path: undefined,
        id_back_path: undefined,
        front_url: front?.signedUrl || null,
        back_url: back?.signedUrl || null,
      };
    }),
  );

  return NextResponse.json(
    { verifications: rows },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } },
  );
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const supabase = createServerSupabaseClient();
  const {
    data: { user: adminUser },
  } = await supabase.auth.getUser();
  if (!adminUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "無效的請求" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  const status = body.status === "approved" || body.status === "rejected" ? body.status : null;
  const rejectionReason =
    typeof body.rejection_reason === "string" ? body.rejection_reason.trim() : "";
  if (!id || !status) return NextResponse.json({ error: "缺少審核資料" }, { status: 400 });
  if (status === "rejected" && !rejectionReason) {
    return NextResponse.json({ error: "駁回時必須填寫原因" }, { status: 400 });
  }
  if (rejectionReason.length > 500) {
    return NextResponse.json({ error: "駁回原因不可超過 500 字" }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: verification, error: loadError } = await admin
    .from("trade_identity_verifications")
    .select("user_id, legal_name")
    .eq("id", id)
    .maybeSingle();
  if (loadError || !verification) {
    return NextResponse.json({ error: "找不到這筆認證申請" }, { status: 404 });
  }

  const reviewedAt = new Date();
  const { error } = await admin
    .from("trade_identity_verifications")
    .update({
      status,
      rejection_reason: status === "rejected" ? rejectionReason : null,
      reviewed_at: reviewedAt.toISOString(),
      reviewed_by: adminUser.id,
      documents_purge_after: new Date(reviewedAt.getTime() + 30 * 86400000).toISOString(),
      updated_at: reviewedAt.toISOString(),
    })
    .eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("notifications").insert({
    user_id: verification.user_id,
    type: "identity_verification",
    title: status === "approved" ? "交易實名認證已通過" : "交易實名認證需要補件",
    message:
      status === "approved"
        ? "你現在可以在民間交易區刊登、出價與直購。"
        : `審核未通過：${rejectionReason}`,
    related_user_id: adminUser.id,
  });

  return NextResponse.json({ success: true });
}
