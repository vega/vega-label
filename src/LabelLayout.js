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
  top: TOP + CENTER,
  'top-right': TOP + RIGHT,
  left: MIDDLE + LEFT,
  middle: MIDDLE + CENTER,
  right: MIDDLE + RIGHT,
  'bottom-left': BOTTOM + LEFT,
  bottom: BOTTOM + CENTER,
  'bottom-right': BOTTOM + RIGHT,
};

export default function() {
  var offsets, sort, anchors, avoidMarks, allowOutside, size;
  var label = {},
    texts = [];

  label.layout = function() {
    var n = texts.length,
      data = Array(n),
      marktype =
        n && texts[0].datum && texts[0].datum.mark ? texts[0].datum.mark.marktype : undefined,
      transformed = n ? texts[0].transformed : false;

    if (!size || size.length !== 2) return texts;

    console.time('layout');
    var i, d, markBound, originalOpacity, datum, b;
    for (i = 0; i < n; i++) {
      d = texts[i];

      if (!marktype) {
        markBound = [d.x, d.x, d.x, d.y, d.y, d.y];
      } else if (marktype === 'line' || marktype === 'area') {
        datum = d.datum;
        markBound = [datum.x, datum.x, datum.x, datum.y, datum.y, datum.y];
      } else {
        b = d.datum.bounds;
        markBound = [b.x1, (b.x1 + b.x2) / 2.0, b.x2, b.y1, (b.y1 + b.y2) / 2.0, b.y2];
      }

      data[i] = {
        textWidth: undefined,
        textHeight: d.fontSize,
        fontSize: d.fontSize,
        font: d.font,
        text: d.text,
        sort: sort ? sort(d.datum) : undefined,
        markBound: markBound,
        originalOpacity: transformed ? originalOpacity : d.opacity,
        opacity: 0,
        datum: d,
      };
    }

    if (sort)
      data.sort(function(a, b) {
        return a.sort - b.sort;
      });

    console.timeEnd('layout');
    return placeLabelsPixel(data, anchors, marktype, avoidMarks, offsets, allowOutside, size);
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
      var n = _.length;
      offsets = new Float64Array(len);
      for (var i = 0; i < n; i++) {
        offsets[i] = _[i];
      }
      for (i = n; i < len; i++) {
        offsets[i] = offsets[n - 1];
      }
      return label;
    } else {
      return offsets;
    }
  };

  label.sort = function(_) {
    if (arguments.length) {
      sort = _;
      return label;
    } else {
      return sort;
    }
  };

  label.anchors = function(_, len) {
    if (arguments.length) {
      var n = _.length;
      anchors = new Int8Array(len);
      for (var i = 0; i < n; i++) {
        anchors[i] |= anchorsMap[_[i]];
      }
      for (i = n; i < len; i++) {
        anchors[i] = anchors[n - 1];
      }
      return label;
    } else {
      return anchors;
    }
  };

  label.avoidMarks = function(_) {
    if (arguments.length) {
      avoidMarks = _;
      return label;
    } else {
      return sort;
    }
  };

  label.allowOutside = function(_) {
    if (arguments.length) {
      allowOutside = _;
      return label;
    } else {
      return allowOutside;
    }
  };

  label.size = function(_) {
    if (arguments.length) {
      size = _;
      return label;
    } else {
      return size;
    }
  };

  return label;
}
