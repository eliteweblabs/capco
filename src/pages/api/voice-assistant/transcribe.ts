import type { APIRoute } from "astro";

/**
 * Voice Assistant Transcription API
 * Uses cloud-based speech recognition for better accuracy
 * Supports multiple providers: Deepgram, Google Cloud Speech, AssemblyAI
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "Audio file is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Try Deepgram first (best accuracy, easy setup)
    const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    if (deepgramApiKey) {
      try {
        const transcript = await transcribeWithDeepgram(audioFile, deepgramApiKey);
        return new Response(JSON.stringify({ transcript, provider: "deepgram" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Deepgram error:", error);
        // Fall through to next provider
      }
    }

    // Fallback to Google Cloud Speech-to-Text if configured
    const googleApiKey = process.env.GOOGLE_CLOUD_SPEECH_API_KEY;
    if (googleApiKey) {
      try {
        const transcript = await transcribeWithGoogle(audioFile, googleApiKey);
        return new Response(JSON.stringify({ transcript, provider: "google" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Google Speech error:", error);
      }
    }

    // If no cloud providers configured, return error
    return new Response(
      JSON.stringify({
        error:
          "No speech recognition service configured. Please set DEEPGRAM_API_KEY or GOOGLE_CLOUD_SPEECH_API_KEY",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("❌ [VOICE-ASSISTANT-TRANSCRIBE] Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Transcription failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Transcribe with Deepgram (recommended - best accuracy)
async function transcribeWithDeepgram(audioFile: File, apiKey: string): Promise<string> {
  const audioBuffer = await audioFile.arrayBuffer();

  const response = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&language=en-US&punctuate=true&smart_format=true",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": audioFile.type || "audio/wav",
      },
      body: audioBuffer,
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Deepgram API error: ${error}`);
  }

  const data = await response.json();
  return data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
}

// Transcribe with Google Cloud Speech-to-Text
async function transcribeWithGoogle(audioFile: File, apiKey: string): Promise<string> {
  const audioBuffer = await audioFile.arrayBuffer();
  const base64Audio = Buffer.from(audioBuffer).toString("base64");

  const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      config: {
        encoding: "WEBM_OPUS", // Adjust based on audio format
        sampleRateHertz: 16000,
        languageCode: "en-US",
        enableAutomaticPunctuation: true,
        model: "latest_long", // Best for longer audio
      },
      audio: {
        content: base64Audio,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Speech API error: ${error}`);
  }

  const data = await response.json();
  return data.results?.[0]?.alternatives?.[0]?.transcript || "";
}
