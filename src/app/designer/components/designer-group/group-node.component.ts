import {Component, EventEmitter, Output, ViewChild, ViewEncapsulation} from '@angular/core';
import {MatMenuTrigger} from '@angular/material/menu';
import {DesignerElement, DesignerElementAction} from "../../designer-constants";

@Component({
  selector: 'group-designer-node',
  templateUrl: './group-node.component.html',
  styleUrls: ['./group-node.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GroupNodeComponent {
  data: DesignerElement;
  id: string;
  name: string;
  @ViewChild(MatMenuTrigger, {static: true}) trigger: MatMenuTrigger;
  @Output() nodeSelected = new EventEmitter<DesignerElement>();
  @Output() nodeRemoved = new EventEmitter<DesignerElement>();
  @Output() nodeAction = new EventEmitter<DesignerElementAction>();

  collapsed: boolean = false;
  contentClass: string = 'expanded';

  nodeClicked(event) {
    this.nodeSelected.emit(this.data);
  }

  removeNode() {
    this.trigger.closeMenu();
    this.nodeRemoved.emit(this.data);
  }

  handleAction(action: string) {
    this.collapsed = !this.collapsed;
    this.contentClass = this.collapsed ? 'collapsed' : 'expanded';
    this.nodeAction.emit({
      action: !this.collapsed ? 'expand' : 'collapse',
      element: this.data
    });
  }
}
