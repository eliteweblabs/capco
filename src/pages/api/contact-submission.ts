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

    // Validate required fields (only contact information is required)
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

    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database connection not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create a temporary project record for the contact submission
    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .insert({
        title: `${firstName} ${lastName} - Contact Submission`,
        address: address || "No address provided",
        authorId: null, // No authenticated user
        status: 1, // New/Contact status
        sqFt: null,
        newConstruction: projectType === "new-construction",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (projectError) {
      console.error("Error creating project:", projectError);
      return new Response(JSON.stringify({ error: "Failed to create project record" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectId = projectData.id;

    // Store contact information in a separate table or as project metadata
    const { error: contactError } = await supabase.from("contact_submissions").insert({
      projectId: projectId,
      firstName: firstName,
      lastName: lastName,
      email: email,
      phone: phone || null,
      company: company || null,
      project_type: projectType || null,
      message: message,
      submitted_at: new Date().toISOString(),
    });

    if (contactError) {
      console.error("Error storing contact information:", contactError);
      // Don't fail the entire request if contact info storage fails
    }

    // Handle file uploads if any
    const uploadedFiles = [];

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          // Generate unique file path
          const timestamp = Date.now();
          const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
          const filePath = `contact-submissions/${projectId}/${fileName}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("project-documents")
            .upload(filePath, file, {
              contentType: file.type,
              upsert: false,
            });

          if (uploadError) {
            console.error(`Error uploading ${file.name}:`, uploadError);
            continue; // Skip this file but continue with others
          }

          // Log file in database
          const { error: dbError } = await supabase.from("files").insert({
            projectId: projectId,
            authorId: null, // No authenticated user
            filePath: filePath,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            title: file.name,
            comments: "Contact submission file",
            status: "active",
            uploadedAt: new Date().toISOString(),
          });

          if (dbError) {
            console.error("Error logging file in database:", dbError);
          } else {
            uploadedFiles.push({
              name: file.name,
              size: file.size,
              type: file.type,
            });
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
        }
      }
    }

    // Send notification email to admin (optional)
    try {
      const { error: emailError } = await supabase.functions.invoke("send-contact-notification", {
        body: {
          projectId,
          firstName,
          lastName,
          email,
          phone,
          company,
          address,
          projectType,
          message,
          fileCount: uploadedFiles.length,
        },
      });

      if (emailError) {
        console.error("Error sending notification email:", emailError);
        // Don't fail the request if email fails
      }
    } catch (error) {
      console.error("Error calling email function:", error);
      // Don't fail the request if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Contact submission received successfully",
        projectId: projectId,
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
