import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const model = google('gemini-flash-latest');

async function processBatch18() {
  console.log('🚀 Starting targeted 10/10 AI generation for Contractor Agreements & Sign-Off Forms...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 18')
    .is('content', null);

  if (error || !rows) return console.error('❌ DB Error:', error);

  for (const row of rows) {
    try {
      console.log(`📝 Writing: ${row.job_title} ${row.document_type}...`);

      let customInstructions = '';
      let dynamicKey = '';
      let dynamicDesc = '';
      let sections = '';

      if (row.document_type === 'Independent Contractor Agreement') {
        customInstructions = `This is an Independent Contractor Agreement. Focus heavily on establishing the worker's status as a 1099 contractor, not a W-2 employee. Outline autonomy, tax liabilities, and standard scope parameters.`;
        dynamicKey = 'contractor_classifications';
        dynamicDesc = 'List 3 explicit clauses that prove the worker is an independent contractor (e.g., responsible for own taxes, sets own hours, provides own equipment).';
        sections = `Include clear sections for: Services Provided, Compensation, Independent Contractor Status, Taxes & Benefits, and Confidentiality.`;
      } else if (row.document_type === 'Project Sign-Off Form') {
        customInstructions = `This is a Project Sign-Off Form (or Client Acceptance Form). Focus on the client formally accepting the final deliverables, waiving the right to future free revisions, and authorizing final payment.`;
        dynamicKey = 'acceptance_terms';
        dynamicDesc = 'List 3 specific things the client is agreeing to by signing this form (e.g., work is fully accepted, no further free revisions, final invoice is approved for billing).';
        sections = `Include clear sections for: Final Deliverables Summary, Quality Assurance Acceptance, Revision Waiver, Final Payment Authorization, and Release of Liability.`;
      }

      const prompt = `
        You are an expert freelance business coach and legal strategist.
        Generate content for a "${row.job_title} ${row.document_type} Template" page.
        
        CRITICAL RULE: ${customInstructions}
        Make it highly specific to a ${row.job_title}.

        RETURN ONLY VALID JSON:
        {
          "pain_point_hook": "2 punchy sentences about the danger of not using this specific document for onboarding or offboarding.",
          "legal_tip": "1 practical tip for enforcing this document.",
          "why_it_matters": "A 150-word explanation of why a ${row.job_title} must use this document to protect their business.",
          "unique_risks": [
            { "title": "Risk 1", "description": "Specific risk if this is ignored." },
            { "title": "Risk 2", "description": "Specific risk if this is ignored." },
            { "title": "Risk 3", "description": "Specific risk if this is ignored." }
          ],
          "deliverables": ["List 5-6 standard clauses or items covered in this document"],
          "${dynamicKey}": ["${dynamicDesc}"],
          "real_world_scenario": "A 150-word story of a ${row.job_title} avoiding a major legal or financial headache using this document.",
          "best_practices": [
            { "title": "Practice 1", "description": "Short explanation" },
            { "title": "Practice 2", "description": "Short explanation" }
          ],
          "pricing_guidance": "1 paragraph explaining standard financial parameters related to this phase of the project.",
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
      if (json.contractor_classifications) {
        json.scope_creep_examples = json.contractor_classifications;
        delete json.contractor_classifications;
      } else if (json.acceptance_terms) {
        json.scope_creep_examples = json.acceptance_terms;
        delete json.acceptance_terms;
      }

      await supabase.from('seo_pages').update(json).eq('id', row.id);
      console.log(`✅ Saved ${row.slug}`);

    } catch (err: any) {
      console.error(`❌ Failed ${row.slug}:`, err.message);
    }
  }
}

processBatch18();