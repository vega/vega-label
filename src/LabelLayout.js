import {canvas} from 'vega-canvas';

export default function() {
  var context = canvas().getContext("2d"),
      fontSize,
      points = [],
      label = {};

  label.layout = function() {
    var data = points.map(function(d) {
      var _fontSize = ~~fontSize(d),
          textWidth = labelWidth(d.text, _fontSize, d.font, context);
      return {
        fontSize: _fontSize,
        x: d.x,
        y: d.y,
        textWidth: textWidth,
        boundary: calculateBoundary(d.x, d.y, textWidth, _fontSize * 0.7),
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
  var tags = [],
      i = -1, j,
      n = data.length,
      di, dj,
      diBoundary, djBoundary;

  while (++i < n) {
    di = data[i];
    di.numCollision = 0;
    j = -1;
    while (++j < i) {
      di.numCollision += isCollision(di, data[j], 10);
    }
  }

  data.sort(function(a, b) { return a.numCollision - b.numCollision; })

  var dx = 1, dy = -1, padding = 2;
  var count = n;
  i = -1;
  while (++i < n) {
    di = data[i];
    diBoundary = di.boundary(dx, dy, padding);
    j = -1;
    while (++j < i) {
      dj = data[j];
      djBoundary = dj.boundary(dx, dy, padding);
      if (isCollision(diBoundary, djBoundary, padding) && dj.fill !== 'none') {
        di.fill = 'none';
        count--;
        break;
      }
    }
    di.x = count;
    di.x = diBoundary.x;
    di.y = diBoundary.y;
    tags.push(di);
  }
  return tags;
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
