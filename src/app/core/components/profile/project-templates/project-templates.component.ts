import {Component, EventEmitter, OnInit, Output} from "@angular/core";
import {TemplatesService} from "../../../../shared/services/templates.service";
import {Template} from "../../../../shared/models/templates.model";

export interface TemplateState {
  checked?: boolean;
  disabled?: boolean;
  name: string;
  group: string;
}

@Component({
  selector: 'project-templates',
  templateUrl: './project-templates.component.html',
})
export class ProjectTemplatesComponent implements OnInit {
  fullTemplates: Template[];
  templates: TemplateState[] = [];
  sparkVersions: string[] = [];
  versions: string[] = [];
  selectedVersion = '';
  selectedSparkVersion = '';
  @Output() selectedTemplates = new EventEmitter<string[]>();

  constructor(private templatesService: TemplatesService) {}

  ngOnInit(): void {
    this.templatesService.getTemplates().subscribe(data => {
      this.fullTemplates = data;
      data.forEach(t => {
        if (this.sparkVersions.indexOf(t.sparkVersion) === -1) {
          this.sparkVersions.push(t.sparkVersion);
        }
        if (this.versions.indexOf(t.version) === -1) {
          this.versions.push(t.version);
        }
        if (this.templates.findIndex(template => template.group === t.group) === -1) {
          this.templates.push({
            checked: false,
            disabled: false,
            group: t.group,
            name: t.name
          });
        }
      })
    });
  }

  templatedClicked() {
    const selected = [];
    this.templates.filter(t => t.checked).forEach(template => {
      let libraryId = `${template.group}_${this.getScalaVersion(this.selectedSparkVersion)}-spark_${this.selectedSparkVersion}-${this.selectedVersion}`;
      if (selected.indexOf(libraryId) === -1) {
        selected.push(libraryId);
      }
      const fullTemplate = this.fullTemplates.find(t => t.id === libraryId);
      if (fullTemplate && fullTemplate.dependencies) {
        fullTemplate.dependencies.forEach(dep => {
          const dependentTemplate = this.templates.find(temp => temp.group === dep.group);
          if (dependentTemplate) {
            dependentTemplate.disabled = template.checked;
            dependentTemplate.checked = true;
            libraryId = `${dependentTemplate.group}_${this.getScalaVersion(this.selectedSparkVersion)}-spark_${this.selectedSparkVersion}-${this.selectedVersion}`;
            if (selected.indexOf(libraryId) === -1) {
              selected.push(libraryId);
            }
          }
        });
      }
    });
    this.selectedTemplates.emit(selected);
  }

  getScalaVersion(sparkVersion: string) {
    switch (sparkVersion) {
      case '2.4':
        return '2.11';
      case '3.0':
        return '2.12';
      default:
        return '2.11';
    }
  }
}
