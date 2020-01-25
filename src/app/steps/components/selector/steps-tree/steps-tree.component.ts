import { Component } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { Step } from '../../../steps.model';
import { StepsSelectorBase } from '../steps-selector-base';

interface StepNode {
  name: string;
  id?: string;
  type: string;
  children?: StepNode[];
  step?: Step;
}

@Component({
  selector: 'app-steps-tree',
  templateUrl: './steps-tree.component.html',
  styleUrls: ['./steps-tree.component.css']
})
export class StepsTreeComponent extends StepsSelectorBase {
  treeControl = new NestedTreeControl<StepNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<StepNode>();

  hasChild = (_: number, node: StepNode) => !!node.children && node.children.length > 0;

  constructor() {
    super();
  }

  setSteps(steps) {
    super.setSteps(steps);
    this.dataSource.data = null;
    const groupedSteps = this.filterSteps.sort((a, b) => a.category.localeCompare(b.category));
    const stepNodes = [];
    let currentCategory;
    groupedSteps.forEach((step) => {
      if (!currentCategory || currentCategory.name != step.category) {
        currentCategory = {
          name: step.category,
          children: []
        };
        stepNodes.push(currentCategory);
      }
      currentCategory.children.push({
        name: step.displayName,
        id: step.id,
        type: step.type,
        step
      })
    });
    this.dataSource.data = stepNodes;
  }

  handleStepSelection(step) {
    if (step.id) {
      super.handleStepSelection(this.steps.find(s => s.id === step.id));
    }
  }
}
