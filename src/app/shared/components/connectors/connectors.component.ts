import {AfterViewInit, Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {FormlyFieldConfig} from "@ngx-formly/core";
import {FormGroup} from "@angular/forms";
import {SharedFunctions} from "../../utils/shared-functions";

@Component({
  selector: 'connector-form',
  templateUrl: './connectors.component.html',
  styleUrls: ['./connectors.component.scss']
})
export class ConnectorsComponent implements AfterViewInit {
  // Custom form support
  _model;
  @Input() set model(value) {
    this._model = value;
  }
  get model() {
    return this._model;
  }
  _fields: FormlyFieldConfig[];
  formValue: object;

  connectorType: string = 'Batch';
  connectorTypes = [
    'Batch',
    'Streaming',
    'File'
  ];
  fileConnectors = [
    {
      name: 'S3',
      className:'com.acxiom.aws.pipeline.connectors.S3FileConnector',
      library: 'aws'
    },
    {
      name: 'GCS',
      className:'com.acxiom.gcp.pipeline.connectors.GCSFileConnector',
      library: 'gcp'
    },
    {
      name: 'HDFS',
      className:'com.acxiom.pipeline.connectors.HDFSFileConnector',
    },
    {
      name: 'SFTP',
      className:'com.acxiom.pipeline.connectors.SFTPFileConnector',
    }
  ];

  batchConnectors = [
    {
      name: 'S3',
      className:'com.acxiom.aws.pipeline.connectors.S3DataConnector',
      library: 'aws',
    },
    {
      name: 'GCS',
      className:'com.acxiom.gcp.pipeline.connectors.GCSDataConnector',
      library: 'gcp',
    },
    {
      name: 'HDFS',
      className:'com.acxiom.pipeline.connectors.HDFSDataConnector',
    },
    {
      name: 'JDBC',
      className:'com.acxiom.pipeline.connectors.JDBCDataConnector',
    },
    {
      name: 'Big Query',
      className:'com.acxiom.gcp.pipeline.connectors.BigQueryDataConnector',
      library: 'gcp',
    },
    {
      name: 'Mongo',
      className:'com.acxiom.metalus.pipeline.connectors.MongoDataConnector',
      library: 'mongo',
    }
  ];

  streamingConnectors = [
    {
      name: 'Kinesis',
      className:'com.acxiom.aws.pipeline.connectors.KinesisDataConnector',
      library: 'aws',
    },
    {
      name: 'Kafka',
      className:'com.acxiom.kafka.pipeline.connectors.KafkaDataConnector',
      library: 'kafka',
    }
  ];

  form = new FormGroup({});

  @Input() showEmbeddedVariablesToggle: boolean = false;
  @Output() formValidation = new EventEmitter<boolean>();

  constructor() {}

  ngAfterViewInit(): void {
    this.form.valueChanges.subscribe((value) => {
      this.formValue = value;
      this.formValidation.next(this.form.valid);
    });
  }

  selectForm($event: string) {
    this._fields = SharedFunctions.clone(SharedFunctions.getConnectorForm($event));
  }
}
