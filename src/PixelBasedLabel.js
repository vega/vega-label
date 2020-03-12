/*eslint no-unused-vars: "warn"*/
import { BitMap } from './BitMap';

export function placeLabels(data, size, padding) {
  var width = 0, height = 0,
      bitMaps = {};

  width = size[0];
  height = size[1];

  bitMaps.mark = getMarkBitMap(data, width, height);

  data.forEach(function(d) {
    d.z = 1;
    d.currentPosition = [-1, -1];
    findAvailablePosition(d, bitMaps, padding, function() {
      if (!checkCollision(d.searchBound, bitMaps.mark)) {
        d.labelPlaced = true;
      }
    });

    if (d.labelPlaced) {
      placeLabel(d.searchBound, bitMaps.mark);
    } else {
      d.fill = null;
      d.z = 0;
    }
    d.x = d.boundary.xc;
    d.y = d.boundary.yc;
  });

  return data;
}

function findAvailablePosition(datum, bitMaps, padding, checkAvailability) {
  var i, j,
      searchBound,
      initJ = datum.currentPosition[1];

  datum.labelPlaced = false;
  for (i = datum.currentPosition[0]; i <= 1 && !datum.labelPlaced; i++) {
    for (j = initJ; j <= 1 && !datum.labelPlaced; j++) {
      if (!i && !j) continue;
      datum.boundary = datum.boundaryFun(i, j, padding);
      searchBound = getSearchBound(datum.boundary, bitMaps.mark);

      if (outOfBound(searchBound, bitMaps.mark)) continue;
      
      datum.currentPosition = [i, j];
      datum.searchBound = searchBound;
      checkAvailability();
    }
    initJ = -1;
  }
}

function outOfBound(b, bm) {
  return b.startX < 0 || b.startY < 0 || b.endY >= bm.height || b.endX >= bm.width;
}

function getSearchBound(bound, bm) {
  return {
    startX: bm.bin(bound.x),
    startY: bm.bin(bound.y),
    endX: bm.bin(bound.x2),
    endY: bm.bin(bound.y2),
  };
}

function placeLabel(b, bitMap) {
  bitMap.setAllScaled(b.startX, b.startY, b.endX, b.endY);
}

function checkCollision(b, bitMap) {

  return bitMap.getAllScaled(b.startX, b.startY, b.endX, b.endY);
}

function getMarkBitMap(data, width, height) {
  if (!data.length) return null;
  var bitMap = new BitMap(width, height);

  data.forEach(function(d) {
    bitMap.mark(d.x, d.y);
  });
  
  return bitMap;
}
