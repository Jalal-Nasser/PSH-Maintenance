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
    const { 
      request_id,
      first_name, 
      last_name, 
      sender_email, 
      company_name,
      service_type,
      section,
      related_domain,
      message 
    } = body;

    console.log("[LOG] Received:", { request_id, first_name, last_name, sender_email, message_length: message?.length });

    if (!first_name || !last_name || !sender_email || !message || !service_type || !section) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
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

    // Build HTML email body
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
          <h2 style="color: #0284c7; margin-top: 0;">New Support Request</h2>
          
          <div style="background-color: #e0f2fe; padding: 15px; border-left: 4px solid #0284c7; margin-bottom: 20px; border-radius: 3px;">
            <p style="margin: 0; font-weight: bold; color: #0284c7;"><strong>Request ID:</strong> ${request_id}</p>
          </div>

          <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
            <tr style="background-color: #f0f9ff;">
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; width: 200px;">Name:</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;">${first_name} ${last_name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Email:</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;"><a href="mailto:${sender_email}">${sender_email}</a></td>
            </tr>
            ${company_name ? `
            <tr style="background-color: #f0f9ff;">
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Company:</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;">${company_name}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Service Type:</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;"><span style="background-color: #dbeafe; color: #0284c7; padding: 4px 8px; border-radius: 3px;">${service_type}</span></td>
            </tr>
            <tr style="background-color: #f0f9ff;">
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Section:</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;"><span style="background-color: #dbeafe; color: #0284c7; padding: 4px 8px; border-radius: 3px;">${section}</span></td>
            </tr>
            ${related_domain ? `
            <tr>
              <td style="padding: 10px; border: 1px solid #cbd5e1; font-weight: bold;">Related Domain/Service:</td>
              <td style="padding: 10px; border: 1px solid #cbd5e1;">${related_domain}</td>
            </tr>
            ` : ''}
          </table>

          <div style="background-color: #fff; padding: 15px; border: 1px solid #cbd5e1; border-radius: 3px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #333;">Message:</p>
            <p style="margin: 0; white-space: pre-wrap; color: #555;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>

          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #cbd5e1; font-size: 12px; color: #666;">
            <p style="margin: 0;">This is an automated support request from your website.</p>
            <p style="margin: 0;">Request ID: <strong>${request_id}</strong></p>
          </div>
        </div>
      </div>
    `;

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
        "subject": `[${request_id}] New Support Request - ${service_type} / ${section}`,
        "htmlbody": emailHTML
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

