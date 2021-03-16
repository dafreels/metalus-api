export interface ProviderType {
  id: string;
  name: string;
}

export interface Provider {
  id: string;
  name: string;
  description: string;
  providerTypeId: string;
  providerName: string;
}

export interface ProviderTypesResponse {
  providers: ProviderType[];
}

export interface ProvidersResponse {
  providers: Provider[];
}

export interface ProviderResponse {
  provider: Provider;
}

export interface Cluster {
  id: string;
  name: string;
  providerName: string;
  version: string;
  state: string;
  source: string;
  startTime: number;
  terminationTime?: number;
  canStart: boolean;
  canStop: boolean;
  canDelete: boolean;
}

export interface ClustersResponse {
  clusters: Cluster[];
}

export interface ClusterResponse {
  cluster: Cluster;
}

export interface FormRespsonse {
  form: string;
}
