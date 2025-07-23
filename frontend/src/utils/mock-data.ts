import { ProjectResponse } from 'types';

export const mockProjects: ProjectResponse[] = [
  {
    id: 1,
    repo_name: 'awesome-python-app',
    repo_owner: 'demo-user',
    repo_url: 'https://github.com/demo-user/awesome-python-app',
    created_at: '2024-07-01T10:00:00Z',
    latest_analysis: {
      overall_score: 87,
    },
  },
  {
    id: 2,
    repo_name: 'data-processing-tool',
    repo_owner: 'demo-user',
    repo_url: 'https://github.com/demo-user/data-processing-tool',
    created_at: '2024-06-15T14:30:00Z',
    latest_analysis: {
      overall_score: 55,
    },
  },
  {
    id: 3,
    repo_name: 'ml-experiment',
    repo_owner: 'demo-user',
    repo_url: 'https://github.com/demo-user/ml-experiment',
    created_at: '2024-05-20T09:00:00Z',
    latest_analysis: {
      overall_score: 32,
    },
  },
    {
    id: 4,
    repo_name: 'legacy-api',
    repo_owner: 'demo-user',
    repo_url: 'https://github.com/demo-user/legacy-api',
    created_at: '2023-01-10T18:00:00Z',
    latest_analysis: null
  },
];
