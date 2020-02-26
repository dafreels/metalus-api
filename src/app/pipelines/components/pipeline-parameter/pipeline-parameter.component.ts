import { DisplayDialogService } from './../../../shared/services/display-dialog.service';
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnInit,
} from '@angular/core';
import {
  Pipeline,
  PipelineStepParam,
  PipelineData,
} from '../../models/pipelines.model';
import { CodeEditorComponent } from '../../../code-editor/components/code-editor/code-editor.component';
import { ObjectEditorComponent } from '../../../shared/components/object-editor/object-editor.component';
import { PackageObject } from '../../../core/package-objects/package-objects.model';
import { SharedFunctions } from '../../../shared/utils/shared-functions';
import { PropertiesEditorModalComponent } from '../../../shared/components/properties-editor/modal/properties-editor-modal.component';
import { PipelinesSelectorModalComponent } from '../pipelines-selector-modal/pipelines-selector-modal.component';
import {
  generalDialogDimensions,
  DialogDimensions,
} from 'src/app/shared/models/custom-dialog.model';
import { BehaviorSubject } from 'rxjs';
import { MatSelect } from '@angular/material';
import { FormControl, Form } from '@angular/forms';

export interface SplitParameter {
  id: number;
  value: any;
  type: string;
  language?: string;
  className?: string;
  suggestions?: string[];
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
export class PipelineParameterComponent implements OnInit {
  @Input() pipelinesData: PipelineData[];
  @Input() stepType: string;
  @Input() stepSuggestions: string[];
  @Input() packageObjects: PackageObject[];
  @Input() pipelines: Pipeline[];
  @Input() stepGroup: StepGroupProperty = { enabled: false };
  isAScriptParameter: string;
  isAnObjectParameter: string;
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
  public stepResponseControl: FormControl = new FormControl();
  public stepResponseFilterCtrl: FormControl = new FormControl();

  public filteredStepGroup: BehaviorSubject<Pipeline[]> = new BehaviorSubject<
    Pipeline[]
  >(null);
  public stepGroupControl: FormControl = new FormControl();
  public stepGroupFilterCtrl: FormControl = new FormControl();

  constructor(
    private chaneDetector: ChangeDetectorRef,
    private displayDialogService: DisplayDialogService
  ) {}

  ngOnInit(): void {
    this.stepResponseControl.setValue(this.stepSuggestions);
    this.filteredStepResponse.next(this.stepSuggestions);

    this.stepGroupControl.setValue(this.pipelines);
    this.filteredStepGroup.next(this.pipelines);

    // listen for search field value changes
    this.stepResponseFilterCtrl.valueChanges.subscribe(() => {
      this.filterList(
        this.stepSuggestions,
        this.stepResponseFilterCtrl,
        this.filteredStepResponse
      );
    });

    this.stepGroupFilterCtrl.valueChanges.subscribe(() => {
      this.filterList(
        this.pipelines,
        this.stepGroupFilterCtrl,
        this.filteredStepGroup
      );
    });
  }

  stepGroupSelection(id: number) {
    const inputData = this.parameters.find((parameter) => parameter.id === id);
    this.stepGroupControl.valueChanges.subscribe((response: Pipeline) => {
      inputData.value = response.name;
      this.stepGroup.pipeline = response;
      this.handleChange(id);
      this.parameters[0].value = this.stepGroup.pipeline.name;
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
        if (typeof response === 'object') {
          return response.name.toLowerCase().indexOf(search) > -1;
        } else {
          return response.toLowerCase().indexOf(search) > -1;
        }
      })
    );
  }

  @Input()
  set stepParameters(stepParameter: PipelineStepParam) {
    if (stepParameter.language) {
      this.isAScriptParameter = stepParameter.language;
    } else if (stepParameter.type === 'script') {
      this.isAScriptParameter = 'script';
    }
    if (stepParameter.className) {
      this.isAnObjectParameter = stepParameter.className;
    } else if (stepParameter.type === 'object') {
      this.isAnObjectParameter = 'object';
    }
    if (stepParameter) {
      this.parameter = stepParameter;
      this.parameterName = stepParameter.name;
      switch (stepParameter.type.toLowerCase()) {
        case 'object':
        case 'script':
          this.complexParameter = true;
          this.parameters = [
            {
              id: this.id++,
              value: stepParameter.value,
              type: stepParameter.type,
              language: stepParameter.language,
              className: stepParameter.className,
            },
          ];
          break;

        default:
          if (stepParameter.value) {
            let value;
            let type;
            this.parameters = stepParameter.value.split('||').map((e) => {
              const isAPipeline = this.pipelinesData.find(
                (pipeline) => `&${pipeline.id}` === e
              );
              if (isAPipeline) {
                value = isAPipeline.name;
                type = 'pipeline';
              } else {
                value = e.trim();
                type = SharedFunctions.getType(value, 'text');
              }
              if (
                value &&
                (type === 'global' ||
                  type === 'step' ||
                  type === 'secondary' ||
                  type === 'runtime')
              ) {
                value = value.substring(1);
              }
              return {
                id: this.id++,
                value,
                type,
                suggestions:
                  type === 'step' || type === 'secondary'
                    ? this.stepSuggestions.map((s) => s)
                    : [],
              };
            });
          } else {
            this.parameters = [
              {
                type: 'text',
                value: '',
                id: this.id++,
                suggestions: [],
              },
            ];
          }
      }
    }
  }

  handleChange(id: number, selectedparameter?: SplitParameter) {
    if (selectedparameter) {
      if (
        selectedparameter.value !== '' &&
        selectedparameter.type !== 'pipeline'
      ) {
        selectedparameter.value = '';
      }
    }
    const paramIndex = this.parameters.findIndex((p) => p.id === id);

    if (paramIndex !== -1) {
      const param = this.parameters[paramIndex];
      if (param.type === 'step' || param.type === 'secondary') {
        param.suggestions = this.stepSuggestions;
      } else {
        param.suggestions = [];
      }

      this.complexParameter =
        param.type === 'object' || param.type === 'script';
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
        parameterValue = `${parameterValue} || ${SharedFunctions.getLeadCharacter(
          p.type
        ) + p.value}`;
      }
      count += 1;
    });
    this.parameter.value = parameterValue;
    this.parameter.type =
      this.parameters.length > 1 ? 'text' : this.parameters[0].type;
    // Only used for object or script meaning there should be only 1 parameter
    this.parameter.language = this.isAScriptParameter;
    this.parameter.className = this.isAnObjectParameter;
    this.chaneDetector.detectChanges();
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
      type: 'text',
    });
  }

  disableEditorButton(param: SplitParameter) {
    if (this.stepGroup.enabled) {
      if (this.parameter.name === 'pipeline' && param.type !== 'pipeline') {
        return true;
      } else if (
        this.parameter.name === 'pipelineId' &&
        param.type !== 'text'
      ) {
        return true;
      } else if (
        this.parameter.name === 'pipeline' &&
        param.type === 'pipeline'
      ) {
        return true;
      }
      return false;
    } else {
      return param.type !== 'object' && param.type !== 'script';
    }
  }

  openEditor(id: number) {
    const inputData = this.parameters.find((p) => p.id === id);

    if (!this.stepGroup.enabled) {
      switch (inputData.type) {
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
              this.handleChange(id);
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
              this.handleChange(id);
            }
          });
          break;
      }
    } else if (this.stepGroup && this.parameter.name === 'pipelineMappings') {
      let mappings = this.parameter.value || {};
      if (this.stepGroup.pipeline) {
        const pipelineMappings = SharedFunctions.generatePipelineMappings(
          this.stepGroup.pipeline
        );
        mappings = Object.assign({}, pipelineMappings, mappings);
      }
      const propertiesDialogData = {
        propertiesObject: mappings,
        allowSpecialParameters: true,
        packageObjects: this.packageObjects,
      };
      const propertiesDialogResponse = this.displayDialogService.openDialog(
        PropertiesEditorModalComponent,
        generalDialogDimensions,
        propertiesDialogData
      );
      propertiesDialogResponse.afterClosed().subscribe((result) => {
        if (result) {
          inputData.value = result.value;
          this.handleChange(id);
        }
      });
    }
  }
}
