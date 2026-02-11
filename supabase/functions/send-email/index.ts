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
      message,
      captcha_token
    } = body;

    console.log("[LOG] Received:", { request_id, first_name, last_name, sender_email, message_length: message?.length, has_captcha: !!captcha_token });

    // 1. Verify Cloudflare Turnstile Captcha
    const TURNSTILE_SECRET_KEY = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (TURNSTILE_SECRET_KEY && captcha_token) {
      console.log("[LOG] Verifying Turnstile token...");
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${TURNSTILE_SECRET_KEY}&response=${captcha_token}`,
      });

      const verifyData = await verifyRes.json();
      console.log("[LOG] Turnstile verification result:", verifyData.success);

      if (!verifyData.success) {
        console.error("[ERROR] Captcha verification failed:", verifyData);
        return new Response(JSON.stringify({ error: "Security check failed. Please try again." }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    } else if (TURNSTILE_SECRET_KEY && !captcha_token) {
      console.error("[ERROR] Captcha token missing but protection is enabled");
      return new Response(JSON.stringify({ error: "Please complete the security check." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }


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

    // Build HTML email body for support team
    const supportEmailHTML = `
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

    // Build HTML email body for client receipt
    const clientReceiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px 20px; text-align: center; border-bottom: 4px solid #059669;">
            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Support Request Received</h1>
            <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 14px;">Thank you for contacting us</p>
          </div>
          <div style="padding: 30px 20px; text-align: center;">
            <div style="display: inline-block; background-color: #d1fae5; color: #047857; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 18px; margin-bottom: 20px;">
              Ticket #${request_id}
            </div>
          </div>
          <div style="padding: 0 30px 30px 30px; text-align: left !important;">
            <p style="color: #334155; font-size: 16px; margin: 0 0 20px 0; text-align: left;">
              Dear ${first_name},
            </p>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0; text-align: left;">
              We have successfully received your support request and it's now in our system. Our support team will review your request shortly and get back to you as soon as possible.
            </p>
          </div>
          <div style="padding: 0 30px 30px 30px; border-bottom: 1px solid #e2e8f0;">
            <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 16px; font-weight: 600;">Request Summary</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 500; width: 40%;">Ticket ID:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 600;">${request_id}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Service Type:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><span style="background-color: #dbeafe; color: #0284c7; padding: 4px 8px; border-radius: 16px; font-weight: 500; font-size: 12px; display: inline-block;">${service_type}</span></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: 500;">Category:</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;"><span style="background-color: #fef3c7; color: #b45309; padding: 4px 8px; border-radius: 16px; font-weight: 500; font-size: 12px; display: inline-block;">${section}</span></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; color: #64748b; font-weight: 500;">Submitted:</td>
                <td style="padding: 10px 0; color: #1e293b; font-weight: 600;">${new Date().toUTCString()}</td>
              </tr>
            </table>
          </div>
          <div style="padding: 30px 20px; background-color: #f0fdf4; border-left: 4px solid #059669;">
            <h3 style="margin: 0 0 10px 0; color: #047857; font-size: 14px; font-weight: 600;">What Happens Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #64748b; font-size: 13px; line-height: 1.8;">
              <li>Our support team will review your request</li>
              <li>You'll receive an email response within 24 hours</li>
              <li>Keep your Ticket ID handy for reference</li>
              <li>If urgent, please mark it in the message</li>
            </ul>
          </div>
          <div style="padding: 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">If you have any questions, please reply to this email</p>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8;">© PrivetServer - Support Portal</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to support team
    const supportResponse = await fetch("https://api.zeptomail.com/v1.1/email", {
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
        "htmlbody": supportEmailHTML
      })
    });

    const supportResBody = await supportResponse.text();
    console.log("[LOG] Support email response status:", supportResponse.status);
    console.log("[LOG] Support email response:", supportResBody);

    if (!supportResponse.ok) {
      return new Response(JSON.stringify({ error: "Failed to send support email", details: supportResBody }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log("[SUCCESS] Support email sent");

    // Send receipt email to client
    const clientResponse = await fetch("https://api.zeptomail.com/v1.1/email", {
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
              "address": sender_email,
              "name": `${first_name} ${last_name}`
            }
          }
        ],
        "subject": `Support Request Received - Ticket #${request_id}`,
        "htmlbody": clientReceiptHTML
      })
    });

    const clientResBody = await clientResponse.text();
    console.log("[LOG] Client receipt response status:", clientResponse.status);
    console.log("[LOG] Client receipt response:", clientResBody);

    if (!clientResponse.ok) {
      console.log("[WARNING] Failed to send client receipt email, but support email was sent");
    } else {
      console.log("[SUCCESS] Client receipt email sent");
    }

    return new Response(JSON.stringify({ message: "Support request processed and emails sent successfully!" }), {
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

