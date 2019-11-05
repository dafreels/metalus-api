import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DesignerComponent } from './components/designer/designer.component';
import { DesignerNodeComponent } from './components/designer-node/designer-node.component';
import { DesignerNodeDirective } from './directives/designer-node.directive';
import { DesignerPreviewComponent } from './components/designer-preview/designer-preview.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
  ],
  declarations: [
    DesignerComponent,
    DesignerNodeComponent,
    DesignerNodeDirective,
    DesignerPreviewComponent
  ],
  exports: [
    DesignerComponent
  ],
  entryComponents: [
    DesignerNodeComponent,
    DesignerPreviewComponent
  ]
})

export class DesignerModule {}
