import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Anniversary30thBattleArenaRedirectPage() {
  redirect("/anniversary-30th/battle");
}
