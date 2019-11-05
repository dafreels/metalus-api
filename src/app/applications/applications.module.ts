import { NgModule } from '@angular/core';
import { ApplicationsEditorComponent } from './components/applications-editor/applications-editor.component';
import { SparkConfEditorComponent } from './components/spark-conf-editor/spark-conf-editor.component';
import { ComponentsEditorComponent } from './components/components-editor/components-editor.component';
import { SharedModule } from '../shared/shared.module';
import { DesignerModule } from '../designer/designer.module';
import { CodeEditorModule } from '../code-editor/code-editor.module';

@NgModule({
  imports: [
    SharedModule,
    DesignerModule,
    CodeEditorModule,
  ],
  declarations: [
    ApplicationsEditorComponent,
    ComponentsEditorComponent,
    SparkConfEditorComponent
  ],
  entryComponents: [
    SparkConfEditorComponent,
    ComponentsEditorComponent
  ]
})

export class ApplicationsModule {}
