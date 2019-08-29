import {NgModule} from "@angular/core";
import {StepsEditorComponent} from './steps.editor.component';
import {StepsFormComponent} from './form/steps.form.component';
import {StepsSelectorComponent} from './steps.selector.component';
import {StepsTreeComponent} from './tree/steps.tree.component';
import {StepsService} from "./steps.service";
import {SharedComponentsModule} from "../shared/shared.components"
import {StepsListComponent} from "./list/steps.list.component";
import {StepRoutingModule} from "./steps-routing.module";

@NgModule({
  imports: [
    SharedComponentsModule,
    StepRoutingModule
  ],
  declarations: [
    StepsEditorComponent,
    StepsFormComponent,
    StepsSelectorComponent,
    StepsTreeComponent,
    StepsListComponent
  ],
  exports: [
    StepsEditorComponent,
    StepsFormComponent,
    StepsSelectorComponent,
    StepsTreeComponent,
    StepsListComponent
  ],
  providers: [
    StepsService
  ]
})

export class StepsModule {}
