import { redirect } from "next/navigation";

export default function DocsSecurityRedirect() {
  redirect("/docs/audit");
}
