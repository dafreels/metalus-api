import {NgModule} from "@angular/core";
import {StepsEditorComponent} from './steps.editor.component';
import {StepsSelectorComponent} from './selector/steps.selector.component';
import {StepsTreeComponent} from './selector/tree/steps.tree.component';
import {StepsService} from "./steps.service";
import {SharedComponentsModule} from "../shared/shared.components"
import {StepsListComponent} from "./selector/list/steps.list.component";
import {DesignerModule} from "../designer/designer.module";
import {ErrorModalComponent} from "../error-modal/error.modal.component";
import {ErrorModalModule} from "../error-modal/error.modal.module";

@NgModule({
  imports: [
    DesignerModule,
    ErrorModalModule,
    SharedComponentsModule
  ],
  declarations: [
    StepsEditorComponent,
    StepsSelectorComponent,
    StepsTreeComponent,
    StepsListComponent
  ],
  exports: [
    StepsEditorComponent,
    StepsSelectorComponent,
    StepsTreeComponent,
    StepsListComponent
  ],
  providers: [
    StepsService
  ]
})

export class StepsModule {}
