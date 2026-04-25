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

async function enrichContent() {
  console.log('💎 Starting SEO Enrichment V5 (The 10/10 Topical Authority Update)...');

  while (true) {
    const { data: rows, error } = await supabase
      .from('seo_pages')
      .select('id, job_title, slug, document_type')
      .is('why_it_matters', null) 
      .limit(50);

    if (error) {
      console.error('❌ DB Error:', error);
      break;
    }

    if (!rows || rows.length === 0) {
      console.log('✅ All pages are fully enriched with Topical Authority content!');
      break;
    }

    console.log(`\n📦 Loaded batch of ${rows.length} rows...`);

    for (const row of rows) {
      await processRowWithRetry(row);
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
}

async function processRowWithRetry(row: { id: string; job_title: string, document_type: string }) {
  let attempts = 0;
  
  while (attempts < 5) {
    try {
      console.log(`📝 Generating Authority Content for: ${row.job_title} ${row.document_type || 'Contract'}...`);

      const prompt = `
        You are a top 1% SEO strategist, conversion copywriter, and experienced ${row.job_title} freelancer.

        Generate content for a ${row.job_title} ${row.document_type || 'Contract'} Template page.

        GOAL:
        Create a page that feels manually written by someone who understands this profession. It must help the reader avoid lost money, scope creep, late payment, client ghosting, unclear deliverables, and messy expectations.

        CRITICAL RULES:
        - Do not write generic freelancer advice.
        - Include profession-specific details that would NOT apply to most other jobs.
        - Mention real tools, workflows, deliverables, risks, and payment situations for this profession.
        - Do not give legal advice.
        - Keep it practical, business-focused, and written for freelancers or small service providers.
        - Make the writing useful for Google SEO and AI search answers.
        - Avoid em dashes.

        RETURN ONLY VALID JSON.

        JSON FORMAT:
        {
          "pain_point_hook": "2 punchy sentences about the exact financial risk for this profession.",
          "legal_tip": "1 practical clause or boundary this professional should include, without legal advice.",
          "why_it_matters": "A 120-180 word section explaining why this profession needs a written ${row.document_type || 'Contract'} specifically.",
          "unique_risks": [
            { "title": "Specific Risk 1", "description": "Specific explanation tied to this profession." },
            { "title": "Specific Risk 2", "description": "Specific explanation tied to this profession." },
            { "title": "Specific Risk 3", "description": "Specific explanation tied to this profession." }
          ],
          "deliverables": [
            "5 to 7 specific deliverables this profession actually provides"
          ],
          "scope_creep_examples": [
            "3 realistic examples of unpaid extra work clients ask for in this profession"
          ],
          "real_world_scenario": "A 150-220 word realistic story showing how a ${row.job_title} loses money without clear terms.",
          "best_practices": [
            { "title": "Best practice 1", "description": "Specific practical advice." },
            { "title": "Best practice 2", "description": "Specific practical advice." },
            { "title": "Best practice 3", "description": "Specific practical advice." }
          ],
          "pricing_guidance": "A short practical paragraph explaining how this profession should think about deposits, milestones, hourly billing, retainers, flat rates, late fees, or approvals.",
          "snippet_answer": "A 40-60 word direct answer to: What is a ${row.job_title} ${row.document_type || 'Contract'} template?",
          "ai_summary": "A clean 80-120 word summary written so AI search engines can easily quote or summarize the page.",
          "faqs": [
            { "q": "Specific question 1.", "a": "Clear practical answer." },
            { "q": "Specific question 2.", "a": "Clear practical answer." },
            { "q": "Specific question 3.", "a": "Clear practical answer." }
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
      console.log(`   ✅ Saved Deep Topical Content for: ${row.job_title}`);
      return; 

    } catch (err: any) {
      attempts++;
      console.error(`   ⚠️ Attempt ${attempts} failed: ${err.message}`);
      
      if (err.message.includes('Quota exceeded') || err.message.includes('429')) {
        await new Promise(r => setTimeout(r, 30000)); 
      } else {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  console.error(`   ❌ Giving up on: ${row.job_title}`);
}

enrichContent();