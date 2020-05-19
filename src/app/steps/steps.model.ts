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

export interface Param {
  type: string,
  name: string,
  required: boolean,
  defaultValue: string,
  language: string,
  className: string,
  parameterType: string
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
    description: 'A fork type step allows running a set of steps against a list of data simulating looping behavior',
    category: 'FlowControl',
    params: [
      {
        name: 'forkByValues',
        type: 'text',
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
        language: undefined
      },
      {
        name: 'pipeline',
        type: 'text',
        required: false,
        defaultValue: undefined,
        parameterType: undefined,
        className: undefined,
        language: undefined
      },
      {
        name: 'useParentGlobals',
        type: 'boolean',
        required: false,
        defaultValue: undefined,
        parameterType: undefined,
        className: undefined,
        language: undefined
      },
      {
        name: 'pipelineMappings',
        type: 'object',
        required: false,
        defaultValue: undefined,
        parameterType: undefined,
        className: undefined,
        language: undefined
      }
    ]
  };
}
