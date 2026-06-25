import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle error from OAuth provider (e.g. user denied consent)
  if (errorParam) {
    console.error("[Auth callback] OAuth error:", errorParam, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorParam)}`,
    );
  }

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth callback] exchangeCodeForSession error:", error.message);
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
