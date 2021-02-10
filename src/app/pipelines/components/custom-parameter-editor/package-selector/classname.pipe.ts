import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'className'
})
export class ClassNamePipe implements PipeTransform {

  transform(value: any, ...args: any[]): any {
    const path = value.split('.');
    return path ? path[path.length-1]: value;
  }

}
