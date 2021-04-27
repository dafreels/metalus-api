export interface Schema {
  attributes: Attribute[];
}
export interface Attribute {
  name: string;
  dataType: AttributeType;
}

export interface AttributeType {
  baseType: string;
  valueType?: AttributeType;
  nameType?: AttributeType;
  schema?: Schema;
}
