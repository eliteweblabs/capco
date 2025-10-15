import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { fileUrl, fileName, fileType } = body;

    if (!fileUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "File URL is required",
        }),
        { status: 400 }
      );
    }

    console.log(`🔍 [PDF-PREVIEW-API] Loading preview for file: ${fileName}`);

    // Check if it's a PDF file
    if (fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
      // For PDF files, we'll need to convert them to HTML for preview
      // For now, we'll create a simple HTML wrapper that shows the PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>PDF Preview</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #f5f5f5;
            }
            .pdf-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .pdf-header {
              background: #2563eb;
              color: white;
              padding: 15px 20px;
              font-weight: bold;
            }
            .pdf-content {
              padding: 20px;
              text-align: center;
            }
            .pdf-viewer {
              width: 100%;
              height: 600px;
              border: 2px solid #e5e7eb;
              border-radius: 8px;
              background: #f9fafb;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            }
            .pdf-icon {
              font-size: 48px;
              margin-bottom: 16px;
              color: #dc2626;
            }
            .pdf-project-title {
              font-size: 18px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
            }
            .pdf-message {
              color: #6b7280;
              margin-bottom: 20px;
              max-width: 400px;
              line-height: 1.5;
            }
            .pdf-actions {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              justify-content: center;
            }
            .btn {
              padding: 10px 20px;
              border-radius: 6px;
              text-decoration: none;
              font-weight: 500;
              transition: all 0.2s;
              border: none;
              cursor: pointer;
            }
            .btn-primary {
              background: #2563eb;
              color: white;
            }
            .btn-primary:hover {
              background: #1d4ed8;
            }
            .btn-secondary {
              background: #6b7280;
              color: white;
            }
            .btn-secondary:hover {
              background: #4b5563;
            }
            .pdf-iframe {
              width: 100%;
              height: 100%;
              border: none;
              display: block;
            }
            .loading {
              display: none;
            }
            .loading.show {
              display: block;
            }
          </style>
        </head>
        <body>
          <div class="pdf-container">
            <div class="pdf-header">
              📄 ${fileName}
            </div>
            <div class="pdf-content">
              <iframe
                id="pdfIframe"
                src="${fileUrl}"
                class="pdf-iframe"
                style="width: 100%; height: 600px; border: none; display: block;"
              ></iframe>
              <div class="pdf-viewer" id="pdfViewer" style="display: none;">
                <div class="pdf-icon">📄</div>
                <div class="pdf-project-title">PDF Document</div>
                <div class="pdf-message">
                  PDF preview is loading... If it doesn't appear, you can open it in a new tab or download it.
                </div>
                <div class="pdf-actions">
                  <a href="${fileUrl}" target="_blank" class="btn btn-primary">
                    🔗 Open PDF
                  </a>
                  <a href="${fileUrl}" download="${fileName}" class="btn btn-secondary">
                    📥 Download PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <script>
            // Try to load PDF in iframe, fallback to viewer if blocked
            const iframe = document.getElementById('pdfIframe');
            const viewer = document.getElementById('pdfViewer');
            let pdfLoaded = false;
            
            iframe.onload = function() {
              pdfLoaded = true;
              console.log('PDF iframe loaded successfully');
              // Show the iframe and hide the fallback viewer
              iframe.style.display = 'block';
              viewer.style.display = 'none';
            };
            
            iframe.onerror = function() {
              console.log('PDF iframe failed to load, showing fallback');
              showFallback();
            };
            
            // Check if PDF actually loaded after a short delay
            setTimeout(() => {
              if (!pdfLoaded) {
                // Check if iframe has content or if it's showing an error
                try {
                  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                  if (!iframeDoc || iframeDoc.body.innerHTML.includes('blocked') || iframeDoc.body.innerHTML.includes('error')) {
                    console.log('PDF appears to be blocked, showing fallback');
                    showFallback();
                  }
                } catch (e) {
                  // Cross-origin or other issues, show fallback
                  console.log('Cannot access iframe content, showing fallback');
                  showFallback();
                }
              }
            }, 2000);
            
            function showFallback() {
              iframe.style.display = 'none';
              viewer.style.display = 'flex';
            }
          </script>
        </body>
        </html>
      `;

      return new Response(
        JSON.stringify({
          success: true,
          htmlContent: htmlContent,
          documentName: fileName,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      // For non-PDF files, show a simple preview
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>File Preview</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #f5f5f5;
            }
            .file-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              padding: 20px;
              text-align: center;
            }
            .file-icon {
              font-size: 48px;
              margin-bottom: 20px;
            }
            .download-link {
              display: inline-block;
              margin-top: 15px;
              padding: 10px 20px;
              background: #2563eb;
              color: white;
              text-decoration: none;
              border-radius: 5px;
            }
            .download-link:hover {
              background: #1d4ed8;
            }
          </style>
        </head>
        <body>
          <div class="file-container">
            <div class="file-icon">📄</div>
            <h2>${fileName}</h2>
            <p>This file type cannot be previewed directly.</p>
            <a href="${fileUrl}" class="download-link" download="${fileName}">
              📥 Download File
            </a>
          </div>
        </body>
        </html>
      `;

      return new Response(
        JSON.stringify({
          success: true,
          htmlContent: htmlContent,
          documentName: fileName,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
  } catch (error: any) {
    console.error("❌ [PDF-PREVIEW-API] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to load preview",
        error: error.message,
      }),
      { status: 500 }
    );
  }
};
