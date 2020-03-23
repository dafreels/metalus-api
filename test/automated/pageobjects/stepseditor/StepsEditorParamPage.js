const { Builder, By, Key, until } = require('selenium-webdriver');
const  SeleniumWrapper  = require('../../utils/seleniumwrapper.js');

StepsEditorParamPage = function(driver) {
  var txtName = By.css('input[name="Name"]');
  var btnOk = By.xpath('//button[@type="button" and span="Ok"]');
  var btnParameterList = By.css('.mat-expansion-panel');  
  var dpdType = By.css('.mat-select-value-text');
  var dpdOption =  By.xpath('//span[contains(text(),"Object")]');
  var btnObjectEditor = By.css('.mat-expansion-panel-content button');
  var txtRequired = By.css('input[name="paramRequired"]');
  var btnRequired = By.css('mat-slide-toggle[ng-reflect-name="paramRequired"]');
  var txtDefaultValue = By.css('textarea[name="defaultValue"]');
  var dpdScriptLanguage = By.css('mat-select[name="language"]');
  var txtClassName = By.css('input[name="className"]');
  var txtParameterType = By.css('input[name="parameterType"]');
  var seleniumWrapper = new SeleniumWrapper(driver);

  this.getBtnRequired = function() {
    return seleniumWrapper.findElement(txtRequired);
  }
  this.getTxtDefaultValue = function() {
    return seleniumWrapper.findElement(txtDefaultValue);
  }
  this.getDpdScriptLanguage = function() {
    return seleniumWrapper.findElement(dpdScriptLanguage);
  }
  this.getTxtClassName = function() {
    return seleniumWrapper.findElement(txtClassName);
  }
  this.getTxtParameterType = function() {
    return seleniumWrapper.findElement(txtParameterType);
  }
    
  this.scrollToElement  = async(element) => {
    return   driver.executeScript("arguments[0].scrollIntoView()", await driver.findElement(btnRequired));
  }

  this.scrollToFooter = async() => {
    return   driver.executeScript("arguments[0].scrollIntoView()", await driver.findElement(btnParameterList));
  }

  this.fillParameter = function() {
    return  driver.findElement(txtName).sendKeys("Automated Parameter",Key.RETURN)
            .then(() => driver.findElement(btnOk).click());
  }

  this.clickOnParameter = function() {
    return  driver.findElement(btnParameterList).click();
  }

  this.clickOnParameterDropdown = function() {
    return driver.findElement(dpdType).click();
  }

  this.selectParameterDropdownOption = function(option) {
    return  this.clickOnParameterDropdown()
            .then(() => this.scrollToFooter())
            .then(async() => this.scrollToElement(await driver.findElement(By.xpath('//mat-option[span="'+option+'"]')))
            .then(() => driver.findElement(By.xpath('//mat-option[span="'+option+'"]')).click()));
  }

  this.clickOnRequired = function() {
    return  driver.findElement(btnRequired).click();
  }

  this.fillDefaultValue = function(keys) {
    return  driver.findElement(txtDefaultValue).sendKeys(keys);
  }

  this.clickOnScriptLanguageDropdown = function() {
    return driver.findElement(dpdScriptLanguage).click();
  }

  this.selectScriptLanguage = function(option) {
    return  this.clickOnScriptLanguageDropdown()
            .then(() => driver.findElement(By.xpath('//mat-option[span="'+option+'"]')).click());
  }

  this.fillClassName = function(keys) {
    return  driver.findElement(txtClassName)
            .then(element => element.sendKeys(keys));
  }

  this.fillParameterType = function(keys) {
    return  driver.findElement(txtParameterType)
            .then(element => element.sendKeys(keys));
  }

  this.goToObjectsEditor = function() {
    return  driver.findElement(txtName).sendKeys("Automated Parameter",Key.RETURN)
           .then(() => driver.findElement(btnOk).click())
           .then(() => driver.findElement(btnParameterList).click())
           .then(() => driver.findElement(dpdType).click())
           .then(() => this.scrollToElement(dpdOption))
           .then(() => driver.findElement(dpdOption).click())
           .then(() => driver.findElement(btnObjectEditor).click());
  }

 
  };
  module.exports = StepsEditorParamPage