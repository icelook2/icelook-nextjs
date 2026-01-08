import { NextResponse } from "next/server";
import { getBeautyPageReviews } from "@/lib/queries/reviews";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const beautyPageId = searchParams.get("beautyPageId");

  if (!beautyPageId) {
    return NextResponse.json(
      { error: "beautyPageId is required" },
      { status: 400 },
    );
  }

  const reviews = await getBeautyPageReviews(beautyPageId);

  return NextResponse.json({ reviews });
}
