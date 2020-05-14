import {
  Pipeline,
  PipelineStepParam,
} from '../../pipelines/models/pipelines.model';

export class SharedFunctions {
  private static leadCharacters: string[] = ['@', '!', '#', '$'];

  static getType(value, defaultType) {
    let type = defaultType;
    if (value && SharedFunctions.leadCharacters.indexOf(value[0]) !== -1) {
      switch (value[0]) {
        case '!':
          type = 'global';
          break;
        case '@':
          type = 'step';
          break;
        case '#':
          type = 'secondary';
          break;
        case '$':
          type = 'runtime';
          break;
        case '?':
          type = 'mapped_runtime';
          break;
        case '&':
          type = 'pipeline';
          break;
      }
    }

    return type;
  }

  static getLeadCharacter(type: string) {
    let leadCharacter;
    switch (type) {
      case 'global':
        leadCharacter = '!';
        break;
      case 'step':
        leadCharacter = '@';
        break;
      case 'secondary':
        leadCharacter = '#';
        break;
      case 'mapped_runtime':
        leadCharacter = '?';
        break;
      case 'runtime':
        leadCharacter = '$';
        break;
      case 'pipeline':
        leadCharacter = '&';
        break;
      default:
        leadCharacter = '';
    }
    return leadCharacter;
  }

  static getParameterValue(param: PipelineStepParam) {
    if (param) {
      if (param.value) {
        return param.value;
      } else if (param.defaultValue) {
        return param.defaultValue;
      }
    }
    return null;
  }

  static getMaterialIconName(stepType) {
    const value = stepType || '';
    switch (value.toLocaleLowerCase()) {
      case 'step-group':
        return 'more_vert';
      case 'branch':
        return 'device_hub';
      case 'fork':
        return 'call_split';
      case 'join':
        return 'call_merge';
      case 'execution':
        return 'transform';
      default:
        return 'extension';
    }
  }

  /**
   * Given a pipeline, this function will create an object that contains all of the attributes referenced
   * as globals. Each attribute will be an empty string.
   * @param pipeline The pipeline to parse
   */
  static generatePipelineMappings(pipeline: Pipeline): object {
    const globals = {};
    let values;
    pipeline.steps.forEach((step) => {
      if (step.params && step.params.length > 0) {
        step.params.forEach((param) => {
          const value = param.value || param.defaultValue;
          if (value && typeof value === 'string' && value.indexOf('!') > -1) {
            values = value.split('||').map((s) => s.trim());
            values.forEach((v) => {
              if (v.indexOf('!') === 0) {
                globals[v.replace(/[!{}]/g, '')] = '';
              }
            });
          }
        });
      }
    });

    return globals;
  }
}
