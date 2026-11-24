import { welcomeEmail } from "../_shared/welcome.ts";
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

    const content = welcomeEmail(String(name));

    // Fire off the email via Resend
    const data = await resend.emails.send({
      from: "MicroFreelanceHub <onboarding@microfreelancehub.com>", // Now using your verified domain!
      to: [email],
      subject: "Welcome to MicroFreelanceHub",
      html: content.html,
      text: content.text,
    });

    if (data.error) throw new Error("Welcome email was not accepted.");

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
