import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedPost,
  AuthenticatedFetchError,
} from "@/lib/authenticated-fetch";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request body. Expected an array of rrweb events." },
        { status: 400 }
      );
    }

    const response = await authenticatedPost<{ session_uuid: string; message?: string }>(
      "/ingest",
      body
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in /api/ingest:", error);

    if (error instanceof AuthenticatedFetchError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: error.status || 500 }
      );
    }

    const statusCode = error instanceof Error ? 500 : 500;
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: `Failed to ingest session: ${message}` },
      { status: statusCode }
    );
  }
}
