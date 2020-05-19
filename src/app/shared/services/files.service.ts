import {User, UserResponse} from "../models/users.models";
import {Observable, Subject, throwError} from "rxjs";
import {HttpClient, HttpEventType, HttpRequest, HttpResponse} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {catchError, map} from "rxjs/operators";
import {GetFilesResponse, UploadedFile} from "../models/files.model";

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  constructor(private http: HttpClient) {}

  getFiles(user: User): Observable<UploadedFile[]> {
    return this.http
      .get<GetFilesResponse>(`/api/v1/users/${user.id}/project/${user.defaultProjectId}/files`, { observe: 'response' })
      .pipe(
        map((response) => {
          if (response && response.body) {
            return response.body.files.map((p) => {
              delete p['_id'];
              return p;
            });
          }
          return [];
        }),
        catchError((err) => throwError(err))
      );
  }

  /**
   * Upload file(s) to the server. Taken from https://malcoded.com/posts/angular-file-upload-component-with-express/
   * @param user The current user
   * @param files A list of files to upload
   */
  uploadFiles(user: User, files: Set<File>): { [key: string]: { progress: Observable<number> } } {
    // this will be the our resulting map
    const status: { [key: string]: { progress: Observable<number> } } = {};

    files.forEach(file => {
      // create a new multipart-form for every file
      const formData: FormData = new FormData();
      formData.append('file', file, file.name);
      // create a http-post request and pass the form
      // tell it to report the upload progress
      const req = new HttpRequest('POST',
        `/api/v1/users/${user.id}/project/${user.defaultProjectId}/upload`,
        formData, {
          reportProgress: true,
          withCredentials: true
        });

      // create a new progress-subject for every file
      const progress = new Subject<number>();

      // send the http-request and subscribe for progress-updates
      this.http.request(req).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          // calculate the progress percentage
          const percentDone = Math.round(100 * event.loaded / event.total);
          // pass the percentage into the progress-stream
          progress.next(percentDone);
        } else if (event instanceof HttpResponse) {
          // Close the progress-stream if we get an answer form the API
          // The upload is complete
          progress.complete();
        }
      });

      // Save every progress-observable in a map of all observables
      status[file.name] = {
        progress: progress.asObservable()
      };
    });

    // return the map of progress.observables
    return status;
  }

  removeFile(user: User, fileName: string) {
    return this.http.delete(`/api/v1/users/${user.id}/project/${user.defaultProjectId}/files/${fileName}`, {})
      .pipe(catchError((err) => throwError(err)));
  }

  processFiles(user: User, password: string, additionalRepos: string, remoteJars: string) {
    const body = {
      password,
      repos: additionalRepos,
      remoteJars
    };
    return this.http.put(`/api/v1/users/${user.id}/project/${user.defaultProjectId}/processUploadedJars`, body)
      .pipe(catchError((err) => throwError(err)));
  }
}
