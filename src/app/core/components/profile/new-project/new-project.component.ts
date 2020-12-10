import {Component, OnInit} from "@angular/core";
import {MatDialogRef} from "@angular/material/dialog";
import {Template} from "../../../../shared/models/templates.model";
import {TemplatesService} from "../../../../shared/services/templates.service";

export interface TemplateState extends Template {
  checked?: boolean;
}

@Component({
  templateUrl: './new-project.component.html',
})
export class NewProjectDialogComponent implements OnInit {
  templates: TemplateState[];
  name: string = '';

  constructor(public dialogRef: MatDialogRef<NewProjectDialogComponent>,
              private templatesService: TemplatesService) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  saveDialog() {
    this.dialogRef.close({
      name: this.name,
      selectedTemplates: this.templates.filter(t => t.checked).map(t => t.id),
    });
  }

  ngOnInit(): void {
    this.templatesService.getTemplates().subscribe(data => this.templates = data);
  }
}
