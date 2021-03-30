import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LandingComponent} from './core/components/landing/landing.component';
import {PageNotFoundComponent} from './core/components/page-not-found/page-not-found.component';
import {ApplicationsEditorComponent} from './applications/components/applications-editor/applications-editor.component';
import {StepsEditorComponent} from './steps/components/steps-editor/steps-editor.component';
import {PipelinesEditorComponent} from './pipelines/components/pipelines-editor/pipelines-editor.component';
import {LoginComponent} from "./core/components/login/login.component";
import {AuthGuardService} from "./shared/services/auth-gaurd.service";
import {ProfileComponent} from "./core/components/profile/profile.component";
import {UsersComponent} from "./core/components/users/users.component";
import {UploadComponent} from "./core/components/upload/upload.component";
import {ConfirmPipelineDeactivateGuard} from './shared/guards/confirm-pipeline-deactivate-guard.service';
import {CustomParameterEditorComponent} from './pipelines/components/custom-parameter-editor/custom-parameter-editor.component';
import {ProvidersComponent} from "./jobs/components/providers/providers.component";
import {ConfirmApplicationDeactivateGuard} from "./shared/guards/confirm-application-deactivate-gaurd.service";

const appRoutes: Routes = [
  {path: 'login', component: LoginComponent, canDeactivate:[ConfirmPipelineDeactivateGuard, ConfirmApplicationDeactivateGuard]},
  {path: '', component: LandingComponent, pathMatch: 'full', canActivate: [AuthGuardService],
    data :{ page:"landing", title:"Home"}},
  {path: 'applications-editor', component: ApplicationsEditorComponent, canActivate: [AuthGuardService],
    canDeactivate:[ConfirmApplicationDeactivateGuard], data :{ page:"applications-editor", title:"Applications Editor"}},
  {path: 'providers', component: ProvidersComponent, canActivate: [AuthGuardService],
    data :{ page:"providers", title:"Providers"}},
  {path: 'custom-form-editor', component: CustomParameterEditorComponent, canActivate: [AuthGuardService],
    data :{ page:"custom-form-editor", title:"Custom Form Editor"}},
  {path: 'steps-editor', component: StepsEditorComponent, canActivate: [AuthGuardService]},
  {path: 'pipelines-editor', component: PipelinesEditorComponent, canActivate: [AuthGuardService],
    canDeactivate:[ConfirmPipelineDeactivateGuard], data :{ page:"pipelines-editor", title:"Pipelines Editor"}},
  {path: 'landing', component: LandingComponent, pathMatch: 'full', canActivate: [AuthGuardService],
    data :{ page:"landing", title:"Home"}},
  {path: 'profile', component: ProfileComponent, pathMatch: 'full', canActivate: [AuthGuardService],
    data :{ page:"profile", title:"Profile"}},
  {path: 'users', component: UsersComponent, pathMatch: 'full', canActivate: [AuthGuardService],
    data :{ page:"users", title:"Users"}},
  {path: 'upload', component: UploadComponent, pathMatch: 'full', canActivate: [AuthGuardService],
    data :{ page:"upload", title:"Upload Jars"}},
  {path: '**', component: PageNotFoundComponent},
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
