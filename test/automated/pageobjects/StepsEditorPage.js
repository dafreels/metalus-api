const { Builder, By, Key, until } = require('selenium-webdriver');
const  StepsEditorFormPage = require('./stepseditor/StepsEditorFormPage.js');
const  StepsEditorParamPage = require('./stepseditor/StepsEditorParamPage.js');

StepsEditorPage = function(driver) {
    
    var stepsEditorForm = new StepsEditorFormPage(driver);
    var stepsEditorParamPage = new StepsEditorParamPage(driver);

    this.goToObjectsEditor = function() {
      return  stepsEditorForm.addParameter()
             .then(() => stepsEditorParamPage.goToObjectsEditor())
    }




 
  };
  module.exports = StepsEditorPage