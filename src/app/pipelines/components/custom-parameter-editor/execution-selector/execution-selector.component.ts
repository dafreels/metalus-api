import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ExecutionTemplate } from 'src/app/applications/applications.model';
import { ExecutionsService } from 'src/app/applications/executions.service';

@Component({
  selector: 'app-execution-selector',
  templateUrl: './execution-selector.component.html',
  styleUrls: ['./execution-selector.component.scss']
})
export class ExecutionSelectorComponent implements OnInit {

  executions: ExecutionTemplate[];
  @Output() executionItemSelection = new EventEmitter();

  constructor(private executionsService: ExecutionsService,) {}

  ngOnInit() {
    this.executionsService.getExecutions().subscribe((resp) => {
      this.executions = resp;
    });
  }
  handleExecutionSelection(executionItem) {
    this.executionItemSelection.emit(executionItem);
  }

}
