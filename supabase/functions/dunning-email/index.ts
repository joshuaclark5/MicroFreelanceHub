// @ts-types npm:resend
import { Resend } from "npm:resend";

// Initialize Resend with your API Key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Set up CORS so your backend can trigger this without browser blocks
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DUNNING_MILESTONES = [3, 5, 10, 15, 30];

function getDunningMilestone(daysOverdue: number): number {
  return DUNNING_MILESTONES.reduce((selected, milestone) => {
    return daysOverdue >= milestone ? milestone : selected;
  }, DUNNING_MILESTONES[0]);
}

function getDunningSubject(projectName: string, daysOverdue: number): string {
  const milestone = getDunningMilestone(daysOverdue);

  if (milestone === 3) return `Reminder: Invoice for "${projectName}" is now due`;
  if (milestone === 5) return `Follow-up: Payment for "${projectName}" - 5 Days Overdue`;
  if (milestone === 10) return `URGENT: Invoice for "${projectName}" - 10 Days Overdue`;
  if (milestone === 15) return `FINAL NOTICE: Invoice for "${projectName}" - 15 Days Overdue`;
  return `LEGAL ACTION PENDING: Invoice for "${projectName}" - 30 Days Overdue`;
}

// Generate dynamic HTML based on the closest dunning milestone reached.
function generateDunningEmail(
  clientName: string,
  projectName: string,
  amountDue: number,
  daysOverdue: number
): string {
  const formattedAmount = Number(amountDue).toFixed(2);
  const milestone = getDunningMilestone(daysOverdue);
  let subject = "";
  let greeting = "";
  let mainMessage = "";
  let bodyColor = "#4f46e5"; // Default indigo

  if (milestone === 3) {
    subject = `Reminder: Invoice for "${projectName}" is now due`;
    greeting = `Hi ${clientName},`;
    mainMessage = `
      <p>Just floating this to the top of your inbox—we haven't received payment for the invoice on your <strong>${projectName}</strong> project yet.</p>
      <p>The invoice for <strong>$${formattedAmount}</strong> was due on the original date, and we'd love to get this wrapped up!</p>
      <p>No rush if payment is already on the way, but if you need any clarification or have questions about the invoice, just let us know.</p>
    `;
    bodyColor = "#10b981"; // Green for friendly
  } else if (milestone === 5) {
    subject = `Follow-up: Payment for "${projectName}" - 5 Days Overdue`;
    greeting = `Hi ${clientName},`;
    mainMessage = `
      <p>We wanted to follow up on the outstanding invoice for your <strong>${projectName}</strong> project.</p>
      <p>As of today, the invoice for <strong>$${formattedAmount}</strong> is <strong>5 days overdue</strong>. We understand things get busy, but we'd appreciate prompt payment to keep things moving smoothly.</p>
      <p>If there's anything preventing you from paying or if you have questions about the charges, please reach out—we're here to help.</p>
    `;
    bodyColor = "#3b82f6"; // Blue for professional
  } else if (milestone === 10) {
    subject = `URGENT: Invoice for "${projectName}" - 10 Days Overdue`;
    greeting = `${clientName},`;
    mainMessage = `
      <p><strong>This invoice is now significantly overdue.</strong></p>
      <p>Your invoice for <strong>$${formattedAmount}</strong> on the <strong>${projectName}</strong> project is <strong>10 days past due</strong>. Prompt payment is essential for us to continue supporting your projects.</p>
      <p>We need to receive payment within the next <strong>5 business days</strong> to keep your account in good standing. If you have questions or are facing a hardship, please contact us immediately.</p>
    `;
    bodyColor = "#f59e0b"; // Amber for firm
  } else if (milestone === 15) {
    subject = `FINAL NOTICE: Invoice for "${projectName}" - 15 Days Overdue`;
    greeting = `${clientName},`;
    mainMessage = `
      <p><strong>Final Notice Before Account Suspension</strong></p>
      <p>Your invoice for <strong>$${formattedAmount}</strong> is now <strong>15 days overdue</strong>. This is a serious matter that requires immediate resolution.</p>
      <p>If we do not receive full payment <strong>within 5 business days</strong>, we will have no choice but to suspend your account and may pursue legal collection action to recover the outstanding balance.</p>
      <p><strong>Contact us immediately</strong> to arrange payment or discuss your situation. We prefer to resolve this amicably.</p>
    `;
    bodyColor = "#ef4444"; // Red for final warning
  } else if (milestone === 30) {
    subject = `LEGAL ACTION PENDING: Invoice for "${projectName}" - 30 Days Overdue`;
    greeting = `${clientName},`;
    mainMessage = `
      <p><strong>Legal Action Notice</strong></p>
      <p>Your account is now <strong>30 days overdue</strong> on an invoice of <strong>$${formattedAmount}</strong>. You have failed to respond to previous payment demands.</p>
      <p>Effective immediately, your account is <strong>SUSPENDED</strong> and all project services have been halted.</p>
      <p><strong>You have 48 hours to remit full payment</strong> before we escalate this matter to our legal team for debt collection proceedings. This may result in:</p>
      <ul style="color: #dc2626;">
        <li>A judgment against you</li>
        <li>Collection agency involvement</li>
        <li>Damage to your business credit score</li>
        <li>Recovery of attorney fees and court costs</li>
      </ul>
      <p><strong>Contact us immediately</strong> if you wish to resolve this before legal action commences.</p>
    `;
    bodyColor = "#dc2626"; // Dark red for final legal notice
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .header {
          background-color: ${bodyColor};
          color: white;
          padding: 30px 20px;
          text-align: center;
          border-radius: 8px 8px 0 0;
          border: none;
        }
        .header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
        .content {
          padding: 30px 20px;
          background-color: white;
          border-radius: 0 0 8px 8px;
          border: 1px solid #e5e7eb;
          border-top: none;
        }
        .content p {
          margin: 15px 0;
        }
        .content ul {
          margin: 15px 0;
          padding-left: 20px;
        }
        .content li {
          margin: 8px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: ${bodyColor};
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
          margin-top: 20px;
        }
        .button:hover {
          opacity: 0.9;
        }
        .footer {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        strong {
          color: ${bodyColor};
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${subject}</h2>
        </div>
        <div class="content">
          <p>${greeting}</p>
          ${mainMessage}
          <a href="https://microfreelancehub.com/dashboard" class="button">Pay Invoice Now</a>
          <div class="footer">
            <p>MicroFreelanceHub | support@microfreelancehub.com</p>
            <p>© 2026 MicroFreelanceHub. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Extract invoice details from the request payload
    const {
      invoice_id,
      client_email,
      client_name,
      days_overdue,
      amount_due,
      project_name,
    } = await req.json();

    // Validate required fields
    if (
      !invoice_id ||
      !client_email ||
      !client_name ||
      days_overdue === undefined ||
      amount_due === undefined ||
      !project_name
    ) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: invoice_id, client_email, client_name, days_overdue, amount_due, project_name",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate the email subject and HTML
    const mailSubject = getDunningSubject(project_name, days_overdue);
    const htmlContent = generateDunningEmail(
      client_name,
      project_name,
      amount_due,
      days_overdue
    );

    // Send the email via Resend
    const data = await resend.emails.send({
      from: "MicroFreelanceHub <support@microfreelancehub.com>",
      to: [client_email],
      subject: mailSubject,
      html: htmlContent,
    });

    // Return success with the email response
    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    // Log and return error
    console.error("Dunning email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
