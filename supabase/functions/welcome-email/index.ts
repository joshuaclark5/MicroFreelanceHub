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
    // Grab the user's email and name from the request sent by WelcomeWizard.tsx
    const { email, name } = await req.json();

    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Missing email or name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The Email Template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 8px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { padding: 30px 20px; background-color: white; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Welcome to MicroFreelanceHub! 🎉</h2>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We're thrilled to have you on board. You're now ready to start automating your freelance business.</p>
            <p><strong>Here's what you can do right now:</strong></p>
            <ul>
              <li>Draft and send professional contracts in seconds.</li>
              <li>Pass the 3.9% card processing fee automatically to your clients.</li>
              <li>Keep <strong>100% of your hard-earned cash</strong>.</li>
            </ul>
            <p>Ready to send your first invoice?</p>
            <a href="https://microfreelancehub.com/dashboard" class="button">Go to Dashboard</a>
          </div>
        </div>
      </body>
      </html>
    `;

    // Fire off the email via Resend
    const data = await resend.emails.send({
      from: "MicroFreelanceHub <onboarding@microfreelancehub.com>", // Now using your verified domain!
      to: [email],
      subject: "Welcome to MicroFreelanceHub! Let's get you paid.",
      html: htmlContent,
    });

    // Return success to the frontend
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    // Return error if something fails
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});