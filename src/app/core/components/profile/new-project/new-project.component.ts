import {Component} from "@angular/core";
import {MatDialogRef} from "@angular/material/dialog";
import {Template} from "../../../../shared/models/templates.model";

export interface TemplateState extends Template {
  checked?: boolean;
}

@Component({
  templateUrl: './new-project.component.html',
})
export class NewProjectDialogComponent {
  name: string = '';
  selectedTemplates: string[];

  constructor(public dialogRef: MatDialogRef<NewProjectDialogComponent>) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  saveDialog() {
    this.dialogRef.close({
      name: this.name,
      selectedTemplates: this.selectedTemplates,
    });
  }

  setSelectedTemplates($event: string[]) {
    this.selectedTemplates = $event;
  }
}
