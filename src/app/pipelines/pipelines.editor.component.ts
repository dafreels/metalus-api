import {Component, OnInit} from "@angular/core";
import {PackageObjectsService} from "../packageObjects/package-objects.service";
import {IPackageObject} from "../packageObjects/package-objects.model";
import {IPipeline} from "./pipelines.model";
import {PipelinesService} from "./pipelines.service";
import {DesignerSource} from "../designer/designer.component";


@Component({
  selector: 'pipelines-editor',
  templateUrl: './pipelines.editor.component.html',
  styleUrls: ['./pipelines.editor.component.css']
})
export class PipelinesEditorComponent extends DesignerSource implements OnInit {
  packageObjects: IPackageObject[];
  pipelines: IPipeline[];
  pipeline: IPipeline;
  constructor(private pipelinesService: PipelinesService,
              private packageObjectsService: PackageObjectsService) {
    super();
  }

  ngOnInit(): void {
    this.pipelinesService.getPipelines().subscribe((pipelines: IPipeline[]) => {
      this.pipelines = pipelines;
    });

    this.packageObjectsService.getPackageObjects().subscribe((pkgObjs: IPackageObject[]) => {
      this.packageObjects = pkgObjs;
    });
  }
}
