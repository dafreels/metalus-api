import { NgModule } from '@angular/core';
import { ApplicationsEditorComponent } from './components/applications-editor/applications-editor.component';
import { SparkConfEditorComponent } from './components/spark-conf-editor/spark-conf-editor.component';
import { ComponentsEditorComponent } from './components/components-editor/components-editor.component';
import { SharedModule } from '../shared/shared.module';
import { DesignerModule } from '../designer/designer.module';
import { CodeEditorModule } from '../code-editor/code-editor.module';
import {DragDropModule} from "@angular/cdk/drag-drop";
import {CoreModule} from "../core/core.module";
import {UDFEditorComponent} from "./components/udf-editor/udf-editor.component";

@NgModule({
  imports: [
    SharedModule,
    CodeEditorModule,
    CoreModule,
    DesignerModule,
    DragDropModule
  ],
  declarations: [
    ApplicationsEditorComponent,
    ComponentsEditorComponent,
    SparkConfEditorComponent,
    UDFEditorComponent
  ],
  entryComponents: [
    ComponentsEditorComponent,
    SparkConfEditorComponent,
    UDFEditorComponent
  ]
})

export class ApplicationsModule {}
