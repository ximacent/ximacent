import { OrganizerElectionDetail } from "@/components/organizer/organizer-election-detail";

export default async function OrganizerElectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrganizerElectionDetail id={id} />;
}