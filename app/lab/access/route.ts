import { NextResponse } from "next/server";
import { consumeProductLabHandoff, productLabPortalUrl } from "@/lib/product-lab/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") ?? "";

  try {
    const identity = await consumeProductLabHandoff(code);
    if (!identity) {
      return NextResponse.redirect(`${productLabPortalUrl()}/reviewer?access=invalid-product-handoff`, 303);
    }

    const response = NextResponse.redirect(new URL("/", url.origin), 303);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return NextResponse.redirect(`${productLabPortalUrl()}/reviewer?access=product-unavailable`, 303);
  }
}
