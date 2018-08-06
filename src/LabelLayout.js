/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
import { canvas } from 'vega-canvas';
import placeLabelsPixel from './PixelBasedLabel';

var TOP = 0x0,
    MIDDLE = 0x1 << 0x2,
    BOTTOM = 0x2 << 0x2,
    LEFT = 0x0,
    CENTER = 0x1,
    RIGHT = 0x2,
    INNER = 0x1 << 0x4;

var SIZE_FACTOR = 0.707106781186548;

var anchorsMap = {
  'top-left': TOP + LEFT,
  'top': TOP + CENTER,
  'top-right': TOP + RIGHT,
  'left': MIDDLE + LEFT,
  'middle': MIDDLE + CENTER,
  'right': MIDDLE + RIGHT,
  'bottom-left': BOTTOM + LEFT,
  'bottom': BOTTOM + CENTER,
  'bottom-right': BOTTOM + RIGHT,
};

export default function() {
  var context = canvas().getContext("2d"),
      texts = [],
      size,
      offsets,
      sort,
      anchors,
      marks,
      fill,
      stroke,
      label = {};

  label.layout = function() {
    var n = texts.length,
        d, data = Array(n),
        marktype = n && texts[0].datum && texts[0].datum.mark ? texts[0].datum.mark.marktype : undefined,
        transformed = n ? texts[0].originalFillAndStroke : false;

    var i, textWidth, textHeight, mb;
    for (i = 0; i < n; i++) {
      d = texts[i];
      textWidth = labelWidth(d.text, d.fontSize, d.font, context);
      textHeight = d.fontSize;

      mb = marktype && marktype !== 'line' ? d.datum.bounds : {
        x1: d.x,
        x2: d.x,
        y1: d.y,
        y2: d.y
      };

      data[i] = {
        fontSize: d.fontSize,
        textWidth: textWidth,
        textHeight: textHeight,
        boundFun: getBoundFunction([mb.x1, (mb.x1 + mb.x2) / 2.0, mb.x2, mb.y1, (mb.y1 + mb.y2) / 2.0, mb.y2], textWidth, textHeight),
        sort: sort ? sort(d.datum) : undefined,
        markBound: mb,
        anchors: { x2: d.x, y2: d.y },
        originalFillAndStroke: transformed ? d.originalFillAndStroke : {
          fill: d.fill,
          stroke: d.stroke
        },
        datum: d
      };
    }

    if (sort) data.sort(function(a, b) { return a.sort - b.sort; });

    return placeLabelsPixel(data, size, anchors, marktype, marks, offsets);
  };

  label.texts = function(_) {
    if (arguments.length) {
      texts = _;
      return label;
    } else {
      return texts;
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

  label.offsets = function(_) {
    if (arguments.length) {
      offsets = _;
      return label;
    } else {
      return offsets;
    }
  }

  label.sort = function(_) {
    if (arguments.length) {
      sort = _;
      return label;
    } else {
      return sort;
    }
  }

  label.anchors = function(_) {
    if (arguments.length) {
      var n = _.length, i, directions;
      anchors = new Int8Array(n).fill(0x0);
      for (i = 0; i < n; i++) {
        directions = _[i].split('-');
        if (directions[0] === 'inner') {
          anchors[i] = INNER;
          directions.splice(0, 1);
        }
        anchors[i] |= anchorsMap[directions.join('-')];
      }
      return label;
    } else {
      return anchors;
    }
  }

  label.marks = function(_) {
    if (arguments.length) {
      marks = _;
      return label;
    } else {
      return sort;
    }
  }

  label.fill = function(_) {
    if (arguments.length) {
      fill = functor(_);
      return label;
    } else {
      return fill;
    }
  }

  label.stroke = function(_) {
    if (arguments.length) {
      stroke = functor(_);
      return label;
    } else {
      return stroke;
    }
  }

  return label;
}

function getBoundFunction(b, w, h) {
  return function (dx, dy, inner, offset) {
    var sizeFactor = (dx && dy) ? SIZE_FACTOR : 1,
        _inner = inner ? -1 : 1,
        _y = b[4 + dy] + (_inner * h * dy / 2.0) + (offset * dy * _inner * sizeFactor),
        _x = b[1 + dx] + (_inner * w * dx / 2.0) + (offset * dx * _inner * sizeFactor);
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
  context.font = fontSize + "px " + font; // add other font properties
  return context.measureText(text).width;
}

function functor(d) {
  return typeof d === "function" ? d : function() { return d; };
}