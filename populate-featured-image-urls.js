import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function populateFeaturedImageUrls() {
  try {
    console.log("🔄 Starting to populate featured image URLs...");

    // Get all projects with featured images but no featured_image_url
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, featured_image")
      .not("featured_image", "is", null)
      .is("featured_image_url", null);

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      return;
    }

    console.log(`Found ${projects.length} projects with featured images to update`);

    for (const project of projects) {
      try {
        // Get the file details
        const { data: file, error: fileError } = await supabase
          .from("files")
          .select("file_path")
          .eq("id", parseInt(project.featured_image))
          .single();

        if (fileError || !file) {
          console.warn(
            `No file found for project ${project.id}, featured_image: ${project.featured_image}`
          );
          continue;
        }

        // Generate signed URL
        const pathWithoutBucket = file.file_path.replace(/^project-documents\//, "");
        console.log(`Generating signed URL for project ${project.id}, path: ${pathWithoutBucket}`);

        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from("project-documents")
          .createSignedUrl(pathWithoutBucket, 86400 * 30); // 30 days expiry

        if (urlError || !signedUrlData) {
          console.warn(`Failed to generate signed URL for project ${project.id}:`, urlError);
          continue;
        }

        // Update the project with the signed URL
        const { error: updateError } = await supabase
          .from("projects")
          .update({ featured_image_url: signedUrlData.signedUrl })
          .eq("id", project.id);

        if (updateError) {
          console.error(`Failed to update project ${project.id}:`, updateError);
        } else {
          console.log(`✅ Updated project ${project.id} with featured image URL`);
        }
      } catch (error) {
        console.error(`Error processing project ${project.id}:`, error);
      }
    }

    console.log("🎉 Finished populating featured image URLs");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

populateFeaturedImageUrls();
