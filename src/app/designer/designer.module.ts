import {NgModule} from "@angular/core";
import {DndModule} from 'ngx-drag-drop';
import {DesignerComponent} from "./designer.component";

@NgModule({
  imports: [
    DndModule
  ],
  declarations: [
    DesignerComponent
  ],
  exports: [
    DndModule,
    DesignerComponent
  ]
})

export class DesignerModule {}
