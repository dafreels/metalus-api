# Contributing
Contributions are always welcome. Fork the project on GitHub and checkout the _develop_ branch. Make 
the desired changes and commit to your personal repo. Open a Pull Request back to the main repo. Someone 
will review the changes and if accepted will merge. After changes have been tested, they will be released
by merging to the master branch. Once the merge occurs, a new Docker image will be created. Changes to master
will be tagged as _latest_ and changes to _develop_ will be tagged _dev_.
## Setup
**Project requirements:**
* NodeJS 10
* Angular 8
* Mongo 4 (only if using Mongo as the storage platform)

**Steps:**
* Checkout the project
* Install the required packages (npm install)
* Build the Angular application (ng build)
## Starting
Before starting the application, it must be determined what storage medium will be used. Two methods are provided, file and mongo. File storage is only recommended
for demos and getting started. Mongo is the preferred choice for long term usage.
### File
A set of preloaded files exist under the *common_steps_preloaded_data/file* directory. Copy these files under the *data* directory to make them accessible.
Run the following command to start the server: **npm run file-api**
### Mongo
A set of mongo export files exist under the *common_steps_preloaded_data/mongo* directory. Import these file using the following commands:

* mongoimport --db=metalus --collection=steps --file=steps.json
* mongoimport --db=metalus --collection=package-objects --file=package-objects.json
* mongoimport --db=metalus --collection=users --file=users.json

#### Configuration parameters
The file *config/mongo.json* contains the settings required to connect with the Mongo database.

|Property Name   |Default Value|
|----------------|-------------|
|storageType     |mongodb      |
|databaseServer  |localhost    |
|databaseName    |metalus      |
|databaseSSL     |false        |
|databaseUser    |not set      |
|databasePassword|not set      |

Run the following command to start the server: **npm run mongo-api**

### Users
A single default user exists in the standard collections. The credentials are admin/admin.

### Development
When developing, two services need to be started:

* **API**:
    * **Mongo**: npm run mongo-api
    * **File**: npm run file-api
* **UI**: npm start

The API will be running here: **http://localhost:8000/**

The UI will be running here: **http://localhost:4200/**

Any UI changes will automatically get deployed.
