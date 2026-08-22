import { NextResponse } from "next/server";
import { getChurchSocialImages } from "@/lib/facebook-church-media";

export async function GET() {
  const images = await getChurchSocialImages();
  return NextResponse.json(
    { images },
    {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    },
  );
}
