import { NgModule } from '@angular/core';
import { ApplicationsEditorComponent } from './components/applications-editor/applications-editor.component';
import { SparkConfEditorComponent } from './components/spark-conf-editor/spark-conf-editor.component';
import { ComponentsEditorComponent } from './components/components-editor/components-editor.component';
import { SharedModule } from '../shared/shared.module';
import { DesignerModule } from '../designer/designer.module';
import { CodeEditorModule } from '../code-editor/code-editor.module';
import {ExecutionEditorComponent} from "./components/execution-editor/execution-editor.component";
import {DragDropModule} from "@angular/cdk/drag-drop";

@NgModule({
  imports: [
    SharedModule,
    CodeEditorModule,
    DesignerModule,
    DragDropModule
  ],
  declarations: [
    ApplicationsEditorComponent,
    ComponentsEditorComponent,
    ExecutionEditorComponent,
    SparkConfEditorComponent
  ],
  entryComponents: [
    SparkConfEditorComponent,
    ComponentsEditorComponent,
    ExecutionEditorComponent
  ]
})

export class ApplicationsModule {}
