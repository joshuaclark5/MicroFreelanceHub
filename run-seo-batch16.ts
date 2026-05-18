import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const model = google('gemini-flash-latest');

async function processBatch16() {
  console.log('🚀 Starting targeted 10/10 AI generation for Demand Letters & Cease and Desist...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 16')
    .is('content', null);

  if (error || !rows) return console.error('❌ DB Error:', error);

  for (const row of rows) {
    try {
      console.log(`📝 Writing: ${row.job_title} ${row.document_type}...`);

      let customInstructions = '';
      let dynamicKey = '';
      let dynamicDesc = '';
      let sections = '';

      if (row.document_type === 'Late Payment Demand Letter') {
        customInstructions = `This is a formal Late Payment Demand Letter. Focus on formal debt collection, citing the original contract/invoice, calculating late fees, and setting a final hard deadline before legal action. Tone should be firm but professional.`;
        dynamicKey = 'escalation_steps';
        dynamicDesc = 'List 3 specific legal or financial consequences explicitly threatened if the deadline is missed (e.g., small claims court, collections agency, revoking copyright).';
        sections = `Include clear sections for: Debt Summary, Original Agreement Reference, Breakdown of Owed Amount & Late Fees, Final Payment Deadline, and Escalation Consequences.`;
      } else if (row.document_type === 'Cease and Desist Letter') {
        customInstructions = `This is a Cease and Desist Letter. Focus on copyright infringement, unauthorized use of unpaid deliverables, or breach of contract. Demand immediate removal of the work or immediate payment to cure the breach. Tone should be highly authoritative.`;
        dynamicKey = 'infringement_claims';
        dynamicDesc = 'List 3 specific unauthorized actions the client is explicitly ordered to stop doing immediately (e.g., using unpaid designs, modifying source code, publishing unreleased photos).';
        sections = `Include clear sections for: Notice of Infringement, Demand to Cease Action, Demand for Resolution/Payment, and Legal Consequences of Non-Compliance.`;
      }

      const prompt = `
        You are an expert freelance legal strategist.
        Generate content for a "${row.job_title} ${row.document_type} Template" page.
        
        CRITICAL RULE: ${customInstructions}
        Make it highly specific to a ${row.job_title}.

        RETURN ONLY VALID JSON:
        {
          "pain_point_hook": "2 punchy sentences about the danger of letting clients walk all over you without taking legal action.",
          "legal_tip": "1 practical tip for enforcing or sending this specific letter.",
          "why_it_matters": "A 150-word explanation of why a ${row.job_title} must use this document when a client goes rogue.",
          "unique_risks": [
            { "title": "Risk 1", "description": "Specific risk if this is ignored." },
            { "title": "Risk 2", "description": "Specific risk if this is ignored." },
            { "title": "Risk 3", "description": "Specific risk if this is ignored." }
          ],
          "deliverables": ["List 5-6 standard clauses or items covered in this document"],
          "${dynamicKey}": ["${dynamicDesc}"],
          "real_world_scenario": "A 150-word story of a ${row.job_title} forcing a bad client to pay up or back down using this document.",
          "best_practices": [
            { "title": "Practice 1", "description": "Short explanation" },
            { "title": "Practice 2", "description": "Short explanation" }
          ],
          "pricing_guidance": "1 paragraph explaining standard late fees, collection costs, or legal damages relevant to this situation.",
          "snippet_answer": "A 50-word answer defining what a ${row.job_title} ${row.document_type} is.",
          "ai_summary": "An 80-word summary of the page.",
          "faqs": [
            { "q": "Question 1 specific to this doc type?", "a": "Answer" },
            { "q": "Question 2 specific to this doc type?", "a": "Answer" }
          ],
          "content": "A clean HTML representation of the legal text for this document using <p>, <h3>, <ul>. No html/body tags. CRITICAL HTML RULE: ${sections}"
        }
      `;

      const { text } = await generateText({ model, prompt });
      const json = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

      // 🛡️ Safe Mapping
      if (json.escalation_steps) {
        json.scope_creep_examples = json.escalation_steps;
        delete json.escalation_steps;
      } else if (json.infringement_claims) {
        json.scope_creep_examples = json.infringement_claims;
        delete json.infringement_claims;
      }

      await supabase.from('seo_pages').update(json).eq('id', row.id);
      console.log(`✅ Saved ${row.slug}`);

    } catch (err: any) {
      console.error(`❌ Failed ${row.slug}:`, err.message);
    }
  }
}

processBatch16();