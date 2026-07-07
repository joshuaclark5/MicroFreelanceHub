import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const model = google('gemini-flash-latest');

function getInstructions(documentType: string) {
  switch (documentType) {
    case 'Scope of Work':
      return {
        customInstructions: 'This is a Scope of Work template. Focus on precise deliverables, milestones, assumptions, revision limits, acceptance criteria, and out-of-scope work.',
        dynamicKey: 'scope_controls',
        dynamicDesc: 'List 3 clauses that prevent scope creep, such as revision limits, milestone acceptance, and change request pricing.',
        sections: 'Include clear sections for: Project Objectives, Deliverables, Timeline and Milestones, Revision Limits, Acceptance Criteria, and Change Requests.',
      };
    case 'Retainer':
      return {
        customInstructions: 'This is a Retainer Agreement template. Focus on monthly availability, included hours or deliverables, rollover rules, response time, and cancellation terms.',
        dynamicKey: 'retainer_boundaries',
        dynamicDesc: 'List 3 boundaries that keep a monthly retainer profitable, such as maximum hours, unused time rules, and excluded emergency work.',
        sections: 'Include clear sections for: Monthly Services, Included Hours or Deliverables, Response Times, Unused Time, Additional Work, and Cancellation.',
      };
    case 'Maintenance Agreement':
      return {
        customInstructions: 'This is a Maintenance Agreement template. Focus on ongoing upkeep, bug fixes, update windows, emergency support, and what counts as new paid work.',
        dynamicKey: 'maintenance_exclusions',
        dynamicDesc: 'List 3 specific things not covered under maintenance, such as redesigns, new features, and third-party platform failures.',
        sections: 'Include clear sections for: Included Maintenance Tasks, Excluded Services, Response Times, Emergency Support, Payment, and Cancellation.',
      };
    case 'Independent Contractor Agreement':
      return {
        customInstructions: 'This is an Independent Contractor Agreement. Focus on 1099 status, autonomy, taxes, confidentiality, tools, project control, and non-employee classification.',
        dynamicKey: 'contractor_classifications',
        dynamicDesc: 'List 3 clauses that reinforce independent contractor status, such as own taxes, own equipment, and control over work methods.',
        sections: 'Include clear sections for: Services Provided, Compensation, Independent Contractor Status, Taxes and Benefits, Confidentiality, and Termination.',
      };
    case 'Project Sign-Off Form':
      return {
        customInstructions: 'This is a Project Sign-Off Form. Focus on client acceptance, revision waiver, final deliverables, final payment authorization, and limiting future disputes.',
        dynamicKey: 'acceptance_terms',
        dynamicDesc: 'List 3 things the client confirms at sign-off, such as acceptance of deliverables, no further free revisions, and approval for final billing.',
        sections: 'Include clear sections for: Final Deliverables Summary, Client Acceptance, Revision Waiver, Final Payment Authorization, and Release of Liability.',
      };
    case 'Change Order':
      return {
        customInstructions: 'This is a Change Order template. Focus on new scope, revised pricing, schedule impact, approval before work starts, and preventing unpaid extras.',
        dynamicKey: 'change_order_triggers',
        dynamicDesc: 'List 3 common triggers that require a paid change order.',
        sections: 'Include clear sections for: Original Scope Reference, Requested Change, Added Fees, Schedule Impact, Approval, and Payment Terms.',
      };
    default:
      return {
        customInstructions: 'This is a Service Agreement template. Focus on the scope of services, client responsibilities, payment terms, termination, and limitation of liability.',
        dynamicKey: 'service_limitations',
        dynamicDesc: 'List 3 specific service limitations or exclusions.',
        sections: 'Include clear sections for: Scope of Services, Client Responsibilities, Payment Terms, Termination, and Limitation of Liability.',
      };
  }
}

async function processBatch20() {
  console.log('Starting targeted 10/10 AI generation for Batch 20 weekly pages...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 20')
    .is('content', null);

  if (error || !rows) {
    console.error('DB Error:', error);
    process.exitCode = 1;
    return;
  }

  for (const row of rows) {
    try {
      console.log(`Writing: ${row.job_title} ${row.document_type}...`);

      const { customInstructions, dynamicKey, dynamicDesc, sections } = getInstructions(row.document_type);

      const prompt = `
        You are an expert freelance business coach and legal strategist.
        Generate content for a "${row.job_title} ${row.document_type} Template" page.

        CRITICAL RULE: ${customInstructions}
        Make it highly specific to a ${row.job_title}. Avoid generic legal filler.

        RETURN ONLY VALID JSON:
        {
          "pain_point_hook": "2 punchy sentences about the risk of working without this specific document.",
          "legal_tip": "1 practical tip for enforcing this document.",
          "why_it_matters": "A 150-word explanation of why a ${row.job_title} needs this document to protect revenue and avoid disputes.",
          "unique_risks": [
            { "title": "Risk 1", "description": "Specific risk if this is ignored." },
            { "title": "Risk 2", "description": "Specific risk if this is ignored." },
            { "title": "Risk 3", "description": "Specific risk if this is ignored." }
          ],
          "deliverables": ["List 5-6 standard clauses or items covered in this document"],
          "${dynamicKey}": ["${dynamicDesc}"],
          "real_world_scenario": "A 150-word story of a ${row.job_title} avoiding a legal or payment headache using this document.",
          "best_practices": [
            { "title": "Practice 1", "description": "Short explanation" },
            { "title": "Practice 2", "description": "Short explanation" }
          ],
          "pricing_guidance": "1 paragraph explaining standard pricing structures related to this document.",
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

      for (const key of ['scope_controls', 'retainer_boundaries', 'maintenance_exclusions', 'contractor_classifications', 'acceptance_terms', 'change_order_triggers', 'service_limitations']) {
        if (json[key]) {
          json.scope_creep_examples = json[key];
          delete json[key];
        }
      }

      const { error: updateError } = await supabase.from('seo_pages').update(json).eq('id', row.id);
      if (updateError) throw updateError;

      console.log(`Saved ${row.slug}`);
    } catch (err: any) {
      console.error(`Failed ${row.slug}:`, err.message);
      process.exitCode = 1;
    }
  }
}

processBatch20();
