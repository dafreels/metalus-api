import {Component, Input} from "@angular/core";
import {Schema} from "../../models/schema.model";

@Component({
  selector: 'schema-editor',
  templateUrl: './schema-editor.component.html'
})
export class SchemaEditorComponent {
  @Input() schemaObject: Schema;

  addAttribute() {
    this.schemaObject.attributes.push({
      name: '',
      dataType: {
        baseType: 'string'
      }
    });
  }
}
