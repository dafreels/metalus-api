import {DisplayDialogService} from '../../../shared/services/display-dialog.service';
import {ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild,} from '@angular/core';
import {Pipeline, PipelineData, PipelineParameter, PipelineStepParam,} from '../../models/pipelines.model';
import {CodeEditorComponent} from '../../../code-editor/components/code-editor/code-editor.component';
import {ObjectEditorComponent} from '../../../shared/components/object-editor/object-editor.component';
import {PackageObject} from '../../../core/package-objects/package-objects.model';
import {SharedFunctions} from '../../../shared/utils/shared-functions';
import {generalDialogDimensions} from 'src/app/shared/models/custom-dialog.model';
import {BehaviorSubject} from 'rxjs';
import {MatSelect} from '@angular/material';
import {FormControl} from '@angular/forms';
import {TreeEditorComponent} from '../../../shared/components/tree-editor/tree-editor.component';
import {ScalaScriptComponent} from 'src/app/shared/scala-script/scala-script.component';

export interface SplitParameter {
  id: number;
  name: string;
  value: any;
  type: string;
  language?: string;
  className?: string;
  suggestions?: string[];
  customType?: string;
  extraPath?: string;
}

export interface StepGroupProperty {
  pipeline?: Pipeline;
  enabled: boolean;
}

@Component({
  selector: 'app-pipelines-parameter',
  templateUrl: './pipeline-parameter.component.html',
  styleUrls: ['./pipeline-parameter.component.scss'],
})
export class PipelineParameterComponent implements OnInit, OnDestroy {
  @Input() pipelinesData: PipelineData[] = [];
  @Input() stepType: string;
  @Input() stepSuggestions: string[];
  @Input() packageObjects: PackageObject[];
  @Input() pipelines: Pipeline[];
  @Input() isABranchStep: boolean;
  @Input() isAStepGroupResult: boolean;
  @Input() stepGroup: StepGroupProperty = { enabled: false };
  @Input() expandPanel: boolean = false;
  @Input() scalaParamType: boolean = false;
  @Input() previewMode: boolean = false;
  templateView = true;
  get showTemplate(){
    return this.template && this.templateView;
  }
  @Input() template;
  @Input() set templatePreview(template) {
    if(template === false) {
      return;
    }
    this.template = template;
    this.templateView  = true;
  }
  propertiesDialogResponse: any;
  @Output() selectedParam:EventEmitter<PipelineParameter> = new EventEmitter();
  param: PipelineStepParam;
  @Input()
  set stepParameters(stepParameter: PipelineStepParam) {
    this.param = stepParameter;
    if (stepParameter.value && typeof stepParameter.value === 'string') {
      const numberOfRepetitions = stepParameter.value.match(/&/g);
      if (numberOfRepetitions && numberOfRepetitions.length > 1) {
        stepParameter.value = stepParameter.value.slice(
          numberOfRepetitions.length - 1
        );
      }
    }

    this.parameterType = stepParameter.type;
    if (stepParameter.language) {
      this.isAScriptParameter = stepParameter.language;
      this.parameterType = 'script';
    } else if (stepParameter.type === 'script') {
      this.isAScriptParameter = 'script';
      this.parameterType = 'script';
    } else if (stepParameter.className && stepParameter.type !== 'script') {
      this.isAnObjectParameter = stepParameter.className;
      this.parameterType = 'object';
    } else if (stepParameter.type === 'object') {
      this.isAnObjectParameter = 'object';
      this.parameterType = 'object';
    } else if (stepParameter.type === 'text' && this.template) {
      stepParameter.type = 'template';
    } else if (stepParameter.type === 'text') {
      this.parameterType = 'text';
    } else if (stepParameter.type === 'list') {
      this.parameterType = 'list';
    }
    if (
      stepParameter.type !== 'result' &&
      stepParameter.value &&
      typeof stepParameter.value === 'string'
    ) {
      if (stepParameter.value.startsWith('&')) {
        this.parameterType = 'pipeline';
      }
      if (stepParameter.value.startsWith('!')) {
        this.parameterType = 'global';
      }
      if (stepParameter.value.startsWith('$')) {
        this.parameterType = 'runtime';
      }
      if (stepParameter.value.startsWith('?')) {
        this.parameterType = 'mapped_runtime';
      }
      if (stepParameter.value.startsWith('@')) {
        this.parameterType = 'step';
      }
      if (stepParameter.value.startsWith('#')) {
        this.parameterType = 'secondary';
      }
      if (stepParameter.value.startsWith('%')) {
        this.parameterType = 'credential';
      }
    }
    if (stepParameter) {
      this.parameter = stepParameter;
      this.parameterName = stepParameter.name;
      switch (stepParameter.type.toLowerCase()) {
        case 'object':
        case 'scalascript':
        case 'script':
        case 'template':
          this.complexParameter = true;
          this.parameters = [
            {
              id: this.id++,
              name: stepParameter.name,
              value: stepParameter.value,
              type: stepParameter.type == 'template' ? 'object': stepParameter.type,
              language: stepParameter.language,
              className: stepParameter.className,
            },
          ];
          break;
        case 'boolean':
        case 'integer':
          this.complexParameter = false;
          this.parameters = [
            {
              type: stepParameter.type,
              value: stepParameter.value,
              id: this.id++,
              suggestions: [],
              name: '',
            },
          ];
          break;
        default:
          if(this.template){
            return;
          }
          this.complexParameter = false;
          if (stepParameter.value) {
            let value;
            let type;
            let extraPath;
            this.parameters = stepParameter.value.split('||').map((e) => {
              extraPath = undefined;
              const isAPipeline = this.pipelinesData.find(
                (pipeline) => `&${pipeline.id}` === e
              );
              if (isAPipeline) {
                value = isAPipeline.name;
                type = 'pipeline';
              } else {
                value = e.trim();
                type = SharedFunctions.getType(value, stepParameter.type);
              }
              if (
                value &&
                (type === 'global' ||
                  type === 'credential' ||
                  type === 'runtime' ||
                  type === 'mapped_runtime')
              ) {
                value = value.substring(1);
              } else if (value && type === 'step' || type === 'secondary') {
                value = value.substring(1);
                if (value.indexOf('.') > -1) {
                  extraPath = value.substring(value.indexOf('.') + 1);
                  value = value.substring(0, value.indexOf('.'));
                }
              }
              return {
                id: this.id++,
                value,
                type,
                name: stepParameter.name,
                suggestions:
                  type === 'step' || type === 'secondary'
                    ? this.stepSuggestions.map((s) => s)
                    : [],
                extraPath,
              };
            });
          } else {
            this.parameters = [
              {
                type: stepParameter.type,
                value: stepParameter.type === 'boolean' ? false : '',
                id: this.id++,
                suggestions: [],
                name: '',
              },
            ];
            if (stepParameter.type !== 'result') {
              this.parameterType = 'text';
            }
          }
      }
    }
  }
  isAScriptParameter: string;
  isAnObjectParameter: string;
  hasNoStepGroup = false;
  parameterType: string;
  @Output() parameterUpdate = new EventEmitter<PipelineStepParam>();
  parameterName: string;
  parameters: SplitParameter[];
  complexParameter = false;
  parameter: PipelineStepParam;
  private id = 0;

  public filteredStepResponse: BehaviorSubject<string[]> = new BehaviorSubject<
    string[]
  >(null);
  @ViewChild('singleSelect', { static: false }) singleSelect: MatSelect;

  public filteredStepGroup: BehaviorSubject<string[]> = new BehaviorSubject<
    string[]
  >(null);
  public stepGroupControl: FormControl = new FormControl('');
  public stepGroupFilterCtrl: FormControl = new FormControl();

  constructor(
    private changeDetector: ChangeDetectorRef,
    private displayDialogService: DisplayDialogService
  ) {}

  ngOnDestroy() {
    if (this.propertiesDialogResponse) {
      this.propertiesDialogResponse.close();
    }
  }

  ngOnInit(): void {
    this.filteredStepResponse.next(this.stepSuggestions);

    const pipelinesName = this.pipelines
      ? this.pipelines.map((pipeline) => pipeline.name)
      : [];
    pipelinesName.length === 0
      ? (this.hasNoStepGroup = false)
      : (this.hasNoStepGroup = true);
    if (
      (this.parameters[0].name === 'pipeline' ||
        this.parameters[0].name === 'pipelineId') &&
      this.parameters[0].value
    ) {
      this.stepGroupControl.setValue(this.parameters[0].value.slice(1));
    }
    this.filteredStepGroup.next(pipelinesName);

    this.stepGroupFilterCtrl.valueChanges.subscribe(() => {
      this.filterList(
        pipelinesName,
        this.stepGroupFilterCtrl,
        this.filteredStepGroup
      );
    });
  }

  private filterList(
    arrayToBeFiltered,
    control: FormControl,
    arraySubject: BehaviorSubject<string[] | Pipeline[]>
  ) {
    if (!arrayToBeFiltered) {
      return;
    }
    let search = control.value;
    if (!search) {
      arraySubject.next(arrayToBeFiltered);
      return;
    } else {
      search = search.toLowerCase();
    }
    arraySubject.next(
      arrayToBeFiltered.filter((response) => {
        return response.toLowerCase().indexOf(search) > -1;
      })
    );
  }

  handleChange(id: number, selectedparameter?: SplitParameter) {
    this.parameter.type = this.parameterType;
    const paramType = selectedparameter
      ? selectedparameter.type.toLocaleLowerCase()
      : this.parameterType;
    if (selectedparameter && paramType === 'pipeline') {
      const inputData = this.parameters.find(
        (parameter) => parameter.id === id
      );
      inputData.value = this.stepGroupControl.value;
      this.stepGroup.pipeline = this.pipelines.find(
        (pipeline) => pipeline.name === this.stepGroupControl.value
      );
      this.handleChange(id);
      if (this.stepGroup.pipeline) {
        this.parameters[0].value = this.stepGroup.pipeline.name;
      }
    }

    const paramIndex = this.parameters.findIndex((p) => p.id === id);

    if (paramIndex !== -1) {
      const param = this.parameters[paramIndex];
      if (paramType === 'step' || paramType === 'secondary') {
        param.suggestions = this.stepSuggestions;
        if (selectedparameter) {
          selectedparameter.value = param.value;
        }
      } else {
        param.suggestions = [];
      }

      if (paramType === 'object' || paramType === 'script' ||
        paramType === 'list' || paramType === 'scalascript') {
        this.complexParameter = true;
        this.parameterType = paramType;
      } else {
        this.complexParameter = false;
      }
      this.parameters[paramIndex] = param;
    }
    let parameterValue = '';
    let count = 0;
    let extraPath;
    // TODO May need to ensure we don't mix primitives like boolean and integer
    this.parameters.forEach((p) => {
      if (p.extraPath) {
        extraPath = `.${p.extraPath}`;
      } else {
        extraPath = '';
      }
      if (paramType === 'list' && typeof p.value !== 'object') {
        p.value = [p.value];
      }
      if (typeof p.value === 'object') {
        parameterValue = p.value;
      } else if (count === 0) {
        parameterValue = `${SharedFunctions.getLeadCharacter(p.type)}${p.value}${extraPath}`;
      } else {
        parameterValue =
          `${parameterValue} || ${SharedFunctions.getLeadCharacter(p.type)}${p.value}${extraPath}`;
      }
      if (p.type === 'boolean' || p.type === 'integer' || p.type === 'list') {
        this.parameter.type = p.type;
      } else if (count > 1) {
        this.parameter.type = 'text';
      }
      count += 1;
    });
    if (
      this.parameter.type === 'boolean' &&
      ['true', 'false'].indexOf(parameterValue) >= 0
    ) {
      this.parameter.value = parameterValue === 'true';
    } else if (this.parameter.type === 'integer' && Number(parameterValue)) {
      this.parameter.value = Number(parameterValue);
    } else {
      this.parameter.value = parameterValue;
    }
    // Only used for object or script meaning there should be only 1 parameter
    this.parameter.language = this.isAScriptParameter;
    if (this.isAnObjectParameter !== 'object') {
      this.parameter.className = this.isAnObjectParameter;
    }
    this.changeDetector.detectChanges();
    this.parameterUpdate.emit(this.parameter);
  }

  removeClause(id: number) {
    this.parameters.splice(
      this.parameters.findIndex((p) => p.id === id),
      1
    );
    this.handleChange(id);
  }

  addClause() {
    this.parameters.push({
      id: this.id++,
      value: '',
      name: '',
      type: 'text',
    });
  }

  disableEditorButton(param: SplitParameter) {
    if(param.type === 'scalascript'){
      return false;
    }
    if(param.type === 'list' || param.type === 'object'){
      return false;
    }
    if (this.stepGroup.enabled) {
      return (
        (this.parameter.name === 'pipeline' &&
          this.parameterType !== 'pipeline') ||
        (this.parameter.name === 'pipelineId' && param.type !== 'text') ||
        (this.parameter.name === 'pipeline' &&
          this.parameterType === 'pipeline')
      );
    } else {
      return (
        this.parameterType !== 'object' &&
        this.parameterType !== 'script' &&
        this.parameterType !== 'list'
      );
    }
  }

  openEditor(id: number) {
    const inputData = this.parameters.find((p) => p.id === id);

    if (inputData.type === 'scalascript') {
      inputData.value = this.parameter.value || '';
      const propertiesDialogResponse = this.displayDialogService.openDialog(
        ScalaScriptComponent,
        generalDialogDimensions,
        {
          data: inputData,
          stepSuggestions: this.stepSuggestions,
        }
      );
      propertiesDialogResponse.afterClosed().subscribe((result) => {
        if (result) {
          inputData.value = result;
          this.parameterType = 'scalascript';
          this.handleChange(id);
        }
      });
    } else if (inputData.type === 'list') {
      let mappings = this.parameter.value || [];
      this.propertiesDialogResponse = this.displayDialogService.openDialog(
        TreeEditorComponent,
        generalDialogDimensions,
        {
          mappings,
          typeAhead: this.stepSuggestions,
          packageObjects: this.packageObjects,
        }
      );
      this.propertiesDialogResponse.afterClosed().subscribe((result) => {
        if (result) {
          inputData.value = result;
          this.handleChange(id);
        }
      });
    } else if (inputData.type === 'object') { // TODO All objects will use this for now
      let mappings = this.parameter.value || {};
      if (this.parameter.name === 'pipelineMappings' && this.stepGroup.pipeline) {
        const pipelineMappings = SharedFunctions.generatePipelineMappings(
          this.stepGroup.pipeline
        );
        mappings = Object.assign({}, pipelineMappings, mappings);
      }
      const propertiesDialogResponse = this.displayDialogService.openDialog(
        TreeEditorComponent,
        generalDialogDimensions,
        {
          mappings,
          typeAhead: this.stepSuggestions,
          packageObjects: this.packageObjects,
        }
      );
      propertiesDialogResponse.afterClosed().subscribe((result) => {
        if (result) {
          inputData.value = result;
          this.handleChange(id);
        }
      });
    } else if (!this.stepGroup.enabled) {
      switch (this.parameterType) {
        case 'script':
          const scriptDialogData = {
            code: inputData.value,
            language: inputData.language,
            allowSave: true,
          };
          const scriptDialogResponse = this.displayDialogService.openDialog(
            CodeEditorComponent,
            generalDialogDimensions,
            scriptDialogData
          );
          scriptDialogResponse.afterClosed().subscribe((result) => {
            if (result) {
              inputData.value = result.code;
              inputData.language = result.language;
              this.handleChange(id, inputData);
            }
          });
          break;
        case 'object':
          const schema = this.packageObjects.find(
            (p) => p.id === inputData.className
          );
          let pkgSchema;
          if (schema) {
            pkgSchema = JSON.parse(schema.schema);
          }
          const objectDialogData = {
            userObject: inputData.value,
            schema: pkgSchema,
            schemaName: inputData.className,
            pkgObjs: this.packageObjects,
          };
          const objectDialogResponse = this.displayDialogService.openDialog(
            ObjectEditorComponent,
            generalDialogDimensions,
            objectDialogData
          );
          objectDialogResponse.afterClosed().subscribe((result) => {
            if (result) {
              inputData.value = result.userObject;
              inputData.className = result.schemaName;
              this.handleChange(id, inputData);
            }
          });
          break;
      }
    }
  }
  selectParam(param, expanded){
    if(expanded) {
      this.selectedParam.emit(param);
    }
  }
  templateValueChanged(value) {
    this.parameter.value = value;
    this.parameter.type = 'template';
    this.parameterUpdate.emit(this.parameter);
  }
}
