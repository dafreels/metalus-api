import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Schema } from "../../models/schema.model";

@Component({
  selector: 'schema-editor',
  templateUrl: './schema-editor.component.html'
})
export class SchemaEditorComponent implements OnInit{

  @Input('schemaObject') schemaObject: Schema;
  @Input() canSubmit:boolean = true;
  @Output() schemaChanged = new EventEmitter();
  ngOnInit(): void {
    
  }
  addAttribute() {
    this.schemaObject.attributes.push({
      name: '',
      dataType: {
        baseType: 'string'
      }
    });
  }
  submit(){
    this.schemaChanged.emit(this.schemaObject);
  }
}
