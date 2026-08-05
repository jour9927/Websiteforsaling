import StoreContent from "@/components/StoreContent";
import StoreV2 from "@/components/v2/StoreV2";
import { getUiMode } from "@/lib/ui-mode.server";

export const dynamic = "force-dynamic";

export default function StorePage() {
  return getUiMode() === "v2" ? <StoreV2 /> : <StoreContent />;
}
