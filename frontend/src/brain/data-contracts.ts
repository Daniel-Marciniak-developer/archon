
export interface GitHubAuthUrlResponse {
  
  auth_url: string;
}


export interface GitHubConnectionStatus {
  
  connected: boolean;
  
  username?: string | null;
  
  avatar_url?: string | null;
}


export interface GitHubRepo {
  
  id: number;
  
  name: string;
  
  full_name: string;
  
  owner: Record<string, any>;
  
  html_url: string;
  
  description?: string | null;
  
  private: boolean;
  
  language?: string | null;
  
  updated_at: string;
}


export interface GitHubReposResponse {
  
  repositories: GitHubRepo[];
}


export interface HTTPValidationError {
  
  detail?: ValidationError[];
}


export interface HealthResponse {
  
  status: string;
}


export interface Issue {
  
  id: number;
  
  analysis_id: number;
  
  category: string;
  
  severity: string;
  
  title: string;
  
  description: string;
  
  file_path: string;
  
  line_number: number;
}


export interface ProjectCreateRequest {
  
  repo_name: string;
  
  repo_owner: string;
  
  repo_url: string;
}


export interface ProjectReport {
  
  project_id: number;
  
  project_name: string;
  
  overall_score: number;
  
  structure_score: number;
  
  quality_score: number;
  
  security_score: number;
  
  dependencies_score: number;
  
  issues: Issue[];
}


export interface ProjectResponse {
  
  id: number;
  
  repo_name: string;
  
  repo_owner: string;
  
  repo_url: string;
  
  project_source?: string;
  
  upload_metadata?: Record<string, any> | null;
  
  created_at: string;
  
  latest_analysis?: Record<string, any> | null;
}


export interface FileUploadResponse {
  
  project_id: number;
  
  project_name: string;
  
  files_processed: number;
  
  total_size_bytes: number;
  
  validation_results: Record<string, any>;
  
  created_at: string;
}


export interface ValidationError {
  
  loc: (string | number)[];
  
  msg: string;
  
  type: string;
}

export type CheckHealthData = HealthResponse;

export interface StartAnalysisParams {
  
  projectId: number;
}

export type StartAnalysisData = any;

export type StartAnalysisError = HTTPValidationError;


export type GetProjectsData = ProjectResponse[];

export type CreateProjectData = ProjectResponse;

export type CreateProjectError = HTTPValidationError;

export type GetGithubRepositoriesData = GitHubReposResponse;

export interface StartAnalysis2Params {
  
  projectId: number;
}

export type StartAnalysis2Data = any;

export type StartAnalysis2Error = HTTPValidationError;

export type GetGithubConnectionStatusData = GitHubConnectionStatus;

export type ConnectGithubData = GitHubAuthUrlResponse;

export interface GithubCallbackParams {
  
  code: string;
  
  state: string;
}

export type GithubCallbackData = any;

export type GithubCallbackError = HTTPValidationError;

export type DisconnectGithubData = any;

export interface GetProjectReportParams {
  
  projectId: number;
}

export type GetProjectReportData = ProjectReport;

export type GetProjectReportError = HTTPValidationError;

