const { Builder, By, Key, until } = require('selenium-webdriver');
const  SeleniumWrapper  = require('../../utils/seleniumwrapper.js');

ErrorModalPage = function(driver) {

    var seleniumWrapper = new SeleniumWrapper(driver);
    var mdlError = By.css('.cdk-overlay-pane');
    var txtTitle = By.css('.mat-card-header-text');  
    var txtError = By.css('textarea[name="Error Message"]');  
    var btnOk = By.xpath('//button[span="OK"]');  

    this.getModal = function() {
      return seleniumWrapper.findElement(mdlError);
    }

    this.getTitle = function() {
      return driver.findElement(txtTitle);
    }

    this.getText = function() {
      return seleniumWrapper.findElement(txtError);
    }

    this.closeModal = function() {
      return driver.findElement(btnOk).click();
    }


 
  };
  module.exports = ErrorModalPage