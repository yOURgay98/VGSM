import { redirect } from "next/navigation";

export default function DocsDeployRedirect() {
  redirect("/docs/quickstart#deploy");
}
