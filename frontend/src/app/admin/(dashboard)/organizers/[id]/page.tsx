import { OrganizerReviewDetail } from "@/components/admin/organizers/organizer-review-detail";

export default async function AdminOrganizerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrganizerReviewDetail id={id} />;
}