import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {StepsEditorComponent} from "./steps/steps.editor.component";
import {LandingComponent} from "./landing/landing.component";

const appRoutes: Routes = [
  {path: 'steps-editor', component: StepsEditorComponent},
  {path: '**', component: LandingComponent}, // The landing page should display by default
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
