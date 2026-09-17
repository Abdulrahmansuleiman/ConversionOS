export interface Project {
  id: string;
  title: string;
  Status: string | null;
  Industry: string | null;
  'AI Persona': string | null;
  KPIs: string | null;
  'Dashboard URL': string | null;
  'Repo URL': string | null;
  'Kickoff Date': string | null;
  'Launch Date': string | null;
  Notes: string | null;
}

export interface Milestone {
  id: string;
  title: string;
  Project: string[];
  Phase: string | null;
  Status: string | null;
  'Due Date': string | null;
  Notes: string | null;
}

export interface Asset {
  id: string;
  title: string;
  Project: string[];
  'Asset Type': string | null;
  Content: string | null;
  Link: string | null;
  Version: string | null;
  Date: string | null;
}

export interface Feedback {
  id: string;
  title: string;
  Project: string[];
  Rating: number | null;
  'What Went Well': string | null;
  'What Could Improve': string | null;
  'Would Recommend': boolean;
  Submitted: string | null;
  Status: string | null;
  /** Client's full name as submitted on the Notion form. */
  FullName: string | null;
  /** Business name submitted on the form — resolved to a project. */
  BusinessName: string | null;
  'Biggest Result So Far': string | null;
  Video: { name: string | null; url: string | null; type: string } | null;
  /** Resolved project: the Project relation, else matched from BusinessName. */
  projectId?: string | null;
  projectName?: string | null;
  createdTime?: string | null;
}

export interface Testimonial {
  id: string;
  title: string;
  Project: string[];
  Client: string | null;
  Rating: number | null;
  Source: string | null;
  Approved: boolean;
  Date: string | null;
  projectName?: string | null;
}

export interface Document {
  id: string;
  title: string;
  Client: string[];
  'Document Type': string | null;
  'Document Date': string | null;
  Amount: number | null;
  Status: string | null;
  'Paid Date': string | null;
  'Payment Method': string | null;
  File: { name: string | null; url: string | null; type: string }[];
  Notes: string | null;
  projectName?: string | null;
  file?: { name: string | null; url: string | null; type: string } | null;
}

export interface Overview {
  totalProjects: number;
  activeProjects: number;
  liveDashboards: number;
  feedbackCount: number;
  avgRating: number | null;
  statusBreakdown: Record<string, number>;
  launches: { title: string; launchDate: string; status: string | null; dashboardUrl: string | null }[];
  recentFeedback: { id: string; title: string; rating: number | null; submitted: string | null; projectId: string | null }[];
}

export interface ProjectDetail {
  project: Project;
  milestones: Milestone[];
  assets: Asset[];
  feedback: Feedback[];
}

export type View = 'overview' | 'projects' | 'documents' | 'feedback' | 'testimonials';