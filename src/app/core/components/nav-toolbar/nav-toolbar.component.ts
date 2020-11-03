import { Component, Input, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import {MatDialog} from "@angular/material/dialog";
import {HelpComponent} from "../help/help.component";

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
  constructor(private router: Router, private activatedRoute: ActivatedRoute, public dialog: MatDialog) {}
  ngOnInit(){
    this.activatedRoute.data.subscribe(data => {
      this.title=data.title;
      this.page = data.page;
    });
  }

  openHelp(page: string) {
    let data;
    switch(page) {
      case 'pipelines-editor':
        data = 'pipeline-editor';
        break;
      case 'landing':
        data = 'index';
        break;
      default:
        data = page;
    }
    this.dialog.open(HelpComponent, {
      width: '75%',
      height: '75%',
      data,
    });
  }
}
