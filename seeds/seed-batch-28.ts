import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const weeklyPages = [
  { slug: 'late-payment-follow-up-email-after-missed-due-date', job_title: 'Missed Due Date Late Payment Follow-Up', keyword: 'late payment follow up email after missed due date', document_type: 'Late Payment Follow-Up Email Template' },
  { slug: 'client-ghosted-after-invoice-follow-up-email-template', job_title: 'Client Ghosted After Invoice Follow-Up', keyword: 'client ghosted after invoice follow up email template', document_type: 'Ghosted Invoice Follow-Up Email Template' },
  { slug: 'overdue-deposit-reminder-email-before-project-kickoff', job_title: 'Overdue Deposit Reminder Before Kickoff', keyword: 'overdue deposit reminder email before project kickoff', document_type: 'Deposit Reminder Email Template' },
  { slug: 'past-due-invoice-payment-plan-reply-template', job_title: 'Past Due Invoice Payment Plan Reply', keyword: 'past due invoice payment plan reply template', document_type: 'Payment Plan Reply Template' },
  { slug: 'final-file-handoff-email-with-payment-link-template', job_title: 'Final File Handoff With Payment Link', keyword: 'final file handoff email with payment link template', document_type: 'Final File Handoff Payment Link Email Template' },
  { slug: 'client-approval-reminder-before-final-invoice-template', job_title: 'Client Approval Reminder Before Final Invoice', keyword: 'client approval reminder before final invoice template', document_type: 'Final Invoice Approval Reminder Template' },
  { slug: 'vague-feedback-clarification-reply-for-logo-designers', job_title: 'Logo Designer Vague Feedback Clarification Reply', keyword: 'vague feedback clarification reply for logo designers', document_type: 'Logo Feedback Clarification Reply Template' },
  { slug: 'extra-revision-request-response-for-web-designers', job_title: 'Web Designer Extra Revision Request Response', keyword: 'extra revision request response for web designers', document_type: 'Extra Revision Response Template' },
  { slug: 'client-asks-for-lower-rate-reply-template', job_title: 'Client Asks for Lower Rate Reply', keyword: 'client asks for lower rate reply template', document_type: 'Lower Rate Reply Template' },
  { slug: 'scope-creep-reply-after-project-kickoff-template', job_title: 'Scope Creep Reply After Project Kickoff', keyword: 'scope creep reply after project kickoff template', document_type: 'Project Kickoff Scope Creep Reply Template' },
  { slug: 'source-files-before-payment-reply-template', job_title: 'Source Files Before Payment Reply', keyword: 'source files before payment reply template', document_type: 'Source Files Before Payment Reply Template' },
  { slug: 'web-designer-project-handoff-checklist-template', job_title: 'Web Designer Project Handoff Checklist', keyword: 'web designer project handoff checklist template', document_type: 'Web Designer Project Handoff Checklist Template' },
  { slug: 'project-scope-confirmation-email-before-deposit', job_title: 'Project Scope Confirmation Before Deposit', keyword: 'project scope confirmation email before deposit', document_type: 'Scope Confirmation Before Deposit Email Template' },
  { slug: 'change-request-pricing-approval-email-for-web-projects', job_title: 'Web Project Change Request Pricing Approval', keyword: 'change request pricing approval email for web projects', document_type: 'Change Request Pricing Approval Email Template' },
  { slug: 'client-delay-follow-up-email-before-revised-timeline', job_title: 'Client Delay Follow-Up Before Revised Timeline', keyword: 'client delay follow up email before revised timeline', document_type: 'Client Delay Timeline Follow-Up Email Template' },
];

async function seedBatch28() {
  console.log('Planting seeds for Batch 28 (Weekly 15 pages)...');

  const rowsToInsert = weeklyPages.map((page) => ({
    ...page,
    intent: 'transactional',
    batch_label: 'Batch 28',
  }));

  const { data, error } = await supabase
    .from('seo_pages')
    .upsert(rowsToInsert, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error('Error inserting seeds:', error);
    process.exitCode = 1;
  } else {
    console.log('Successfully planted ' + data.length + ' SEO pages.');
  }
}

seedBatch28();
