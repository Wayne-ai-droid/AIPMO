// API 基础配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Dashboard API
export function getDashboardOverview() {
  return fetchAPI('/dashboard/overview');
}

export function getProjectDashboard(projectId: number) {
  return fetchAPI(`/dashboard/projects/${projectId}`);
}

// Projects API
export function getProjects() {
  return fetchAPI('/projects');
}

export function getProject(id: number) {
  return fetchAPI(`/projects/${id}`);
}

export function createProject(data: any) {
  return fetchAPI('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateProject(id: number, data: any) {
  return fetchAPI(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: number) {
  return fetchAPI(`/projects/${id}`, {
    method: 'DELETE',
  });
}
