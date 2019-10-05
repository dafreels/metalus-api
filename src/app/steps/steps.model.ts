export interface IStep {
  id: string,
  displayName: string,
  description: string,
  type: string,
  category: string,
  tags?: string[],
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

export class StaticSteps {
  static FORK_STEP: IStep = {
    id: 'fork',
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
  static JOIN_STEP: IStep = {
    id: 'join',
    type: 'join',
    displayName: 'Join',
    description: 'A join type step is used to join the executions of the fork step to continue processing in a linear manner.',
    category: 'FlowControl',
    params: []
  };
}
