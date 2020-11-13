const { Builder, By, Key, until } = require('selenium-webdriver');
const  DriverUtils  = require('../utils/driverutil.js');
const  Validator  = require('../utils/validator.js');
const  StepsEditorPage  = require('../pageobjects/StepsEditorPage.js');
const  ObjectEditorPage  = require('../pageobjects/ObjectEditorPage.js');
const  PipelinesEditorPage  = require('../pageobjects/PipelinesEditorPage.js');
const  PipelinesEditorParamPage = require('../pageobjects/pipelineseditor/PipelinesEditorParamPage.js');
const  ApplicationsEditorPage  = require('../pageobjects/ApplicationsEditorPage.js');
const  PipelinesTestData = require('../utils/pipelinestestdata.js');

describe('Objects Editor - MDBP-29416', () => {
    var driver = new Builder().forBrowser('chrome').build();
    var testData = new PipelinesTestData();
    var validator = new Validator();
    var driverutils = new DriverUtils(driver);
    var stepsEditor = new StepsEditorPage(driver);
    var pipelinesEditor = new PipelinesEditorPage(driver);
    var pipelinesEditorParamPage = new PipelinesEditorParamPage(driver);
    var objectEditor = new ObjectEditorPage(driver);
    var applicationsEditor = new ApplicationsEditorPage(driver);

    it('Should go to Pipelines Editor and close Object Editor from X icon',function() {
        return  driverutils.goToPipelinesEditor()
        .then(() => pipelinesEditor.loadTestData(testData.getDataOption()))
        .then(() => pipelinesEditor.clickOnNode("ObjectNode"))
        .then(() => pipelinesEditor.clickOnParameters())
        .then(() => pipelinesEditorParamPage.selectParameter("ObjectParameter"))
        .then(() => pipelinesEditorParamPage.clickOnObjectEditor(1))
        .then(() => objectEditor.getModal()
                    .then(modal => validator.isDisplayed(modal)))
        .then(() => { objectEditor.closeModal()
                      .then(() =>  objectEditor.closeModal())
                      .then(async() =>  { await driver.sleep(500); validator.isNOTDisplayed(await objectEditor.getModal())})
                    })
        
    });

    it('Should go to Pipelines Editor and verify Object Editor elements',function() {
        return  driverutils.goToPipelinesEditor()
        .then(() => pipelinesEditor.loadTestData(testData.getDataOption()))
        .then(() => pipelinesEditor.clickOnNode("ObjectNode"))
        .then(() => pipelinesEditor.clickOnParameters())
        .then(() => pipelinesEditorParamPage.selectParameter("ObjectParameter"))
        .then(() => pipelinesEditorParamPage.clickOnObjectEditor(1))
        .then(() => objectEditor.getModal()
                    .then(modal => validator.isDisplayed(modal)))
        .then(() => objectEditor.getCloseIcon()
                    .then(icon => validator.isDisplayed(icon)))
    });

   
    it('Should go to Steps Editor and verify Object Editor elements',function() {
        return  driverutils.goToStepsEditor()
        .then(() => stepsEditor.goToObjectsEditor())
        .then(() => objectEditor.getModal()
                    .then(modal => validator.isDisplayed(modal)))
        .then(() => objectEditor.getCloseIcon()
                    .then(icon => validator.isDisplayed(icon)))
    });

    it('Should go to Applications Editor and verify Object Editor elements',function() {
        return  driverutils.goToApplicationsEditor()
        .then(() => applicationsEditor.goToObjectsEditor())
        .then(() => objectEditor.getModal()
                    .then(modal => validator.isDisplayed(modal)))
        .then(() => objectEditor.getCloseIcon()
                    .then(icon => validator.isDisplayed(icon)))
    });
 
    

   it('Should go to Pipelines Editor and verify object editor is not closed by any other action than "X" and "Cancel"',function() {
    return  driverutils.goToPipelinesEditor()
    .then(() => pipelinesEditor.loadTestData(testData.getDataOption()))
    .then(() => pipelinesEditor.clickOnNode("ObjectNode"))
    .then(() => pipelinesEditor.clickOnParameters())
    .then(() => pipelinesEditorParamPage.selectParameter("ObjectParameter"))
    .then(() => pipelinesEditorParamPage.clickOnObjectEditor(1))
    .then(() => validator.isDisplayed(objectEditor.getModal()))
    .then(() => objectEditor.closeESC())
    .then(async () => {
        await driver.sleep(500); 
        validator.isDisplayed(await objectEditor.getModal());
          })
    
    });
 
    it('Should go to Steps Editor and verify object editor is not closed by any other action than "X" and "Cancel"',function() {
        return  driverutils.goToStepsEditor()
        .then(() => stepsEditor.goToObjectsEditor())
        .then(() => validator.isDisplayed(objectEditor.getModal()))
        .then(() => objectEditor.closeESC())
        .then(async () => {
            await driver.sleep(500); 
            validator.isDisplayed(await objectEditor.getModal());
              })
    });
     
    
    it('Should go to Applications Editor and verify object editor is not closed by any other action than "X" and "Cancel"',function() {
        return  driverutils.goToApplicationsEditor()
        .then(() => applicationsEditor.goToObjectsEditor())
        .then(() => validator.isDisplayed(objectEditor.getModal()))
        .then(() => objectEditor.closeESC())
        .then(async () => { driver.sleep(500); objectEditor.closeESC()})
        .then(async () => {
            await driver.sleep(500); 
            validator.isDisplayed(await objectEditor.getModal());
        })
    });
  
    after(function(){
        driverutils.quit();
    });


});