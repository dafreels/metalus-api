import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[designer-node]',
})
export class DesignerNodeDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
