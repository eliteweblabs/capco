import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    console.log('📞 [WEBHOOK] Incoming call received:', body);
    
    // Forward to your local N8N (for development)
    const n8nResponse = await fetch('http://localhost:5678/webhook-test/webhook/incoming-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (n8nResponse.ok) {
      const n8nData = await n8nResponse.json();
      console.log('✅ [WEBHOOK] N8N response:', n8nData);
      return new Response(JSON.stringify(n8nData), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      console.error('❌ [WEBHOOK] N8N error:', await n8nResponse.text());
      // Return basic NCCO response as fallback
      return new Response(JSON.stringify({
        ncco: [
          {
            action: "talk",
            text: "Hello! This is your AI assistant. How can I help you today?",
            voiceName: "Amy"
          }
        ]
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    console.error('❌ [WEBHOOK] Error:', error);
    
    // Return basic NCCO response as fallback
    return new Response(JSON.stringify({
      ncco: [
        {
          action: "talk",
          text: "Hello! This is your AI assistant. How can I help you today?",
          voiceName: "Amy"
        }
      ]
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};