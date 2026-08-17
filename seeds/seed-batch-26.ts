import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const weeklyPages = [
  { slug: 'late-payment-follow-up-email-for-web-design-clients', job_title: 'Web Design Client Late Payment Follow-Up', keyword: 'late payment follow up email for web design clients', document_type: 'Late Payment Follow-Up Email Template' },
  { slug: 'scope-creep-reply-template-for-freelance-designers', job_title: 'Freelance Designer Scope Creep Reply', keyword: 'scope creep reply template for freelance designers', document_type: 'Scope Creep Reply Template' },
  { slug: 'extra-revision-response-template-for-video-editors', job_title: 'Video Editor Extra Revision Response', keyword: 'extra revision response template for video editors', document_type: 'Extra Revision Response Template' },
  { slug: 'final-file-handoff-email-template-for-logo-designers', job_title: 'Logo Designer Final File Handoff Email', keyword: 'final file handoff email template for logo designers', document_type: 'Final File Handoff Email Template' },
  { slug: 'client-approval-reminder-email-template-for-webflow-projects', job_title: 'Webflow Project Client Approval Reminder', keyword: 'client approval reminder email template for Webflow projects', document_type: 'Client Approval Reminder Email Template' },
  { slug: 'vague-feedback-reply-template-for-copywriters', job_title: 'Copywriter Vague Feedback Reply', keyword: 'vague feedback reply template for copywriters', document_type: 'Vague Feedback Reply Template' },
  { slug: 'discount-request-reply-template-for-freelancers', job_title: 'Freelancer Discount Request Reply', keyword: 'discount request reply template for freelancers', document_type: 'Discount Request Reply Template' },
  { slug: 'client-ghosted-invoice-follow-up-email-template', job_title: 'Client Ghosted Invoice Follow-Up', keyword: 'client ghosted invoice follow up email template', document_type: 'Invoice Follow-Up Email Template' },
  { slug: 'project-handoff-checklist-template-for-freelance-developers', job_title: 'Freelance Developer Project Handoff Checklist', keyword: 'project handoff checklist template for freelance developers', document_type: 'Project Handoff Checklist Template' },
  { slug: 'scope-and-payment-workflow-template-for-small-client-projects', job_title: 'Small Client Project Scope and Payment Workflow', keyword: 'scope and payment workflow template for small client projects', document_type: 'Scope and Payment Workflow Template' },
  { slug: 'deposit-request-email-template-for-freelance-projects', job_title: 'Freelance Project Deposit Request Email', keyword: 'deposit request email template for freelance projects', document_type: 'Deposit Request Email Template' },
  { slug: 'milestone-approval-reminder-template-for-consultants', job_title: 'Consultant Milestone Approval Reminder', keyword: 'milestone approval reminder template for consultants', document_type: 'Milestone Approval Reminder Template' },
  { slug: 'overdue-invoice-pause-work-notice-template', job_title: 'Overdue Invoice Pause Work Notice', keyword: 'overdue invoice pause work notice template', document_type: 'Pause Work Notice Template' },
  { slug: 'change-request-approval-email-template-for-freelancers', job_title: 'Freelancer Change Request Approval Email', keyword: 'change request approval email template for freelancers', document_type: 'Change Request Approval Email Template' },
  { slug: 'final-payment-before-handoff-email-template', job_title: 'Final Payment Before Handoff Email', keyword: 'final payment before handoff email template', document_type: 'Final Payment Before Handoff Email Template' },
];

async function seedBatch26() {
  console.log('Planting seeds for Batch 26 (Weekly 15 pages)...');

  const rowsToInsert = weeklyPages.map((page) => ({
    ...page,
    intent: 'transactional',
    batch_label: 'Batch 26',
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

seedBatch26();
