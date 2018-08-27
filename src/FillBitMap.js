/*eslint no-unused-vars: "warn"*/
/*eslint no-fallthrough: "warn" */
/*eslint no-console: "warn"*/
import BitMap from './BitMap';
import { Marks } from 'vega-scenegraph';

var ALPHA_MASK = 0xff000000;
var INSIDE_OPACITY_IN_ALPHA = 0x10000000; // opacity at 0.0625 in alpha
var INSIDE_OPACITY = 0.0625;

export default function(data, size, marktype, avoidBaseMark, avoidMarks, labelInside, padding) {
  var isGroupArea = marktype === 'group' && data[0].datum.datum.items[0].marktype === 'area',
    width = size[0],
    height = size[1],
    n = data.length;
  if (marktype && (avoidBaseMark || isGroupArea)) {
    var items = new Array(n);
    for (var i = 0; i < n; i++) {
      items[i] = data[i].datum.datum;
    }
    avoidMarks.push(items);
  }

  if (avoidMarks.length) {
    var context = writeToCanvas(avoidMarks, width, height, labelInside || isGroupArea);
    return writeToBitMaps(context, width, height, labelInside, isGroupArea, padding);
  } else {
    var bitMap = new BitMap(width, height, padding);
    if (avoidBaseMark) {
      for (i = 0; i < n; i++) {
        var d = data[i];
        bitMap.mark(d.markBound[0], d.markBound[3]);
      }
    }
    return [bitMap, undefined];
  }
}

function writeToCanvas(avoidMarks, width, height, labelInside) {
  var m = avoidMarks.length,
    // c = document.getElementById('canvas-render'), // debugging canvas
    c = document.createElement('canvas'),
    context = c.getContext('2d');
  var originalItems, itemsLen;
  c.setAttribute('width', width);
  c.setAttribute('height', height);

  for (var i = 0; i < m; i++) {
    originalItems = avoidMarks[i];
    itemsLen = originalItems.length;
    if (!itemsLen) continue;

    if (originalItems[0].mark.marktype !== 'group') drawMark(context, originalItems, labelInside);
    else drawGroup(context, originalItems, labelInside);
  }

  return context;
}

function writeToBitMaps(context, width, height, labelInside, isGroupArea, padding) {
  var layer1 = new BitMap(width, height, padding),
    layer2 = labelInside || isGroupArea ? new BitMap(width, height, padding) : undefined,
    imageData = context.getImageData(0, 0, width, height),
    canvasBuffer = new Uint32Array(imageData.data.buffer);
  var x, y, alpha;

  if (isGroupArea) {
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        alpha = canvasBuffer[y * width + x] & ALPHA_MASK;
        if (alpha && alpha ^ INSIDE_OPACITY_IN_ALPHA) layer2.mark(x, y);
      }
    }
  } else {
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        alpha = canvasBuffer[y * width + x] & ALPHA_MASK;
        if (alpha) {
          layer1.mark(x, y);
          if (labelInside && alpha ^ INSIDE_OPACITY_IN_ALPHA) layer2.mark(x, y);
        }
      }
    }
  }
  return [layer1, layer2];
}

function drawMark(context, originalItems, labelInside) {
  var n = originalItems.length;
  if (labelInside) {
    var items = new Array(n);
    for (var i = 0; i < n; i++) {
      items[i] = prepareMarkItem(originalItems[i]);
    }
  } else items = originalItems;

  Marks[items[0].mark.marktype].draw(context, { items: items }, null);
}

function drawGroup(context, groups, labelInside) {
  var n = groups.length,
    marks;
  for (var i = 0; i < n; i++) {
    marks = groups[i].items;
    for (var j = 0; j < marks.length; j++) {
      var g = marks[j];
      if (g.marktype !== 'group') drawMark(context, g.items, labelInside);
      else drawGroup(context, g.items, labelInside); // nested group might not work.
    }
  }
}

function prepareMarkItem(originalItem) {
  var item = {};
  for (var key in originalItem) {
    item[key] = originalItem[key];
  }
  if (item.stroke) item.strokeOpacity = 1;

  if (item.fill) {
    item.fillOpacity = INSIDE_OPACITY;
    item.stroke = '#000';
    item.strokeOpacity = 1;
    item.strokeWidth = 2;
  }
  return item;
}
