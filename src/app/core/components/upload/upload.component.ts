import {Component, OnInit, ViewChild} from "@angular/core";
import {AuthService} from "../../../shared/services/auth.service";
import {User} from "../../../shared/models/users.models";
import {forkJoin} from "rxjs";
import {FilesService} from "../../../shared/services/files.service";
import {UploadedFile} from "../../../shared/models/files.model";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {MatDialog} from "@angular/material/dialog";
import {DialogDimensions} from "../../../shared/models/custom-dialog.model";
import {ConfirmationModalComponent} from "../../../shared/components/confirmation/confirmation-modal.component";
import {Router} from "@angular/router";
import {PasswordDialogComponent} from "../../../shared/components/password-dialog/password-dialog.component";
import {WaitModalComponent} from "../../../shared/components/wait-modal/wait-modal.component";
import {ErrorModalComponent} from "../../../shared/components/error-modal/error-modal.component";
import {COMMA, ENTER} from "@angular/cdk/keycodes";
import {FormControl} from "@angular/forms";
import {MatChipInputEvent} from "@angular/material/chips";

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit {
  user: User;
  @ViewChild('file', {static: false}) file;
  files: Set<File> = new Set();
  uploadedFiles: UploadedFile[] = [];
  sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  progress;
  uploading = false;
  uploadSuccessful = false;

  // Additional Repos Chip fields
  additionalRepos: string[] = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  additionalReposCtrl = new FormControl();

  // Remote Jars Chip fields
  remoteJars: string[] = [];
  remoteJarsCtrl = new FormControl();

  constructor(private authService: AuthService,
              private filesService: FilesService,
              private displayDialogService: DisplayDialogService,
              public dialog: MatDialog,
              private router: Router) {
    this.user = this.authService.getUserInfo();
    this.authService.userItemSelection.subscribe(data => this.user = data);
  }

  ngOnInit(): void {
    this.filesService.getFiles(this.user).subscribe(data => this.uploadedFiles = data);
  }

  addFiles() {
    this.file.nativeElement.click();
  }

  onFilesAdded() {
    const files: { [key: string]: File } = this.file.nativeElement.files;
    for (let key in files) {
      if (!isNaN(parseInt(key))) {
        this.files.add(files[key]);
      }
    }
    this.uploadFiles();
  }

  uploadFiles() {
    // set the component state to "uploading"
    this.uploading = true;
    // start the upload and save the progress map
    this.progress = this.filesService.uploadFiles(this.user, this.files);

    // // convert the progress map into an array
    const allProgressObservables = [];
    for (let key in this.progress) {
      allProgressObservables.push(this.progress[key].progress);
    }
    // When all progress-observables are completed...
    forkJoin(allProgressObservables).subscribe(end => {
      this.filesService.getFiles(this.user).subscribe(data => {
        this.uploadSuccessful = true;
        this.uploading = false;
        this.uploadedFiles = data;
        this.files = new Set();
      });
    });
  }

  removeFile(fileName) {
    const deleteStepDialogData = {
      message:
        'Are you sure you wish to delete this file? Would you like to continue?',
    };
    const deleteStepDialogDimensions: DialogDimensions = {
      width: '450px',
      height: '200px',
    };
    const deleteStepDialog = this.displayDialogService.openDialog(
      ConfirmationModalComponent,
      deleteStepDialogDimensions,
      deleteStepDialogData
    );
    deleteStepDialog.afterClosed().subscribe(confirmation => {
      if (confirmation) {
        this.filesService.removeFile(this.user, fileName).subscribe(data => {
          this.filesService.getFiles(this.user).subscribe(data => {
            this.uploadedFiles = data;
          });
        });
      }
    });
  }

  processJars() {
    const dialogRef = this.dialog.open(PasswordDialogComponent, {
      width: '25%',
      height: '25%',
      data: { password: '' },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const waitDialogRef = this.dialog.open(WaitModalComponent, {
          width: '25%',
          height: '25%',
        });
        this.filesService.processFiles(this.user, result,
          this.additionalRepos.join(','),
          this.remoteJars.join(',')).subscribe(data => {
          waitDialogRef.close();
          this.router.navigate(['landing']);
        },
          (error) => this.handleError(error, dialogRef));
      }
    });
  }

  convertBytes(bytes) {
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const convertedSize = (bytes / Math.pow(1024, i)).toFixed(2);
    return `${convertedSize} ${this.sizes[i]}`;
  }

  private handleError(error, dialogRef) {
    let message;
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      message = error.error.message;
    } else {
      message = error.message;
    }
    dialogRef.close();
    this.dialog.open(ErrorModalComponent, {
      width: '450px',
      height: '300px',
      data: { message },
    });
  }

  removeAdditionalRepo(repo: string) {
    const index = this.additionalRepos.indexOf(repo);
    if (index > -1) {
      this.additionalRepos.splice(index, 1);
    }
  }

  addAdditionalRepo(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    // Add our package
    if ((value || '').trim()) {
      if (!this.additionalRepos) {
        this.additionalRepos = [];
      }
      this.additionalRepos.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.additionalReposCtrl.setValue(null);
  }

  removeRemoteJar(repo: string) {
    const index = this.remoteJars.indexOf(repo);
    if (index > -1) {
      this.remoteJars.splice(index, 1);
    }
  }

  addRemoteJar(event: MatChipInputEvent) {
    const input = event.input;
    const value = event.value;

    // Add our package
    if ((value || '').trim()) {
      if (!this.remoteJars) {
        this.remoteJars = [];
      }
      this.remoteJars.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }

    this.remoteJarsCtrl.setValue(null);
  }
}
