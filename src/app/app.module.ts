import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import {MatIconRegistry} from '@angular/material/icon';
import { SharedModule } from './shared/shared.module';
import {
  MAT_DIALOG_DEFAULT_OPTIONS,
  MAT_SNACK_BAR_DEFAULT_OPTIONS,
  MAT_TOOLTIP_DEFAULT_OPTIONS,
  MatSnackBarConfig
} from '@angular/material';
import { ApplicationsModule } from './applications/applications.module';
import { StepsModule } from './steps/steps.module';
import { PipelinesModule } from './pipelines/pipelines.module';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    ApplicationsModule,
    StepsModule,
    PipelinesModule,
    AppRoutingModule,
  ],
  declarations: [
    AppComponent
  ],
  providers: [
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true, autoFocus: false }},
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: {
        showDelay: 500,
        hideDelay: 0,
        touchendHideDelay: 1500,
      }},
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3000 } as MatSnackBarConfig },
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
}
