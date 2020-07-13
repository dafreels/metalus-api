import { Component, Input, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

interface IRouterData {
  page: string;
  title: string;
}

@Component({
  selector: 'nav-toolbar',
  templateUrl: './nav-toolbar.component.html',
  styleUrls: ['./nav-toolbar.component.scss'],
})
export class NavToolbarComponent implements OnInit {
  @Input() page: string;
  @Input() title: string;
  routerData$: Observable<IRouterData>;
  constructor(private router: Router, private activatedRoute: ActivatedRoute) {}
  ngOnInit(){
    this.activatedRoute.data.subscribe(data => {
      this.title=data.title;
      this.page = data.page;
    });
  }
}
