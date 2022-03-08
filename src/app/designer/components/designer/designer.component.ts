import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {DndDropEvent} from 'ngx-drag-drop';
import {Subject, Subscription} from 'rxjs';
import {DesignerNodeComponent} from '../designer-node/designer-node.component';
import {DesignerNodeDirective} from '../../directives/designer-node.directive';
import {graphlib, layout} from 'dagre';
import {
  DesignerConstants,
  DesignerElement,
  DesignerElementAction,
  DesignerElementAddOutput,
  DesignerElementOutput,
  DesignerModel
} from "../../designer-constants";
import {SharedFunctions} from "../../../shared/utils/shared-functions";
import {newInstance} from '@jsplumb/browser-ui';
import {BranchNodeComponent} from "../branch-node/branch-node.component";
import {GroupNodeComponent} from "../designer-group/group-node.component";

@Component({
  selector: 'app-designer',
  templateUrl: './designer.component.html',
  styleUrls: ['./designer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DesignerComponent implements AfterViewInit, OnDestroy {
  @ViewChild(DesignerNodeDirective, {static: true}) designerCanvas: DesignerNodeDirective;
  @ViewChild('canvas', {static: false}) canvas: ElementRef;
  @Input() addElementSubject: Subject<DesignerElement>;
  @Input() addElementOutput: Subject<DesignerElementAddOutput>;
  @Input() useGroups: boolean = false;
  @Input() zoomSubject: Subject<number>;
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

  subscriptions: Subscription[] = [];
  elementSubscriptions: Subscription[] = [];

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
    this.selectedComponent = null;
  }

  ngAfterViewInit() {
    if (!this.model) {
      this.model = DesignerComponent.newModel();
    }
    this.initializeDesigner();
    // Listen for the add new element call back event
    if (this.addElementSubject) {
      this.subscriptions.push(
        this.addElementSubject.subscribe(element => this.addDesignerElement(element)));
    }
    // Listen for add output events for an element
    if (this.addElementOutput) {
      this.subscriptions.push(this.addElementOutput.subscribe(request => {
        const nodeId = Object.keys(this.model.nodes).find(node => {
          return this.model.nodes[node].data['name'] === request.element.name;
        });
        const endpoint =
          this.jsPlumbInstance.addEndpoint(this.htmlNodeLookup[nodeId], DesignerComponent.getSourceEndpointOptions(null, false));
        this.model.endpoints[endpoint.id] = {
          name: request.output,
          nodeId
        }
      }));
    }
    if (this.zoomSubject) {
      this.subscriptions.push(this.zoomSubject.subscribe((ratio) => {
        this.canvas.nativeElement.style.transform = `scale(${ratio})`;
        this.jsPlumbInstance.setZoom(ratio);
      }));
    }
    this.populateFromModel();
    this.viewReady = true;
  }

  ngOnDestroy(): void {
    this.subscriptions = SharedFunctions.clearSubscriptions(this.subscriptions);
    this.elementSubscriptions = SharedFunctions.clearSubscriptions(this.elementSubscriptions);
  }

  removeElement(data: DesignerElement, componentRef) {
    let key = Object.keys(this.model.nodes).find(k => this.model.nodes[k].data.name === data.name);
    this.jsPlumbInstance.unmanage(this.jsPlumbInstance.getManagedElement(key), true);
    delete this.model.nodes[key];
    delete this.htmlNodeLookup[key];
    this.designerCanvas.viewContainerRef.remove(this.designerCanvas.viewContainerRef.indexOf(componentRef));
    this.broadCastModelChanges();
    this.selectedComponent = null;
  }

  static newModel() {
    return {
      nodeSeq: 1,
      nodes: {},
      endpoints: {},
      connections: {},
      groups: {}
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
    this.jsPlumbInstance.batch(() => {
      this.addModelNode(nodeId, this.model.nodes[nodeId]);
      if (this.useGroups && data.rootGroupNode) {
        const group = `group-${data.data['id']}`;
        this.model.groups[group] = {
          x: x - canvasRect.x,
          y: y - canvasRect.y,
          childNodes: [],
          parentNode: nodeId,
          name: data.data['id'],
        };
        this.createGroup(group);
        this.jsPlumbInstance.currentlyDragging = true;
        this.jsPlumbInstance.addToGroup(group, this.htmlNodeLookup[nodeId]);
        this.model.nodes[nodeId].x = '0px';
        this.model.nodes[nodeId].y = '40px';
        this.htmlNodeLookup[nodeId].style.left = `0px`;
        this.htmlNodeLookup[nodeId].style.top = `40px`;
        this.jsPlumbInstance.currentlyDragging = false;
      }
    });
  }

  populateFromModel() {
    this.jsPlumbInstance.batch(() => {
      this.modelPopulating = true;
      // Add groups
      const groupLookup = new Map();
      if (this.useGroups) {
        const embeddedGroups = new Map();
        // Add all root groups first
        Object.keys(this.model.groups).sort((g1, g2) => {
          if (this.model.groups[g1].parent && !this.model.groups[g2].parent) {
            return -1;
          } else if (this.model.groups[g2].parent && !this.model.groups[g1].parent) {
            return 1;
          }
          return 0;
        }).forEach((group) => {
          // Add parent node to the group
          groupLookup.set(this.model.groups[group].parentNode, group);
          // Add each child node to the group
          this.model.groups[group].childNodes.forEach(id => groupLookup.set(id, group));
          // Create a div and add the group body
          this.createGroup(group);
          if (this.model.groups[group].parent) {
            embeddedGroups.set(group, this.model.groups[group].parent);
          }
        });
        // Add groups to groups after all groups have been created
        embeddedGroups.forEach((value, key) => this.jsPlumbInstance.addToGroup(value, this.htmlNodeLookup[key]));
      }
      // Iterate the nodes in the model
      for (let key of Object.keys(this.model.nodes)) {
        this.addModelNode(key, this.model.nodes[key]);
        if (groupLookup.has(key)) {
          this.jsPlumbInstance.addToGroup(groupLookup.get(key), this.htmlNodeLookup[key]);
          // this.htmlNodeLookup[key].style.left = `${this.model.nodes[key].x - 64}px`;
          // this.htmlNodeLookup[key].style.top = `${this.model.nodes[key].y - 32}px`;
          this.htmlNodeLookup[key].style.left = `${this.model.nodes[key].x}px`;
          this.htmlNodeLookup[key].style.top = `${this.model.nodes[key].y}px`;
        }
      }
      // Add connections from model
      let connection;
      const endpointEntries = Object.entries(this.model.endpoints);
      for (let key of Object.keys(this.model.connections)) {
        connection = this.model.connections[key];
        // Only create a connection if both nodeIds are populated
        if (connection.sourceNodeId && connection.targetNodeId) {
          connection.endpoints.forEach(ep => {
            this.jsPlumbInstance.connect({
              source: this.jsPlumbInstance.getEndpoints(this.htmlNodeLookup[connection.sourceNodeId]).find(e =>
                e.id === endpointEntries.find(entry => entry[1].name === ep.sourceEndPoint &&
                  entry[1].nodeId === connection.sourceNodeId)[0]),
              target: this.jsPlumbInstance.getEndpoints(this.htmlNodeLookup[connection.targetNodeId]).find(e =>
                e.id === endpointEntries.find(entry => entry[1].name === ep.targetEndPoint &&
                  entry[1].nodeId === connection.targetNodeId)[0])
            });
          });
        }
      }
      this.modelPopulating = false;
    });
  }

  private initializeDesigner() {
    this.elementSubscriptions = SharedFunctions.clearSubscriptions(this.elementSubscriptions);
    if (this.jsPlumbInstance) {
      this.jsPlumbInstance.reset();
      this.jsPlumbInstance.destroy();
    }
    this.jsPlumbInstance = newInstance({
      container: this.canvas.nativeElement
    });
    this.jsPlumbInstance.batch(() => {
      this.jsPlumbInstance.bind('connection', (info) => {
        if (this.modelPopulating) {
          return;
        }
        this.jsPlumbInstance.batch(() => {
          this.addConnection(info.sourceId, info.targetId, info.sourceEndpoint, info.targetEndpoint);
        });
        this.broadCastModelChanges();
      });
      this.jsPlumbInstance.bind('connection:move', (info) => {
        this.jsPlumbInstance.batch(() => {
          const endPoint = info.connection.endpoints.find(e => e.elementId === info.originalSourceId);
          this.removeConnection(info.originalSourceId, info.originalTargetId, endPoint);
        });
        this.broadCastModelChanges()
      });
      this.jsPlumbInstance.bind('connection:detach', (info) => {
        this.jsPlumbInstance.batch(() => {
          this.removeConnection(info.sourceId, info.targetId, info.sourceEndpoint);
        });
        this.broadCastModelChanges();
      });
      // Register drag stop so we can track element positions
      this.jsPlumbInstance.bind('drag:stop', (info) => {
        if (info.elements && info.elements.length > 0) {
          info.elements.forEach((e) => {
            if (this.model.nodes[e.id]) {
              this.model.nodes[e.id].x = e.pos.x;
              this.model.nodes[e.id].y = e.pos.y;
            } else if (this.model.groups[e.el.id]) {
              this.model.groups[e.el.id].x = e.pos.x;
              this.model.groups[e.el.id].y = e.pos.y;
            }
          });
        }
      });
      this.designerCanvas.viewContainerRef.clear();
    });
    this.htmlNodeLookup = {};
  }

  private static convertPositionToInt(position) {
    return parseInt(position.substring(0, position.indexOf('px')));
  }

  private createGroup(group) {
    // Skip if the group has already been created
    if (this.htmlNodeLookup[group]) {
      return;
    }
    // Create a div and add the group body
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(GroupNodeComponent);
    const componentRef = this.designerCanvas.viewContainerRef.createComponent(componentFactory);
    componentRef.instance.id = group;
    componentRef.instance.name = this.model.groups[group].name;
    const node = componentRef.location.nativeElement;
    node.setAttribute('id', group);
    node.style.left = `${this.model.groups[group].x}px`;
    node.style.top = `${this.model.groups[group].y}px`;
    this.htmlNodeLookup[group] = node;
    // Handle the collapse/expand actions
    this.elementSubscriptions.push(componentRef.instance.nodeAction.subscribe(this.getGroupExpansionHandler(group)));
    // Create the group
    this.jsPlumbInstance.addGroup({
      id: group,
      el: node,
      droppable: false,
      orphan: true
    });
    // See if there are child groups and create them
    Object.keys(this.model.groups).filter(g => this.model.groups[g].parent === group).forEach(child => this.createGroup(child));
    const dimensions = DesignerComponent.calculateGroupDimensions(group, this.model, this.htmlNodeLookup);
    node.style.width = `${dimensions.width}px`;
    node.style.height = `${dimensions.height}px`;
  }

  private getGroupExpansionHandler(groupId) {
    return (data) => {
      this.jsPlumbInstance.batch(() => {
        const groupNode = this.htmlNodeLookup[groupId];
        // let shiftPosition;
        if (data.action === "collapse") {
          this.model.groups[groupId].expanded = false;
          // shiftPosition = 32 - DesignerComponent.convertPositionToInt(groupNode.style.height);
          groupNode.style.height = '32px';
          this.jsPlumbInstance.collapseGroup(groupId);
        } else {
          this.model.groups[groupId].expanded = true;
          const expandedSize = DesignerComponent.calculateGroupDimensions(groupId, this.model, this.htmlNodeLookup);
          // shiftPosition = expandedSize.height - 32;
          groupNode.style.width = `${expandedSize.width}px`;
          groupNode.style.height = `${expandedSize.height}px`;
          this.jsPlumbInstance.expandGroup(groupId);
        }
        // let tempNode;
        const groupNodes = this.model.groups[groupId].childNodes;
        groupNodes.push(this.model.groups[groupId].parentNode);
        // const groupTop = DesignerComponent.convertPositionToInt(groupNode.style.top);
        // const groupY = groupTop + DesignerComponent.convertPositionToInt(groupNode.style.height);
        // let top;
        // this.jsPlumbInstance.currentlyDragging = true;
        // TODO Refine this to only shift groups/nodes that are below and within the afeect x axis
        // Object.keys(this.model.nodes).filter(n => groupNodes.indexOf(n) === -1).forEach((nodeKey) => {
        //   tempNode = this.htmlNodeLookup[nodeKey];
        //   top = DesignerComponent.convertPositionToInt(tempNode.style.top);
        //   if ((!this.model.groups[groupId].expanded && top > groupY) ||
        //     (this.model.groups[groupId].expanded && (top < groupY && top > groupTop))) {
        //     tempNode.style.top = `${top + shiftPosition}px`;
        //   }
        // });
        // this.jsPlumbInstance.currentlyDragging = false;
      });
    };
  }

  private static calculateGroupDimensions(group, model, htmlNodeLookup) {
    const groupY = this.convertPositionToInt(htmlNodeLookup[group].style.top);
    let nodeX = model.nodes[model.groups[group].parentNode].x;
    let nodeY = model.nodes[model.groups[group].parentNode].y;
    let eleX = model.groups[group].parentNode;
    let eleY = model.groups[group].parentNode;
    let eleXGroup = false;
    let eleYGroup = false;
    // Add each child node to the group
    model.groups[group].childNodes.forEach((id) => {
      if (model.nodes[id].x > nodeX) {
        nodeX = model.nodes[id].x;
        eleX =id;
      }
      if (model.nodes[id].y > nodeY) {
        nodeY = model.nodes[id].y;
        eleY = id;
      }
    });

    // Include child group information
    Object.keys(model.groups).filter(g => model.groups[g].parent === group).forEach((child) => {
      if (model.groups[child].x > nodeX) {
        nodeX = model.groups[child].x;
        eleX = child;
        eleXGroup = true;
      }
      if (model.groups[child].y > nodeY) {
        nodeY = model.groups[child].y;
        eleY = child;
        eleYGroup = true;
      }
    });
    let width;
    if (eleXGroup) {
      width = (model.groups[eleX].x - this.convertPositionToInt(htmlNodeLookup[group].style.left))
        + this.calculateGroupDimensions(eleX, model, htmlNodeLookup).width
        + 32;
    } else {
      width = model.nodes[eleX].x + 192;
    }

    let height;
    if (eleYGroup) {
      height = (model.groups[eleY].y - groupY) + 128;
    } else {
      height = model.nodes[eleY].y + 128;
    }

    return { width, height };
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
      this.handleGroupChanges(sourceId);
      this.handleGroupChanges(targetId);
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
    this.handleGroupChanges(sourceId);
    this.handleGroupChanges(targetId);
  }

  private handleGroupChanges(nodeId) {
    if (this.useGroups) {
      const groupInformation = this.getGroupInformation(nodeId);
      let parentNode = groupInformation.parentNode;
      // See if this node is connected to a node in a group
      let group = this.attachedToGroupNode(nodeId, true);
      if (!group) {
        group = this.attachedToGroupNode(nodeId, false);
      }
      let resize = false;
      // If the group is set then we need to make sure this is part of that group and resize
      if ((group && !groupInformation.group && !parentNode)) {
        this.removeNodeFromGroups(nodeId);
        resize = true;
        // If the group is not set, remove this node from any groups and resize
      } else if (groupInformation.group && !group) {
        this.removeNodeFromGroups(nodeId);
        group = groupInformation.group;
        resize = true;
      }

      if (group) {
        this.model.groups[group].childNodes.push(nodeId);
        this.jsPlumbInstance.addToGroup(group, this.htmlNodeLookup[nodeId]);
      }

      if (resize) {
        DesignerComponent.performGroupLayout(this.model, group);
        const dimensions = DesignerComponent.calculateGroupDimensions(group, this.model, this.htmlNodeLookup);
        const node = this.htmlNodeLookup[group];
        node.style.width = `${dimensions.width}px`;
        node.style.height = `${dimensions.height}px`;
        const n = this.model.groups[group].parentNode;
        this.htmlNodeLookup[n].style.left = `${this.model.nodes[n].x - 64}px`;
        this.htmlNodeLookup[n].style.top = `${this.model.nodes[n].y - 32}px`;
        this.model.groups[group].childNodes.forEach((childNodeId) => {
          this.htmlNodeLookup[childNodeId].style.left = `${this.model.nodes[childNodeId].x - 64}px`;
          this.htmlNodeLookup[childNodeId].style.top = `${this.model.nodes[childNodeId].y - 32}px`;
        });
      }
    }
  }

  private removeNodeFromGroups(nodeId) {
    Object.keys(this.model.groups).forEach((g) => {
      if (this.model.groups[g].childNodes.indexOf(nodeId)) {
        this.model.groups[g].childNodes = this.model.groups[g].childNodes.filter(n => n !== nodeId);
        this.jsPlumbInstance.removeFromGroup(g, this.htmlNodeLookup[nodeId]);
      }
    });
  }

  private attachedToGroupNode(nodeId, sourceToTarget) {
    const nodeIndex = sourceToTarget ? 0 : 1;
    const targetIndex = sourceToTarget ? 1 : 0;
    let group;
    let nodeData;
    let targetNodeId;
    const connections = Object.keys(this.model.connections).filter(k => k.split('::')[nodeIndex] === nodeId);
    connections.some((c) => {
      targetNodeId = c.split('::')[targetIndex];
      nodeData = this.model.nodes[targetNodeId].data;
      if (nodeData.endGroupNode || nodeData.rootGroupNode) {
        group = this.getGroupInformation(targetNodeId).group;
        if ((!sourceToTarget && nodeData.endGroupNode) || (sourceToTarget && nodeData.rootGroupNode)) {
          group = null;
        }
      } else {
        group = this.attachedToGroupNode(targetNodeId, sourceToTarget);
      }
      return group;
    });
    return group;
  }

  private getGroupInformation(nodeId) {
    let parentNode = false;
    const groups = Object.keys(this.model.groups);
    let group = groups.find((g) => {
      if (this.model.groups[g].parentNode === nodeId) {
        parentNode = true;
        return true;
      }
      return this.model.groups[g].childNodes.indexOf(nodeId) !== -1;
    });
    return {group, parentNode};
  }

  private addModelNode(nodeId, nodeData) {
    const data = nodeData.data;
    // Add dynamic component
    const node = this.addDynamicNode(nodeId, data);
    node.style.left = `${this.model.nodes[nodeId].x - 64}px`;
    node.style.top = `${this.model.nodes[nodeId].y - 32}px`;

    this.htmlNodeLookup[nodeId] = node;
    const branch = data.data['type'] === 'branch';
    // Add the input connector
    if (data.input) {
      const endPointOptions = DesignerConstants.DEFAULT_TARGET_ENDPOINT;
      endPointOptions.anchor = branch ? [0.5, 0, 1, 1, 0, -15] : [0.47, 0, 1, 1, 5];
      endPointOptions.endpoint = DesignerConstants.ENDPOINT_STYLE;
      const endpoint = this.jsPlumbInstance.addEndpoint(node, endPointOptions);
      this.model.endpoints[endpoint.id] = {
        name: 'input',
        nodeId
      }
    }
    // Add the output connectors
    if (data.outputs && data.outputs.length > 0) {
      const outputs = data.outputs.filter(output => output.type !== 'error');
      const errors = data.outputs.filter(output => output.type === 'error')
      errors.forEach((error) => {
        endpoint =
          this.jsPlumbInstance.addEndpoint(node, DesignerComponent.getSourceEndpointOptions(error, branch));
        this.model.endpoints[endpoint.id] = {
          name: error.name,
          nodeId
        }
      });
      let endpoint;
      outputs.forEach((output, index) => {
        endpoint =
          this.jsPlumbInstance.addEndpoint(node, DesignerComponent.getSourceEndpointOptions(output, false));
        this.model.endpoints[endpoint.id] = {
          name: output.name,
          nodeId
        }
      });
    }
    this.broadCastModelChanges();
  }

  private addDynamicNode(nodeId: string, data: DesignerElement) {
    // Conditionally set the component when a branch node is detected
    const component = data.data['type'] === 'branch' ? BranchNodeComponent : DesignerNodeComponent;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
    const componentRef = this.designerCanvas.viewContainerRef.createComponent(componentFactory, 0);
    // TODO Maybe this needs to be skipped to keep too much data off the DOM
    componentRef.instance.data = data;
    componentRef.instance.id = nodeId;
    componentRef.location.nativeElement.className = data.style;
    // Handle selection events
    this.elementSubscriptions.push(componentRef.instance.nodeSelected.subscribe((d) => {
      if (this.selectedComponent) {
        this.selectedComponent.location.nativeElement.className = this.selectedComponent.location.nativeElement.className.replace('designer-node-selected', '');
      }
      componentRef.location.nativeElement.className = `${componentRef.location.nativeElement.className} designer-node-selected`;
      this.selectedComponent = componentRef;
      this.elementSelected.emit(d)
    }));
    this.elementSubscriptions.push(componentRef.instance.nodeAction.subscribe(d => this.elementAction.emit(d)));
    this.elementSubscriptions.push(componentRef.instance.nodeRemoved.subscribe(d => this.removeElement(d, componentRef)));
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

  private static getSourceEndpointOptions(output: DesignerElementOutput, branch) {
    const endPoint = output ? output.endPointOptions : JSON.parse(JSON.stringify(DesignerConstants.DEFAULT_SOURCE_ENDPOINT));
    const name = output && output.type !== 'normal' ? output.name : null;
    if (output && output.type === 'error') {
      endPoint.anchor = [1, 0.5, 1, 1, (branch ? 20 : 5)];
    } else {
      // TODO See if there is a way to adjust the closeness of the endpoint to the object
      endPoint.anchor = {
        type: "Perimeter",
        options: {
          shape: "Rectangle",
          rotation: 225
        }
      };
    }
    endPoint.endpoint = DesignerConstants.ENDPOINT_STYLE;
    if (name) {
      endPoint.overlays = [
        {
          type: 'Label',
          options: {
            location: [0.5, 1.5],
            label: name,
            id: name,
            cssClass: 'endpointSourceLabel'
          }
        }
      ];
    }
    return endPoint;
  }

  static performGroupLayout(model, group) {
    const graph = new graphlib.Graph();
    graph.setGraph({});
    graph.setDefaultEdgeLabel(() => { return {}; });
    // Set the nodes
    graph.setNode(model.groups[group].parentNode, {width: 128, height: 64});
    model.groups[group].childNodes.forEach(nodeKey => {
      graph.setNode(nodeKey, {width: 128, height: 64});
    });
    // Configure child groups
    const childGroups = Object.keys(model.groups).filter(g => model.groups[g].parent === group);
    childGroups.forEach((g) => {
      graph.setNode(g, {width: 192, height: 64});
      graph.setEdge(group, g);
    });
    // Set the edges
    let edge;
    let target;
    let source;
    let connElements;
    Object.keys(model.connections).filter((c) => {
      connElements = c.split('::');
      return graph.hasNode(connElements[0]) && graph.hasNode(connElements[1]);
    }).forEach(conn => {
      edge = model.connections[conn];
      target = edge.targetNodeId;
      source = edge.sourceNodeId;
      graph.setEdge(source, target);
    });
    // Perform layout
    layout(graph);
    let node;
    let gnode;
    graph.nodes().forEach(n => {
      node = model.nodes[n];
      gnode = graph.node(n);
      node.x = gnode.x;
      node.y = gnode.y + 32;
    });
  }

  static performAutoLayout(model, parentComponent?: DesignerComponent, useGroups?: boolean) {
    const graph = new graphlib.Graph({ compound: useGroups });
    graph.setGraph({});
    graph.setDefaultEdgeLabel(() => { return {}; });
    let node;
    let groupNodes = new Map();
    let parentNodes = new Map();
    // Set the groups
    if (useGroups) {
      Object.keys(model.groups).forEach((group) => {
        const dimensions = {width: 128, height: 64};
        graph.setNode(group, dimensions)
        parentNodes.set(model.groups[group].parentNode, group);
        // Set parent relationships
        graph.setParent(model.groups[group].parentNode, group);
        model.groups[group].childNodes.forEach((n) => {
          groupNodes.set(n, group);
          graph.setParent(n, group);
        });
      });
    }
    // Set the nodes
    Object.keys(model.nodes).forEach(nodeKey => {
      graph.setNode(nodeKey, {width: 128, height: 64});
    });
    // Set the edges
    let edge;
    Object.keys(model.connections).forEach(conn => {
      edge = model.connections[conn];
      graph.setEdge(edge.sourceNodeId, edge.targetNodeId)
    });
    // Perform layout
    layout(graph);
    // Update the model nodes
    let gnode;
    // Center elements on parent container
    let center = 0;
    let horizontalOffset = 64;
    if(parentComponent) {
      // Get parent container's width, use the middle point for horizontal offset
      horizontalOffset = horizontalOffset + (parentComponent.canvas.nativeElement.offsetParent.clientWidth / 2);
      // if there are nodes defined, then process additional center offset
      if(graph.nodes().length > 0) {
        // Get the first node from the graph and get its internal offset, use that as the center point
        const n = graph.nodes()[0];
        node = model.nodes[n];
        if (!node) {
          node = model.groups[n];
        }
        gnode = graph.node(n);
        center = gnode.x + 64; // +64 to meet the midpoint of the node
      }
    }
    const groupNodeOffsets = new Map();
    if (useGroups) {
      Object.keys(model.groups).forEach((g) => {
        gnode = graph.node(g);
        if (Object.keys(model.connections).findIndex(c => c.split('::')[1] === model.groups[g].parentNode) !== -1) {
          // dagre pushes groups further from the connecting nodes, so adjust up
          if (model.groups[g].parent) {
            groupNodeOffsets.set(g, (graph.node(model.groups[g].parentNode).y - gnode.y) + 64);
          } else {
            groupNodeOffsets.set(g, (graph.node(model.groups[g].parentNode).y - gnode.y) + 32);
          }
        } else {
          groupNodeOffsets.set(g, 0);
        }
        gnode.y = gnode.y + (groupNodeOffsets.get(g));
      });
    }
    let offsetY;
    let offsetX;
    graph.nodes().forEach(n => {
      node = model.nodes[n];
      gnode = graph.node(n);
      offsetY = 0;
      if (!node) {
        node = model.groups[n];
        if (node.parent) {
          offsetX = gnode.x + (gnode.x - graph.node(node.parent).x) + 96;
          offsetY = 96;
        } else {
          offsetX = gnode.x + horizontalOffset - center - 64;
          offsetY = -96;
        }
        node.x = offsetX;
      } else {
        if (groupNodes.has(n) || parentNodes.has(n)) {
          offsetX = gnode.x - graph.node(groupNodes.get(n) || parentNodes.get(n)).x;
          if (parentNodes.has(n) &&
            Object.keys(model.connections)
              .findIndex(c => c.split('::')[1] === n) === -1) {
            offsetY = 0;
          } else {
            offsetY = -128;
          }
        } else {
          offsetX = gnode.x + (horizontalOffset - center);
        }
        node.x = offsetX;
      }
      node.y = gnode.y + offsetY;
    });
  }

  removeNode() {
    this.selectedComponent.instance.nodeRemoved.emit(this.selectedComponent.instance.data);
  }

  handleAction(action: string) {
    this.selectedComponent.instance.nodeAction.emit({
      action,
      element: this.selectedComponent.instance.data
    })
  }
}
