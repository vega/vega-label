/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
import { getAnchor } from './Common';
import * as particle from './ParticleBasedLabel';
import * as fasterParticle from './FasterParticleBasedLabel';
import * as pixel from './PixelBasedLabel';
import * as rbush from './RBushLabel';

var NUM_RECORDS = 20;

var PLACE_LABELS = {
  "pixel": pixel.placeLabels,
  "particle": particle.placeLabels,
  "rbush": rbush.placeLabels,
  "fasterParticle": fasterParticle.placeLabels
};
// var LABELERS = [ "pixel", "particle", "rbush"];
// var LABELERS = ["particle", "fasterParticle", "rbush", "pixel"];
var LABELERS = ["particle", "rbush", "pixel", "fasterParticle"];

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
    
    var padding = 2 * Math.sqrt(markData[0].datum.size / Math.PI);
    var labelers, numRecords;
    if (config.noTest) {
      numRecords = 1;
      labelers = [LABELERS[0]];
    } else {
      numRecords = NUM_RECORDS;
      labelers = LABELERS;
    }

    for (var i0 = 0; i0 < labelers.length; i0++) {
      labeler = labelers[i0];
      result.labeler = labeler;
      for (var i1 = 0; i1 < numRecords; i1++) {
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
        
        ret = PLACE_LABELS[labeler](data, size, padding, avoidMarks);
        result.runtime = performance.now() - before;
        ret[0].forEach(function(d) {
          if ('currentPosition' in d) {
            var anchor = getAnchor(d, d.currentPosition[0], d.currentPosition[1], padding);
            d.xAnchor = anchor.xAnchor;
            d.yAnchor = anchor.yAnchor;
          }
        });

        if (!config.noTest) {
          result.placed = ret[0].reduce(function(total, d) {
            return total + (d.fill !== null);
          }, 0);
          result.id = i1;
          result.markRenderRuntime = ret[1];
          console.log(JSON.stringify(result) + ",");
        }
      }
    }
    return ret[0];
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
