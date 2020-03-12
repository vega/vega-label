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
  var size = (dy * dy) + (dx * dx),
      _y = y + (h * dy / 2.0) + (padding * dy / size),
      _x = x + (w * dx / 2.0) + (padding * dx / size);
  return {
    y: _y - (h / 2.0),
    yc: _y,
    y2: _y + (h / 2.0),
    x: _x - (w / 2.0),
    xc: _x,
    x2: _x + (w / 2.0),
  }
}
