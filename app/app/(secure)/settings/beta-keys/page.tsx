import { redirect } from "next/navigation";

export default function LegacyBetaKeysPage() {
  redirect("/app/settings/access-keys");
}
