import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // Get invoice overview
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('invoices')
      .select('status, totalAmount');

    if (invoiceError) {
      console.error('Error fetching invoice data:', invoiceError);
      return new Response(JSON.stringify({ error: 'Failed to fetch invoice data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate invoice metrics
    const totalInvoices = invoiceData.length;
    const totalRevenue = invoiceData.reduce((sum, invoice) => sum + (parseFloat(invoice.totalAmount) || 0), 0);
    const paidInvoices = invoiceData.filter(invoice => invoice.status === 'paid').length;
    const draftInvoices = invoiceData.filter(invoice => invoice.status === 'draft').length;
    const sentInvoices = invoiceData.filter(invoice => invoice.status === 'sent').length;
    const overdueInvoices = invoiceData.filter(invoice => invoice.status === 'overdue').length;

    // Get project overview
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('status, sqFt');

    if (projectError) {
      console.error('Error fetching project data:', projectError);
      return new Response(JSON.stringify({ error: 'Failed to fetch project data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Calculate project metrics
    const totalProjects = projectData.length;
    const activeProjects = projectData.filter(project => project.status === 1).length;
    const totalSqFt = projectData.reduce((sum, project) => sum + (project.sqFt || 0), 0);

    return new Response(JSON.stringify({
      totalRevenue,
      totalInvoices,
      paidInvoices,
      draftInvoices,
      sentInvoices,
      overdueInvoices,
      totalProjects,
      activeProjects,
      totalSqFt
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in finance overview API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
