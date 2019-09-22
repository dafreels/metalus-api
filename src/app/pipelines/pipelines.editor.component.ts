import {Component, OnInit} from "@angular/core";
import {PackageObjectsService} from "../packageObjects/package-objects.service";
import {IPackageObject} from "../packageObjects/package-objects.model";
import {IPipeline} from "./pipelines.model";
import {PipelinesService} from "./pipelines.service";
import {DesignerElement} from "../designer/designer.component";
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
  pipeline: IPipeline;
  steps: IStep[];
  dndSubject: Subject<DesignerElement> = new Subject<DesignerElement>();

  constructor(private stepsService: StepsService,
              private pipelinesService: PipelinesService,
              private packageObjectsService: PackageObjectsService,
              public dialog: MatDialog) {}

  ngOnInit(): void {
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
        this.dndSubject.next({
          event,
          icon: `../assets/${step.type}.png`,
          input: true,
          outputs,
          data: step,
          name: result
        })
      }
    });
  }
}
