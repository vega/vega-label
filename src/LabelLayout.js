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
        boundaryFun: getBoundaryFunction(d.x, d.y, textWidth, textHeight),
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
  var i, j,
      n = data.length,
      binnedParticle,
      meanTextWidth = 0, meanTextHeight = 0,
      gridXSize, gridYSize,
      startX, endX, startY, endY,
      dx = 1, dy = 1, padding = 0,
      minTextWidth = Number.MAX_VALUE, minTextHeight = Number.MAX_VALUE;
  
  data.forEach(function(d) {
    meanTextWidth += d.textWidth;
    meanTextHeight += d.textHeight;

    minTextWidth = d.textWidth < minTextWidth ? d.textWidth : minTextWidth;
    minTextHeight = d.textHeight < minTextHeight ? d.textHeight : minTextHeight;
  });
  meanTextWidth /= n;
  meanTextHeight /= n;

  binnedParticle = binParticle(meanTextWidth, meanTextHeight, data);
  gridXSize = binnedParticle.length;
  gridYSize = gridXSize ? binnedParticle[0].length : 0;

  data.forEach(function(d) {
    startX = ~~(d.binCol - (meanTextWidth / d.textWidth));
    endX = d.binCol + Math.ceil(meanTextWidth / d.textWidth);
    startY = ~~(d.binRow - (meanTextHeight / d.textHeight));
    endY = d.binRow + Math.ceil(meanTextHeight / d.textHeight);

    startX = startX > 0 ? startX : 0;
    startY = startY > 0 ? startY : 0;
    endX = endX < gridXSize ? endX : gridXSize - 1;
    endY = endY < gridYSize ? endY : gridYSize - 1;

    d.boundary = d.boundaryFun(dx, dy, padding);
    delete d.boundaryFun;
    d.numCollision = 0;
    for (i = startX; i <= endX; i++) {
      for (j = startY; j <= endY; j++) {
        binnedParticle[i][j].forEach(function(p) {
          d.numCollision += isCollision(d.boundary, p, padding);
        });
      }
    }
    if (d.x !== d.boundary.xc)
      d.x = d.boundary.xc;
    if (d.y !== d.boundary.yc)
      d.y = d.boundary.yc;
  });

  data.sort(function(a, b) {return a.numCollision - b.numCollision});

  data.forEach(function(d) {
    if (outOfBound(d.boundary, gridXSize * meanTextWidth, gridYSize * meanTextHeight) || d.numCollision > 1) {
      d.fill = 'none';
    } else if (d.fill !== 'none') {
      startX = ~~(d.binCol - (meanTextWidth / d.textWidth));
      endX = d.binCol + Math.ceil(meanTextWidth / d.textWidth);
      startY = ~~(d.binRow - (meanTextHeight / d.textHeight));
      endY = d.binRow + Math.ceil(meanTextHeight / d.textHeight);

      startX = startX > 0 ? startX : 0;
      startY = startY > 0 ? startY : 0;
      endX = endX < gridXSize ? endX : gridXSize - 1;
      endY = endY < gridYSize ? endY : gridYSize - 1;

      for (i = startX; i <= endX; i++) {
        for (j = startY; j <= endY; j++) {
          binnedParticle[i][j].forEach(function(p) {
            if (d !== p.datum && isCollision(d.boundary, p, padding)) {
              d.fill = 'none';
            }
          });
        }
      }

      if (d.fill !== 'none') {
        placeParticle(d, binnedParticle, minTextWidth, minTextHeight, meanTextWidth, meanTextHeight);
      }
    }
  });


  return data;
}

function outOfBound(bound, maxX, maxY) {
  return bound.x2 > maxX || bound.y2 > maxY || bound.x < 0 || bound.y < 0;
}

function placeParticle(datum, binned, minW, minH, binW, binH) {
  var i, j,
      bound = datum.boundary,
      particle;
  for (i = bound.x; i <= bound.x2; i = (i + minW > bound.x2 && i !== bound.x2) ? bound.x2 : i + minW) {
    for (j = bound.y; j <= bound.y2; j = (j + minH > bound.y2 && j !== bound.y2) ? bound.y2 : j + minH) {
      particle = createParticle(i, j, false, datum);
      binned[~~(i / binW)][~~(j / binH)].push(particle);
    }
  }
}

function createParticle(_x, _y, _mark, _datum) {
  return {
    x: _x,
    y: _y,
    x2: _x,
    y2: _y,
    mark: _mark,
    datum: _datum,
  };
}

function binParticle(binW, binH, data) {
  var maxX = 0, maxY = 0,
      binXSize, binYSize,
      binnedX, binnedY,
      i, j,
      itrX = 0, itrY,
      binned = [],
      n = data.length,
      particle;
  
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
        particle = createParticle(binnedX[itrY].x, binnedX[itrY].y, true, binnedX[itrY]);
        binnedY.push(particle);
        binnedX.binRow = j;
        binnedX.binCol = i;
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
