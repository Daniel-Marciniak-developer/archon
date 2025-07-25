import {
  CheckHealthData,
  ConnectGithubData,
  CreateProjectData,
  CreateProjectError,
  DisconnectGithubData,
  FileUploadResponse,
  GetGithubConnectionStatusData,
  GetGithubRepositoriesData,
  GetProjectReportData,
  GetProjectReportError,
  GetProjectReportParams,
  GetProjectsData,
  GithubCallbackData,
  GithubCallbackError,
  GithubCallbackParams,
  ProjectCreateRequest,
  StartAnalysis2Data,
  StartAnalysis2Error,
  StartAnalysis2Params,
  StartAnalysisData,
  StartAnalysisError,
  StartAnalysisParams,
} from "./data-contracts";
import { ContentType, HttpClient, RequestParams } from "./http-client";

export class Brain<SecurityDataType = unknown> extends HttpClient<SecurityDataType> {
  
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  
  start_analysis = ({ projectId, ...query }: StartAnalysisParams, params: RequestParams = {}) =>
    this.request<StartAnalysisData, StartAnalysisError>({
      path: `/routes/projects/${projectId}/analyze`,
      method: "POST",
      secure: true,
      ...params,
    });

  
  get_projects = (params: RequestParams = {}) =>
    this.request<GetProjectsData, any>({
      path: `/routes/projects`,
      method: "GET",
      secure: true,
      ...params,
    });

  
  create_project = (data: ProjectCreateRequest, params: RequestParams = {}) =>
    this.request<CreateProjectData, CreateProjectError>({
      path: `/routes/projects`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      secure: true,
      ...params,
    });

  
  get_github_repositories = (params: RequestParams = {}) =>
    this.request<GetGithubRepositoriesData, any>({
      path: `/routes/github/repositories`,
      method: "GET",
      secure: true,
      ...params,
    });

  
  start_analysis2 = ({ projectId, ...query }: StartAnalysis2Params, params: RequestParams = {}) =>
    this.request<StartAnalysis2Data, StartAnalysis2Error>({
      path: `/routes/projects/${projectId}/analyze`,
      method: "POST",
      secure: true,
      ...params,
    });

  
  upload_project_files = (data: FormData, params: RequestParams = {}) =>
    this.request<FileUploadResponse, any>({
      path: `/routes/projects/upload`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      secure: true,
      ...params,
    });

  
  validate_github_repo = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/projects/validate-github-repo`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      secure: true,
      ...params,
    });

  
  get_github_connection_status = (params: RequestParams = {}) =>
    this.request<GetGithubConnectionStatusData, any>({
      path: `/routes/github/status`,
      method: "GET",
      secure: true,
      ...params,
    });

  
  connect_github = (params: RequestParams = {}) =>
    this.request<ConnectGithubData, any>({
      path: `/routes/github/connect`,
      method: "GET",
      secure: true,
      ...params,
    });

  
  github_callback = (query: GithubCallbackParams, params: RequestParams = {}) =>
    this.request<GithubCallbackData, GithubCallbackError>({
      path: `/routes/github/callback`,
      method: "GET",
      query: query,
      secure: true,
      ...params,
    });

  
  github_oauth_callback = (data: { code: string; state?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/github/callback`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      secure: true,
      ...params,
    });

  
  disconnect_github = (params: RequestParams = {}) =>
    this.request<DisconnectGithubData, any>({
      path: `/routes/github/disconnect`,
      method: "DELETE",
      secure: true,
      ...params,
    });

  
  get_project_report = ({ projectId, ...query }: GetProjectReportParams, params: RequestParams = {}) =>
    this.request<GetProjectReportData, GetProjectReportError>({
      path: `/routes/reports/${projectId}`,
      method: "GET",
      secure: true,
      ...params,
    });

  
  get_project_files = (projectId: number, branch: string = "main", params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/projects/${projectId}/files`,
      method: "GET",
      query: { branch },
      secure: true,
      format: "json",
      ...params,
    });

  
  get_file_content = (projectId: number, filePath: string, branch: string = "main", params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/projects/${projectId}/files/content`,
      method: "GET",
      query: { file_path: filePath, branch },
      secure: true,
      format: "json",
      ...params,
    });

  delete_project = (projectId: number, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/projects/${projectId}`,
      method: "DELETE",
      secure: true,
      ...params,
    });
}

