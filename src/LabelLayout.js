/*eslint no-unused-vars: "warn"*/
import { canvas } from 'vega-canvas';
import { HeatMap } from './HeatMap';

export default function() {
  var context = canvas().getContext("2d"),
      markData = [],
      size,
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

    return placeLabels(data, size);
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

  return label;
}
  
function placeLabels(data, size) {
  var heatMap,
      sumTextWidth = 0.0,
      sortBinSize,
      width = 0, height = 0;

  data.forEach(function(d) {
    sumTextWidth += d.textWidth;
    width = Math.max(width, d.x + d.textWidth);
    height = Math.max(height, d.y + d.textHeight);
  });
  sortBinSize = sumTextWidth / data.length;
  data.sort(function(a, b) {
    if (-sortBinSize <= a.x - b.x && a.x - b.x <= sortBinSize &&
        -sortBinSize <= a.y - b.y && a.y - b.y <= sortBinSize) {
      return a.y - b.y;
    }
    return a.x - b.x;
  });

  if (size) {
    width = size[0];
    height = size[1];
  }
  heatMap = getHeatMap(data, width, height);

  data.forEach(function(d) {
    heatMap.add(d.x, d.y, -1);
    d.currentPosition = [-1, -1];
    findAvailablePosition(d, heatMap);

    if (!heatMap.get(d.x, d.y)) {
      heatMap.add(d.x, d.y, 1);
    }
  });

  data.forEach(function(d) {
    if (d.labelPlaced) {
      if (!placeLabel(d.searchBound, heatMap, 0)) {
        placeLabel(d.searchBound, heatMap, 1);
      } else {
        findAvailablePosition(d, heatMap);

        if (d.labelPlaced) {
          placeLabel(d.searchBound, heatMap, 1);
        } else {
          d.fill = 'none';
        }
      }
    } else {
      d.fill = 'none';
    }
    d.x = d.boundary.xc;
    d.y = d.boundary.yc;
  });

  return data;
}

function findAvailablePosition(datum, heatMap) {
  var i, j,
      searchBound,
      PADDING = 2;

  datum.labelPlaced = false;
  for (i = datum.currentPosition[0]; i <= 1 && !datum.labelPlaced; i++) {
    for (j = datum.currentPosition[1]; j <= 1 && !datum.labelPlaced; j++) {
      if (!i && !j) continue;
      datum.boundary = datum.boundaryFun(j, i, PADDING);
      searchBound = getSearchBound(datum.boundary, heatMap);

      if (searchBound.startX < 0 || searchBound.startY < 0 || 
        searchBound.endY >= heatMap.height || searchBound.endX >= heatMap.width) {
        continue;
      }
      
      datum.currentPosition = [i, j];
      datum.searchBound = searchBound;
      datum.labelPlaced = !placeLabel(searchBound, heatMap, 0);
    }
  }
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
  
  for (x = b.startX; x <= b.endX; x++) {
    for (y = b.startY; y <= b.endY; y++) {
      count += heatMap.getBinned(x, y);
      heatMap.addBinned(x, y, addVal);
    }
  }
  return count;
}

function getHeatMap(data, width, height, pixelSize) {
  if (!data.length) return null;
  var heatMap = new HeatMap(width, height, pixelSize);

  data.forEach(function(d) {
    heatMap.add(d.x, d.y, 1);
  });
  
  return heatMap;
}

function getBoundaryFunction(x, y, w, h) {

  return function (dx, dy, padding) {
    var _y = y + (h * dy / 2.0) + (padding * dy),
        _x = x + (w * dx / 2.0) + (padding * dx);
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
  return context.measureText(text).width;
}