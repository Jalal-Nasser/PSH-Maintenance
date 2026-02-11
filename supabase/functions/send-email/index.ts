import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface EmailRequest {
  sender_email: string;
  message: string;
}

const ZEPTO_MAIL_URL = "https://api.zeptomail.com/v1.1/email";
// You might need to adjust this URL based on your region (e.g., .eu, .in)

serve(async (req: Request) => {
  // 1. Handle CORS (for local testing and browser calls)
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { sender_email, message } = await req.json() as EmailRequest;

    // 2. Validate input
    if (!sender_email || !message) {
      throw new Error("Missing sender_email or message");
    }

    // 3. Get Secrets
    const ZEPTO_TOKEN = Deno.env.get('ZEPTO_TOKEN');
    // You MUST set this secret: npx supabase secrets set ZEPTO_TOKEN=your_token

    if (!ZEPTO_TOKEN) {
      throw new Error("Missing ZEPTO_TOKEN secret");
    }

    // 4. Send Email via Zepto Mail API
    const authHeader = ZEPTO_TOKEN.startsWith('Zoho-enczapikey')
      ? ZEPTO_TOKEN
      : `Zoho-enczapikey ${ZEPTO_TOKEN}`;

    const response = await fetch(ZEPTO_MAIL_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        "from": { "address": "noreply@privetserver.com" },
        "to": [
          {
            "email_address": {
              "address": "support@privetserver.com", // Your support email
              "name": "Support Team"
            }
          }
        ],
        "subject": "New Contact Form Submission",
        "htmlbody": `<div><b>From:</b> ${sender_email}<br><br><b>Message:</b><br>${message}</div>`
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Zepto Error:", data);
      return new Response(JSON.stringify(data), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    return new Response(JSON.stringify({ message: "Email sent successfully" }), {
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", 'Access-Control-Allow-Origin': '*' },
    })
  }
})
