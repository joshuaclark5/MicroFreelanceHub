import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error('MISSING: NEXT_PUBLIC_SUPABASE_URL');
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('MISSING: SUPABASE_SERVICE_ROLE_KEY');
if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new Error('MISSING: GOOGLE_GENERATIVE_AI_API_KEY');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const model = google('gemini-flash-latest');
const DELAY_MS = 1000;

type SeoRow = {
  id: string;
  job_title: string;
  slug: string;
  document_type: string;
};

async function processBatch19() {
  console.log('Starting targeted AI generation for Batch 19 Deposit Agreements...');

  while (true) {
    const { data: rows, error } = await supabase
      .from('seo_pages')
      .select('id, job_title, slug, document_type')
      .eq('batch_label', 'Batch 19')
      .like('slug', '%-deposit-agreement')
      .is('content', null)
      .limit(5);

    if (error) {
      console.error('DB Error:', error);
      break;
    }

    if (!rows || rows.length === 0) {
      console.log('All Batch 19 Deposit Agreement pages are enriched.');
      break;
    }

    console.log(`Loaded ${rows.length} Batch 19 pages...`);

    for (const row of rows as SeoRow[]) {
      await processDepositAgreementWithRetry(row);
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }
}

async function processDepositAgreementWithRetry(row: SeoRow) {
  let attempts = 0;

  while (attempts < 5) {
    try {
      console.log(`Writing: ${row.job_title} ${row.document_type}...`);

      const prompt = `
        You are an expert freelance business coach and contract operations strategist.
        Generate content for a "${row.job_title} Deposit Agreement Template" page.

        Product context: MicroFreelanceHub helps freelancers and contractors create contracts,
        collect e-signatures, and secure Stripe deposits before work starts.

        CRITICAL RULES:
        - Make this highly specific to a ${row.job_title}.
        - Focus on protecting upfront materials, scheduling, labor allocation, and no-show risk.
        - Do not provide legal advice or claim this replaces a lawyer.
        - Keep the tone practical and useful, not generic SEO filler.

        RETURN ONLY VALID JSON:
        {
          "pain_point_hook": "2 punchy sentences about why a ${row.job_title} should not start work or reserve materials without a signed deposit agreement.",
          "legal_tip": "1 practical, non-legal-advice tip about documenting deposit terms, refund conditions, and start dates.",
          "why_it_matters": "A 150-word explanation of why a ${row.job_title} needs a deposit agreement before committing time, labor, materials, or schedule slots.",
          "unique_risks": [
            { "title": "Risk 1", "description": "Specific risk if this is ignored." },
            { "title": "Risk 2", "description": "Specific risk if this is ignored." },
            { "title": "Risk 3", "description": "Specific risk if this is ignored." }
          ],
          "deliverables": ["List 5-6 standard clauses or items covered in this deposit agreement"],
          "deposit_protections": ["List 3 specific protections this deposit agreement gives a ${row.job_title}"],
          "real_world_scenario": "A 150-word story of a ${row.job_title} avoiding a payment, scheduling, or materials problem by collecting a deposit before starting.",
          "best_practices": [
            { "title": "Practice 1", "description": "Short explanation" },
            { "title": "Practice 2", "description": "Short explanation" }
          ],
          "pricing_guidance": "1 paragraph explaining common deposit structures for this type of work, including percentage deposits, materials deposits, and milestone payments.",
          "snippet_answer": "A 50-word answer defining what a ${row.job_title} deposit agreement is.",
          "ai_summary": "An 80-word summary of the page.",
          "faqs": [
            { "q": "Question 1 specific to deposits for this trade?", "a": "Answer without legal advice." },
            { "q": "Question 2 specific to deposits for this trade?", "a": "Answer without legal advice." }
          ],
          "content": "A clean HTML representation of the deposit agreement using <p>, <h3>, <ul>. No html/body tags. Include clear sections for: Project Deposit, What the Deposit Covers, Refund Conditions, Start Date Authorization, Materials Purchasing, Client Responsibilities, and E-Signature Acceptance."
        }
      `;

      const { text } = await generateText({ model, prompt });
      const json = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

      if (!Array.isArray(json.deliverables) || json.deliverables.length < 5) {
        throw new Error('AI failed to generate enough deliverables');
      }

      if (json.deposit_protections) {
        json.scope_creep_examples = json.deposit_protections;
        delete json.deposit_protections;
      }

      const { error } = await supabase
        .from('seo_pages')
        .update({
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
          faqs: json.faqs,
          content: json.content,
          seo_title: `Deposit Agreement Template for ${row.job_title}s`,
          seo_desc: `Create a ${row.job_title} deposit agreement template to collect signatures, define deposit terms, and protect payment before work starts.`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);

      if (error) throw error;

      console.log(`Saved ${row.slug}`);
      return;
    } catch (err: any) {
      attempts++;
      console.error(`Attempt ${attempts} failed for ${row.slug}: ${err.message}`);

      if (err.message.includes('Quota exceeded') || err.message.includes('429')) {
        console.log('Hit rate limit. Sleeping for 30 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 30000));
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  console.error(`Giving up on: ${row.slug}`);
}

processBatch19();
