import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
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
import {DesignerNodeComponent} from '../designer-node/designer-node.component';
import {DesignerNodeDirective} from '../../directives/designer-node.directive';

export interface DesignerElement {
  name: string;
  input: boolean;
  outputs: Array<string>;
  tooltip: string;
  icon: string;
  data: {};
  event?: DndDropEvent;
  style?: string;
  actions?: DesignerAction[];
  layout?: {
    x: number;
    y: number;
  }
}

export interface DesignerAction {
  displayName: string;
  action: string;
  enableFunction;
}

export interface DesignerModel {
  nodeSeq: number,
  nodes: object,
  endpoints: object,
  connections: object
}

export interface DesignerElementAction {
  action: string;
  element: DesignerElement;
}

@Component({
  selector: 'app-designer',
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
  @Output() elementAction = new EventEmitter<DesignerElementAction>();
  endPointStyle: PaintStyle = {
    fill: '#7AB02C',
    stroke: '7'
  };
  endpointHoverStyle: PaintStyle = {
    fill: '#216477',
    stroke: '7',
    strokeWidth: 4
  };
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
    connector:[ 'Straight', { } ]
  };
  // connector: [ 'Flowchart', { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ] //midpoint: 0.0001
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
  selectedComponent;

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
    if (this.addElementSubject) {
      this.addElementSubject.subscribe(element => this.addDesignerElement(element));
    }
    this.populateFromModel();
    this.viewReady = true;
  }

  removeElement(data: DesignerElement) {
    this.jsPlumbInstance.remove(Object.keys(this.model.nodes).find(key => this.model.nodes[key].data.name === data.name));
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
    const x = data.event ? data.event.event.x : data.layout.x;
    const y = data.event ? data.event.event.y : data.layout.y;
    this.model.nodes[nodeId] = {
      data,
      x: x - canvasRect.x,
      y: y - canvasRect.y
    };
    this.addNModelNode(nodeId, this.model.nodes[nodeId]);
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

  private initializeDesigner() {
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
    componentRef.location.nativeElement.className = data.style;
    // Handle selection events TODO: Try to find an angular way to do this
    componentRef.instance.nodeSelected.subscribe(data => {
      if (this.selectedComponent) {
        this.selectedComponent.location.nativeElement.className = this.selectedComponent.location.nativeElement.className.replace('designer-node-selected', '');
      }
      componentRef.location.nativeElement.className = `${componentRef.location.nativeElement.className} designer-node-selected`;
      this.selectedComponent = componentRef;
      this.elementSelected.emit(data)
    });
    componentRef.instance.nodeAction.subscribe(data => this.elementAction.emit(data));
    componentRef.instance.nodeRemoved.subscribe(data => this.removeElement(data));
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

  // TODO This is a basic layout algorithm, need to try to use a proper library like dagre
  static performAutoLayout(nodeLookup, connectedNodes, model) {
    let x = 300;
    let y = 100;
    const nodeId = nodeLookup[Object.keys(nodeLookup).filter(key => connectedNodes.indexOf(key) === -1)[0]];
    if (nodeId) {
      const rootNode = model.nodes[nodeLookup[Object.keys(nodeLookup).filter(key => connectedNodes.indexOf(key) === -1)[0]]];
      DesignerComponent.setNodeCoordinates(model, nodeLookup, rootNode, nodeId, x, y);
    }
  }

  private static setNodeCoordinates(model, nodeLookup, parentNode, nodeId, x, y) {
    if (parentNode.x === -1) {
      parentNode.x = x;
    }
    parentNode.y = y;
    const children = Object.keys(model.connections).filter(key => key.indexOf(nodeId) === 0);
    const totalWidth = children.length * 80;
    y += 125;
    x = children.length === 1 ? x : x - (totalWidth / 2);
    if (x < 0) {
      x = 100;
    }
    let childNode;
    children.forEach(child => {
      nodeId = model.connections[child].targetNodeId;
      childNode = model.nodes[nodeId];
      DesignerComponent.setNodeCoordinates(model, nodeLookup, childNode, nodeId, x, y);
      x += 80;
    });
  }
}
