import {
  AfterViewInit,
  Component, ComponentFactoryResolver,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {DragEventCallbackOptions, EndpointOptions, jsPlumb, PaintStyle} from 'jsplumb';
import {DndDropEvent} from 'ngx-drag-drop';
import {Subject} from 'rxjs';
import {DesignerNodeComponent} from './node/designer.node.component';
import {DesignerNodeDirective} from './node/designer.node.directive';

export interface DesignerElement {
  name: string;
  input: boolean;
  outputs: Array<string>;
  tooltip: string;
  icon: string;
  event: DndDropEvent;
  data: {};
}

export interface DesignerModel {
  nodeSeq: number,
  nodes: object,
  endpoints: object,
  connections: object
}

@Component({
  selector: 'designer',
  templateUrl: './designer.component.html',
  styleUrls: ['./designer.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DesignerComponent implements AfterViewInit {
  @ViewChild(DesignerNodeDirective, {static: true}) designerCanvas: DesignerNodeDirective;
  @ViewChild('canvas', {static: false}) canvas: ElementRef;
  @Input() addElementSubject: Subject<DesignerElement>;
  model: DesignerModel;
  @Output() designerDropEvent = new EventEmitter<DndDropEvent>();
  @Output() modelChanged = new EventEmitter();
  @Output() elementSelected = new EventEmitter<DesignerElement>();
  endPointStyle: PaintStyle = {
    fill: '#7AB02C',
    stroke: '7'
  };
  endpointHoverStyle: PaintStyle = {
    fill: '#216477',
    stroke: '7',
    strokeWidth: 4
  };
  // http://jsplumb.github.io/jsplumb/connectors.html
  sourceEndpoint: EndpointOptions = {
    id: '',
    maxConnections: 1,
    parameters: undefined,
    reattachConnections: false,
    scope: '',
    type: '',
    anchor: 'Bottom',
    isSource: true,
    isTarget: false,
    paintStyle: this.endPointStyle,
    hoverPaintStyle: this.endpointHoverStyle,
    connector: [ 'Flowchart', { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ] //midpoint: 0.0001
  };
  targetEndpoint: EndpointOptions = {
    id: '',
    parameters: undefined,
    reattachConnections: false,
    scope: '',
    type: '',
    anchor: 'Top',
    isSource: false,
    isTarget: true,
    paintStyle: this.endPointStyle,
    hoverPaintStyle: this.endpointHoverStyle,
    maxConnections: -1,
    dropOptions: { hoverClass: 'hover' }
  };

  jsPlumbInstance;

  // TODO see if there is an angular way to handle this
  viewReady: boolean = false;
  modelPopulating: boolean = false;

  constructor(private componentFactoryResolver: ComponentFactoryResolver) {}

  @Input()
  set dataModel(model: DesignerModel) {
    if (model) {
      this.model = model;
      if (this.viewReady) {
        this.initializeDesigner();
        this.populateFromModel();
      }
    } else {
      this.model = DesignerComponent.newModel();
    }
  }

  ngAfterViewInit() {
    if (!this.model) {
      this.model = DesignerComponent.newModel();
    }
    this.initializeDesigner();
    // Listen for the add new element call back event
    this.addElementSubject.subscribe(element => this.addDesignerElement(element));
    this.populateFromModel();
    this.viewReady = true;
  }

  static newModel() {
    return {
      nodeSeq: 1,
      nodes: {},
      endpoints: {},
      connections: {}
    };
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
    const canvasRect = this.canvas.nativeElement.getBoundingClientRect();
    // Register the data with the model
    this.model.nodes[nodeId] = {
      data,
      x: data.event.event.x - canvasRect.x,
      y: data.event.event.y - canvasRect.y
    };
    this.addNModelNode(nodeId, this.model.nodes[nodeId]);
  }

  initializeDesigner() {
    if (this.jsPlumbInstance) {
      this.jsPlumbInstance.deleteEveryConnection();
      this.jsPlumbInstance.deleteEveryEndpoint();
    }
    this.jsPlumbInstance = jsPlumb.getInstance();
    this.jsPlumbInstance.setContainer(this.canvas.nativeElement);
    this.jsPlumbInstance.bind('connection', (info) => {
      if (this.modelPopulating) {
        return;
      }
      let connection = this.model.connections[`${info.sourceId}::${info.targetId}`];
      if (!connection) {
        connection = {
          sourceNodeId: info.sourceId,
          targetNodeId: info.targetId,
          endpoints: []
        };
        this.model.connections[`${info.sourceId}::${info.targetId}`] = connection;
      }
      const endpoint = connection.endpoints.find(ep => ep.sourceEndPoint === this.model.endpoints[info.sourceEndpoint.id].name);
      if (!endpoint) {
        connection.endpoints.push({
          sourceEndPoint: this.model.endpoints[info.sourceEndpoint.id].name,
          targetEndPoint: this.model.endpoints[info.targetEndpoint.id].name
        });
      }
      this.broadCastModelChanges();
    });
    this.jsPlumbInstance.bind('connectionDetached', (info) => {
      let connection = this.model.connections[`${info.sourceId}::${info.targetId}`];
      if (connection) {
        const endpoint = connection.endpoints.findIndex(ep => ep.sourceEndPoint === this.model.endpoints[info.sourceEndpoint.id].name);
        if (endpoint !== -1) {
          connection.endpoints.splice(endpoint, 1);
        }
        if (connection.endpoints.length === 0) {
          delete this.model.connections[`${info.sourceId}::${info.targetId}`];
        }
        this.broadCastModelChanges();
      }
    });
    this.designerCanvas.viewContainerRef.clear();
  }

  populateFromModel() {
    this.modelPopulating = true;
    // Iterate the nodes in the model
    for(let key of Object.keys(this.model.nodes)) {
      this.addNModelNode(key, this.model.nodes[key]);
    }
    // Add connections from model
    let connection;
    const endpointEntries = Object.entries(this.model.endpoints);
    for (let key of Object.keys(this.model.connections)) {
      connection = this.model.connections[key];
      connection.endpoints.forEach(ep => {
        this.jsPlumbInstance.connect({
          source:  this.jsPlumbInstance.getEndpoints(connection.sourceNodeId).find(e =>
            e.id === endpointEntries.find(entry => entry[1].name === ep.sourceEndPoint &&
            entry[1].nodeId === connection.sourceNodeId)[0]),
          target: this.jsPlumbInstance.getEndpoints(connection.targetNodeId).find(e =>
            e.id === endpointEntries.find(entry => entry[1].name === ep.targetEndPoint &&
            entry[1].nodeId === connection.targetNodeId)[0])
        });
      });
    }
    this.modelPopulating = false;
  }

  private addNModelNode(nodeId, nodeData) {
    const data = nodeData.data;
    // Add dynamic component
    const node = this.addDynamicNode(nodeId, data);
    node.style.left = `${this.model.nodes[nodeId].x - 32}px`;
    node.style.top = `${this.model.nodes[nodeId].y - 32}px`;

    // Add the input connector
    if (data.input) {
      const endpoint = this.jsPlumbInstance.addEndpoint(node, this.targetEndpoint);
      this.model.endpoints[endpoint.id] = {
        name: 'input',
        nodeId
      }
    }
    // Add the output connectors
    if (data.outputs && data.outputs.length > 0) {
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
        if (rotationIncrement > 89) {
          rotationStep = -rotationStep;
          rotationIncrement = 360 + rotationStep;
        }
        iteration += 1;
      } while (iteration < data.outputs.length);

      let i = 0;
      let endpoint;
      data.outputs.forEach(output => {
        endpoint =
          this.jsPlumbInstance.addEndpoint(node, this.getSourceEndpointOptions(
            data.outputs.length > 1 ? output : null,
            rotations[i++]));
        this.model.endpoints[endpoint.id] = {
          name: output,
          nodeId
        }
      });
    }
    this.jsPlumbInstance.draggable(node, {
      stop: (params:DragEventCallbackOptions) => {
        this.model.nodes[nodeId].x = params.pos[0];
        this.model.nodes[nodeId].y = params.pos[1];
        this.broadCastModelChanges();
      }
    });
    this.broadCastModelChanges();
  }

  private addDynamicNode(nodeId: string, data: DesignerElement) {
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(DesignerNodeComponent);
    const componentRef = this.designerCanvas.viewContainerRef.createComponent(componentFactory);
    componentRef.instance.data = data;
    componentRef.instance.id = nodeId;
    // Handle selection events
    componentRef.instance.nodeSelected.subscribe(data => this.elementSelected.emit(data));
    // Get the div element of the new node
    const node = componentRef.location.nativeElement;
    node.setAttribute('id', nodeId);
    return node;
  }

  private broadCastModelChanges() {
    this.modelChanged.emit(this.model);
  }

  private getSourceEndpointOptions(name: string, rotation: number) {
    const endPoint = JSON.parse(JSON.stringify(this.sourceEndpoint));
    endPoint.anchor = [ 'Perimeter', { shape:'Circle', rotation: rotation}];
    if (name) {
      endPoint.overlays = [
        ['Label', {location: [0.5, 1.5], label: name, cssClass: 'endpointSourceLabel'}]
      ];
    }
    return endPoint;
  }
}
