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
    var i, textWidth, textHeight, mb, originalOpacity;
    for (i = 0; i < n; i++) {
      d = texts[i];
      textWidth = labelWidth(d.text, d.fontSize, d.font, context); // bottle neck!! -> do it lazily
      textHeight = d.fontSize;

      if (marktype && marktype !== 'line') {
        var b = d.datum.bounds;
        mb = [b.x1, (b.x1 + b.x2) / 2.0, b.x2, b.y1, (b.y1 + b.y2) / 2.0, b.y2];
      } else {
        mb = [d.x, d.x, d.x, d.y, d.y, d.y];
      }

      data[i] = {
        fontSize: d.fontSize,
        textWidth: textWidth,
        textHeight: textHeight,
        // boundFun: getBoundFunction([mb.x1, (mb.x1 + mb.x2) / 2.0, mb.x2, mb.y1, (mb.y1 + mb.y2) / 2.0, mb.y2], textWidth, textHeight),
        sort: sort ? sort(d.datum) : undefined,
        markBound: mb,
        anchors: { x2: d.x, y2: d.y },
        originalOpacity: transformed ? originalOpacity : d.opacity,
        datum: d
      };
    }

    if (anchors.length < offsets.length) {
      addPaddingToArray(anchors, offsets);
    } else {
      addPaddingToArray(offsets, anchors);
    }

    if (sort) data.sort(function(a, b) { return a.sort - b.sort; });
    
    console.timeEnd("layout");
    return placeLabelsPixel(data, anchors, marktype, marks, offsets);
  };

  label.texts = function(_) {
    if (arguments.length) {
      texts = _;
      return label;
    } else {
      return texts;
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

function addPaddingToArray(smaller, larger) {
  var n = smaller.length, m = larger.length, i;
  var lastValue = smaller[n - 1];
  for (i = n; i < m; i++) {
    smaller.push(lastValue);
  }
}

function labelWidth (text, fontSize, font, context) {
  context.font = fontSize + "px " + font; // add other font properties
  return context.measureText(text).width;
}
