import {Component, Input, OnInit} from '@angular/core';
import {MatDialog, MatDialogRef} from '@angular/material';
import {IItemType, TreeDatabase, TreeItemFlatNode,} from './tree.service';
import {SharedFunctions} from 'src/app/shared/utils/shared-functions';
import {ConfirmationModalComponent} from 'src/app/shared/components/confirmation/confirmation-modal.component';

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

  buildComplexItemArray() {
    this.complexItems = this.valueGS
      .split(this.complexSeparator)
      .map(this.transformComplexItem);
  }

  transformComplexItem(value: any) {
    const type = SharedFunctions.getType(value, null);
    if (!type) {
      if (isNaN(value)) {
        if (['true', 'false'].indexOf(value) >= 0) {
          return {type: 'boolean', value: value === 'true'};
        } else {
          return {type: 'string', value: value};
        }
      } else {
        return {type: 'number', value: +value};
      }
    }
    return {type, value: value.slice(1)};
  }

  valueGS: any;
  // canShowValue: boolean;
  specialCharacter: string;
  types: IItemType[];
  complexTypes: IItemType[];
  customType: boolean;
  complexItems: IComplexItem[] = [{type: null, value: ''}];
  data: { title: string; type: string; node: TreeItemFlatNode; complex: boolean; };

  @Input() set node(node) {
    this.data = {
      title: '',
      type: SharedFunctions.getType(node.item, node.type) || node.type,
      node: node,
      complex: false,
    };
  }

  @Input() set hideMappings(hideMappings) {
    this.types = this._treeDb.types.filter(t => !TreeEditorPopupComponent.filterType(t, hideMappings));
    this.complexTypes = this._treeDb.types.filter(
      (item) => !item.canHaveChild && item.name !== 'complex' && !TreeEditorPopupComponent.filterType(item, hideMappings)
    );
  }

  private static filterType(type, hideMappings) {
    return type.mapping && hideMappings;
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
    if (this.data.node && !this.data.node.expandable) {
      this.valueGS = this.data.node.value;
      if (typeof this.valueGS == 'string' && this.valueGS.indexOf('||') >= 0) {
        this.data.type = SharedFunctions.getType(this.data.node.value, null);
        this.data.complex = true;
        if (this.valueGS.length != this.complexSeparator.length) {
          this.buildComplexItemArray();
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
    }
  }

  typeChanged() {
    this.valueGS = this.getCompatibleValue(this.data.type, this.valueGS);
    this.updateNodeValue(this.valueGS);
  }

  getCompatibleValue(type, value) {
    if (type == 'array') {
      value = [];
    } else if (type == 'object') {
      value = {};
    } else if (type == 'number') {
      value = isNaN(value) ? 0 : +value;
    } else if (type == 'boolean') {
      value = false;
    } else if (type != 'complex') {
      value = value ? typeof value == 'boolean' ? '' : value + '' : '';
    }
    return value;
  }

  complextItemTypeChanged(item: IComplexItem) {
    item.value = this.getCompatibleValue(item.type, item.value);
    this.updateNodeValue();
  }

  getActualValue(value) {
    let transformedValue = value;
    if (typeof value == 'object') {
      return value;
    } else if (this.data.complex) {
      const transformedItems = this.complexItems.map(
        (item) => SharedFunctions.getLeadCharacter(item.type) + item.value
      );
      transformedValue = transformedItems.join(this.complexSeparator);
    } else if (['boolean', 'string', 'number'].indexOf(this.data.type) == -1) {
      transformedValue = SharedFunctions.getLeadCharacter(this.data.type) + value;
    }
    return transformedValue;
  }

  get isComplex() {
    return this.data.complex;
  }

  addComplexItem(atIndex) {
    let newItem = {value: '', type: 'string'};
    if (atIndex === -1) {
      this.valueGS = this.data.node.value;
      this.buildComplexItemArray();
      this.valueGS = '';
      this.data.type = SharedFunctions.getType(this.data.node.value, null);
      this.data.complex = true;
      this.complexItems.push(newItem);
      this.updateNodeValue()
    } else {
      this.complexItems.splice(atIndex, 0, newItem);
    }
  }

  // get canAddComplexItem() {
  //   return this.complexItems.length
  //     ? ['string', 'boolean', 'number'].indexOf(
  //     this.complexItems[this.complexItems.length - 1].type
  //   ) == -1
  //     : true;
  // }

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
      data: {message: `Would you like to delete ${this.data.node.item} ?`},
    });
    dialogRef.afterClosed().subscribe((confirmation) => {
      if (confirmation) {
        this._treeDb.deleteItem(this.data.node);
      }
    });
  }

  editNodePropertyName(node: TreeItemFlatNode, value: string) {
    this._treeDb.updateKey(node, value);
    node.item = value;
  }
}
