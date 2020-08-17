import { Component, OnInit, Inject } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';
import { FlatTreeControl } from '@angular/cdk/tree';
import { Injectable } from '@angular/core';
import {
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { BehaviorSubject } from 'rxjs';
import {
  ChecklistDatabase,
  TodoItemFlatNode,
  TodoItemNode,
} from './tree.service';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialog,
} from '@angular/material/dialog';
import { PipelineMappingsData } from '../object-group-mappings/object-group-mappings.component';
import { TreeEditorPopupComponent } from './tree-editor-popup.component';

@Component({
  selector: 'app-tree-editor',
  templateUrl: './tree-editor.component.html',
  styleUrls: ['./tree-editor.component.scss'],
  providers: [ChecklistDatabase],
})
export class TreeEditorComponent implements OnInit {
  types = this._database.types; //[{ name: 'Array' }, { name: 'Object' }, { name: 'Boolean' }];
  /** Map from flat node to nested node. This helps us finding the nested node to be modified */
  flatNodeMap = new Map<TodoItemFlatNode, TodoItemNode>();

  /** Map from nested node to flattened node. This helps us to keep the same object for selection */
  nestedNodeMap = new Map<TodoItemNode, TodoItemFlatNode>();

  /** A selected parent node to be inserted */
  selectedParent: TodoItemFlatNode | null = null;

  /** The new item's name */
  newItemName = '';

  treeControl: FlatTreeControl<TodoItemFlatNode>;

  treeFlattener: MatTreeFlattener<TodoItemNode, TodoItemFlatNode>;

  dataSource: MatTreeFlatDataSource<TodoItemNode, TodoItemFlatNode>;
  // dataSource: MatTreeFlatDataSource<any, any>;

  /** The selection for checklist */
  checklistSelection = new SelectionModel<TodoItemFlatNode>(
    true /* multiple */
  );
  jsonData: any;
  // data: any; //temporary
  selectedpath: string;
  constructor(
    private _database: ChecklistDatabase,
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
    this.treeControl = new FlatTreeControl<TodoItemFlatNode>(
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
    // this.dataSource.data = this.data.mappings;
    // console.log('TreeEditorComponent -> ngOnInit -> this.data', this.data);
    // this._database.initialize(this.data);
    return;
    if (
      typeof this.data.mappings === 'object' &&
      Object.keys(this.data.mappings).length
    ) {
      this._database.initialize(this.data);
    } else {
      this._database.initialize([{ name: 'Suresh' }]);
    }
  }

  getLevel = (node: TodoItemFlatNode) => node.level;

  isExpandable = (node: TodoItemFlatNode) => node.expandable;

  getChildren = (node: TodoItemNode): TodoItemNode[] => node.children;

  hasChild = (_: number, _nodeData: TodoItemFlatNode) =>
    ['array', 'object'].indexOf(_nodeData.type) >= 0; //_nodeData.expandable;

  hasNoContent = (_: number, _nodeData: TodoItemFlatNode) =>
    _nodeData.item === '';

  /**
   * Transformer to convert nested node to flat node. Record the nodes in maps for later use.
   */
  transformer = (node: TodoItemNode, level: number) => {
    const existingNode = this.nestedNodeMap.get(node);
    const flatNode =
      existingNode && existingNode.item === node.item
        ? existingNode
        : new TodoItemFlatNode();
    flatNode.item = node.item;
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

  /** Whether all the descendants of the node are selected. */
  descendantsAllSelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const descAllSelected =
      descendants.length > 0 &&
      descendants.every((child) => {
        return this.checklistSelection.isSelected(child);
      });
    return descAllSelected;
  }

  /** Whether part of the descendants are selected */
  descendantsPartiallySelected(node: TodoItemFlatNode): boolean {
    const descendants = this.treeControl.getDescendants(node);
    const result = descendants.some((child) =>
      this.checklistSelection.isSelected(child)
    );
    return result && !this.descendantsAllSelected(node);
  }

  /** Toggle the to-do item selection. Select/deselect all the descendants node */
  todoItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    const descendants = this.treeControl.getDescendants(node);
    this.checklistSelection.isSelected(node)
      ? this.checklistSelection.select(...descendants)
      : this.checklistSelection.deselect(...descendants);

    // Force update for the parent
    descendants.forEach((child) => this.checklistSelection.isSelected(child));
    this.checkAllParentsSelection(node);
  }

  /** Toggle a leaf to-do item selection. Check all the parents to see if they changed */
  todoLeafItemSelectionToggle(node: TodoItemFlatNode): void {
    this.checklistSelection.toggle(node);
    this.checkAllParentsSelection(node);
  }

  /* Checks all the parents when a leaf node is selected/unselected */
  checkAllParentsSelection(node: TodoItemFlatNode): void {
    let parent: TodoItemFlatNode | null = this.getParentNode(node);
    while (parent) {
      this.checkRootNodeSelection(parent);
      parent = this.getParentNode(parent);
    }
  }

  /** Check root node checked state and change it accordingly */
  checkRootNodeSelection(node: TodoItemFlatNode): void {
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

  /* Get the parent node of a node */
  getParentNode(node: TodoItemFlatNode): TodoItemFlatNode | null {
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

  /** Select the category so we can insert the new item. */
  // addNewItem(node: TodoItemFlatNode) {
  //   const parentNode = this.flatNodeMap.get(node);
  //   this._database.insertItem(parentNode!, '');
  //   this.treeControl.expand(node);
  // }

  addNewItem(node: TodoItemFlatNode, type: string, value: any = '') {
    console.log(
      'TreeEditorComponent -> addNewItem -> this.treeControl',
      this.treeControl
    );
    if (node.type == 'array' && ['array', 'object'].indexOf(type) >= 0) {
      if (type == 'array') {
        value = [];
      } else if (type == 'object') {
        value = {};
      }
      this.selectedpath = node.path;
      this._database.insertPath(node.path, type, value);
      this.treeControl.expand(node);
      return;
    }
    const dialogRef = this.dialog.open(TreeEditorPopupComponent, {
      width: '550px',
      data: { title: type, type: type, parentType: node.type },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this._database.insertPath(node.path, type, result.value, result.key);
        this.selectedpath = node.path;
      }
    });
  }
  updateNodeValue(node: TodoItemFlatNode, value) {
    this.selectedpath = node.path;
    this._database.updatePath(node.path, value);
  }
  editNode(node: TodoItemFlatNode) {
    console.log('TreeEditorComponent -> editNode -> node', node);
    const dialogRef = this.dialog.open(TreeEditorPopupComponent, {
      width: '550px',
      data: { title: 'Update', type: node.type, node: node },
    });
    dialogRef.afterClosed().subscribe((result) => {
      console.log('TreeEditorComponent -> addNewItem -> result', result);
      this.selectedpath = node.path;
      if (result) {
        this.updateNodeValue(node, result.value);
      }
    });
  }
  expandNode(node: TodoItemFlatNode) {
    console.log('TreeEditorComponent -> expandNode -> node', node);
    if (this.selectedpath && this.selectedpath.indexOf(node.path) > -1) {
      this.treeControl.expand(node);
    }
  }
  /** Save the node to database */
  saveNode(node: TodoItemFlatNode, itemValue: string) {
    const nestedNode = this.flatNodeMap.get(node);
    this._database.updateItem(nestedNode!, itemValue);
  }
  saveDialog() {
    console.log("TreeEditorComponent -> saveDialog -> this._database.rawData", this._database.rawData)
    // this.dialogRef.close(this.jsonData);
  }

  cancelDialog() {
    // this.dialogRef.close();
  }
}
