export default function() {
  var fontSize,
      rotate,
      points = [],
      label = {};

  label.layout = function() {
    var data = points.map(function(d) {
      return {
        size: ~~fontSize(d),
        x: d.x,
        y: d.y,
        dx: labelSize(d.text, ~~fontSize(d))[0],
        dy: labelSize(d.text, ~~fontSize(d))[1],
        angle: rotate(d),
        fill: d.fill,
        datum: d
      };
    }).sort(function(a, b) { return b.size - a.size; });

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
      if (distance(di, dj) < 30 && dj.fill !== 'none') {
        di.fill = 'none';
        break;
      }
    }
    tags.push(di);
  }
  return tags;
}

function distance (a, b) {
  var dx = a.x - b.x,
      dy = a.y - b.y;
  return Math.sqrt((dx * dx) + (dy * dy));
}

function labelSize(text, fontSize) {
  // TODO: Calculate dx and dy of a label given text and fontSize.
  return [text, fontSize]
}

function functor(d) {
  return typeof d === "function" ? d : function() { return d; };
}
