import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appDesignerNode]',
})
export class DesignerNodeDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
