import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {LandingComponent} from "./landing/landing.component";
import {StepsEditorComponent} from "./steps/steps.editor.component";
import {PipelinesEditorComponent} from "./pipelines/pipelines.editor.component";
import {ApplicationsEditorComponent} from "./applications/applications.editor.component";

const appRoutes: Routes = [
  {path: 'applications-editor', component: ApplicationsEditorComponent},
  {path: 'steps-editor', component: StepsEditorComponent},
  {path: 'pipelines-editor', component: PipelinesEditorComponent},
  {path: 'landing', component: LandingComponent}, // The landing page should display by default
  // {path: '', redirectTo: 'landing', pathMatch: 'full'},
  {path: '**', component: LandingComponent}, // TODO Add an error page here
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes, { useHash: true, enableTracing: false})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
