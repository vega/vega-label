/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
import { canvas } from 'vega-canvas';
import placeLabelsPixel from './PixelBasedLabel';
import { tupleid } from 'vega-dataflow';

var TOP = 0x0,
    MIDDLE = 0x1 << 0x2,
    BOTTOM = 0x2 << 0x2,
    LEFT = 0x0,
    CENTER = 0x1,
    RIGHT = 0x2,
    INNER = 0x1 << 0x4;

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
      offset,
      sort,
      anchors,
      marks,
      label = {};

  label.layout = function() {
    var n = texts.length,
        d, data = Array(n),
        marktype = n && texts[0].datum && texts[0].datum.mark ? texts[0].datum.mark.marktype : undefined;
    
    marktype = marks.length && marks[0].length && marks[0][0].mark ? marks[0][0].mark.marktype : undefined;

    var i, textWidth, textHeight, id;
    for (i = 0; i < n; i++) {
      d = texts[i];
      textWidth = labelWidth(d.text, d.fontSize, d.font, context);
      textHeight = d.fontSize;

      if (marktype && marktype !== 'line') {
        id = d;
        while (id.datum) {
          id = id.datum;
        }
        id = tupleid(id);
      }

      data[i] = {
        fontSize: d.fontSize,
        textWidth: textWidth,
        textHeight: textHeight,
        // boundFun: getBoundFunction([mb.x1, (mb.x1 + mb.x2) / 2.0, mb.x2, mb.y1, (mb.y1 + mb.y2) / 2.0, mb.y2], textWidth, textHeight, offset),
        fill: d.fill,
        sort: sort ? sort(d.datum) : undefined,
        markBound: {
          x1: d.x,
          x2: d.x,
          y1: d.y,
          y2: d.y
        },
        id: id,
        anchors: { x: d.x, y: d.y },
        datum: d
      };
    }

    if (marktype && marktype !== 'line') {
      var mark0 = marks[0],
          m = mark0.length,
          markBounds = {}, mb;
      for (i = 0; i < m; i++) {
        id = mark0[i];
        while (id.datum) {
          id = id.datum;
        }
        markBounds[tupleid(id)] = mark0[i].bounds;
      }

      for (i = 0; i < n; i++) {
        d = data[i];
        id = d.id;
        if (markBounds[id]) {
          d.markBound = markBounds[id];
        }
        mb = d.markBound;
        d.boundFun = getBoundFunction([mb.x1, (mb.x1 + mb.x2) / 2.0, mb.x2, mb.y1, (mb.y1 + mb.y2) / 2.0, mb.y2], d.textWidth, d.textHeight, offset);
      }
    }

    if (sort) data.sort(function(a, b) { return a.sort - b.sort; });

    return placeLabelsPixel(data, size, anchors, marks);
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

  label.offset = function(_) {
    if (arguments.length) {
      offset = _;
      return label;
    } else {
      return offset;
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
      marks = _ ? _ : [];
      return label;
    } else {
      return sort;
    }
  }

  return label;
}

function getBoundFunction(b, w, h, offset) {
  return function (dx, dy, inner) {
    var _inner = inner ? -1 : 1,
        _y = b[4 + dy] + (_inner * h * dy / 2.0) + (offset * dy * _inner),
        _x = b[1 + dx] + (_inner * w * dx / 2.0) + (offset * dx * _inner);
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