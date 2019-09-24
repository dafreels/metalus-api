import {Component, EventEmitter, Output, ViewEncapsulation} from "@angular/core";
import {DesignerElement} from "../designer.component";

@Component({
  selector: 'designer-node',
  templateUrl: './designer.node.component.html',
  styleUrls: ['./designer.node.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DesignerNodeComponent {
  data: DesignerElement;
  id: string;
  @Output() nodeSelected = new EventEmitter<DesignerElement>();

  nodeClicked() {
    this.nodeSelected.emit(this.data);
  }
}
