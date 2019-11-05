export interface IPackageObjectsResponse {
  'package-objects': IPackageObject[];
}

export interface IPackageObject {
  id: string;
  schema: string;
  layout: string;
}

export interface IPackageObjectResponse {
  pkgObjs: IPackageObject[];
}
