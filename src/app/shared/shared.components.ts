import {NgModule} from "@angular/core";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {
  MatCardModule,
  MatGridListModule,
  MatInputModule,
  MatListModule,
  MatRadioModule,
  MatSlideToggleModule,
  MatTabsModule,
  MatToolbarModule,
  MatTooltipModule,
  MatTreeModule
} from "@angular/material";
import {HttpClientModule} from "@angular/common/http";
import {FormsModule} from "@angular/forms";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatSelectModule} from "@angular/material/select";
import {MatButtonModule} from "@angular/material/button";
import {MatIconModule} from "@angular/material/icon";

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
    MatListModule,
    MatTooltipModule,
    MatExpansionModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
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
    MatListModule,
    MatTooltipModule,
    MatExpansionModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
  ]
})

export class SharedComponentsModule {}
