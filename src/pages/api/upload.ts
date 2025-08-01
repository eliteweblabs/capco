import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const projectId = formData.get("projectId") as string;

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: "No files provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate file types and sizes
    const allowedTypes = ["application/pdf"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return new Response(
          JSON.stringify({ error: `File type ${file.type} not allowed` }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      if (file.size > maxSize) {
        return new Response(
          JSON.stringify({
            error: `File ${file.name} exceeds maximum size of 10MB`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // Here you would implement actual file upload logic
    // For now, we'll simulate a successful upload
    const uploadedFiles = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      id: crypto.randomUUID(),
    }));

    return new Response(
      JSON.stringify({
        success: true,
        files: uploadedFiles,
        projectId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Upload API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
