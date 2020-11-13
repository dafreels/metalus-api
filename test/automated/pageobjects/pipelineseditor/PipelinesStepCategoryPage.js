const { Builder, By, Key, until } = require('selenium-webdriver');

PipelinesStepCategoryPage = function(driver) {
    var btnCategory = By.css('button[aria-label="toggle FlowControl"]');
    var btnStep = By.xpath('//li[contains(text(),"Step Group")]');
    var btnStepAux = By.css('mat-tree-node[aria-expanded="true"]');
    var btnDesigner = By.xpath('//div[contains(text(),"StepGroupNode")]');

    this.scrollToElement  = async() => {
      return   driver.executeScript("arguments[0].scrollIntoView()", await driver.findElement(btnCategory));
    }

    this.clickOnCategory = function() {
      return  driver.findElement(btnCategory).click();
    }

    this.dragNewStep = async function() {
    
      return  await driver.findElement(btnStep).click()
                    .then(() => driver.findElement(btnStepAux)
                                .then( async(element) => driver.actions()
                                                .dragAndDrop(element, await driver.findElement(btnDesigner))
                                                .perform()))
    }

 
  };
  module.exports = PipelinesStepCategoryPage