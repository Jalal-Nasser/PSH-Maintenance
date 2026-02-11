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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sender_email, message } = await req.json() as EmailRequest;

    if (!sender_email || !message) {
      return new Response(JSON.stringify({ error: "Missing sender_email or message" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const ZEPTO_TOKEN = Deno.env.get('ZEPTO_TOKEN');
    if (!ZEPTO_TOKEN) {
      return new Response(JSON.stringify({ error: "ZEPTO_TOKEN secret not found in Supabase" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const authHeader = ZEPTO_TOKEN.startsWith('Zoho-enczapikey')
      ? ZEPTO_TOKEN
      : `Zoho-enczapikey ${ZEPTO_TOKEN}`;

    console.log("Attempting to send email via Zepto...");

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
              "address": "support@privetserver.com",
              "name": "Support Team"
            }
          }
        ],
        "subject": "New Contact Form Submission",
        "htmlbody": `<div><b>From:</b> ${sender_email}<br><br><b>Message:</b><br>${message}</div>`
      })
    });

    const resBody = await response.text();
    console.log("Zepto RAW Response:", resBody);

    if (!response.ok) {
      // Try to parse error message from Zepto
      let errorMsg = resBody;
      try {
        const parsed = JSON.parse(resBody);
        errorMsg = parsed.error?.message || parsed.message || resBody;
      } catch (e) {
        errorMsg = `Zepto Error (${response.status}): ${resBody}`;
      }

      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ message: "Email sent successfully" }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Critical Function Error:", msg);
    return new Response(JSON.stringify({ error: `Internal Error: ${msg}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
