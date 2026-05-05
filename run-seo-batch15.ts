import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const model = google('gemini-flash-latest');

async function processBatch15() {
  console.log('🚀 Starting targeted 10/10 AI generation for Subcontractor & NDAs...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 15')
    .is('content', null);

  if (error || !rows) return console.error('❌ DB Error:', error);

  for (const row of rows) {
    try {
      console.log(`📝 Writing: ${row.job_title} ${row.document_type}...`);

      let customInstructions = '';
      let dynamicKey = '';
      let dynamicDesc = '';
      let sections = '';

      if (row.document_type === 'Subcontractor Agreement') {
        customInstructions = `This is a Subcontractor Agreement Template page. Focus on independent contractor status, preventing the sub from stealing the end-client (non-solicitation), liability limits, and tying payment to when the main contractor gets paid.`;
        dynamicKey = 'subcontractor_restrictions';
        dynamicDesc = 'List 3 specific things explicitly forbidden for the subcontractor (e.g., contacting the end-client directly, claiming the work as their own agency portfolio).';
        sections = `Include clear sections for: Project Scope, Subcontractor Duties, Payment Terms, Non-Solicitation & Non-Compete, Independent Contractor Status, and Insurance/Liability.`;
      } else if (row.document_type === 'Non-Disclosure Agreement') {
        customInstructions = `This is a Non-Disclosure Agreement (NDA) Template page. Focus strictly on protecting trade secrets, proprietary processes, client lists, and unreleased work. Emphasize duration of confidentiality and return of materials.`;
        dynamicKey = 'confidential_items';
        dynamicDesc = 'List 3 highly specific types of confidential information protected by this NDA (e.g., source code, client pricing lists, unreleased product designs).';
        sections = `Include clear sections for: Definition of Confidential Information, Obligations of Receiving Party, Exclusions from Confidentiality, Term and Termination, and Return of Materials.`;
      }

      const prompt = `
        You are an expert freelance business coach and legal strategist.
        Generate content for a "${row.job_title} ${row.document_type} Template" page.
        
        CRITICAL RULE: ${customInstructions}
        Make it highly specific to a ${row.job_title}.

        RETURN ONLY VALID JSON:
        {
          "pain_point_hook": "2 punchy sentences about the danger of not using this specific document.",
          "legal_tip": "1 practical tip for enforcing this agreement.",
          "why_it_matters": "A 150-word explanation of why a ${row.job_title} must use this document.",
          "unique_risks": [
            { "title": "Risk 1", "description": "Specific risk if this is ignored." },
            { "title": "Risk 2", "description": "Specific risk if this is ignored." },
            { "title": "Risk 3", "description": "Specific risk if this is ignored." }
          ],
          "deliverables": ["List 5-6 standard clauses or items covered in this document"],
          "${dynamicKey}": ["${dynamicDesc}"],
          "real_world_scenario": "A 150-word story of a ${row.job_title} saving their business or avoiding disaster using this document.",
          "best_practices": [
            { "title": "Practice 1", "description": "Short explanation" },
            { "title": "Practice 2", "description": "Short explanation" }
          ],
          "pricing_guidance": "1 paragraph explaining standard financial or liability terms related to this document.",
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

      // 🛡️ Safe Mapping: Sneak the dynamic fields into the existing DB column
      if (json.subcontractor_restrictions) {
        json.scope_creep_examples = json.subcontractor_restrictions;
        delete json.subcontractor_restrictions;
      } else if (json.confidential_items) {
        json.scope_creep_examples = json.confidential_items;
        delete json.confidential_items;
      }

      await supabase.from('seo_pages').update(json).eq('id', row.id);
      console.log(`✅ Saved ${row.slug}`);

    } catch (err: any) {
      console.error(`❌ Failed ${row.slug}:`, err.message);
    }
  }
}

processBatch15();