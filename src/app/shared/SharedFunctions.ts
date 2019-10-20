import {IPipelineStepParam} from "../pipelines/pipelines.model";

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
        case '&':
          type = 'pipeline';
          break;
      }
    }

    return type;
  }

  static getLeadCharacter(type: string) {
    let leadCharacter;
    switch(type) {
      case 'global':
        leadCharacter = '!';
        break;
      case 'step':
        leadCharacter = '@';
        break;
      case 'secondary':
        leadCharacter = '#';
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

  static getParameterValue(param: IPipelineStepParam) {
    if (param) {
      if (param.value) {
        return param.value;
      } else if (param.defaultValue) {
        return param.defaultValue;
      }
    }
    return null;
  }
}
