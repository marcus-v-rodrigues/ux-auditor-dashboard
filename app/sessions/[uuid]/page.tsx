import { SessionDetailClient } from "@/components/sessions/SessionDetailClient";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

  return <SessionDetailClient uuid={uuid} />;
}
