import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  sender_email: string;
  message: string;
}

const ZEPTO_MAIL_URL = "https://api.zeptomail.com/v1.1/email";

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sender_email, message } = await req.json() as EmailRequest;

    if (!sender_email || !message) {
      throw new Error("Missing sender_email or message");
    }

    const ZEPTO_TOKEN = Deno.env.get('ZEPTO_TOKEN');
    if (!ZEPTO_TOKEN) {
      throw new Error("Missing ZEPTO_TOKEN secret in Supabase");
    }

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
              "address": "support@privetserver.com",
              "name": "Support Team"
            }
          }
        ],
        "subject": "New Contact Form Submission",
        "htmlbody": `<div><b>From:</b> ${sender_email}<br><br><b>Message:</b><br>${message}</div>`
      })
    });

    const resText = await response.text();
    console.log("Zepto Response Text:", resText);

    if (!response.ok) {
      return new Response(resText, {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(resText, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Function Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
