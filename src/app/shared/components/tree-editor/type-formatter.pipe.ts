import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'isGenericType'
})
export class IsGenericType implements PipeTransform {

  transform(value: any, ...args: any[]): boolean {
    return ['string', 'boolean', 'number', 'text', 'integer'].indexOf(value) >= 0;
  }

}
