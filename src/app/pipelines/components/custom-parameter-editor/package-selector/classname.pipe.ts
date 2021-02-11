import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'packageName'
})
export class packageNamePipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    if(value){
    const path = value.split('.');
    return path ? path[path.length-1]: value;
  }
  }
}
