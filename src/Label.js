/*eslint no-console: "warn"*/
/*eslint no-unused-vars: "warn"*/
import labelLayout from './LabelLayout';
import {Transform} from 'vega-dataflow';
import {inherits, isFunction} from 'vega-util';

var Output = ['x', 'y', 'fill', 'stroke', 'align', 'baseline', 'anchors', 'originalFillAndStroke'];

var Params = ['offset'];

var defaultAnchors = [
  "top-left",
  "left",
  "bottom-left",
  "top", "bottom",
  "top-right",
  "right",
  "bottom-right"
];

export default function Label(params) {
  Transform.call(this, labelLayout(), params);
}

Label.Definition = {
  "type": "Label",
  "metadata": {"modifies": true},
  "params": [
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "offsets", "type": "number", "array": true, "default": [ 1 ]},
    { "name": "sort", "type": "field" },
    { "name": "anchors", "type": "string", "array": true, "default": defaultAnchors },
    { "name": "marks", "type": "data", "array": true },
    { "name": "fill", "type": "string", "expr": true, "default": "#000" },
    { "name": "stroke", "type": "string", "expr": true, "default": undefined },
    { "name": "as", "type": "string", "array": true, "length": Output.length, "default": Output }
  ]
};

var prototype = inherits(Label, Transform);

prototype.transform = function(_, pulse) {
  function modp(param) {
    var p = _[param];
    return isFunction(p) && pulse.modified(p.fields);
  }

  var mod = _.modified();
  if (!(mod || pulse.changed(pulse.ADD_REM) || Params.some(modp))) return;

  var data = pulse.materialize(pulse.SOURCE).source,
      labelLayout = this.value,
      as = _.as ? _.as : Output;

  // configure layout
  var labels = labelLayout
      .texts(data)
      .size(_.size)
      .sort(_.sort)
      .offsets(_.offsets ? _.offsets : [1])
      .anchors(_.anchors ? _.anchors : defaultAnchors)
      .marks(_.marks ? _.marks : [])
      .fill(_.fill ? _.fill : "#000")
      .stroke(_.stroke ? _.stroke : undefined)
      .layout(),
      n = data.length;

  for (var i = 0; i < n; i++) {
    var l = labels[i],
        t = l.datum;
    
    t[as[0]] = l.x;
    t[as[1]] = l.y;
    t[as[2]] = l.fill;
    t[as[3]] = l.stroke;
    t[as[4]] = 'center';
    t[as[5]] = 'middle';
    t[as[6]] = l.anchors;
    t[as[7]] = l.originalFillAndStroke;
  }

  return pulse.reflow(mod).modifies(as);
};
