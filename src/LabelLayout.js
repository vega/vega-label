import {canvas} from 'vega-canvas';

export default function() {
  var context = canvas().getContext("2d"),
      fontSize,
      points = [],
      label = {};

  label.layout = function() {
    var data = points.map(function(d) {
      var _fontSize = ~~fontSize(d),
          textWidth = labelWidth(d.text, _fontSize, d.font, context),
          textHeight = _fontSize * 0.7;
      return {
        fontSize: _fontSize,
        x: d.x,
        y: d.y,
        textWidth: textWidth,
        textHeight: textHeight,
        boundary: calculateBoundary(d.x, d.y, textWidth, textHeight),
        fill: d.fill,
        datum: d
      };
    }).sort(function(a, b) { return a.x - b.x; });

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

  label.fontSize = function(_) {
    if (arguments.length) {
      fontSize = functor(_);
      return label;
    } else {
      return fontSize;
    }
  };

  return label;
}
  
function placeLabel(data) {
  var //tags = [],
      i = -1, j,
      i1,
      j1,
      n = data.length,
      d1Boundary, d2Boundary,
      d1, d2,
      binned,
      meanTextWidth = 0, meanTextHeight = 0,
      binXSize,
      binYSize,
      startX, endX,
      startY, endY,
      dx = 1, dy = -1, padding = 0;
  
  while (++i < n) {
    meanTextWidth += data[i].textWidth;
    meanTextHeight += data[i].textHeight;
  }
  meanTextWidth /= n;
  meanTextHeight /= n;

  binned = binData(meanTextWidth, meanTextHeight, data);
  binXSize = binned.length;
  var sum = 0;
  for (i = 0; i < binXSize; i++) {
    for (j = 0; j < binned[i].length; j++) {
      sum += binned[i][j].length;
    }
  }


  var datum1 = sum, datum2;
  i = -1;
  while (++i < binXSize) {
    j = -1;
    binYSize = binned[i].length;
    while (++j < binYSize) {
      for (d1 in binned[i][j]) {
        datum1 = binned[i][j][d1];
        if (datum1.fill === 'none') continue;
        startX = ~~(i - (meanTextWidth / datum1.textWidth));
        endX = i + Math.ceil(meanTextWidth / datum1.textWidth);

        startY = ~~(j - (meanTextHeight / datum1.textHeight));
        endY = j + Math.ceil(meanTextHeight / datum1.textHeight);

        startX = startX > 0 ? startX : 0;
        startY = startY > 0 ? startY : 0;

        endX = endX < binXSize ? endX : binXSize - 1;
        endY = endY < binYSize ? endY : binYSize - 1;
        datum1.numCollision = 0;
        d1Boundary = datum1.boundary(dx, dy, padding);
        for (i1 = startX; i1 <= endX; i1++) {
          for (j1 = startY; j1 <= endY; j1++) {
            for (d2 in binned[i1][j1]) {
              datum2 = binned[i1][j1][d2]; // fix this
              d2Boundary = datum2.boundary(dx, dy, padding);
              if (datum1 !== datum2 && datum2.fill !== 'none' && isCollision(d1Boundary, d2Boundary, padding)) {
                datum2.fill = 'none';
                sum--;
              }
            }
          }
        }
        datum1.x = d1Boundary.x;
        datum1.y = d1Boundary.y;
        //tags.push(datum1);
      }
    }
  }

  // i = -1;
  // while (++i < n) {
  //   d1 = data[i];
  //   d1.numCollision = 0;
  //   j = -1;
  //   while (++j < i) {
  //     d1.numCollision += isCollision(d1, data[j], 10);
  //   }
  // }

  // data.sort(function(a, b) { return a.numCollision - b.numCollision; })

  // var count = n;
  // i = -1;
  // while (++i < n) {
  //   d1 = data[i];
  //   d1Boundary = d1.boundary(dx, dy, padding);
  //   j = -1;
  //   while (++j < i) {
  //     d2 = data[j];
  //     d2Boundary = d2.boundary(dx, dy, padding);
  //     if (isCollision(d1Boundary, d2Boundary, padding) && d2.fill !== 'none') {
  //       d1.fill = 'none';
  //       count--;
  //       break;
  //     }
  //   }
  //   d1.x = count;
  //   d1.x = d1Boundary.x;
  //   d1.y = d1Boundary.y;
  //   tags.push(d1);
  // }
  return data;
}

function binData(binW, binH, data) {
  var binXSize = ~~(data[0].datum.mark.group.width / binW) + 1,
      binYSize = ~~(data[0].datum.mark.group.height / binH) + 1,
      binnedX, binnedY,
      i, j,
      itrX = 0, itrY,
      binned = [];
  
  for (i = 0; i < binXSize; i++) {
    binnedX = [];
    for (; itrX < data.length && data[itrX].x < (i + 1) * binW; itrX++) {
      binnedX.push(data[itrX]);
    }
    binnedX.sort(function(a, b) { return a.y - b.y; });

    binned.push([]);
    itrY = 0;
    for (j = 0; j < binYSize; j++) {
      binnedY = [];
      for (; itrY < binnedX.length && binnedX[itrY].y < (j + 1) * binH; itrY++) {
        binnedY.push(binnedX[itrY]);
      }
      binned[i].push(binnedY);
    }
  }
  return binned;
}

function calculateBoundary (x, y, w, h) {

  return function (dx, dy, padding) {
    var _y = y - (h * dx / 2.0) - (padding * dx),
        _x = x - (w * dy / 2.0) - (padding * dy);
    return {
      y: _y,
      y2: _y + h,
      x: _x,
      x2: _x + w,
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

function functor (d) {
  return typeof d === "function" ? d : function() { return d; };
}
