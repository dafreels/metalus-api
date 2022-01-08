import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignerComponent } from './components/designer/designer.component';
import { DesignerNodeComponent } from './components/designer-node/designer-node.component';
import { DesignerNodeDirective } from './directives/designer-node.directive';
import { DesignerPreviewComponent } from './components/designer-preview/designer-preview.component';
import { SharedModule } from '../shared/shared.module';
import {BranchNodeComponent} from "./components/branch-node/branch-node.component";
import {GroupNodeComponent} from "./components/designer-group/group-node.component";

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
  ],
  declarations: [
    BranchNodeComponent,
    DesignerComponent,
    DesignerNodeComponent,
    DesignerNodeDirective,
    DesignerPreviewComponent,
    GroupNodeComponent
  ],
  exports: [
    DesignerComponent
  ],
  entryComponents: [
    BranchNodeComponent,
    DesignerNodeComponent,
    DesignerPreviewComponent,
    GroupNodeComponent
  ]
})

export class DesignerModule {}
