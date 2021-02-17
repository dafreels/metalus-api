import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Template} from "../../../../shared/models/templates.model";

export interface TemplateState extends Template {
  checked?: boolean;
}

@Component({
  templateUrl: './project-templates-dialog.component.html',
})
export class ProjectTemplatesDialogComponent {
  selectedTemplates: string[];
  preloadedLibraries: string[];

  constructor(public dialogRef: MatDialogRef<ProjectTemplatesDialogComponent>,
              @Inject(MAT_DIALOG_DATA) public data: string[]) {
    if (data && data.length > 0) {
      this.selectedTemplates = data;
      this.preloadedLibraries = data;
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  saveDialog() {
    this.dialogRef.close(this.selectedTemplates);
  }

  setSelectedTemplates($event: string[]) {
    this.selectedTemplates = $event;
  }
}
