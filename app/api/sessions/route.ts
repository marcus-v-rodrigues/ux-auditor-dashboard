import { NextResponse } from "next/server";

import {
  authenticatedGet,
  AuthenticatedFetchError,
} from "@/lib/authenticated-fetch";

export async function GET() {
  try {
    const response = await authenticatedGet("/sessions");
    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro em /api/sessions:", error);

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
            : "Erro ao carregar historico de sessoes",
        code: "BACKEND_ERROR",
      },
      { status: 500 }
    );
  }
}
