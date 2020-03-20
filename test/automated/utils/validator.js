const { expect } = require('chai');
Validator = function() {
  
    this.areEqual = function(actual,expected) {
      expect(actual).to.equal(expected);
    }

    this.hasBelowLengthThan = function(actual,expected) {
      expect(actual).to.have.length.below(expected);
    }
    
    this.isDisplayed = function(element) {
      expect(element).to.not.be.null
    }

    this.isNOTDisplayed = function(element) {
      expect(element).to.be.null
    }

  };
  module.exports = Validator