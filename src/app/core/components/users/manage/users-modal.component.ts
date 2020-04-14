import {Component, Inject} from "@angular/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {User} from "../../../../shared/models/users.models";
import {UsersService} from "../../../../shared/services/users.service";

@Component({
  templateUrl: './users-modal.component.html',
  styleUrls: ['./users-modal.component.scss']
})
export class UsersModalComponent {

  constructor(public dialogRef: MatDialogRef<User>,
              @Inject(MAT_DIALOG_DATA) public data: User,
              private usersService: UsersService) {}

  closeDialog() {
    this.dialogRef.close();
  }

  saveUser() {
    if (this.data.id && this.data.id.trim().length > 0) {
      this.usersService.updateUser(this.data).subscribe(data => {
        this.dialogRef.close(data);
      });
    } else {
      this.usersService.addUser(this.data).subscribe(data => {
        this.dialogRef.close(data);
      });
    }
  }
}
