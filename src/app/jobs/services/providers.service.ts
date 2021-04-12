import {Injectable} from "@angular/core";
import {Observable, of, throwError} from "rxjs";
import {
  Cluster,
  ClusterResponse,
  ClustersResponse,
  FormRespsonse,
  Provider,
  ProviderResponse,
  ProvidersResponse,
  ProviderType,
  ProviderTypesResponse
} from "../models/providers.model";
import {catchError, map} from "rxjs/operators";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class ProvidersService {
  constructor(private http: HttpClient) {}

  getProviderTypesList(): Observable<ProviderType[]> {
    const providerTypes = sessionStorage.getItem('providerTypes');
    if (providerTypes) {
      return of(JSON.parse(providerTypes));
    }
    return this.http.get<ProviderTypesResponse>('/api/v1/provider-types', {observe: 'response'})
      .pipe(
        map(response => {
          if (response && response.body) {
            sessionStorage.setItem('providerTypes', JSON.stringify(response.body.providers));
            return response.body.providers;
          }
          return [];
        }),
        catchError(err => throwError(err)));
  }

  getNewProviderForm(providerId) {
    const form = sessionStorage.getItem(`newProviderForm${providerId}`);
    if (form) {
      return of(JSON.parse(form));
    }
    return this.http.get<FormRespsonse>(`/api/v1/provider-types/${providerId}/form`, {observe: 'response'})
      .pipe(
        map(response => {
          if (response && response.body) {
            sessionStorage.setItem(`newProviderForm${providerId}`, response.body.form);
            return JSON.parse(response.body.form);
          }
          return null;
        }),
        catchError(err => throwError(err)));
  }

  getNewClusterForm(providerId) {
    const form = sessionStorage.getItem(`newClusterForm${providerId}`);
    if (form) {
      return of(JSON.parse(form));
    }
    return this.http.get<FormRespsonse>(`/api/v1/providers/${providerId}/new-cluster-form`, {observe: 'response'})
      .pipe(
        map(response => {
          if (response && response.body) {
            sessionStorage.setItem(`newClusterForm${providerId}`, response.body.form);
            return JSON.parse(response.body.form);
          }
          return null;
        }),
        catchError(err => throwError(err)));
  }

  getCustomJobForm(providerId) {
    const form = sessionStorage.getItem(`customJobForm${providerId}`);
    if (form) {
      return of(JSON.parse(form));
    }
    return this.http.get<FormRespsonse>(`/api/v1/providers/${providerId}/custom-job-form`, {observe: 'response'})
      .pipe(
        map(response => {
          if (response && response.body) {
            sessionStorage.setItem(`customJobForm${providerId}`, response.body.form);
            return JSON.parse(response.body.form);
          }
          return null;
        }),
        catchError(err => throwError(err)));
  }

  getProvidersList(): Observable<Provider[]> {
    return this.http.get<ProvidersResponse>('/api/v1/providers', {observe: 'response'})
      .pipe(
        map(response => {
          if (response && response.body) {
            return response.body.providers;
          }
          return [];
        }),
        catchError(err => throwError(err)));
  }

  addProvider(provider: Provider): Observable<Provider> {
    return this.http
      .post<ProviderResponse>('/api/v1/providers', provider, {
        observe: 'response',
      })
      .pipe(
        map((response) => response.body.provider),
        catchError((err) => throwError(err))
      );
  }

  removeProvider(providerId: string) {
    return this.http
      .delete(`/api/v1/providers/${providerId}`, {
        observe: 'response',
      })
      .pipe(catchError((err) => throwError(err)));
  }

  getClustersList(providerId: string): Observable<Cluster[]> {
    return this.http.get<ClustersResponse>(`/api/v1/providers/${providerId}/clusters`, {observe: 'response'})
      .pipe(
        map(response => {
          if (response && response.body) {
            return response.body.clusters;
          }
          return [];
        }),
        catchError(err => throwError(err)));
  }

  addCluster(providerId: string, cluster: Cluster) {
    return this.http
      .post<ClusterResponse>(`/api/v1/providers/${providerId}/clusters`, cluster, {
        observe: 'response',
      })
      .pipe(
        map((response) => response.body.cluster),
        catchError((err) => throwError(err))
      );
  }

  startCluster(providerId: string, cluster: Cluster) {
    return this.http
      .put(`/api/v1/providers/${providerId}/clusters/${cluster.id}/start?clusterName=${cluster.name}`, null,{
        observe: 'response',
      })
      .pipe(
        catchError((err) => throwError(err))
      );
  }

  stopCluster(providerId: string, cluster: Cluster) {
    return this.http
      .put(`/api/v1/providers/${providerId}/clusters/${cluster.id}/stop?clusterName=${cluster.name}`, null,{
        observe: 'response',
      })
      .pipe(
        catchError((err) => throwError(err))
      );
  }

  deleteCluster(providerId: string, cluster: Cluster) {
    return this.http
      .delete(`/api/v1/providers/${providerId}/clusters/${cluster.id}?clusterName=${cluster.name}`, {
        observe: 'response',
      })
      .pipe(catchError((err) => throwError(err)));
  }
}
