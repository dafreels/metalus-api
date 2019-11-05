import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './core/components/landing/landing.component';
import { PageNotFoundComponent } from './core/components/page-not-found/page-not-found.component';
import { ApplicationsEditorComponent } from './applications/components/applications-editor/applications-editor.component';
import { StepsEditorComponent } from './steps/components/steps-editor/steps-editor.component';
import { PipelinesEditorComponent } from './pipelines/components/pipelines-editor/pipelines-editor.component';

const appRoutes: Routes = [
  {path: 'applications-editor', component: ApplicationsEditorComponent},
  {path: 'steps-editor', component: StepsEditorComponent},
  {path: 'pipelines-editor', component: PipelinesEditorComponent},

  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: '**', component: PageNotFoundComponent},
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, { useHash: true })
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {
}
