[Home](readme.md)

# Execution Templates
The execution templates panel provides predefined executions that may be dragged to the designer. The _Blank_
template will always be populated and has nothing set by default. New templates may be added by using the 
executions API (/api/v1/executions).

![Execution Panel](images/execution_templates_panel.png)

## Step Libraries
Each [step library](https://acxiom.github.io/metalus/docs/step-libraries.html) may provide execution templates that can
be extracted using the [Metadata Extractor](https://acxiom.github.io/metalus/docs/metadata-extractor.html). An execution
template extends the Application [execution](https://acxiom.github.io/metalus/docs/executions.html) metadata and adds several
elements which make it suitable for use in the UI.

* description: This will be displayed in the UI and should be short
* tooltip: This should be a longer description that provides additional information
* form: This should be a custom form written using [formly](https://formly.dev/ui/material) which will present the user with the proper questions
* produces: This section is used to provide information about the output of the pipelines. Global Links will be created when multiple executions are chained together.
* consumes: This section describes the types of inputs this execution may take. Used with the produces section of upstream executions, Global Links can be produced.

### Pipelines
It is recommended that execution templates use the _pipelineIds_ attribute to define the pipelines to be executed. These
pipelines should be included in the step library.

### Simple Root Example
This example represents an execution that would provide the initial execution and produces a DataFrame that may be
used for further processing.
```json
{
  "description": "Example",
  "tooltip": "This is an example tooltip description which tells the user more about what this template does",
  "produces": [
    {
      "path": "f4835500-4c4a-11ea-9c79-f31d60741e3.AddFileId.primaryReturn",
      "type": "DataFrame"
    }
  ],
  "form": "[\n  {\n    \"key\": \"format\",\n    \"type\": \"input\",\n    \"templateOptions\": {\n      \"label\": \"Format\",\n      \"placeholder\": \"parquet\"\n    }\n  },\n  {\n    \"key\": \"options\",\n    \"type\": \"repeat\",\n    \"templateOptions\": {\n      \"addText\": \"Add another option\",\n      \"removeText\": \"-\",\n      \"description\": \"Options\"\n    },\n    \"fieldArray\": {\n      \"fieldGroup\": [\n        {\n          \"type\": \"input\",\n          \"key\": \"name\",\n          \"templateOptions\": {\n            \"label\": \"Name\"\n          }\n        },\n        {\n          \"type\": \"input\",\n          \"key\": \"value\",\n          \"templateOptions\": {\n            \"label\": \"Value\"\n          }\n        }\n      ]\n    }\n  },\n  {\n    \"key\": \"attributes\",\n    \"type\": \"repeat\",\n    \"templateOptions\": {\n      \"addText\": \"Add another attribute\",\n      \"removeText\": \"-\",\n      \"description\": \"Schema\"\n    },\n    \"fieldArray\": {\n      \"fieldGroup\": [\n        {\n          \"type\": \"input\",\n          \"key\": \"name\",\n          \"templateOptions\": {\n            \"label\": \"Name\"\n          }\n        },\n        {\n          \"type\": \"select\",\n          \"key\": \"dataType\",\n          \"templateOptions\": {\n            \"label\": \"Data Type\",\n            \"options\": [\n              {\n                \"id\": \"string\",\n                \"name\": \"String\"\n              },\n              {\n                \"id\": \"double\",\n                \"name\": \"Double\"\n              },\n              {\n                \"id\": \"integer\",\n                \"name\": \"Integer\"\n              },\n              {\n                \"id\": \"timestamp\",\n                \"name\": \"Timestamp\"\n              },\n              {\n                \"id\": \"decimal\",\n                \"name\": \"Decimal\"\n              },\n              {\n                \"id\": \"array\",\n                \"name\": \"Array\"\n              },\n              {\n                \"id\": \"map\",\n                \"name\": \"Map\"\n              },\n              {\n                \"id\": \"struct\",\n                \"name\": \"Struct\"\n              }\n            ],\n            \"valueProp\": \"id\",\n            \"labelProp\": \"name\"\n          }\n        }\n      ]\n    }\n  }\n]\n",
  "id": "root",
  "initialPipelineId": "",
  "mergeGlobals": true,
  "parents": [],
  "pipelineParameters": [],
  "pipelineIds": [
    "f4835500-4c4a-11ea-9c79-f31d60741e3"
  ]
}
```


