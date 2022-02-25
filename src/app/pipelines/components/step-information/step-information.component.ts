import {Component, Input, OnInit} from '@angular/core';
import {PipelineStep} from "../../models/pipelines.model";
import {Step} from "../../../steps/steps.model";
import {PrimitiveEditorDialogComponent} from "../../../applications/components/primitive-editor/primitive-editor-dialog.component";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";

@Component({
  selector: 'app-step-information',
  templateUrl: './step-information.component.html',
  styleUrls: ['./step-information.component.scss'],
})
export class StepInformationComponent implements OnInit {
  @Input() selectedStep: PipelineStep;
  @Input() selectedStepTemplate: Step;

  constructor(private displayDialogService: DisplayDialogService) {}

  ngOnInit() {}

  enableDescription() {
    const dialog = this.displayDialogService.openDialog(
      PrimitiveEditorDialogComponent,
      {
        width: '35%',
        height: '25%',
      },
      this.selectedStep.description || this.selectedStepTemplate.description);
    dialog.afterClosed().subscribe((desc) => {
      if (desc) {
        // Always set the changed description on the selected step
        this.selectedStep.description = desc;
      }
    });
  }
}
