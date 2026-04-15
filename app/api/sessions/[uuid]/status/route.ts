import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedGet,
  AuthenticatedFetchError,
} from "@/lib/authenticated-fetch";
import type { SessionJobStatusResponse } from "@/types/dashboard";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    // Repassamos o payload upstream sem perder campos úteis para a UI e para o diagnóstico.
    const response = await authenticatedGet<SessionJobStatusResponse>(`/sessions/${uuid}/status`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao consultar o status da sessão:", error);

    if (error instanceof AuthenticatedFetchError) {
      // Mantemos um envelope consistente para distinguir autenticação, backend e rede.
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
        error: error instanceof Error ? error.message : "Erro ao consultar o status da sessão",
        code: "BACKEND_ERROR",
      },
      { status: 500 }
    );
  }
}
