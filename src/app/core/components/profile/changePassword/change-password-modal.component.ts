import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';
import {FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators} from "@angular/forms";

export const passwordValidator: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
  const newPassword = control.get('newPassword');
  const verifyNewPassword = control.get('verifyNewPassword');
  if (newPassword && !verifyNewPassword) {
    return { passwordMismatch: true };
  } else if (newPassword && verifyNewPassword && newPassword.value !== verifyNewPassword.value) {
    return { passwordMismatch: true };
  } else if (!newPassword && verifyNewPassword) {
    return { passwordMismatch: true };
  }
  return null;
};

@Component({
  templateUrl: './change-password-modal.component.html',
  styleUrls: ['./change-password-modal.component.scss']
})
export class ChangePasswordModalComponent {
  passwordForm = this.formBuilder.group({
    password: ['', [Validators.required]],
    newPassword: ['', [Validators.required]],
    verifyNewPassword: ['', [Validators.required]]
  }, {validators: [passwordValidator, Validators.required]});

  constructor(
    public dialogRef: MatDialogRef<any>,
    private formBuilder: FormBuilder
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }

  savePassword() {
    this.dialogRef.close({
      password: this.passwordForm.get('password').value,
      newPassword: this.passwordForm.get('newPassword').value,
      verifyNewPassword: this.passwordForm.get('verifyNewPassword').value
    });
  }
}
