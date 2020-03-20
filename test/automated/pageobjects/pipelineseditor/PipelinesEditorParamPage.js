const { Builder, By, Key, until, webdriver } = require('selenium-webdriver');
const  SeleniumWrapper  = require('../../utils/seleniumwrapper.js');

PipelinesEditorParamPage = function(driver) {
  var txtId = By.css('.designer-content input[name="id"]');
  var dpdType = By.css('.mat-expansion-panel-body .mat-select-value');
  var dpdScriptLanguage = By.xpath('//span[span="Javascript"]');
  var btnObjectEditor = By.css('mat-icon[aria-label="Open Editor"]');
  var txtInputStatic = By.css('.mat-expansion-panel-body .mat-expansion-panel-body input[id^="mat-input-"]');
  var txtInputGlobal = By.id('mat-input-13');
  var dpdInput = By.css('mat-select[placeholder="Select Step Response"]');
  var btnOR = By.css('.add-button button');
  var btnRemoveParam = By.css('mat-icon[aria-label="Remove OR Clause"]');

  //Information 
  var lblTags = By.css("mat-chip");
  
  //Pipeline Select
  var dpdSelectPipeline = By.css('mat-select[placeholder="Select a Pipeline"]');
  var dptSelectPipelineOption = By.xpath("//span[text()=' Step Group Pipeline ']");
  var seleniumWrapper = new SeleniumWrapper(driver);

  this.selectParameter = function(name){
    var xpath = "//mat-panel-title[text()='"+name+"']";
    return driver.findElement(By.xpath(xpath)).click();
  }

  this.clickOnObjectEditor = function(number) {
    return driver.findElements(btnObjectEditor)
           .then(elements => elements[number].click());
  }

  this.clickOnDropdown = function(number) {
    return driver.findElements(dpdType)
           .then(elements => elements[number].click());
  }

  this.getDropdownValue = function(number) {
    return driver.findElements(dpdType);
  }

  this.getDropdownOption = function(element) {
    var option = By.xpath('//mat-option[span="'+element+'"]');
    return seleniumWrapper.findElement(option);
  }

  this.getScriptLanguageOption = function() {
    return seleniumWrapper.findElement(dpdScriptLanguage);
  }
  
  this.selectDropdownOption = function(number,option) {
    return  this.clickOnDropdown(number)
            .then(() => driver.findElement(By.xpath('//mat-option[span="'+option+'"]')).click());
  }

  this.fillInputStatic = function(number) {
    return driver.findElements(txtInputStatic)
           .then(elements => {elements[number].clear();
                             elements[number].sendKeys("Automated Test")});
  }

  this.clearInputStatic = function(number) {
    return driver.findElements(txtInputStatic)
           .then(elements => {elements[number].clear();
                             elements[number].sendKeys(" ",Key.BACK_SPACE,Key.ENTER);
                             driver.sleep(500)});
  }

  this.getInputStatic = function() {
    return driver.findElements(txtInputStatic);
  }

  this.fillInputGlobal = function() {
    return driver.findElement(txtInputGlobal)
           .then(element => {element.clear();
                             element.sendKeys("Automated Test")});
  }

  

  this.clickDpdInput = function() {
    return  driver.findElement(dpdInput).click();
  }

  this.selectStepResponseOption = function(number,option) {
    return  this.clickDpdInput(number)
            .then(() => driver.findElement(By.xpath('//mat-option[span=" '+option+' "]')).click());
  }

  this.getDpdOptionsFromInput = function(name) {
    return  seleniumWrapper.findElement(By.xpath("//span[contains(text(),'"+name+"')]"));
  }

  this.getORbutton = function() {
    return  driver.findElements(btnOR)
  }

  this.clickORbutton = function(number) {
    return driver.findElements(btnOR)
           .then(elements => elements[number].click());
  }

  this.clickRemoveParameter = function(number) {
    return driver.findElement(btnRemoveParam).click();
  }
  
  this.selectPipelineOption = function(){
    return driver.findElement(dpdSelectPipeline).click()
           .then(() => driver.findElement(dptSelectPipelineOption).click())
  }

  this.getDpdStepGroup = function() {
    return  driver.findElement(dpdSelectPipeline)
}

this.getDpdStepResponse = function() {
  return  seleniumWrapper.findElement(dpdInput)
}

this.getTags = function() {
  return  driver.findElements(lblTags)
}

  this.scrollToElement  = async(element) => {
    return   driver.executeScript("arguments[0].scrollIntoView()", await driver.findElement(element));
  }




  };
  module.exports = PipelinesEditorParamPage 