import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) throw new Error('Missing Supabase env variables.');

const supabase = createClient(supabaseUrl, supabaseKey);

const weeklyPages = [
  { slug: 'squarespace-designer-deposit-and-approval-agreement', job_title: 'Squarespace Designer', keyword: 'squarespace designer deposit and approval agreement template', document_type: 'Deposit and Approval Agreement' },
  { slug: 'gohighlevel-automation-consultant-milestone-payment-agreement', job_title: 'GoHighLevel Automation Consultant', keyword: 'gohighlevel automation consultant milestone payment agreement template', document_type: 'Milestone Payment Agreement' },
  { slug: 'kajabi-course-setup-specialist-payment-schedule-agreement', job_title: 'Kajabi Course Setup Specialist', keyword: 'kajabi course setup specialist payment schedule agreement template', document_type: 'Payment Schedule Agreement' },
  { slug: 'membership-site-developer-upfront-payment-contract', job_title: 'Membership Site Developer', keyword: 'membership site developer upfront payment contract template', document_type: 'Upfront Payment Contract' },
  { slug: 'sales-page-copywriter-deposit-and-approval-agreement', job_title: 'Sales Page Copywriter', keyword: 'sales page copywriter deposit and approval agreement template', document_type: 'Deposit and Approval Agreement' },
  { slug: 'brand-messaging-strategist-client-approval-agreement', job_title: 'Brand Messaging Strategist', keyword: 'brand messaging strategist client approval agreement template', document_type: 'Client Approval Agreement' },
  { slug: 'b2b-lead-generation-specialist-retainer-payment-agreement', job_title: 'B2B Lead Generation Specialist', keyword: 'b2b lead generation specialist retainer payment agreement template', document_type: 'Retainer Payment Agreement' },
  { slug: 'fractional-sales-consultant-retainer-payment-agreement', job_title: 'Fractional Sales Consultant', keyword: 'fractional sales consultant retainer payment agreement template', document_type: 'Retainer Payment Agreement' },
  { slug: 'productized-service-provider-upfront-payment-contract', job_title: 'Productized Service Provider', keyword: 'productized service provider upfront payment contract template', document_type: 'Upfront Payment Contract' },
  { slug: 'ai-workflow-consultant-change-request-payment-agreement', job_title: 'AI Workflow Consultant', keyword: 'ai workflow consultant change request payment agreement template', document_type: 'Change Request Payment Agreement' },
  { slug: 'notion-template-creator-deposit-agreement', job_title: 'Notion Template Creator', keyword: 'notion template creator deposit agreement template', document_type: 'Deposit Agreement' },
  { slug: 'newsletter-sponsorship-manager-content-approval-payment-contract', job_title: 'Newsletter Sponsorship Manager', keyword: 'newsletter sponsorship manager content approval payment contract template', document_type: 'Content Approval Contract' },
  { slug: 'press-release-writer-content-approval-payment-contract', job_title: 'Press Release Writer', keyword: 'press release writer content approval payment contract template', document_type: 'Content Approval Contract' },
  { slug: 'product-launch-consultant-milestone-approval-agreement', job_title: 'Product Launch Consultant', keyword: 'product launch consultant milestone approval agreement template', document_type: 'Milestone Approval Agreement' },
  { slug: 'shopify-conversion-audit-consultant-payment-schedule-agreement', job_title: 'Shopify Conversion Audit Consultant', keyword: 'shopify conversion audit consultant payment schedule agreement template', document_type: 'Payment Schedule Agreement' },
];

async function seedBatch24() {
  console.log('Planting seeds for Batch 24 (Weekly 15 pages)...');

  const rowsToInsert = weeklyPages.map((page) => ({
    ...page,
    intent: 'transactional',
    batch_label: 'Batch 24',
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

seedBatch24();

