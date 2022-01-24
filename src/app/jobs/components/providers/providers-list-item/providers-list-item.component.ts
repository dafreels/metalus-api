import {Component, EventEmitter, Input, Output} from "@angular/core";
import {Provider} from "../../../models/providers.model";

@Component({
  selector: 'providers-list-item',
  templateUrl: './providers-list-item.component.html',
  styleUrls: ['./providers-list-item.component.scss']
})
export class ProvidersListItemComponent {
  @Input() providers: Provider[];
  @Input() selectedProvider: Provider;
  @Output() providerSelection = new EventEmitter();
  @Output() removeProviderEmit = new EventEmitter();
  @Output() editProviderEmit = new EventEmitter();
  @Output() newClusterEmit = new EventEmitter();

  constructor() {}

  getProviderIcon(provider) {
    return 'cloud';
  }

  handleProviderSelection(provider: Provider) {
    this.providerSelection.emit(provider);
  }

  removeProvider(id: string) {
    this.removeProviderEmit.emit(id);
  }

  addCluster(id: string) {
    this.newClusterEmit.emit(id);
  }

  editProvider(id: string) {
    this.editProviderEmit.emit(id);
  }
}
