import {Project} from "../shared/models/users.models";

export interface Step {
  id: string,
  displayName: string,
  description: string,
  project?: Project;
  type: string,
  category: string,
  tags?: string[],
  params: Param[],
  engineMeta?: {
    spark: string,
    pkg: string,
    stepResults: StepResults[]
  }
}

export interface StepTemplate {
  id: string;
  name: string;
  path?: any[];
}

export interface StepTemplateResponse {
  stepTemplates: StepTemplate[];
}

export interface Param {
  type: string,
  name: string,
  required: boolean,
  defaultValue: string,
  language: string,
  className: string,
  parameterType: string
  description?: string
  template?:any
}

export interface StepResults {
  primaryType: string,
  secondaryTypes?: {}
}

export interface StepsResponse {
  steps: Step[]
}

export interface StepResponse {
  step: Step
}

export class StaticSteps {
  static FORK_STEP: Step = {
    id: '3d8b5057-6c12-5d3d-80fc-fad3fa0e2191',
    type: 'fork',
    displayName: 'Fork',
    description: 'A fork type step allows running a set of steps against a list of data simulating looping behavior. The join step is used to combine the results of the forks back into the main flow.',
    category: 'FlowControl',
    params: [
      {
        name: 'forkByValues',
        type: 'list',
        required: true,
        defaultValue: undefined,
        parameterType: undefined,
        className: undefined,
        language: undefined
      },
      {
        name: 'forkMethod',
        type: 'text',
        required: true,
        defaultValue: undefined,
        parameterType: undefined,
        className: undefined,
        language: undefined
      }
    ]
  };
  static JOIN_STEP: Step = {
    id: '27d7dd1b-2ea2-5d5d-95ba-682d91f0587b',
    type: 'join',
    displayName: 'Join',
    description: 'A join type step is used to join the executions of the fork step to continue processing in a linear manner.',
    category: 'FlowControl',
    params: []
  };
  static SPLIT_STEP: Step = {
    id: '1edfa1f0-3312-46a4-af5b-4801d9b81dae',
    type: 'split',
    displayName: 'Split',
    description: 'A split type step allows running different step paths in parallel. The merge step is used to combine flows back into the main path.',
    category: 'FlowControl',
    params: []
  };
  static MERGE_STEP: Step = {
    id: '33dafef2-ba92-499c-a29f-739f81e47effb',
    type: 'merge',
    displayName: 'Merge',
    description: 'A merge type step is used to merge the executions of the split step to continue processing in a linear manner.',
    category: 'FlowControl',
    params: []
  };
  static CUSTOM_BRANCH_STEP: Step = {
    id: '6344948a-2032-472b-873c-064e6530989e',
    type: 'branch',
    displayName: 'Custom Branch',
    description: 'Custom branch control',
    category: 'FlowControl',
    params: []
  };
  static STEP_GROUP: Step = {
    id: 'f09b3b9c-82ac-56de-8dc8-f57c063dd4aa',
    type: 'step-group',
    displayName: 'Step Group',
    description: 'Allows pipelines to be executed as a single step within a parent pipeline.',
    category: 'FlowControl',
    params: [
      {
        name: 'pipelineId',
        type: 'text',
        required: false,
        defaultValue: undefined,
        parameterType: undefined,
        className: undefined,
        language: undefined,
        description: 'The id of the pipeline to execute. Either this parameter or the pipeline parameter must be set.'
      },
      {
        name: 'pipeline',
        type: 'text',
        required: false,
        defaultValue: undefined,
        parameterType: undefined,
        className: undefined,
        language: undefined,
        description: 'The pipeline to execute. Either this parameter or the pipelineId parameter must be set. This may be a mapped value or a pipeline object.'
      },
      {
        name: 'useParentGlobals',
        type: 'boolean',
        required: false,
        defaultValue: undefined,
        parameterType: undefined,
        className: undefined,
        language: undefined,
        description: 'Indicates whether the calling pipeline globals should be merged with the pipelineMappings.'
      },
      {
        name: 'pipelineMappings',
        type: 'object',
        required: false,
        defaultValue: undefined,
        parameterType: undefined,
        className: undefined,
        language: undefined,
        description: 'The values to use as the globals for the pipeline. Values may be mapped from the outer pipeline context.'
      }
    ]
  };
}
