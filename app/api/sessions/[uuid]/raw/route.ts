import { NextRequest, NextResponse } from "next/server";

import {
  authenticatedGet,
  AuthenticatedFetchError,
} from "@/lib/authenticated-fetch";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const response = await authenticatedGet(`/sessions/${uuid}/raw`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro em /api/sessions/[uuid]/raw:", error);

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
            : "Erro ao carregar dados brutos da sessão",
        code: "BACKEND_ERROR",
      },
      { status: 500 }
    );
  }
}
