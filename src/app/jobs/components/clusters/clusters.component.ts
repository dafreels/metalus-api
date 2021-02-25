import {Component, Input, OnInit} from "@angular/core";
import {Cluster, Provider, ProviderType} from "../../models/providers.model";
import {generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {ProvidersService} from "../../services/providers.service";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {NewClusterComponent} from "./new-cluster/new-cluster.component";
import {Subject, Subscription} from "rxjs";

@Component({
  selector: 'provider-clusters',
  templateUrl: './clusters.component.html'
})
export class ClustersComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'providerName', 'version', 'state', 'source', 'startTime', 'terminationTime', 'actions'];
  clusters: Cluster[];
  provider: Provider;
  @Input() providerTypes: ProviderType[];
  @Input() providerSubject: Subject<Provider>;
  subscriptions: Subscription[] = [];

  constructor(private providersService: ProvidersService,
              private displayDialogService: DisplayDialogService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.providerSubject.subscribe(element => {
        this.provider = element;
        this.providersService.getClustersList(this.provider.id).subscribe(result => this.clusters = result);
      }));
  }

  addCluster() {
    const addDialog = this.displayDialogService.openDialog(
      NewClusterComponent,
      generalDialogDimensions,
      {
        providerTypes: this.providerTypes,
        provider: this.provider
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

  removeEngine(id) {

  }
}
