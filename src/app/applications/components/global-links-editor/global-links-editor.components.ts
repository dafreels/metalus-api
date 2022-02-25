import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {Execution} from "../../applications.model";
import {Pipeline, PipelineStep} from "../../../pipelines/models/pipelines.model";

export interface GlobalLink {
  id: number;
  name: string;
  execution?: Execution;
  pipeline?: Pipeline;
  step?: PipelineStep;
  primary: boolean;
}

export interface GlobalLinkData {
  executions: Execution[];
  globalLinks: object;
  addName?: string;
}

@Component({
  selector: 'global-links-editor',
  templateUrl: './global-links-editor.components.html',
  styleUrls: ['./global-links-editor.components.scss'],
})
export class GlobalLinksEditorComponent {
  id = 0;
  globalLinks: GlobalLink[] = [];

  constructor(
    public dialogRef: MatDialogRef<GlobalLinksEditorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GlobalLinkData) {
    if (data.globalLinks) {
      let linkParts;
      let execution;
      let pipeline;
      Object.keys(data.globalLinks).forEach(key => {
        linkParts = data.globalLinks[key].split('.');
        execution = data.executions.find(exe => exe.id === linkParts[0].substring(1));
        pipeline = execution.pipelines.find(pipe => pipe.id === linkParts[2]);
        this.globalLinks.push({
          id: this.id++,
          name: key,
          execution,
          pipeline,
          step: pipeline.steps.find(step => step.id === linkParts[3]),
          primary: linkParts[4] === 'primaryReturn',
        });
      });
    }
    if (data.addName) {
      this.addGlobalLink(data.addName);
    }
  }

  addGlobalLink(name = '') {
    this.globalLinks.push({
      id: this.id++,
      name,
      execution: null,
      pipeline: null,
      step: null,
      primary: true,
    });
  }

  removeGlobalLink(globalLink: GlobalLink) {
    const index = this.globalLinks.findIndex(gl => gl.id === globalLink.id);
    this.globalLinks.splice(index, 1);
  }

  generateGlobalLinks() {
    const links = {};
    let returnValue;
    this.globalLinks.forEach(gl => {
      // Skip any link without a name, execution, pipeline or step
      if (gl.name.trim().length > 0 && gl.execution && gl.pipeline && gl.step) {
        returnValue = gl.primary ? 'primaryReturn' : 'namedReturns';
        links[gl.name.replace(' ', '_')] = `!${gl.execution.id}.pipelineParameters.${gl.pipeline.id}.${gl.step.id}.${returnValue}`;
      }
    });
    return links;
  }

  saveDialog() {
    this.dialogRef.close(this.generateGlobalLinks());
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
