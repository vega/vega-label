import {canvas} from 'vega-canvas';

export default function() {
  var context = canvas().getContext("2d"),
      points = [],
      label = {};

  label.layout = function() {
    var data = points.map(function(d) {
      var textWidth = labelWidth(d.text, d.fontSize, d.font, context),
          textHeight = d.fontSize;
      return {
        fontSize: d.fontSize,
        x: d.x,
        y: d.y,
        textWidth: textWidth,
        textHeight: textHeight,
        boundary: getBoundaryFunction(d.x, d.y, textWidth, textHeight),
        fill: d.fill,
        datum: d
      };
    });

    return placeLabel(data);
  };

  label.points = function(_) {
    if (arguments.length) {
      points = _;
      return label;
    } else {
      return points;
    }
  };

  return label;
}
  
function placeLabel(data) {
  var i1, j1, i2, j2,
      n = data.length,
      d1Bound, d2Bound,
      binned,
      meanTextWidth = 0, meanTextHeight = 0,
      binXSize, binYSize,
      startX, endX, startY, endY,
      dx = 1, dy = 1, padding = 0;
  
  data.forEach(function(d) {
    meanTextWidth += d.textWidth;
    meanTextHeight += d.textHeight;
  });
  meanTextWidth /= n;
  meanTextHeight /= n;

  binned = binData(meanTextWidth, meanTextHeight, data);
  binXSize = binned.length;
  binYSize = binXSize ? binned[0].length : 0;

  for (i1 = 0; i1 < binXSize; i1++) {
    for (j1 = 0; j1 < binYSize; j1++) {
      binned[i1][j1].forEach(function(d1) {
        if (d1.fill !== 'none') {
          startX = ~~(i1 - (meanTextWidth / d1.textWidth));
          endX = i1 + Math.ceil(meanTextWidth / d1.textWidth);
          startY = ~~(j1 - (meanTextHeight / d1.textHeight));
          endY = j1 + Math.ceil(meanTextHeight / d1.textHeight);

          startX = startX > 0 ? startX : 0;
          startY = startY > 0 ? startY : 0;
          endX = endX < binXSize ? endX : binXSize - 1;
          endY = endY < binYSize ? endY : binYSize - 1;

          d1Bound = d1.boundary(dx, dy, padding);
          for (i2 = startX; i2 <= endX; i2++) {
            for (j2 = startY; j2 <= endY; j2++) {
              binned[i2][j2].forEach(function(d2) {
                d2Bound = d2.boundary(dx, dy, padding);
                if (d1 !== d2 && d2.fill !== 'none' && isCollision(d1Bound, d2Bound, padding)) {
                  d2.fill = 'none';
                }
              });
            }
          }
          if (d1.x !== d1Bound.xc)
            d1.x = d1Bound.xc;
          if (d1.y !== d1Bound.yc)
            d1.y = d1Bound.yc;
        }
      });
    }
  }

  return data;
}

function binData(binW, binH, data) {
  var maxX = 0, maxY = 0,
      binXSize, binYSize,
      binnedX, binnedY,
      i, j,
      itrX = 0, itrY,
      binned = [],
      n = data.length;
  
  if (!n) return [[[]]];

  for (i = 0; i < n; i++) {
    maxX = maxX > data[i].x ? maxX : data[i].x;
    maxY = maxY > data[i].y ? maxY : data[i].y;
  }

  binXSize = ~~(maxX / binW) + 1;
  binYSize = ~~(maxY / binH) + 1;

  data.sort(function(a, b) { return a.x - b.x; })
  
  for (i = 0; i < binXSize; i++) {
    binnedX = [];
    while (itrX < n && data[itrX].x < (i + 1) * binW) {
      binnedX.push(data[itrX]);
      itrX++;
    }

    binnedX.sort(function(a, b) { return a.y - b.y; });
    binned.push([]);

    itrY = 0;
    for (j = 0; j < binYSize; j++) {
      binnedY = [];
      while (itrY < binnedX.length && binnedX[itrY].y < (j + 1) * binH) {
        binnedY.push(binnedX[itrY]);
        itrY++;
      }
      binned[i].push(binnedY);
    }
  }
  return binned;
}

function getBoundaryFunction (x, y, w, h) {

  return function (dx, dy, padding) {
    var _y = y - (h * dy / 2.0) - (padding * dy),
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

function isCollision (p1, p2, padding) {
  return is1dCollision(p1.y, p1.y2, p2.y, p2.y2, padding) &&
         is1dCollision(p1.x, p1.x2, p2.x, p2.x2, padding);
}

function is1dCollision (start1, end1, start2, end2, padding) {
  return (start1 <= end2 && start2 - end1 <= padding) ||
         (start2 <= end1 && start1 - end2 <= padding);
}
