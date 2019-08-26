import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {
  MatCardModule,
  MatGridListModule, MatIconModule,
  MatInputModule,
  MatRadioModule,
  MatSlideToggleModule, MatTabsModule,
  MatToolbarModule,
  MatTreeModule,
  MatListModule
} from "@angular/material";
import {HttpClientModule} from "@angular/common/http";

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatGridListModule,
    MatToolbarModule,
    HttpClientModule,
    MatInputModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatTreeModule,
    MatListModule
  ],
  exports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatCardModule,
    MatGridListModule,
    MatToolbarModule,
    HttpClientModule,
    MatInputModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatTreeModule,
    MatListModule
  ]
})

export class SharedComponentsModule {}
