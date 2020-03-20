const { Builder, By, Key, until } = require('selenium-webdriver');
const { expect } = require('chai');
const  DriverUtils  = require('../utils/driverutil.js');
const  Validator  = require('../utils/validator.js');
const  PipelinesTestData = require('../utils/pipelinestestdata.js');
const  PipelinesEditorPage  = require('../pageobjects/PipelinesEditorPage.js');
const  PipelinesEditorParamPage = require('../pageobjects/pipelineseditor/PipelinesEditorParamPage.js');
const  PipelinesHeaderPage = require('../pageobjects/pipelineseditor/PipelinesHeaderPage.js');
const  PipelinesStepCategoryPage = require('../pageobjects/pipelineseditor/PipelinesStepCategoryPage.js');
const  ErrorModalPage  = require('../pageobjects/modal/ErrorModalPage.js');

describe('Implement Angular Validations - MDBP-29418', () => {
    var driver = new Builder().forBrowser('chrome').build();
    var driverutils = new DriverUtils(driver);
    var pipelinesEditor = new PipelinesEditorPage(driver);
    var testData = new PipelinesTestData();
    var validator = new Validator();
    var pipelinesEditorParamPage = new PipelinesEditorParamPage(driver);
    var pipelinesHeaderPage = new PipelinesHeaderPage(driver);
    var errorModalPage = new ErrorModalPage(driver);
    var pipelinesStepCategoryPage = new PipelinesStepCategoryPage(driver);

    beforeEach(function(){
        return driverutils.goToPipelinesEditor()
               .then(() => pipelinesEditor.loadTestData(testData.getDataOption()));
    });

    it('1. Should validate "Step Response" and "Secondary Step Response" are NOT displayed in parent node',function() {
                var parameterNumber = 0;
        return  pipelinesEditor.clickOnNode("ParentNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("executeIfEmpty"))
                .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                .then(() => pipelinesEditorParamPage.getDropdownOption("Step Response")
                    .then(option => validator.isNOTDisplayed(option))) 
                .then(() => pipelinesEditorParamPage.getDropdownOption("Secondary Step Response")
                    .then(option => validator.isNOTDisplayed(option))) 
     });

     it('2. Should validate "Step Response" and "Secondary Step Response" are displayed in child nodes',function() {
                var parameterNumber = 0;
        return  pipelinesEditor.clickOnNode("BranchStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("executeIfEmpty"))
                .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                .then(() => pipelinesEditorParamPage.getDropdownOption("Step Response")
                        .then(option => validator.isDisplayed(option))) 
                .then(() => pipelinesEditorParamPage.getDropdownOption("Secondary Step Response")
                        .then(option => validator.isDisplayed(option)))  
      });

 
      it('5. Should validate "Step response" only refers to steps that occur before them ',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("BranchStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Branch Parameter 1"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Step Response"))
                .then(() => pipelinesEditorParamPage.clickDpdInput())
                .then(() => pipelinesEditorParamPage.getDpdOptionsFromInput("IntegerStep")
                            .then(option => validator.isDisplayed(option)))
                .then(() => pipelinesEditorParamPage.getDpdOptionsFromInput("StepGroupNode")
                            .then(option => validator.isDisplayed(option)))
                .then(() => pipelinesEditorParamPage.getDpdOptionsFromInput("ScriptNode")
                            .then(option => validator.isDisplayed(option)))
                .then(() => pipelinesEditorParamPage.getDpdOptionsFromInput("ObjectNode")
                            .then(option => validator.isDisplayed(option)))
                .then(() => pipelinesEditorParamPage.getDpdOptionsFromInput("ParentNode")
                            .then(option => validator.isDisplayed(option)))
       });

       it('6. Should validate "Secondary Step response" only refers to steps that occur before them ',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("IntegerStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Integer Parameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Secondary Step Response"))
                .then(() => pipelinesEditorParamPage.clickDpdInput())
                .then(() => pipelinesEditorParamPage.getDpdOptionsFromInput("IntegerStep")
                        .then(option => validator.isNOTDisplayed(option)))
                .then(() => pipelinesEditorParamPage.getDpdOptionsFromInput("BranchStep")
                        .then(option => validator.isNOTDisplayed(option)))
                .then(() => pipelinesEditorParamPage.getDpdOptionsFromInput("StepGroupNode")
                        .then(option => validator.isDisplayed(option)))
                .then(() => pipelinesEditorParamPage.getDpdOptionsFromInput("ScriptNode")
                        .then(option => validator.isDisplayed(option)))
                .then(() => pipelinesEditorParamPage.getDpdOptionsFromInput("ObjectNode")
                        .then(option => validator.isDisplayed(option)))
                .then(() => pipelinesEditorParamPage.getDpdOptionsFromInput("ParentNode")
                        .then(option => validator.isDisplayed(option)))
        });

    it('7. Should Validate "Object" option is NOT displayed when Step Parameter is not Object',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("IntegerStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Integer Parameter"))
                .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                .then(() => pipelinesEditorParamPage.getDropdownOption("Object")
                            .then(option => validator.isNOTDisplayed(option)))
    });

    it('8. Should validate "Object" option is displayed when Step Parameter is Object',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("ObjectNode")
                 .then(() => pipelinesEditor.clickOnParameters())
                 .then(() => pipelinesEditorParamPage.selectParameter("ObjectParameter"))
                 .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                 .then(() => pipelinesEditorParamPage.getDropdownOption("Object")
                             .then(option => validator.isDisplayed(option)))
    });

    it('3. Should Validate "Script" option is NOT displayed when Step Parameter is not Script',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("IntegerStep")
              .then(() => pipelinesEditor.clickOnParameters())
              .then(() => pipelinesEditorParamPage.selectParameter("Integer Parameter"))
              .then(() => pipelinesEditorParamPage.getScriptLanguageOption()
                          .then(option => validator.isNOTDisplayed(option)))
              .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
              .then(() => pipelinesEditorParamPage.getDropdownOption("Script")
                          .then(option => validator.isNOTDisplayed(option)))
    });

    it('4.Should Validate "Script" option is displayed when Step Parameter is Script',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("ScriptNode")
               .then(() => pipelinesEditor.clickOnParameters())
               .then(() => pipelinesEditorParamPage.selectParameter("Script Parameter"))
               .then(() => pipelinesEditorParamPage.getScriptLanguageOption()
                           .then(option => validator.isDisplayed(option)))
               .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
               .then(() => pipelinesEditorParamPage.getDropdownOption("Script")
                           .then(option => validator.isDisplayed(option)))
    });
  
 
    it('9. Should Validate when "Step Group" node is selected only pipeline parameter should display "Pipeline" as dropdown option',function() {
                var parameterNumber = 0;
        return  pipelinesEditor.clickOnNode("StepGroupNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("executeIfEmpty"))
                .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                .then(() => pipelinesEditorParamPage.getDropdownOption("Pipeline")
                            .then(option => validator.isNOTDisplayed(option)))
    });

    it('9. Should Validate when "Step Group" node is selected only pipeline parameter should display "Pipeline" as dropdown option',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("StepGroupNode")
              .then(() => pipelinesEditor.clickOnParameters())
              .then(() => pipelinesEditorParamPage.selectParameter("pipelineId"))
              .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
              .then(() => pipelinesEditorParamPage.getDropdownOption("Pipeline")
                          .then(option => validator.isNOTDisplayed(option)))
      });

    it('9. Should Validate when "Step Group" node is selected only pipeline parameter should display "Pipeline" as dropdown option',function() {
                var parameterNumber = 2;
        return  pipelinesEditor.clickOnNode("StepGroupNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("pipeline"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static"))
                .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                .then(() => pipelinesEditorParamPage.getDropdownOption("Pipeline")
                            .then(option => validator.isDisplayed(option)))
      });

    it('9. Should Validate when "Step Group" node is selected only pipeline parameter should display "Pipeline" as dropdown option',function() {
                var parameterNumber = 3;
        return  pipelinesEditor.clickOnNode("StepGroupNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("pipelineMappings"))
                .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                .then(() => pipelinesEditorParamPage.getDropdownOption("Pipeline")
                            .then(option => validator.isNOTDisplayed(option)))
      });


      it('11. Should Validate when any node different than "Step Group" is selected, "Pipeline" should NOT be displayed as dropdown option',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("IntegerStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Integer Parameter"))
                .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                .then(() => pipelinesEditorParamPage.getDropdownOption("Pipeline")
                            .then(option => validator.isNOTDisplayed(option)))
      });
  
      it('10. Should Validate when "Step Group" node is selected and "Pipeline"option is selected from dropdown then "Pipeline" name should be displayed',function() {
                var parameterNumber = 2;
        return  pipelinesEditor.clickOnNode("StepGroupNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("pipeline"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Pipeline"))
                .then(() => pipelinesEditorParamPage.selectPipelineOption())
                .then(() => pipelinesEditorParamPage.getDpdStepGroup()
                            .then(element => { driver.sleep(500); element.getText()
                            .then(value => validator.areEqual(value,"Step Group Pipeline"))}))    
      });

     it('19. Should Validate OR cannot be used when the parameter is "Object"',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("ObjectNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("ObjectParameter"))
                .then(() => pipelinesEditorParamPage.getORbutton()
                            .then(elements => { driver.sleep(500); elements[parameterNumber].isEnabled()
                            .then(value => validator.areEqual(value,false))}))  
       });

        it('18. Should Validate OR cannot be used when the parameter is "Script"',function() {
                        var parameterNumber = 1;
                return  pipelinesEditor.clickOnNode("ScriptNode")
                        .then(() => pipelinesEditor.clickOnParameters())
                        .then(() => pipelinesEditorParamPage.selectParameter("Script Parameter"))
                        .then(() => pipelinesEditorParamPage.getORbutton()
                                    .then(elements => { driver.sleep(500); elements[parameterNumber].isEnabled()
                                    .then(value => validator.areEqual(value,false))}))  
        });

      it('20. Should Validate OR cannot be used when the parameter is "Result"',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("BranchStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Branch Parameter "+parameterNumber))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Result"))
                .then(() => pipelinesEditorParamPage.getORbutton()
                            .then(elements => { driver.sleep(500); elements[parameterNumber].isEnabled()
                            .then(value => validator.areEqual(value,false))}))  
       });

       it('23. Should Validate OR can be used when the parameter is other than "Result", "Object" or "Script"',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("IntegerStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Integer Parameter"))
                .then(() => pipelinesEditorParamPage.getORbutton()
                            .then(elements => { driver.sleep(500); elements[parameterNumber].isEnabled()
                            .then(value => validator.areEqual(value,true))}))  
       });
 
     it('21. Should Validate "Object" cannot be selected when OR option is triggered',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("ObjectNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("ObjectParameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static"))
                .then(() => pipelinesEditorParamPage.clickORbutton(parameterNumber))
                .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                .then(() => pipelinesEditorParamPage.getDropdownOption("Object")
                            .then(option => validator.isNOTDisplayed(option)))
       });
 

        it('22. Should Validate "Object" can be selected when OR option is cancelled',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("ObjectNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("ObjectParameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static"))
                .then(() => pipelinesEditorParamPage.clickORbutton(parameterNumber))
                .then(() => pipelinesEditorParamPage.clickRemoveParameter())
                .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                .then(() => pipelinesEditorParamPage.getDropdownOption("Object")
                    .then(option => validator.isDisplayed(option)))
        });
 
        it('24. Should Validate "Script" option is displayed in Script step parameter node after navigating thru different nodes',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("ScriptNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Script Parameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static"))
                .then(() => pipelinesEditor.clickOnNode("IntegerStep"))
                .then(() => pipelinesEditor.clickOnNode("ScriptNode"))
                .then(() => pipelinesEditorParamPage.selectParameter("Script Parameter"))
                .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber))
                .then(() => pipelinesEditorParamPage.getDropdownOption("Script")
                            .then(option => validator.isDisplayed(option)))     
        });
     
        it('16. Should validate "Branch Step" has at least one result',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("BranchStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Branch Parameter 1"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Runtime"))
                .then(() => pipelinesEditorParamPage.selectParameter("Branch Parameter 2"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber+1,"Runtime"))
                .then(() => pipelinesHeaderPage.clickOnSave())
                .then(() => errorModalPage.getModal()
                            .then(modal => validator.isDisplayed(modal)))
                .then(() => errorModalPage.getText()
                            .then(element => element.getText()
                            .then(value => validator.areEqual(value,"Step BranchStep is a branch step and needs at least one result."))))  
        });
        

        it('25. Should Validate "Object" option is displayed in Script step parameter node after navigating thru different nodes',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("ObjectNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("ObjectParameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static"))
                .then(() => pipelinesEditor.clickOnNode("IntegerStep"))
                .then(() => pipelinesEditor.clickOnNode("ObjectNode"))
                .then(() => pipelinesEditorParamPage.selectParameter("ObjectParameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Object"))
                .then(() => pipelinesEditorParamPage.clickOnDropdown(parameterNumber)
                            .then(() => pipelinesEditorParamPage.getDropdownOption("Object")
                            .then(option => validator.isDisplayed(option))))    
        });

        it('27. Should validate types are being set based on the value - Static to Pipeline',function() {
                var parameterNumber = 2;
        return  pipelinesEditor.clickOnNode("StepGroupNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("pipeline"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Pipeline"))
                .then(() => pipelinesEditorParamPage.selectPipelineOption()
                           .then(() => pipelinesHeaderPage.clickOnSave()))
                .then(() => driverutils.goToPipelinesEditor())
                .then(() => pipelinesEditor.loadTestData(testData.getDataOption()))
                .then(() =>  pipelinesEditor.clickOnNode("StepGroupNode"))
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("pipeline"))
                .then(() =>pipelinesEditorParamPage.getDropdownValue()
                           .then(elements => { driver.sleep(500); elements[parameterNumber+1].getText()
                           .then(value => validator.areEqual(value,"Pipeline"))}))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber +1,"Static")) 
                .then(() => pipelinesEditorParamPage.fillInputStatic(parameterNumber)
                           .then(() => pipelinesHeaderPage.clickOnSave()))
                
        });
   
        it('15. Should validate Pipeline type is selected when "Pipeline" is selected as dropdown option',function() {
                var parameterNumber = 2;
        return  pipelinesEditor.clickOnNode("StepGroupNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("pipeline"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static")
                            .then(() => pipelinesEditorParamPage.clearInputStatic(parameterNumber)))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Pipeline"))
                .then(() => pipelinesHeaderPage.clickOnSave())
                .then(() => errorModalPage.getText()
                            .then(modal => validator.isDisplayed(modal)))
                .then(() => errorModalPage.getText()
                            .then(element => element.getText()
                            .then(value => validator.areEqual(value,"You need to select a step group for StepGroupNode pipeline parameter."))))  
                
        });
   

        it('28. Should validate types are being set based on the value - Static to Global ',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("IntegerStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Integer Parameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Global"))
                .then(() => pipelinesEditorParamPage.fillInputGlobal()
                           .then(() => pipelinesHeaderPage.clickOnSave()))
                .then(() => driverutils.goToPipelinesEditor())
                .then(() => pipelinesEditor.loadTestData(testData.getDataOption()))
                .then(() =>  pipelinesEditor.clickOnNode("IntegerStep"))
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Integer Parameter"))
                .then(() =>pipelinesEditorParamPage.getDropdownValue()
                           .then(elements => { driver.sleep(500); elements[parameterNumber].getText()
                           .then(value => validator.areEqual(value,"Global"))}))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static")
                           .then(() => pipelinesHeaderPage.clickOnSave()))
                
        });
 

        it('29. Should validate types are being set based on the value - Object to StepResponse ', function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("ObjectPath2")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("ObjectTest"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Step Response"))
                .then(() => pipelinesEditorParamPage.selectStepResponseOption(parameterNumber,"ScriptNode")
                            .then(() => pipelinesHeaderPage.clickOnSave()))
                .then(() => driverutils.goToPipelinesEditor())
                .then(() => pipelinesEditor.loadTestData(testData.getDataOption()))
                .then(() =>  pipelinesEditor.clickOnNode("ObjectPath2"))
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("ObjectTest"))
                .then(() =>pipelinesEditorParamPage.getDropdownValue()
                           .then(elements => { driver.sleep(500); elements[parameterNumber+1].getText()
                           .then(value => validator.areEqual(value,"Step Response"))}))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber+1,"Object") 
                           .then(() => pipelinesHeaderPage.clickOnSave()))
                
        });

        it('30. Should validate types are being set based on the value - Script to Runtime ', function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("ScriptNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Script Parameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Runtime")
                        .then(() => pipelinesHeaderPage.clickOnSave()))
                .then(() => driverutils.goToPipelinesEditor())
                .then(() => pipelinesEditor.loadTestData(testData.getDataOption()))
                .then(() =>  pipelinesEditor.clickOnNode("ScriptNode"))
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Script Parameter"))
                .then(() =>pipelinesEditorParamPage.getDropdownValue()
                        .then(elements => { driver.sleep(500); elements[parameterNumber].getText()
                        .then(value => validator.areEqual(value,"Runtime"))}))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Script") 
                        .then(() => pipelinesHeaderPage.clickOnSave()))
                
        });

        it('17. Should validate tags are displayed whitin information option',function() {
        return  pipelinesEditor.clickOnNode("IntegerStep")
                .then(() => pipelinesEditor.clickOnInformation())
                .then(() =>pipelinesEditorParamPage.getTags()
                        .then(elements => { driver.sleep(500);
                                            validator.areEqual(elements.length,4);
                                            elements[0].getText().then(value =>  validator.areEqual(value,"Testing"));
                                            elements[1].getText().then(value =>  validator.areEqual(value,"Integer"));
                                            elements[2].getText().then(value =>  validator.areEqual(value,"Acxiom"));
                                            elements[3].getText().then(value =>  validator.areEqual(value,"Data"));
                                          }))    
        });

        it('13. Should Validate required parameter - object empty',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("ObjectNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("ObjectParameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static")
                            .then(() => pipelinesEditorParamPage.clearInputStatic(parameterNumber)))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Object")  
                            .then(() => pipelinesHeaderPage.clickOnSave()))
                .then(() => errorModalPage.getModal()
                            .then(modal => validator.isDisplayed(modal)))
                .then(() => errorModalPage.getText()
                            .then(element => element.getText()
                            .then(value => validator.areEqual(value,"Step ObjectNode has a required parameter ObjectParameter that is missing a value."))))  
        });

        it('14. Should Validate required parameter - script with default value',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("ScriptNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Script Parameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static")
                            .then(() => pipelinesEditorParamPage.clearInputStatic(parameterNumber)))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Script")  
                            .then(() => pipelinesHeaderPage.clickOnSave()))
                .then(() => errorModalPage.getText()
                            .then(modal => validator.isNOTDisplayed(modal)))
        });


        it('31. Should Validate required parameter - Not required parameter',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("ParentNode")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("ParentParameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static")
                        .then(() => pipelinesEditorParamPage.clearInputStatic(parameterNumber))
                        .then(() => pipelinesHeaderPage.clickOnSave()))
                .then(() => errorModalPage.getText()
                        .then(modal => validator.isNOTDisplayed(modal)))
        });

      

        it('32. Should Validate required parameter - Integer empty',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("IntegerStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Integer Parameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static")
                        .then(() => pipelinesEditorParamPage.clearInputStatic(parameterNumber))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Global"))
                        .then(() => pipelinesHeaderPage.clickOnSave()))
                .then(() => errorModalPage.getText()
                        .then(modal => validator.isDisplayed(modal)))
                .then(() => errorModalPage.getText()
                        .then(element => element.getText()
                        .then(value => validator.areEqual(value,"Step IntegerStep has a required parameter Integer Parameter that is missing a value."))))  
        });


        it('33. Should Validate required parameter - Integer filled',function() {
                var parameterNumber = 1;
        return  pipelinesEditor.clickOnNode("IntegerStep")
                .then(() => pipelinesEditor.clickOnParameters())
                .then(() => pipelinesEditorParamPage.selectParameter("Integer Parameter"))
                .then(() => pipelinesEditorParamPage.selectDropdownOption(parameterNumber,"Static")
                        .then(() => pipelinesEditorParamPage.fillInputStatic(parameterNumber))
                        .then(() => pipelinesHeaderPage.clickOnSave()))
                .then(() => errorModalPage.getText()
                        .then(modal => validator.isNOTDisplayed(modal))) 
        });
 
    after(function(){
      return driverutils.quit();
    });


});