import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const model = google('gemini-flash-latest');

const defaultInstructions = {
  customInstructions: 'This is a Service Agreement template. Focus on scope of services, client responsibilities, deposits or upfront payment where appropriate, approval milestones, payment terms, termination, and limitation of liability. Use payment protection language, but do not call it escrow.',
  dynamicKey: 'service_payment_controls',
  dynamicDesc: 'List 3 clauses that protect payment, such as upfront payment, approval milestones, and paused work for overdue invoices.',
  sections: 'Include clear sections for: Scope of Services, Client Responsibilities, Payment Terms, Approval Milestones, Termination, and Limitation of Liability.',
};

const instructionMap: Record<string, typeof defaultInstructions> = {
  'Deposit Agreement': {
    customInstructions: 'This is a Deposit Agreement template. Focus on nonrefundable or credited deposits, payment due before work starts, refund boundaries, timeline holds, and client approval before final delivery. Use payment protection language, but do not call it escrow.',
    dynamicKey: 'deposit_controls',
    dynamicDesc: 'List 3 clauses that protect upfront payment, such as deposit due date, refund limits, and paused work for missed payments.',
    sections: 'Include clear sections for: Deposit Amount, Payment Timing, Refund Rules, Client Responsibilities, Approval Milestones, Final Payment, and Cancellation.',
  },
  'Deposit and Approval Agreement': {
    customInstructions: 'This is a Deposit and Approval Agreement template. Focus on a deposit before implementation, mapped automation deliverables, client testing responsibilities, written approval, and final payment before handoff. Use payment protection language, but do not call it escrow.',
    dynamicKey: 'deposit_approval_controls',
    dynamicDesc: 'List 3 clauses that connect deposits with approval, such as paid kickoff, client test acceptance, and final payment before transfer.',
    sections: 'Include clear sections for: Deposit, Automation Scope, Client Testing, Approval Criteria, Revision Limits, Final Payment, and Handoff.',
  },
  'Upfront Payment Contract': {
    customInstructions: 'This is an Upfront Payment Contract. Focus on collecting payment before work begins, defining deliverables, approvals, chargeback prevention, and what happens if the client delays feedback. Use payment protection language, but do not call it escrow.',
    dynamicKey: 'upfront_payment_controls',
    dynamicDesc: 'List 3 clauses that make upfront payment clear, such as payment due before scheduling, defined deliverables, and approval deadlines.',
    sections: 'Include clear sections for: Scope of Work, Upfront Payment, Client Review, Approval Deadlines, Delivery Conditions, Refund Limits, and Termination.',
  },
  'Milestone Payment Agreement': {
    customInstructions: 'This is a Milestone Payment Agreement template. Focus on breaking work into paid stages, requiring approval and payment before the next phase, handling late feedback, and protecting the freelancer from unpaid expansion of scope.',
    dynamicKey: 'milestone_payment_controls',
    dynamicDesc: 'List 3 controls for milestone billing, such as payment gates, approval windows, and change request pricing.',
    sections: 'Include clear sections for: Project Milestones, Deliverables by Phase, Approval Criteria, Payment Schedule, Late Payment, Change Requests, and Final Delivery.',
  },
  'Project Approval and Payment Agreement': {
    customInstructions: 'This is a Client Approval and Payment template. Focus on written approvals, acceptance criteria, revision limits, final payment authorization, and avoiding disputes after the client signs off.',
    dynamicKey: 'approval_controls',
    dynamicDesc: 'List 3 approval controls, such as written acceptance, revision cutoff, and final invoice authorization.',
    sections: 'Include clear sections for: Deliverable Review, Acceptance Criteria, Revision Limits, Approval Deadline, Final Payment, and Post-Approval Changes.',
  },
  'Client Approval Agreement': {
    customInstructions: 'This is a Client Approval and Payment template. Focus on written approvals, acceptance criteria, revision limits, final payment authorization, and avoiding disputes after the client signs off.',
    dynamicKey: 'approval_controls',
    dynamicDesc: 'List 3 approval controls, such as written acceptance, revision cutoff, and final invoice authorization.',
    sections: 'Include clear sections for: Deliverable Review, Acceptance Criteria, Revision Limits, Approval Deadline, Final Payment, and Post-Approval Changes.',
  },
  'Content Approval Contract': {
    customInstructions: 'This is a Content Approval Contract template. Focus on written content approvals, revision limits, usage approval, final payment authorization, and avoiding disputes after the client signs off.',
    dynamicKey: 'approval_controls',
    dynamicDesc: 'List 3 approval controls, such as written acceptance, revision cutoff, and final invoice authorization.',
    sections: 'Include clear sections for: Content Deliverables, Review Process, Acceptance Criteria, Revision Limits, Final Payment, and Post-Approval Changes.',
  },
  'Milestone Approval Agreement': {
    customInstructions: 'This is a Milestone Approval Agreement template. Focus on launch checkpoints, written approval, acceptance criteria, payment gates, late feedback, and post-approval change requests.',
    dynamicKey: 'approval_controls',
    dynamicDesc: 'List 3 approval controls, such as written acceptance, milestone payment gates, and post-approval change pricing.',
    sections: 'Include clear sections for: Milestones, Approval Criteria, Review Deadlines, Payment Gates, Revision Limits, and Final Launch Approval.',
  },
  'Change Request Payment Agreement': {
    customInstructions: 'This is a Change Request Payment Agreement template. Focus on paid change requests, implementation impact, approval before extra work starts, revised timelines, and payment links for additions. Use payment protection language, but do not call it escrow.',
    dynamicKey: 'change_request_payment_controls',
    dynamicDesc: 'List 3 controls for paid changes, such as written change approval, separate payment due date, and timeline adjustment.',
    sections: 'Include clear sections for: Original Scope, Requested Change, Added Fees, Payment Due Before Work, Schedule Impact, Approval, and Delivery Conditions.',
  },
  'Retainer Payment Agreement': {
    customInstructions: 'This is a Retainer Payment Agreement template. Focus on recurring upfront payment, included deliverables or hours, unused time rules, approval process, payment pauses, and cancellation terms.',
    dynamicKey: 'retainer_payment_controls',
    dynamicDesc: 'List 3 retainer payment controls, such as monthly advance billing, unused time rules, and excluded rush work.',
    sections: 'Include clear sections for: Monthly Retainer, Included Services, Payment Due Date, Approval Workflow, Unused Time, Additional Work, and Cancellation.',
  },
  'Payment Schedule Agreement': {
    customInstructions: 'This is a Payment Schedule Agreement template. Focus on deposit, progress payments, client approval checkpoints, late payment pauses, and final payment before launch or transfer.',
    dynamicKey: 'payment_schedule_controls',
    dynamicDesc: 'List 3 payment schedule controls, such as deposit, staged invoices, and final payment before launch.',
    sections: 'Include clear sections for: Payment Schedule, Deliverables, Approval Checkpoints, Late Payment, Launch Conditions, Change Requests, and Termination.',
  },
};

function parseJson(text: string) {
  const fence = String.fromCharCode(96, 96, 96);
  const cleaned = text.replaceAll(fence + 'json', '').replaceAll(fence, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1) throw new Error('Model did not return a JSON object.');
  return JSON.parse(cleaned.slice(first, last + 1));
}

function ensureArray(value: unknown) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === '') return [];
  return [String(value)];
}

function normalizeFaqs(value: any) {
  return ensureArray(value).map((faq: any) => ({
    q: faq.q || faq.question || '',
    a: faq.a || faq.answer || '',
  }));
}

async function processBatch22() {
  console.log('Starting targeted 10/10 AI generation for Batch 22 weekly pages...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 22')
    .is('content', null);

  if (error || !rows) {
    console.error('DB Error:', error);
    process.exitCode = 1;
    return;
  }

  for (const row of rows) {
    try {
      console.log('Writing: ' + row.job_title + ' ' + row.document_type + '...');

      const { customInstructions, dynamicKey, dynamicDesc, sections } = instructionMap[row.document_type] || defaultInstructions;
      const prompt = [
        'You are an expert freelance business coach and contract strategist.',
        'Generate content for a "' + row.job_title + ' ' + row.document_type + ' Template" page for MicroFreelanceHub.',
        '',
        'POSITIONING RULES:',
        '- MicroFreelanceHub helps freelancers combine contracts, client approvals, deposits, and payment links into one workflow.',
        '- Emphasize practical payment protection, deposits, upfront payment, milestone billing, approval records, and payment links.',
        '- Do not describe the workflow as escrow or imply regulated escrow services.',
        '',
        'CRITICAL RULE: ' + customInstructions,
        'Make it highly specific to a ' + row.job_title + '. Avoid generic legal filler.',
        '',
        'RETURN ONLY VALID JSON with these keys: pain_point_hook, legal_tip, why_it_matters, unique_risks, deliverables, ' + dynamicKey + ', real_world_scenario, best_practices, pricing_guidance, snippet_answer, ai_summary, faqs, content.',
        'Use 150 words for why_it_matters, 150 words for real_world_scenario, 50 words for snippet_answer, and 80 words for ai_summary.',
        'unique_risks must be 3 objects with title and description. best_practices must be 2 objects with title and description. faqs must be 2 question/answer objects.',
        dynamicKey + ': ' + dynamicDesc,
        'content must be clean HTML using <p>, <h3>, <ul> only, with no html/body tags. ' + sections,
      ].join('\n');

      const { text } = await generateText({ model, prompt });
      const json = parseJson(text);

      for (const key of ['deposit_controls', 'deposit_approval_controls', 'upfront_payment_controls', 'milestone_payment_controls', 'approval_controls', 'change_request_payment_controls', 'retainer_payment_controls', 'payment_schedule_controls', 'service_payment_controls']) {
        if (json[key]) {
          json.scope_creep_examples = ensureArray(json[key]);
          delete json[key];
        }
      }

      json.deliverables = ensureArray(json.deliverables);
      json.scope_creep_examples = ensureArray(json.scope_creep_examples);
      json.faqs = normalizeFaqs(json.faqs);

      const { error: updateError } = await supabase.from('seo_pages').update(json).eq('id', row.id);
      if (updateError) throw updateError;

      console.log('Saved ' + row.slug);
    } catch (err: any) {
      console.error('Failed ' + row.slug + ':', err.message);
      process.exitCode = 1;
    }
  }
}

processBatch22();
