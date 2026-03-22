import { fetchAPI } from './dashboard';

export function getYunxiaoProjects() {
  return fetchAPI('/yunxiao/projects');
}

export function getYunxiaoProject(id: string) {
  return fetchAPI(`/yunxiao/projects/${id}`);
}
