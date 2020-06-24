import { canvas } from 'vega-canvas';
var context = canvas().getContext("2d");

export function labelWidth (text, fontSize, font) {
  context.font = fontSize + "px " + font;
  return context.measureText(text + ".").width;
}

export function getBoundary(d, dx, dy, padding) {
  var x = d.x,
      y = d.y,
      w = d.textWidth,
      h = d.textHeight;
  var _y = y + (h * dy / 2.0) + (padding * dy),
      _x = x + (w * dx / 2.0) + (padding * dx);
  return {
    y: _y - (h / 2.0),
    yc: _y,
    y2: _y + (h / 2.0),
    x: _x - (w / 2.0),
    xc: _x,
    x2: _x + (w / 2.0),
  }
}

export function considerLabelFactory(projection, padding, findPosition, place) {
  return function(d) {
    if (d.x === undefined || d.y === undefined) {
      d.fill = null;
      d.z = 0;
      return;
    }

    d.z = 1;
    findPosition(d, projection, padding);

    if (d.labelPlaced) {
      place(d, projection);
    } else {
      d.fill = null;
      d.z = 0;
    }
    d.x = d.boundary.xc;
    d.y = d.boundary.yc;
  }
}

export function getAnchor(d, dx, dy, padding) {
  var x = d.datum.x,
      y = d.datum.y;
  return {
    xAnchor: x + padding * dx,
    yAnchor: y + padding * dy,
  };
}


var positions = [
  [-1, 1],
  [-1, -1],
  [1, -1],
  [1, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
  [0, 1],
];

// for (var i = 0.1; i < 1; i += 0.1) {
//   positions.push([1, i]);
//   positions.push([-1, i]);
//   positions.push([i, 1]);
//   positions.push([i, -1]);
//   positions.push([1, -i]);
//   positions.push([-1, -i]);
//   positions.push([-i, 1]);
//   positions.push([-i, -1]);
// }

export var POSITIONS = positions;
export var POSITIONS_LEN = positions.length;