export interface Template {
  id: string;
  name: string;
  group: string;
  version: string;
  sparkVersion: string;
  dependencies?: TemplateDependency[];
}

export interface TemplateDependency {
  group: string;
  version: string;
  sparkVersion: string;
}

export interface GetTemplatesResponse {
  templates: Template[];
}
