import type { Metadata } from "next";
import { EditElectionClient } from "./edit-election-client";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit election" };

export default async function EditElectionPage({ params }: Props) {
  const { id } = await params;
  return <EditElectionClient id={id} />;
}
