// Dashboard类型定义

export interface DashboardStats {
  totalProjects: number;
  totalDemands: number;
  pendingBugs: number;
  riskProjects: number;
}

export interface ProjectHealth {
  id: number;
  name: string;
  healthScore: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
  progress: number;
  pendingBugs: number;
}

export interface DashboardOverview {
  stats: DashboardStats;
  projects: ProjectHealth[];
}

export interface Project {
  id: number;
  name: string;
  yunxiaoProjectId?: string;
  feishuChatId?: string;
  githubRepo?: string;
  status: string;
  healthScore: number;
  config: any;
  createdAt: string;
  updatedAt: string;
  _count?: {
    demands: number;
    bugs: number;
  };
}

export interface Demand {
  id: number;
  projectId: number;
  title: string;
  status: 'todo' | 'doing' | 'done';
  priority?: string;
  assignee?: string;
  progress: number;
}

export interface Bug {
  id: number;
  projectId: number;
  title: string;
  status: 'new' | 'fixing' | 'fixed' | 'closed';
  severity?: 'fatal' | 'serious' | 'normal' | 'tip';
  priority?: string;
}
