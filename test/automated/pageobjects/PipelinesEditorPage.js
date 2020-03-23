const { Builder, By, Key, until } = require('selenium-webdriver');
const  PipelinesEditorParamPage = require('./pipelineseditor/PipelinesEditorParamPage.js');
const  PipelinesHeaderPage = require('./pipelineseditor/PipelinesHeaderPage.js');


PipelinesEditorPage = function(driver) {
  
  var btnParameters = By.xpath('//mat-panel-title[contains(text(),"Parameters")]');
  var btnInformation = By.xpath('//mat-panel-title[contains(text(),"Information")]');
  var pipelinesEditorParamPage = new PipelinesEditorParamPage(driver);
  var pipelinesHeaderPage = new PipelinesHeaderPage(driver);


  this.importTestData = function() {
    return pipelinesHeaderPage.clickOnImport()
           .then(()=> driver.sleep(500))
           .then(() => driver.findElement(By.id(id))
            .then(element => element.click()))
  }

    this.loadTestData = function(id) {
      return pipelinesHeaderPage.clickOnLoad()
             .then(()=> driver.sleep(500))
             .then(() => driver.findElement(By.id(id))
              .then(element => element.click()))
    }

    this.goToObjectsEditor = function() {
      return  pipelinesHeaderPage.clickOnParameters()
              .then(() => pipelinesEditorParamPage.selectObjectOptionEditor());
    }

    this.clickOnNode = function(name) {
      return driver.findElement(By.xpath("//div[contains(text(),'"+name+"')]")).click();
    }

    this.clickOnParameters = function(){
      return driver.findElement(btnParameters).click();
    }

    this.clickOnInformation = function(){
      return driver.findElement(btnInformation).click();
    }



 
  };
  module.exports = PipelinesEditorPage