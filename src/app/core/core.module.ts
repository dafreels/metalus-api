import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { LandingComponent } from './components/landing/landing.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { LoginComponent} from "./components/login/login.component";
import {ProfileComponent} from "./components/profile/profile.component";

@NgModule({
  imports: [
    CommonModule,
    SharedModule
  ],
  declarations: [
    LandingComponent,
    LoginComponent,
    PageNotFoundComponent,
    ProfileComponent
  ],
  exports: [
    LandingComponent,
    LoginComponent,
    PageNotFoundComponent,
    ProfileComponent
  ]
})
export class CoreModule { }
