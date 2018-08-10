/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/
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
  var texts = [],
      offsets,
      sort,
      anchors,
      marks,
      allowOutside,
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
      // textWidth = labelWidth(d.text, d.fontSize, d.font, context); // bottle neck!! -> do it lazily
      textHeight = d.fontSize;

      if (marktype && marktype !== 'line') {
        var b = d.datum.bounds;
        mb = [b.x1, (b.x1 + b.x2) / 2.0, b.x2, b.y1, (b.y1 + b.y2) / 2.0, b.y2];
      } else {
        mb = [d.x, d.x, d.x, d.y, d.y, d.y];
      }

      data[i] = {
        textWidth: undefined,
        textHeight: textHeight,
        font: d.font,
        text: d.text,
        sort: sort ? sort(d.datum) : undefined,
        markBound: mb,
        anchors: { x2: d.x, y2: d.y },
        originalOpacity: transformed ? originalOpacity : d.opacity,
        datum: d
      };
    }

    if (sort) data.sort(function(a, b) { return a.sort - b.sort; });
    
    console.timeEnd("layout");
    return placeLabelsPixel(data, anchors, marktype, marks, offsets, allowOutside);
  };

  label.texts = function(_) {
    if (arguments.length) {
      texts = _;
      return label;
    } else {
      return texts;
    }
  };

  label.offsets = function(_, len) {
    if (arguments.length) {
      var n = _.length, i;
      offsets = new Float64Array(len);
      for (i = 0; i < n; i++) {
        offsets[i] = _[i];
      }
      for (i = n; i < len; i++) {
        offsets[i] = offsets[n - 1];
      }
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

  label.anchors = function(_, len) {
    if (arguments.length) {
      var n = _.length, i;
      anchors = new Int8Array(len);
      for (i = 0; i < n; i++) {
        anchors[i] |= anchorsMap[_[i]];
      }
      for (i = n; i < len; i++) {
        anchors[i] = anchors[n - 1];
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

  label.allowOutside = function(_) {
    if (arguments.length) {
      allowOutside = _;
      return label;
    } else {
      return allowOutside;
    }
  }

  return label;
}
