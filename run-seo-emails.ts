import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('MISSING: SUPABASE_SERVICE_ROLE_KEY');
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new Error('MISSING: GOOGLE_GENERATIVE_AI_API_KEY');

const DELAY_MS = 500;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const model = google('gemini-flash-latest');

async function fixEmailTemplates() {
  console.log('📧 Starting the Late Payment Email Override...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .like('slug', 'late-payment-email-%');

  if (error) {
    console.error('❌ DB Error:', error);
    return;
  }

  if (!rows || rows.length === 0) {
    console.log('✅ No email pages found or all fixed!');
    return;
  }

  console.log(`\n📦 Found ${rows.length} email templates to rewrite...\n`);

  for (const row of rows) {
    await processEmailRow(row);
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  
  console.log('\n🎉 ALL EMAIL TEMPLATES FIXED!');
}

async function processEmailRow(row: { id: string; job_title: string }) {
  let attempts = 0;
  
  while (attempts < 3) {
    try {
      console.log(`📝 Rewriting Email Content for: ${row.job_title}...`);

      const prompt = `
        You are a top 1% SEO strategist and freelance business coach.
        Generate content for a "${row.job_title} Late Payment Email Template" page.

        GOAL:
        Create a page that helps a ${row.job_title} professionally collect an unpaid invoice without ruining the client relationship. Focus on cash flow, late fees, boundary setting, and professional communication.

        CRITICAL RULES:
        - The email_html must be a late-payment email only. Do not include contract language, scope language, legal threats, or aggressive collections language.
        - Do not mention Statements of Work, Contracts, or Scope Creep. THIS IS ABOUT COLLECTING UNPAID MONEY.
        - Include profession-specific details for a ${row.job_title}.
        - Make it highly practical for someone who is stressed about not getting paid.

        RETURN ONLY VALID JSON.

        JSON FORMAT:
        {
          "email_html": "A clean, professional 3-paragraph HTML email template for a late payment follow-up. Use basic HTML tags like <p>, <br>, <strong>. Do not use <html> or <body> tags. Include placeholders like [Client Name], [Invoice Number], and [Amount Due]. Make it firm but professional.",
          "pain_point_hook": "2 punchy sentences about the financial stress of unpaid invoices specifically for a ${row.job_title}.",
          "legal_tip": "1 practical tip about legally enforcing late fees or pausing work.",
          "why_it_matters": "A 120-180 word section explaining why sending a formal, written late payment email is much safer and more effective than a casual text message.",
          "unique_risks": [
            { "title": "Client Ghosting", "description": "Specific context for a ${row.job_title} on why clients ignore invoices." },
            { "title": "Cash Flow Crisis", "description": "How unpaid invoices halt business operations for this specific profession." },
            { "title": "Lost Leverage", "description": "Why waiting too long to follow up destroys your chances of getting paid." }
          ],
          "deliverables": [
            "Original Invoice Number and Date",
            "Clear total amount due including any late fees",
            "A direct, clickable payment link",
            "A firm but polite deadline for response",
            "Notice of work stoppage if applicable"
          ],
          "scope_creep_examples": [
            "The 'Check is in the mail' excuse",
            "The 'Waiting on the accounting department' delay",
            "The 'I haven't reviewed the final files yet' tactic"
          ],
          "real_world_scenario": "A 150-220 word realistic story showing how a ${row.job_title} successfully collected a 30-day past-due invoice by using a firm, professional email template instead of getting angry.",
          "best_practices": [
            { "title": "Remove Emotion", "description": "Keep the tone strictly business." },
            { "title": "Include the Payment Link", "description": "Remove all friction for them to pay you instantly." },
            { "title": "Follow Up Weekly", "description": "Do not let the invoice go stale." }
          ],
          "pricing_guidance": "A short practical paragraph explaining standard late fee percentages (e.g., 5% per month) and when a ${row.job_title} should legally pause ongoing work.",
          "snippet_answer": "A 40-60 word direct answer to: How do I write a late payment email as a ${row.job_title}?",
          "ai_summary": "A clean 80-120 word summary explaining the importance of late payment email templates for freelancers.",
          "faqs": [
            { "q": "When should I send the first late payment email?", "a": "Typically 1 to 3 days after the due date has passed." },
            { "q": "Can I legally add a late fee?", "a": "Only if late fees were explicitly agreed upon in your original signed contract." },
            { "q": "What if they still don't pay after multiple emails?", "a": "You may need to send a formal demand letter or utilize a collections agency." }
          ]
        }
      `;

      const { text } = await generateText({
        model: model,
        prompt: prompt,
      });

      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(cleanJson);

      const { error } = await supabase
        .from('seo_pages')
        .update({
          document_type: 'Email',
          content: json.email_html, 
          pain_point_hook: json.pain_point_hook,
          legal_tip: json.legal_tip,
          why_it_matters: json.why_it_matters,
          unique_risks: json.unique_risks,
          deliverables: json.deliverables,
          scope_creep_examples: json.scope_creep_examples,
          real_world_scenario: json.real_world_scenario,
          best_practices: json.best_practices,
          pricing_guidance: json.pricing_guidance,
          snippet_answer: json.snippet_answer,
          ai_summary: json.ai_summary,
          faqs: json.faqs
        })
        .eq('id', row.id);

      if (error) throw error;
      console.log(`   ✅ Rewrote Email Data for: ${row.job_title}`);
      return; 

    } catch (err: any) {
      attempts++;
      console.error(`   ⚠️ Attempt ${attempts} failed: ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  console.error(`   ❌ Giving up on: ${row.job_title}`);
}

fixEmailTemplates();