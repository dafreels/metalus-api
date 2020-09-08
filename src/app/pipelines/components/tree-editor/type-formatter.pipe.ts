import { Pipe, PipeTransform } from '@angular/core';
import { SharedFunctions } from 'src/app/shared/utils/shared-functions';

@Pipe({
  name: 'isGenericType'
})
export class IsGenericType implements PipeTransform {

  transform(value: any, ...args: any[]): boolean {
    console.log("IsGenericType -> transform -> value", value)
    return ['string', 'boolean', 'number'].indexOf(value) >=0;
  }

}
