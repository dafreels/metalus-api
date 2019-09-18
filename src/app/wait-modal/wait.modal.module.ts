import {NgModule} from "@angular/core";
import {WaitModalComponent} from "./wait.modal.component";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";

@NgModule({
  imports: [MatProgressSpinnerModule],
  declarations: [WaitModalComponent],
  exports: [WaitModalComponent],
  entryComponents: [WaitModalComponent]
})

export class WaitModalModule {}
