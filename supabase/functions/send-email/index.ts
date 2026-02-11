import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  sender_email: string;
  message: string;
}

// NOTE: If your account is in EU or IN, change .com to .eu or .in
const ZEPTO_MAIL_URL = "https://api.zeptomail.com/v1.1/email";

serve(async (req: Request) => {
  console.log("[START] Email function invoked");
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log("[CORS] Preflight request");
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    })
  }

  try {
    console.log("[LOG] Parsing request body");
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      const errMsg = `Failed to parse JSON: ${e instanceof Error ? e.message : String(e)}`;
      console.error("[ERROR]", errMsg);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { sender_email, message } = body as EmailRequest;
    console.log("[LOG] Request data - Email:", sender_email, "Message length:", message?.length);

    // Validate input
    if (!sender_email || !message) {
      const errMsg = `Missing fields - sender_email: ${!!sender_email}, message: ${!!message}`;
      console.error("[ERROR]", errMsg);
      return new Response(JSON.stringify({ 
        error: "Missing sender_email or message",
        received: { sender_email: !!sender_email, message: !!message }
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get Zepto token from environment
    console.log("[LOG] Reading ZEPTO_TOKEN from environment");
    const ZEPTO_TOKEN = Deno.env.get('ZEPTO_TOKEN');
    
    if (!ZEPTO_TOKEN) {
      console.error("[ERROR] ZEPTO_TOKEN is not set in environment");
      return new Response(JSON.stringify({ error: "ZEPTO_TOKEN secret not found in Supabase" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log("[LOG] ZEPTO_TOKEN found, length:", ZEPTO_TOKEN.length);
    console.log("[LOG] ZEPTO_TOKEN starts with 'Zoho':", ZEPTO_TOKEN.startsWith('Zoho'));

    // Format auth header - ZEPTO_TOKEN should already include "Zoho-enczapikey" prefix
    let authHeader = ZEPTO_TOKEN;
    if (!ZEPTO_TOKEN.startsWith('Zoho-enczapikey')) {
      console.log("[LOG] Adding 'Zoho-enczapikey' prefix to token");
      authHeader = `Zoho-enczapikey ${ZEPTO_TOKEN}`;
    }

    console.log("[LOG] Preparing email payload");

    // Prepare email payload
    const emailPayload = {
      "from": { "address": "noreply@privetserver.com" },
      "to": [
        {
          "email_address": {
            "address": "support@privetserver.com",
            "name": "Support Team"
          }
        }
      ],
      "subject": "New Contact Form Submission",
      "htmlbody": `<div><b>From:</b> ${sender_email}<br><br><b>Message:</b><br>${message.replace(/\n/g, '<br>')}</div>`,
      "replyto": {
        "address": sender_email
      }
    };

    console.log("[LOG] Sending request to Zepto Mail API");
    console.log("[LOG] URL:", ZEPTO_MAIL_URL);

    const response = await fetch(ZEPTO_MAIL_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(emailPayload)
    });

    console.log("[LOG] Zepto response received, status:", response.status);

    const resBody = await response.text();
    console.log("[LOG] Zepto Response Body:", resBody);

    if (!response.ok) {
      // Try to parse error message from Zepto
      let errorMsg = resBody;
      try {
        const parsed = JSON.parse(resBody);
        errorMsg = parsed.error?.message || parsed.message || JSON.stringify(parsed);
      } catch (e) {
        errorMsg = `Zepto Error (${response.status}): ${resBody}`;
      }

      console.error("[ERROR] Zepto API rejected request:", errorMsg);

      return new Response(JSON.stringify({ 
        error: errorMsg,
        status: response.status
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[SUCCESS] Email sent successfully");

    return new Response(JSON.stringify({ message: "Email sent successfully" }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error("[CRITICAL ERROR]", msg);
    console.error("[STACK]", stack);
    return new Response(JSON.stringify({ 
      error: `Internal Error: ${msg}`,
      stack: stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

