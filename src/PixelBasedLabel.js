/*eslint no-unused-vars: "warn"*/
import { BitMap } from './BitMap';
import { getBoundary, labelWidth } from './Common';

export function placeLabels(data, size, padding, avoidMarksCtx) {
  var width = 0, height = 0,
      bitMaps = {};

  width = size[0];
  height = size[1];

  // var before;
  // before = performance.now();
  bitMaps.mark = getMarkBitMap(data, width, height, avoidMarksCtx);

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
  // console.log(performance.now() - before);

  return data;
}

function findAvailablePosition(datum, bitMaps, padding, checkAvailability) {
  var i, j,
      searchBound,
      initJ = datum.currentPosition[1];

  datum.labelPlaced = false;
  datum.textWidth = 1;
  var textWidthCalculated = false;
  for (i = datum.currentPosition[0]; i <= 1 && !datum.labelPlaced; i++) {
    for (j = initJ; j <= 1 && !datum.labelPlaced; j++) {
      if (!i && !j) continue;
      if (!textWidthCalculated) {
        datum.boundary = getBoundary(datum, i, j, padding);
        searchBound = getSearchBound(datum.boundary);
        if (checkCollision(searchBound, bitMaps.mark)) {
          continue;
        } else {
          textWidthCalculated = true;
          datum.textWidth = labelWidth(datum.datum.text, datum.datum.fontSize, datum.datum.font);
        }
      }

      datum.boundary = getBoundary(datum, i, j, padding);
      searchBound = getSearchBound(datum.boundary);

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

function getSearchBound(bound) {
  return {
    startX: ~~bound.x,
    startY: ~~bound.y,
    endX: ~~bound.x2,
    endY: ~~bound.y2,
  };
}

function placeLabel(b, bitMap) {
  bitMap.setAllScaled(b.startX, b.startY, b.endX, b.endY);
}

function checkCollision(b, bitMap) {
  return bitMap.getAllScaled(b.startX, b.startY, b.endX, b.endY);
}

function getMarkBitMap(data, width, height, avoidMarksCtx) {
  if (!data.length) return null;
  var bitMap = new BitMap(width, height);

  data.forEach(function(d) {
    bitMap.mark(d.x, d.y);
  });

  var buffer = new Uint32Array(
    avoidMarksCtx.getImageData(0, 0, width, height).data.buffer
  );

  var x, y, x_, pixelSize_, pixelSize = bitMap.pixelSize;
  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x += pixelSize) {
      if (!bitMap.get(x, y)) {
        pixelSize_ = (pixelSize < width - x) ? pixelSize : width - x;
        for (x_ = 0; x_ < pixelSize_; x_++) {
          if (buffer[y * width + (x + x_)]) {
            bitMap.mark(x + x_, y);
            break;
          }
        }
      }
    }
  }
  
  return bitMap;
}
