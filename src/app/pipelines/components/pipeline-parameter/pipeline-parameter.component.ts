import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { IPipeline, IPipelineStepParam } from '../../pipelines.model';
import { CodeEditorComponent } from '../../../code-editor/components/code-editor/code-editor.component';
import { ObjectEditorComponent } from '../../../shared/components/object-editor/object-editor.component';
import { MatDialog } from '@angular/material/dialog';
import { IPackageObject } from '../../../core/package-objects/package-objects.model';
import { SharedFunctions } from '../../../shared/utils/shared-functions';
import { PropertiesEditorModalComponent } from '../../../shared/components/properties-editor/modal/properties-editor-modal.component';
import { PipelinesSelectorModalComponent } from '../pipelines-selector-modal/pipelines-selector-modal.component';

export interface SplitParameter {
  id: number;
  value: any;
  type: string;
  language?: string;
  className?: string;
  suggestions?: string[];
}

export interface StepGroupProperty {
  pipeline?: IPipeline;
  enabled: boolean;
}

@Component({
  selector: 'app-pipelines-parameter',
  templateUrl: './pipeline-parameter.component.html',
  styleUrls: ['./pipeline-parameter.component.css']
})
export class PipelineParameterComponent {
  @Input() stepSuggestions: string[] = [];
  @Input() packageObjects: IPackageObject[];
  @Input() pipelines: IPipeline[];
  @Input() stepGroup: StepGroupProperty = { enabled: false };
  @Output() parameterUpdate = new EventEmitter<IPipelineStepParam>();
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
              type = SharedFunctions.getType(value, 'text');
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
      if (typeof p.value === 'object') {
        parameterValue = p.value;
      } else if (count === 0) {
        parameterValue = SharedFunctions.getLeadCharacter(p.type) + p.value;
      } else {
        parameterValue = `${parameterValue} || ${SharedFunctions.getLeadCharacter(p.type) + p.value}`;
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

  disableEditorButton(param: SplitParameter) {
    if (this.stepGroup.enabled) {
      if (this._parameter.name === 'pipeline' && param.type !== 'pipeline') {
        return true;
      } else if (this._parameter.name === 'pipelineId' && param.type !== 'text') {
        return true;
      }
      return false;
    } else {
      return param.type !== 'object' && param.type !== 'script'
    }
  }

  openEditor(id: number) {
    const inputData = this.parameters.find(p => p.id === id);
    if (this.stepGroup && this._parameter.name == 'pipelineMappings') {
      let mappings = this._parameter.value || {};
      if (this.stepGroup.pipeline) {
        const pipelineMappings = SharedFunctions.generatePipelineMappings(this.stepGroup.pipeline);
        mappings = Object.assign({}, pipelineMappings, mappings);
      }
      const dialogRef = this.dialog.open(PropertiesEditorModalComponent, {
        width: '75%',
        height: '90%',
        data: { propertiesObject: mappings, allowSpecialParameters: true, packageObjects: this.packageObjects }
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result) {
          inputData.value = result.value;
          this.handleChange(id);
        }
      });
    } else if (this.stepGroup) {
      if (this._parameter.name == 'pipelineId' || (this._parameter.name == 'pipeline' && inputData.type === 'pipeline')) {
        const dialogRef = this.dialog.open(PipelinesSelectorModalComponent, {
          width: '50%',
          height: '25%',
          data: this.pipelines
        });
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            inputData.value = result;
            this.stepGroup.pipeline = this.pipelines.find(p => p.id === result);
            this.handleChange(id);
          }
        });
      }
    } else if (inputData.type === 'script') {
      const dialogRef = this.dialog.open(CodeEditorComponent, {
        width: '75%',
        height: '90%',
        data: {code: inputData.value, language: inputData.language, allowSave: true}
      });
      dialogRef.afterClosed().subscribe(result => {
        if(result) {
          inputData.value = result.code;
          inputData.language = result.language;
          this.handleChange(id);
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
          inputData.value = result.userObject;
          inputData.className = result.schemaName;
          this.handleChange(id);
        }
      });
    }
  }
}
