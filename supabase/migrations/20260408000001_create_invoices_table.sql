-- Create invoices table
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  status text default 'draft',
  due_date timestamp with time zone,
  amount numeric,
  client_data jsonb,
  project_data jsonb,
  dunning_emails_sent jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table invoices enable row level security;

-- Create indexes for common queries
create index if not exists idx_invoices_status on invoices(status);
create index if not exists idx_invoices_due_date on invoices(due_date);
create index if not exists idx_invoices_created_at on invoices(created_at);
