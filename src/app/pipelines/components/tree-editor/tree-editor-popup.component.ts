import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { TreeItemNode, TreeItemFlatNode } from './tree.service';
import { SharedFunctions } from 'src/app/shared/utils/shared-functions';
@Component({
  selector: 'tree-editor-popup.component',
  templateUrl: './tree-editor-popup.component.html',
  styleUrls: ['./tree-editor-popup.component.scss'],
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
  specialCharacter: string;
  constructor(
    public dialogRef: MatDialogRef<TreeEditorPopupComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { title: string; type: string; node: TreeItemFlatNode }
  ) {
    this.canShowValue = ['array', 'object'].indexOf(this.data.type) == -1;
    if (this.data.node) {
      this.output.value = this.data.node.value;
      const customType = SharedFunctions.getType(this.data.node.value, '');
      if (customType) {
        this.specialCharacter = this.data.node.value[0];
        this.output.value = this.output.value.slice(1);
      }
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
  saveDialog(){
    this.output.value = this.specialCharacter ?  this.specialCharacter + this.output.value: this.output.value;
    this.dialogRef.close(this.output);
  }
}
