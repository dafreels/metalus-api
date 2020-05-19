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

const appRoutes: Routes = [
  {path: 'login', component: LoginComponent},
  {path: '', component: LandingComponent, pathMatch: 'full', canActivate: [AuthGuardService]},
  {path: 'applications-editor', component: ApplicationsEditorComponent, canActivate: [AuthGuardService]},
  {path: 'steps-editor', component: StepsEditorComponent, canActivate: [AuthGuardService]},
  {path: 'pipelines-editor', component: PipelinesEditorComponent, canActivate: [AuthGuardService]},
  {path: 'landing', component: LandingComponent, pathMatch: 'full', canActivate: [AuthGuardService]},
  {path: 'profile', component: ProfileComponent, pathMatch: 'full', canActivate: [AuthGuardService]},
  {path: 'users', component: UsersComponent, pathMatch: 'full', canActivate: [AuthGuardService]},
  {path: 'upload', component: UploadComponent, pathMatch: 'full', canActivate: [AuthGuardService]},
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
