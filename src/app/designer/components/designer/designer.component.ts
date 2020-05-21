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
import {DragEventCallbackOptions, jsPlumb} from 'jsplumb';
import {DndDropEvent} from 'ngx-drag-drop';
import {Subject} from 'rxjs';
import {DesignerNodeComponent} from '../designer-node/designer-node.component';
import {DesignerNodeDirective} from '../../directives/designer-node.directive';
import {graphlib, layout} from 'dagre';
import {
  DesignerConstants,
  DesignerElement,
  DesignerElementAction,
  DesignerElementAddOutput, DesignerElementOutput,
  DesignerModel
} from "../../designer-constants";

@Component({
  selector: 'app-designer',
  templateUrl: './designer.component.html',
  styleUrls: ['./designer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DesignerComponent implements AfterViewInit {
  @ViewChild(DesignerNodeDirective, {static: true}) designerCanvas: DesignerNodeDirective;
  @ViewChild('canvas', {static: false}) canvas: ElementRef;
  @Input() addElementSubject: Subject<DesignerElement>;
  @Input() addElementOutput: Subject<DesignerElementAddOutput>;
  model: DesignerModel;
  @Output() designerDropEvent = new EventEmitter<DndDropEvent>();
  @Output() modelChanged = new EventEmitter();
  @Output() elementSelected = new EventEmitter<DesignerElement>();
  @Output() elementAction = new EventEmitter<DesignerElementAction>();

  selectedComponent;
  jsPlumbInstance;

  // TODO see if there is an angular way to handle this
  viewReady: boolean = false;
  modelPopulating: boolean = false;

  htmlNodeLookup:object = {};

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
    // Listen for add output events for an element
    if (this.addElementOutput) {
      this.addElementOutput.subscribe(request => {
        const nodeId = Object.keys(this.model.nodes).find(node => {
          return this.model.nodes[node].data['name'] === request.element.name;
        });
        const endpoint =
          this.jsPlumbInstance.addEndpoint(this.htmlNodeLookup[nodeId], DesignerComponent.getSourceEndpointOptions(null, 0));
        this.model.endpoints[endpoint.id] = {
          name: request.output,
          nodeId
        }
      });
    }
    this.populateFromModel();
    this.viewReady = true;
  }

  removeElement(data: DesignerElement, componentRef) {
    let key = Object.keys(this.model.nodes).find(key => this.model.nodes[key].data.name === data.name);
    this.jsPlumbInstance.remove(key);
    delete this.model.nodes[key];
    delete this.htmlNodeLookup[key];
    this.designerCanvas.viewContainerRef.remove(this.designerCanvas.viewContainerRef.indexOf(componentRef));
    this.broadCastModelChanges();
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
      this.addConnection(info.sourceId, info.targetId, info.sourceEndpoint, info.targetEndpoint);
      this.broadCastModelChanges();
    });
    this.jsPlumbInstance.bind('connectionMoved', (info) => {
      this.removeConnection(info.originalSourceId, info.originalTargetId, info.originalSourceEndpoint);
      this.addConnection(info.newSourceId, info.newTargetId, info.newSourceEndpoint, info.newTargetEndpoint);
      this.broadCastModelChanges()
    });
    this.jsPlumbInstance.bind('connectionDetached', (info) => {
      this.removeConnection(info.sourceId, info.targetId, info.sourceEndpoint);
      this.broadCastModelChanges();
    });
    this.designerCanvas.viewContainerRef.clear();
  }

  private removeConnection(sourceId, targetId, sourceEndpoint) {
    const connection = this.model.connections[`${sourceId}::${targetId}`];
    if (connection) {
      const endpoint = connection.endpoints.findIndex(ep => ep.sourceEndPoint === this.model.endpoints[sourceEndpoint.id].name);
      if (endpoint !== -1) {
        connection.endpoints.splice(endpoint, 1);
      }
      if (connection.endpoints.length === 0) {
        delete this.model.connections[`${sourceId}::${targetId}`];
      }
    }
  }

  private addConnection(sourceId, targetId, sourceEndpoint, targetEndpoint) {
    let connection = this.model.connections[`${sourceId}::${targetId}`];
    if (!connection) {
      connection = {
        sourceNodeId: sourceId,
        targetNodeId: targetId,
        endpoints: []
      };
      this.model.connections[`${sourceId}::${targetId}`] = connection;
    }
    const endpoint = connection.endpoints.find(ep => ep.sourceEndPoint === this.model.endpoints[sourceEndpoint.id].name);
    if (!endpoint) {
      connection.endpoints.push({
        sourceEndPoint: this.model.endpoints[sourceEndpoint.id].name,
        targetEndPoint: this.model.endpoints[targetEndpoint.id].name
      });
    }
  }

  private addNModelNode(nodeId, nodeData) {
    const data = nodeData.data;
    // Add dynamic component
    const node = this.addDynamicNode(nodeId, data);
    node.style.left = `${this.model.nodes[nodeId].x - 32}px`;
    node.style.top = `${this.model.nodes[nodeId].y - 32}px`;

    this.htmlNodeLookup[nodeId] = node;

    // Add the input connector
    if (data.input) {
      const endpoint = this.jsPlumbInstance.addEndpoint(node, DesignerConstants.DEFAULT_TARGET_ENDPOINT);
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
          this.jsPlumbInstance.addEndpoint(node, DesignerComponent.getSourceEndpointOptions(output, rotations[i++]));
        this.model.endpoints[endpoint.id] = {
          name: output.name,
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
    // Handle selection events
    componentRef.instance.nodeSelected.subscribe(data => {
      if (this.selectedComponent) {
        this.selectedComponent.location.nativeElement.className = this.selectedComponent.location.nativeElement.className.replace('designer-node-selected', '');
      }
      componentRef.location.nativeElement.className = `${componentRef.location.nativeElement.className} designer-node-selected`;
      this.selectedComponent = componentRef;
      this.elementSelected.emit(data)
    });
    componentRef.instance.nodeAction.subscribe(data => this.elementAction.emit(data));
    componentRef.instance.nodeRemoved.subscribe(data => this.removeElement(data, componentRef));
    // Get the div element of the new node
    const node = componentRef.location.nativeElement;
    node.setAttribute('id', nodeId);
    return node;
  }

  private broadCastModelChanges() {
    if (!this.modelPopulating) {
      this.modelChanged.emit(this.model);
    }
  }

  private static getSourceEndpointOptions(output: DesignerElementOutput, rotation: number) {
    const endPoint = output ? output.endPointOptions : JSON.parse(JSON.stringify(DesignerConstants.DEFAULT_SOURCE_ENDPOINT));
    const name = output && output.type !== 'normal' ? output.name : null;
    endPoint.anchor = [ 'Perimeter', { shape:'Circle', rotation: rotation}];
    if (name) {
      endPoint.overlays = [
        ['Label', {location: [0.5, 1.5], label: name, cssClass: 'endpointSourceLabel'}]
      ];
    }
    return endPoint;
  }

  static performAutoLayout(model, parentComponent?: DesignerComponent) {
    const graph = new graphlib.Graph();
    graph.setGraph({});
    graph.setDefaultEdgeLabel(() => { return {}; });
    let node;
    Object.keys(model.nodes).forEach(nodeKey => {
      node = model.nodes[nodeKey];
      // TODO need to get the width/height from the node being used
      graph.setNode(nodeKey, {width: 64, height: 64});
    });
    // Set the edges
    let edge;
    Object.keys(model.connections).forEach(conn => {
      edge = model.connections[conn];
      graph.setEdge(edge.sourceNodeId, edge.targetNodeId);
    })
    // Perform layout
    layout(graph);
    // Update the model nodes
    let gnode;

    // Center elements on parent container
    let center = 0;
    let horizontalOffset = 32;
    if(parentComponent) {
      // Get parent container's width, use the middle point for horiziontal offset
      horizontalOffset = horizontalOffset + (parentComponent.canvas.nativeElement.offsetParent.clientWidth / 2);
      // if there are nodes defined, then process additional center offset
      if(graph.nodes().length > 0) {
        // Get the first node from the graph and get its internal offset, use that as the center point
        const n = graph.nodes()[0]
        node = model.nodes[n];
        gnode = graph.node(n);
        center = gnode.x + 32; // +32 to meet the midpoint of the node
      }
    }

    graph.nodes().forEach(n => {
      node = model.nodes[n];
      gnode = graph.node(n);
      node.x = gnode.x + horizontalOffset - center;
      node.y = gnode.y + 32;
    });
  }
}
