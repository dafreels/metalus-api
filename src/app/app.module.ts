import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {LandingComponent} from './landing/landing.component';
import {ApplicationssService} from "./applications/applications.service";
import {StepsModule} from "./steps/steps.module"
import {SharedComponentsModule} from "./shared/shared.components";
import {AppRoutingModule} from "./routes.component";
import {CodeEditorModule} from "./code-editor/code.editor.module";
import {ObjectEditorModule} from "./object-editor/object.editor.module";
import {PipelinesModule} from "./pipelines/pipelines.module";
import {PackageObjectsModule} from "./packageObjects/package-objects.module";
import {WaitModalModule} from "./wait-modal/wait.modal.module";
import {NameDialogModule} from "./name-dialog/name.dialog.module";

@NgModule({
  imports: [
    SharedComponentsModule,
    StepsModule,
    AppRoutingModule,
    CodeEditorModule,
    NameDialogModule,
    ObjectEditorModule,
    PackageObjectsModule,
    PipelinesModule,
    WaitModalModule
  ],
  declarations: [
    AppComponent,
    LandingComponent
  ],
  providers: [
    ApplicationssService
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
}
