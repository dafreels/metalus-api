import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-prompt',
  templateUrl: './prompt.component.html',
  styleUrls: ['./prompt.component.scss'],
})
export class PromptComponent implements AfterViewInit {
  @ViewChild('userInput', {static: false}) nameInput: MatInput;
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; label: string; value: any }) {
    if (!data) {
      data = {
        title: 'Prompt',
        label: 'Name',
        value: '',
      };
    }
  }
  ngAfterViewInit() {
    this.nameInput.focus();
  }
}
