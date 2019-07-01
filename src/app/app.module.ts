import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { PipelinesService } from "./pipelines/pipelines.service";
import { StepsService} from "./steps/steps.service";
import { LandingComponent } from './landing/landing.component';
import { MatCardModule, MatGridListModule, MatToolbarModule } from "@angular/material";
import { HttpClientModule } from '@angular/common/http';
import {ApplicationssService} from "./applications/applications.service";
import {PackageObjectsService} from "./packageObjects/package-objects.service";

@NgModule({
  imports: [
    BrowserModule,
    MatCardModule,
    MatGridListModule,
    MatToolbarModule,
    HttpClientModule
  ],
  declarations: [
    AppComponent,
    LandingComponent
  ],
  providers: [
    ApplicationssService,
    PackageObjectsService,
    PipelinesService,
    StepsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
