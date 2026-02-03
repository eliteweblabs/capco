// Test what processSvg does to the database logo

const dbLogo = `<svg xmlns="http://www.w3.org/2000/svg" width="512"  fill="currentColor"  version="1.1" viewBox="0 0 512 164.3">
   <path
  d="M65.5,17.1L9.2,49.6v65l56.3,32.5,26.1-15.1-7.6-10.3-18.6,10.7-43.6-25.2v-50.3l43.6-25.2,43.6,25.2v50.3l-6.2,3.6c-6.3-8.2-15.4-20.1-15.9-20.7,6.9-1.6,10.7-7.4,10.7-14,0-13.1-13.4-16-23.3-16h-27.9l-10,12.9h39.8c3.6,0,5.6,1.2,5.6,4s-2,4.2-5.6,4.2h-39.9v23.1h15.2v-10.9h19.9l12.8,16.8,6.1,8,7.8,10.2,23.5-13.5V49.6l-56.3-32.5h.2Z"
  />
  <path fill="currentColor" d="M306.3,27.9h-15.2v47.7h-14.3V27.9h-15.2v-13.5h44.7v13.5Z"/>
</svg>`;

function processSvg(svg) {
  if (!svg || !svg.includes("<svg")) return svg;

  return (
    svg
      // Remove inline fill attributes from path elements
      .replace(/<path\s+([^>]*)\s+fill="[^"]*"([^>]*)>/gi, "<path $1$2>")
      .replace(/<path\s+fill="[^"]*"\s+([^>]*)>/gi, "<path $1>")
      // Ensure paths have class="fill"
      .replace(/<path\s+([^>]*?)(?:\s+class="[^"]*")?([^>]*)>/gi, (match) => {
        if (!match.includes("class=")) {
          return match.replace(/<path\s+/, '<path class="fill" ');
        }
        if (!match.includes('class="fill"') && !match.includes("class='fill'")) {
          return match.replace(/class="([^"]*)"/gi, (m, classes) => {
            return `class="${classes} fill"`;
          });
        }
        return match;
      })
  );
}

console.log("ORIGINAL:");
console.log(dbLogo.substring(0, 200));
console.log("\nPROCESSED:");
console.log(processSvg(dbLogo).substring(0, 200));
