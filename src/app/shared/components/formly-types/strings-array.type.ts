import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material';
import { FieldType } from '@ngx-formly/core';

@Component({
  selector: 'formly-null-type',
  template: `
    <mat-form-field class="example-chip-list">
      <mat-label>{{to.label}}</mat-label>
      <mat-chip-list #chipList >
        <mat-chip
          *ngFor="let item of items"
          [selectable]="selectable"
          [removable]="removable"
          (removed)="remove(item)">
          {{ item }}
          <mat-icon matChipRemove *ngIf="removable">cancel</mat-icon>
        </mat-chip>
        <input
          [placeholder]="to.placeholder"
          #stringInput
          [formControl]="itemCtrl"
          [matChipInputFor]="chipList"
          [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
          (matChipInputTokenEnd)="add($event)"
        />
      </mat-chip-list>
    </mat-form-field>
  `,
})
export class StringsArrayTypeComponent extends FieldType {
  visible = true;
  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  itemCtrl = new FormControl();
  items: string[] = [];

  @ViewChild('itemInput', { static: false })
  itemInput: ElementRef<HTMLInputElement>;
  constructor() {
    super();
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      this.items.push(value.trim());
      this.formControl.setValue(this.items);
    }

    if (input) {
      input.value = '';
      event.value = '';
    }

    this.itemCtrl.setValue(null);
  }

  remove(fruit: string): void {
    const index = this.items.indexOf(fruit);

    if (index >= 0) {
      this.items.splice(index, 1);
      this.formControl.setValue(this.items);
    }
  }
}
