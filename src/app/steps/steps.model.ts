export interface IStep {
  id: string,
  displayName: string,
  description: string,
  type: string,
  params: IParam[],
  engineMeta?: {
    spark: string,
    pkg: string
  }
}

export interface IParam {
  type: string,
  name: string,
  required: boolean,
  defaultValue: string,
  language: string,
  className: string
}

export interface IStepsResponse {
  steps: IStep[]
}
