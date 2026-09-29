export const tradeWorkflows: Record<string, { name: string; intro: string; checks: string[]; change: string }> = {
  'mobile-mechanic-contract-template': {
    name: 'Mobile mechanic',
    intro: 'Put the diagnostic visit, approved repairs, parts and call-out charges in one agreement before the work starts.',
    checks: ['Vehicle and service location', 'Diagnostic fee and approved labor', 'Parts authorization and additional repairs'],
    change: 'Found another repair? Record the added parts, labor and revised total for the customer to review.',
  },
  'gutter-installer-contract-template': {
    name: 'Gutter installation',
    intro: 'Agree on the measured runs, materials, downspouts and site access before scheduling installation.',
    checks: ['Linear footage, profile and material', 'Removal, disposal and site access', 'Deposit, installation date and balance'],
    change: 'A longer run or extra downspout changes the job. Document the new scope and price before proceeding.',
  },
  'parking-lot-striper-contract-template': {
    name: 'Parking lot striping',
    intro: 'Outline the layout, markings, surface preparation and access window in a customer-ready agreement.',
    checks: ['Stall count, layout and approved markings', 'Surface preparation and paint specification', 'Weather, access window and payment stages'],
    change: 'An updated layout or additional markings can be recorded as a change order with a revised price.',
  },
};
