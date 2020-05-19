export interface UploadedFile {
  name: string;
  path: string;
  size: number;
  createdDate: Date;
  modifiedDate: Date;
}

export interface GetFilesResponse {
  files: UploadedFile[];
}
