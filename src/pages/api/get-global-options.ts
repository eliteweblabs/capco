import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase.from("global_options").select("key, value, updated_at");

    if (error) {
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Normalize to a simple key->value map (value may be text or JSON)
    const rawOptions = (data || []).reduce((acc: Record<string, any>, row: any) => {
      acc[row.key] = row.value;
      return acc;
    }, {});

    // Build a consolidated branding object that works with either storage style:
    // 1) One row: key='branding', value is JSON/JSONB with fields
    // 2) Multiple rows: keys 'address', 'phone', 'email' as TEXT
    let branding: Record<string, any> | null = null;
    const brandingValue = rawOptions["branding"];

    if (brandingValue) {
      // If branding is stored as JSON/JSONB or JSON string, parse if needed
      if (typeof brandingValue === "string") {
        try {
          branding = JSON.parse(brandingValue);
        } catch {
          branding = { address: brandingValue };
        }
      } else {
        branding = brandingValue;
      }
    } else {
      // Fallback to discrete keys
      branding = {
        address: rawOptions["address"] || "",
        phone: rawOptions["phone"] || "",
        email: rawOptions["email"] || "",
      };
    }

    const options = { ...rawOptions, branding };

    return new Response(JSON.stringify({ success: true, options }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
