import {IPipeline} from "../pipelines/pipelines.model";

export interface IApplicationsResponse {
  applications: IApplication[]
}

export interface IApplication {
  id: string,
  name: string,
  sparkConf: ISparkConf,
  stepPackages: string[],
  globals: {},
  executions: IExecution[]
}

export interface ISparkConf {
  kryoClasses: string[],
  setOptions: INameValuePair[]
}

export interface IExecution {
  id: string,
  parents: string[],
  pipelines: IPipeline[]
}

export interface INameValuePair {
  name: string,
  value: string
}
