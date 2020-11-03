import {Component, Input} from '@angular/core';
import {MatDialog} from "@angular/material/dialog";
import {HelpComponent} from "../help/help.component";

@Component({
  selector: 'nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss']
})
export class NavMenuComponent {
  @Input() currentPage: string;

  constructor(public dialog: MatDialog) {}

  openHelp() {
    this.dialog.open(HelpComponent, {
      width: '75%',
      height: '75%',
      data: 'index',
    });
  }
}
