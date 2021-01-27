import { Component } from '@angular/core';
import { FieldArrayType } from '@ngx-formly/core';

@Component({
  selector: 'formly-repeat-section',
  template: `
    <div *ngFor="let field of field.fieldGroup; let i = index;" class="section">
        <formly-field class="col" [field]="field"></formly-field>
        <button mat-icon-button color="warn" class="remove" type="button" (click)="remove(i)"><mat-icon>delete</mat-icon></button>
    </div>
    <div style="margin:30px 0;">
      <button mat-raised-button color="primary" type="button" (click)="add()">{{ to.addText }}</button>
    </div>
  `,
  styleUrls:["./repeat-section.styles.scss"]
})
export class RepeatTypeComponent extends FieldArrayType {}
