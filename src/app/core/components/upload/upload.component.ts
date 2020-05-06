import {Component, OnInit, ViewChild} from "@angular/core";
import {AuthService} from "../../../shared/services/auth.service";
import {User} from "../../../shared/models/users.models";
import {forkJoin} from "rxjs";
import {FilesService} from "../../../shared/services/files.service";
import {UploadedFile} from "../../../shared/models/files.model";
import {UsersService} from "../../../shared/services/users.service";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {MatDialog} from "@angular/material/dialog";
import {DialogDimensions} from "../../../shared/models/custom-dialog.model";
import {ConfirmationModalComponent} from "../../../shared/components/confirmation/confirmation-modal.component";

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit {
  user: User;
  @ViewChild('file', {static: false}) file;
  files: Set<File> = new Set();
  uploadedFiles: UploadedFile[];
  sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  progress;
  uploading = false;
  uploadSuccessful = false;

  constructor(private authService: AuthService,
              private filesService: FilesService,
              private displayDialogService: DisplayDialogService,
              public dialog: MatDialog) {
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

  convertBytes(bytes) {
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const convertedSize = (bytes / Math.pow(1024, i)).toFixed(2);
    return `${convertedSize} ${this.sizes[i]}`;
  }
}
