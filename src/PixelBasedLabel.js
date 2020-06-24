/*eslint no-unused-vars: "warn"*/
import { BitMap } from './BitMap';
import { getBoundary, labelWidth, POSITIONS_LEN, POSITIONS, considerLabelFactory } from './Common';
import { drawAvoidMarks } from './ProjectionImage';

export function placeLabels(data, size, padding, avoidMarks) {
  var width = 0, height = 0,
      bitMap, n = data.length,
      minTextHeight = -1;

  width = size[0];
  height = size[1];

  // var before;
  // before = performance.now();
  for (var i = 0; i < n; i++) {
    minTextHeight = data[i].textHeight < minTextHeight ? data[i].textHeight : minTextHeight;
  }
  var before = performance.now();
  bitMap = getMarkBitMap(data, width, height, avoidMarks, minTextHeight);
  var after = (performance.now() - before);
  // bitMaps.mark.write("canvas", width, height);

  data.forEach(considerLabelFactory(bitMap, padding, findPosition, place));
  // console.log(performance.now() - before);
  // bitMap.write("canvas", width, height);

  return [data, after, bitMap];
}

function findPosition(datum, bitMap, padding) {
  var i,
      dx, dy,
      searchBound;

  datum.labelPlaced = false;
  datum.textWidth = 1;
  var textWidthCalculated = false;
  for (i = 0; i < POSITIONS_LEN && !datum.labelPlaced; i++) {
    dx = POSITIONS[i][0];
    dy = POSITIONS[i][1];
    if (!textWidthCalculated) {
      datum.boundary = getBoundary(datum, dx, dy, padding);
      searchBound = getSearchBound(datum.boundary);
      if (checkCollision(searchBound, bitMap)) {
        continue;
      } else {
        textWidthCalculated = true;
        datum.textWidth = labelWidth(datum.text, datum.fontSize, datum.font);
      }
    }

    datum.boundary = getBoundary(datum, dx, dy, padding);
    searchBound = getSearchBound(datum.boundary);

    if (outOfBound(searchBound, bitMap)) continue;

    datum.currentPosition = [dx, dy];
    datum.searchBound = searchBound;
    if (!checkCollision(datum.searchBound, bitMap)) {
      datum.labelPlaced = true;
    }
  }
}

function outOfBound(b, bm) {
  return b.startX < 0 || b.startY < 0 || b.endY >= bm.height || b.endX >= bm.width;
}

function getSearchBound(bound) {
  return {
    startX: ~~bound.x,
    startY: ~~bound.y,
    endX: ~~bound.x2,
    endY: ~~bound.y2,
  };
}

function place(datum, bitMap) {
  bitMap.setAllScaled(datum.searchBound.startX, datum.searchBound.startY, datum.searchBound.endX, datum.searchBound.endY);
}

function checkCollision(b, bitMap) {
  return bitMap.getAllScaled(b.startX, b.startY, b.endX, b.endY);
}

function getMarkBitMap(data, width, height, avoidMarks, minTextHeight) {
  if (!data.length) return null;
  var bitMap = new BitMap(width, height, minTextHeight);
  var i, len;

  var buffer = new Uint32Array(
    drawAvoidMarks(avoidMarks, width, height).getImageData(0, 0, width, height).data.buffer
  );

  var from = 0;
  len = buffer.length;
  for (i = 0; i < len; i++) {
    if (!buffer[i]) {
      if (from !== i) {
        bitMap.setRange(from, i - 1);
      }
      from = i + 1;
    }
  }
  if (from !== len) {
    bitMap.setRange(from, len - 1);
  }

  return bitMap;
}
