import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';
export interface IItemTypes {
  name:string;
  displayName:string
}
 export class TreeItemNode {
  children: TreeItemNode[];
  item: string;
  type: string;
  path: string;
  value: string | number | boolean;
  length: number;
}

export class TreeItemFlatNode {
  children: TreeItemFlatNode[];
  item: string;
  level: number;
  expandable: boolean;
  path: string;
  type: string;
  value: string | number | boolean;
  length: number;
}
@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<TreeItemNode[]>([]);
  rawData: any;
  get data(): TreeItemNode[] {
    return this.dataChange.value;
  }

  constructor() {
  }

  initialize(rawData) {
    this.rawData = rawData;
    const data = this.buildFileTree(rawData, 0);
    this.dataChange.next(data);
  }

  getRootTree() {
      let node = new TreeItemNode();
      if (Array.isArray(this.rawData)) {
        node.type = 'array';
        node.length = 0;
        node.path = '[0]';
      } else {
        node.type = 'object';
        node.length = 0;
        node.path = '';
      }
      return node;
  }
  
  buildFileTree(
    obj: { [key: string]: any },
    level: number,
    path: string = ''
  ): TreeItemNode[] {
    return Object.keys(obj).reduce<TreeItemNode[]>(
      (accumulator, key) => {
        const value = obj[key];
        const node = new TreeItemNode();
        node.path = `${path}[${key}]`;
        node.item = key;

        if (value != null) {
          if (typeof value === 'object') {
            node.children = this.buildFileTree(value, level + 1, node.path);
            if (Array.isArray(value)) {
              node.type = 'array';
              node.length = value.length;
            } else {
              node.type = 'object';
              node.length = Object.keys(value).length;
            }
          } else {
            node.value = value;
            node.type = typeof value;
          }
        }

        return accumulator.concat(node);
      },[]);
  }

  insertItem(parent: TreeItemNode, name: string) {
    if (parent.children) {
      parent.children.push({ item: name } as TreeItemNode);
      this.dataChange.next(this.data);
    }
  }
  insertPath(path: string, type: string, value: string, objKey = '') {
    let item = _.get(this.rawData, path);
    if (item) {
      if (Array.isArray(item)) {
        item.push(value);
      } else if (typeof item === 'object') {
        item[objKey] = value;
      }
      this.rawData = _.set(this.rawData, path, item);
    } else {
      if (Array.isArray(this.rawData)) {
        this.rawData.push(value);
      } else if (typeof this.rawData === 'object') {
        this.rawData[objKey] = value;
      }
    }
    this.initialize(this.rawData);
  }
  types: IItemTypes[] = [
    { displayName: 'Array', name: 'array' },
    { displayName: 'Object', name: 'object' },
    { displayName: 'Boolean', name: 'boolean' },
    { displayName: 'String', name: 'string' },
    { displayName: 'Number', name: 'number' },
    { displayName: 'Pipeline', name: 'pipeline' },
    { displayName: 'Golbal', name: 'global' },
    { displayName: 'Runtime', name: 'runtime' },
    { displayName: 'Mapped Runtime', name: 'mapped_runtime' },
    { displayName: 'Step', name: 'step' },
    { displayName: 'Secondary', name: 'secondary' },
  ];
  insertArray(parent: TreeItemNode, name: string, type: string) {
    switch (type) {
      case 'array':
        parent.children.push(this.buildFileTree([], 1)[0] as TreeItemNode);
        break;
    }
  }
  updatePath(path, value) {
    this.rawData = _.set(this.rawData, path, value);
    this.initialize(this.rawData);
  }

  deleteItem(node: TreeItemFlatNode) {
    // this.rawData =
    _.unset(this.rawData, node.path);
    this.initialize(this.rawData);
  }

  updateItem(node: TreeItemNode, name: string) {
    node.item = name;
    this.dataChange.next(this.data);
  }
}
