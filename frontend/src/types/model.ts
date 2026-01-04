export interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
  digest: string;
}

export interface ModelListResponse {
  models: OllamaModel[];
}
