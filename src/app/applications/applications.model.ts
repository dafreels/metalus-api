import {IPipeline, PipelineParameter} from "../pipelines/pipelines.model";

export interface IApplicationsResponse {
  applications: IApplication[]
}

export interface IApplication extends BaseApplicationProperties {
  id: string,
  name: string,
  sparkConf: ISparkConf,
  stepPackages: string[],
  applicationProperties: object;
  executions: IExecution[];
  requiredParameters: string[];
  pipelineManager: ClassInfo;
}

export interface ISparkConf {
  kryoClasses: string[],
  setOptions: INameValuePair[]
}

export interface IExecution extends BaseApplicationProperties {
  id: string,
  parents: string[];
  pipelineIds?: string[];
  initialPipelineId: string;
  mergeGlobals: boolean;
}

export interface BaseApplicationProperties {
  pipelines?: IPipeline[];
  globals: object;
  pipelineListener: ClassInfo;
  securityManager: ClassInfo;
  stepMapper: ClassInfo;
  pipelineParameters: PipelineParameter[];
}

export interface ClassInfo {
  className: string;
  parameters: object;
}

export interface INameValuePair {
  name: string,
  value: string
}
