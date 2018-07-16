import {canvas} from 'vega-canvas';

export default function() {
  var context = canvas().getContext("2d"),
      fontSize,
      rotate,
      points = [],
      label = {};

  label.layout = function() {
    var data = points.map(function(d) {
      var fontSize1 = ~~fontSize(d);
      return {
        fontSize: fontSize1,
        x: d.x,
        y: d.y,
        dx: labelWidth(d.text, fontSize, context),
        dy: fontSize1,
        angle: rotate(d),
        fill: d.fill,
        datum: d
      };
    }).sort(function(a, b) { return b.datum.year - a.datum.year; });

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

  label.rotate = function(_) {
    if (arguments.length) {
      rotate = functor(_);
      return label;
    } else {
      return rotate;
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
      di, dj;

  while (++i < n) {
    di = data[i];
    j = -1;
    while (++j < i) {
      dj = data[j];
      if (isCollision(di, dj, 10) && dj.fill !== 'none') {
        di.fill = 'none';
        break;
      }
    }
    tags.push(di);
  }
  return tags;
}

function labelWidth(text, fontSize, context) {
  context.font = fontSize + "px";
  return context.measureText(text).width;
}

function isCollision(p1, p2, distance) {
  return is1dCollision(p1.y, p1.y + p1.dy, p2.y, p2.y + p2.dy, distance) &&
         is1dCollision(p1.x, p1.x + p1.dx, p2.x, p2.x + p2.dx, distance);
}

function is1dCollision(start1, end1, start2, end2, distance) {
  return (start1 <= end2 && start2 - end1 <= distance) ||
         (start2 <= end1 && start1 - end2 <= distance);
}

function functor(d) {
  return typeof d === "function" ? d : function() { return d; };
}
