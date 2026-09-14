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
  toolLinkRequired?: boolean;
};

const defaultInstructions: Instructions = {
  customInstructions: 'This is a freelancer client communication and project admin template. Focus on specific wording, client responsibilities, approval records, payment timing, next steps, and a calm professional tone. Do not make legal guarantees or imply that payment can be forced.',
  dynamicKey: 'workflow_controls',
  dynamicDesc: 'List 3 controls that keep the workflow clear, such as written approval, payment due date, and a documented next step.',
  sections: 'Include clear sections for: Message Goal, When to Send It, Client Context to Add, Template Message, Follow-Up Timing, and Next Workflow Step.',
  toolLinkRequired: true,
};

const instructionMap: Record<string, Instructions> = {
  'Polite Overdue Invoice Reminder Email Template': {
    customInstructions: 'This is a polite overdue invoice reminder for a freelancer who wants to follow up without sounding harsh. Focus on invoice number, original due date, payment link, a friendly assumption of oversight, and a clear requested payment date.',
    dynamicKey: 'polite_invoice_controls',
    dynamicDesc: 'List 3 controls for a polite overdue invoice reminder, such as invoice number, due date, and direct payment link.',
    sections: 'Include clear sections for: Email Goal, Overdue Context, Invoice Details to Add, Template Email, Payment Link Placement, and Next Follow-Up Date.',
    toolLinkRequired: true,
  },
  'Pay Later Invoice Follow-Up Email Template': {
    customInstructions: 'This is a follow-up after a client says they will pay later. Focus on documenting the promised payment date, confirming amount due, including a payment link, and asking for a clear update if the date changes.',
    dynamicKey: 'pay_later_controls',
    dynamicDesc: 'List 3 controls for pay-later invoice follow-ups, such as promised payment date, amount due, and written update request.',
    sections: 'Include clear sections for: Email Goal, Pay-Later Context, Template Email, Payment Date Confirmation, Payment Link Placement, and Next Admin Step.',
    toolLinkRequired: true,
  },
  'Final Files Delivery Email Template': {
    customInstructions: 'This is a final files delivery email after payment is received. Focus on confirming payment, listing delivered files, explaining access or download links, naming any archive date, and closing the project professionally.',
    dynamicKey: 'delivery_controls',
    dynamicDesc: 'List 3 controls for final file delivery after payment, such as file inventory, access link, and archive date.',
    sections: 'Include clear sections for: Email Goal, Payment Confirmation, File Inventory, Template Email, Access Instructions, and Closeout Step.',
    toolLinkRequired: true,
  },
  'Balance Reminder Email Template': {
    customInstructions: 'This is a balance reminder after a partial payment has been received. Focus on thanking the client for the partial payment, confirming remaining balance, payment link, due date, and what happens next in the workflow.',
    dynamicKey: 'balance_controls',
    dynamicDesc: 'List 3 controls for partial payment balance reminders, such as amount paid, balance due, and due date.',
    sections: 'Include clear sections for: Email Goal, Partial Payment Context, Balance Details, Template Email, Payment Link Placement, and Next Workflow Step.',
    toolLinkRequired: true,
  },
  'Copywriting Approval Email Template': {
    customInstructions: 'This is a client approval email for a copywriting project. Focus on approval of draft copy, revision status, exact pages or assets included, approval deadline, final invoice or publishing handoff, and a clear approve-or-feedback request.',
    dynamicKey: 'copy_approval_controls',
    dynamicDesc: 'List 3 controls for copywriting approvals, such as asset list, approval deadline, and final handoff trigger.',
    sections: 'Include clear sections for: Email Goal, Copy Assets Submitted, Approval Criteria, Template Email, Final Invoice or Handoff Step, and Follow-Up Timing.',
    toolLinkRequired: true,
  },
  'Feedback Deadline Reminder Email Template': {
    customInstructions: 'This is a reminder before a client feedback deadline. Focus on the review item, deadline, how feedback should be submitted, what happens if no feedback arrives, and how the timeline may move.',
    dynamicKey: 'feedback_deadline_controls',
    dynamicDesc: 'List 3 controls for feedback deadline reminders, such as review link, deadline, and timeline impact.',
    sections: 'Include clear sections for: Email Goal, Review Context, Feedback Instructions, Template Email, Deadline and Timeline Impact, and Follow-Up Step.',
    toolLinkRequired: true,
  },
  'Copywriter Feedback Clarification Reply Template': {
    customInstructions: 'This is a reply for vague copywriting feedback. Focus on turning subjective comments into specific direction about audience, tone, examples, sections to change, and revision priority.',
    dynamicKey: 'copy_feedback_controls',
    dynamicDesc: 'List 3 controls for vague copy feedback, such as specific section references, tone examples, and revision round boundary.',
    sections: 'Include clear sections for: Reply Goal, Vague Feedback Context, Clarifying Questions, Template Reply, Revision Boundary, and Approval Next Step.',
    toolLinkRequired: true,
  },
  'Copywriter Scope Creep Reply Template': {
    customInstructions: 'This is a scope creep reply for copywriters. Focus on extra pages, new messaging angles, SEO rewrites, added email sequences, research requests, and how to move additions into paid change approval.',
    dynamicKey: 'copy_scope_controls',
    dynamicDesc: 'List 3 controls for copywriting scope creep, such as approved asset count, added copy item, and paid change approval.',
    sections: 'Include clear sections for: Reply Goal, Approved Scope Reference, New Request Summary, Template Reply, Paid Add-On Option, and Approval Step.',
    toolLinkRequired: true,
  },
  'Rush Fee Reply Template': {
    customInstructions: 'This is a reply when a client asks for rush turnaround. Focus on acknowledging urgency, explaining schedule impact, naming rush fee and deadline, and requiring written approval before shifting priorities.',
    dynamicKey: 'rush_fee_controls',
    dynamicDesc: 'List 3 controls for rush fee replies, such as rush deadline, added fee, and written approval before work starts.',
    sections: 'Include clear sections for: Reply Goal, Rush Request Context, Template Reply, Rush Fee and Timeline, Trade-Offs, and Approval Step.',
    toolLinkRequired: true,
  },
  'Free Extra Work Reply Template': {
    customInstructions: 'This is a reply when a client asks for free extra work. Focus on validating the request, separating it from the approved scope, offering a paid option or reduced alternative, and staying friendly but firm.',
    dynamicKey: 'free_extra_controls',
    dynamicDesc: 'List 3 controls for free extra work replies, such as scope reference, paid option, and decision deadline.',
    sections: 'Include clear sections for: Reply Goal, Approved Scope Reference, Extra Request Summary, Template Reply, Paid or Reduced Option, and Decision Step.',
    toolLinkRequired: true,
  },
  'Delayed Client Content Request Email Template': {
    customInstructions: 'This is an email for when client-supplied content is delayed. Focus on the missing content list, original due date, upload instructions, timeline impact, and revised schedule confirmation.',
    dynamicKey: 'delayed_content_controls',
    dynamicDesc: 'List 3 controls for delayed client content requests, such as missing item list, upload location, and revised timeline.',
    sections: 'Include clear sections for: Email Goal, Missing Content List, Original Due Date, Template Email, Upload Instructions, and Revised Timeline Step.',
    toolLinkRequired: true,
  },
  'Website Launch Content Reminder Email Template': {
    customInstructions: 'This is an email when website content is missing before launch. Focus on exact missing pages, images, approvals, launch date impact, temporary placeholder options, and client confirmation.',
    dynamicKey: 'launch_content_controls',
    dynamicDesc: 'List 3 controls for missing launch content, such as page list, launch impact, and placeholder approval.',
    sections: 'Include clear sections for: Email Goal, Launch Context, Missing Content Checklist, Template Email, Launch Impact, and Client Decision Step.',
    toolLinkRequired: true,
  },
  'Project Closeout Final Invoice Email Template': {
    customInstructions: 'This is a project closeout email with a final invoice. Focus on summarizing completed work, linking the invoice, confirming what happens after payment, asking for final questions, and closing the project neatly.',
    dynamicKey: 'closeout_controls',
    dynamicDesc: 'List 3 controls for project closeout invoices, such as completed work summary, invoice link, and post-payment handoff step.',
    sections: 'Include clear sections for: Email Goal, Completed Work Summary, Final Invoice Details, Template Email, Handoff After Payment, and Closeout Note.',
    toolLinkRequired: true,
  },
  'Payment Link Follow-Up Email Template': {
    customInstructions: 'This is a payment link follow-up after verbal approval. Focus on turning verbal approval into a written record, restating the approved work or milestone, adding the payment link, and confirming the next step after payment.',
    dynamicKey: 'payment_link_controls',
    dynamicDesc: 'List 3 controls for payment link follow-ups after verbal approval, such as approval summary, payment link, and next work trigger.',
    sections: 'Include clear sections for: Email Goal, Verbal Approval Context, Approval Summary, Template Email, Payment Link Placement, and Next Workflow Step.',
    toolLinkRequired: true,
  },
  'Copywriter Final Handoff Checklist Template': {
    customInstructions: 'This is a final handoff checklist for copywriters. Focus on final copy docs, usage notes, SEO details, content ownership handoff wording, approval record, final invoice status, and post-handoff edit boundaries.',
    dynamicKey: 'copy_handoff_controls',
    dynamicDesc: 'List 3 controls for copywriter handoff, such as final file inventory, approval record, and final payment confirmation.',
    sections: 'Include clear sections for: Handoff Goal, Final Copy Inventory, Usage and SEO Notes, Client Approval, Final Payment Check, and Post-Handoff Edit Boundary.',
    toolLinkRequired: false,
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

async function processBatch30() {
  console.log('Starting targeted AI generation for Batch 30 weekly pages...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 30')
    .is('content', null);

  if (error || !rows) {
    console.error('DB Error:', error);
    process.exitCode = 1;
    return;
  }

  for (const row of rows) {
    try {
      console.log('Writing: ' + row.job_title + ' ' + row.document_type + '...');

      const { customInstructions, dynamicKey, dynamicDesc, sections, toolLinkRequired } = instructionMap[row.document_type] || defaultInstructions;
      const toolLinkLine = toolLinkRequired
        ? 'Include a contextual internal link to <a href="/tools/client-message-generator">the free Client Reply Tool</a> in content.'
        : 'When useful, mention that related client messages can be drafted with <a href="/tools/client-message-generator">the free Client Reply Tool</a>.';

      const prompt = [
        'You are an expert freelance client communication strategist and project admin coach.',
        'Generate content for a "' + row.job_title + ' ' + row.document_type + '" page for MicroFreelanceHub.',
        '',
        'POSITIONING RULES:',
        '- MicroFreelanceHub helps freelancers combine client messages, scope clarity, approvals, deposits, payment links, and final handoff into one workflow.',
        '- Emphasize practical communication, approval records, payment links, deposit requests, final file handoff, and client-ready next steps.',
        '- ' + toolLinkLine,
        '- Do not describe the workflow as escrow or imply regulated escrow services.',
        '- Avoid legal overclaims. Do not promise legal protection, guaranteed payment, enforceability, liability limits, lawsuit prevention, or forced payment.',
        '- Avoid threatening language. Keep the tone firm, calm, and commercially realistic.',
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
        'content must be clean HTML using <p>, <h3>, <ul>, <li>, and <a> only, with no html/body tags. ' + sections,
      ].join('\n');

      const { text } = await generateText({ model, prompt });
      const json = parseJson(text);

      for (const key of [
        'workflow_controls',
        'polite_invoice_controls',
        'pay_later_controls',
        'delivery_controls',
        'balance_controls',
        'copy_approval_controls',
        'feedback_deadline_controls',
        'copy_feedback_controls',
        'copy_scope_controls',
        'rush_fee_controls',
        'free_extra_controls',
        'delayed_content_controls',
        'launch_content_controls',
        'closeout_controls',
        'payment_link_controls',
        'copy_handoff_controls',
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

processBatch30();
