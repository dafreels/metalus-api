import {Component, Input, OnInit} from "@angular/core";
import {PackageObjectsService} from "../packageObjects/package-objects.service";
import {IPackageObject} from "../packageObjects/package-objects.model";
import {IPipeline, IPipelineStep} from "./pipelines.model";
import {PipelinesService} from "./pipelines.service";
import {DesignerComponent, DesignerElement, DesignerModel} from "../designer/designer.component";
import {DndDropEvent} from "ngx-drag-drop";
import {Subject} from "rxjs";
import {NameDialogComponent} from "../name-dialog/name.dialog.component";
import {MatDialog} from "@angular/material/dialog";
import {StepsService} from "../steps/steps.service";
import {IStep} from "../steps/steps.model";


@Component({
  selector: 'pipelines-editor',
  templateUrl: './pipelines.editor.component.html',
  styleUrls: ['./pipelines.editor.component.css']
})
export class PipelinesEditorComponent implements OnInit {
  packageObjects: IPackageObject[];
  pipelines: IPipeline[];
  steps: IStep[];
  selectedPipeline: IPipeline;
  selectedStep: IPipelineStep;
  selectedElement: DesignerElement;
  designerModel: DesignerModel =  DesignerComponent.newModel();
  dndSubject: Subject<DesignerElement> = new Subject<DesignerElement>();

  constructor(private stepsService: StepsService,
              private pipelinesService: PipelinesService,
              private packageObjectsService: PackageObjectsService,
              public dialog: MatDialog) {}

  ngOnInit(): void {
    this.newPipeline();
    this.newStep();
    this.stepsService.getSteps().subscribe((steps: IStep[]) => {
      this.steps = steps;
    });

    this.pipelinesService.getPipelines().subscribe((pipelines: IPipeline[]) => {
      this.pipelines = pipelines;
    });

    this.packageObjectsService.getPackageObjects().subscribe((pkgObjs: IPackageObject[]) => {
      this.packageObjects = pkgObjs;
    });
  }

  @Input()
  set pipeline(pipeline: IPipeline) {
    if (pipeline) {
      this.selectedPipeline = pipeline;
    } else {
      this.newPipeline();
    }
  }

  @Input()
  set step(step: IPipelineStep) {
    if (step) {
      // TODO Should this be the step from the pipeline?
      this.selectedStep = step;
    } else {
      this.newStep();
    }
  }

  newPipeline() {
    this.selectedPipeline = {
      name: "",
      steps: [],
      id: '',
      category: 'pipeline'
    };
  }

  newStep() {
    this.selectedStep = {
      stepId: '',
      executeIfEmpty: '',
      nextStepId: '',
      category: '',
      description: '',
      displayName: '',
      id: '',
      params: [],
      type: '',
      engineMeta: {
        pkg: '',
        spark: '',
        stepResults: []
      }
    };
  }

  stepSelected(data: DesignerElement) {
    this.selectedStep = data.data as IPipelineStep;
    this.selectedElement = data;
  }

  /**
   * This method will handle changes to the id and ensure element name gets the change.
   */
  handleIdChange() {
    if (this.selectedElement) {
      this.selectedElement.name = this.selectedStep.id;
    }
  }

// TODO Add code to handle model changes
  addStep(event: DndDropEvent) {
    const dialogRef = this.dialog.open(NameDialogComponent, {
      width: '25%',
      height: '25%',
      data: {name: ''}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.trim().length > 0) {
        const step = JSON.parse(JSON.stringify(event.data));
        // Switch the id and stepId
        step.stepId = step.id;
        step.id = result;

        this.dndSubject.next({
          name: result,
          tooltip: step.description,
          icon: `../assets/${step.type}.png`,
          input: true,
          outputs: this.generateOutputs(step),
          data: step,
          event
        })
      }
    });
  }

  private generateOutputs(step) {
    let outputs = [];
    if (step.type.toLocaleLowerCase() === 'branch') {
      step.params.forEach((p) => {
        if (p.type.toLocaleLowerCase() === 'result') {
          outputs.push(p.name);
        }
      });
    } else {
      outputs.push('output');
    }
    return outputs;
  }

  loadPipeline(id: string) {
    this.selectedPipeline = this.pipelines.find(p => p.id === id);
    const model = DesignerComponent.newModel();
    // TODO Create logic to position the elements based on connections if layout is missing
    let nodeId;
    const nodeLookup = {};
    this.selectedPipeline.steps.forEach(step => {
      nodeId = `designer-node-${model.nodeSeq++}`;
      model.nodes[nodeId] = {
        data: {
          name: step.id,
          tooltip: step.description,
          icon: `../assets/${step.type}.png`,
          input: true,
          outputs: this.generateOutputs(step),
          data: step,
          event: undefined
        },
        x: this.selectedPipeline.layout && this.selectedPipeline.layout.x ? this.selectedPipeline.layout.x : 20,
        y: this.selectedPipeline.layout && this.selectedPipeline.layout.y ? this.selectedPipeline.layout.y : 20
      };
      nodeLookup[step.id] = nodeId;
    });
    // Add connections
    this.selectedPipeline.steps.forEach(step => {
      if (step.type !== 'branch' && step.nextStepId) {
        model.connections[`${nodeLookup[step.id]}::${nodeLookup[step.nextStepId]}`] = {
          sourceNodeId: nodeLookup[step.id],
          targetNodeId: nodeLookup[step.nextStepId],
          endpoints: [
            {
              sourceEndPoint: 'output',
              targetEndPoint: 'input'
            }
          ]
        };
      } else {
        let connection;
        step.params.filter(p => p.type.toLowerCase() === 'result').forEach(output => {
          connection = model.connections[`${nodeLookup[step.id]}::${nodeLookup[output.value]}`];
          if (!connection) {
            connection = {
              sourceNodeId: nodeLookup[step.id],
              targetNodeId: nodeLookup[output.value],
              endpoints: []
            };
          }
          connection.endpoints.push(
            {
              sourceEndPoint: output.name,
              targetEndPoint: 'input'
            }
          );
        });
      }
    });

    this.designerModel = model;
  }
}
