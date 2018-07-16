/*eslint no-unused-vars: "warn"*/
import { canvas } from 'vega-canvas';
import { BitMap } from './BitMap';

export default function() {
  var context = canvas().getContext("2d"),
      markData = [],
      size,
      padding = 3,
      label = {};

  label.layout = function() {
    var data = markData.map(function(d) {
      var textWidth = labelWidth(d.text, d.fontSize, d.font, context),
          textHeight = d.fontSize;
      return {
        fontSize: d.fontSize,
        x: d.x,
        y: d.y,
        textWidth: textWidth,
        textHeight: textHeight,
        boundaryFun: getBoundaryFunction(d.x, d.y, textWidth, textHeight),
        fill: d.fill,
        datum: d
      };
    });

    return placeLabels(data, size, padding);
  };

  label.markData = function(_) {
    if (arguments.length) {
      markData = _;
      return label;
    } else {
      return markData;
    }
  };

  label.size = function(_) {
    if (arguments.length) {
      size = _ ? [+_[0], +_[1]] : undefined;
      return label;
    } else {
      return size;
    }
  };

  label.padding = function(_) {
    if (arguments.length) {
      padding = _ ? _ : 3;
      return label;
    } else {
      return padding;
    }
  }

  return label;
}
  
function placeLabels(data, size, padding) {
  var textWidth, textHeight,
      width = 0, height = 0,
      bitMaps = {};

  data.sort(function(a, b) {
    textWidth = a.textWidth > b.textWidth ? a.textWidth : b.textWidth;
    textHeight = a.textHeight + b.textHeight;
    if (-textWidth <= a.x - b.x && a.x - b.x <= textWidth &&
        -textHeight <= a.y - b.y && a.y - b.y <= textHeight) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  if (size) {
    data.forEach(function(d) {
      width = Math.max(width, d.x + d.textWidth);
      height = Math.max(height, d.y + d.textHeight);
    });
    width = size[0];
    height = size[1];
  }
  bitMaps.mark = getMarkBitMap(data, width, height);
  bitMaps.label = new BitMap(width, height);

  data.forEach(function(d) {
    bitMaps.mark.unmark(d.x, d.y);
    d.currentPosition = [-1, -1];
    findAvailablePosition(d, bitMaps, padding, function() {
      if (!checkCollision(d.searchBound, bitMaps.mark)) {
        d.labelPlaced = true;
      }
    });
    bitMaps.mark.mark(d.x, d.y);
  });
  data.forEach(function(d) {
    d.z = 1;
    if (d.labelPlaced) {
        findAvailablePosition(d, bitMaps, padding, function() {
          d.extendedSearchBound = getExtendedSearchBound(d, bitMaps.mark);
          if (!checkCollision(d.extendedSearchBound, bitMaps.mark) && !checkCollision(d.searchBound, bitMaps.label)) {
            d.labelPlaced = true;
          }
        });

        if (d.labelPlaced) {
          placeLabel(d.searchBound, bitMaps.label);
        } else {
          d.fill = 'none';
          d.z = 0;
        }
    } else {
      d.fill = 'none';
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

      if (searchBound.startX < 0 || searchBound.startY < 0 || 
        searchBound.endY >= bitMaps.mark.height || searchBound.endX >= bitMaps.mark.width) {
        continue;
      }
      
      datum.currentPosition = [i, j];
      datum.searchBound = searchBound;
      checkAvailability();
    }
    initJ = -1;
  }
}

function getExtendedSearchBound(d, bm) {
  var bound = d.boundary,
      w = d.textWidth * d.currentPosition[0],
      h = d.textHeight * d.currentPosition[1];
    
  return {
    startX: bm.bin(bound.x + (w < 0 ? w : 0)),
    startY: bm.bin(bound.y + (h < 0 ? h : 0)),
    endX: bm.bin(bound.x2 + (w > 0 ? w : 0)),
    endY: bm.bin(bound.y2 + (h > 0 ? h : 0)),
  };
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
  var x, y;
  b.startX = b.startX > 0 ? b.startX : 0;
  b.startY = b.startY > 0 ? b.startY : 0;
  b.endX = b.endX < bitMap.width ? b.endX : bitMap.width;
  b.endY = b.endY < bitMap.height ? b.endY : BitMap.height;
  
  for (x = b.startX; x <= b.endX; x++) {
    for (y = b.startY; y <= b.endY; y++) {
      bitMap.markBinned(x, y);
    }
  }
}

function checkCollision(b, bitMap) {
  var x, y;
  b.startX = b.startX > 0 ? b.startX : 0;
  b.startY = b.startY > 0 ? b.startY : 0;
  b.endX = b.endX < bitMap.width ? b.endX : bitMap.width;
  b.endY = b.endY < bitMap.height ? b.endY : BitMap.height;

  for (x = b.startX; x <= b.endX; x++) {
    for (y = b.startY; y <= b.endY; y++) {
      if (bitMap.getBinned(x, y)) {
        return true;
      }
    }
  }
  
  return false;
}

function getMarkBitMap(data, width, height) {
  if (!data.length) return null;
  var bitMap = new BitMap(width, height);

  data.forEach(function(d) {
    bitMap.mark(d.x, d.y);
  });
  
  return bitMap;
}

function getBoundaryFunction(x, y, w, h) {

  return function (dx, dy, padding) {
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
  };
}

function labelWidth (text, fontSize, font, context) {
  context.font = fontSize + "px " + font;
  return context.measureText(text + ".").width;
}