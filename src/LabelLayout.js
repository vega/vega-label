/*eslint no-unused-vars: "warn"*/
import { canvas } from 'vega-canvas';
import { HeatMap } from './HeatMap';

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
  var heatMap,
      textWidth, textHeight,
      width = 0, height = 0;

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
  heatMap = getHeatMap(data, width, height);

  data.forEach(function(d) {
    heatMap.add(d.x, d.y, -1);
    d.currentPosition = [-1, -1];
    findAvailablePosition(d, heatMap, padding);

    if (heatMap.get(d.x, d.y) <= 0) {
      heatMap.add(d.x, d.y, 1);
    }
  });
  data.forEach(function(d) {
    d.z = 1;
    if (d.labelPlaced) {
      if (!placeLabel(d.searchBound, heatMap, 0)) {
        placeLabel(d.searchBound, heatMap, 1);
      } else {
        findAvailablePosition(d, heatMap, padding);

        if (d.labelPlaced) {
          placeLabel(d.searchBound, heatMap, 1);
        } else {
          d.fill = 'none';
          d.z = 0;
        }
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

function findAvailablePosition(datum, heatMap, padding) {
  var i, j,
      searchBound,
      initJ = datum.currentPosition[1];

  datum.labelPlaced = false;
  for (i = datum.currentPosition[0]; i <= 1 && !datum.labelPlaced; i++) {
    for (j = initJ; j <= 1 && !datum.labelPlaced; j++) {
      if (!i && !j) continue;
      datum.boundary = datum.boundaryFun(i, j, padding);
      searchBound = getSearchBound(datum.boundary, heatMap);

      if (searchBound.startX < 0 || searchBound.startY < 0 || 
        searchBound.endY >= heatMap.height || searchBound.endX >= heatMap.width) {
        continue;
      }
      
      datum.currentPosition = [i, j];
      datum.searchBound = searchBound;

      if (placeLabel(searchBound, heatMap, 0) <= 0) {
        datum.labelPlaced = true;
      }
    }
    initJ = -1;
  }
}

function findAvailableExtendedPosition(datum, heatMaps, padding) {
  var i, j,
      searchBound,
      initJ = datum.currentPosition[1];

  datum.labelPlaced = false;
  for (i = datum.currentPosition[0]; i <= 1 && !datum.labelPlaced; i++) {
    for (j = initJ; j <= 1 && !datum.labelPlaced; j++) {
      if (!i && !j) continue;
      datum.boundary = datum.boundaryFun(i, j, padding);
      searchBound = getSearchBound(datum.boundary, heatMaps.mark);

      if (searchBound.startX < 0 || searchBound.startY < 0 || 
        searchBound.endY >= heatMaps.mark.height || searchBound.endX >= heatMaps.mark.width) {
        continue;
      }
      
      datum.currentPosition = [i, j];
      datum.searchBound = searchBound;
      datum.extendedSearchBound = getExtendedSearchBound(datum, heatMaps.mark);
      if (placeLabel(datum.extendedSearchBound, heatMaps.mark, 0) <= 0 && placeLabel(datum.searchBound, heatMaps.label, 0) <= 0) {
        datum.labelPlaced = true;
      }
    }
    initJ = -1;
  }
}

function getExtendedSearchBound(d, heatMap) {
  var bound = d.boundary,
      w = d.textWidth * d.currentPosition[0],
      h = d.textHeight * d.currentPosition[1];
    
  return {
    startX: heatMap.bin(bound.x + (w < 0 ? w : 0)),
    startY: heatMap.bin(bound.y + (h < 0 ? h : 0)),
    endX: heatMap.bin(bound.x2 + (w > 0 ? w : 0)),
    endY: heatMap.bin(bound.y2 + (h > 0 ? h : 0)),
  };
}

function getSearchBound(bound, heatMap) {
  return {
    startX: heatMap.bin(bound.x),
    startY: heatMap.bin(bound.y),
    endX: heatMap.bin(bound.x2),
    endY: heatMap.bin(bound.y2),
  };
}

function placeLabel(b, heatMap, addVal) {
  var x, y, count = 0;
  b.startX = b.startX > 0 ? b.startX : 0;
  b.startY = b.startY > 0 ? b.startY : 0;
  b.endX = b.endX < heatMap.width ? b.endX : heatMap.width;
  b.endY = b.endY < heatMap.height ? b.endY : heatMap.height;
  
  for (x = b.startX; x <= b.endX; x++) {
    for (y = b.startY; y <= b.endY; y++) {
      count += heatMap.getBinned(x, y);
      heatMap.addBinned(x, y, addVal);
    }
  }
  return count;
}

function getHeatMap(data, width, height) {
  if (!data.length) return null;
  var heatMap = new HeatMap(width, height);

  data.forEach(function(d) {
    heatMap.add(d.x, d.y, 1);
  });
  
  return heatMap;
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