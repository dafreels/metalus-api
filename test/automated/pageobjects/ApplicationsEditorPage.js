const { Builder, By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');

ApplicationsEditorPage = function(driver) {
    var btnGlobal = By.xpath("//span[contains(text(),'Globals')]");
    var btnAddParameter = By.css('mat-icon[aria-label="Add Global"]');
    var dpdObject = By.xpath('//button[contains(text(),"Object")]');  
    var btnObjectEditor = By.css('mat-icon[aria-label="Open Editor"]');
    var mdlGlobals = By.css(".mat-dialog-container");
    
    
    this.goToObjectsEditor = function() {
      return  driver.findElement(btnGlobal).click()
             .then(async() => {await driver.sleep(500); expect(driver.findElement(mdlGlobals)).to.not.be.null})
             .then(() => driver.findElement(btnAddParameter).click())
             .then(() => driver.findElement(dpdObject).click())
             .then(() => driver.findElement(btnObjectEditor).click())
    }

 
  };
  module.exports = ApplicationsEditorPage