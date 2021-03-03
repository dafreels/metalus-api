import {Component, Input, OnDestroy, OnInit} from "@angular/core";
import {Cluster, Provider, ProviderType} from "../../models/providers.model";
import {ProvidersService} from "../../services/providers.service";
import {Subject, Subscription} from "rxjs";
import {SharedFunctions} from "../../../shared/utils/shared-functions";
import {ConfirmationModalComponent} from "../../../shared/components/confirmation/confirmation-modal.component";
import {MatDialog} from "@angular/material/dialog";
import {ErrorModalComponent} from "../../../shared/components/error-modal/error-modal.component";

@Component({
  selector: 'provider-clusters',
  templateUrl: './clusters.component.html'
})
export class ClustersComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'name', 'providerName', 'version', 'state', 'source', 'startTime', 'terminationTime', 'actions'];
  clusters: Cluster[];
  provider: Provider;
  @Input() providerTypes: ProviderType[];
  @Input() providerSubject: Subject<Provider>;
  @Input() clusterSubject: Subject<Cluster>;
  subscriptions: Subscription[] = [];

  constructor(public dialog: MatDialog,
              private providersService: ProvidersService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.providerSubject.subscribe(element => {
        this.provider = element;
        this.providersService.getClustersList(this.provider.id).subscribe(result => this.clusters = result);
      }));
    this.subscriptions.push(
      this.clusterSubject.subscribe(cluster => {
        this.providersService.getClustersList(this.provider.id).subscribe(result => this.clusters = result);
      }));
  }

  removeEngine(cluster) {
    const dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '450px',
      height: '200px',
      data: {
        message: 'Are you sure you wish to permanently terminate this cluster? This operation is asynchronous.',
      },
    });
    this.subscriptions.push(dialogRef.afterClosed().subscribe((confirmation) => {
        if (confirmation) {
          this.providersService.deleteCluster(this.provider.id, cluster).subscribe(el => {
            this.providersService.getClustersList(this.provider.id).subscribe(result => this.clusters = result);
          });
        }
      },
      (error) => this.handleError(error, dialogRef)
    ));
  }

  ngOnDestroy(): void {
    this.subscriptions = SharedFunctions.clearSubscriptions(this.subscriptions);
  }

  private handleError(error, dialogRef) {
    let message;
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      message = error.error.message;
    } else {
      message = error.message;
    }
    dialogRef.close();
    this.dialog.open(ErrorModalComponent, {
      width: '450px',
      height: '300px',
      data: { messages: message.split('\n') },
    });
  }

  refresh() {
    this.providersService.getClustersList(this.provider.id).subscribe(result => this.clusters = result);
  }
}
