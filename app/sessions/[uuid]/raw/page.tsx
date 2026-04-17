import { RawSessionClient } from "@/components/sessions/RawSessionClient";

export default async function RawSessionPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

  return <RawSessionClient uuid={uuid} />;
}
