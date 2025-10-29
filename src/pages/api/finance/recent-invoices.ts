import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get recent invoices with project information
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        subject,
        status,
        totalAmount,
        createdAt,
        projectId,
        projects!inner(title)
      `)
      .order('createdAt', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching recent invoices:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch recent invoices' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in recent invoices API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
