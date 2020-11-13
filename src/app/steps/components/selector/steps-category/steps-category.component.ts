import { Component } from '@angular/core';
import { StepsSelectorBase } from '../steps-selector-base';
import {Step} from "../../../steps.model";

interface CategoryNode {
  name: string;
  steps: Step[];
}

@Component({
  selector: 'app-steps-category',
  templateUrl: './steps-category.component.html',
  styleUrls: ['./steps-category.component.scss']
})
export class StepsCategoryComponent extends StepsSelectorBase {
  categories: CategoryNode[];
  constructor() {
    super();
  }

  setSteps(steps) {
    this.categories = [];
    const groupedSteps = steps.sort((a, b) => a.category.localeCompare(b.category));

    let currentCategory;
    groupedSteps.forEach((step) => {
      if (!currentCategory || currentCategory.name != step.category) {
        currentCategory = {
          name: step.category,
          steps: []
        };
        this.categories.push(currentCategory);
      }
      currentCategory.steps.push(step)
    });
    super.setSteps(steps);
  }
}
