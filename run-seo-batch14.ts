import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const model = google('gemini-flash-latest');

async function processBatch14() {
  console.log('🚀 Starting targeted 10/10 AI generation for Scope of Work & Work Orders...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 14')
    .is('content', null);

  if (error || !rows) return console.error('❌ DB Error:', error);

  for (const row of rows) {
    try {
      console.log(`📝 Writing: ${row.job_title} ${row.document_type}...`);

      let customInstructions = '';
      let dynamicKey = '';
      let dynamicDesc = '';
      let sections = '';

      if (row.document_type === 'Scope of Work') {
        customInstructions = `This is a Scope of Work Template page. Focus on defining deliverables, project boundaries, responsibilities, timelines, milestones, revisions, approval steps, and what is explicitly excluded.`;
        dynamicKey = 'scope_creep_examples';
        dynamicDesc = 'List 3 specific things explicitly excluded by this document';
        sections = `Include clear sections for: Project Overview, Scope of Work, Deliverables, Timeline & Milestones, Revisions Policy, Out of Scope, and Approval Process.`;
      } else if (row.document_type === 'Work Order') {
        customInstructions = `This is a Work Order Template page. Focus on the specific job request, labor/materials, site details, authorization, start date, completion notes, and payment terms. It is highly transactional.`;
        dynamicKey = 'job_specific_details';
        dynamicDesc = 'List 3 critical job execution details (e.g., site access requirements, materials provided, start conditions)';
        sections = `Include clear sections for: Job Description, Location / Site Details, Labor & Materials, Start Date, Completion Terms, Payment Terms, and Authorization Signature.`;
      }

      const prompt = `
        You are an expert freelance business coach.
        Generate content for a "${row.job_title} ${row.document_type} Template" page.
        
        CRITICAL RULE: ${customInstructions}
        Make it highly specific to a ${row.job_title}.

        RETURN ONLY VALID JSON:
        {
          "pain_point_hook": "2 punchy sentences about the pain of not using this specific document.",
          "legal_tip": "1 practical tip for enforcing this agreement.",
          "why_it_matters": "A 150-word explanation of why a ${row.job_title} must use this document.",
          "unique_risks": [
            { "title": "Risk 1", "description": "Specific risk if this is ignored." },
            { "title": "Risk 2", "description": "Specific risk if this is ignored." },
            { "title": "Risk 3", "description": "Specific risk if this is ignored." }
          ],
          "deliverables": ["List 5-6 standard items covered in this document"],
          "${dynamicKey}": ["${dynamicDesc}"],
          "real_world_scenario": "A 150-word story of a ${row.job_title} saving their business using this document.",
          "best_practices": [
            { "title": "Practice 1", "description": "Short explanation" },
            { "title": "Practice 2", "description": "Short explanation" }
          ],
          "pricing_guidance": "1 paragraph on standard pricing structures for this.",
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

      // 🛡️ Safe Mapping: Sneak the Work Order details into the existing DB column
      if (json.job_specific_details) {
        json.scope_creep_examples = json.job_specific_details;
        delete json.job_specific_details;
      }

      await supabase.from('seo_pages').update(json).eq('id', row.id);
      console.log(`✅ Saved ${row.slug}`);

    } catch (err: any) {
      console.error(`❌ Failed ${row.slug}:`, err.message);
    }
  }
}

processBatch14();