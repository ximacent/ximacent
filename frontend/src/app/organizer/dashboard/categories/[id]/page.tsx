import { OrganizerCategoryDetail } from "@/components/organizer/organizer-category-detail";

export default async function OrganizerCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrganizerCategoryDetail id={id} />;
}