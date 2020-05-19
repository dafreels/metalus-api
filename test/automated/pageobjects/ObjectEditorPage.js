const { Builder, By, Key, until } = require('selenium-webdriver');
const  SeleniumWrapper  = require('../utils/seleniumwrapper.js');

ObjectEditorPage = function(driver) {
    
    var seleniumWrapper = new SeleniumWrapper(driver);
    var mdlObjectEditor = By.css('.mat-dialog-container');
    var icoClose = By.css('.close-dialog');
    var btnClose = By.xpath('//button[span="Close"]');

    this.getCloseIcon = function() {
      return seleniumWrapper.findElement(icoClose);
    }

    this.getBtnClose = function() {
      return seleniumWrapper.findElement(btnClose);
    }

    this.getModal = function() {
      return seleniumWrapper.findElement(mdlObjectEditor);
    }

    this.closeModal = function () {
      return driver.findElement(icoClose).click();   
    }

    this.closeFromButton = function () {
      return driver.findElement(btnClose).click();       
    }

    this.closeESC = function () {
      return driver.findElement(mdlObjectEditor).sendKeys("",Key.ESCAPE);      
    }

 
  };
  module.exports = ObjectEditorPage