import { RankingsLegacy } from "@/components/RankingsLegacy";
import SkinRankings from "@/components/skin/SkinRankings";
import { getUiMode } from "@/lib/ui-mode.server";
import { isSkinMode } from "@/lib/ui-mode";

export const dynamic = "force-dynamic";

export default function RankingsPage() {
  return isSkinMode(getUiMode()) ? <SkinRankings /> : <RankingsLegacy />;
}
