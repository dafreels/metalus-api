import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { StepsService} from "./common/steps.service";
import { LandingComponent } from './landing/landing.component';
import { MatCardModule, MatGridListModule, MatToolbarModule } from "@angular/material";
import { HttpClientModule } from '@angular/common/http';

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
    StepsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
