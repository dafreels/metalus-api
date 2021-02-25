import {Component, OnInit} from "@angular/core";
import {Provider, ProviderType} from "../../models/providers.model";
import {ProvidersService} from "../../services/providers.service";
import {DisplayDialogService} from "../../../shared/services/display-dialog.service";
import {generalDialogDimensions} from "../../../shared/models/custom-dialog.model";
import {NewProviderComponent} from "./new-provider/new-provider.component";
import {Subject} from "rxjs";
import {DesignerElement} from "../../../designer/designer-constants";
import {NewClusterComponent} from "../clusters/new-cluster/new-cluster.component";

@Component({
  templateUrl: './providers.component.html',
  styleUrls: ['./providers.component.scss']
})
export class ProvidersComponent implements OnInit {
  displayedColumns: string[] = ['id', 'name', 'provider', 'description', 'actions'];
  providerTypes: ProviderType[];
  providers: Provider[];
  selectedProvider: Provider;
  providerSubject: Subject<Provider> = new Subject<Provider>();

  constructor(private providersService: ProvidersService,
              private displayDialogService: DisplayDialogService) {
  }

  ngOnInit(): void {
    this.providersService.getProviderTypesList().subscribe(result => this.providerTypes = result);
    this.providersService.getProvidersList().subscribe(result => this.providers = result);
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
    // TODO Add Are you sure
    // Remove provider
  }

  handleProviderSelection($event: Provider) {
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
        // TODO Emit event indicating that the clusters component needs to refresh or get the clusters and emit that
        // this.providersService.addProvider(result).subscribe(prov => {
        //   this.providersService.getProvidersList().subscribe(provs => this.providers = provs);
        // });
      }
    });
  }
}
