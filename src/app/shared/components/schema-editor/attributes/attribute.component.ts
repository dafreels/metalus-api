import {Component, Input} from "@angular/core";
import {Attribute} from "../../../models/schema.model";

@Component({
  selector: 'attribute-editor',
  templateUrl: './attribute.component.html',
  styleUrls: ['./attribute.component.scss'],
})
export class AttributeComponent {
  @Input() attribute: Attribute;
}
