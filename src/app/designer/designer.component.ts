import {AfterViewInit, Component, ElementRef, ViewChild, ViewEncapsulation} from '@angular/core';
import { jsPlumb } from 'jsplumb';
import {DndDropEvent, DropEffect} from 'ngx-drag-drop';

export abstract class DesignerSource {
  dropEffect: DropEffect = 'copy';

  protected constructor() {}
}

@Component({
  selector: 'designer',
  templateUrl: './designer.component.html',
  styleUrls: ['designer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DesignerComponent implements AfterViewInit {
  jsPlumbInstance;
  @ViewChild('canvas', {static: false}) canvas: ElementRef;

  connectorPaintStyle = {
    lineWidth: 4,
    strokeStyle: '#61B7CF',
    joinstyle: 'round',
    outlineColor: 'white',
    outlineWidth: 2
  };
  // .. and this is the hover style.
  connectorHoverStyle = {
    lineWidth: 4,
    strokeStyle: '#216477',
    outlineWidth: 2,
    outlineColor: 'white'
  };
  endpointHoverStyle = {
    fillStyle: '#216477',
    strokeStyle: '#216477'
  };
  sourceEndpoint = {
    endpoint: 'Dot',
    paintStyle: {
      strokeStyle: '#7AB02C',
      fillStyle: 'transparent',
      radius: 7,
      lineWidth: 3
    },
    isSource: true,
    connector: [ 'Flowchart', { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ],
    connectorStyle: this.connectorPaintStyle,
    hoverPaintStyle: this.endpointHoverStyle,
    connectorHoverStyle: this.connectorHoverStyle,
    dragOptions: {},
    overlays: [
      [ 'Label', {
        location: [0.5, 1.5],
        label: 'Drag',
        cssClass: 'endpointSourceLabel'
      } ]
    ]
  };
  targetEndpoint = {
    endpoint: 'Dot',
    paintStyle: { fillStyle: '#7AB02C', radius: 11 },
    hoverPaintStyle: this.endpointHoverStyle,
    maxConnections: -1,
    dropOptions: { hoverClass: 'hover', activeClass: 'active' },
    isTarget: true,
    overlays: [
      [ 'Label', { location: [0.5, -0.5], label: 'Drop', cssClass: 'endpointTargetLabel' } ]
    ]
  };

  constructor() {}

  ngAfterViewInit() {
    this.jsPlumbInstance = jsPlumb.getInstance();
    this.jsPlumbInstance.setContainer(this.canvas.nativeElement);
  }

  /**
   * Adds a new element to the designer canvas
   * @param event The drop event
   */
  addNewElement(event: DndDropEvent) {
    /*
     * https://community.jsplumbtoolkit.com/demo/flowchart/dom.html
     * Figure out how to use css on the actual nodes
     * Add element at location it was dropped
     * Supply a default 'name'. This should be editable at some point
     * Enable connections (addEndPoint) Should be driven by 'event.data'
     * Allow 'event.data' and additional metadata to to be attached to the element
     */
    let nodeId = event.data.name;
    const node = this.canvas.nativeElement.ownerDocument.createElement('div');
    const labelDiv = this.canvas.nativeElement.ownerDocument.createElement('div');
    const imageDiv = this.canvas.nativeElement.ownerDocument.createElement('div');
    const label = this.canvas.nativeElement.ownerDocument.createTextNode(nodeId);
    labelDiv.appendChild(label);
    labelDiv.style['text-align'] = 'center';
    const img = this.canvas.nativeElement.ownerDocument.createElement('img');
    img.setAttribute('src', `../assets/${event.data.type}.png`);
    img.setAttribute('height', '32px');
    img.setAttribute('width', '32px');
    imageDiv.appendChild(img);
    node.appendChild(labelDiv);
    node.appendChild(imageDiv);
    // this.jsPlumbInstance.setId(div, event.data.name);
    node.setAttribute('id', nodeId);
    node.setAttribute('class', 'designer-node window jtk-node');
    node.style.position = 'absolute';
    // node.style.left = `${event.event.target.offsetLeft - event.event.screenX}px`;
    // node.style.top = `${event.event.target.offsetTop - event.event.screenY}px`;
    this.canvas.nativeElement.appendChild(node);
    // Add the input connector
    if (event.data.input) {
      this.jsPlumbInstance.addEndpoint(node, this.targetEndpoint, {
        anchor: 'Top',
        uuid: `${nodeId}Input`
      });
    }
    // Add the output connectors
    if(event.data.outputs && event.data.outputs.length > 0) {
      event.data.outputs.forEach(output => {
        this.jsPlumbInstance.addEndpoint(node, this.sourceEndpoint, {
          anchor: 'Bottom',
          uuid: `${output}Output`
        });
      });
    }
    this.jsPlumbInstance.draggable(node, { grid: [20, 20] });
    console.log(event)
  }
}
