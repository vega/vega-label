/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/

import { canvas } from 'vega-canvas';

var CONTEXT = canvas().getContext('2d');

export function labelWidth(text, fontSize, font) {
  CONTEXT.font = fontSize + 'px ' + font; // TODO: add other font properties
  return CONTEXT.measureText(text).width;
}
