export interface Template {
  id: string;
  name: string;
  dependencies?: string[];
}

export interface GetTemplatesResponse {
  templates: Template[];
}
