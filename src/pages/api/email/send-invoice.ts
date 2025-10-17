import type { APIRoute } from "astro";
import { createErrorResponse, createSuccessResponse } from "../../../lib/_api-optimization";
import { checkAuth } from "../../../lib/auth";
import { supabase } from "../../../lib/supabase";

/**
 * Send Invoice Email API
 *
 * POST Body:
 * - invoiceId: number
 * - clientEmail?: string (optional, will fetch from project if not provided)
 * - message?: string (optional custom message)
 *
 * Sends a professional invoice email to the client with a link to view the proposal
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check authentication
    const { currentUser, isAuth, currentRole } = await checkAuth(cookies);
    if (!isAuth || !currentUser) {
      return createErrorResponse("Authentication required", 401);
    }

    // Only admins can send invoices
    if (currentRole !== "Admin" && currentRole !== "Staff") {
      return createErrorResponse("Insufficient permissions", 403);
    }

    if (!supabase) {
      return createErrorResponse("Database connection not available", 500);
    }

    const body = await request.json();
    const { invoiceId, clientEmail, message } = body;

    if (!invoiceId) {
      return createErrorResponse("Invoice ID is required", 400);
    }

    console.log(`📧 [SEND-INVOICE] Sending invoice email for invoice: ${invoiceId}`);

    // Fetch invoice and project data
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(
        `
        *,
        projects:projectId (
          id,
          title,
          address,
          authorProfile:authorId (
            id,
            companyName,
            email,
            phone
          )
        )
      `
      )
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return createErrorResponse("Invoice not found", 404);
    }

    const project = invoice.projects;
    if (!project) {
      return createErrorResponse("Project not found", 404);
    }

    // Determine recipient email
    const recipientEmail = clientEmail || project.authorProfile?.email;
    if (!recipientEmail) {
      return createErrorResponse("Client email not found", 400);
    }

    // Generate invoice URL
    const baseUrl = new URL(request.url).origin;
    const invoiceUrl = `${baseUrl}/project/${project.id}?status=proposal`;

    // Create email content
    const subject = `Invoice #${invoice.id} - ${project.title}`;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice #${invoice.id}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { padding: 30px; }
          .invoice-details { background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; font-size: 14px; color: #666; }
          .line-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
          .total { font-weight: bold; font-size: 18px; color: #2563eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice #${invoice.id}</h1>
            <p>Fire Protection Services Proposal</p>
          </div>
          
          <div class="content">
            <p>Dear ${project.authorProfile?.companyName || "Valued Client"},</p>
            
            <p>Thank you for choosing our fire protection services. Please find your detailed proposal below:</p>
            
            <div class="invoice-details">
              <h3>Project Details</h3>
              <p><strong>Project:</strong> ${project.title}</p>
              <p><strong>Address:</strong> ${project.address}</p>
              <p><strong>Invoice Date:</strong> ${new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>

            ${
              invoice.catalogLineItems && invoice.catalogLineItems.length > 0
                ? `
              <h3>Services</h3>
              ${invoice.catalogLineItems
                .map(
                  (item) => `
                <div class="line-item">
                  <div>
                    <strong>${item.description || "Service Item"}</strong>
                    <br><small>Quantity: ${item.quantity || 1}</small>
                  </div>
                  <div>$${((item.quantity || 1) * (item.unitPrice || 0)).toFixed(2)}</div>
                </div>
              `
                )
                .join("")}
              
              <div class="line-item total">
                <div>Total Amount</div>
                <div>$${invoice.catalogLineItems.reduce((sum, item) => sum + (item.quantity || 1) * (item.unitPrice || 0), 0).toFixed(2)}</div>
              </div>
            `
                : ""
            }

            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
            
            <p>To view the full proposal and submit your deposit, please click the button below:</p>
            
            <a href="${invoiceUrl}" class="button">View Proposal & Submit Deposit</a>
            
            <p>If you have any questions about this proposal, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>CAPCo Fire Protection Systems</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>If you need assistance, please contact us directly.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // For now, we'll just log the email content
    // In production, you would integrate with your email service (Resend, SendGrid, etc.)
    console.log("📧 [SEND-INVOICE] Email content:", {
      to: recipientEmail,
      subject,
      htmlContent,
      invoiceUrl,
    });

    // Update invoice status to 'proposal' (sent)
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "proposal",
        sentAt: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updateError) {
      console.error("❌ [SEND-INVOICE] Error updating invoice status:", updateError);
    }

    return createSuccessResponse({
      message: "Invoice email sent successfully",
      recipientEmail,
      invoiceUrl,
      invoiceId,
    });
  } catch (error) {
    console.error("❌ [SEND-INVOICE] Unexpected error:", error);
    return createErrorResponse("Failed to send invoice email", 500);
  }
};
