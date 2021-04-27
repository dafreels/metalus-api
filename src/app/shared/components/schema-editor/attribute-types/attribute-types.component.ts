import {Component, Input} from "@angular/core";
import {AttributeType} from "../../../models/schema.model";

@Component({
  selector: 'attribute-type-editor',
  templateUrl: './attribute-types.component.html'
})
export class AttributeTypesComponent {
  baseTypes: string[] = [
    'string',
    'double',
    'integer',
    'timestamp',
    'decimal',
    'struct',
    'array',
    'map'
  ];
  @Input() dataType: AttributeType;

  addType(type) {
    if (type === 'name') {
      this.dataType.nameType = {
        baseType: 'string'
      }
    } else {
      this.dataType.valueType = {
        baseType: 'string'
      }
    }

  }

  addSchema() {
    this.dataType.schema = {
      attributes: [
        {
          name: '',
          dataType: {
            baseType: 'string'
          }
        }
      ]
    }
  }
}
