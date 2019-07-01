import {IStep} from "../steps/steps.model";

export interface IPipeline {
  id: string,
  name: string,
  steps: IStep[]
}

export interface IPipelinesResponse {
  pipelines: IPipeline[]
}
