import { prisma } from '../index';

interface HealthResult {
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
  details: {
    progressScore: number;
    qualityScore: number;
    riskScore: number;
    risks: string[];
  };
}

export async function calculateProjectHealth(projectId: number): Promise<HealthResult> {
  // 获取项目数据
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      demands: true,
      bugs: true
    }
  });

  if (!project) {
    throw new Error('Project not found');
  }

  const risks: string[] = [];

  // 1. 进度得分 (40%)
  const progressScore = calculateProgressScore(project.demands);
  if (progressScore < 60) {
    risks.push('项目进度严重滞后');
  } else if (progressScore < 80) {
    risks.push('项目进度有所延迟');
  }

  // 2. 质量得分 (30%)
  const qualityScore = calculateQualityScore(project.bugs);
  const bugDensity = project.demands.length > 0 ? project.bugs.length / project.demands.length : 0;
  if (bugDensity > 0.3) {
    risks.push('缺陷密度偏高，质量风险');
  }

  // 3. 风险得分 (30%) - 基于风险数量和严重程度
  let riskScore = 100;
  const fatalBugs = project.bugs.filter(b => b.severity === 'fatal' && b.status !== 'closed').length;
  if (fatalBugs > 0) {
    riskScore -= fatalBugs * 20;
    risks.push(`存在${fatalBugs}个致命缺陷未解决`);
  }

  // 计算综合健康度
  const totalScore = Math.round(
    progressScore * 0.4 + 
    qualityScore * 0.3 + 
    Math.max(0, riskScore) * 0.3
  );

  // 确定状态
  let status: HealthResult['status'];
  if (totalScore >= 80) status = 'excellent';
  else if (totalScore >= 60) status = 'good';
  else if (totalScore >= 40) status = 'warning';
  else status = 'danger';

  return {
    score: totalScore,
    status,
    details: {
      progressScore: Math.round(progressScore),
      qualityScore: Math.round(qualityScore),
      riskScore: Math.max(0, riskScore),
      risks
    }
  };
}

function calculateProgressScore(demands: any[]): number {
  if (demands.length === 0) return 100;
  const totalProgress = demands.reduce((sum, d) => sum + (d.progress || 0), 0);
  return totalProgress / demands.length;
}

function calculateQualityScore(bugs: any[]): number {
  if (bugs.length === 0) return 100;
  const closedBugs = bugs.filter(b => b.status === 'closed').length;
  return (closedBugs / bugs.length) * 100;
}
