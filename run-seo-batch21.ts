import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const model = google('gemini-flash-latest');

function getInstructions(documentType: string) {
  switch (documentType) {
    case 'Deposit Agreement':
      return {
        customInstructions: 'This is a Deposit Agreement template. Focus on nonrefundable or credited deposits, payment due before work starts, refund boundaries, timeline holds, and client approval before final delivery. Use payment protection language, but do not call it escrow.',
        dynamicKey: 'deposit_controls',
        dynamicDesc: 'List 3 clauses that protect upfront payment, such as deposit due date, refund limits, and paused work for missed payments.',
        sections: 'Include clear sections for: Deposit Amount, Payment Timing, Refund Rules, Client Responsibilities, Approval Milestones, Final Payment, and Cancellation.',
      };
    case 'Upfront Payment Contract':
      return {
        customInstructions: 'This is an Upfront Payment Contract. Focus on collecting payment before work begins, defining deliverables, approvals, chargeback prevention, and what happens if the client delays feedback. Use payment protection language, but do not call it escrow.',
        dynamicKey: 'upfront_payment_controls',
        dynamicDesc: 'List 3 clauses that make upfront payment clear, such as payment due before scheduling, defined deliverables, and approval deadlines.',
        sections: 'Include clear sections for: Scope of Work, Upfront Payment, Client Review, Approval Deadlines, Delivery Conditions, Refund Limits, and Termination.',
      };
    case 'Milestone Payment Agreement':
      return {
        customInstructions: 'This is a Milestone Payment Agreement template. Focus on breaking work into paid stages, requiring approval and payment before the next phase, handling late feedback, and protecting the freelancer from unpaid expansion of scope.',
        dynamicKey: 'milestone_payment_controls',
        dynamicDesc: 'List 3 controls for milestone billing, such as payment gates, approval windows, and change request pricing.',
        sections: 'Include clear sections for: Project Milestones, Deliverables by Phase, Approval Criteria, Payment Schedule, Late Payment, Change Requests, and Final Delivery.',
      };
    case 'Client Approval and Payment Agreement':
    case 'Content Approval Contract':
    case 'Milestone Approval Agreement':
      return {
        customInstructions: 'This is a Client Approval and Payment template. Focus on written approvals, acceptance criteria, revision limits, final payment authorization, and avoiding disputes after the client signs off.',
        dynamicKey: 'approval_controls',
        dynamicDesc: 'List 3 approval controls, such as written acceptance, revision cutoff, and final invoice authorization.',
        sections: 'Include clear sections for: Deliverable Review, Acceptance Criteria, Revision Limits, Approval Deadline, Final Payment, and Post-Approval Changes.',
      };
    case 'Retainer Payment Agreement':
      return {
        customInstructions: 'This is a Retainer Payment Agreement template. Focus on recurring upfront payment, included deliverables or hours, unused time rules, approval process, payment pauses, and cancellation terms.',
        dynamicKey: 'retainer_payment_controls',
        dynamicDesc: 'List 3 retainer payment controls, such as monthly advance billing, unused time rules, and excluded rush work.',
        sections: 'Include clear sections for: Monthly Retainer, Included Services, Payment Due Date, Approval Workflow, Unused Time, Additional Work, and Cancellation.',
      };
    case 'Deposit and Usage Rights Agreement':
      return {
        customInstructions: 'This is a Deposit and Usage Rights Agreement template. Focus on deposit collection, shoot scheduling, image usage rights, license limits, client approvals, and final payment before broad usage or file delivery.',
        dynamicKey: 'usage_payment_controls',
        dynamicDesc: 'List 3 clauses that connect payment with usage rights, such as license activation after payment, usage limits, and approval of final selects.',
        sections: 'Include clear sections for: Deposit, Shoot Scope, Usage Rights, License Restrictions, Client Selection and Approval, Final Payment, and Cancellation.',
      };
    case 'Deposit and Cancellation Contract':
      return {
        customInstructions: 'This is a Deposit and Cancellation Contract template. Focus on reserving event dates, nonrefundable deposits, rescheduling terms, cancellation windows, client responsibilities, and payment before final delivery.',
        dynamicKey: 'cancellation_payment_controls',
        dynamicDesc: 'List 3 clauses that protect booked dates, such as nonrefundable reservation fees, rescheduling limits, and final payment before delivery.',
        sections: 'Include clear sections for: Event Date Reservation, Deposit, Rescheduling, Cancellation Fees, Client Responsibilities, Final Payment, and Delivery.',
      };
    case 'Payment Schedule Agreement':
      return {
        customInstructions: 'This is a Payment Schedule Agreement template. Focus on deposit, progress payments, client approval checkpoints, late payment pauses, and final payment before launch or transfer.',
        dynamicKey: 'payment_schedule_controls',
        dynamicDesc: 'List 3 payment schedule controls, such as deposit, staged invoices, and final payment before launch.',
        sections: 'Include clear sections for: Payment Schedule, Deliverables, Approval Checkpoints, Late Payment, Launch Conditions, Change Requests, and Termination.',
      };
    case 'Production Agreement':
      return {
        customInstructions: 'This is a Production Agreement template. Focus on content production deliverables, approvals, payment checkpoints, licensing, revision limits, and handoff conditions.',
        dynamicKey: 'production_payment_controls',
        dynamicDesc: 'List 3 controls that protect production revenue, such as pre-production deposit, approval gates, and final payment before file transfer.',
        sections: 'Include clear sections for: Production Scope, Deliverables, Payment Checkpoints, Client Approvals, Revision Limits, Usage Rights, and Final Delivery.',
      };
    default:
      return {
        customInstructions: 'This is a Service Agreement template. Focus on scope of services, client responsibilities, deposits or upfront payment where appropriate, approval milestones, payment terms, termination, and limitation of liability. Use payment protection language, but do not call it escrow.',
        dynamicKey: 'service_payment_controls',
        dynamicDesc: 'List 3 clauses that protect payment, such as upfront payment, approval milestones, and paused work for overdue invoices.',
        sections: 'Include clear sections for: Scope of Services, Client Responsibilities, Payment Terms, Approval Milestones, Termination, and Limitation of Liability.',
      };
  }
}

async function processBatch21() {
  console.log('Starting targeted 10/10 AI generation for Batch 21 weekly pages...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 21')
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
        You are an expert freelance business coach and contract strategist.
        Generate content for a "${row.job_title} ${row.document_type} Template" page for MicroFreelanceHub.

        POSITIONING RULES:
        - MicroFreelanceHub helps freelancers combine contracts, client approvals, deposits, and payment links into one workflow.
        - Emphasize practical payment protection, deposits, upfront payment, milestone billing, and approval records.
        - Do not describe the workflow as escrow or imply regulated escrow services.

        CRITICAL RULE: ${customInstructions}
        Make it highly specific to a ${row.job_title}. Avoid generic legal filler.

        RETURN ONLY VALID JSON:
        {
          "pain_point_hook": "2 punchy sentences about the risk of working without this specific document and payment workflow.",
          "legal_tip": "1 practical tip for enforcing this document.",
          "why_it_matters": "A 150-word explanation of why a ${row.job_title} needs this document to protect revenue, approvals, and payment timing.",
          "unique_risks": [
            { "title": "Risk 1", "description": "Specific risk if this is ignored." },
            { "title": "Risk 2", "description": "Specific risk if this is ignored." },
            { "title": "Risk 3", "description": "Specific risk if this is ignored." }
          ],
          "deliverables": ["List 5-6 standard clauses, workflow steps, or items covered in this document"],
          "${dynamicKey}": ["${dynamicDesc}"],
          "real_world_scenario": "A 150-word story of a ${row.job_title} avoiding a legal, approval, or payment headache using this document.",
          "best_practices": [
            { "title": "Practice 1", "description": "Short explanation" },
            { "title": "Practice 2", "description": "Short explanation" }
          ],
          "pricing_guidance": "1 paragraph explaining standard pricing structures, deposits, milestone payments, or retainers related to this document.",
          "snippet_answer": "A 50-word answer defining what a ${row.job_title} ${row.document_type} is.",
          "ai_summary": "An 80-word summary of the page.",
          "faqs": [
            { "q": "Question 1 specific to this doc type?", "a": "Answer" },
            { "q": "Question 2 specific to this doc type?", "a": "Answer" }
          ],
          "content": "A clean HTML representation of the contract or workflow template using <p>, <h3>, <ul>. No html/body tags. CRITICAL HTML RULE: ${sections}"
        }
      `;

      const { text } = await generateText({ model, prompt });
      const json = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());

      for (const key of ['deposit_controls', 'upfront_payment_controls', 'milestone_payment_controls', 'approval_controls', 'retainer_payment_controls', 'usage_payment_controls', 'cancellation_payment_controls', 'payment_schedule_controls', 'production_payment_controls', 'service_payment_controls']) {
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

processBatch21();
