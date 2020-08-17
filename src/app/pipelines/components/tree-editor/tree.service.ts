import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import * as _ from 'lodash';

/**
 * Node for to-do item
 */
export class TodoItemNode {
  children: TodoItemNode[];
  item: string;
  type: string;
  path: string;
  value: string|number|boolean;
  length: number;
}

/** Flat to-do item node with expandable and level information */
export class TodoItemFlatNode {
  children: TodoItemFlatNode[];
  item: string;
  level: number;
  expandable: boolean;
  path: string;
  type: string
  value: string|number|boolean;
  length: number;
}

/**
 * The Json object for to-do list data.
 */
const TREE_DATA = {
  Groceries: {
    'Test': true,
    'TestFalse': false,
    'Almond Meal flour': null,
    'Organic eggs': null,
    'Protein Powder': null,
    'Fruits': {
      Apple: null,
      Berries: ['Blueberry', 'Raspberry'],
      Orange: null,
    },
    'Avalable': false
  },
  Reminders: [
    'Cook dinner',
    'Read the Material Design spec',
    'Upgrade Application to Angular',
  ],
};

/**
 * Checklist database, it can build a tree structured Json object.
 * Each node in Json object represents a to-do item or a category.
 * If a node is a category, it has children items and new items can be added under the category.
 */
@Injectable()
export class ChecklistDatabase {
  dataChange = new BehaviorSubject<TodoItemNode[]>([]);
  rawData: any;
  get data(): TodoItemNode[] {
    return this.dataChange.value;
  }

  constructor() {
    this.initialize(TREE_DATA);
  }

  initialize(rawData) {
    // Build the tree nodes from Json object. The result is a list of `TodoItemNode` with nested
    //     file node as children.
    this.rawData = rawData;
    const data = this.buildFileTree(rawData, 0);
    // Notify the change.
    this.dataChange.next(data);
    // console.log('ChecklistDatabase -> initialize -> data', data);
  }

  /**
   * Build the file structure tree. The `value` is the Json object, or a sub-tree of a Json object.
   * The return value is the list of `TodoItemNode`.
   */
  buildFileTree(
    obj: { [key: string]: any },
    level: number,
    path: string = ''
  ): TodoItemNode[] {
    return Object.keys(obj).reduce<TodoItemNode[]>((accumulator, key) => {
      const value = obj[key];
      const node = new TodoItemNode();
      node.path = `${path}[${key}]`;
      node.item = key;

      if (value != null) {
        if (typeof value === 'object') {
          node.children = this.buildFileTree(value, level + 1, node.path);
          if(Array.isArray(value)) {
            node.type = 'array';
            node.length = value.length;
          } else {
            node.type = 'object';
            node.length = Object.keys(value).length
          }
        } else {
          node.value = value
          // node.item = value;
          node.type = typeof value;
        }
      }

      return accumulator.concat(node);
    }, []);
  }

  /** Add an item to to-do list */
  insertItem(parent: TodoItemNode, name: string) {
    if (parent.children) {
      parent.children.push({ item: name } as TodoItemNode);
      this.dataChange.next(this.data);
    }
  }
  insertPath(path: string, type: string, value: string, objKey = '') {
    let item = _.get(this.rawData, path);
    
    if(Array.isArray(item)) {
        item.push(value);
    }
    else if(typeof item === 'object') {
        item[objKey] = value
    }
    this.rawData = _.set(this.rawData, path, item);
    this.initialize(this.rawData);
    console.log(
      'insertPath -> _.get(this.rawData, path)',
      _.get(this.rawData, path)
    );
  }
  types = [{ name: 'array' }, { name: 'object' }, { name: 'boolean' }, { name: 'string' }, { name: 'number' }];
  insertArray(parent: TodoItemNode, name: string, type: string) {
    switch (type) {
      case 'array':
        parent.children.push(this.buildFileTree([], 1)[0] as TodoItemNode);
        break;
    }
  }
  updatePath(path, value) {
    this.rawData = _.set(this.rawData, path, value);
    this.initialize(this.rawData);
  }
  updateItem(node: TodoItemNode, name: string) {
    node.item = name;
    this.dataChange.next(this.data);
  }
}
