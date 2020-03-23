const { Builder, By, Key, until } = require('selenium-webdriver');
const  DriverUtils  = require('../utils/driverutil.js');
const  Validator  = require('../utils/validator.js');
const  PipelinesTestData = require('../utils/pipelinestestdata.js');
const  PipelinesEditorPage  = require('../pageobjects/PipelinesEditorPage.js');
const  PipelinesEditorParamPage = require('../pageobjects/pipelineseditor/PipelinesEditorParamPage.js');

describe('Disable "Result" Step Parameter - MDBP-29420', () => {
    var driver = new Builder().forBrowser('chrome').build();
    var driverutils = new DriverUtils(driver);
    var pipelinesEditor = new PipelinesEditorPage(driver);
    var testData = new PipelinesTestData();
    var validator = new Validator();
    var pipelinesEditorParamPage = new PipelinesEditorParamPage(driver);

    before(function(){
        return driverutils.goToPipelinesEditor()
               .then(() => pipelinesEditor.loadTestData(testData.getDataOption()));
    });

    beforeEach(function(){
        return driverutils.goToPipelinesEditor()
               .then(() => pipelinesEditor.loadTestData(testData.getDataOption()));
    });

    it('1. Should Validate "Result" option is NOT displayed when is NOT a BranchStep',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("IntegerStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Integer Parameter"))
                .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                .then(() => pipelinesEditorParamPage.getDropdownOption("Result")
                            .then(option => validator.isNOTDisplayed(option)))
    });

    it('2. Should Validate "Result" option is displayed when is a BranchStep',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("BranchStep")
                 .then(() => pipelinesEditor.clickOnParameters())
                 .then(() => pipelinesEditorParamPage.selectParameter("Branch Parameter 1"))
                 .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                 .then(() => pipelinesEditorParamPage.getDropdownOption("Result")
                             .then(option => validator.isDisplayed(option)))
    });

    it('3. Should Validate input is not displayed when Result step parameter is selected',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("BranchStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Branch Parameter 1"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Result"))
                .then(() => pipelinesEditorParamPage.getInputStatic()
                            .then(elements => { driver.sleep(500); 
                                            validator.hasBelowLengthThan(elements,2)}))
     });

     it('4. Validate dropdown is not displayed when Result step parameter is selected',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("BranchStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Branch Parameter 1"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Step Response"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber+1,"Result"))
                .then(() => pipelinesEditorParamPage.getDpdStepResponse()
                            .then(element => validator.isNOTDisplayed(element)))
     });


        it('5. Should Validate Result is displayed when loading an existing pipeline',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("BranchStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Branch Parameter 1"))
                .then(() =>pipelinesEditorParamPage.getDropdownValue()
                .then(elements => { driver.sleep(500); elements[parameterNumber].getText()
                .then(value => validator.areEqual(value,"Result"))}))
                
        });
  
    after(function(){
      return driverutils.quit();
    });


});