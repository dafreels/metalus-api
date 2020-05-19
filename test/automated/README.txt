#### PROJECT STRUCTURE ####

** To check all dependencies please refer to package.json

Scope: 95% of automated test scripts belong to Pipelines Editor, 5% to Steps Editor

-pageobjects: contains a pseudo pageobjects that are used within test scripts
-testcases: contains all the Test Cases (in xlsx file) 
-testdata: contains two JSON that need to be imported everytime we deploy on a new stage (do it manually and do it once)
-tests: contains the actual test scripts related to the test cases
-utils: contains some js file that are used in test scripts

Before executing a Test:
*Make sure you have successfuly imported all test data 
*To manually import data go to Metalus URL/pipelines-editor hit on Import and copy JSON

Te execute a single JS file:
* Go to package.json and change the file name in "test" parameter with the one you want to execute
* Type npm test

To execute the Test Suite:
* Go to Gruntfile.js and make sure all files are included in mochaTest
* Type grunt MochaTest
