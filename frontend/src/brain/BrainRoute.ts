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
  
  export namespace check_health {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = CheckHealthData;
  }

  
  export namespace start_analysis {
    export type RequestParams = {
      
      projectId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = StartAnalysisData;
  }

  
  export namespace get_projects {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetProjectsData;
  }

  
  export namespace create_project {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = ProjectCreateRequest;
    export type RequestHeaders = {};
    export type ResponseBody = CreateProjectData;
  }

  
  export namespace get_github_repositories {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetGithubRepositoriesData;
  }

  
  export namespace start_analysis2 {
    export type RequestParams = {
      
      projectId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = StartAnalysis2Data;
  }

  
  export namespace get_github_connection_status {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetGithubConnectionStatusData;
  }

  
  export namespace connect_github {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = ConnectGithubData;
  }

  
  export namespace github_callback {
    export type RequestParams = {};
    export type RequestQuery = {
      
      code: string;
      
      state: string;
    };
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GithubCallbackData;
  }

  
  export namespace disconnect_github {
    export type RequestParams = {};
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = DisconnectGithubData;
  }

  
  export namespace get_project_report {
    export type RequestParams = {
      
      projectId: number;
    };
    export type RequestQuery = {};
    export type RequestBody = never;
    export type RequestHeaders = {};
    export type ResponseBody = GetProjectReportData;
  }
}

