import { parse } from 'json2csv';

export class LucidchartExport {
    private static getCsvData(shapes, lines) {
        const csvData = parse(shapes.concat(lines), {
            fields: [
                {
                    value: "id",
                    label: "Id"
                },
                {
                    value: "name",
                    label: "Name"
                },
                {
                    value: "shapeLibrary",
                    label: "Shape Library"
                },
                {
                    value: "pageId",
                    label: "Page ID"
                },
                {
                    value: "containedBy",
                    label: "Contained By"
                },
                {
                    value: "lineSource",
                    label: "Line Source"
                },
                {
                    value: "lineDestination",
                    label: "Line Destination"
                },
                {
                    value: "sourceArrow",
                    label: "Source Arrow"
                },
                {
                    value: "destinationArrow",
                    label: "Destination Arrow"
                },
                {
                    value: "textArea1",
                    label: "Text Area 1"
                },
                {
                    value: "textArea2",
                    label: "Text Area 2"
                },
                {
                    value: "textArea3",
                    label: "Text Area 3"
                }
            ],
            quote: ''
        })
        return csvData;
    }

    private static addShape(shapeArray, id, shape, text, pageId = 1) {
        let pageNum = pageId
        let shapeLib = "Flowchart Shapes"
        if(pageId <= 0) {
            pageNum = -1
            shapeLib = ""
        }
        shapeArray.push({ 
            id: id,
            name: shape,
            shapeLibrary: shapeLib,
            pageId: pageNum > 0 ? pageNum : "",
            containedBy: "",
            lineSource: "",
            lineDestination: "",
            sourceArrow: "",
            destinationArrow: "",
            textArea1: text,
            textArea2: "",
            textArea3: ""
        })
    }

    private static addLine(lineArray, id, sourceId, destinationId, text, asArrow = false, pageId = 1) {
        let arrowType = "None"
        if(asArrow) {
            arrowType = "Arrow"
        }
        lineArray.push({
            id: id,
            name: "Line",
            shapeLibrary: "",
            pageId: pageId,
            containedBy: "",
            lineSource: sourceId,
            lineDestination: destinationId,
            sourceArrow: "None",
            destinationArrow: arrowType,
            textArea1: text,
            textArea2: "",
            textArea3: ""
        })
    }

    static createLucidchartData(pipeline) {
        let id = 1;

        console.log(`Parsing pipeline named "${pipeline.name}"`)
        const shapes = []
        const lines = []
        const notes = []
        const noteLines = []
        // add a page object to the primary arrays for each shapes and notes
        LucidchartExport.addShape(shapes, id++, "Page", pipeline.name, -1);
        LucidchartExport.addShape(notes, id++, "Page", pipeline.name+" - Notes", -1);

        // create an xref of stepIds and assign an integer id to each step
        const stepXref = {}
        pipeline.steps.forEach(step => {
            stepXref[step.id] = id++
        })

        // populate the arrays for shapes/notes and the related lines, using 1000 as an offset for notes
        pipeline.steps.forEach(step => {
            let shape = "Process"
            if(step.type === "branch") {
                shape = "Decision";
                step.params.map(param => {
                    if(param.type === "result") {
                        LucidchartExport.addLine(lines, id++, stepXref[step.id], stepXref[param.value], param.name, true);
                        LucidchartExport.addLine(noteLines, id++, stepXref[step.id]+1000, stepXref[param.value]+1000, param.name, false, 2);
                    }
                })
            } else if(step.nextStepId == null || step.nextStepId === undefined) {
                shape = "Terminator"
            } else {
                if(step.type === "step-group") {
                    shape = "Predefined Process";
                }
                LucidchartExport.addLine(lines, id++, stepXref[step.id], stepXref[step.nextStepId], "", true);
                LucidchartExport.addLine(noteLines, id++, stepXref[step.id]+1000, stepXref[step.nextStepId]+1000, "", false, 2);
            }
            LucidchartExport.addShape(shapes, stepXref[step.id], shape, step.id);
            let noteDetails
            let stepCode = ""
            let stepId = "        "+step.stepId
            if(step.engineMeta) {
                stepCode = step.engineMeta.spark
            }
            if(step.type === "step-group") {
                stepCode = "Step Group for PipelineId: "+step.params[0].value
                stepId = ""
            }
            noteDetails = stepCode+stepId
            LucidchartExport.addShape(notes, stepXref[step.id]+1000, "Curly Brace Note", noteDetails, 2);
        }); 
        const shapeData = LucidchartExport.getCsvData(shapes, lines);
        const notesData = LucidchartExport.getCsvData(notes, noteLines);
        return {
            shapeData,
            notesData
        }
    }
};
const lucidchartExport = new LucidchartExport();
export default lucidchartExport;