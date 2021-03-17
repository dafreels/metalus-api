import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import * as _ from 'lodash';
import { EventEmitter } from 'events';

export interface IItemType {
  name: string;
  displayName: string;
  canHaveChild: boolean;
  mapping: boolean;
}

export class TreeItemNode {
  children: TreeItemNode[];
  item: string | number;
  type: string;
  path: string;
  value: string | number | boolean;
  length: number;
}

export class TreeItemFlatNode {
  children: TreeItemFlatNode[];
  item: string | number;
  level: number;
  expandable: boolean;
  path: string;
  type: string;
  value: string | number | boolean;
  length: number;
  parentType: string;
}

@Injectable()
export class TreeDatabase {
  dataChange = new BehaviorSubject<TreeItemNode[]>([]);
  private _rawData: any;
  private listener:EventEmitter;
  set rawData(data) {
    this._rawData = data;
    if(this.listener) {
      const rootName = Object.keys(this._rawData)[0]
      this.listener.emit(this._rawData[rootName]);
    }
  }
  get rawData() {
    return this._rawData;
  }
  
  selectedpath: string = '[mappings]';//default expanded
  get data(): TreeItemNode[] {
    return this.dataChange.value;
  }

  constructor() {
  }
  registerListener(listener) {
    this.listener = listener;
  }
  initialize(data) {
    this.rawData = data;
    this.dataChange.next(this.buildFileTree(this.rawData, 0));
  }

  buildFileTree(
    obj: { [key: string]: any },
    level: number,
    path: string = ''
  ): TreeItemNode[] {
    return Object.keys(obj).reduce<TreeItemNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new TreeItemNode();
      node.path = `${path}[${key}]`;
      node.item = Array.isArray(obj) ? +key : key;

      if (value != null) {
        if (typeof value === 'object') {
          node.children = this.buildFileTree(value, level + 1, node.path);
          node.value = null;
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
    }, []);
  }

  insertItem(parent: TreeItemNode, name: string) {
    if (parent.children) {
      parent.children.push({item: name} as TreeItemNode);
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

  types: IItemType[] = [
    {displayName: 'Array', name: 'array', canHaveChild: true, mapping: false},
    {displayName: 'Object', name: 'object', canHaveChild: true, mapping: false},
    {displayName: 'Pipeline', name: 'pipeline', canHaveChild: false, mapping: true},
    {displayName: 'Global', name: 'global', canHaveChild: false, mapping: true},
    {displayName: 'Credential', name: 'credential', canHaveChild: false, mapping: true},
    {displayName: 'Runtime', name: 'runtime', canHaveChild: false, mapping: true},
    {
      displayName: 'Mapped Runtime',
      name: 'mapped_runtime',
      canHaveChild: false,
      mapping: true,
    },
    {displayName: 'Step', name: 'step', canHaveChild: false, mapping: true},
    {displayName: 'Secondary', name: 'secondary', canHaveChild: false, mapping: true},
    {displayName: 'Boolean', name: 'boolean', canHaveChild: false, mapping: false},
    {displayName: 'String', name: 'string', canHaveChild: false, mapping: false},
    {displayName: 'Number', name: 'number', canHaveChild: false, mapping: false},
  ];

  updatePath(path, value) {
    const canReload = typeof _.get(this.rawData, path) == 'object' || typeof value == 'object';
    this.rawData = _.set(this.rawData, path, value);
    if (canReload) {
      this.initialize(this.rawData)
    }
  }

  deleteItem(node: TreeItemFlatNode) {
    this.selectedpath = node.path;
    const parentPath = node.path.slice(0, node.path.lastIndexOf('['));
    let parent = _.get(this.rawData, parentPath);
    if (Array.isArray(parent)) {
      const indexToDelete = +node.path.slice(
        node.path.lastIndexOf('[') + 1,
        node.path.length - 1
      );
      parent = parent.filter((item, index) => index != indexToDelete);
      _.set(this.rawData, parentPath, parent);
    } else {
      _.unset(this.rawData, node.path);
    }
    this.initialize(this.rawData);
  }

  updateKey(node: TreeItemFlatNode, key: any) {
    this.selectedpath = node.path;
    const parentPath = node.path.slice(0, node.path.lastIndexOf('['));
    // const currentKey = node.item;
    let parent = _.get(this.rawData, parentPath);
    if (Array.isArray(parent)) {
      return;
    } else {
      parent[key] = _.get(this.rawData, node.path);
      let newParent = {};
      Object.keys(parent).forEach((index) => {
        const newIndex = index == node.item ? key : index;
        newParent[newIndex] = parent[index];
      });
      _.set(this.rawData, parentPath, newParent);
      _.unset(this.rawData, node.path);
    }
  }
}
