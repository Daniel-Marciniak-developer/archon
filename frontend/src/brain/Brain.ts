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
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   *
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  check_health = (params: RequestParams = {}) =>
    this.request<CheckHealthData, any>({
      path: `/_healthz`,
      method: "GET",
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:reports, dbtn/hasAuth
   * @name start_analysis
   * @summary Start Analysis
   * @request POST:/routes/projects/{project_id}/analyze
   */
  start_analysis = ({ projectId, ...query }: StartAnalysisParams, params: RequestParams = {}) =>
    this.request<StartAnalysisData, StartAnalysisError>({
      path: `/routes/projects/${projectId}/analyze`,
      method: "POST",
      secure: true,
      ...params,
    });

  /**
   * @description Get all projects for the authenticated user with comprehensive logging
   *
   * @tags Projects, dbtn/module:projects, dbtn/hasAuth
   * @name get_projects
   * @summary Get Projects
   * @request GET:/routes/api/projects/projects
   */
  get_projects = (params: RequestParams = {}) =>
    this.request<GetProjectsData, any>({
      path: `/routes/projects`,
      method: "GET",
      secure: true,
      ...params,
    });

  /**
   * @description Create a new project with comprehensive logging
   *
   * @tags Projects, dbtn/module:projects, dbtn/hasAuth
   * @name create_project
   * @summary Create Project
   * @request POST:/routes/api/projects/projects
   */
  create_project = (data: ProjectCreateRequest, params: RequestParams = {}) =>
    this.request<CreateProjectData, CreateProjectError>({
      path: `/routes/projects`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      secure: true,
      ...params,
    });

  /**
   * @description Fetch user's GitHub repositories for project import.
   *
   * @tags GitHub, dbtn/module:projects, dbtn/hasAuth
   * @name get_github_repositories
   * @summary Get Github Repositories
   * @request GET:/routes/api/projects/github/repositories
   */
  get_github_repositories = (params: RequestParams = {}) =>
    this.request<GetGithubRepositoriesData, any>({
      path: `/routes/github/repositories`,
      method: "GET",
      secure: true,
      ...params,
    });

  /**
   * @description Starts a new analysis for a project.
   *
   * @tags Projects, dbtn/module:projects, dbtn/hasAuth
   * @name start_analysis2
   * @summary Start Analysis
   * @request POST:/routes/api/projects/{project_id}/analyze
   * @originalName start_analysis
   * @duplicate
   */
  start_analysis2 = ({ projectId, ...query }: StartAnalysis2Params, params: RequestParams = {}) =>
    this.request<StartAnalysis2Data, StartAnalysis2Error>({
      path: `/routes/projects/${projectId}/analyze`,
      method: "POST",
      secure: true,
      ...params,
    });

  /**
   * @description Upload project files and create a new project
   *
   * @tags Projects, dbtn/module:projects, dbtn/hasAuth
   * @name upload_project_files
   * @summary Upload Project Files
   * @request POST:/routes/api/projects/upload
   */
  upload_project_files = (data: FormData, params: RequestParams = {}) =>
    this.request<FileUploadResponse, any>({
      path: `/routes/projects/upload`,
      method: "POST",
      body: data,
      type: ContentType.FormData,
      secure: true,
      ...params,
    });

  /**
   * @description Validate a GitHub repository for Python project suitability
   *
   * @tags Projects, dbtn/module:projects, dbtn/hasAuth
   * @name validate_github_repo
   * @summary Validate GitHub Repository
   * @request POST:/routes/api/projects/validate-github-repo
   */
  validate_github_repo = (data: any, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/projects/validate-github-repo`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      secure: true,
      ...params,
    });

  /**
   * @description Check if the user has connected their GitHub account
   *
   * @tags dbtn/module:github_auth, dbtn/hasAuth
   * @name get_github_connection_status
   * @summary Get Github Connection Status
   * @request GET:/routes/github/status
   */
  get_github_connection_status = (params: RequestParams = {}) =>
    this.request<GetGithubConnectionStatusData, any>({
      path: `/routes/github/status`,
      method: "GET",
      secure: true,
      ...params,
    });

  /**
   * @description Get GitHub OAuth URL for connecting account (mock for development)
   *
   * @tags dbtn/module:github_auth, dbtn/hasAuth
   * @name connect_github
   * @summary Connect Github
   * @request GET:/routes/github/connect
   */
  connect_github = (params: RequestParams = {}) =>
    this.request<ConnectGithubData, any>({
      path: `/routes/github/connect`,
      method: "GET",
      secure: true,
      ...params,
    });

  /**
   * @description Handle GitHub OAuth callback (mock for development)
   *
   * @tags dbtn/module:github_auth, dbtn/hasAuth
   * @name github_callback
   * @summary Github Callback
   * @request GET:/routes/github/callback
   */
  github_callback = (query: GithubCallbackParams, params: RequestParams = {}) =>
    this.request<GithubCallbackData, GithubCallbackError>({
      path: `/routes/github/callback`,
      method: "GET",
      query: query,
      secure: true,
      ...params,
    });

  /**
   * @description Handle GitHub OAuth callback and store access token
   *
   * @tags dbtn/module:github_auth, dbtn/hasAuth
   * @name github_oauth_callback
   * @summary GitHub OAuth Callback
   * @request POST:/routes/github/callback
   */
  github_oauth_callback = (data: { code: string; state?: string }, params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/github/callback`,
      method: "POST",
      body: data,
      type: ContentType.Json,
      secure: true,
      ...params,
    });

  /**
   * @description Disconnect GitHub account
   *
   * @tags dbtn/module:github_auth, dbtn/hasAuth
   * @name disconnect_github
   * @summary Disconnect Github
   * @request DELETE:/routes/github/disconnect
   */
  disconnect_github = (params: RequestParams = {}) =>
    this.request<DisconnectGithubData, any>({
      path: `/routes/github/disconnect`,
      method: "DELETE",
      secure: true,
      ...params,
    });

  /**
   * No description
   *
   * @tags dbtn/module:reports, dbtn/hasAuth
   * @name get_project_report
   * @summary Get Project Report
   * @request GET:/routes/reports/{project_id}
   */
  get_project_report = ({ projectId, ...query }: GetProjectReportParams, params: RequestParams = {}) =>
    this.request<GetProjectReportData, GetProjectReportError>({
      path: `/routes/reports/${projectId}`,
      method: "GET",
      secure: true,
      ...params,
    });

  /**
   * @description Get file structure for a GitHub project
   * @tags Projects
   * @name get_project_files
   * @summary Get Project Files
   * @request GET:/routes/projects/{project_id}/files
   */
  get_project_files = (projectId: number, branch: string = "main", params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/projects/${projectId}/files`,
      method: "GET",
      query: { branch },
      secure: true,
      format: "json",
      ...params,
    });

  /**
   * @description Get content of a specific file from a GitHub project
   * @tags Projects
   * @name get_file_content
   * @summary Get File Content
   * @request GET:/routes/projects/{project_id}/files/content
   */
  get_file_content = (projectId: number, filePath: string, branch: string = "main", params: RequestParams = {}) =>
    this.request<any, any>({
      path: `/routes/projects/${projectId}/files/content`,
      method: "GET",
      query: { file_path: filePath, branch },
      secure: true,
      ...params,
    });
}
