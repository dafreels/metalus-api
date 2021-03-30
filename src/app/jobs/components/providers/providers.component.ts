import {Component, OnDestroy, OnInit} from "@angular/core";
import {Cluster, Provider, ProviderType} from "../../models/providers.model";
import {ProvidersService} from "../../services/providers.service";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {NewProviderComponent} from "./new-provider/new-provider.component";
import {Subject, Subscription} from "rxjs";
import {NewClusterComponent} from "../clusters/new-cluster/new-cluster.component";
import {WaitModalComponent} from "../../../shared/components/wait-modal/wait-modal.component";
import {ConfirmationModalComponent} from "../../../shared/components/confirmation/confirmation-modal.component";
import {MatDialog} from "@angular/material/dialog";
import {SharedFunctions} from "../../../shared/utils/shared-functions";

@Component({
  templateUrl: './providers.component.html',
  styleUrls: ['./providers.component.scss']
})
export class ProvidersComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'name', 'provider', 'description', 'actions'];
  providerTypes: ProviderType[];
  providers: Provider[];
  selectedProvider: Provider;
  providerSubject: Subject<Provider> = new Subject<Provider>();
  clusterSubject: Subject<Cluster> = new Subject<Cluster>();
  subscriptions: Subscription[] = [];

  constructor(public dialog: MatDialog,
              private providersService: ProvidersService,
              private displayDialogService: DisplayDialogService) {
  }

  ngOnInit(): void {
    this.providersService.getProviderTypesList().subscribe(result => this.providerTypes = result);
    this.providersService.getProvidersList().subscribe(result => this.providers = result);
  }

  ngOnDestroy(): void {
    this.subscriptions = SharedFunctions.clearSubscriptions(this.subscriptions);
  }

  addProvider() {
    const addDialog = this.displayDialogService.openDialog(
      NewProviderComponent,
      generalDialogDimensions,
      this.providerTypes
    );
    addDialog.afterClosed().subscribe((result) => {
      if (result) {
        this.providersService.addProvider(result).subscribe(prov => {
          this.providersService.getProvidersList().subscribe(provs => this.providers = provs);
        });
      }
    });
  }

  removeProvider(id) {
    let dialogRef = this.dialog.open(ConfirmationModalComponent, {
      width: '450px',
      height: '200px',
      data: {
        message: 'Are you sure you wish to delete this provider? All tracked jobs will be removed as well.',
      },
    });
    this.subscriptions.push(dialogRef.afterClosed().subscribe((confirmation) => {
      if (confirmation) {
        const waitDialog = this.displayDialogService.openDialog(
          WaitModalComponent, {
            width: '25%',
            height: '25%',
          });
        this.providersService.removeProvider(id).subscribe(() => {
          this.providersService.getProvidersList().subscribe(provs => {
            if (this.selectedProvider.id === id && provs && provs.length > 0) {
              this.handleProviderSelection(provs[0]);
            }
            waitDialog.close();
            this.providers = provs;
          });
        });
      }
    }));
  }

  handleProviderSelection($event: Provider) {
    this.selectedProvider = $event;
    this.providerSubject.next($event);
  }

  newCluster(providerId: string) {
    const addDialog = this.displayDialogService.openDialog(
      NewClusterComponent,
      generalDialogDimensions,
      {
        providerTypes: this.providerTypes,
        provider: this.providers.find(p => p.id === providerId)
      });
    addDialog.afterClosed().subscribe((result) => {
      if (result) {
        const dialogRef = this.displayDialogService.openDialog(
          WaitModalComponent, {
            width: '25%',
            height: '25%',
          });
        this.providersService.addCluster(providerId, result).subscribe(prov => {
          dialogRef.close();
          this.clusterSubject.next(prov);
        });
      }
    });
  }
}
