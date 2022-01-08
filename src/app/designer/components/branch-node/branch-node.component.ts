import { Component, EventEmitter, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import {DesignerElement, DesignerElementAction} from "../../designer-constants";

@Component({
  selector: 'branch-designer-node',
  templateUrl: './branch-node.component.html',
  styleUrls: ['./branch-node.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BranchNodeComponent {
  data: DesignerElement;
  id: string;
  @ViewChild(MatMenuTrigger, {static: true}) trigger: MatMenuTrigger;
  @Output() nodeSelected = new EventEmitter<DesignerElement>();
  @Output() nodeRemoved = new EventEmitter<DesignerElement>();
  @Output() nodeAction = new EventEmitter<DesignerElementAction>();

  nodeClicked(event) {
    this.nodeSelected.emit(this.data);

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
