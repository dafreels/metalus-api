import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { LandingComponent } from './components/landing/landing.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { LoginComponent} from "./components/login/login.component";
import {ProfileComponent} from "./components/profile/profile.component";
import {ChangePasswordModalComponent} from "./components/changePassword/change-password-modal.component";
import {ChangePasswordValidatorDirective} from "./components/changePassword/change-password.directive";

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
    PageNotFoundComponent,
    ProfileComponent
  ],
  entryComponents: [
    ChangePasswordModalComponent,
  ],
  exports: [
    ChangePasswordModalComponent,
    LandingComponent,
    LoginComponent,
    PageNotFoundComponent,
    ProfileComponent
  ]
})
export class CoreModule { }
