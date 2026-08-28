export type UploadFileKind = 'video' | 'csv';

export interface StoredUploadFile {
  file: File;
  name: string;
  size: number;
  kind: UploadFileKind;
}
