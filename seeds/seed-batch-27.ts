import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const weeklyPages = [
  { slug: 'polite-overdue-invoice-reminder-email-for-copywriters', job_title: 'Copywriter Overdue Invoice Reminder', keyword: 'polite overdue invoice reminder email for copywriters', document_type: 'Overdue Invoice Reminder Email Template' },
  { slug: 'second-late-payment-follow-up-email-for-freelancers', job_title: 'Freelancer Second Late Payment Follow-Up', keyword: 'second late payment follow up email for freelancers', document_type: 'Second Late Payment Follow-Up Email Template' },
  { slug: 'final-overdue-invoice-check-in-email-template', job_title: 'Final Overdue Invoice Check-In', keyword: 'final overdue invoice check in email template', document_type: 'Final Overdue Invoice Check-In Email Template' },
  { slug: 'payment-link-reminder-email-template-for-consultants', job_title: 'Consultant Payment Link Reminder', keyword: 'payment link reminder email template for consultants', document_type: 'Payment Link Reminder Email Template' },
  { slug: 'client-approval-chaser-email-template-for-brand-designers', job_title: 'Brand Designer Client Approval Chaser', keyword: 'client approval chaser email template for brand designers', document_type: 'Client Approval Chaser Email Template' },
  { slug: 'website-feedback-clarification-reply-template', job_title: 'Website Feedback Clarification Reply', keyword: 'website feedback clarification reply template', document_type: 'Feedback Clarification Reply Template' },
  { slug: 'can-you-just-add-this-scope-creep-reply-template', job_title: 'Can You Just Add This Scope Creep Reply', keyword: 'can you just add this scope creep reply template', document_type: 'Scope Creep Reply Template' },
  { slug: 'unpaid-extra-work-response-template-for-freelancers', job_title: 'Freelancer Unpaid Extra Work Response', keyword: 'unpaid extra work response template for freelancers', document_type: 'Unpaid Extra Work Response Template' },
  { slug: 'rush-request-fee-reply-template-for-freelancers', job_title: 'Freelancer Rush Request Fee Reply', keyword: 'rush request fee reply template for freelancers', document_type: 'Rush Request Fee Reply Template' },
  { slug: 'budget-too-low-reply-template-for-freelancers', job_title: 'Freelancer Budget Too Low Reply', keyword: 'budget too low reply template for freelancers', document_type: 'Budget Too Low Reply Template' },
  { slug: 'project-kickoff-deposit-paid-confirmation-email-template', job_title: 'Project Kickoff Deposit Paid Confirmation', keyword: 'project kickoff deposit paid confirmation email template', document_type: 'Deposit Paid Confirmation Email Template' },
  { slug: 'revision-round-complete-approval-email-template', job_title: 'Revision Round Complete Approval', keyword: 'revision round complete approval email template', document_type: 'Revision Round Approval Email Template' },
  { slug: 'client-delay-project-timeline-reset-email-template', job_title: 'Client Delay Project Timeline Reset', keyword: 'client delay project timeline reset email template', document_type: 'Project Timeline Reset Email Template' },
  { slug: 'social-media-manager-project-handoff-checklist-template', job_title: 'Social Media Manager Project Handoff Checklist', keyword: 'social media manager project handoff checklist template', document_type: 'Project Handoff Checklist Template' },
  { slug: 'final-files-ready-after-payment-email-template', job_title: 'Final Files Ready After Payment', keyword: 'final files ready after payment email template', document_type: 'Final Files After Payment Email Template' },
];

async function seedBatch27() {
  console.log('Planting seeds for Batch 27 (Weekly 15 pages)...');

  const rowsToInsert = weeklyPages.map((page) => ({
    ...page,
    intent: 'transactional',
    batch_label: 'Batch 27',
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

seedBatch27();
