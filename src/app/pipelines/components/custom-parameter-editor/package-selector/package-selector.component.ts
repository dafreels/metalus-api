import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PackageObject } from 'src/app/core/package-objects/package-objects.model';
import { PackageObjectsService } from 'src/app/core/package-objects/package-objects.service';
import * as _ from 'lodash';
@Component({
  selector: 'app-package-selector',
  templateUrl: './package-selector.component.html',
  styleUrls: ['./package-selector.component.scss'],
})
export class PackageSelectorComponent implements OnInit {
  packages: PackageObject[];
  formattedPackages: any;
  @Output() packageItemSelection = new EventEmitter();

  constructor(private packageService: PackageObjectsService) {}

  ngOnInit() {
    this.packageService.getPackageObjects().subscribe((resp: any) => {
      this.packages = resp;
      if (this.packages) {
        const byPackage = _.groupBy(this.packages, (item) =>
          item.id.split('.').slice(0, -1).join('.')
        );
        this.formattedPackages = Object.keys(byPackage).map((key) => {
          return { path: key, packages: byPackage[key] };
        });
        console.log("🚀 ~ file: package-selector.component.ts ~ line 27 ~ PackageSelectorComponent ~ this.formattedPackages=Object.keys ~ this.formattedPackages", this.formattedPackages)
      }
    });
  }
  handlePackageSelection(packageItem) {
    this.packageItemSelection.emit(packageItem);
  }
}
