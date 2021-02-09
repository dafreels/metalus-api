import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PackageObject } from 'src/app/core/package-objects/package-objects.model';
import { PackageObjectsService } from 'src/app/core/package-objects/package-objects.service';

@Component({
  selector: 'app-package-selector',
  templateUrl: './package-selector.component.html',
  styleUrls: ['./package-selector.component.scss'],
})

export class PackageSelectorComponent implements OnInit {
  
  packages: PackageObject[];
  @Output() packageItemSelection = new EventEmitter();
  
  constructor(private packageService: PackageObjectsService) {}

  ngOnInit() {
    this.packageService.getPackageObjects().subscribe((resp: any) => {
      this.packages = resp;
    });
  }
  handlePackageSelection(packageItem) {
    console.log("🚀 ~ file: package-selector.component.ts ~ line 25 ~ PackageSelectorComponent ~ handlePackageSelection ~ packageItem", packageItem)
    this.packageItemSelection.emit(packageItem);
  }
}
