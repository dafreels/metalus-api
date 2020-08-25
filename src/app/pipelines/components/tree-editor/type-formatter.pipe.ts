import { Pipe, PipeTransform } from '@angular/core';
import { SharedFunctions } from 'src/app/shared/utils/shared-functions';

@Pipe({
  name: 'typeFormatter'
})
export class TypeFormatterPipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    const type = SharedFunctions.getType(value, null);
    if(type){
      return value.slice(1);
    }
    return value;
  }

}
