import { Component, EventEmitter, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import {DesignerElement, DesignerElementAction} from "../../designer-constants";

@Component({
  selector: 'app-designer-node',
  templateUrl: './designer-node.component.html',
  styleUrls: ['./designer-node.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DesignerNodeComponent {
  data: DesignerElement;
  id: string;
  @ViewChild(MatMenuTrigger, {static: true}) trigger: MatMenuTrigger;
  @Output() nodeSelected = new EventEmitter<DesignerElement>();
  @Output() nodeRemoved = new EventEmitter<DesignerElement>();
  @Output() nodeAction = new EventEmitter<DesignerElementAction>();

  nodeClicked(event) {
    this.nodeSelected.emit(this.data);
    if(event.shiftKey) {
      this.trigger.openMenu();
    }
  }

  removeNode() {
    this.trigger.closeMenu();
    this.nodeRemoved.emit(this.data);
  }

  handleAction(action: string) {
    this.nodeAction.emit({
      action,
      element: this.data
    })
  }
}
