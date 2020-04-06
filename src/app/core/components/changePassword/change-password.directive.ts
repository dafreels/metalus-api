import {AbstractControl, FormGroup, NG_VALIDATORS, ValidationErrors, Validator, ValidatorFn} from "@angular/forms";
import {Directive} from "@angular/core";

export const passwordValidator: ValidatorFn = (control: FormGroup): ValidationErrors | null => {
  const newPassword = control.get('newPassword');
  const verifyNewPassword = control.get('verifyNewPassword');
  return newPassword && verifyNewPassword && newPassword.value === verifyNewPassword.value ? null : { passwordMismatch: true };
};

@Directive({
  selector: '[validNewPassword]',
  providers: [{ provide: NG_VALIDATORS, useExisting: ChangePasswordValidatorDirective, multi: true }]
})
export class ChangePasswordValidatorDirective implements Validator {
  validate(control: AbstractControl): ValidationErrors {
    return passwordValidator(control)
  }
}
