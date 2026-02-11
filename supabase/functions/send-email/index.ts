import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("[START] Email function invoked");
    
    const body = await req.json();
    const { sender_email, message } = body;

    console.log("[LOG] Received:", { sender_email, message_length: message?.length });

    if (!sender_email || !message) {
      return new Response(JSON.stringify({ error: "Missing sender_email or message" }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get token from Supabase secrets
    const ZEPTO_TOKEN = Deno.env.get('ZEPTO_TOKEN');
    console.log("[LOG] Token retrieved, length:", ZEPTO_TOKEN?.length);

    if (!ZEPTO_TOKEN) {
      console.error("[ERROR] ZEPTO_TOKEN not found in environment");
      return new Response(JSON.stringify({ error: "Token not configured" }), {
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Token should be just the key part (without "Zoho-enczapikey" prefix)
    const authHeader = `Zoho-enczapikey ${ZEPTO_TOKEN.trim()}`;
    console.log("[LOG] Auth header prepared");

    const response = await fetch("https://api.zeptomail.com/v1.1/email", {
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
              "address": "support@privetserver.com",
              "name": "Support Team"
            }
          }
        ],
        "subject": "New Contact Form Submission",
        "htmlbody": `<div><b>From:</b> ${sender_email}<br><br><b>Message:</b><br>${message.replace(/\n/g, '<br>')}</div>`,
        "replyto": { "address": sender_email }
      })
    });

    const resBody = await response.text();
    console.log("[LOG] Zepto response status:", response.status);
    console.log("[LOG] Zepto response:", resBody);

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to send email", details: resBody }), {
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[SUCCESS] Email sent");
    return new Response(JSON.stringify({ message: "Email sent successfully!" }), {
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error("[ERROR]", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

