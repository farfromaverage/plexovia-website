import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll()             { return cookieStore.getAll() },
          setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
        },
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // In production, we'd fetch the user's specific saved NAICS codes
    // and query the forecasts for those codes.
    // For now, we return all forecasts to populate the dashboard.
    const { data: forecasts, error } = await supabase
      .from("agency_forecasts")
      .select("*")
      .order('confidence_score', { ascending: false })
      .limit(50);
      
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ forecasts });
  } catch (err: any) {
    console.error("Forecasts API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
