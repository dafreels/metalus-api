import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { LandingComponent } from './components/landing/landing.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';

@NgModule({
  imports: [
    CommonModule,
    SharedModule
  ],
  declarations: [
    LandingComponent,
    PageNotFoundComponent,
  ],
  exports: [
    LandingComponent,
    PageNotFoundComponent,
  ]
})
export class CoreModule { }
