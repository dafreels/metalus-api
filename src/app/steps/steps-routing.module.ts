import {RouterModule, Routes} from "@angular/router";
import {NgModule} from "@angular/core";
import {StepsFormComponent} from "./form/steps.form.component";
import {StepsEditorComponent} from "./steps.editor.component";

const stepRoutes: Routes = [
  {
    path: 'steps-editor', component: StepsEditorComponent,
    children: [
      {
        path: 'steps-form',
        component: StepsFormComponent,
        outlet: 'stepForm',
        children: [
          {
            path: ':id',
            component: StepsFormComponent,
            outlet: 'stepForm'
          },
          {
            path: '',
            component: StepsFormComponent,
            outlet: 'stepForm'
          }
        ]
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(stepRoutes)],
  exports: [RouterModule]
})
export class StepRoutingModule {}
