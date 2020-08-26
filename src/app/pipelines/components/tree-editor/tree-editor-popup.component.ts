import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import {
  TreeItemNode,
  TreeItemFlatNode,
  TreeDatabase,
  IItemType,
} from './tree.service';
import { SharedFunctions } from 'src/app/shared/utils/shared-functions';
@Component({
  selector: 'tree-editor-popup.component',
  templateUrl: './tree-editor-popup.component.html',
  styleUrls: ['./tree-editor-popup.component.scss'],
  providers: [TreeDatabase],
})
export class TreeEditorPopupComponent {
  complexSeparator = ' || ';
  buildComplexItemArray(value: any) {
    this.complexItems = this.output.value
      .split(this.complexSeparator)
      .map(this.transformComplexItem);
  }
  transformComplexItem(value: any) {
    const type = SharedFunctions.getType(value, null);
    if (!type) {
      if (isNaN(value)) {
        if (['true', 'false'].indexOf(value) >= 0) {
          return { type: 'boolean', value: value === 'true' };
        } else {
          return { type: 'string', value: value };
        }
      } else {
        return { type: 'number', value: +value };
      }
    }
    return { type, value: value.slice(1) };
  }
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
  types: IItemType[] = this._treeDb.types.filter((item) => !item.canHaveChild);
  complexTypes: IItemType[] = this._treeDb.types.filter(
    (item) => !item.canHaveChild && item.name != 'complex'
  );
  customType: boolean;
  complexItems: {
    value: any;
    type: string;
  }[] = [{ value: null, type: null }];
  constructor(
    public dialogRef: MatDialogRef<TreeEditorPopupComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { title: string; type: string; node: TreeItemFlatNode },
    private _treeDb: TreeDatabase
  ) {
    this.canShowValue = ['array', 'object'].indexOf(this.data.type) == -1;
    if (this.data.node) {
      this.output.value = this.data.node.value;
      if (isNaN(this.output.value) && this.output.value.indexOf('||') >= 0) {
        this.data.type = 'complex';
        this.buildComplexItemArray(this.output.value);
      } else {
        let cType = SharedFunctions.getType(this.data.node.value, null);
        if (cType) {
          this.specialCharacter = this.data.node.value[0];
          this.customType = true;
          this.output.value = this.output.value.slice(1);
        }
        this.data.type = cType || typeof this.data.node.value;
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
  saveDialog() {
    if (this.isComplex) {
      const transformedItems = this.complexItems.map(
        (item) => SharedFunctions.getLeadCharacter(item.type) + item.value
      );
      this.output.value = transformedItems.join(this.complexSeparator);
    } else {
      this.output.value = this.customType
        ? SharedFunctions.getLeadCharacter(this.data.type) + this.output.value
        : this.output.value;
    }
    this.dialogRef.close(this.output);
  }
  get isComplex() {
    return this.data.type == 'complex';
  }
  addComplexItem() {
    this.complexItems.push({ value: null, type: null });
  }
  deleteComplexItem(deleteItem) {
    this.complexItems = this.complexItems.filter((item) => item != deleteItem);
  }
}
