import {NgModule} from "@angular/core";
import {ApplicationsEditorComponent} from "./applications.editor.component";
import {ApplicationsService} from "./applications.service";
import {SharedComponentsModule} from "../shared/shared.components";
import {DesignerModule} from "../designer/designer.module";
import {MatChipsModule} from "@angular/material/chips";
import {SparkConfEditorComponent} from "./spark-conf-editor/spark.conf.editor.component";

@NgModule({
  imports: [
    DesignerModule,
    MatChipsModule,
    SharedComponentsModule
  ],
  declarations: [
    ApplicationsEditorComponent,
    SparkConfEditorComponent
  ],
  exports: [
    ApplicationsEditorComponent
  ],
  providers: [
    ApplicationsService
  ]
})

export class ApplicationsModule {}
