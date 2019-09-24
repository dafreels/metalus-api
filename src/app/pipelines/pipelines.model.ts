import {IParam, IStep} from "../steps/steps.model";

export interface IPipeline {
  id: string,
  name: string,
  steps: IPipelineStep[],
  category?: PipelineCategory;
  layout?: {
    x: number;
    y: number;
  }
}

export interface IPipelineStep extends IStep {
  stepId: string;
  params: IPipelineStepParam[];
  nextStepId?: string;
  executeIfEmpty?: string;
}

export interface IPipelineStepParam extends IParam {
  value: string;
}

export type PipelineCategory = 'pipeline' | 'step-group';

export interface IPipelinesResponse {
  pipelines: IPipeline[]
}
