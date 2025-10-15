/**
 * Test endpoint to demonstrate the enhanced get-project API filtering capabilities
 *
 * This is a simple test endpoint that shows how to use the new filtering features.
 * Access via: /api/test-project-filters
 */

import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request, url }) => {
  const baseUrl = new URL(request.url).origin;

  const examples = [
    {
      name: "Search for 'fire' in all text fields",
      url: `${baseUrl}/api/get-project?search=fire`,
      description:
        "Searches across title, address, companyName, subject, building, project, and service fields",
    },
    {
      name: "Filter by status and limit results",
      url: `${baseUrl}/api/get-project?status=1&limit=5`,
      description: "Gets projects with status 1, limited to 5 results",
    },
    {
      name: "Filter by author and sort by creation date",
      url: `${baseUrl}/api/get-project?authorId=123&sortBy=createdAt&sortOrder=asc`,
      description: "Gets projects by specific author, sorted by creation date (oldest first)",
    },
    {
      name: "Filter by building type and date range",
      url: `${baseUrl}/api/get-project?building=residential&dateFrom=2024-01-01&dateTo=2024-12-31`,
      description: "Gets residential projects created in 2024",
    },
    {
      name: "Filter by new construction and assigned user",
      url: `${baseUrl}/api/get-project?newConstruction=true&assignedToId=456`,
      description: "Gets new construction projects assigned to specific user",
    },
    {
      name: "Complex search with multiple filters",
      url: `${baseUrl}/api/get-project?search=alarm&status=2&building=commercial&limit=10&sortBy=updatedAt&sortOrder=desc`,
      description:
        "Searches for 'alarm' in text fields, status 2, commercial buildings, limited to 10, sorted by update date",
    },
    {
      name: "Pagination example",
      url: `${baseUrl}/api/get-project?limit=5&offset=10`,
      description: "Gets 5 projects starting from the 11th result (for pagination)",
    },
    {
      name: "Filter overdue projects",
      url: `${baseUrl}/api/get-project?overdue=true&sortBy=dueDate&sortOrder=asc`,
      description: "Gets all overdue projects, sorted by due date (earliest first)",
    },
    {
      name: "Filter projects due in next 7 days",
      url: `${baseUrl}/api/get-project?dueDateFrom=${new Date().toISOString()}&dueDateTo=${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}`,
      description: "Gets projects due within the next 7 days",
    },
    {
      name: "Filter non-overdue projects",
      url: `${baseUrl}/api/get-project?overdue=false&sortBy=dueDate&sortOrder=asc`,
      description: "Gets all non-overdue projects, sorted by due date",
    },
  ];

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Project API Filter Examples</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .example { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .name { font-weight: bold; color: #333; }
        .url { color: #0066cc; word-break: break-all; }
        .description { color: #666; margin-top: 5px; }
        .copy-btn { 
          background: #007cba; color: white; border: none; padding: 5px 10px; 
          border-radius: 3px; cursor: pointer; margin-left: 10px;
        }
      </style>
    </head>
    <body>
      <h1>Enhanced Project API - Filter Examples</h1>
      <p>Click the copy buttons to copy URLs to clipboard, then test them in your browser or API client.</p>
      
      ${examples
        .map(
          (example) => `
        <div class="example">
          <div class="name">${example.name}</div>
          <div class="url" id="url-${examples.indexOf(example)}">${example.url}</div>
          <button class="copy-btn" onclick="copyToClipboard('url-${examples.indexOf(example)}')">Copy URL</button>
          <div class="description">${example.description}</div>
        </div>
      `
        )
        .join("")}
      
      <script>
        function copyToClipboard(elementId) {
          const element = document.getElementById(elementId);
          navigator.clipboard.writeText(element.textContent).then(() => {
            alert('URL copied to clipboard!');
          });
        }
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
};
