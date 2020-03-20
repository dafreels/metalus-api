const { Builder, By, Key, until } = require('selenium-webdriver');
const  DriverUtils  = require('../utils/driverutil.js');
const  Validator  = require('../utils/validator.js');
const  StepsEditorPage  = require('../pageobjects/StepsEditorPage.js');
const  StepsEditorFormPage  = require('../pageobjects/stepseditor/StepsEditorFormPage.js');
const  StepsEditorParamPage  = require('../pageobjects/stepseditor/StepsEditorParamPage.js');

describe('Harden Code/Bug Bash - MDBP-30248', () => {
    var driver = new Builder().forBrowser('chrome').build();
    var validator = new Validator();
    var driverutils = new DriverUtils(driver);
    var stepsEditor = new StepsEditorPage(driver);
    var stepsEditorForm = new StepsEditorFormPage(driver);
    var stepsEditorParam = new StepsEditorParamPage(driver);
   
    
    it('1. Should validate when user updates step parameter then all filled fields are cleared - Object to Script',function() {
        return  driverutils.goToStepsEditor()
                .then(() => stepsEditorForm.addParameter())
                .then(() => stepsEditorParam.fillParameter())
                .then(() => stepsEditorParam.clickOnParameter())
                .then(() => stepsEditorParam.selectParameterDropdownOption("Object"))
                .then(() => stepsEditorParam.fillClassName("ClassName Test"))
                .then(() => stepsEditorParam.clickOnRequired())
                .then(() => stepsEditorParam.selectParameterDropdownOption("Script"))
                .then(() => stepsEditorParam.getBtnRequired()
                            .then(element => {driver.sleep(500); element.getAttribute("aria-checked")
                            .then(value => validator.areEqual(value,"false"))}))
                .then(() => stepsEditorParam.getTxtClassName()
                            .then(element => {driver.sleep(500); element.getAttribute("value")
                            .then(value => validator.areEqual(value,""))}))
    });
  
      
    it('2. Should validate when user updates step parameter then all filled fields are cleared - Script to Object',function() {
        return  driverutils.goToStepsEditor()
                .then(() => stepsEditorForm.addParameter())
                .then(() => stepsEditorParam.fillParameter())
                .then(() => stepsEditorParam.clickOnParameter())
                .then(() => stepsEditorParam.selectParameterDropdownOption("Script"))
                .then(() => stepsEditorParam.selectScriptLanguage("JSON"))
                .then(() => stepsEditorParam.clickOnRequired())
                .then(() => stepsEditorParam.selectParameterDropdownOption("Object"))
                .then(() => stepsEditorParam.getBtnRequired()
                            .then(element => {driver.sleep(500); element.getAttribute("aria-checked")
                            .then(value => validator.areEqual(value,"false"))}))
                .then(() => stepsEditorParam.getDpdScriptLanguage()
                            .then(element => {driver.sleep(500); element.getText()
                            .then(value => validator.areEqual(value," "))}))
    });


    it('3. Should validate when user updates step parameter then all filled fields are cleared - Integer to Object',function() {
        return  driverutils.goToStepsEditor()
                .then(() => stepsEditorForm.addParameter())
                .then(() => stepsEditorParam.fillParameter())
                .then(() => stepsEditorParam.clickOnParameter())
                .then(() => stepsEditorParam.selectParameterDropdownOption("Integer"))
                .then(() => stepsEditorParam.fillDefaultValue("Automated Default Value"))
                .then(() => stepsEditorParam.fillParameterType("Automated Parameter Type"))
                .then(() => stepsEditorParam.selectParameterDropdownOption("Object"))
                .then(() => stepsEditorParam.getTxtDefaultValue()
                            .then(element => {driver.sleep(500); element.getAttribute("value")
                            .then(value => validator.areEqual(value,""))}))
                .then(() => stepsEditorParam.getTxtParameterType()
                            .then(element => {driver.sleep(500); element.getAttribute("value")
                            .then(value => validator.areEqual(value,""))}))
    });


    after(function(){
        driverutils.quit();
    });


});