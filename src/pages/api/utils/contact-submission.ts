import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();

    // Extract form fields
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const company = formData.get("company") as string;
    const address = formData.get("address") as string;
    const projectType = formData.get("projectType") as string;
    const message = formData.get("message") as string;

    // Get files
    const files = formData.getAll("files") as File[];

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields. Please fill in your first name, last name, and email address.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create a Supabase admin client for public endpoints
    const { createClient } = await import("@supabase/supabase-js");
    // Use SUPABASE_SECRET
    const supabaseAdmin = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL || "",
      import.meta.env.SUPABASE_SECRET || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Store contact information
    const { data: contactData, error: contactError } = await supabaseAdmin
      .from("contactSubmissions")
      .insert({
        firstName,
        lastName,
        email,
        phone: phone || null,
        company: company || null,
        address: address || null,
        projectType: projectType || null,
        message,
        submittedAt: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (contactError) {
      console.error("Error storing contact information:", contactError);
      console.error("Contact error details:", {
        message: contactError.message,
        code: contactError.code,
        details: contactError.details,
        hint: contactError.hint,
      });
      return new Response(
        JSON.stringify({
          error: "Failed to store contact information",
          details: contactError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const submissionId = contactData.id;

    // Handle file uploads if any
    const uploadedFiles = [];

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          // Generate unique file path
          const timestamp = Date.now();
          const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
          const filePath = `contact-submissions/${submissionId}/${fileName}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from("contact-files")
            .upload(filePath, file, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) {
            console.error(`Error uploading ${file.name}:`, uploadError);
            continue; // Skip this file but continue with others
          }

          // Update contact submission with file information
          // First get the current files array
          const { data: currentData, error: fetchError } = await supabaseAdmin
            .from("contactSubmissions")
            .select("files")
            .eq("id", submissionId)
            .single();

          if (fetchError) {
            console.error("Error fetching current files:", fetchError);
            return new Response(
              JSON.stringify({ success: false, error: "Failed to fetch current files" }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          // Append the new file to the existing files array
          const currentFiles = currentData?.files || [];
          const updatedFiles = [...currentFiles, filePath];

          const { error: updateError } = await supabaseAdmin
            .from("contactSubmissions")
            .update({
              files: updatedFiles,
            })
            .eq("id", submissionId);

          if (updateError) {
            console.error("Error updating contact submission with file:", updateError);
          } else {
            uploadedFiles.push({
              name: file.name,
              size: file.size,
              type: file.type,
              path: filePath,
            });
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
        }
      }
    }

    // Send notification email to admins via delivery API (uses templates/email/template.html)
    try {
      const { data: admins } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("role", "Admin");
      let adminEmails = admins?.map((a) => a.email).filter(Boolean) || [];
      try {
        const { globalCompanyData } = await import("../global/global-company-data");
        const companyData = await globalCompanyData();
        const websiteAdmin = companyData.globalCompanyEmail;
        if (websiteAdmin && !adminEmails.includes(websiteAdmin)) {
          adminEmails.push(websiteAdmin);
        }
      } catch {
        // ignore
      }
      const { getBaseUrl } = await import("../../../lib/url-utils");
      const deliveryBaseUrl = getBaseUrl(request);
      const emailContent = `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
        <p><strong>Company:</strong> ${company || "Not provided"}</p>
        <p><strong>Address:</strong> ${address || "Not provided"}</p>
        <p><strong>Project Type:</strong> ${projectType || "Not provided"}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p><strong>Files Uploaded:</strong> ${uploadedFiles.length}</p>
        ${
          uploadedFiles.length > 0
            ? `<p><strong>Uploaded Files:</strong></p><ul>${uploadedFiles.map((f) => `<li>${f.name} (${(f.size / 1024 / 1024).toFixed(2)} MB)</li>`).join("")}</ul>`
            : ""
        }
      `;
      if (adminEmails.length > 0) {
        const emailResponse = await fetch(`${deliveryBaseUrl}/api/delivery/update-delivery`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            usersToNotify: adminEmails,
            method: "email",
            emailSubject: `New Contact Form Submission from ${firstName} ${lastName}`,
            emailContent,
            buttonLink: `${deliveryBaseUrl}/admin/contact-submissions`,
            buttonText: "View contact submissions",
            trackLinks: false,
          }),
        });
        const emailResult = await emailResponse.json();
        if (!emailResult.success) {
          console.error("Error sending notification email:", emailResult.error);
        }
      }
    } catch (error) {
      console.error("Error sending notification email:", error);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Contact submission received successfully",
        submissionId,
        filesUploaded: uploadedFiles.length,
        uploadedFiles: uploadedFiles,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Contact submission error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
