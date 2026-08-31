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
  'Late Payment Follow-Up Email Template': {
    customInstructions: 'This is a late payment follow-up email for the first missed due date. Focus on invoice number, original due date, payment link, a friendly assumption of oversight, and a clear next check-in without threats.',
    dynamicKey: 'late_payment_controls',
    dynamicDesc: 'List 3 controls for a missed due date follow-up, such as invoice number, due date, and direct payment link.',
    sections: 'Include clear sections for: Email Goal, When to Send It, Invoice Details to Add, Template Email, Payment Link Placement, and Next Follow-Up Date.',
    toolLinkRequired: true,
  },
  'Ghosted Invoice Follow-Up Email Template': {
    customInstructions: 'This is a follow-up email when a client has stopped responding after receiving an invoice. Focus on a calm check-in, restating the invoice, requesting a status update or payment date, and keeping a written record.',
    dynamicKey: 'ghosted_invoice_controls',
    dynamicDesc: 'List 3 controls for ghosted invoice follow-ups, such as prior send date, payment date request, and written status request.',
    sections: 'Include clear sections for: Email Goal, Silence Context, Template Email, Payment Date Request, Record-Keeping Note, and Next Admin Step.',
    toolLinkRequired: true,
  },
  'Deposit Reminder Email Template': {
    customInstructions: 'This is a deposit reminder before project kickoff. Focus on confirming that kickoff is pending, linking the deposit payment step, restating what the deposit unlocks, and avoiding pressure tactics.',
    dynamicKey: 'deposit_reminder_controls',
    dynamicDesc: 'List 3 controls for deposit reminders, such as kickoff date, deposit amount, and what starts after payment.',
    sections: 'Include clear sections for: Email Goal, Kickoff Context, Deposit Details, Template Email, What Starts After Payment, and Calendar Next Step.',
    toolLinkRequired: true,
  },
  'Payment Plan Reply Template': {
    customInstructions: 'This is a reply when a client asks for a payment plan on a past due invoice. Focus on documenting agreed dates, partial payment amounts, payment links, and how project handoff or future work changes until payments are current.',
    dynamicKey: 'payment_plan_controls',
    dynamicDesc: 'List 3 controls for payment plan replies, such as installment dates, payment links, and paused future work.',
    sections: 'Include clear sections for: Reply Goal, Invoice Context, Template Reply, Payment Plan Terms, Work/Handoff Boundary, and Confirmation Step.',
    toolLinkRequired: true,
  },
  'Final File Handoff Payment Link Email Template': {
    customInstructions: 'This is a final file handoff email with a payment link. Focus on approved deliverables, final invoice amount, payment link placement, what files will be delivered after payment, and a friendly closeout tone.',
    dynamicKey: 'handoff_payment_controls',
    dynamicDesc: 'List 3 controls for final file payment handoff, such as approved version, final balance, and delivery method after payment.',
    sections: 'Include clear sections for: Email Goal, Approval Context, Final Invoice Details, Template Email, Handoff After Payment, and Closeout Step.',
    toolLinkRequired: true,
  },
  'Final Invoice Approval Reminder Template': {
    customInstructions: 'This is a reminder asking for client approval before sending or collecting the final invoice. Focus on approval criteria, final review deadline, what has been completed, and the final invoice or handoff step.',
    dynamicKey: 'final_approval_controls',
    dynamicDesc: 'List 3 controls for final approval reminders, such as approval deadline, completed deliverables, and final invoice trigger.',
    sections: 'Include clear sections for: Reminder Goal, Completed Work Summary, Approval Criteria, Template Email, Final Invoice Step, and Follow-Up Timing.',
    toolLinkRequired: true,
  },
  'Logo Feedback Clarification Reply Template': {
    customInstructions: 'This is a reply for vague logo design feedback. Focus on translating subjective comments into specific direction, asking focused questions, using references, and keeping revision rounds bounded.',
    dynamicKey: 'feedback_controls',
    dynamicDesc: 'List 3 controls for vague logo feedback, such as examples requested, exact element reference, and revision round boundary.',
    sections: 'Include clear sections for: Reply Goal, Vague Feedback Context, Clarifying Questions, Template Reply, Revision Boundary, and Approval Next Step.',
    toolLinkRequired: true,
  },
  'Extra Revision Response Template': {
    customInstructions: 'This is a response when a web design client asks for another revision after included rounds are used. Focus on acknowledging the ask, naming completed revision rounds, offering a paid revision option, and asking for approval before continuing.',
    dynamicKey: 'extra_revision_controls',
    dynamicDesc: 'List 3 controls for extra revision requests, such as used revision count, added fee, and approval before work starts.',
    sections: 'Include clear sections for: Reply Goal, Revision History, Template Reply, Paid Revision Option, Timeline Impact, and Approval Step.',
    toolLinkRequired: true,
  },
  'Lower Rate Reply Template': {
    customInstructions: 'This is a reply when a client asks for a lower rate. Focus on preserving price boundaries, offering a reduced-scope option, using a deposit or payment schedule where useful, and giving a clear choice without sounding defensive.',
    dynamicKey: 'rate_boundary_controls',
    dynamicDesc: 'List 3 controls for lower rate replies, such as reduced scope, retained rate, and decision deadline.',
    sections: 'Include clear sections for: Reply Goal, Pricing Context, Template Reply, Reduced Scope Option, Payment Schedule Option, and Decision Deadline.',
    toolLinkRequired: true,
  },
  'Project Kickoff Scope Creep Reply Template': {
    customInstructions: 'This is a reply when scope creep appears after project kickoff. Focus on referencing the approved kickoff scope, identifying the new request, offering a change request, and confirming timeline or fee impact.',
    dynamicKey: 'kickoff_scope_controls',
    dynamicDesc: 'List 3 controls for kickoff scope creep, such as approved scope reference, change request price, and revised timeline.',
    sections: 'Include clear sections for: Reply Goal, Approved Scope Reference, New Request Summary, Template Reply, Change Request Option, and Approval Next Step.',
    toolLinkRequired: true,
  },
  'Source Files Before Payment Reply Template': {
    customInstructions: 'This is a reply when a client asks for source files before payment is complete. Focus on approved final files, outstanding balance, payment link, handoff timing, and a polite explanation of the normal delivery workflow.',
    dynamicKey: 'source_file_controls',
    dynamicDesc: 'List 3 controls for source file handoff, such as outstanding balance, file list, and delivery timing after payment.',
    sections: 'Include clear sections for: Reply Goal, File Request Context, Balance/Invoice Details, Template Reply, Handoff Timing, and Closeout Step.',
    toolLinkRequired: true,
  },
  'Web Designer Project Handoff Checklist Template': {
    customInstructions: 'This is a web designer project handoff checklist. Focus on final site access, asset files, CMS/editor permissions, DNS or hosting notes, final approval, final invoice status, and post-handoff support boundaries.',
    dynamicKey: 'web_handoff_controls',
    dynamicDesc: 'List 3 controls for web design handoff, such as access transfer, asset inventory, and final approval/payment confirmation.',
    sections: 'Include clear sections for: Handoff Goal, Deliverables Checklist, Website Access, Launch Notes, Client Approval, Final Payment Check, and Post-Handoff Support.',
    toolLinkRequired: false,
  },
  'Scope Confirmation Before Deposit Email Template': {
    customInstructions: 'This is an email confirming project scope before requesting the deposit. Focus on summarizing deliverables, exclusions, timeline, deposit amount, payment link, and asking the client to confirm before kickoff.',
    dynamicKey: 'scope_confirmation_controls',
    dynamicDesc: 'List 3 controls for scope confirmation before deposit, such as deliverables, exclusions, and deposit link.',
    sections: 'Include clear sections for: Email Goal, Scope Summary, Out-of-Scope Notes, Template Email, Deposit Link Step, and Kickoff Confirmation.',
    toolLinkRequired: true,
  },
  'Change Request Pricing Approval Email Template': {
    customInstructions: 'This is an email asking a web project client to approve change request pricing. Focus on describing the requested change, separating it from the original scope, listing added cost, revised timing, and requiring written approval before work starts.',
    dynamicKey: 'change_pricing_controls',
    dynamicDesc: 'List 3 controls for change request pricing approval, such as original scope reference, added cost, and written approval.',
    sections: 'Include clear sections for: Email Goal, Original Scope Reference, Change Request Summary, Added Pricing, Revised Timeline, and Approval Step.',
    toolLinkRequired: true,
  },
  'Client Delay Timeline Follow-Up Email Template': {
    customInstructions: 'This is a follow-up when a client delay may require a revised timeline. Focus on the missing input or approval, original date, proposed revised dates, and asking the client to confirm the new schedule.',
    dynamicKey: 'delay_timeline_controls',
    dynamicDesc: 'List 3 controls for client delay timeline follow-up, such as missing input, revised milestone dates, and approval confirmation.',
    sections: 'Include clear sections for: Email Goal, Delay Context, Template Email, Revised Timeline, Client Inputs Needed, and Confirmation Step.',
    toolLinkRequired: true,
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

async function processBatch28() {
  console.log('Starting targeted AI generation for Batch 28 weekly pages...');

  const { data: rows, error } = await supabase
    .from('seo_pages')
    .select('id, job_title, slug, document_type')
    .eq('batch_label', 'Batch 28')
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
        'late_payment_controls',
        'ghosted_invoice_controls',
        'deposit_reminder_controls',
        'payment_plan_controls',
        'handoff_payment_controls',
        'final_approval_controls',
        'feedback_controls',
        'extra_revision_controls',
        'rate_boundary_controls',
        'kickoff_scope_controls',
        'source_file_controls',
        'web_handoff_controls',
        'scope_confirmation_controls',
        'change_pricing_controls',
        'delay_timeline_controls',
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

processBatch28();
