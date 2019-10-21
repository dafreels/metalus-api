import {NgModule} from "@angular/core";
import {DndModule} from 'ngx-drag-drop';
import {DesignerComponent} from "./designer.component";
import {DesignerNodeComponent} from "./node/designer.node.component";
import {DesignerNodeDirective} from "./node/designer.node.directive";
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatCardModule} from "@angular/material/card";
import {MatMenuModule} from "@angular/material/menu";
import {DesignerPreviewComponent} from "./preview/designer.preview.component";
import {MatDialogModule} from "@angular/material/dialog";
import {MatButtonModule} from "@angular/material/button";
import {CommonModule} from "@angular/common";
import {MatIconModule} from "@angular/material/icon";

@NgModule({
  imports: [
    CommonModule,
    DndModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule
  ],
  declarations: [
    DesignerComponent,
    DesignerNodeComponent,
    DesignerNodeDirective,
    DesignerPreviewComponent
  ],
  exports: [
    DndModule,
    DesignerComponent
  ],
  entryComponents: [
    DesignerNodeComponent,
    DesignerPreviewComponent
  ]
})

export class DesignerModule {}
