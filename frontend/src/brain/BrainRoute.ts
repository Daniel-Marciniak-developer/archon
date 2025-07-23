import {
  CheckHealthData,
  ConnectGithubData,
  CreateProjectData,
  DisconnectGithubData,
  GetGithubConnectionStatusData,
  GetGithubRepositoriesData,
  GetProjectReportData,
  GetProjectsData,
  GithubCallbackData,
  ProjectCreateRequest,
  StartAnalysis2Data,
  StartAnalysisData,
} from "./data-contracts";

export namespace Brain {
  /**
   * @description Check health of application. Returns 200 when OK, 500 when not.
   * @name check_health
   * @summary Check Health
   * @request GET:/_healthz
   */
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  /**
   * No description
   * @tags dbtn/module:reports, dbtn/hasAuth
   * @name start_analysis
   * @summary Start Analysis
   * @request POST:/routes/projects/{project_id}/analyze
   */
  export namespace start_analysis {
    export type RequestParams = {
      /** Project Id */
      projectId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = StartAnalysisData;
  }

  /**
   * @description Get all projects for the authenticated user with comprehensive logging
   * @tags Projects, dbtn/module:projects, dbtn/hasAuth
   * @name get_projects
   * @summary Get Projects
   * @request GET:/routes/api/projects/projects
   */
  export namespace get_projects {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetProjectsData;
  }

  /**
   * @description Create a new project with comprehensive logging
   * @tags Projects, dbtn/module:projects, dbtn/hasAuth
   * @name create_project
   * @summary Create Project
   * @request POST:/routes/api/projects/projects
   */
  export namespace create_project {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ProjectCreateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateProjectData;
  }

  /**
   * @description Fetch user's GitHub repositories for project import.
   * @tags Projects, dbtn/module:projects, dbtn/hasAuth
   * @name get_github_repositories
   * @summary Get Github Repositories
   * @request GET:/routes/api/projects/github/repositories
   */
  export namespace get_github_repositories {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetGithubRepositoriesData;
  }

  /**
   * @description Starts a new analysis for a project.
   * @tags Projects, dbtn/module:projects, dbtn/hasAuth
   * @name start_analysis2
   * @summary Start Analysis
   * @request POST:/routes/api/projects/{project_id}/analyze
   * @originalName start_analysis
   * @duplicate
   */
  export namespace start_analysis2 {
    export type RequestParams = {
      /** Project Id */
      projectId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = StartAnalysis2Data;
  }

  /**
   * @description Check if the user has connected their GitHub account
   * @tags dbtn/module:github_auth, dbtn/hasAuth
   * @name get_github_connection_status
   * @summary Get Github Connection Status
   * @request GET:/routes/github/status
   */
  export namespace get_github_connection_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetGithubConnectionStatusData;
  }

  /**
   * @description Get GitHub OAuth URL for connecting account (mock for development)
   * @tags dbtn/module:github_auth, dbtn/hasAuth
   * @name connect_github
   * @summary Connect Github
   * @request GET:/routes/github/connect
   */
  export namespace connect_github {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ConnectGithubData;
  }

  /**
   * @description Handle GitHub OAuth callback (mock for development)
   * @tags dbtn/module:github_auth, dbtn/hasAuth
   * @name github_callback
   * @summary Github Callback
   * @request GET:/routes/github/callback
   */
  export namespace github_callback {
    export type RequestParams = {};
    export type RequestQuery = {
      /** Code */
      code: string;
      /** State */
      state: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GithubCallbackData;
  }

  /**
   * @description Disconnect GitHub account
   * @tags dbtn/module:github_auth, dbtn/hasAuth
   * @name disconnect_github
   * @summary Disconnect Github
   * @request DELETE:/routes/github/disconnect
   */
  export namespace disconnect_github {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DisconnectGithubData;
  }

  /**
   * No description
   * @tags dbtn/module:reports, dbtn/hasAuth
   * @name get_project_report
   * @summary Get Project Report
   * @request GET:/routes/reports/{project_id}
   */
  export namespace get_project_report {
    export type RequestParams = {
      /** Project Id */
      projectId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetProjectReportData;
  }
}
