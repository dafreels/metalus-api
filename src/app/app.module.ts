import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {PipelinesService} from "./pipelines/pipelines.service";
import {LandingComponent} from './landing/landing.component';
import {ApplicationssService} from "./applications/applications.service";
import {PackageObjectsService} from "./packageObjects/package-objects.service";
import { StepsModule } from "./steps/steps.module"
import {SharedComponentsModule} from "./shared/shared.components";
import {AppRoutingModule} from "./routes.component";

@NgModule({
  imports: [
    SharedComponentsModule,
    StepsModule,
    AppRoutingModule
  ],
  declarations: [
    AppComponent,
    LandingComponent
  ],
  providers: [
    ApplicationssService,
    PackageObjectsService,
    PipelinesService
  ],
  bootstrap: [AppComponent]
})

export class AppModule {
}
