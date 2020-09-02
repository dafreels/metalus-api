import { Component, OnInit, Inject } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { BehaviorSubject } from 'rxjs';
import {
  TreeDatabase,
  TreeItemFlatNode,
  TreeItemNode,
  IItemType,
} from './tree.service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { PipelineMappingsData } from '../object-group-mappings/object-group-mappings.component';
import { TreeEditorPopupComponent } from './tree-editor-popup.component';
import { SharedFunctions } from 'src/app/shared/utils/shared-functions';
import { ConfirmationModalComponent } from 'src/app/shared/components/confirmation/confirmation-modal.component';
import { PromptComponent } from './prompt/prompt.component';
import { JsonEditorOptions } from 'ang-jsoneditor';


@Component({
  selector: 'app-tree-editor',
  templateUrl: './tree-editor.component.html',
  styleUrls: ['./tree-editor.component.scss'],
})
export class TreeEditorComponent implements OnInit {
  types = this._database.types;
  flatNodeMap = new Map<TreeItemFlatNode, TreeItemNode>();
  treeView = true;
  public editorOptions: JsonEditorOptions;
  
  nestedNodeMap = new Map<TreeItemNode, TreeItemFlatNode>();

  selectedParent: TreeItemFlatNode | null = null;

  newItemName = '';

  treeControl: FlatTreeControl<TreeItemFlatNode>;

  treeFlattener: MatTreeFlattener<TreeItemNode, TreeItemFlatNode>;

  dataSource: MatTreeFlatDataSource<TreeItemNode, TreeItemFlatNode>;

  checklistSelection = new SelectionModel<TreeItemFlatNode>(
    true /* multiple */
  );
  jsonData: any;
  selectedpath: string;
  constructor(
    private _database: TreeDatabase,
    public dialogRef: MatDialogRef<TreeEditorComponent>,
    public dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: PipelineMappingsData
  ) 
  {
    this.treeFlattener = new MatTreeFlattener(
      this.transformer,
      this.getLevel,
      this.isExpandable,
      this.getChildren
    );
    this.treeControl = new FlatTreeControl<TreeItemFlatNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new MatTreeFlatDataSource(
      this.treeControl,
      this.treeFlattener
    );

    _database.dataChange.subscribe((data) => {
      this.dataSource.data = data;
    });
  }
  ngOnInit() {
    this._database.initialize({ mappings:  this.data.mappings}); 
    this.editorOptions = new JsonEditorOptions()
    this.editorOptions.modes = ['code'];
    this.editorOptions.mode = 'code';
  }

  getLevel = (node: TreeItemFlatNode) => node.level;

  isExpandable = (node: TreeItemFlatNode) => node.expandable;

  getChildren = (node: TreeItemNode): TreeItemNode[] => node.children;

  hasChild = (_: number, _nodeData: TreeItemFlatNode) =>
    ['array', 'object'].indexOf(_nodeData.type) >= 0; //_nodeData.expandable;

  hasNoContent = (_: number, _nodeData: TreeItemFlatNode) =>
    _nodeData.item === '';

  transformer = (node: TreeItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.item === node.item
        ? existingNode
        : new TreeItemFlatNode();
    flatNode.item = node.item;
    flatNode.parentType = typeof node.item == 'number' ? 'array':'object';
  flatNode.value = node.value;
    flatNode.length = node.length;
    flatNode.path = node.path;
    flatNode.type = node.type;
    flatNode.level = level;
    flatNode.expandable = !!node.children ? !!node.children.length : false;
    this.flatNodeMap.set(flatNode, node);
    this.nestedNodeMap.set(node, flatNode);
    return flatNode;
  };

  descendantsAllSelected(node: TreeItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every((child) => {
        return this.checklistSelection.isSelected(child);
      });
    return descAllSelected;
  }

  descendantsPartiallySelected(node: TreeItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some((child) =>
      this.checklistSelection.isSelected(child)
    );
    return result && !this.descendantsAllSelected(node);
  }

  todoItemSelectionToggle(node: TreeItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    descendants.forEach((child) => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
  }

  todoLeafItemSelectionToggle(node: TreeItemFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  checkAllParentsSelection(node: TreeItemFlatNode): void {
    let parent: TreeItemFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  checkRootNodeSelection(node: TreeItemFlatNode): void {
    const nodeSelected = this.checklistSelection.isSelected(node);
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every((child) => {
        return this.checklistSelection.isSelected(child);
      });
    if (nodeSelected && !descAllSelected) {
      this.checklistSelection.deselect(node);
    } else if (!nodeSelected && descAllSelected) {
      this.checklistSelection.select(node);
    }
  }

  getParentNode(node: TreeItemFlatNode): TreeItemFlatNode | null {
    const currentLevel = this.getLevel(node);

    if (currentLevel < 1) {
      return null;
    }

    const startIndex = this.treeControl.dataNodes.indexOf(node) - 1;

    for (let i = startIndex; i >= 0; i--) {
      const currentNode = this.treeControl.dataNodes[i];

      if (this.getLevel(currentNode) < currentLevel) {
        return currentNode;
      }
    }
    return null;
  }

  addNewItemDefault(node: TreeItemFlatNode) {
    const parentNode = this.flatNodeMap.get(node);
    this._database.insertItem(parentNode!, '');
    this.treeControl.expand(node);
  }

  addNewItem(node: TreeItemFlatNode, addType: IItemType) {
    let defaultValue: any = '';
    if (addType.name == 'array') {
      defaultValue = [];
    } else if (addType.name == 'object') {
      defaultValue = {};
    } else {
      switch (addType.name) {
        case 'complex':
          defaultValue = ' || ';
          break;
        case 'number':
          defaultValue = 0;
          break;
        case 'boolean':
          defaultValue = false;
          break;
        default:
          const leadCharacter = SharedFunctions.getLeadCharacter(
            addType.name
          );
          defaultValue = leadCharacter;
      }
    }
    if (node.type == 'array') {
      // && ['array', 'object'].indexOf(addType.name) >= 0
      this.selectedpath = node.path;
      this._database.insertPath(node.path, addType.name, defaultValue);
      this.treeControl.expand(node);
      return;
    } else if (node.type == 'object') {
      const dialogRef = this.dialog.open(PromptComponent, {
        width: '400px',
        data: {
          title: `Add (${addType.displayName})`,
          label: 'Property Name',
          value: '',
        },
      });
      dialogRef.afterClosed().subscribe((key) => {
        if (key) {
          this._database.insertPath(
            node.path,
            addType.name,
            defaultValue,
            key
          );
          this.selectedpath = node.path;
        }
      });
    }
    // const dialogRef = this.dialog.open(TreeEditorPopupComponent, {
    //   width: '550px',
    //   data: { title: `Add (${addType.displayName})`, type: addType.name, parentType: node.type  },
    // });
  }
  updateNodeValue(node: TreeItemFlatNode, value) {
    this.selectedpath = node.path;
    this._database.updatePath(node.path, value);
  }
  editNode(node: TreeItemFlatNode) {
    const dialogRef = this.dialog.open(PromptComponent, {
      width: '400px',
      data: {
        title: `Update Property`,
        label: 'Property Name',
        value: node.item,
      },
    });
    dialogRef.afterClosed().subscribe((key) => {
      if (key && key != node.item) {
        this.selectedpath = node.path;
        node.item = key;
        this._database.updateKey(node, key);
      }
    });
  }

  deleteNode(node: TreeItemFlatNode) {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '550px',
      data: { message: `Would you like to delete ${node.item} ?` },
    });
    dialogRef.afterClosed().subscribe((confirmation) => {
      if (confirmation) {
        const parentNode = this.flatNodeMap.get(node);
        this._database.deleteItem(node);
        this.selectedpath = node.path;
      }
    });
  }
  expandNode(node: TreeItemFlatNode) {
    if (this.selectedpath && this.selectedpath.indexOf(node.path) > -1) {
      this.treeControl.expand(node);
    }
  }

  saveDialog() {
    this.dialogRef.close(this._database.rawData.mappings);
  }

  cancelDialog() {
    this.dialogRef.close();
  }
  setData(data){
    this._database.initialize({mappings: data})
  }
}
