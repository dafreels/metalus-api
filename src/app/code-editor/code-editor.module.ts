import { ACE_CONFIG, AceConfigInterface, AceModule } from 'ngx-ace-wrapper';
import { NgModule } from '@angular/core';
import { CodeEditorComponent } from './components/code-editor/code-editor.component';
import { SharedModule } from '../shared/shared.module';

const DEFAULT_ACE_CONFIG: AceConfigInterface = {};

@NgModule({
  imports: [
    AceModule,
    SharedModule,
  ],
  declarations: [
    CodeEditorComponent
  ],
  exports: [
    CodeEditorComponent
  ],
  entryComponents: [
    CodeEditorComponent
  ],
  providers: [
    { provide: ACE_CONFIG, useValue: DEFAULT_ACE_CONFIG }
  ]
})

export class CodeEditorModule {}
