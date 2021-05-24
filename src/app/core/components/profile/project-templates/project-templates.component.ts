import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {TemplatesService} from "../../../../shared/services/templates.service";
import {Template} from "../../../../shared/models/templates.model";

export interface TemplateState {
  checked?: boolean;
  disabled?: boolean;
  name: string;
  group: string;
  lockedStatus: boolean;
  allowedVersions: string[];
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
  @Input() preloadedLibraries: string[] = [];

  constructor(private templatesService: TemplatesService) {}

  ngOnInit(): void {
    let version = '';
    let spark = '';
    const groups = [];
    if (this.preloadedLibraries && this.preloadedLibraries.length > 0) {
      const temp = this.preloadedLibraries[0];
      const index = temp.lastIndexOf('-');
      version = temp.substring(index + 1);
      spark = temp.substring(temp.indexOf('spark_') + 6, index);
      let group;
      this.preloadedLibraries.forEach(lib => {
        group = lib.substring(0, lib.indexOf('_'));
        if (groups.indexOf(group) === -1) {
          groups.push(group);
        }
      });
    }
    this.templatesService.getTemplates().subscribe(data => {
      this.fullTemplates = data;
      data.forEach(t => {
        if (this.sparkVersions.indexOf(t.sparkVersion) === -1) {
          this.sparkVersions.push(t.sparkVersion);
        }
        if (this.versions.indexOf(t.version) === -1) {
          this.versions.push(t.version);
        }
        let templateIndex = this.templates.findIndex(template => template.group === t.group);
        if (templateIndex === -1) {
          const existing = groups.indexOf(t.group) !== -1;
          this.templates.push({
            checked: existing,
            disabled: existing,
            group: t.group,
            name: t.name,
            lockedStatus: existing,
            allowedVersions: [t.version]
          });
        } else {
          this.templates[templateIndex].allowedVersions.push(t.version);
        }
      })
    });
    this.selectedSparkVersion = spark;
    this.selectedVersion = version;
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
          if (dependentTemplate && !dependentTemplate.lockedStatus) {
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

  selectVersion(version) {
    this.templates.forEach((template) => {
      if (template.allowedVersions.indexOf(version.value) === -1) {
        template.checked = false;
        template.disabled = true;
        template.lockedStatus = true;
      } else {
        template.lockedStatus = false;
        template.disabled = false;
      }
    });
  }
}
