// @ts-types npm:resend
import { Resend } from "npm:resend";

// Initialize Resend with your API Key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Set up CORS so your frontend can talk to this backend function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight request (Standard browser security check)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Extract invoice details from the request payload
    const { invoice_id, client_email, client_name, amount_due, project_name, payment_link } = await req.json();

    // Validate required fields
    if (!invoice_id || !client_email || !client_name || !amount_due || !project_name || !payment_link) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: invoice_id, client_email, client_name, amount_due, project_name, payment_link",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Premium SaaS Invoice Email Template (Stripe-like aesthetic)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            color: #1f2937;
            background-color: #f9fafb;
            line-height: 1.6;
          }
          .wrapper {
            width: 100%;
            background-color: #f9fafb;
            padding: 40px 0;
          }
          .container {
            max-width: 540px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
            padding: 40px 32px;
            text-align: left;
            border-radius: 8px 8px 0 0;
            margin: 0;
          }
          .logo {
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            margin: 0 0 24px 0;
            padding: 0;
            letter-spacing: -0.5px;
          }
          .header-title {
            font-size: 28px;
            font-weight: 600;
            color: #ffffff;
            margin: 0 0 8px 0;
            padding: 0;
          }
          .header-subtitle {
            font-size: 14px;
            color: #d1d5db;
            font-weight: 400;
            margin: 0;
            padding: 0;
          }
          .content {
            padding: 40px 32px;
          }
          .greeting {
            font-size: 16px;
            color: #374151;
            margin-bottom: 24px;
            font-weight: 500;
          }
          .intro-text {
            font-size: 14px;
            color: #6b7280;
            line-height: 1.7;
            margin-bottom: 32px;
          }

          /* Invoice Details */
          .invoice-box {
            background-color: #f3f4f6;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 24px;
            margin-bottom: 32px;
          }
          .invoice-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            font-size: 14px;
          }
          .invoice-row.header {
            border-bottom: 1px solid #d1d5db;
            margin-bottom: 12px;
            font-weight: 600;
            color: #111827;
          }
          .invoice-row.total {
            border-top: 2px solid #d1d5db;
            padding-top: 16px;
            padding-bottom: 0;
            font-weight: 700;
            font-size: 18px;
            color: #111827;
          }
          .invoice-label {
            color: #6b7280;
            font-weight: 500;
          }
          .invoice-value {
            color: #1f2937;
            text-align: right;
            font-weight: 500;
          }
          .amount-due {
            color: #059669;
            font-weight: 700;
          }

          /* CTA Section */
          .cta-section {
            text-align: center;
            margin: 32px 0;
          }
          .cta-button {
            display: inline-block;
            background-color: #059669;
            color: #ffffff;
            text-decoration: none;
            padding: 16px 48px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.2s ease;
            box-shadow: 0 2px 8px rgba(5, 150, 105, 0.2);
          }
          .cta-button:hover {
            background-color: #047857;
          }

          /* Security Notice */
          .security-notice {
            background-color: #f0fdf4;
            border-left: 4px solid #059669;
            padding: 12px 16px;
            margin-bottom: 32px;
            border-radius: 4px;
            font-size: 13px;
            color: #166534;
          }

          /* Footer */
          .footer {
            background-color: #f9fafb;
            padding: 32px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          .footer-link {
            color: #3b82f6;
            text-decoration: none;
            margin: 0 8px;
          }

          /* Mobile Responsiveness */
          @media (max-width: 600px) {
            .container {
              border-radius: 0;
            }
            .header {
              padding: 32px 20px;
            }
            .content {
              padding: 24px 20px;
            }
            .footer {
              padding: 24px 20px;
            }
            .invoice-box {
              padding: 16px;
            }
            .header-title {
              font-size: 24px;
            }
            .cta-button {
              padding: 14px 32px;
              font-size: 15px;
              width: 100%;
            }
            .invoice-row {
              flex-wrap: wrap;
              padding: 10px 0;
            }
            .invoice-label,
            .invoice-value {
              width: 100%;
              text-align: left;
              padding-bottom: 4px;
            }
            .invoice-value {
              text-align: left;
            }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <div class="logo">MicroFreelanceHub</div>
              <div class="header-title">Invoice Ready</div>
              <div class="header-subtitle">Let's get this project paid</div>
            </div>

            <div class="content">
              <div class="greeting">Hi ${client_name},</div>

              <p class="intro-text">
                Here's your invoice for <strong>${project_name}</strong>. Review the details below and click the button to pay securely.
              </p>

              <div class="invoice-box">
                <div class="invoice-row header">
                  <span class="invoice-label">Description</span>
                  <span class="invoice-value">Amount</span>
                </div>
                <div class="invoice-row">
                  <span class="invoice-label">${project_name}</span>
                  <span class="invoice-value">$${amount_due.toFixed(2)}</span>
                </div>
                <div class="invoice-row total">
                  <span class="invoice-label">Total Amount Due</span>
                  <span class="invoice-value amount-due">$${amount_due.toFixed(2)}</span>
                </div>
              </div>

              <div class="security-notice">
                ✓ Secure payment processed by Stripe. Your payment information is never shared with us.
              </div>

              <div class="cta-section">
                <a href="${payment_link}" class="cta-button">Pay Invoice Now</a>
              </div>

              <p class="intro-text" style="margin-bottom: 0; margin-top: 24px; font-size: 13px; color: #9ca3af;">
                If you have any questions about this invoice, please reach out to support@microfreelancehub.com.
              </p>
            </div>

            <div class="footer">
              <p style="margin-bottom: 8px;">
                <strong>MicroFreelanceHub</strong>
              </p>
              <p>
                © 2026 MicroFreelanceHub. All rights reserved. |
                <a href="https://microfreelancehub.com" class="footer-link">Visit us</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Fire off the email via Resend
    const data = await resend.emails.send({
      from: "MicroFreelanceHub <support@microfreelancehub.com>",
      to: [client_email],
      subject: `Invoice for ${project_name} - $${amount_due.toFixed(2)}`,
      html: htmlContent,
    });

    // Return success to the frontend
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    // Log and return error
    console.error("Send invoice email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
