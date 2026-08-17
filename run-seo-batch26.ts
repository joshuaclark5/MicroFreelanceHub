import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const model = google('gemini-flash-latest');

const defaultInstructions = {
  customInstructions: 'This is a client communication and project admin template. Focus on clear wording, client responsibilities, approvals, payment timing, next steps, and a calm professional tone. Do not make legal guarantees or imply that payment can be forced.',
  dynamicKey: 'workflow_controls',
  dynamicDesc: 'List 3 controls that keep the workflow clear, such as written approval, payment due date, and paused work until the client responds.',
  sections: 'Include clear sections for: Message Goal, When to Send It, Client Context to Add, Template Message, Follow-Up Timing, and Next Workflow Step.',
};

const instructionMap: Record<string, typeof defaultInstructions> = {
  'Late Payment Follow-Up Email Template': {
    customInstructions: 'This is a late payment follow-up email template. Focus on polite overdue invoice wording, invoice details, payment link reminders, paused next steps, and a non-accusatory tone.',
    dynamicKey: 'payment_follow_up_controls',
    dynamicDesc: 'List 3 controls for overdue invoice follow-up, such as invoice number, direct payment link, and next follow-up date.',
    sections: 'Include clear sections for: Email Goal, When to Send It, Details to Include, Template Email, Follow-Up Timing, and Payment Link Next Step.',
  },
  'Scope Creep Reply Template': {
    customInstructions: 'This is a scope creep reply template. Focus on acknowledging the request, restating original scope, offering a paid change request, and keeping the client relationship warm.',
    dynamicKey: 'scope_reply_controls',
    dynamicDesc: 'List 3 controls for scope creep replies, such as original scope reference, paid change request, and timeline adjustment.',
    sections: 'Include clear sections for: Reply Goal, When to Send It, Original Scope Reference, Template Reply, Paid Change Request Option, and Approval Next Step.',
  },
  'Extra Revision Response Template': {
    customInstructions: 'This is an extra revision response template. Focus on revision limits, what has already been included, paid additional revisions, and approval before continuing.',
    dynamicKey: 'revision_controls',
    dynamicDesc: 'List 3 controls for extra revisions, such as included revision count, additional revision fee, and approval before editing.',
    sections: 'Include clear sections for: Reply Goal, Revision Context, Template Reply, Extra Revision Pricing, Approval Deadline, and Payment Link Next Step.',
  },
  'Final File Handoff Email Template': {
    customInstructions: 'This is a final file handoff email template. Focus on final deliverables, file access, approved versions, final invoice status, usage notes, and support boundaries after handoff.',
    dynamicKey: 'handoff_controls',
    dynamicDesc: 'List 3 handoff controls, such as approved final files, final payment status, and post-handoff support boundaries.',
    sections: 'Include clear sections for: Email Goal, Final Deliverables, Template Email, File Access Notes, Final Payment Check, and Post-Handoff Support.',
  },
  'Client Approval Reminder Email Template': {
    customInstructions: 'This is a client approval reminder email template. Focus on review deadlines, approval criteria, what happens after approval, delayed feedback impact, and next milestone payment if relevant.',
    dynamicKey: 'approval_reminder_controls',
    dynamicDesc: 'List 3 controls for approval reminders, such as approval deadline, acceptance criteria, and next milestone trigger.',
    sections: 'Include clear sections for: Reminder Goal, When to Send It, Approval Criteria, Template Email, Delay Impact, and Next Milestone Step.',
  },
  'Vague Feedback Reply Template': {
    customInstructions: 'This is a vague feedback reply template. Focus on asking clarifying questions, converting subjective feedback into specific edits, keeping revisions bounded, and confirming next steps.',
    dynamicKey: 'feedback_controls',
    dynamicDesc: 'List 3 controls for vague feedback, such as clarifying questions, examples requested, and revision boundaries.',
    sections: 'Include clear sections for: Reply Goal, When to Send It, Clarifying Questions, Template Reply, Revision Boundary, and Confirmation Step.',
  },
  'Discount Request Reply Template': {
    customInstructions: 'This is a discount request reply template. Focus on holding pricing, offering reduced scope instead of unexplained discounting, preserving margin, and giving the client clear options.',
    dynamicKey: 'discount_reply_controls',
    dynamicDesc: 'List 3 controls for discount requests, such as reduced scope option, payment schedule, and firm expiration date.',
    sections: 'Include clear sections for: Reply Goal, Pricing Context, Template Reply, Reduced Scope Option, Payment Schedule Option, and Decision Deadline.',
  },
  'Invoice Follow-Up Email Template': {
    customInstructions: 'This is a client ghosted invoice follow-up email template. Focus on resurfacing the invoice, keeping the tone calm, giving a direct payment link, and stating the next follow-up step without threats.',
    dynamicKey: 'invoice_follow_up_controls',
    dynamicDesc: 'List 3 controls for ghosted invoice follow-up, such as direct payment link, response deadline, and clear next check-in.',
    sections: 'Include clear sections for: Email Goal, When to Send It, Invoice Details, Template Email, Response Deadline, and Next Follow-Up Step.',
  },
  'Project Handoff Checklist Template': {
    customInstructions: 'This is a project handoff checklist template. Focus on final deliverables, access transfer, credentials, documentation, final approval, final invoice status, and support boundaries.',
    dynamicKey: 'handoff_checklist_controls',
    dynamicDesc: 'List 3 controls for project handoff, such as final approval, access transfer, and final payment confirmation.',
    sections: 'Include clear sections for: Handoff Goal, Deliverables Checklist, Access Transfer, Client Approval, Final Payment Check, and Post-Handoff Support.',
  },
  'Scope and Payment Workflow Template': {
    customInstructions: 'This is a scope and payment workflow template. Focus on defining scope, deposit or upfront payment, client approvals, milestone billing, final handoff, and payment links in one client-ready process.',
    dynamicKey: 'scope_payment_controls',
    dynamicDesc: 'List 3 controls for scope and payment workflow, such as deposit before kickoff, approval gates, and final payment before handoff.',
    sections: 'Include clear sections for: Workflow Goal, Scope Summary, Deposit or Upfront Payment, Approval Gates, Final Payment, Handoff, and Change Requests.',
  },
  'Deposit Request Email Template': {
    customInstructions: 'This is a deposit request email template. Focus on explaining the deposit, when work is scheduled, what the deposit covers, payment link placement, and what happens after payment.',
    dynamicKey: 'deposit_request_controls',
    dynamicDesc: 'List 3 controls for deposit requests, such as deposit amount, payment due before scheduling, and kickoff confirmation.',
    sections: 'Include clear sections for: Email Goal, Deposit Context, Template Email, Payment Link Placement, Kickoff Timing, and Next Step After Payment.',
  },
  'Milestone Approval Reminder Template': {
    customInstructions: 'This is a milestone approval reminder template. Focus on milestone deliverables, acceptance criteria, review deadline, payment gate, and clear next-step wording.',
    dynamicKey: 'milestone_approval_controls',
    dynamicDesc: 'List 3 controls for milestone approval, such as deliverable list, approval deadline, and next payment gate.',
    sections: 'Include clear sections for: Reminder Goal, Milestone Summary, Acceptance Criteria, Template Message, Approval Deadline, and Next Payment Step.',
  },
  'Pause Work Notice Template': {
    customInstructions: 'This is an overdue invoice pause work notice template. Focus on calm notice language, overdue invoice details, work pause timing, payment link, and restart steps after payment. Do not threaten legal action.',
    dynamicKey: 'pause_work_controls',
    dynamicDesc: 'List 3 controls for pausing work, such as overdue invoice reference, pause date, and restart condition after payment.',
    sections: 'Include clear sections for: Notice Goal, Invoice Context, Template Notice, Work Pause Timing, Payment Link Step, and Restart Confirmation.',
  },
  'Change Request Approval Email Template': {
    customInstructions: 'This is a change request approval email template. Focus on summarizing requested changes, added fee, timeline impact, approval before extra work, and a payment link for the added scope.',
    dynamicKey: 'change_request_controls',
    dynamicDesc: 'List 3 controls for change requests, such as written approval, added fee, and revised timeline.',
    sections: 'Include clear sections for: Email Goal, Change Summary, Added Fee, Timeline Impact, Template Email, and Approval/Payment Next Step.',
  },
  'Final Payment Before Handoff Email Template': {
    customInstructions: 'This is a final payment before handoff email template. Focus on approved deliverables, final invoice, payment link, what will be released after payment, and friendly closeout language.',
    dynamicKey: 'final_payment_controls',
    dynamicDesc: 'List 3 controls for final payment before handoff, such as approval confirmation, final invoice amount, and handoff condition.',
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

async function processBatch26() {
  console.log('Starting targeted 10/10 AI generation for Batch 26 weekly pages...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 26')
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

      for (const key of ['workflow_controls', 'payment_follow_up_controls', 'scope_reply_controls', 'revision_controls', 'handoff_controls', 'approval_reminder_controls', 'feedback_controls', 'discount_reply_controls', 'invoice_follow_up_controls', 'handoff_checklist_controls', 'scope_payment_controls', 'deposit_request_controls', 'milestone_approval_controls', 'pause_work_controls', 'change_request_controls', 'final_payment_controls']) {
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

processBatch26();
