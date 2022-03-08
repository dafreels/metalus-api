export interface Connector {
  mapEmbeddedVariables?: boolean;
  className: string;
  object: ConnectorBody;
}

export interface ConnectorBody {
  name: string;
  credentialName: string;
}

export interface FileConnectorBody extends ConnectorBody {}
export interface DataConnectorBody extends ConnectorBody {}
export interface BatchDataConnectorBody extends DataConnectorBody {}
export interface StreamingDataConnectorBody extends DataConnectorBody {}

// Begin File Connectors
export interface GCSConnectorBody extends FileConnectorBody {
  projectId: string;
  bucket: string;
}

export interface S3ConnectorBody extends FileConnectorBody {
  region: string;
  bucket: string;
}

export interface SFTPConnectorBody extends FileConnectorBody {
  hostName: string;
  port?: number;
  knownHosts?: string;
  bulkRequests?: number;
  config?: object;
  timeout?: number;
}

// Begin Batch Data Connectors
export interface BigQueryConnectorBody extends BatchDataConnectorBody {
  tempWriteBucket: string;
}

export interface JDBCConnectorBody extends BatchDataConnectorBody {
  url: string;
  predicates: string[];
}

export interface MongoConnectorBody extends BatchDataConnectorBody {
  uri: string;
}

// Begin Stream Data Connectors
export interface KinesisConnectorBody extends StreamingDataConnectorBody {
  streamName: string;
  region: string;
  partitionKey?: string;
  partitionKeyIndex?: number;
  separator?: string;
}

export interface KafkaConnectorBody extends StreamingDataConnectorBody {
  topics: string;
  kafkaNodes: string;
  key?: string;
  keyField?: string;
  clientId?: string;
  separator?: string;
}

export const NAME_ELEMENT = {
  key: 'object.name',
  type: 'input',
  templateOptions: {
    label: 'Name',
    placeholder: '',
    focus: false,
    required: true
  }
};
export const CREDENTIAL_ELEMENT = {
  key: 'object.credentialName',
  type: 'input',
  templateOptions: {
    label: 'Credential Name',
    placeholder: '',
    focus: false
  }
};

export const REGION_ELEMENT = {
  key: 'object.region',
  type: 'input',
  templateOptions: {
    label: 'Region',
    placeholder: '',
    focus: false
  }
};

export const SEPARATOR_ELEMENT = {
  key: 'object.separator',
  type: 'input',
  defaultValue: ',',
  templateOptions: {
    label: 'Separator',
    placeholder: '',
    focus: false
  }
};

// added type any[] so the compiler would stop complaining about concat when additional properties are used
export const BASE_CONNECTOR_FORM: any[] = [
  NAME_ELEMENT,
  CREDENTIAL_ELEMENT
];

export const BIG_QUERY_FORM = BASE_CONNECTOR_FORM.concat([
  {
    key: 'object.tempWriteBucket',
    type: 'input',
    templateOptions: {
      label: 'Temporary Write Bucket',
      placeholder: '',
      focus: false,
      required: true
    }
  }
]);

export const JDBC_FORM = BASE_CONNECTOR_FORM.concat([
  {
    key: 'object.url',
    type: 'input',
    templateOptions: {
      label: 'URL',
      placeholder: '',
      focus: false,
      required: true
    }
  },
  {
    key: 'object.predicates',
    type: 'stringArray',
    templateOptions: {
      label: 'Predicates',
      placeholder: '',
      focus: false
    }
  }
]);

export const MONGO_FORM = BASE_CONNECTOR_FORM.concat([
  {
    key: 'object.uri',
    type: 'input',
    templateOptions: {
      label: 'URI',
      placeholder: '',
      focus: false,
      required: true
    }
  }
]);

export const S3_FILE_FORM = BASE_CONNECTOR_FORM.concat([
  REGION_ELEMENT,
  {
    key: 'object.bucket',
    type: 'input',
    templateOptions: {
      label: 'Bucket',
      placeholder: '',
      focus: false,
      required: true
    }
  }
]);

export const GCS_FILE_FORM = BASE_CONNECTOR_FORM.concat([
  {
    key: 'object.projectId',
    type: 'input',
    templateOptions: {
      label: 'Project ID',
      placeholder: '',
      focus: false,
      required: true
    }
  },
  {
    key: 'object.bucket',
    type: 'input',
    templateOptions: {
      label: 'Bucket',
      placeholder: '',
      focus: false,
      required: true
    }
  }
]);

export const SFTP_FILE_FORM = BASE_CONNECTOR_FORM.concat([
  {
    key: 'object.hostName',
    type: 'input',
    templateOptions: {
      label: 'Host Name',
      placeholder: '',
      focus: false,
      required: true
    }
  }, // TODO Wrap these options in a panel and hide unless the user checks a box?
  {
    key: 'object.knownHosts',
    type: 'input',
    templateOptions: {
      label: 'Known Hosts',
      placeholder: '',
      focus: false
    }
  },
  {
    key: 'object.port',
    type: 'input',
    defaultValue: 22,
    templateOptions: {
      label: 'Port',
      type: 'number',
      placeholder: '',
      focus: false
    }
  },
  {
    key: 'object.bulkRequests',
    type: 'input',
    templateOptions: {
      label: 'Bulk Requests',
      type: 'number',
      placeholder: '',
      focus: false
    }
  },
  // { TODO Figure out how to allow a complex obejct build here
  //   key: 'object.config',
  //   type: 'object',
  //   templateOptions: {
  //     label: 'Config',
  //     placeholder: '',
  //     focus: false
  //   }
  // },
  {
    key: 'object.timeout',
    type: 'input',
    templateOptions: {
      label: 'Timeout',
      type: 'number',
      placeholder: '',
      focus: false
    }
  }
]);

export const KINESIS_FORM = BASE_CONNECTOR_FORM.concat([
  {
    key: 'object.streamName',
    type: 'input',
    templateOptions: {
      label: 'Stream Name',
      placeholder: '',
      focus: false,
      required: true
    }
  },
  REGION_ELEMENT,
  {
    key: 'object.partitionKey',
    type: 'input',
    templateOptions: {
      label: 'Partition Key',
      placeholder: '',
      focus: false
    }
  },
  {
    key: 'object.partitionKeyIndex',
    type: 'input',
    templateOptions: {
      label: 'Partition Key Index',
      type: 'number',
      placeholder: '',
      focus: false
    },
  },
  SEPARATOR_ELEMENT
]);

export const KAFKA_FORM = BASE_CONNECTOR_FORM.concat([
  {
    key: 'object.topics',
    type: 'input',
    templateOptions: {
      label: 'Topics',
      placeholder: '',
      focus: false,
      required: true
    }
  },
  {
    key: 'object.kafkaNodes',
    type: 'input',
    templateOptions: {
      label: 'Kafka Nodes',
      placeholder: '',
      focus: false,
      required: true
    }
  },
  {
    key: 'object.key',
    type: 'input',
    templateOptions: {
      label: 'Key',
      placeholder: '',
      focus: false
    }
  },
  {
    key: 'object.keyField',
    type: 'input',
    templateOptions: {
      label: 'Key Field',
      placeholder: '',
      focus: false
    }
  },
  {
    key: 'object.clientId',
    type: 'input',
    defaultValue: 'metalus_default_kafka_producer_client',
    templateOptions: {
      label: 'Client Id',
      placeholder: '',
      focus: false
    }
  },
  SEPARATOR_ELEMENT
]);
