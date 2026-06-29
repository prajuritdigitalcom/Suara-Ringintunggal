export interface Program {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  location: string;
  image_url: string;
  votes_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  program_id: string;
  voter_name: string;
  voter_rt: string;
  ip_address: string;
  created_at: string;
  program_title?: string;
}

export interface Captcha {
  challengeId: string;
  question: string;
}

export interface AdminStats {
  totalPrograms: number;
  totalVotes: number;
  totalParticipants: number;
  popularProgram: string;
  votesToday: number;
  votesThisWeek: number;
  rtDistribution: Record<string, number>;
  programDistribution: Record<string, { title: string; votes: number }>;
  dailyGrowth: { date: string; count: number }[];
}

export type ViewType = 'home' | 'detail' | 'admin-login' | 'admin-dashboard';
