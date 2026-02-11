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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 30px 20px; text-align: center; border-bottom: 4px solid #0284c7;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">New Support Request</h1>
            <p style="margin: 10px 0 0 0; color: #e0f2fe; font-size: 14px;">Ticket Reference: <strong>${request_id}</strong></p>
          </div>

          <!-- Request ID Badge -->
          <div style="padding: 20px; text-align: center; background-color: #f0f9ff; border-bottom: 1px solid #e0f2fe;">
            <div style="display: inline-block; background-color: #0284c7; color: white; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 16px;">
              ID: ${request_id}
            </div>
          </div>

          <!-- Contact Information Section -->
          <div style="padding: 30px 20px; border-bottom: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Contact Information</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 500; width: 30%;">Name:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 600;">${first_name} ${last_name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Email:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #0284c7;"><a href="mailto:${sender_email}" style="text-decoration: none; color: #0284c7; font-weight: 600;">${sender_email}</a></td>
              </tr>
              ${company_name ? `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Company:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 600;">${company_name}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Request Details Section -->
          <div style="padding: 30px 20px; border-bottom: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Request Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 500; width: 30%;">Service Type:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="background-color: #dbeafe; color: #0284c7; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 13px; display: inline-block;">${service_type}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Section:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="background-color: #fef3c7; color: #b45309; padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 13px; display: inline-block;">${section}</span>
                </td>
              </tr>
              ${related_domain ? `
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Related Domain:</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 500;">${related_domain}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <!-- Message Section -->
          <div style="padding: 30px 20px; border-bottom: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Message</h2>
            <div style="background-color: #f8fafc; padding: 20px; border-left: 4px solid #0284c7; border-radius: 4px; color: #334155; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word;">
              ${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
            </div>
          </div>

          <!-- Footer -->
          <div style="padding: 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">This is an automated support request from your website.</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Reference ID: <strong>${request_id}</strong></p>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8;">© PrivetServer - Support Portal</p>
          </div>
        </div>
      </body>
      </html>
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

