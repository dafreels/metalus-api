import {Project} from '../shared/models/users.models';

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
    stepResults?: StepResults[]
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
  static SCALA_SCRIPT_STEP_BASE: Step = {
    id : 'a7e17c9d-6956-4be0-a602-5b5db4d1c08b',
    category : 'Scripting',
    description: 'Executes a script and returns the result',
    displayName: 'Scala script Step',
    engineMeta: {
      spark: 'ScalaSteps.processScript',
      pkg: 'com.acxiom.pipeline.steps',
      stepResults: [{
        primaryType: 'com.acxiom.pipeline.PipelineStepResponse'
      }]
    },
    params: [
      {
        type: 'script',
        name: 'script',
        required: true,
        language: 'scala',
        parameterType: 'String',
        description: 'A scala script to execute',
        defaultValue: undefined,
        className: undefined,
      }
    ],
    type: 'Pipeline'
  };
  static SCALA_SCRIPT_STEP_OBJ: Step = {
    id : '8bf8cef6-cf32-4d85-99f4-e4687a142f84',
    category : 'Scripting',
    description: 'Executes a script with the provided object and returns the result',
    displayName: 'Scala script Step with additional object provided',
    engineMeta: {
      spark: 'ScalaSteps.processScriptWithValue',
      pkg: 'com.acxiom.pipeline.steps',
      stepResults: [{
        primaryType: 'com.acxiom.pipeline.PipelineStepResponse'
      }]
    },
    params: [
      {
        type: 'script',
        name: 'script',
        required: true,
        language: 'scala',
        parameterType: 'String',
        description: 'A scala script to execute',
        defaultValue: undefined,
        className: undefined,
      },
      {
        type: 'text',
        name: 'value',
        required: true,
        parameterType: 'Any',
        description: 'A value to pass to the script',
        defaultValue: undefined,
        className: undefined,
        language: undefined
      },
      {
        type: 'text',
        name: 'type',
        required: false,
        parameterType: 'String',
        description: 'The type of the value to pass to the script',
        defaultValue: undefined,
        className: undefined,
        language: undefined
      }
    ],
    type: 'Pipeline'
  };
  static SCALA_SCRIPT_STEP_OBJS: Step = {
    id : '3ab721e8-0075-4418-aef1-26abdf3041be',
    category : 'Scripting',
    description: 'Executes a script with the provided object and returns the result',
    displayName: 'Scala script Step with additional objects provided',
    engineMeta: {
      spark: 'ScalaSteps.processScriptWithValues',
      pkg: 'com.acxiom.pipeline.steps',
      stepResults: [{
        primaryType: 'com.acxiom.pipeline.PipelineStepResponse'
      }]
    },
    params: [
      {
        type: 'script',
        name: 'script',
        required: true,
        language: 'scala',
        parameterType: 'String',
        description: 'A scala script to execute',
        defaultValue: undefined,
        className: undefined,
      },
      {
        type: 'object',
        name: 'values',
        required: true,
        parameterType: 'Map[String,Any]',
        description: 'Map of name/value pairs that will be bound to the script',
        defaultValue: undefined,
        className: undefined,
        language: undefined
      },
      {
        type: 'object',
        name: 'types',
        required: false,
        parameterType: 'Map[String,String]',
        description: 'Map of type overrides for the values provided',
        defaultValue: undefined,
        className: undefined,
        language: undefined
      },
      {
        type: 'boolean',
        name: 'unwrapOptions',
        required: false,
        parameterType: 'Boolean',
        description: 'Flag to toggle option unwrapping behavior',
        defaultValue: undefined,
        className: undefined,
        language: undefined
      }
    ],
    type: 'Pipeline'
  };
  static JAVASCRIPT_STEP_BASE: Step = {
    id : '5e0358a0-d567-5508-af61-c35a69286e4e',
    category : 'Scripting',
    description: 'Executes a script and returns the result',
    displayName: 'Javascript Step',
    engineMeta: {
      spark: 'JavascriptSteps.processScript',
      pkg: 'com.acxiom.pipeline.steps',
      stepResults: [{
        primaryType: 'com.acxiom.pipeline.PipelineStepResponse'
      }]
    },
    params: [
      {
        type: 'script',
        name: 'script',
        required: true,
        language: 'javascript',
        parameterType: 'String',
        description: 'Javascript to execute',
        defaultValue: undefined,
        className: undefined,
      }
    ],
    type: 'Pipeline'
  };
  static JAVASCRIPT_STEP_OBJ: Step = {
    id : '570c9a80-8bd1-5f0c-9ae0-605921fe51e2',
    category : 'Scripting',
    description: 'Executes a script with single object provided and returns the result',
    displayName: 'Javascript Step with single object provided',
    engineMeta: {
      spark: 'JavascriptSteps.processScriptWithValue',
      pkg: 'com.acxiom.pipeline.steps',
      stepResults: [{
        primaryType: 'com.acxiom.pipeline.PipelineStepResponse'
      }]
    },
    params: [
      {
        type: 'script',
        name: 'script',
        required: true,
        language: 'javascript',
        parameterType: 'String',
        description: 'Javascript script to execute',
        defaultValue: undefined,
        className: undefined,
      },
      {
        type: 'text',
        name: 'value',
        required: true,
        parameterType: 'Any',
        description: 'Value to bind to the script',
        defaultValue: undefined,
        className: undefined,
        language: undefined
      }
    ],
    type: 'Pipeline'
  };
  static JAVASCRIPT_STEP_OBJS: Step = {
    id : 'f92d4816-3c62-4c29-b420-f00994bfcd86',
    category : 'Scripting',
    description: 'Executes a script with map of objects provided and returns the result',
    displayName: 'Javascript Step with map of objects provided',
    engineMeta: {
      spark: 'JavascriptSteps.processScriptWithValues',
      pkg: 'com.acxiom.pipeline.steps',
      stepResults: [{
        primaryType: 'com.acxiom.pipeline.PipelineStepResponse'
      }]
    },
    params: [
      {
        type: 'script',
        name: 'script',
        required: true,
        language: 'javascript',
        parameterType: 'String',
        description: 'The javascript script to be executed',
        defaultValue: undefined,
        className: undefined,
      },
      {
        type: 'text',
        name: 'values',
        required: true,
        parameterType: 'Map[String,Any]',
        description: 'Map of name/value pairs to bind to the script',
        defaultValue: undefined,
        className: undefined,
        language: undefined
      },
      {
        type: 'boolean',
        name: 'unwrapOptions',
        required: false,
        parameterType: 'Boolean',
        description: 'Flag to control option unwrapping behavior',
        defaultValue: undefined,
        className: undefined,
        language: undefined
      }
    ],
    type: 'Pipeline'
  };
  static EXCEPTION_SKIP: Step = {
    id : '403b1b7e-13d1-4e28-856a-6c1185442b2c',
    category : 'Exceptions',
    description: 'Throws an Exception that will indicate that the current execution should be skipped. This exception is intended to be used in evaluation pipelines only.',
    displayName: 'Skip Exception',
    engineMeta: {
      spark: 'ExceptionSteps.throwSkipExecutionException',
      pkg: 'com.acxiom.pipeline.steps',
      stepResults: [{
        primaryType: 'com.acxiom.pipeline.PipelineStepResponse'
      }]
    },
    params: [
      {
        type: 'text',
        name: 'message',
        required: true,
        parameterType: 'String',
        description: 'The message to log when the exception is thrown',
        defaultValue: undefined,
        className: undefined,
        language: undefined
      }
    ],
    type: 'Pipeline'
  };
  static EXCEPTION_PIPELINE: Step = {
    id : 'fb6c6293-c51d-49ab-a77e-de389610cdd6c',
    category : 'Exceptions',
    description: 'Throws an Exception that will indicate that the current pipeline should stop.',
    displayName: 'Pipeline Exception',
    engineMeta: {
      spark: 'ExceptionSteps.throwPipelineException',
      pkg: 'com.acxiom.pipeline.steps'
    },
    params: [
      {
        type: 'text',
        name: 'message',
        required: true,
        parameterType: 'String',
        description: 'The message to log when the exception is thrown',
        defaultValue: undefined,
        className: undefined,
        language: undefined
      },
      {
        type: 'text',
        name: 'cause',
        required: false,
        description: 'An optional exception to include in the thrown exception',
        defaultValue: undefined,
        parameterType: undefined,
        className: undefined,
        language: undefined
      },
      {
        type: 'text',
        name: 'stepIdOverride',
        required: false,
        parameterType: 'String',
        description: 'An optional stepId to use instead of the default',
        defaultValue: undefined,
        className: undefined,
        language: undefined
      }
    ],
    type: 'Pipeline'
  };
}
