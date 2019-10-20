import {Component, EventEmitter, Input, Output} from '@angular/core';
import {SharedFunctions} from "../shared/SharedFunctions";
import {ObjectEditorComponent} from "../object-editor/object.editor.component";
import {MatDialog} from "@angular/material/dialog";
import {IPackageObject} from "../packageObjects/package-objects.model";

export interface GlobalParameter {
  id: number;
  name: string;
  value: object;
  type: string;
}

@Component({
  selector: 'globals-editor',
  templateUrl: './globals.editor.component.html',
  styleUrls: ['./globals.editor.component.css']
})
export class GlobalsEditorComponent {
  @Input() allowSpecialParameters: boolean = false;
  @Input() packageObjects: IPackageObject[];
  @Output() globalObject = new EventEmitter<object>();
  globalParameters: GlobalParameter[] = [];
  id: number = 0;

  constructor(private dialog: MatDialog) {}

  @Input()
  set globals(global: any) {
    const globalArray: GlobalParameter[] = [];
    Object.keys(global).forEach(key => {
      globalArray.push({
        id: this.id++,
        name: key,
        value: global[key],
        type: typeof global[key]
      });
    });
    this.globalParameters = globalArray;
  };

  addParameter(type: string) {
    let value;
    switch(type) {
      case 'step':
      case 'secondary':
      case 'global':
      case 'runtime':
      case 'string':
        value = '';
        break;
      case 'boolean':
        value = false;
        break;
      case 'number':
        value = 0;
        break;
      case 'object':
        value = {};
        break;
    }
    this.globalParameters.push({
      id: this.id++,
      name: '',
      value,
      type
    });
  }

  removeParameter(id: number) {
    const index = this.globalParameters.findIndex(p => p.id === id);
    if (index > -1) {
      this.globalParameters.splice(index, 1);
      this.generateGlobalsObject();
    }
  }

  openEditor(id: number) {
    const inputData = this.globalParameters.find(p => p.id === id);
    const dialogRef = this.dialog.open(ObjectEditorComponent, {
      width: '75%',
      height: '90%',
      data: {userObject: inputData.value, pkgObjs: this.packageObjects }
    });
    dialogRef.afterClosed().subscribe(result => {
      if(result) {
        inputData.value = result.userObject;
        this.globalParameters = [...this.globalParameters];
        this.generateGlobalsObject();
      }
    });
  }

  private generateGlobalsObject() {
    const g = {};
    let leadCharacter;
    this.globalParameters.forEach(param => {
      if (param.name && param.name.trim().length > 0) {
        leadCharacter = SharedFunctions.getLeadCharacter(param.type);
        if (leadCharacter !== '') {
          g[param.name] = `${leadCharacter}${param.value}`;
        } else {
          g[param.name] = param.value;
        }
      }
    });
    this.globalObject.emit(g);
  }
}
