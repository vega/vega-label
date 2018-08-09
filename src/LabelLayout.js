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
    RIGHT = 0x2;

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
      label = {};

  label.layout = function() {
    var n = texts.length,
        d, data = Array(n),
        marktype = n && texts[0].datum && texts[0].datum.mark ? texts[0].datum.mark.marktype : undefined,
        transformed = n ? texts[0].transformed : false;

    console.time("layout");
    var i, textWidth, textHeight, mb, originalFill, originalStroke;
    for (i = 0; i < n; i++) {
      d = texts[i];
      textWidth = labelWidth(d.text, d.fontSize, d.font, context); // bottle neck!!
      textHeight = d.fontSize;

      if (marktype && marktype !== 'line') {
        var b = d.datum.bounds;
        mb = [b.x1, (b.x1 + b.x2) / 2.0, b.x2, b.y1, (b.y1 + b.y2) / 2.0, b.y2];
      } else {
        mb = [d.x, d.x, d.x, d.y, d.y, d.y];
      }

      if (transformed) {
        originalFill = d.originalFill;
        originalStroke = d.originalStroke;
      } else {
        originalFill = d.fill;
        originalStroke = d.stroke;
      }

      data[i] = {
        fontSize: d.fontSize,
        textWidth: textWidth,
        textHeight: textHeight,
        // boundFun: getBoundFunction([mb.x1, (mb.x1 + mb.x2) / 2.0, mb.x2, mb.y1, (mb.y1 + mb.y2) / 2.0, mb.y2], textWidth, textHeight),
        sort: sort ? sort(d.datum) : undefined,
        markBound: mb,
        anchors: { x2: d.x, y2: d.y },
        originalFill: originalFill,
        originalStroke: originalStroke,
        datum: d
      };
    }

    if (sort) data.sort(function(a, b) { return a.sort - b.sort; });
    
    console.timeEnd("layout");
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
      var n = _.length, i;
      anchors = new Int8Array(n);
      for (i = 0; i < n; i++) {
        anchors[i] |= anchorsMap[_[i]];
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

  return label;
}

// function getBoundFunction(b, w, h) {
//   return function (dx, dy, offset) {
//     var sizeFactor = (dx && dy) ? SIZE_FACTOR : 1,
//         isIn = offset < 0 ? -1 : 1,
//         _y = b[4 + dy] + (isIn * h * dy / 2.0) + (offset * dy * sizeFactor),
//         _x = b[1 + dx] + (isIn * w * dx / 2.0) + (offset * dx * sizeFactor);
//     return {
//       y: _y - (h / 2.0),
//       yc: _y,
//       y2: _y + (h / 2.0),
//       x: _x - (w / 2.0),
//       xc: _x,
//       x2: _x + (w / 2.0),
//     }
//   };
// }

function labelWidth (text, fontSize, font, context) {
  context.font = fontSize + "px " + font; // add other font properties
  return context.measureText(text).width;
}
