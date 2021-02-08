[Home](readme.md)
# Parameter Editor 
The Parameter Editor is a specialized component which gives admins the ability to configure formly JSON structure to render a custom UI for a step parameter. This allows step library creators the ability to build custom parameter forms without the user needing to understand how Metalus mapping works. When working in the code editor, the JSON provided will be applied to the _fields_ property of the form. No other properties are exposed. Documentation for formly is provided [here](https://formly.dev/guide/expression-properties). [Examples](https://formly.dev/ui/material) for material may be used to help understand the syntax.


Steps to follow in parameter editor

1) Go to menu panel in home page and click on Parameter Editor UI button. 

![Parameter-Editor](images/home_menu_parameterscreen_button.png)

2) Select any step from left side category list. 

![Parameter-Editor](images/select_parameterstep.png)

3) On the right side step parameters will be loaded and expand the parameter which will bring down JSON editor.

![Parameter-Editor](images/afterClick_parameter_expansion_panel.png)


4) In JSON editor screen we have Add Sample Json Scheme UI button on top right side, once we click on this button it will add sample formly json to the editor screen. 

![Parameter-Editor](images/add_sample_json_schema_button.png)

5) After added JSON editor screen will show the JSON and we can edit if want.(There is vaidation as well if we add wrong syntax json,it shows X red mark)

![Parameter-Editor](images/Json_validation.png)

6) After JSON edit done click preview button.

![Parameter-Editor](images/pipeline_ui_with_parameter_json_added.png) 

7) Once we click on Preview button new UI will reflect based on given formly json in right side parameter expansion panel.

![Parameter-Editor](images/parameter_ui_render.png) 

8) We have Show Advnced form/Show Templte form toggle button which will bring old template if we want.
  
  ![Parameter-Editor](images/show_adanvced_show_template.png) 

9) Each parameter has its own new UI.

[Pipeline-Editor](pipeline-editor.md)

Once new formly JSON is configured for the step parameter the same UI will be rendered in the pipeline editor when user select a step and expand the parameter and the value changes will reflect in the peipeline parameter value.

![Parameter-Editor](images/pipeline_ui_with_parameter_json_added.png)

In Pepeline editor screen also on each parameter we have same feature with show Advanced/Templte form toggle button to bring back old teplate UI.
