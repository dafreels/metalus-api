import { Param, Step } from '../../steps/steps.model';
import {Project} from "../../shared/models/users.models";

export interface Pipeline {
  id: string;
  name: string;
  project: Project;
  steps: PipelineStep[];
  category?: PipelineCategory;
  layout?: object;
}

export interface PipelineData {
  id: string;
  name: string;
}

export interface PipelineStep extends Step {
  stepId: string;
  params: PipelineStepParam[];
  nextStepId?: string;
  nextStepOnError?: string;
  executeIfEmpty?: string;
}

export interface PipelineStepParam extends Param {
  value: any;
}

export type PipelineCategory = 'pipeline' | 'step-group';

export interface PipelinesResponse {
  pipelines: Pipeline[];
}

export interface PipelineResponse {
  pipeline: Pipeline;
}

export interface PipelineParameter {
  pipelineId: string;
  parameters: object;
}
