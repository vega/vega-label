import {canvas} from 'vega-canvas';
// import {rederive} from 'vega-dataflow';
import {Marks} from 'vega-scenegraph';

// bit mask for getting first 2 bytes of alpha value
var ALPHA_MASK = 0xff000000;

// alpha value equivalent to opacity 0.0625
var INSIDE_OPACITY_IN_ALPHA = 0x10000000;


export function drawAvoidMarks(avoidMarks, width, height) {
  var context = canvas(width, height).getContext("2d");
  avoidMarks.forEach(function(items) {draw(context, items)});
  return context;
}

export function markBitmaps($, avoidMarks, labelInside, isGroupArea) {
  // create canvas
  var width = $.width,
      height = $.height,
      border = labelInside || isGroupArea,
      context = canvas(width, height).getContext('2d');

  // render all marks to be avoided into canvas
  avoidMarks.forEach(items => draw(context, items, border));

  // get canvas buffer, create bitmaps
  var buffer = new Uint32Array(context.getImageData(0, 0, width, height).data.buffer),
        layer1 = $.bitmap(),
        layer2 = border && $.bitmap();

  // populate bitmap layers
  var x, y, u, v, alpha;
  for (y=0; y < height; ++y) {
    for (x=0; x < width; ++x) {
      alpha = buffer[y * width + x] & ALPHA_MASK;
      if (alpha) {
        u = $(x);
        v = $(y);
        if (!isGroupArea) layer1.set(u, v); // update interior bitmap
        if (border && alpha ^ INSIDE_OPACITY_IN_ALPHA) layer2.set(u, v); // update border bitmap
      }
    }
  }

  return [layer1, layer2];
}

function draw(context, items) {
  if (!items.length) return;
  var type = items[0].mark.marktype;

  if (type === 'group') {
    items.forEach(function(group) {
      group.items.forEach(function(mark) {draw(context, mark.items)});
    });
  } else {
    Marks[type].draw(context, {items: items});
  }
}
