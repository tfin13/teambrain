import { redirect } from "next/navigation";

// No landing page in the smallest MVP: go straight to the app.
// Middleware sends signed-out users to /login before this runs.
export default function Home() {
  redirect("/documents");
}
