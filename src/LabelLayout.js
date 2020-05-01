/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
import { labelWidth } from './Common';
import * as particle from './ParticleBasedLabel';
import * as pixel from './PixelBasedLabel';
import { drawAvoidMarks } from './markBitmaps';

var NUM_RECORDS = 10;
var PLACE_LABELS = {
  "pixel": pixel.placeLabels,
  "particle": particle.placeLabels,
};
// var LABELERS = [ "pixel", "particle"];
var LABELERS = [ "particle", "pixel"];

export default function() {
  var markData = [],
      size,
      padding = 3,
      label = {},
      config,
      avoidMarks = [],
      labeler;

  label.layout = function() {
    var ret;
    var result = config;
    result.num_point = markData.length;
    result.chart_width = size[0];

    for (var j = 0; j < LABELERS.length; j++) {
      labeler = LABELERS[j];
      result.labeler = labeler;
      for (var i = 0; i < NUM_RECORDS; i++) {
        var avoidMarksCtx = drawAvoidMarks(avoidMarks, size[0], size[1]);
        var before = performance.now();
        var data = markData.map(function(d) {
          var textHeight = d.fontSize;
          return {
            fontSize: d.fontSize,
            x: d.datum.x,
            y: d.datum.y,
            textWidth: null,
            textHeight: textHeight,
            fill: d.fill,
            datum: d
          };
        });
        
        ret = PLACE_LABELS[labeler](data, size, padding, avoidMarksCtx);
        result.runtime = performance.now() - before;
        result.placed = ret.reduce(function(total, d) {
          return total + (d.fill !== null);
        }, 0);
        result.id = i;
        console.log(JSON.stringify(result) + ",");
        // return ret;
      }
    }
    return ret;
  };

  label.markData = function(_) {
    if (arguments.length) {
      markData = _;
      return label;
    } else {
      return markData;
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

  label.config = function(_) {
    if (arguments.length) {
      config = _;
      return label;
    } else {
      return config;
    }
  }

  label.padding = function(_) {
    if (arguments.length) {
      padding = _ ? _ : 3;
      return label;
    } else {
      return padding;
    }
  }

  label.avoidMarks = function(_) {
    if (arguments.length) {
      avoidMarks = _ ? _ : [];
      return label;
    } else {
      return avoidMarks
    }
  }

  label.labeler = function(_) {
    if (arguments.length) {
      labeler = _ ? _ : "pixel";
      return label;
    } else {
      return labeler;
    }
  }

  return label;
}
