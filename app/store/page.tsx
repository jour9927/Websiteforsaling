import StoreContent from "@/components/StoreContent";
import SkinStore from "@/components/skin/SkinStore";
import { getUiMode } from "@/lib/ui-mode.server";
import { isSkinMode } from "@/lib/ui-mode";

export const dynamic = "force-dynamic";

export default function StorePage() {
  return isSkinMode(getUiMode()) ? <SkinStore /> : <StoreContent />;
}
