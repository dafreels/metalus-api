import {Component, OnInit} from "@angular/core";
import {ProviderJob} from "../../models/jobs.model";
import {JobsService} from "../../services/jobs.service";
import {ProvidersService} from "../../services/providers.service";
import {Provider} from "../../models/providers.model";

@Component({
  templateUrl: './jobs.component.html'
})
export class JobsComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'appName', 'providerName', 'status', 'type', 'start', 'end', 'duration', 'actions'];
  jobs: ProviderJob[];
  providers: Provider[];

  constructor(private jobsService: JobsService,
              private providersService: ProvidersService) {}

  ngOnInit(): void {
    this.providersService.getProvidersList().subscribe(result => {
      this.providers = result;
      this.jobsService.getJobsByProviders(this.providers).subscribe(jobs => {
        this.jobs = jobs;
      });
    });
  }
}
