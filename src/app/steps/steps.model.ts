export interface IStep {
  id: string,
  displayName: string,
  description: string,
  type: string,
  category: string,
  params: IParam[],
  engineMeta?: {
    spark: string,
    pkg: string,
    stepResults: IStepResults[]
  }
}

export interface IParam {
  type: string,
  name: string,
  required: boolean,
  defaultValue: string,
  language: string,
  className: string,
  parameterType: string
}

export interface IStepResults {
  primaryType: string,
  secondaryTypes?: {}
}

export interface IStepsResponse {
  steps: IStep[]
}

export interface IStepResponse {
  step: IStep
}
