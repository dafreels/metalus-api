import {NgModule} from "@angular/core";
import {StepsEditorComponent} from './steps.editor.component';
import {StepsFormComponent} from './form/steps.form.component';
import {StepsSelectorComponent} from './selector/steps.selector.component';
import {StepsTreeComponent} from './selector/tree/steps.tree.component';
import {StepsService} from "./steps.service";
import {SharedComponentsModule} from "../shared/shared.components"
import {StepsListComponent} from "./selector/list/steps.list.component";

@NgModule({
  imports: [
    SharedComponentsModule
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
