/**
 * Create a Vapi.ai Pronunciation Dictionary
 * 
 * This script creates a pronunciation dictionary for custom name pronunciations
 * 
 * Usage:
 *   node scripts/create-vapi-pronunciation-dict.js
 * 
 * To add pronunciations, edit the pronunciations array below
 */

import "dotenv/config";
import fetch from "node-fetch";

const VAPI_API_KEY = process.env.VAPI_API_KEY;

// Define your custom pronunciations here
// Format: { stringToReplace: "exact text to replace", pronunciation: "phonetic spelling" }
const pronunciations = [
  {
    stringToReplace: "Levine",
    pronunciation: "luh-VEEN", // Simple phonetic
    // Or use IPA: "/lə'viːn/"
  },
  {
    stringToReplace: "Barry",
    pronunciation: "BAIR-ee",
  },
  // Add more pronunciations as needed:
  // {
  //   stringToReplace: "Siobhan",
  //   pronunciation: "shuh-VAWN",
  // },
];

// Create pronunciation dictionary
async function createPronunciationDictionary() {
  if (!VAPI_API_KEY) {
    console.error("❌ VAPI_API_KEY environment variable not found");
    process.exit(1);
  }

  try {
    console.log("📚 Creating Vapi pronunciation dictionary...");

    // Create the dictionary
    const response = await fetch("https://api.vapi.ai/pronunciation-dictionary", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Barry Levine Law Office Pronunciations",
        rules: pronunciations.map((p) => ({
          stringToReplace: p.stringToReplace,
          type: "phoneme",
          phoneme: p.pronunciation.includes("/") 
            ? p.pronunciation // Already in IPA format
            : convertToPhonetic(p.pronunciation), // Convert phonetic to IPA
          alphabet: "ipa",
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create dictionary: ${response.status} ${error}`);
    }

    const dictionary = await response.json();
    console.log("✅ Pronunciation dictionary created successfully!");
    console.log("📝 Dictionary ID:", dictionary.id);
    console.log("📝 Version ID:", dictionary.versionId);
    console.log("\n💡 To use this dictionary, add to your assistant config:");
    console.log(JSON.stringify({
      voice: {
        pronunciationDictionaryLocators: [
          {
            pronunciationDictionaryId: dictionary.id,
            versionId: dictionary.versionId,
          },
        ],
      },
    }, null, 2));

    return dictionary;
  } catch (error) {
    console.error("❌ Error creating pronunciation dictionary:", error);
    throw error;
  }
}

// Simple phonetic to IPA conversion (basic mapping)
// For more accurate IPA, you may want to use a proper conversion library
function convertToPhonetic(phonetic) {
  // This is a very basic mapping - you may need to adjust
  // For production, consider using a proper IPA conversion library
  let ipa = phonetic
    .toLowerCase()
    .replace(/uh/g, "ə")
    .replace(/ee/g, "iː")
    .replace(/oo/g, "uː")
    .replace(/aa/g, "ɑː")
    .replace(/ay/g, "eɪ")
    .replace(/bair/g, "bɛr")
    .replace(/-/g, ""); // Remove hyphens

  return `/${ipa}/`;
}

// Main execution
async function main() {
  try {
    await createPronunciationDictionary();
  } catch (error) {
    console.error("❌ Failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createPronunciationDictionary };

