|Branch|Build|Coverage|
-------|-----|---------|
|Master|[![Master Status](https://travis-ci.com/dafreels/metalus-api.svg?branch=master)](https://travis-ci.com/dafreels/metalus-api?branch=master)|[![Master Coverage](https://img.shields.io/coveralls/github/dafreels/metalus-api/master.svg)](https://coveralls.io/github/dafreels/metalus-api?branch=master)|


# Metalus (Managed ETL)
Provides a web interface for managing projects built using the [Metalus Pipeline Library](https://github.com/Acxiom/metalus).

A set of APIs are provided that manage the metadata for:

| API             | End Point               | Description                                                                                          |
|-----------------|-------------------------|------------------------------------------------------------------------------------------------------|
| Package Objects | /api/v1/package-objects | Manages the JSON schemas that provide the basis for editing complex objects                          |
| Steps           | /api/v1/steps           | Manages the step metadata used to construct the pipelines. The metadata here drives the Pipelines UI |
| Pipelines       | /api/v1/pipelines       | Manages the pipeline metadata                                                                        |
| Applications    | /api/v1/applications    | Manages the application metadata  

The web interface provides several editors:

* Object Editor: Allows building complex objects based on the selected Package Object.
* Code Editor: Allows writing code in JSON, SQL, Javascript and Scala.
* [Pipelines Editor](docs/pipelines-editor.md): Provides a mechanism for building pipelines using the steps metadata. The parameters for each step will change based on the steps metadata.

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
Run the following command to start the server: **npm run file-api**
### Mongo
A set of mongo export files are provided under the *common_steps_preloaded_data/mongo* directory. Import these file using the following commands:

* mongoimport --db=metalus --collection=steps --file=steps.json
* mongoimport --db=metalus --collection=package-objects --file=package-objects.json
* mongoimport --db=metalus --collection=users --file=users.json

The file *config/mongo.json* contains all of the settings required to connect with the Mongo database.

|Property Name   |Default Value|
|----------------|-------------|
|storageType     |mongodb      |
|databaseServer  |localhost    |
|databaseName    |metalus      |
|databaseSSL     |false        |
|databaseUser    |<not set>    |
|databasePassword|<not set>    |

Run the following command to start the server: **npm run mongo-api**

### Users
A single default user is provided in the standard collections. The credentials are admin/admin.

### Development
When developing, two services need to be started:

* **API**:
    * **Mongo**: npm run mongo-api
    * **File**: npm run file-api
* **UI**: npm start

The API will be running here: **http://localhost:8000/**

The UI will be running here: **http://localhost:4200/**

Any UI changes will automatically get deployed.

