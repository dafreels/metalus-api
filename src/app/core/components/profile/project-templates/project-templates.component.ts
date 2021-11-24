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
  fullTemplate: Template;
  templates: TemplateState[] = [];
  sparkVersions: string[] = [];
  scalaVersions: string[] = [];
  versions: string[] = [];
  selectedVersion = '';
  selectedSparkVersion = '';
  selectedScalaVersion = '';
  @Output() selectedTemplates = new EventEmitter<string[]>();
  @Input() preloadedLibraries: string[] = [];

  constructor(private templatesService: TemplatesService) {}

  ngOnInit(): void {
    let version = '';
    let spark = '';
    let scala = '';
    const groups = [];
    if (this.preloadedLibraries && this.preloadedLibraries.length > 0) {
      const temp = this.preloadedLibraries[0];
      const index = temp.lastIndexOf('-');
      version = temp.substring(index + 1);
      spark = temp.substring(temp.indexOf('spark_') + 6, index);
      scala = temp.substring(temp.indexOf('_') + 1, temp.lastIndexOf('-spark_'));
      let group;
      this.preloadedLibraries.forEach(lib => {
        group = lib.substring(0, lib.indexOf('_'));
        if (groups.indexOf(group) === -1) {
          groups.push(group);
        }
      });
    }
    this.templatesService.getTemplate().subscribe(data => {
      this.fullTemplate = data;
      data.libraries.forEach((l) => {
        l.versions.forEach(v => {
          if (this.versions.indexOf(v) === -1) {
            this.versions.push(v);
          }
        });
      });
      if (version.length > 0) {
        this.selectedVersion = version;
        this.selectVersion(version);
      }
      if (scala.length > 0) {
        this.selectedScalaVersion = scala;
        this.selectScalaVersion(scala);
      }
      this.selectedSparkVersion = spark;
    });
  }

  templatedClicked() {
    const selected = [];
    this.templates.filter(t => t.checked).forEach(template => {
      let libraryId = `${template.group}_${this.selectedScalaVersion}-spark_${this.selectedSparkVersion}-${this.selectedVersion}`;
      if (selected.indexOf(libraryId) === -1) {
        selected.push(libraryId);
      }
      const library = this.fullTemplate.libraries.find(lib => lib.versions.indexOf(this.selectedVersion) > -1);
      const projectSet = this.fullTemplate.projectSets.find(p => p.name === library.projectSet);
      const project = projectSet.components.find(c => c.artifact == template.group);
      project.dependencies.forEach(dep => {
        const dependentTemplate = this.templates.find(temp => temp.group === dep);
        if (dependentTemplate && !dependentTemplate.lockedStatus) {
          dependentTemplate.disabled = template.checked;
          dependentTemplate.checked = true;
          libraryId = `${dependentTemplate.group}_${this.selectedScalaVersion}-spark_${this.selectedSparkVersion}-${this.selectedVersion}`;
          if (selected.indexOf(libraryId) === -1) {
            selected.push(libraryId);
          }
        }
      });
    });
    this.selectedTemplates.emit(selected);
  }

  selectVersion(version) {
    const library = this.fullTemplate.libraries.find(lib => lib.versions.indexOf(version.value) === -1);
    this.scalaVersions = [];
    this.sparkVersions = [];
    this.selectedScalaVersion = null;
    this.selectedSparkVersion = null;
    const temp = [];
    library.scala_spark_versions.forEach(ssv => {
      if (temp.indexOf(ssv.scala) === -1) {
        temp.push(ssv.scala);
      }
    });
    this.scalaVersions = temp;
    this.templates = [];
    const projectSet = this.fullTemplate.projectSets.find(p => p.name === library.projectSet);
    projectSet.components.forEach(component => {
      let templateIndex = this.templates.findIndex(template => template.group === component.artifact);
      if (templateIndex === -1) {
        this.templates.push({
          checked: false,
          disabled: false,
          group: component.artifact,
          name: component.name,
          lockedStatus: false,
          allowedVersions: []
        });
      }
    });
  }

  selectScalaVersion(version) {
    const library = this.fullTemplate.libraries.find(lib => lib.versions.indexOf(this.selectedVersion) > -1);
    const temp = [];
    this.selectedSparkVersion = null;
    library.scala_spark_versions.forEach(ssv => {
      if (version.value === ssv.scala && temp.indexOf(ssv.spark) === -1) {
        temp.push(ssv.spark);
      }
    });
    this.sparkVersions = temp;
  }
}
