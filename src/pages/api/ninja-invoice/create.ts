import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

/**
 * Create Invoice in Ninja Invoice API
 *
 * POST /api/ninja-invoice/create
 *
 * Automatically creates an invoice in Ninja Invoice from project data
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser, isAuth } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    const body = await request.json();
    const { projectId, clientData, lineItems, metadata } = body;

    if (!projectId) {
      return createErrorResponse("Project ID is required", 400);
    }

    console.log("📄 [NINJA-INVOICE-CREATE] Creating invoice for project:", projectId);

    // Get project data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select(
        `
        *,
        authorProfile:authorId (
          id,
          companyName,
          email,
          phone
        )
      `
      )
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return createErrorResponse("Project not found", 404);
    }

    // Prepare invoice data for Ninja Invoice
    const invoiceData = {
      client: {
        name: project.authorProfile?.companyName || clientData?.name || "Client",
        email: project.authorProfile?.email || clientData?.email || "",
        phone: project.authorProfile?.phone || clientData?.phone || "",
        address: project.address || clientData?.address || "",
      },
      project: {
        id: projectId,
        title: project.title || "Fire Protection System",
        description: project.description || "Fire protection system installation and maintenance",
        address: project.address || "",
      },
      lineItems: lineItems || generateDefaultLineItems(project),
      metadata: {
        source: "capco-fire-protection",
        projectId: projectId,
        createdBy: currentUser.id,
        ...metadata,
      },
      settings: {
        currency: "USD",
        taxRate: 0.08, // 8% tax rate
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
      },
    };

    // Send to Ninja Invoice API
    const ninjaInvoiceResponse = await sendToNinjaInvoice(invoiceData);

    if (!ninjaInvoiceResponse.success) {
      return createErrorResponse("Failed to create invoice in Ninja Invoice", 500);
    }

    // Store invoice reference in our database
    const { data: invoiceRecord, error: recordError } = await supabase
      .from("ninja_invoice_references")
      .insert({
        projectId: parseInt(projectId),
        ninjaInvoiceId: ninjaInvoiceResponse.invoiceId,
        status: "created",
        createdBy: currentUser.id,
        invoiceData: invoiceData,
        ninjaInvoiceUrl: ninjaInvoiceResponse.invoiceUrl,
      })
      .select()
      .single();

    if (recordError) {
      console.error("❌ [NINJA-INVOICE-CREATE] Error storing invoice reference:", recordError);
      // Don't fail the request, just log the error
    }

    console.log(
      "✅ [NINJA-INVOICE-CREATE] Invoice created successfully:",
      ninjaInvoiceResponse.invoiceId
    );

    return createSuccessResponse({
      invoiceId: ninjaInvoiceResponse.invoiceId,
      invoiceUrl: ninjaInvoiceResponse.invoiceUrl,
      status: "created",
      message: "Invoice created successfully in Ninja Invoice",
    });
  } catch (error) {
    console.error("❌ [NINJA-INVOICE-CREATE] Unexpected error:", error);
    return createErrorResponse("Internal server error", 500);
  }
};

/**
 * Send invoice data to Ninja Invoice API
 */
async function sendToNinjaInvoice(invoiceData: any) {
  try {
    const ninjaInvoiceUrl =
      import.meta.env.NINJA_INVOICE_API_URL || "https://your-ninja-invoice-instance.com/api";
    const apiKey = import.meta.env.NINJA_INVOICE_API_KEY;

    if (!apiKey) {
      console.error("❌ [NINJA-INVOICE] API key not configured");
      return { success: false, error: "API key not configured" };
    }

    const response = await fetch(`${ninjaInvoiceUrl}/invoices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Source": "capco-fire-protection",
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [NINJA-INVOICE] API error:", response.status, errorText);
      return { success: false, error: `API error: ${response.status}` };
    }

    const result = await response.json();
    return {
      success: true,
      invoiceId: result.id,
      invoiceUrl: result.url || `${ninjaInvoiceUrl}/invoices/${result.id}`,
    };
  } catch (error) {
    console.error("❌ [NINJA-INVOICE] Network error:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Generate default line items for fire protection projects
 */
function generateDefaultLineItems(project: any) {
  const baseItems = [
    {
      description: "Fire Protection System Design and Planning",
      quantity: 1,
      rate: 2500.0,
      amount: 2500.0,
      category: "Design",
    },
    {
      description: "Fire Sprinkler System Installation",
      quantity: 1,
      rate: 5000.0,
      amount: 5000.0,
      category: "Installation",
    },
    {
      description: "Fire Alarm System Installation",
      quantity: 1,
      rate: 3000.0,
      amount: 3000.0,
      category: "Installation",
    },
    {
      description: "Fire Suppression System Installation",
      quantity: 1,
      rate: 4000.0,
      amount: 4000.0,
      category: "Installation",
    },
    {
      description: "System Testing and Commissioning",
      quantity: 1,
      rate: 1500.0,
      amount: 1500.0,
      category: "Testing",
    },
    {
      description: "Annual Maintenance Contract (1 Year)",
      quantity: 1,
      rate: 2000.0,
      amount: 2000.0,
      category: "Maintenance",
    },
  ];

  // Calculate total
  const subtotal = baseItems.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  return {
    items: baseItems,
    subtotal,
    tax,
    total,
  };
}
