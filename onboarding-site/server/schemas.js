// server/schemas.js
// Property type maps per database, used when creating/updating rows via the
// onboarding backend. Keys must match the Notion property names exactly.
// Reused verbatim from launchops-portal/server/schemas.js.
export const DB = {
  Projects: {
    titleKey: 'Client',
    props: {
      Client: 'title',
      Status: 'select',
      Industry: 'rich_text',
      'AI Persona': 'rich_text',
      KPIs: 'rich_text',
      'Dashboard URL': 'url',
      'Repo URL': 'url',
      'Kickoff Date': 'date',
      'Launch Date': 'date',
      Notes: 'rich_text',
    },
  },
  Roadmap: {
    titleKey: 'Milestone',
    props: {
      Milestone: 'title',
      Project: 'relation',
      Phase: 'select',
      Status: 'select',
      'Due Date': 'date',
      Notes: 'rich_text',
    },
  },
  'Build Assets': {
    titleKey: 'Asset',
    props: {
      Asset: 'title',
      Project: 'relation',
      'Asset Type': 'select',
      Content: 'rich_text',
      Link: 'url',
      Version: 'rich_text',
      Date: 'date',
    },
  },
  'Client Feedback': {
    titleKey: 'Feedback',
    props: {
      Feedback: 'title',
      Project: 'relation',
      Rating: 'number',
      'What Went Well': 'rich_text',
      'What Could Improve': 'rich_text',
      'Would Recommend': 'checkbox',
      Submitted: 'date',
      Status: 'select',
    },
  },
  Testimonials: {
    titleKey: 'Quote',
    props: {
      Quote: 'title',
      Project: 'relation',
      Client: 'rich_text',
      Rating: 'number',
      Source: 'rich_text',
      Approved: 'checkbox',
      Date: 'date',
    },
  },
  'Client Documents': {
    titleKey: 'Name',
    props: {
      Name: 'title',
      Client: 'relation',
      'Document Type': 'select',
      'Document Date': 'date',
      Amount: 'number',
      Status: 'select',
      'Paid Date': 'date',
      'Payment Method': 'select',
      File: 'files',
      Notes: 'rich_text',
    },
  },
};