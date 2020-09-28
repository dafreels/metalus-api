# Pipeline Editor
The _Pipeline Editor_ screen provides tools for building and maintaining Metalus pipelines. The screen consists of several
sections that each serve a specific purpose.

* [Context Actions](#context-actions)
* [Step Selector](#step-selector)
* [Control Panel](#control-panel)
* [Designer](#designer)
* [Step Parameters](#step-parameters)

![Pipeline Editor](images/pipeline_editor_screen.png)

## Context Actions
Context buttons a displayed for taking actions against pipelines.
### New
This will create a new pipeline.
### Load
This will show the list of existing pipelines and allow the user to select one for editing.
### Copy
This will copy the selected pipeline in the editor and load it. The user will be required to save
the pipeline to generate a new id and store the changes.
### Import
This will open the [code editor](code_editor.md) with the syntax set to JSON. The user can
paste a JSON pipeline and load it to the editor. The user will be required to save the pipeline 
to store the changes.
### Export
This will open the [code editor](code_editor.md) with the syntax set to JSON. The selected pipeline
will be loaded.
### Delete
This will delete the selected pipeline.
## Step Selector
The _step selector_ provides easy access to all steps available to be chosen. Steps will be dragged from
the _step selector_ to the [designer](#designer). Other than the preloaded steps, all other steps will be
provided from the step library.
### Filter
A filter text box allows the user to type in a name/command to reduce the list of steps. The drop down 
allows filtering steps by tags.

![Tags Dropdown](images/tags_dropdown.png)  
### Flow Control Steps
A set of steps that provide flow control have been provided under the _Flow Control_ expansion panel.

![Flow Control](images/flow_control_steps.png)
#### Fork/Join
The fork/join steps provide support for the fork/join logic.
#### Step Group
The _Step Group_ step provides a blank step for defining a step group. This step should be used only if the 
[Step Groups panel](#step-groups) doesn't have a specific step. Using this step may prevent viewing the
step group pipeline.
#### Custom Branch
A step is provided that allows creating a dynamic branch step without having to provide the step as code. A modal
will be displayed for this step that allows picking a base step and providing a name, display name and description.
The user will also be required to define at least one result before the step can be saved.

![Custom Branch Modal](images/custom_branch_modal.png)
### Step Groups
## Control Panel
## Designer
## Step Parameters
