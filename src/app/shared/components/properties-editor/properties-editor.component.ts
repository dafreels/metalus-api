import { ObjectEditorComponent } from './../object-editor/object-editor.component';
import { DisplayDialogService } from './../../services/display-dialog.service';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SharedFunctions } from '../../utils/shared-functions';
import { PackageObject } from '../../../core/package-objects/package-objects.model';
import { generalDialogDimensions } from '../../models/custom-dialog.model';

export interface GlobalParameter {
  id: number;
  name: string;
  value: object;
  type: string;
}

@Component({
  selector: 'app-properties-editor',
  templateUrl: './properties-editor.component.html',
  styleUrls: ['./properties-editor.component.scss']
})
export class PropertiesEditorComponent {
  @Input() allowSpecialParameters = false;
  @Input() packageObjects: PackageObject[];
  @Output() globalObject = new EventEmitter<object>();
  globalParameters: GlobalParameter[] = [];
  id = 0;

  constructor(private displayDialogService: DisplayDialogService) {}

  @Input()
  set globals(global: any) {
    const globalArray: GlobalParameter[] = [];
    Object.keys(global).forEach((key) => {
      globalArray.push({
        id: this.id++,
        name: key,
        value: global[key],
        type: typeof global[key],
      });
    });
    this.globalParameters = globalArray;
  }

  addParameter(type: string) {
    let value;
    switch (type) {
      case 'step':
      case 'secondary':
      case 'global':
      case 'runtime':
      case 'mapped_runtime':
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
      type,
    });
  }

  removeParameter(id: number) {
    const index = this.globalParameters.findIndex((p) => p.id === id);
    if (index > -1) {
      this.globalParameters.splice(index, 1);
      this.generateGlobalsObject();
    }
  }

  openEditor(id: number) {
    const inputData = this.globalParameters.find((p) => p.id === id);
    const editorDialogData = {
      userObject: inputData.value,
      pkgObjs: this.packageObjects,
    };
    const editorDialogResponse = this.displayDialogService.openDialog(
      ObjectEditorComponent,
      generalDialogDimensions,
      editorDialogData
    );
    editorDialogResponse.afterClosed().subscribe((result) => {
      if (result) {
        inputData.value = result.userObject;
        this.globalParameters = [...this.globalParameters];
        this.generateGlobalsObject();
      }
    });
  }

  private generateGlobalsObject() {
    const g = {};
    let leadCharacter;
    this.globalParameters.forEach((param) => {
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
