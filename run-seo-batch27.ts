import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const model = google('gemini-flash-latest');

type Instructions = {
  customInstructions: string;
  dynamicKey: string;
  dynamicDesc: string;
  sections: string;
};

const defaultInstructions: Instructions = {
  customInstructions: 'This is a client communication and project admin template. Focus on clear wording, client responsibilities, approval records, payment timing, next steps, and a calm professional tone. Do not make legal guarantees or imply that payment can be forced.',
  dynamicKey: 'workflow_controls',
  dynamicDesc: 'List 3 controls that keep the workflow clear, such as written approval, payment due date, and paused work until the client responds.',
  sections: 'Include clear sections for: Message Goal, When to Send It, Client Context to Add, Template Message, Follow-Up Timing, and Next Workflow Step.',
};

const instructionMap: Record<string, Instructions> = {
  'Overdue Invoice Reminder Email Template': {
    customInstructions: 'This is a polite overdue invoice reminder email template. Focus on invoice number, original due date, direct payment link, calm tone, and a clear next check-in without threats.',
    dynamicKey: 'invoice_reminder_controls',
    dynamicDesc: 'List 3 controls for overdue invoice reminders, such as invoice number, original due date, and direct payment link.',
    sections: 'Include clear sections for: Email Goal, When to Send It, Invoice Details to Add, Template Email, Payment Link Placement, and Follow-Up Timing.',
  },
  'Second Late Payment Follow-Up Email Template': {
    customInstructions: 'This is a second late payment follow-up email template. Focus on referencing the first reminder, restating the payment link, asking for a payment date, and explaining work or handoff timing calmly.',
    dynamicKey: 'second_follow_up_controls',
    dynamicDesc: 'List 3 controls for a second late payment follow-up, such as prior reminder date, requested payment date, and next project step.',
    sections: 'Include clear sections for: Email Goal, Prior Reminder Context, Template Email, Payment Date Request, Project Timing Note, and Next Follow-Up Step.',
  },
  'Final Overdue Invoice Check-In Email Template': {
    customInstructions: 'This is a final overdue invoice check-in email template. Focus on professional closeout wording, invoice details, payment link, a response deadline, and a non-threatening next admin step.',
    dynamicKey: 'final_check_in_controls',
    dynamicDesc: 'List 3 controls for a final invoice check-in, such as deadline, invoice summary, and next admin action.',
    sections: 'Include clear sections for: Email Goal, Invoice Context, Template Email, Response Deadline, Payment Link Step, and Record-Keeping Next Step.',
  },
  'Payment Link Reminder Email Template': {
    customInstructions: 'This is a payment link reminder email template. Focus on making it easy to pay, confirming what the payment unlocks, and keeping the message concise and helpful.',
    dynamicKey: 'payment_link_controls',
    dynamicDesc: 'List 3 controls for payment link reminders, such as invoice amount, payment link, and what happens after payment.',
    sections: 'Include clear sections for: Email Goal, Payment Context, Template Email, Payment Link Placement, What Happens After Payment, and Confirmation Step.',
  },
  'Client Approval Chaser Email Template': {
    customInstructions: 'This is a client approval chaser email template. Focus on review deadline, approval criteria, what is waiting on approval, delay impact, and the next payment or handoff step if relevant.',
    dynamicKey: 'approval_chaser_controls',
    dynamicDesc: 'List 3 controls for approval chasers, such as approval deadline, acceptance criteria, and next milestone trigger.',
    sections: 'Include clear sections for: Reminder Goal, Approval Context, Review Criteria, Template Email, Delay Impact, and Next Milestone Step.',
  },
  'Feedback Clarification Reply Template': {
    customInstructions: 'This is a vague website feedback clarification reply template. Focus on turning subjective comments into specific edits, asking focused questions, and keeping revision rounds bounded.',
    dynamicKey: 'feedback_clarification_controls',
    dynamicDesc: 'List 3 controls for vague feedback, such as examples requested, page or section reference, and revision boundary.',
    sections: 'Include clear sections for: Reply Goal, When to Send It, Clarifying Questions, Template Reply, Revision Boundary, and Confirmation Step.',
  },
  'Scope Creep Reply Template': {
    customInstructions: 'This is a scope creep reply template for the phrase "can you just add this". Focus on acknowledging the request, referencing the agreed scope, offering a paid change request, and preserving the relationship.',
    dynamicKey: 'scope_reply_controls',
    dynamicDesc: 'List 3 controls for scope creep replies, such as original scope reference, paid change request, and timeline adjustment.',
    sections: 'Include clear sections for: Reply Goal, Original Scope Reference, Template Reply, Paid Change Request Option, Timeline Impact, and Approval Next Step.',
  },
  'Unpaid Extra Work Response Template': {
    customInstructions: 'This is an unpaid extra work response template. Focus on naming the extra request, separating it from included scope, giving a paid option, and getting approval before work continues.',
    dynamicKey: 'extra_work_controls',
    dynamicDesc: 'List 3 controls for unpaid extra work, such as extra task summary, added fee, and approval before starting.',
    sections: 'Include clear sections for: Reply Goal, Extra Work Summary, Template Reply, Added Fee Option, Approval/Payment Step, and Updated Timeline.',
  },
  'Rush Request Fee Reply Template': {
    customInstructions: 'This is a rush request fee reply template. Focus on confirming urgency, explaining schedule impact, quoting the rush fee, and giving the client a normal-timeline option.',
    dynamicKey: 'rush_fee_controls',
    dynamicDesc: 'List 3 controls for rush requests, such as rush deadline, added fee, and approval before rescheduling.',
    sections: 'Include clear sections for: Reply Goal, Rush Request Context, Template Reply, Rush Fee Option, Standard Timeline Option, and Approval Next Step.',
  },
  'Budget Too Low Reply Template': {
    customInstructions: 'This is a budget too low reply template. Focus on respectful pricing boundaries, reduced-scope alternatives, payment schedule options, and a clear decision deadline.',
    dynamicKey: 'budget_reply_controls',
    dynamicDesc: 'List 3 controls for low-budget replies, such as reduced scope, deposit/payment schedule, and decision deadline.',
    sections: 'Include clear sections for: Reply Goal, Pricing Context, Template Reply, Reduced Scope Option, Payment Schedule Option, and Decision Deadline.',
  },
  'Deposit Paid Confirmation Email Template': {
    customInstructions: 'This is a project kickoff deposit paid confirmation email template. Focus on confirming the deposit, booking kickoff, restating next deliverables, and setting approval or milestone expectations.',
    dynamicKey: 'deposit_confirmation_controls',
    dynamicDesc: 'List 3 controls for deposit confirmation, such as amount received, kickoff date, and next approval milestone.',
    sections: 'Include clear sections for: Email Goal, Deposit Confirmation, Template Email, Kickoff Details, First Milestone, and Client Next Step.',
  },
  'Revision Round Approval Email Template': {
    customInstructions: 'This is a revision round complete approval email template. Focus on summarizing completed edits, asking for approval, stating remaining revision limits, and linking approval to the next project step.',
    dynamicKey: 'revision_approval_controls',
    dynamicDesc: 'List 3 controls for revision approval, such as completed edits, remaining revision count, and approval deadline.',
    sections: 'Include clear sections for: Email Goal, Revision Summary, Template Email, Approval Request, Remaining Revision Boundary, and Next Project Step.',
  },
  'Project Timeline Reset Email Template': {
    customInstructions: 'This is a project timeline reset email template after client delay. Focus on explaining the schedule impact, proposing new dates, keeping the client accountable for inputs, and confirming approval.',
    dynamicKey: 'timeline_reset_controls',
    dynamicDesc: 'List 3 controls for timeline resets, such as delayed input date, revised milestone dates, and client approval.',
    sections: 'Include clear sections for: Email Goal, Delay Context, Template Email, Revised Timeline, Client Inputs Needed, and Approval Step.',
  },
  'Project Handoff Checklist Template': {
    customInstructions: 'This is a project handoff checklist for social media managers. Focus on final assets, content calendar access, account permissions, reporting notes, final approval, final invoice status, and support boundaries.',
    dynamicKey: 'handoff_checklist_controls',
    dynamicDesc: 'List 3 controls for social media handoff, such as asset inventory, account access transfer, and final payment confirmation.',
    sections: 'Include clear sections for: Handoff Goal, Deliverables Checklist, Account Access, Reporting Notes, Client Approval, Final Payment Check, and Post-Handoff Support.',
  },
  'Final Files After Payment Email Template': {
    customInstructions: 'This is a final files ready after payment email template. Focus on confirming approved deliverables, noting that final files are ready, including a payment link, and describing the handoff after payment.',
    dynamicKey: 'final_files_controls',
    dynamicDesc: 'List 3 controls for final files after payment, such as approved version, final invoice amount, and handoff condition.',
    sections: 'Include clear sections for: Email Goal, Approval Context, Final Invoice Details, Template Email, Handoff After Payment, and Closeout Step.',
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

async function processBatch27() {
  console.log('Starting targeted AI generation for Batch 27 weekly pages...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 27')
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
        'You are an expert freelance client communication strategist and project admin coach.',
        'Generate content for a "' + row.job_title + ' ' + row.document_type + '" page for MicroFreelanceHub.',
        '',
        'POSITIONING RULES:',
        '- MicroFreelanceHub helps freelancers combine client messages, scope clarity, approvals, deposits, and payment links into one workflow.',
        '- Emphasize practical communication, approval records, payment links, deposit requests, final handoff, and client-ready next steps.',
        '- When relevant, point readers to <a href="/tools/client-message-generator">the free Client Reply Tool</a> for drafting a reply.',
        '- Do not describe the workflow as escrow or imply regulated escrow services.',
        '- Avoid legal overclaims. Do not promise legal protection, guaranteed payment, enforceability, liability limits, lawsuit prevention, or forced payment.',
        '',
        'CRITICAL RULE: ' + customInstructions,
        'Make it highly specific to: ' + row.job_title + '. Avoid generic filler and avoid sounding like legal advice.',
        '',
        'RETURN ONLY VALID JSON with these keys: pain_point_hook, legal_tip, why_it_matters, unique_risks, deliverables, ' + dynamicKey + ', real_world_scenario, best_practices, pricing_guidance, snippet_answer, ai_summary, faqs, content.',
        'legal_tip should be a practical workflow or wording tip, not legal advice.',
        'Use 130-160 words for why_it_matters, 120-160 words for real_world_scenario, 45-60 words for snippet_answer, and 70-90 words for ai_summary.',
        'unique_risks must be 3 objects with title and description. best_practices must be 2 objects with title and description. faqs must be 2 question/answer objects.',
        'deliverables should list 5-6 message parts, checklist items, or workflow sections covered by this template.',
        dynamicKey + ': ' + dynamicDesc,
        'content must be clean HTML using <p>, <h3>, <ul>, <li>, and <a> only, with no html/body tags. Include at least one contextual internal link to /tools/client-message-generator when the page is about replying to a client. ' + sections,
      ].join('\n');

      const { text } = await generateText({ model, prompt });
      const json = parseJson(text);

      for (const key of [
        'workflow_controls',
        'invoice_reminder_controls',
        'second_follow_up_controls',
        'final_check_in_controls',
        'payment_link_controls',
        'approval_chaser_controls',
        'feedback_clarification_controls',
        'scope_reply_controls',
        'extra_work_controls',
        'rush_fee_controls',
        'budget_reply_controls',
        'deposit_confirmation_controls',
        'revision_approval_controls',
        'timeline_reset_controls',
        'handoff_checklist_controls',
        'final_files_controls',
      ]) {
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

processBatch27();
