import {Component, OnInit} from "@angular/core";
import {FlatTreeControl} from '@angular/cdk/tree';
import {StepsService} from "../steps.service";
import {IStep} from "../steps.model";
import {MatTreeFlatDataSource, MatTreeFlattener} from "@angular/material/tree";

interface StepNode {
  name: string;
  id?: string;
  children?: StepNode[];
}

interface TreeStepFlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'steps-tree',
  templateUrl: './steps.tree.component.html'
})
export class StepsTreeComponent implements OnInit {
  private _transformer = (node: StepNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      level: level,
    };
  };
  private getLevel = (node: TreeStepFlatNode) => node.level;
  private isExpandable = (node: TreeStepFlatNode) => node.expandable;

  treeControl: FlatTreeControl<TreeStepFlatNode> = new FlatTreeControl<TreeStepFlatNode>(this.getLevel, this.isExpandable);
  treeFlattener = new MatTreeFlattener(
    this._transformer, node => node.level, node => node.expandable, node => node.children);
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
  steps: IStep[];

  constructor(private stepsService: StepsService) {
    this.dataSource.data = [];
  }

  ngOnInit(): void {
    this.stepsService.getSteps().subscribe((steps: IStep[]) => {
      this.steps = steps;
      const sortedSteps = this.steps.sort((a, b) => {
        const val = a.category.localeCompare(b.category);
        if (val === 0) {
          return a.displayName.localeCompare(b.displayName);
        }
        return val;
      });
      const treeSteps = [];
      let currentCategory: StepNode;
      sortedSteps.map((step) => {
        if (!currentCategory || currentCategory.name !== step.category) {
          currentCategory = {
            name: step.category,
            children: []
          };
          treeSteps.push(currentCategory);
        }
        currentCategory.children.push({
          name: step.displayName,
          id: step.id
        });
      });
      this.dataSource.data = treeSteps;
    });
  }
}
