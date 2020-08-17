import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TodoItemNode, TodoItemFlatNode } from './tree.service';

@Component({
  selector: 'tree-editor-popup.component',
  templateUrl: './tree-editor-popup.component.html',
    styleUrls: ['./tree-editor-popup.component.scss']
})
export class TreeEditorPopupComponent {
  output: {
    key: string;
    value: any;
  } = {
    key: null,
    value: null,
  };
  updateMode: boolean;
  canShowValue: boolean;
  constructor(
    public dialogRef: MatDialogRef<TreeEditorPopupComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { title: string; type: string; node: TodoItemFlatNode }
  ) {
    this.canShowValue = ['array', 'object'].indexOf(this.data.type) == -1;
    console.log("TreeEditorPopupComponent -> this.canShowValue, data", this.canShowValue, data)
    if (data.node) {
      this.output.value = data.node.value;
      this.output.key = data.node.item;
      this.updateMode = true;
    } else {
      if (data.type === 'array') {
        this.output.value = [];
      } else if (data.type === 'object') {
        this.output.value = {};
      }
    }
  }
}
