import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Schema } from "../../models/schema.model";

@Component({
  selector: 'schema-editor',
  templateUrl: './schema-editor.component.html'
})
export class SchemaEditorComponent implements OnInit{

  // private _schemaObject:Schema
  // @Input() set schemaObject(schemaObj){
  //   console.log('schemaObj',schemaObj);
  //   this._schemaObject = schemaObj;
  //   this.change.emit(this._schemaObject);
  // }
  // get schemaObject() {
  //   return this._schemaObject;
  // }
  @Input('schemaObject') schemaObject: Schema;
  @Input() canSubmit:boolean = true;
  // schemaObject;
  @Output() schemaChanged = new EventEmitter();
  ngOnInit(): void {
    // this.schemaObject = new Proxy(this.schemaObjectInput, {
    //   set: (target:any, key:string, value) => {
    //     console.log(`${key} set to ${value}`);
    //     this.change.emit(target);
    //     target[key] = value;
    //     return true;
    //   }
    // });
    // setInterval(()=>{
    //   console.log(this.schemaObject);
    // }, 1500)
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
