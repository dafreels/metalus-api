const { Builder, By, Key, until } = require('selenium-webdriver');

PipelinesHeaderPage = function(driver) {
    var btnLoad = By.xpath('//span[contains(text(),"Load")]');
    var btnSave = By.xpath('//span[contains(text(),"Save")]');  
    var btnNew = By.xpath('//span[contains(text(),"New")]');  
    var btnImport = By.xpath('//span[contains(text(),"Import")]');  
    

    this.clickOnParameters = function() {
      return  driver.findElement(btnParameters).click();
    }

    this.clickOnLoad = function() {
      return  driver.findElement(btnLoad).click();
    }

    this.clickOnSave = function() {
      return  driver.findElement(btnSave).click();
    }

    this.clickOnNew = function() {
      return  driver.findElement(btnNew).click();
    }

    this.clickOnImport = function() {
      return  driver.findElement(btnImport).click();
    }
 
  };
  module.exports = PipelinesHeaderPage