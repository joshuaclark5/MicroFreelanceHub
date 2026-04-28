import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const model = google('gemini-flash-latest');

async function processBatch13() {
  console.log('🚀 Starting targeted 10/10 AI generation for Retainers & Change Orders...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 13')
    .is('content', null); // Only run on empty pages

  if (error || !rows) return console.error('❌ DB Error:', error);

  for (const row of rows) {
    try {
      console.log(`📝 Writing: ${row.job_title} ${row.document_type}...`);

      // 👉 DYNAMIC PROMPTING BASED ON DOCUMENT TYPE
      let customInstructions = '';
      if (row.document_type === 'Retainer') {
        customInstructions = `This is a Retainer Agreement page. Focus strictly on recurring monthly work, reserved time, minimum commitments, unused hours, rollover rules, cancellation, and preventing unpaid availability.`;
      } else if (row.document_type === 'Change Order') {
        customInstructions = `This is a Change Order template page. Focus strictly on additional work outside the original agreement, revised pricing, revised deadlines, requiring client approval BEFORE work continues, re-signatures, and preventing unpaid scope creep.`;
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
          "deliverables": ["List 5-6 standard items covered in this document (e.g., Monthly Scope, Unused Hours, Added Cost, etc.)"],
          "scope_creep_examples": ["List 3 specific things explicitly excluded by this document"],
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
          "content": "A clean HTML representation of the legal text for this document using <p>, <h3>, <ul>. No html/body tags."
        }
      `;

      const { text } = await generateText({ model, prompt });
      const json = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

      await supabase.from('seo_pages').update(json).eq('id', row.id);
      console.log(`✅ Saved ${row.slug}`);

    } catch (err: any) {
      console.error(`❌ Failed ${row.slug}:`, err.message);
    }
  }
}

processBatch13();