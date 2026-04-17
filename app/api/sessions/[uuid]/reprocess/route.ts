import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedFetch,
  AuthenticatedFetchError,
} from "@/lib/authenticated-fetch";
import type { SessionReprocessResponse } from "@/types/dashboard";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const response = await authenticatedFetch<SessionReprocessResponse>(
      `/sessions/${uuid}/reprocess`,
      { method: "POST" }
    );

    return NextResponse.json(response, { status: 202 });
  } catch (error) {
    console.error("Erro ao reenfileirar a sessão para reprocessamento:", error);

    if (error instanceof AuthenticatedFetchError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          details: error.details ?? undefined,
          upstream_status: error.status,
        },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao reenfileirar a sessão para reprocessamento",
        code: "BACKEND_ERROR",
      },
      { status: 500 }
    );
  }
}
