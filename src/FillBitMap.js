/*eslint no-unused-vars: "warn"*/
/*eslint no-fallthrough: "warn" */
/*eslint no-console: "warn"*/
import BitMap from './BitMap';
import { Marks } from 'vega-scenegraph';

// bit mask for getting first 2 bytes of alpha value
const ALPHA_MASK = 0xff000000;

// alpha value equivalent to opacity 0.0625
const INSIDE_OPACITY_IN_ALPHA = 0x10000000;
const INSIDE_OPACITY = 0.0625;

/**
 * Get bitmaps and fill the with mark information from data
 * @param {array} data data of labels to be placed
 * @param {array} size size of chart in format [width, height]
 * @param {string} marktype marktype of the base mark
 * @param {bool} avoidBaseMark a flag if base mark is to be avoided
 * @param {array} avoidMarks array of mark data to be avoided
 * @param {bool} labelInside a flag if label to be placed inside mark or not
 * @param {number} padding padding from the boundary of the chart
 *
 * @returns array of 2 bitmaps:
 *          - first bitmap is filled with all the avoiding marks
 *          - second bitmap is filled with borders of all the avoiding marks (second bit map can be
 *            undefined if checking border of base mark is not needed when not avoiding any mark)
 */
export default function(data, size, marktype, avoidBaseMark, avoidMarks, labelInside, padding) {
  const isGroupArea = marktype === 'group' && data[0].datum.datum.items[0].marktype === 'area',
    width = size[0],
    height = size[1],
    n = data.length;

  // extract data information from base mark when base mark is to be avoid
  // or base mark is implicitly avoid when base mark is group area
  if (marktype && (avoidBaseMark || isGroupArea)) {
    const items = new Array(n);
    for (let i = 0; i < n; i++) {
      items[i] = data[i].datum.datum;
    }
    avoidMarks.push(items);
  }

  if (avoidMarks.length) {
    // when there is at least one mark to be avoided
    const context = writeToCanvas(avoidMarks, width, height, labelInside || isGroupArea);
    return writeToBitMaps(context, width, height, labelInside, isGroupArea, padding);
  } else {
    const bitMap = new BitMap(width, height, padding);
    if (avoidBaseMark) {
      // when there is no base mark but data points are to be avoided
      for (let i = 0; i < n; i++) {
        const d = data[i];
        bitMap.mark(d.markBound[0], d.markBound[3]);
      }
    }
    return [bitMap, undefined];
  }
}

/**
 * Write marks to be avoided to canvas to be written to bitmap later
 * @param {array} avoidMarks array of mark data to be avoided
 * @param {number} width width of the chart
 * @param {number} height height of the chart
 * @param {bool} labelInside a flag if label to be placed inside mark or not
 *
 * @returns canvas context, to which all avoiding marks are drawn
 */
function writeToCanvas(avoidMarks, width, height, labelInside) {
  const m = avoidMarks.length,
    // c = document.getElementById('canvas-render'), // debugging canvas
    c = document.createElement('canvas'),
    context = c.getContext('2d');
  let originalItems, itemsLen;
  c.setAttribute('width', width);
  c.setAttribute('height', height);

  // draw every avoiding marks into canvas
  for (let i = 0; i < m; i++) {
    originalItems = avoidMarks[i];
    itemsLen = originalItems.length;
    if (!itemsLen) continue;

    if (originalItems[0].mark.marktype !== 'group') drawMark(context, originalItems, labelInside);
    else drawGroup(context, originalItems, labelInside);
  }

  return context;
}

/**
 * Write avoid marks from drawn canvas to bitmap
 * @param {object} context canvas context, to which all avoiding marks are drawn
 * @param {number} width width of the chart
 * @param {number} height height of the chart
 * @param {bool} labelInside a flag if label to be placed inside mark or not
 * @param {bool} isGroupArea a flag if the base mark if group area
 * @param {number} padding padding from the boundary of the chart
 *
 * @returns array of 2 bitmaps:
 *          - first bitmap is filled with all the avoiding marks
 *          - second bitmap is filled with borders of all the avoiding marks
 */
function writeToBitMaps(context, width, height, labelInside, isGroupArea, padding) {
  const layer1 = new BitMap(width, height, padding),
    layer2 = labelInside || isGroupArea ? new BitMap(width, height, padding) : undefined,
    imageData = context.getImageData(0, 0, width, height),
    canvasBuffer = new Uint32Array(imageData.data.buffer);
  let x, y, alpha;

  if (isGroupArea) {
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        alpha = canvasBuffer[y * width + x] & ALPHA_MASK;
        // only fill second layer for group area because labels are only not allowed to place over
        // border of area
        if (alpha && alpha ^ INSIDE_OPACITY_IN_ALPHA) layer2.mark(x, y);
      }
    }
  } else {
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        alpha = canvasBuffer[y * width + x] & ALPHA_MASK;
        if (alpha) {
          // fill first layer if there is something in canvas in that location
          layer1.mark(x, y);

          // fill second layer if there is a border in canvas in that location
          // and label can be placed inside
          if (labelInside && alpha ^ INSIDE_OPACITY_IN_ALPHA) layer2.mark(x, y);
        }
      }
    }
  }
  return [layer1, layer2];
}

/**
 * Draw mark into canvas
 * @param {object} context canvas context, to which all avoiding marks are drawn
 * @param {array} originalItems mark to be drawn into canvas
 * @param {bool} labelInside a flag if label to be placed inside mark or not
 */
function drawMark(context, originalItems, labelInside) {
  const n = originalItems.length;
  let items;
  if (labelInside) {
    items = new Array(n);
    for (let i = 0; i < n; i++) {
      items[i] = prepareMarkItem(originalItems[i]);
    }
  } else items = originalItems;

  // draw items into canvas
  Marks[items[0].mark.marktype].draw(context, { items: items }, null);
}

/**
 * draw group of marks into canvas
 * @param {object} context canvas context, to which all avoiding marks are drawn
 * @param {array} groups group of marks to be drawn into canvas
 * @param {bool} labelInside a flag if label to be placed inside mark or not
 */
function drawGroup(context, groups, labelInside) {
  const n = groups.length;
  let marks;
  for (let i = 0; i < n; i++) {
    marks = groups[i].items;
    for (let j = 0; j < marks.length; j++) {
      const g = marks[j];
      if (g.marktype !== 'group') drawMark(context, g.items, labelInside);
      else drawGroup(context, g.items, labelInside); // recursivly draw group of marks
    }
  }
}

/**
 * Prepare item before drawing into canvas (setting stroke and opacity)
 * @param {object} originalItem item to be prepared
 *
 * @returns prepared item
 */
function prepareMarkItem(originalItem) {
  const item = {};
  for (const key in originalItem) {
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
