import { NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

// Public, read-only: clinic placeholders (address/timing/map link), doctor
// photo URL, and the hero-stat numbers. Consumed by home.html on load so the
// static frontend can reflect whatever the doctor set in Admin → Settings.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({}, { status: 200 }); // frontend falls back to its built-in placeholders
  }
  const { data, error } = await supabaseAdmin()
    .from("site_settings")
    .select("clinic_address, clinic_timing, clinic_map_link, doctor_photo_path, years_experience, deliveries_count")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({}, { status: 200 });
  }

  let doctor_photo_url: string | null = null;
  if (data.doctor_photo_path) {
    const { data: pub } = supabaseAdmin().storage.from("site-assets").getPublicUrl(data.doctor_photo_path);
    doctor_photo_url = pub?.publicUrl || null;
  }

  return NextResponse.json({
    clinic_address: data.clinic_address,
    clinic_timing: data.clinic_timing,
    clinic_map_link: data.clinic_map_link,
    doctor_photo_url,
    years_experience: data.years_experience,
    deliveries_count: data.deliveries_count,
  });
}
