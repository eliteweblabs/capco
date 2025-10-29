import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get monthly revenue data for the last 12 months
    const { data, error } = await supabase
      .from('invoices')
      .select('createdAt, totalAmount')
      .gte('createdAt', new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('createdAt', { ascending: true });

    if (error) {
      console.error('Error fetching monthly revenue data:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch monthly revenue data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Group by month and calculate totals
    const monthlyData = data.reduce((acc: any, invoice: any) => {
      const month = new Date(invoice.createdAt).toISOString().substring(0, 7) + '-01';
      if (!acc[month]) {
        acc[month] = {
          month,
          monthly_revenue: 0,
          invoice_count: 0
        };
      }
      acc[month].monthly_revenue += parseFloat(invoice.totalAmount) || 0;
      acc[month].invoice_count += 1;
      return acc;
    }, {});

    // Convert to array and sort by month
    const result = Object.values(monthlyData).sort((a: any, b: any) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in monthly revenue API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
