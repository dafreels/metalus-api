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
import {IStep, StaticSteps} from "../steps/steps.model";

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
      steps.push(StaticSteps.FORK_STEP);
      steps.push(StaticSteps.JOIN_STEP);
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
        x: this.selectedPipeline.layout && this.selectedPipeline.layout[step.id].x ? this.selectedPipeline.layout[step.id].x : -1,
        y: this.selectedPipeline.layout && this.selectedPipeline.layout[step.id].y ? this.selectedPipeline.layout[step.id].y : -1
      };
      nodeLookup[step.id] = nodeId;
    });
    // Add connections
    let connectedNodes = [];
    this.selectedPipeline.steps.forEach(step => {
      if (step.type !== 'branch' && step.nextStepId) {
        model.connections[`${nodeLookup[step.id]}::${nodeLookup[step.nextStepId]}`] = {
          sourceNodeId: nodeLookup[step.id],
          targetNodeId: nodeLookup[step.nextStepId],
          endpoints: [{
              sourceEndPoint: 'output',
              targetEndPoint: 'input'
            }]
        };
        connectedNodes.push(step.nextStepId);
      } else {
        let connection;
        step.params.filter(p => p.type.toLowerCase() === 'result').forEach(output => {
          if (output.value) {
            connectedNodes.push(output.value);
            connection = model.connections[`${nodeLookup[step.id]}::${nodeLookup[output.value]}`];
            if (!connection) {
              connection = {
                sourceNodeId: nodeLookup[step.id],
                targetNodeId: nodeLookup[output.value],
                endpoints: []
              };
              model.connections[`${nodeLookup[step.id]}::${nodeLookup[output.value]}`] = connection;
            }
            connection.endpoints.push({
                sourceEndPoint: output.name,
                targetEndPoint: 'input'
              });
          }
        });
      }
    });
    // See if automatic layout needs to be applied
    if (!this.selectedPipeline.layout ||
      Object.keys(this.selectedPipeline.layout).length === 0) {
      this.performAutoLayout(nodeLookup, connectedNodes, model);
    }
    this.designerModel = model;
  }

  // TODO This may need to be moved to the designer component
  // TODO This is a basic layout algorithm, need to try to use a proper library like dagre
  private performAutoLayout(nodeLookup, connectedNodes, model) {
    let x = 300;
    let y = 50;
    const nodeId = nodeLookup[Object.keys(nodeLookup).filter(key => connectedNodes.indexOf(key) === -1)[0]];
    const rootNode = model.nodes[nodeLookup[Object.keys(nodeLookup).filter(key => connectedNodes.indexOf(key) === -1)[0]]];
    this.setNodeCoordinates(model, nodeLookup, rootNode, nodeId, x, y);
  }

  private setNodeCoordinates(model, nodeLookup, parentNode, nodeId, x, y) {
    if (parentNode.x === -1) {
      parentNode.x = x;
    }
    parentNode.y = y;
    const children = Object.keys(model.connections).filter(key => key.indexOf(nodeId) === 0);
    const totalWidth = children.length * 80;
    y += 125;
    x = children.length === 1 ? x : x - (totalWidth / 2);
    let childNode;
    children.forEach(child => {
      nodeId = model.connections[child].targetNodeId;
      childNode = model.nodes[nodeId];
      this.setNodeCoordinates(model, nodeLookup, childNode, nodeId, x, y);
      x += 80;
    });
  }
}
