/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
import { labelWidth, getAnchor } from './Common';
import * as particle from './ParticleBasedLabel';
import * as pixel from './PixelBasedLabel';
import { drawAvoidMarks } from './markBitmaps';
import { pointCoverAvoidMarks } from './markArrayMap';

var NUM_RECORDS = 10;

var PLACE_LABELS = {
  "pixel": pixel.placeLabels,
  "particle": particle.placeLabels,
};
var LABELERS = [ "pixel", "particle"];
// var LABELERS = [ "particle", "pixel"];

var RENDER_MARKS = {
  "image": drawAvoidMarks,
  "vector": pointCoverAvoidMarks,
};

// var MARKS_RENDERERS = ["image", "vector"];
var MARKS_RENDERERS = ["vector", "image"];

export default function() {
  var markData = [],
      size,
      padding = 3,
      label = {},
      config,
      avoidMarks = [],
      labeler,
      marksRenderer;

  label.layout = function() {
    var ret;
    var result = config;
    result.num_point = markData.length;
    result.chart_width = size[0];
    
    var padding = 2 * Math.sqrt(markData[0].datum.size / Math.PI);
    var labelers, numRecords, marksRenderers;
    if (config.noTest) {
      numRecords = 1;
      labelers = [LABELERS[0]];
      marksRenderers = [MARKS_RENDERERS[0]];
    } else {
      numRecords = NUM_RECORDS;
      labelers = LABELERS;
      marksRenderers = MARKS_RENDERERS;
    }

    for (var i0 = 0; i0 < marksRenderers.length; i0++) {
      marksRenderer = marksRenderers[i0];
      result.marksRenderer = marksRenderer;
      for (var i1 = 0; i1 < labelers.length; i1++) {
        labeler = labelers[i1];
        result.labeler = labeler;
        for (var i2 = 0; i2 < numRecords; i2++) {
          var before = performance.now();
          var marksInfo = RENDER_MARKS[marksRenderer](avoidMarks, size[0], size[1]);
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
          
          ret = PLACE_LABELS[labeler](data, size, padding, marksInfo, marksRenderer);
          result.runtime = performance.now() - before;
          ret.forEach(function(d) {
            if ('currentPosition' in d) {
              var anchor = getAnchor(d, d.currentPosition[0], d.currentPosition[1], padding);
              d.xAnchor = anchor.xAnchor;
              d.yAnchor = anchor.yAnchor;
            }
          });

          if (!config.noTest) {
            result.placed = ret.reduce(function(total, d) {
              return total + (d.fill !== null);
            }, 0);
            result.id = i2;
            console.log(JSON.stringify(result) + ",");
          }
          // return ret;
        }
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
