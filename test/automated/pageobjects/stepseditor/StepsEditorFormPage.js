const { Builder, By, Key, until } = require('selenium-webdriver');

StepsEditorFormPage = function(driver) {
    var btnAddParameter = By.css('.step-parameter-add-div button');
    
    this.addParameter = function() {
      return  driver.findElement(btnAddParameter).click();
    }

 
  };
  module.exports = StepsEditorFormPage