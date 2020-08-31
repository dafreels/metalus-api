import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-prompt',
  templateUrl: './prompt.component.html',
  styleUrls: ['./prompt.component.scss'],
})
export class PromptComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { title: string; label: string; value: any }) {
    if (!data) {
      data = {
        title: 'Prompt',
        label: 'Name',
        value: '',
      };
    }
  }
}
