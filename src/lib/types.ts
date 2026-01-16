export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS';

export interface Header {
  key: string;
  value: string;
  enabled: boolean;
}

export interface RequestPayload {
  url: string;
  method: HttpMethod;
  headers: Header[];
  body: string | null;
}

export interface HistoryResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  duration: number;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  request: RequestPayload;
  resolvedRequest?: RequestPayload;
  response: HistoryResponse | null;
  error: string | null;
}

export interface CollectionMeta {
  id: string;
  name: string;
  description?: string;
  updatedAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  items: CollectionItem[];
}

export type CollectionItem = CollectionFolder | SavedRequest;

export interface CollectionFolder {
  type: 'folder';
  id: string;
  name: string;
  items: CollectionItem[];
  expanded: boolean;
}

export interface SavedRequest {
  type: 'request';
  id: string;
  name: string;
  request: RequestPayload;
  createdAt: number;
  updatedAt: number;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  enabled: boolean;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvironmentVariable[];
  createdAt: number;
  updatedAt: number;
}

export interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
}
