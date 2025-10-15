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

    console.log(`🔍 [ENHANCED-PREVIEW] Loading preview for file: ${fileName} (${fileType})`);

    // Determine file type and create appropriate preview
    const fileExtension = fileName.toLowerCase().split(".").pop();
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(
      fileExtension || ""
    );
    const isPDF = fileType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
    const isVideo = ["mp4", "webm", "ogg", "avi", "mov"].includes(fileExtension || "");
    const isDocument = ["doc", "docx", "txt", "rtf"].includes(fileExtension || "");

    let htmlContent = "";

    if (isImage) {
      htmlContent = createImagePreview(fileUrl, fileName);
    } else if (isPDF) {
      htmlContent = createPDFPreview(fileUrl, fileName);
    } else if (isVideo) {
      htmlContent = createVideoPreview(fileUrl, fileName);
    } else if (isDocument) {
      htmlContent = createDocumentPreview(fileUrl, fileName, fileType);
    } else {
      htmlContent = createGenericPreview(fileUrl, fileName, fileType);
    }

    return new Response(
      JSON.stringify({
        success: true,
        htmlContent: htmlContent,
        documentName: fileName,
        fileType: fileType,
        isImage: isImage,
        isPDF: isPDF,
        isVideo: isVideo,
        isDocument: isDocument,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("❌ [ENHANCED-PREVIEW] Error:", error);
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

function createImagePreview(fileUrl: string, fileName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Image Preview - ${fileName}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0; 
          background: #f5f5f5;
          overflow: hidden;
        }
        .image-container {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #000;
        }
        .image-toolbar {
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 1000;
          position: relative;
        }
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
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
        .btn-danger {
          background: #dc2626;
          color: white;
        }
        .btn-danger:hover {
          background: #b91c1c;
        }
        .image-viewer {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .image-wrapper {
          position: relative;
          max-width: 100%;
          max-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .preview-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          cursor: crosshair;
        }
        .markup-canvas {
          position: absolute;
          top: 0;
          left: 0;
          pointer-events: none;
          z-index: 10;
        }
        .markup-tools {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0,0,0,0.8);
          padding: 10px;
          border-radius: 8px;
          display: none;
          z-index: 100;
        }
        .markup-tools.active {
          display: block;
        }
        .tool-group {
          display: flex;
          gap: 5px;
          margin-bottom: 10px;
        }
        .tool-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          background: #374151;
          color: white;
        }
        .tool-btn:hover {
          background: #4b5563;
        }
        .tool-btn.active {
          background: #2563eb;
        }
        .color-picker {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .zoom-controls {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(0,0,0,0.8);
          padding: 10px;
          border-radius: 8px;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .zoom-btn {
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 4px;
          background: #374151;
          color: white;
          cursor: pointer;
          font-size: 18px;
        }
        .zoom-btn:hover {
          background: #4b5563;
        }
        .zoom-level {
          color: white;
          font-weight: bold;
          min-width: 60px;
          text-align: center;
        }
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 18px;
        }
      </style>
    </head>
    <body>
      <div class="image-container">
        <div class="image-toolbar">
          <div class="toolbar-left">
            <span style="font-weight: bold; font-size: 16px;">🖼️ ${fileName}</span>
          </div>
          <div class="toolbar-right">
            <button class="btn btn-secondary" onclick="toggleMarkup()" id="markupToggle">
              ✏️ Markup
            </button>
            <button class="btn btn-primary" onclick="downloadImage()">
              📥 Download
            </button>
            <button class="btn btn-secondary" onclick="openInNewTab()">
              🔗 Open
            </button>
          </div>
        </div>
        
        <div class="image-viewer">
          <div class="image-wrapper">
            <img 
              id="previewImage" 
              src="${fileUrl}" 
              alt="${fileName}"
              class="preview-image"
              onload="hideLoading()"
            />
            <canvas id="markupCanvas" class="markup-canvas"></canvas>
            <div class="loading" id="loadingIndicator">Loading image...</div>
          </div>
        </div>

        <div class="markup-tools" id="markupTools">
          <div class="tool-group">
            <button class="tool-btn" data-tool="select" title="Select">↖️</button>
            <button class="tool-btn" data-tool="pen" title="Draw">✏️</button>
            <button class="tool-btn" data-tool="line" title="Line">📏</button>
            <button class="tool-btn" data-tool="rectangle" title="Rectangle">⬜</button>
            <button class="tool-btn" data-tool="circle" title="Circle">⭕</button>
            <button class="tool-btn" data-tool="text" title="Text">📝</button>
            <button class="tool-btn" data-tool="crop" title="Crop">✂️</button>
          </div>
          <div class="tool-group">
            <input type="color" class="color-picker" id="colorPicker" value="#ff0000" title="Color">
            <button class="tool-btn" onclick="clearMarkup()" title="Clear">🗑️</button>
            <button class="tool-btn" onclick="undoMarkup()" title="Undo">↶</button>
            <button class="tool-btn" onclick="saveMarkup()" title="Save">💾</button>
          </div>
        </div>

        <div class="zoom-controls">
          <button class="zoom-btn" onclick="zoomOut()">−</button>
          <span class="zoom-level" id="zoomLevel">100%</span>
          <button class="zoom-btn" onclick="zoomIn()">+</button>
          <button class="zoom-btn" onclick="resetZoom()" title="Reset">⌂</button>
        </div>
      </div>

      <script>
        let currentZoom = 100;
        let isDrawing = false;
        let currentTool = 'select';
        let startX, startY;
        let markupHistory = [];
        let currentHistoryIndex = -1;

        const image = document.getElementById('previewImage');
        const canvas = document.getElementById('markupCanvas');
        const ctx = canvas.getContext('2d');
        const colorPicker = document.getElementById('colorPicker');
        const zoomLevel = document.getElementById('zoomLevel');

        function hideLoading() {
          document.getElementById('loadingIndicator').style.display = 'none';
        }

        function resizeCanvas() {
          const rect = image.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
          canvas.style.width = rect.width + 'px';
          canvas.style.height = rect.height + 'px';
        }

        function updateZoom() {
          image.style.transform = \`scale(\${currentZoom / 100})\`;
          zoomLevel.textContent = \`\${currentZoom}%\`;
          resizeCanvas();
        }

        function zoomIn() {
          if (currentZoom < 500) {
            currentZoom += 25;
            updateZoom();
          }
        }

        function zoomOut() {
          if (currentZoom > 25) {
            currentZoom -= 25;
            updateZoom();
          }
        }

        function resetZoom() {
          currentZoom = 100;
          updateZoom();
        }

        function toggleMarkup() {
          const tools = document.getElementById('markupTools');
          const toggle = document.getElementById('markupToggle');
          
          if (tools.classList.contains('active')) {
            tools.classList.remove('active');
            toggle.textContent = '✏️ Markup';
            canvas.style.pointerEvents = 'none';
          } else {
            tools.classList.add('active');
            toggle.textContent = '✏️ Hide Tools';
            canvas.style.pointerEvents = 'auto';
            resizeCanvas();
          }
        }

        // Tool selection
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTool = btn.dataset.tool;
          });
        });

        // Drawing functionality
        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);

        function startDrawing(e) {
          if (currentTool === 'select') return;
          
          isDrawing = true;
          const rect = canvas.getBoundingClientRect();
          startX = e.clientX - rect.left;
          startY = e.clientY - rect.top;
          
          if (currentTool === 'pen') {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
          }
        }

        function draw(e) {
          if (!isDrawing || currentTool === 'select') return;
          
          const rect = canvas.getBoundingClientRect();
          const currentX = e.clientX - rect.left;
          const currentY = e.clientY - rect.top;
          
          ctx.strokeStyle = colorPicker.value;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          
          if (currentTool === 'pen') {
            ctx.lineTo(currentX, currentY);
            ctx.stroke();
          }
        }

        function stopDrawing() {
          if (!isDrawing) return;
          
          if (currentTool === 'line') {
            const rect = canvas.getBoundingClientRect();
            const endX = event.clientX - rect.left;
            const endY = event.clientY - rect.top;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          } else if (currentTool === 'rectangle') {
            const rect = canvas.getBoundingClientRect();
            const endX = event.clientX - rect.left;
            const endY = event.clientY - rect.top;
            
            ctx.strokeRect(startX, startY, endX - startX, endY - startY);
          } else if (currentTool === 'circle') {
            const rect = canvas.getBoundingClientRect();
            const endX = event.clientX - rect.left;
            const endY = event.clientY - rect.top;
            
            const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            ctx.beginPath();
            ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
            ctx.stroke();
          }
          
          isDrawing = false;
          saveState();
        }

        function clearMarkup() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          saveState();
        }

        function undoMarkup() {
          if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            const imageData = markupHistory[currentHistoryIndex];
            ctx.putImageData(imageData, 0, 0);
          }
        }

        function saveState() {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          markupHistory = markupHistory.slice(0, currentHistoryIndex + 1);
          markupHistory.push(imageData);
          currentHistoryIndex++;
        }

        function saveMarkup() {
          // Convert canvas to blob and download
          canvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '${fileName.replace(/\\.[^/.]+$/, "")}_marked.png';
            a.click();
            URL.revokeObjectURL(url);
          });
        }

        function downloadImage() {
          const a = document.createElement('a');
          a.href = '${fileUrl}';
          a.download = '${fileName}';
          a.click();
        }

        function openInNewTab() {
          window.open('${fileUrl}', '_blank');
        }

        // Initialize
        image.onload = () => {
          resizeCanvas();
          updateZoom();
        };

        // Handle window resize
        window.addEventListener('resize', resizeCanvas);
      </script>
    </body>
    </html>
  `;
}

function createPDFPreview(fileUrl: string, fileName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PDF Preview - ${fileName}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0; 
          background: #f5f5f5;
        }
        .pdf-container {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .pdf-toolbar {
          background: #2563eb;
          color: white;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .pdf-viewer {
          flex: 1;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pdf-iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-left: 10px;
        }
        .btn-primary {
          background: #1d4ed8;
          color: white;
        }
        .btn-secondary {
          background: #6b7280;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <div class="pdf-toolbar">
          <span style="font-weight: bold;">📄 ${fileName}</span>
          <div>
            <button class="btn btn-primary" onclick="downloadPDF()">📥 Download</button>
            <button class="btn btn-secondary" onclick="openInNewTab()">🔗 Open</button>
          </div>
        </div>
        <div class="pdf-viewer">
          <iframe src="${fileUrl}" class="pdf-iframe"></iframe>
        </div>
      </div>
      <script>
        function downloadPDF() {
          const a = document.createElement('a');
          a.href = '${fileUrl}';
          a.download = '${fileName}';
          a.click();
        }
        function openInNewTab() {
          window.open('${fileUrl}', '_blank');
        }
      </script>
    </body>
    </html>
  `;
}

function createVideoPreview(fileUrl: string, fileName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Video Preview - ${fileName}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 0; 
          background: #000;
        }
        .video-container {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        .video-toolbar {
          background: rgba(0,0,0,0.8);
          color: white;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .video-viewer {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .video-player {
          max-width: 100%;
          max-height: 100%;
        }
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-left: 10px;
        }
        .btn-primary {
          background: #2563eb;
          color: white;
        }
        .btn-secondary {
          background: #6b7280;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="video-container">
        <div class="video-toolbar">
          <span style="font-weight: bold;">🎥 ${fileName}</span>
          <div>
            <button class="btn btn-primary" onclick="downloadVideo()">📥 Download</button>
            <button class="btn btn-secondary" onclick="openInNewTab()">🔗 Open</button>
          </div>
        </div>
        <div class="video-viewer">
          <video controls class="video-player">
            <source src="${fileUrl}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
      <script>
        function downloadVideo() {
          const a = document.createElement('a');
          a.href = '${fileUrl}';
          a.download = '${fileName}';
          a.click();
        }
        function openInNewTab() {
          window.open('${fileUrl}', '_blank');
        }
      </script>
    </body>
    </html>
  `;
}

function createDocumentPreview(fileUrl: string, fileName: string, fileType: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Document Preview - ${fileName}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background: #f5f5f5;
        }
        .document-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 20px;
          text-align: center;
        }
        .document-icon {
          font-size: 48px;
          margin-bottom: 20px;
        }
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
          margin: 5px;
        }
        .btn-primary {
          background: #2563eb;
          color: white;
        }
        .btn-secondary {
          background: #6b7280;
          color: white;
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        <div class="document-icon">📄</div>
        <h2>${fileName}</h2>
        <p>This document type cannot be previewed directly in the browser.</p>
        <button class="btn btn-primary" onclick="downloadDocument()">📥 Download Document</button>
        <button class="btn btn-secondary" onclick="openInNewTab()">🔗 Open in New Tab</button>
      </div>
      <script>
        function downloadDocument() {
          const a = document.createElement('a');
          a.href = '${fileUrl}';
          a.download = '${fileName}';
          a.click();
        }
        function openInNewTab() {
          window.open('${fileUrl}', '_blank');
        }
      </script>
    </body>
    </html>
  `;
}

function createGenericPreview(fileUrl: string, fileName: string, fileType: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>File Preview - ${fileName}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background: #f5f5f5;
        }
        .file-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 40px;
          text-align: center;
        }
        .file-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }
        .file-info {
          margin-bottom: 30px;
        }
        .file-type {
          color: #6b7280;
          font-size: 14px;
          margin-top: 10px;
        }
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px;
          text-decoration: none;
          display: inline-block;
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
      </style>
    </head>
    <body>
      <div class="file-container">
        <div class="file-icon">📁</div>
        <div class="file-info">
          <h2>${fileName}</h2>
          <div class="file-type">${fileType || "Unknown file type"}</div>
        </div>
        <p>This file type cannot be previewed directly.</p>
        <button class="btn btn-primary" onclick="downloadFile()">📥 Download File</button>
        <button class="btn btn-secondary" onclick="openInNewTab()">🔗 Open in New Tab</button>
      </div>
      <script>
        function downloadFile() {
          const a = document.createElement('a');
          a.href = '${fileUrl}';
          a.download = '${fileName}';
          a.click();
        }
        function openInNewTab() {
          window.open('${fileUrl}', '_blank');
        }
      </script>
    </body>
    </html>
  `;
}
