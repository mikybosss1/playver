// /organizer with no sub-path just redirects to /organizer/overview.
import { redirect } from "next/navigation";

export default function OrganizerRootPage() {
  redirect("/organizer/overview");
}
