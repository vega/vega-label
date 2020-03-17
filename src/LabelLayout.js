/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
import { labelWidth } from './Common';
import { placeLabels } from './ParticleBasedLabel'; var labeler = "particle";
// import { placeLabels } from './OldPixelBasedLabel';
// import { placeLabels } from './PixelBasedLabel'; var labeler = "pixel";
import { drawAvoidMarks } from './markBitmaps';

export default function() {
  var markData = [],
      size,
      padding = 3,
      label = {},
      config,
      avoidMarks = [];

  label.layout = function() {
    var ret;
    config.labeler = labeler;
    for (var i = 0; i < 10; i++) {
      var avoidMarksCtx = drawAvoidMarks(avoidMarks, width, height);
      var before = performance.now();
      var data = markData.map(function(d) {
        var textHeight = d.fontSize;
        return {
          fontSize: d.fontSize,
          x: d.x,
          y: d.y,
          textWidth: null,
          textHeight: textHeight,
          fill: d.fill,
          datum: d
        };
      });
      
      ret = placeLabels(data, size, padding, avoidMarksCtx);
      config.runtime = performance.now() - before;
      console.log(JSON.stringify(config) + ",");
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

  return label;
}
