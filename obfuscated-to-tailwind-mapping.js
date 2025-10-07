// Obfuscated Class Names to Tailwind CSS Mapping
// This script helps convert obfuscated class names to Tailwind CSS equivalents

const obfuscatedToTailwind = {
  // Common obfuscated patterns and their likely Tailwind equivalents
  R0X5VtiZIoV7IjvrxBJ_: "bg-blue-500", // Likely a background color
  hPWJir4VhLurUkdR8iyI: "text-white", // Likely text color
  UiRKvjjl_rZRhuc5tGul: "p-4", // Likely padding

  // Add more mappings as you discover them
  // Pattern: 'obfuscated-class': 'tailwind-class',
};

// Function to convert obfuscated classes to Tailwind
function convertToTailwind(obfuscatedClass) {
  return obfuscatedToTailwind[obfuscatedClass] || obfuscatedClass;
}

// Function to process a string with multiple obfuscated classes
function processClassString(classString) {
  const classes = classString.split(" ");
  return classes.map(convertToTailwind).join(" ");
}

// Example usage:
console.log("Original obfuscated classes:");
console.log("R0X5VtiZIoV7IjvrxBJ_ hPWJir4VhLurUkdR8iyI UiRKvjjl_rZRhuc5tGul");

console.log("\nConverted to Tailwind:");
console.log(processClassString("R0X5VtiZIoV7IjvrxBJ_ hPWJir4VhLurUkdR8iyI UiRKvjjl_rZRhuc5tGul"));

// Export for use in other files
export { convertToTailwind, processClassString, obfuscatedToTailwind };
