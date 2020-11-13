import {Component, Inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {DomSanitizer, SafeUrl} from "@angular/platform-browser";

@Component({
  selector: 'help',
  templateUrl: './help.component.html',
})
export class HelpComponent {
  trustedUrl: SafeUrl;

  constructor(public dialogRef: MatDialogRef<string>,
              @Inject(MAT_DIALOG_DATA) public data: string,
              private sanitizer: DomSanitizer) {
    this.trustedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`/docs/${data}.html`);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
