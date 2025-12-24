export enum ChangedFileStatus {
  Added = "added",
  Modified = "modified",
  Deleted = "deleted",
}

export interface ChangedFile {
  path: string;
  status: ChangedFileStatus;
}

export interface GitDiffResult {
  changedFiles: ChangedFile[];
  error?: string;
}
