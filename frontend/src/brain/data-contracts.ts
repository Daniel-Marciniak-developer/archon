/** GitHubAuthUrlResponse */
export interface GitHubAuthUrlResponse {
  /** Auth Url */
  auth_url: string;
}

/** GitHubConnectionStatus */
export interface GitHubConnectionStatus {
  /** Connected */
  connected: boolean;
  /** Username */
  username?: string | null;
  /** Avatar Url */
  avatar_url?: string | null;
}

/**
 * GitHubRepo
 * GitHub repository information
 */
export interface GitHubRepo {
  /** Id */
  id: number;
  /** Name */
  name: string;
  /** Full Name */
  full_name: string;
  /** Owner */
  owner: Record<string, any>;
  /** Html Url */
  html_url: string;
  /** Description */
  description?: string | null;
  /** Private */
  private: boolean;
  /** Language */
  language?: string | null;
  /** Updated At */
  updated_at: string;
}

/**
 * GitHubReposResponse
 * Response model for GitHub repositories list
 */
export interface GitHubReposResponse {
  /** Repositories */
  repositories: GitHubRepo[];
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** Issue */
export interface Issue {
  /** Id */
  id: number;
  /** Analysis Id */
  analysis_id: number;
  /** Category */
  category: string;
  /** Severity */
  severity: string;
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** File Path */
  file_path: string;
  /** Line Number */
  line_number: number;
}

/**
 * ProjectCreateRequest
 * Request model for creating a new project
 */
export interface ProjectCreateRequest {
  /** Repo Name */
  repo_name: string;
  /** Repo Owner */
  repo_owner: string;
  /** Repo Url */
  repo_url: string;
}

/** ProjectReport */
export interface ProjectReport {
  /** Project Id */
  project_id: number;
  /** Project Name */
  project_name: string;
  /** Overall Score */
  overall_score: number;
  /** Structure Score */
  structure_score: number;
  /** Quality Score */
  quality_score: number;
  /** Security Score */
  security_score: number;
  /** Dependencies Score */
  dependencies_score: number;
  /** Issues */
  issues: Issue[];
}

/**
 * ProjectResponse
 * Response model for project with latest analysis
 */
export interface ProjectResponse {
  /** Id */
  id: number;
  /** Repo Name */
  repo_name: string;
  /** Repo Owner */
  repo_owner: string;
  /** Repo Url */
  repo_url: string;
  /** Project Source */
  project_source?: string;
  /** Upload Metadata */
  upload_metadata?: Record<string, any> | null;
  /**
   * Created At
   * @format date-time
   */
  created_at: string;
  /** Latest Analysis */
  latest_analysis?: Record<string, any> | null;
}

/** FileUploadResponse */
export interface FileUploadResponse {
  /** Project Id */
  project_id: number;
  /** Project Name */
  project_name: string;
  /** Files Processed */
  files_processed: number;
  /** Total Size Bytes */
  total_size_bytes: number;
  /** Validation Results */
  validation_results: Record<string, any>;
  /** Created At */
  created_at: string;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

export type CheckHealthData = HealthResponse;

export interface StartAnalysisParams {
  /** Project Id */
  projectId: number;
}

export type StartAnalysisData = any;

export type StartAnalysisError = HTTPValidationError;

/** Response Get Projects */
export type GetProjectsData = ProjectResponse[];

export type CreateProjectData = ProjectResponse;

export type CreateProjectError = HTTPValidationError;

export type GetGithubRepositoriesData = GitHubReposResponse;

export interface StartAnalysis2Params {
  /** Project Id */
  projectId: number;
}

export type StartAnalysis2Data = any;

export type StartAnalysis2Error = HTTPValidationError;

export type GetGithubConnectionStatusData = GitHubConnectionStatus;

export type ConnectGithubData = GitHubAuthUrlResponse;

export interface GithubCallbackParams {
  /** Code */
  code: string;
  /** State */
  state: string;
}

export type GithubCallbackData = any;

export type GithubCallbackError = HTTPValidationError;

export type DisconnectGithubData = any;

export interface GetProjectReportParams {
  /** Project Id */
  projectId: number;
}

export type GetProjectReportData = ProjectReport;

export type GetProjectReportError = HTTPValidationError;
