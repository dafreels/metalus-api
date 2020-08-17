import { Directive, OnInit, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[appTreeonload]'
})
export class TreeonloadDirective implements OnInit {
  @Output('appTreeonload') initEvent: EventEmitter<any> = new EventEmitter();
  constructor() { }
  ngOnInit() {
      setTimeout(() => this.initEvent.emit(), 0);
  }
}
