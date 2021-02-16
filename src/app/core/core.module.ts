import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { LandingComponent } from './components/landing/landing.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { LoginComponent} from "./components/login/login.component";
import {ProfileComponent} from "./components/profile/profile.component";
import {ChangePasswordModalComponent} from "./components/profile/changePassword/change-password-modal.component";
import {ChangePasswordValidatorDirective} from "./components/profile/changePassword/change-password.directive";
import {UsersComponent} from "./components/users/users.component";
import {UsersModalComponent} from "./components/users/manage/users-modal.component";
import {NavMenuComponent} from "./components/nav-menu/nav-menu.component";
import {UserMenuComponent} from "./components/user-menu/user-menu.component";
import {UploadComponent} from "./components/upload/upload.component";
import {NavToolbarComponent} from "./components/nav-toolbar/nav-toolbar.component";
import { LogOutComponent } from './components/log-out/log-out.component';
import {HelpComponent} from "./components/help/help.component";
import {NewProjectDialogComponent} from "./components/profile/new-project/new-project.component";
import {ProjectTemplatesComponent} from "./components/profile/project-templates/project-templates.component";

@NgModule({
  imports: [
    CommonModule,
    SharedModule
  ],
  declarations: [
    ChangePasswordValidatorDirective,
    ChangePasswordModalComponent,
    HelpComponent,
    LandingComponent,
    LoginComponent,
    NavMenuComponent,
    NavToolbarComponent,
    NewProjectDialogComponent,
    PageNotFoundComponent,
    ProfileComponent,
    ProjectTemplatesComponent,
    UploadComponent,
    UsersComponent,
    UserMenuComponent,
    UsersModalComponent,
    LogOutComponent
  ],
  entryComponents: [
    ChangePasswordModalComponent,
    HelpComponent,
    LogOutComponent,
    NewProjectDialogComponent,
    UsersModalComponent
  ],
  exports: [
    ChangePasswordModalComponent,
    HelpComponent,
    LandingComponent,
    LoginComponent,
    NavMenuComponent,
    NavToolbarComponent,
    NewProjectDialogComponent,
    PageNotFoundComponent,
    ProfileComponent,
    UploadComponent,
    UsersComponent,
    UserMenuComponent,
    UsersModalComponent
  ]
})
export class CoreModule { }
