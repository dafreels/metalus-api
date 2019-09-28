import {Component, EventEmitter, Input, Output} from "@angular/core";
import {IPipelineStepParam} from "../pipelines.model";

export interface SplitParameter {
  id: number;
  value: any;
  type: string;
  language?: string;
  className?: string;
}

@Component({
  selector: 'pipelines-parameter',
  templateUrl: './pipeline.parameter.component.html',
  styleUrls: ['./pipeline.parameter.component.css']
})
export class PipelineParameterComponent {

  @Output() parameterUpdate = new EventEmitter<IPipelineStepParam>();

  leadCharacters: string[] = ['@', '!', '#', '$'];
  parameterName: string;
  parameters: SplitParameter[];
  complexParameter: boolean = false;
  _parameter: IPipelineStepParam;
  private id: number = 0;

  @Input()
  set parameter(p: IPipelineStepParam) {
    if (p) {
      this._parameter = p;
      this.parameterName = p.name;
      switch(p.type.toLowerCase()) {
        case 'object':
        case 'script':
          this.complexParameter = true;
          this.parameters = [{
            id: this.id++,
            value: p.value,
            type: p.type,
            language: p.language,
            className: p.className
          }];
          break;
        default:
          if (p.value) {
            let value;
            let type;
            this.parameters = p.value.split('||').map((e) => {
              value = e.trim();
              type = this.getType(value, 'static');
              if (value && (type === 'global' || type === 'step' || type === 'secondary' || type === 'runtime')) {
                value = value.substring(1);
              }
              return {
                id: this.id++,
                value,
                type
              };
            });
          } else {
            this.parameters = [];
          }
      }
    }
  }

  handleChange() {
    let parameterValue = '';
    let count = 0;
    this.parameters.forEach((p) => {
      if (count === 0) {
        parameterValue = this.getLeadCharacter(p.type) + p.value;
      } else {
        parameterValue = `${parameterValue} || ${this.getLeadCharacter(p.type) + p.value}`;
      }
      count += 1;
    });
    this._parameter.value = parameterValue;
    this._parameter.type = this.parameters.length > 1 ? 'text' : this.parameters[0].type;
    // Only used for object or script meaning there should be only 1 parameter
    this._parameter.language = this.parameters[0].language;
    this._parameter.className = this.parameters[0].className;

    this.parameterUpdate.emit(this._parameter);
  }

  removeClause(id: number) {
    this.parameters.splice(this.parameters.findIndex(p => p.id === id), 1);
    this.handleChange();
  }

  addClause() {
    this.parameters.push({
      id: this.id++,
      value: '',
      type: 'static'
    });
  }

  private getType(value, defaultType) {
    let type = defaultType;
    if (value && this.leadCharacters.indexOf(value[0]) !== -1) {
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
      }
    }

    return type;
  }

  private getLeadCharacter(type: string) {
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
      default:
        leadCharacter = '';
    }
    return leadCharacter;
  }
}
