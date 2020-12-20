import {
  Pipeline,
  PipelineStepParam,
} from '../../pipelines/models/pipelines.model';
import {Subscription} from "rxjs";

export class SharedFunctions {
  static getType(value, defaultType) {
    let type = defaultType;
    if (value) {
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

  static formatValue(value: string, type: string) {
    return this.getLeadCharacter(type) ? this.getLeadCharacter(type) + value : value;
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
   * using the special character. Each attribute will be an empty string.
   * @param pipeline The pipeline to parse
   * @param special Optional character to use when finding parameters. Default is !
   */
  static generatePipelineMappings(pipeline: Pipeline, special = '!'): object {
    const globals = {};
    let values;
    const regex = new RegExp(`[${special}{}]`, 'g');
    pipeline.steps.forEach((step) => {
      if (step.params && step.params.length > 0) {
        step.params.forEach((param) => {
          const value = param.value || param.defaultValue;
          if (value &&
            typeof value === 'string' &&
            value.indexOf(special) > -1) {
            values = value.split('||').map((s) => s.trim());
            values.forEach((v) => {
              if (v.indexOf(special) === 0) {
                let global = v.replace(regex, '');
                const dotIndex = global.indexOf('.');
                if (dotIndex > -1) {
                  global = global.substring(0, dotIndex);
                }
                if (!globals[global]) {
                  globals[global] = '';
                }
              }
            });
          }
        });
      }
    });

    return globals;
  }

  static clearSubscriptions(subscriptions: Subscription[]) {
    if (subscriptions && subscriptions.length > 0) {
      subscriptions.forEach((sub) => sub.unsubscribe());
    }
    return [];
  }

  static clone(data: any) {
    return JSON.parse(JSON.stringify(data));
  }
}
