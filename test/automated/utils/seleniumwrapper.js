const { Builder, By, Key, until } = require('selenium-webdriver');

    SeleniumWrapper = function(driver) {
    
    this.findElement = function(by) {
      try{
          return  driver.findElement(by)
               .then(function() {
                return driver.findElement(by);
            }, function(err) {
                return null;
               
            });
            
      }catch(error){
        return null;
      }
  
    }




    this.click = function(by){
        return element = driver.findElement(by)
               .then(() => element.click);
    }



  };
  module.exports = SeleniumWrapper