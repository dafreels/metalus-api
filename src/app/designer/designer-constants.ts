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

  static DEFAULT_SOURCE_ENDPOINT: EndpointOptions = {
    id: '',
    maxConnections: 1,
    parameters: undefined,
    reattachConnections: false,
    scope: '',
    type: '',
    anchor: 'Bottom',
    isSource: true,
    isTarget: false,
    paintStyle: DesignerConstants.DEFAULT_ENDPOINT_STYLE,
    hoverPaintStyle: DesignerConstants.DEFAULT_ENDPOINT_HOVER_STYLE,
    connector:[ 'Straight', { } ]
  };

  static DEFAULT_TARGET_ENDPOINT: EndpointOptions = {
    id: '',
    parameters: undefined,
    reattachConnections: false,
    scope: '',
    type: '',
    anchor: 'Top',
    isSource: false,
    isTarget: true,
    paintStyle: DesignerConstants.DEFAULT_ENDPOINT_STYLE,
    hoverPaintStyle: DesignerConstants.DEFAULT_ENDPOINT_HOVER_STYLE,
    maxConnections: -1,
    dropOptions: { hoverClass: 'hover' }
  };
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

// export class DesignerElementOutput {
//   name: string;
//   endPointOptions: EndpointOptions = {
//     id: '',
//     maxConnections: 1,
//     parameters: undefined,
//     reattachConnections: false,
//     scope: '',
//     type: '',
//     anchor: 'Bottom',
//     isSource: true,
//     isTarget: false,
//     paintStyle: DesignerConstants.DEFAULT_ENDPOINT_STYLE,
//     hoverPaintStyle: DesignerConstants.DEFAULT_ENDPOINT_HOVER_STYLE,
//     connector: ['Straight', {}]
//   };
// }
