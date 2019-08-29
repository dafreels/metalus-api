import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {LandingComponent} from "./landing/landing.component";

const appRoutes: Routes = [
  {path: 'landing', component: LandingComponent}, // The landing page should display by default
  // {path: '', redirectTo: 'landing', pathMatch: 'full'},
  {path: '**', component: LandingComponent}, // TODO Add an error page here
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes, {enableTracing: true})],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
