import {Component, OnInit} from "@angular/core";
import {ProviderJob} from "../../models/jobs.model";
import {JobsService} from "../../services/jobs.service";
import {ProvidersService} from "../../services/providers.service";
import {Provider} from "../../models/providers.model";
import {NewClusterComponent} from "../clusters/new-cluster/new-cluster.component";
import {generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {RunJobComponent} from "./run-job/run-job.component";

@Component({
  templateUrl: './jobs.component.html'
})
export class JobsComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'appName', 'providerName', 'status', 'type', 'start', 'end', 'duration', 'actions'];
  jobs: ProviderJob[];
  providers: Provider[];

  constructor(private jobsService: JobsService,
              private providersService: ProvidersService,
              private displayDialogService: DisplayDialogService) {}

  ngOnInit(): void {
    this.providersService.getProvidersList().subscribe(result => {
      this.providers = result;
      this.jobsService.getJobsByProviders(this.providers).subscribe(jobs => {
        this.jobs = jobs;
      });
    });
  }

  runJob() {
    const addDialog = this.displayDialogService.openDialog(
      RunJobComponent,
      generalDialogDimensions,
      {
        providers: this.providers
      }
    );
    addDialog.afterClosed().subscribe((result) => {
      if (result) {
        // this.providersService.addCluster(result).subscribe(prov => {
        //   this.providersService.getClustersList().subscribe(engs => this.clusters = engs);
        // });
      }
    });
  }
}
