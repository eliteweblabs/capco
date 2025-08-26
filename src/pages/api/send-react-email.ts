import type { APIRoute } from "astro";
import {
  sendWelcomeEmail,
  sendProjectNotificationEmail,
  sendTestEmail,
} from "../../lib/react-email-helpers";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { to, type, ...props } = body;

    if (!to) {
      return new Response(JSON.stringify({ error: "Recipient email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let result;

    switch (type) {
      case "welcome":
        result = await sendWelcomeEmail(to, {
          name: props.name || "User",
          appName: props.appName || "CAPCo",
        });
        break;

      case "project-notification":
        result = await sendProjectNotificationEmail(to, {
          recipientName: props.recipientName || "User",
          projectTitle: props.projectTitle || "Your Project",
          projectId: props.projectId || "12345",
          statusMessage: props.statusMessage || "Your project has been updated.",
          actionRequired: props.actionRequired || false,
          actionUrl: props.actionUrl || "https://yourapp.com/projects",
          actionText: props.actionText || "View Project",
        });
        break;

      case "test":
        result = await sendTestEmail(to);
        break;

      default:
        return new Response(
          JSON.stringify({
            error: "Invalid email type. Use: welcome, project-notification, test",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Email sent successfully to ${Array.isArray(to) ? to.join(", ") : to}`,
          messageId: result.messageId,
          to: to,
          type: type,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || "Failed to send email",
          to: to,
          type: type,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: unknown) {
    console.error("React Email API error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// For testing purposes - provides a simple form
export const GET: APIRoute = async () => {
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head><title>React Email Test</title></head>
    <body style="font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px;">
      <h2>🎨 React Email Test</h2>
      <p>Send beautiful, styled emails using React Email components:</p>
      
      <form id="emailForm">
        <div style="margin-bottom: 15px;">
          <label for="email" style="display: block; margin-bottom: 5px; font-weight: 500;">Email Address:</label>
          <input type="email" id="email" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="type" style="display: block; margin-bottom: 5px; font-weight: 500;">Email Type:</label>
          <select id="type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            <option value="welcome">Welcome Email</option>
            <option value="project-notification">Project Notification</option>
            <option value="test">Test Email</option>
          </select>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="name" style="display: block; margin-bottom: 5px; font-weight: 500;">Recipient Name:</label>
          <input type="text" id="name" value="John Doe" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        
        <button type="submit" style="background-color: #3b82f6; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
          Send React Email
        </button>
      </form>
      
      <div id="result" style="margin-top: 20px;"></div>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <h3>Features:</h3>
        <ul>
          <li>🎨 Beautiful, responsive email designs</li>
          <li>⚡ React components with proper styling</li>
          <li>📱 Mobile-friendly layouts</li>
          <li>🔧 Easy to customize and extend</li>
        </ul>
      </div>

      <script>
        document.getElementById('emailForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const type = document.getElementById('type').value;
          const name = document.getElementById('name').value;
          const result = document.getElementById('result');
          
          result.innerHTML = '<p style="color: #666;">Sending React Email...</p>';
          
          try {
            const response = await fetch('/api/send-react-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                to: email, 
                type: type,
                name: name,
                appName: 'CAPCo Demo',
                projectTitle: 'Demo Project #123',
                projectId: 'PROJ-2024-001',
                statusMessage: 'Your project status has been updated to "In Review". Please check the latest changes and provide feedback.',
                actionRequired: type === 'project-notification',
                actionUrl: 'https://yourapp.com/projects/123',
                actionText: 'Review Project'
              })
            });
            
            const data = await response.json();
            
            if (data.success) {
              result.innerHTML = '<p style="color: green;">✅ React Email sent successfully!</p>';
            } else {
              result.innerHTML = '<p style="color: red;">❌ Error: ' + data.error + '</p>';
            }
          } catch (error) {
            result.innerHTML = '<p style="color: red;">❌ Network error: ' + error.message + '</p>';
          }
        });
      </script>
    </body>
    </html>
    `,
    {
      headers: { "Content-Type": "text/html" },
    }
  );
};
