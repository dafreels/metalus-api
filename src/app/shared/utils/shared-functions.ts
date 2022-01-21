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
        case '%':
          type = 'credential';
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
      case 'credential':
        leadCharacter = '%';
        break;
      default:
        leadCharacter = '';
    }
    return leadCharacter;
  }

  static formatValue(value: string, type: string) {
    return this.getLeadCharacter(type) ? this.getLeadCharacter(type) + value : value;
  }

  static trimSpecialCharacter(value) {
    switch (value.charAt(0)) {
      case '!':
      case '@':
      case '#':
      case '&':
      case '?':
      case '$':
      case '%':
        return value.substring(1);
      default:
        return value
    }
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
      case 'split':
        return 'align_vertical_top';
      case 'merge':
        return 'align_vertical_bottom';
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

  static downloadAsFile(fileName: string, data: string) {
    const downloadEl = document.createElement('a');
    const fileType = fileName.indexOf('.json') > -1 ? 'text/json' : 'text/plain';
    downloadEl.setAttribute('href', `data:${fileType};charset=utf-8,${encodeURIComponent(data)}`);
    downloadEl.setAttribute('download', fileName);
    const event = new MouseEvent("click");
    downloadEl.dispatchEvent(event);
   }

   static convertFormlyForm(formlyJson) {
     return SharedFunctions.clone(formlyJson).map(item => {
       if (item.validators && Object.keys(item.validators).length > 0) {
         const validators = {};
         Object.keys(item.validators).forEach(key => {
           validators[key] = {
             expression: item.validators[key].expression ? eval(item.validators[key].expression) : null,
             message: item.validators[key].message ? eval(item.validators[key].message) : null
           };
         });
         item.validators = validators;
       }
       return item;
     });
   }

  /**
   * Performs a deep merge of objects and returns new object. Does not modify
   * objects (immutable) and merges arrays via concatenation.
   *
   * @param {...object} objects - Objects to merge
   * @returns {object} New object with merged key/values
   */
  static mergeDeep(...objects) {
    const isObject = obj => obj && typeof obj === 'object';

    return objects.reduce((prev, obj) => {
      Object.keys(obj).forEach(key => {
        const pVal = prev[key];
        const oVal = obj[key];

        if (Array.isArray(pVal) && Array.isArray(oVal)) {
          prev[key] = pVal.concat(...oVal);
        }
        else if (isObject(pVal) && isObject(oVal)) {
          prev[key] = SharedFunctions.mergeDeep(pVal, oVal);
        }
        else {
          prev[key] = oVal;
        }
      });

      return prev;
    }, {});
  }
}
const sharedFunctions = new SharedFunctions();
export default sharedFunctions;
