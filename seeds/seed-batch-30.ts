import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const weeklyPages = [
  { slug: 'polite-overdue-invoice-reminder-email-template', job_title: 'Polite Overdue Invoice Reminder', keyword: 'polite overdue invoice reminder email template', document_type: 'Polite Overdue Invoice Reminder Email Template' },
  { slug: 'invoice-follow-up-email-client-says-they-will-pay-later', job_title: 'Client Says They Will Pay Later Invoice Follow-Up', keyword: 'invoice follow up email client says they will pay later', document_type: 'Pay Later Invoice Follow-Up Email Template' },
  { slug: 'final-files-delivery-email-after-payment-received', job_title: 'Final Files Delivery After Payment Received', keyword: 'final files delivery email after payment received', document_type: 'Final Files Delivery Email Template' },
  { slug: 'partial-payment-received-balance-reminder-email-template', job_title: 'Partial Payment Received Balance Reminder', keyword: 'partial payment received balance reminder email template', document_type: 'Balance Reminder Email Template' },
  { slug: 'client-approval-email-for-copywriting-project', job_title: 'Copywriting Project Client Approval Email', keyword: 'client approval email for copywriting project', document_type: 'Copywriting Approval Email Template' },
  { slug: 'client-feedback-deadline-reminder-email-template', job_title: 'Client Feedback Deadline Reminder', keyword: 'client feedback deadline reminder email template', document_type: 'Feedback Deadline Reminder Email Template' },
  { slug: 'vague-feedback-reply-for-copywriters', job_title: 'Copywriter Vague Feedback Reply', keyword: 'vague feedback reply for copywriters', document_type: 'Copywriter Feedback Clarification Reply Template' },
  { slug: 'scope-creep-reply-for-copywriters', job_title: 'Copywriter Scope Creep Reply', keyword: 'scope creep reply for copywriters', document_type: 'Copywriter Scope Creep Reply Template' },
  { slug: 'rush-request-extra-fee-reply-template', job_title: 'Rush Request Extra Fee Reply', keyword: 'rush request extra fee reply template', document_type: 'Rush Fee Reply Template' },
  { slug: 'client-asks-for-free-extra-work-reply-template', job_title: 'Client Asks for Free Extra Work Reply', keyword: 'client asks for free extra work reply template', document_type: 'Free Extra Work Reply Template' },
  { slug: 'client-delays-content-request-email-template', job_title: 'Client Delays Content Request Email', keyword: 'client delays content request email template', document_type: 'Delayed Client Content Request Email Template' },
  { slug: 'website-content-missing-before-launch-email', job_title: 'Website Content Missing Before Launch Email', keyword: 'website content missing before launch email', document_type: 'Website Launch Content Reminder Email Template' },
  { slug: 'project-closeout-email-with-final-invoice-template', job_title: 'Project Closeout With Final Invoice', keyword: 'project closeout email with final invoice template', document_type: 'Project Closeout Final Invoice Email Template' },
  { slug: 'payment-link-follow-up-after-verbal-approval', job_title: 'Payment Link Follow-Up After Verbal Approval', keyword: 'payment link follow up after verbal approval', document_type: 'Payment Link Follow-Up Email Template' },
  { slug: 'final-handoff-checklist-for-copywriters', job_title: 'Copywriter Final Handoff Checklist', keyword: 'final handoff checklist for copywriters', document_type: 'Copywriter Final Handoff Checklist Template' },
];

async function seedBatch30() {
  console.log('Planting seeds for Batch 30 (Weekly 15 pages)...');

  const rowsToInsert = weeklyPages.map((page) => ({
    ...page,
    intent: 'transactional',
    batch_label: 'Batch 30',
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

seedBatch30();
