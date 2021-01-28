[Home](readme.md)
# Parameter-Editor 
The Parameter-Editor is a specialized component which gives admins ability to configure formly JSON structure to render custom UI for a step parameter. Prior to this feature, a user would need to choose the step parameter from different options based on its value purpose.

Steps to follow in parameter editor

1) Go to menu panel in home page and click on Parameter Editor UI button. 

![Parameter-Editor](images/Home_Menu_ParameterScreen_Button.PNG)

2) Select any step from left side category list. 

![Parameter-Editor](images/Select_ParameterStep.PNG)

3) On the right side step parameters will be loaded and expand the parameter which will bring down JSON editor.

![Parameter-Editor](images/AfterClick_Parameter_Expansion_Panel.PNG)

Note: On adding new JSON we have to follow exact JSON formly format(https://formly.dev/examples/advanced/json-schema).

4) In JSON editor screen we have Add Sample Json Scheme UI button on top right side, once we click on this button it will add sample formly json to the editor screen. 

![Parameter-Editor](images/Add_Sample_Json_Schema_Button.PNG)

5) After added JSON editor screen will show the JSON and we can edit if want.(There is vaidation as well if we add wrong syntax json,it shows X red mark)

![Parameter-Editor](images/Json_Validation.PNG)

6) After JSON edit done click preview button.

![Parameter-Editor](images/pipeline_ui_with_parameter_json_added.pngg) 

7) Once we click on Preview button new UI will reflect based on given formly json in right side parameter expansion panel.

![Parameter-Editor](images/Parameter_UI_Render.png) 

8) We have Show Advnced form/Show Templte form toggle button which will bring old template if we want.
  
  ![Parameter-Editor](images/Show_Adanvced_Show_Template.PNG) 

9) Each parameter has its own new UI.

# Pipeline-Editor

Once new formly JSON is configured for the step parameter the same UI will be rendered in the pipeline editor when user select a step and expand the parameter and the value changes will reflect in the peipeline parameter value.

![Parameter-Editor](images/pipeline_ui_with_parameter_json_added.png)

In Pepeline editor screen also on each parameter we have same feature with show Advanced/Templte form toggle button to bring back old teplate UI.
