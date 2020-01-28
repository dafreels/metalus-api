export interface PackageObjectsResponse {
  'package-objects': PackageObject[];
}

export interface PackageObject {
  id: string;
  schema: string;
  layout: string;
}

export interface PackageObjectResponse {
  pkgObjs: PackageObject[];
}
