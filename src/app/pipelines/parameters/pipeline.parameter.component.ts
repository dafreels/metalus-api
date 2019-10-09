import {ChangeDetectorRef, Component, EventEmitter, Input, Output} from "@angular/core";
import {IPipelineStepParam} from "../pipelines.model";
import {CodeEditorComponent} from "../../code-editor/code.editor.component";
import {ObjectEditorComponent} from "../../object-editor/object.editor.component";
import {MatDialog} from "@angular/material/dialog";
import {IPackageObject} from "../../packageObjects/package-objects.model";

export interface SplitParameter {
  id: number;
  value: any;
  type: string;
  language?: string;
  className?: string;
  suggestions?: string[];
}

@Component({
  selector: 'pipelines-parameter',
  templateUrl: './pipeline.parameter.component.html',
  styleUrls: ['./pipeline.parameter.component.css']
})
export class PipelineParameterComponent {
  @Input() stepSuggestions: string[] = [];
  @Input() packageObjects: IPackageObject[];
  @Output() parameterUpdate = new EventEmitter<IPipelineStepParam>();
  leadCharacters: string[] = ['@', '!', '#', '$'];
  parameterName: string;
  parameters: SplitParameter[];
  complexParameter: boolean = false;
  _parameter: IPipelineStepParam;
  private id: number = 0;

  constructor(private dialog: MatDialog, private chaneDetector: ChangeDetectorRef) {}

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
              type = this.getType(value, 'text');
              if (value && (type === 'global' || type === 'step' || type === 'secondary' || type === 'runtime')) {
                value = value.substring(1);
              }
              return {
                id: this.id++,
                value,
                type,
                suggestions: (type === 'step' || type === 'secondary') ? this.stepSuggestions.map(s => s) : []
              };
            });
          } else {
            this.parameters = [
              {
                type: 'text',
                value: '',
                id: this.id++,
                suggestions: []
              }
            ];
          }
      }
    }
  }

  handleChange(id: number) {
    const paramIndex = this.parameters.findIndex(p => p.id === id);
    if (paramIndex !== -1) {
      const param = this.parameters[paramIndex];
      if (param.type === 'step' || param.type === 'secondary') {
        param.suggestions = this.stepSuggestions;
      } else {
        param.suggestions = [];
      }
      this.parameters[paramIndex] = param;
    }
    let parameterValue = '';
    let count = 0;
    this.parameters.forEach((p) => {
      if (count === 0) {
        parameterValue = PipelineParameterComponent.getLeadCharacter(p.type) + p.value;
      } else {
        parameterValue = `${parameterValue} || ${PipelineParameterComponent.getLeadCharacter(p.type) + p.value}`;
      }
      count += 1;
    });
    this._parameter.value = parameterValue;
    this._parameter.type = this.parameters.length > 1 ? 'text' : this.parameters[0].type;
    // Only used for object or script meaning there should be only 1 parameter
    this._parameter.language = this.parameters[0].language;
    this._parameter.className = this.parameters[0].className;

    this.chaneDetector.detectChanges();
    this.parameterUpdate.emit(this._parameter);
  }

  removeClause(id: number) {
    this.parameters.splice(this.parameters.findIndex(p => p.id === id), 1);
    this.handleChange(id);
  }

  addClause() {
    this.parameters.push({
      id: this.id++,
      value: '',
      type: 'text'
    });
  }

  openEditor() {
    const inputData = this.parameters[0];
    if (inputData.type === 'script') {
      const dialogRef = this.dialog.open(CodeEditorComponent, {
        width: '75%',
        height: '90%',
        data: {code: inputData.value, language: inputData.language, allowSave: true}
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result) {
          this._parameter.value = result.code;
          this._parameter.language = result.language;
        }
      });
    } else if (inputData.type === 'object') {
      const schema = this.packageObjects.find(p => p.id === inputData.className);
      let pkgSchema;
      if (schema) {
        pkgSchema = JSON.parse(schema.schema);
      }
      const dialogRef = this.dialog.open(ObjectEditorComponent, {
        width: '75%',
        height: '90%',
        data: {userObject: inputData.value, schema: pkgSchema, schemaName: inputData.className, pkgObjs: this.packageObjects }
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result) {
          this._parameter.value = result.userObject;
          this._parameter.className = result.schemaName;
        }
      });
    }
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

  private static getLeadCharacter(type: string) {
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
