import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {jsPlumb} from 'jsplumb';
import {DndDropEvent, DropEffect} from 'ngx-drag-drop';
import {Subject} from "rxjs";

export interface DesignerElement {
  name: string;
  input: boolean;
  outputs: Array<string>;
  icon: string;
  event: DndDropEvent;
  data: {};
}

@Component({
  selector: 'designer',
  templateUrl: './designer.component.html',
  styleUrls: ['./designer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DesignerComponent implements AfterViewInit {
  @ViewChild('canvas', {static: false}) canvas: ElementRef;
  @Input() addElementSubject: Subject<DesignerElement>;
  @Output() designerDropEvent = new EventEmitter<DndDropEvent>();
  @Output() modelChanged = new EventEmitter();
  endPointStyle = {
    fill: '#7AB02C',
    stroke: 7
  };

  endpointHoverStyle = {
    fill: '#216477',
    stroke: 7,
    strokeWidth: 4
  };
  sourceEndpoint = {
    endpoint: 'Dot',
    anchor: 'Bottom',
    isSource: true,
    isTarget: false,
    paintStyle: this.endPointStyle,
    hoverPaintStyle: this.endpointHoverStyle,
    connector: [ 'Flowchart', { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ]
  };
  targetEndpoint = {
    endpoint: 'Dot',
    anchor: 'Top',
    isSource: false,
    isTarget: true,
    paintStyle: this.endPointStyle,
    hoverPaintStyle: this.endpointHoverStyle,
    maxConnections: -1,
    dropOptions: { hoverClass: 'hover' },
  };

  model: any;

  jsPlumbInstance;
// TODO Need to handle adding and removing connections
// TODO Need to enable building from a model
  constructor() {}

  ngAfterViewInit() {
    this.model = {
      nodeSeq: 1,
      nodes: {},
      nodeLookup: {}
    };
    this.jsPlumbInstance = jsPlumb.getInstance();
    this.jsPlumbInstance.setContainer(this.canvas.nativeElement);
    this.jsPlumbInstance.bind('connection', (info, originalEvent) => {
      console.log(`Connection created: ${info.sourceId} --> ${info.targetId}`);
      console.log(`Connection created: ${info.sourceEndpoint.id} --> ${info.targetEndpoint.id}`);
    });
    this.jsPlumbInstance.bind('connectionDetached', (info, originalEvent) => {
      console.log(`Connection destroyed: ${info.sourceId} --> ${info.targetId}`);
      console.log(`Connection created: ${info.sourceEndpoint.id} --> ${info.targetEndpoint.id}`);
    });
    this.addElementSubject.subscribe(element => this.addDesignerElement(element));
  }

  /**
   * Emits an event when an element is dropped on the canvas. It is expected the parent of this component will perform
   * any pre-work and then emit an event through the addElementSubject to perform the actual add to the canvas.
   * @param event The drop event
   */
  addNewElement(event: DndDropEvent) {
    this.designerDropEvent.emit(event);
  }

  /**
   * Adds a new element to the designer canvas
   * @param data The data used to add the element to the designer. This will be added to the model.
   */
  addDesignerElement(data: DesignerElement) {
      let nodeId = `designer-node-${this.model.nodeSeq++}`;
      let nodeName = data.name; // TODO Make sure this name fits the control
      // Register the data with the model TODO: revisit this to make it more flexible
      this.model.nodes[nodeId] = data;
      this.model.nodeLookup[data.name] = nodeId;
      const node = this.canvas.nativeElement.ownerDocument.createElement('div');
      const labelDiv = this.canvas.nativeElement.ownerDocument.createElement('div');
      const imageDiv = this.canvas.nativeElement.ownerDocument.createElement('div');
      const label = this.canvas.nativeElement.ownerDocument.createTextNode(nodeName);
      labelDiv.appendChild(label);
      labelDiv.style['text-align'] = 'center';
      const img = this.canvas.nativeElement.ownerDocument.createElement('img');
      img.setAttribute('src', data.icon);
      img.setAttribute('height', '32px');
      img.setAttribute('width', '32px');
      imageDiv.appendChild(img);
      node.appendChild(labelDiv);
      node.appendChild(imageDiv);
      // this.jsPlumbInstance.setId(div, data.name);
      node.setAttribute('id', nodeId);
      node.setAttribute('class', 'designer-node');
      const canvasRect = this.canvas.nativeElement.getBoundingClientRect();
      node.style.left = `${(data.event.event.x - canvasRect.x) - 32}px`;
      node.style.top = `${(data.event.event.y - canvasRect.y) - 32}px`;
      this.canvas.nativeElement.appendChild(node);
      // Add the input connector
      if (data.input) {
        this.jsPlumbInstance.addEndpoint(node, this.targetEndpoint);
      }
      // Add the output connectors
      if(data.outputs && data.outputs.length > 0) {
        let rotations = [];
        if (data.outputs.length === 1 || data.outputs.length % 2 !== 0) {
          rotations.push(0);
        }
        let rotationStep = 180 / data.outputs.length;
        let iteration = rotations.length;
        let rotationIncrement = rotationStep;
        do {
          rotations.push(rotationIncrement);
          rotationIncrement += rotationStep;
          if(rotationIncrement > 89) {
            rotationStep = -rotationStep;
            rotationIncrement = 360 + rotationStep;
          }
          iteration += 1;
        } while (iteration < data.outputs.length);

        let i = 0;
        data.outputs.forEach(output => {
          this.jsPlumbInstance.addEndpoint(node, this.getSourceEndpointOptions(`${output}Output`,
            data.outputs.length > 1 ? output : null, rotations[i++]));
        });
      }
      this.jsPlumbInstance.draggable(node);
      console.log(event);
      this.broadCastModelChanges();
  }

  private broadCastModelChanges() {
    this.modelChanged.emit(this.model);
  }

  private getSourceEndpointOptions(id: string, name: string, rotation: number) {
    const endPoint = JSON.parse(JSON.stringify(this.sourceEndpoint));
    // TODO id is not being accounted for
    endPoint.id = id;
    endPoint.anchor = [ 'Perimeter', { shape:'Circle', rotation: rotation}];
    if (name) {
      endPoint.overlays = [
        ['Label', {location: [0.5, 1.5], label: name, cssClass: 'endpointSourceLabel'}]
      ];
    }
    return endPoint;
  }
}
