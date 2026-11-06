import { redirect } from "next/navigation";

// No landing page in the smallest MVP: go straight to the app.
// Step 2 will send signed-out users to /login instead.
export default function Home() {
  redirect("/documents");
}
