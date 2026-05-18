import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const model = google('gemini-flash-latest');

async function processBatch17() {
  console.log('🚀 Starting targeted 10/10 AI generation for Service & Maintenance Agreements...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 17')
    .is('content', null);

  if (error || !rows) return console.error('❌ DB Error:', error);

  for (const row of rows) {
    try {
      console.log(`📝 Writing: ${row.job_title} ${row.document_type}...`);

      let customInstructions = '';
      let dynamicKey = '';
      let dynamicDesc = '';
      let sections = '';

      if (row.document_type === 'Service Agreement') {
        customInstructions = `This is a Service Agreement Template. Focus on general terms of service, SLA (Service Level Agreements), independent contractor status, and termination clauses.`;
        dynamicKey = 'service_limitations';
        dynamicDesc = 'List 3 specific limitations of the services provided (e.g., maximum monthly hours, guaranteed response times, exclusions).';
        sections = `Include clear sections for: Scope of Services, Service Level Agreement (SLA), Client Responsibilities, Term & Termination, and Limitation of Liability.`;
      } else if (row.document_type === 'Maintenance Agreement') {
        customInstructions = `This is a Maintenance Agreement Template. Focus on long-term upkeep, bug fixes, routine physical maintenance, or updates. Focus heavily on what is considered "maintenance" vs what is considered "new paid work".`;
        dynamicKey = 'maintenance_exclusions';
        dynamicDesc = 'List 3 specific things NOT covered under standard maintenance (e.g., complete redesigns, emergency weekend calls, new feature development).';
        sections = `Include clear sections for: Included Maintenance Tasks, Excluded Services, Response Times, Payment for Ongoing Support, and Cancellation Policy.`;
      }

      const prompt = `
        You are an expert freelance business coach and legal strategist.
        Generate content for a "${row.job_title} ${row.document_type} Template" page.
        
        CRITICAL RULE: ${customInstructions}
        Make it highly specific to a ${row.job_title}.

        RETURN ONLY VALID JSON:
        {
          "pain_point_hook": "2 punchy sentences about the danger of providing ongoing work without strict boundaries.",
          "legal_tip": "1 practical tip for enforcing this specific agreement.",
          "why_it_matters": "A 150-word explanation of why a ${row.job_title} must use this document for long-term clients.",
          "unique_risks": [
            { "title": "Risk 1", "description": "Specific risk if this is ignored." },
            { "title": "Risk 2", "description": "Specific risk if this is ignored." },
            { "title": "Risk 3", "description": "Specific risk if this is ignored." }
          ],
          "deliverables": ["List 5-6 standard clauses or items covered in this document"],
          "${dynamicKey}": ["${dynamicDesc}"],
          "real_world_scenario": "A 150-word story of a ${row.job_title} saving their time/revenue using this document.",
          "best_practices": [
            { "title": "Practice 1", "description": "Short explanation" },
            { "title": "Practice 2", "description": "Short explanation" }
          ],
          "pricing_guidance": "1 paragraph explaining standard pricing structures (hourly, flat-fee, monthly) related to this situation.",
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
      if (json.service_limitations) {
        json.scope_creep_examples = json.service_limitations;
        delete json.service_limitations;
      } else if (json.maintenance_exclusions) {
        json.scope_creep_examples = json.maintenance_exclusions;
        delete json.maintenance_exclusions;
      }

      await supabase.from('seo_pages').update(json).eq('id', row.id);
      console.log(`✅ Saved ${row.slug}`);

    } catch (err: any) {
      console.error(`❌ Failed ${row.slug}:`, err.message);
    }
  }
}

processBatch17();