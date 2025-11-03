import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
// Use new PUBLIC_SUPABASE_PUBLISHABLE, fallback to legacy PUBLIC_SUPABASE_ANON_KEY
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE || import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get project revenue data
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        title,
        sqFt,
        invoices!inner(
          totalAmount,
          status
        )
      `)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching project revenue data:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch project revenue data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate revenue per project
    const projectRevenue = data.map((project: any) => {
      const totalRevenue = project.invoices.reduce((sum: number, invoice: any) => 
        sum + (parseFloat(invoice.totalAmount) || 0), 0
      );
      const invoiceCount = project.invoices.length;
      
      return {
        id: project.id,
        title: project.title,
        sqFt: project.sqFt || 0,
        totalRevenue,
        invoiceCount
      };
    }).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);

    return new Response(JSON.stringify(projectRevenue), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in project revenue API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
