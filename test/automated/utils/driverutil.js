const { Builder, By, Key, until } = require('selenium-webdriver');

    DriverUtils = function(driver) {
    var url = 'http://a38b16fd941d911ea9b7d0e6534d0d86-1354992529.us-east-1.elb.amazonaws.com:8000';
    
    this.goToHome = function(url) {
      return  driver.get(url);
    }

    this.goToStepsEditor = function() {
      return  driver.get(url+"/steps-editor")
              .then(() => this.maximize())
              .then(() => this.setImplicitWait(3000))
    }

    this.goToPipelinesEditor = function() {
      return  driver.get(url+"/pipelines-editor")
              .then(() => this.maximize())
              .then(() => this.setImplicitWait(3000))
    }

    this.goToApplicationsEditor = function() {
      return  driver.get(url+"/applications-editor")
              .then(() => this.maximize())
              .then(() => this.setImplicitWait(3000))
    }


    this.maximize = function() {
      return  driver.manage().window().maximize();
    }

    this.setImplicitWait = function(time) {
      return  driver.manage().setTimeouts( { implicit: time } );
    }

    this.quit = function() {
      return  driver.quit();
    }

  };
  module.exports = DriverUtils