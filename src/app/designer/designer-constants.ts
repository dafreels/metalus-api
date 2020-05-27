import {EndpointOptions, PaintStyle} from "jsplumb";
import {DndDropEvent} from "ngx-drag-drop";

export class DesignerConstants {
  static DEFAULT_ENDPOINT_STYLE: PaintStyle = {
    fill: '#7AB02C',
    stroke: '7'
  };

  static DEFAULT_ENDPOINT_HOVER_STYLE: PaintStyle = {
    fill: '#216477',
    stroke: '7',
    strokeWidth: 4
  };

  static DEFAULT_SOURCE_ENDPOINT: EndpointOptions = DesignerConstants.getSourceEndpointOptions();

  static DEFAULT_TARGET_ENDPOINT: EndpointOptions = DesignerConstants.getTargetEndpointOptions();

  static getSourceEndpointOptions(endPointStyle: PaintStyle = DesignerConstants.DEFAULT_ENDPOINT_STYLE,
                                  endPointHoverStyle: PaintStyle = DesignerConstants.DEFAULT_ENDPOINT_HOVER_STYLE,
                                  connectorStyle: PaintStyle = null,
                                  connectorHoverStyle: PaintStyle = null): EndpointOptions {
    return {
      id: '',
      maxConnections: 1,
      parameters: undefined,
      reattachConnections: false,
      scope: '',
      type: '',
      anchor: 'Bottom',
      isSource: true,
      isTarget: false,
      paintStyle: endPointStyle,
      hoverPaintStyle: endPointHoverStyle,
      connector:[ 'Straight', { } ],
      connectorStyle,
      connectorHoverStyle
    };
  }

  static getTargetEndpointOptions(endPointStyle: PaintStyle = DesignerConstants.DEFAULT_ENDPOINT_STYLE,
                                  endPointHoverStyle: PaintStyle = DesignerConstants.DEFAULT_ENDPOINT_HOVER_STYLE): EndpointOptions {
    return {
      id: '',
      parameters: undefined,
      reattachConnections: false,
      scope: '',
      type: '',
      anchor: 'Top',
      isSource: false,
      isTarget: true,
      paintStyle: endPointStyle,
      hoverPaintStyle: endPointHoverStyle,
      maxConnections: -1,
      dropOptions: { hoverClass: 'hover' }
    };
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

export interface DesignerElementAddOutput {
  element: DesignerElement;
  output: string;
}

export interface DesignerElement {
  name: string;
  input: boolean;
  outputs: Array<DesignerElementOutput>;
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

export class DesignerElementOutput {
  constructor(public name: string,
              public type: string,
              public endPointOptions: EndpointOptions) {}
}
