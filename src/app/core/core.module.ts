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

@NgModule({
  imports: [
    CommonModule,
    SharedModule
  ],
  declarations: [
    ChangePasswordValidatorDirective,
    ChangePasswordModalComponent,
    LandingComponent,
    LoginComponent,
    NavMenuComponent,
    NavToolbarComponent,
    PageNotFoundComponent,
    ProfileComponent,
    UploadComponent,
    UsersComponent,
    UserMenuComponent,
    UsersModalComponent
  ],
  entryComponents: [
    ChangePasswordModalComponent,
    UsersModalComponent
  ],
  exports: [
    ChangePasswordModalComponent,
    LandingComponent,
    LoginComponent,
    NavMenuComponent,
    NavToolbarComponent,
    PageNotFoundComponent,
    ProfileComponent,
    UploadComponent,
    UsersComponent,
    UserMenuComponent,
    UsersModalComponent
  ]
})
export class CoreModule { }
