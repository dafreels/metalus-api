import { Component, OnInit, Inject, Input, Output } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material';
import {
  TreeItemNode,
  TreeItemFlatNode,
  TreeDatabase,
  IItemType,
} from './tree.service';
import { SharedFunctions } from 'src/app/shared/utils/shared-functions';
import { ConfirmationModalComponent } from 'src/app/shared/components/confirmation/confirmation-modal.component';
interface IComplexItem {
  value: any;
  type: string;
}

@Component({
  selector: 'tree-editor-popup',
  templateUrl: './tree-editor-popup.component.html',
  styleUrls: ['./tree-editor-popup.component.scss'],
})
export class TreeEditorPopupComponent implements OnInit {
  complexSeparator = ' || ';
  buildComplexItemArray(value: any) {
    this.complexItems = this.valueGS
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
  valueGS: any;
  // canShowValue: boolean;
  specialCharacter: string;
  types: IItemType[] = this._treeDb.types.filter((item) => !item.canHaveChild);
  complexTypes: IItemType[] = this._treeDb.types.filter(
    (item) => !item.canHaveChild && item.name != 'complex'
  );
  customType: boolean;
  complexItems: IComplexItem[] = [];
  data: { title: string; type: string; node: TreeItemFlatNode };
  @Input() set node(node) {
    this.data = {
      title: '',
      type: SharedFunctions.getType(node.item, node.type),
      node: node,
    };
  }
  constructor(
    public dialogRef: MatDialogRef<TreeEditorPopupComponent>,
    public dialog: MatDialog,
    // @Inject(MAT_DIALOG_DATA)
    // public data: { title: string; type: string; node: TreeItemFlatNode },
    private _treeDb: TreeDatabase
  ) {}
  ngOnInit(): void {
    this.setUIFormat();
  }
  private setUIFormat() {
    // this.canShowValue = ['array', 'object'].indexOf(this.data.type) == -1;
    if (this.data.node) {
      this.valueGS = this.data.node.value;
      if (typeof this.valueGS == 'string' && this.valueGS.indexOf('||') >= 0) {
        this.data.type = 'complex';
        if(this.valueGS.length != this.complexSeparator.length) {
          this.buildComplexItemArray(this.valueGS);
        }
        this.valueGS = '';
      } else {
        let cType = SharedFunctions.getType(this.data.node.value, null);
        if (cType) {
          this.specialCharacter = this.data.node.value[0];
          this.customType = true;
          this.valueGS = this.valueGS.slice(1);
        }
        this.data.type = cType || typeof this.data.node.value;
      }
    } else {
      if (this.data.type === 'array') {
        this.valueGS = [];
      } else if (this.data.type === 'object') {
        this.valueGS = {};
      }
    }
  }
  typeChanged() {
    this.valueGS = this.getCompatibleValue(this.data.type, this.valueGS);
    this.updateNodeValue(this.valueGS);
  }
  getCompatibleValue(type, value) {
    if(type == 'number') {
      value = isNaN(value) ? 0 : +value;
    } else if (type == 'boolean') {
      value = false;
    } else if(type != 'complex') {
      value = typeof value == 'boolean' ? '': value + '';
    }
    return value;
  }
  complextItemTypeChanged(item:IComplexItem) {
    item.value = this.getCompatibleValue(item.type, item.value);
    this.updateNodeValue();
  }
  getActualValue(value) {
    let transformedValue = value;
    if (this.data.type == 'complex') {
      const transformedItems = this.complexItems.map(
        (item) => SharedFunctions.getLeadCharacter(item.type) + item.value
      );
      transformedValue = transformedItems.join(this.complexSeparator);
    } else if(['boolean', 'string', 'number'].indexOf(this.data.type) == -1) {
      transformedValue = SharedFunctions.getLeadCharacter(this.data.type) + value;
    }
    return transformedValue;
  }
  get isComplex() {
    return this.data.type == 'complex';
  }
  addComplexItem(atIndex) {
    let newItem = { value: '', type: null };
    // this.complexItems.push({ value: '', type: null });
    this.complexItems.splice(atIndex,0, newItem);
  }
  get canAddComplexItem() {
    return this.complexItems.length
      ? ['string', 'boolean', 'number'].indexOf(
          this.complexItems[this.complexItems.length - 1].type
        ) == -1
      : true;
  }
  deleteComplexItem(deleteItem) {
    this.complexItems = this.complexItems.filter((item) => item != deleteItem);
    this.updateNodeValue();
  }
  updateNodeValue(value?) {
    this._treeDb.updatePath(this.data.node.path, this.getActualValue(value));
  }
  deleteNode() {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '550px',
      data: { message: `Would you like to delete ${this.node.item} ?` },
    });
    dialogRef.afterClosed().subscribe((confirmation) => {
      if (confirmation) {
        this._treeDb.deleteItem(this.node);
      }
    });
  }
}
