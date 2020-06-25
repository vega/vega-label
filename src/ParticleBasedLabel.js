/*eslint no-unused-vars: "warn"*/
import { ArrayMap } from './ArrayMap';
import { getBoundary, labelWidth, POSITIONS, POSITIONS_LEN, considerLabelFactory } from './Common';
import { drawAvoidMarks } from './ProjectionImage';

export function placeLabels(data, size, padding, avoidMarks) {
  var width = 0, height = 0, bin, n = data.length,
      minTextWidth = Number.MAX_SAFE_INTEGER,
      minTextHeight = Number.MAX_SAFE_INTEGER,
      maxTextWidth = Number.MIN_SAFE_INTEGER,
      maxTextHeight = Number.MIN_SAFE_INTEGER;

  width = size[0];
  height = size[1];

  // var before;
  // before = performance.now();
  for (var i = 0; i < n; i++) {
    var d = data[i];
    d.textWidth = labelWidth(d.text, d.fontSize, d.font);
    minTextWidth = d.textWidth < minTextWidth ? d.textWidth : minTextWidth;
    minTextHeight = d.textHeight < minTextHeight ? d.textHeight : minTextHeight;
    maxTextWidth = d.textWidth > maxTextWidth ? d.textWidth : maxTextWidth;
    maxTextHeight = d.textHeight > maxTextHeight ? d.textHeight : maxTextHeight;
  }
  // todo: write marksInfo to bins
  var before = performance.now();
  bin = getMarkBin(data, width, height, maxTextWidth, maxTextHeight, minTextWidth, minTextHeight, avoidMarks);
  var after = (performance.now() - before);
  // bin.write("canvas", width, height);
  // console.log(process);
  // console.log(process.memoryUsage());
  // var k = "strin";
  // console.log(process.memoryUsage());

  data.forEach(considerLabelFactory(bin, padding, findPosition, place));
  // bins.mark.write("canvas-after", width, height);

  return [data, after, bin];
}

function findPosition(datum, bin, padding) {
  var i,
      dx, dy,
      searchBound;

  datum.labelPlaced = false;
  for (i = 0; i < POSITIONS_LEN && !datum.labelPlaced; i++) {
    dx = POSITIONS[i][0];
    dy = POSITIONS[i][1];

    datum.boundary = getBoundary(datum, dx, dy, padding);
    searchBound = bin.getSearchBound(datum.boundary);

    if (bin.outOfBound(datum.boundary)) continue;
    
    datum.currentPosition = [dx, dy];
    datum.searchBound = searchBound;
    if (!bin.checkCollision(datum.boundary, datum.searchBound)) {
      datum.labelPlaced = true;
    }
  }
}

function place(datum, bin) {
  var x, y,
      sx = datum.boundary.x, sy = datum.boundary.y,
      ex = datum.boundary.x2, ey = datum.boundary.y2;
  
  var minTextWidth = bin.minTextWidth;
  var minTextHeight = bin.minTextHeight;
  
  for (x = sx; x < ex; x += minTextWidth) {
    for (y = sy; y < ey; y += minTextHeight) {
      bin.add(x, y);
    }
  }

  for (x = sx; x < ex; x += minTextWidth) {
    bin.add(x, ey);
  }

  for (y = sy; y < ey; y += minTextHeight) {
    bin.add(ex, y);
  }

  bin.add(ex, ey);
}

function getMarkBin(data, width, height, maxTextWidth, maxTextHeight, minTextWidth, minTextHeight, avoidMarks) {
  if (!data.length) return null;
  var bin = new ArrayMap(width, height, maxTextWidth, maxTextHeight, minTextWidth, minTextHeight);
  var marksInfo = drawAvoidMarks(avoidMarks, width, height);

  var buffer = new Uint32Array(
    marksInfo.getImageData(0, 0, width, height).data.buffer
  );

  var x, y;
  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      if (buffer[y * width + x]) {
        bin.add(x + 0.5, y + 0.5);
      }
    }
  }

  return bin;
}
