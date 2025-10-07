import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase";

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
    const supabaseAdmin = createClient(
      import.meta.env.SUPABASE_URL || "",
      import.meta.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Store contact information
    const { data: contactData, error: contactError } = await supabaseAdmin
      .from("contact_submissions")
      .insert({
        firstName,
        lastName,
        email,
        phone: phone || null,
        company: company || null,
        address: address || null,
        project_type: projectType || null,
        message,
        submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (contactError) {
      console.error("Error storing contact information:", contactError);
      return new Response(JSON.stringify({ error: "Failed to store contact information" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
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
          const { error: updateError } = await supabaseAdmin
            .from("contact_submissions")
            .update({
              files: supabaseAdmin.sql`array_append(files, ${filePath})`,
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

    // Send notification email to admin
    try {
      const emailResponse = await fetch(`${new URL(request.url).origin}/api/email-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usersToNotify: ["admin"], // Special flag for admin notifications
          emailType: "contact",
          emailSubject: `New Contact Form Submission from ${firstName} ${lastName}`,
          emailContent: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "Not provided"}</p>
            <p><strong>Company:</strong> ${company || "Not provided"}</p>
            <p><strong>Address:</strong> ${address || "Not provided"}</p>
            <p><strong>Project Type:</strong> ${projectType}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
            <p><strong>Files Uploaded:</strong> ${uploadedFiles.length}</p>
            ${
              uploadedFiles.length > 0
                ? `
            <p><strong>Uploaded Files:</strong></p>
            <ul>
              ${uploadedFiles.map((file) => `<li>${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</li>`).join("")}
            </ul>
            `
                : ""
            }
          `,
          trackLinks: true,
        }),
      });

      const emailResult = await emailResponse.json();
      if (!emailResult.success) {
        console.error("Error sending notification email:", emailResult.error);
        // Don't fail the request if email fails
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
