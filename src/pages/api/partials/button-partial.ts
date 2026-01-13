import type { APIRoute } from "astro";

interface ButtonPartialRequest {
  text: string;
  variant: string;
  size: string;
  dataAttributes: Record<string, string>;
  fullWidth: boolean;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body: ButtonPartialRequest = await request.json();
    const { text, variant, size, dataAttributes, fullWidth } = body;

    // Generate button HTML based on the parameters
    const buttonClasses = [
      "inline-flex items-center justify-center rounded-md font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
    ];

    // Add variant-specific classes
    switch (variant) {
      case "danger":
        buttonClasses.push("bg-red-600 text-white hover:bg-red-700");
        break;
      case "anchor":
        buttonClasses.push("text-primary-600 hover:text-primary-800 underline");
        break;
      case "primary":
        buttonClasses.push("bg-primary-600 text-white hover:bg-primary-700");
        break;
      case "secondary":
        buttonClasses.push("bg-gray-200 text-gray-900 hover:bg-gray-300");
        break;
      default:
        buttonClasses.push("bg-gray-200 text-gray-900 hover:bg-gray-300");
    }

    // Add size-specific classes
    switch (size) {
      case "sm":
        buttonClasses.push("h-8 px-3 text-sm");
        break;
      case "lg":
        buttonClasses.push("h-12 px-8 text-lg");
        break;
      default:
        buttonClasses.push("h-10 px-4 text-base");
    }

    // Add fullWidth class if needed
    if (fullWidth) {
      buttonClasses.push("w-full");
    }

    // Build data attributes string
    const dataAttributesString = Object.entries(dataAttributes)
      .map(([key, value]) => `data-${key}="${value}"`)
      .join(" ");

    // Generate the button HTML
    const buttonHTML = `<button class="${buttonClasses.join(" ")}" ${dataAttributesString}>${text}</button>`;

    return new Response(buttonHTML, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error) {
    console.error("Error generating button partial:", error);
    return new Response("Error generating button", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
};
