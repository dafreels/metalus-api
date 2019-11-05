# Metl (Managed ETL)
Provides a web interface for managing projects built using the [Spark Pipeline Driver](https://github.com/Acxiom/spark-pipeline-driver) project.

A set of APIs are provided that manage the metadata for:

| API             | End Point               | Description                                                                                          |
|-----------------|-------------------------|------------------------------------------------------------------------------------------------------|
| Package Objects | /api/v1/package-objects | Manages the JSON schemas that provide the basis for editing complex objects                          |
| Steps           | /api/v1/steps           | Manages the step metadata used to construct the pipelines. The metadata here drives the Pipelines UI |
| Pipelines       | /api/v1/pipelines       | Manages the pipeline metadata                                                                        |
| Applications    | /api/v1/applications    | Manages the application metadata  

The web interface provides several editors:

* Object Editor: Allows building complex objects based on the selected Package Object. This editor is accessed from the Applications, Steps and Pipeline Editors.
* Code Editor: Allows writing code in JSON, SQL, Javascript and Scala. This editor is accessed from the Steps and Pipeline Editors.
* [Steps Editor](docs/steps-editor.md): Manages the steps metadata used by the Pipelines Editor
* [Pipelines Editor](docs/pipelines-editor.md): Provides a mechanism for building pipelines using the steps metadata. The parameters for each step will change based on the steps metadata.
* Applications Editor: Provides a mechanism for building an application. This editor consumes the pipelines created using the Pipelines Editor.

# Running
This project requires:
* NodeJS 10
* Angular 8
* Mongo 4 (only if using Mongo as the storage platform)
## Setup
* Checkout the project
* Install the required packages (npm install)
* Build the Angular application (ng build)
## Starting
Before starting the application, it must be determined what storage medium will be used. Two methods are provided, file and mongo. File storage is only recommended
for demos and getting started. Mongo is the preferred choice for long term usage.

### File
A set of preloaded files are provided under the *common_steps_preloaded_data/file* directory. Copy these files under the *data* directory to make them accessible.
Run the following command to start the server: **npm run file**

### Mongo
A set of mongo export files are provided under the *common_steps_preloaded_data/mongo* directory. Import these file using the following commands:

* mongoimport --db=metl --collection=steps --file=steps.json
* mongoimport --db=metl --collection=package-objects --file=package-objects.json

The file *config/mongo.json* contains all of the settings required to connect with the Mongo database.

|Property Name   |Default Value|
|----------------|-------------|
|storageType     |mongodb      |
|databaseServer  |localhost    |
|databaseName    |metl         |
|databaseSSL     |false        |
|databaseUser    |<not set>    |
|databasePassword|<not set>    |

Run the following command to start the server: **npm run mongo**

