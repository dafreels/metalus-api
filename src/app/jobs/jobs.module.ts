import {NgModule} from "@angular/core";
import {JobsComponent} from "./components/jobs/jobs.component";
import {CoreModule} from "../core/core.module";
import {SharedModule} from "../shared/shared.module";
import {JobConfigurationsComponent} from "./components/jobs-configuration/jobs-configuration.component";
import {ProvidersComponent} from "./components/providers/providers.component";
import {NewProviderComponent} from "./components/providers/new-provider/new-provider.component";
import {FormlyModule} from "@ngx-formly/core";
import {NullTypeComponent} from "../shared/components/formly-types/null.type";
import {ArrayTypeComponent} from "../shared/components/formly-types/array.type";
import {ObjectTypeComponent} from "../shared/components/formly-types/object.type";
import {MultiSchemaTypeComponent} from "../shared/components/formly-types/multischema.type";
import {RepeatTypeComponent} from "../shared/components/formly-types/repeat-section.type";
import {FormlyMaterialModule} from "@ngx-formly/material";
import {ClustersComponent} from "./components/clusters/clusters.component";
import {NewClusterComponent} from "./components/clusters/new-cluster/new-cluster.component";
import {ProvidersListItemComponent} from "./components/providers/providers-list-item/providers-list-item.component";

@NgModule({
  imports: [
    CoreModule,
    SharedModule,
    FormlyModule.forRoot({
      validationMessages: [
        { name: 'required', message: 'This field is required' },
      ],
      types: [
        { name: 'string', extends: 'input' },
        {
          name: 'number',
          extends: 'input',
          defaultOptions: {
            templateOptions: {
              type: 'number',
            },
          },
        },
        {
          name: 'integer',
          extends: 'input',
          defaultOptions: {
            templateOptions: {
              type: 'number',
            },
          },
        },
        { name: 'boolean', extends: 'checkbox' },
        { name: 'enum', extends: 'select' },
        { name: 'null', component: NullTypeComponent, wrappers: ['form-field'] },
        { name: 'array', component: ArrayTypeComponent },
        { name: 'object', component: ObjectTypeComponent },
        { name: 'multischema', component: MultiSchemaTypeComponent },
        { name: 'repeat', component: RepeatTypeComponent },
      ],
    }),
    FormlyMaterialModule,
  ],
  declarations: [
    ClustersComponent,
    JobConfigurationsComponent,
    JobsComponent,
    NewClusterComponent,
    NewProviderComponent,
    ProvidersListItemComponent,
    ProvidersComponent
  ],
  entryComponents: [
    NewClusterComponent,
    NewProviderComponent
  ]
})

export class JobsModule {}
