export interface GetTemplatesResponse {
  template: Template;
}

export interface Template {
  projectSets: ProjectSet[];
  libraries: Library[];
}

export interface ProjectSet {
  name: string;
  components: Component[];
}

export interface Component {
  name: string;
  artifact: string;
  dependencies?: string[];
}

export interface Library {
  mavenPath: string;
  versions: string[];
  scala_spark_versions: ScalaSparkVersion[];
  projectSet: string;
}

export interface ScalaSparkVersion {
  scala: string;
  spark: string;
}
