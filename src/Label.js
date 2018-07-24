/*eslint no-console: "warn"*/
import labelLayout from './LabelLayout';
import {Transform} from 'vega-dataflow';
import {inherits, isFunction} from 'vega-util';

var Output = ['x', 'y', 'z', 'fill', 'align', 'baseline'];

var Params = [];

export default function Label(params) {
  Transform.call(this, labelLayout(), params);
}

Label.Definition = {
  "type": "Label",
  "metadata": {"modifies": true},
  "params": [
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "distance", "type": "number", "default": 0},
    { "name": "priority", "type": "field" },
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
      as = _.as ? _.as : Output,
      distance = _.distance ? _.distance : 0;

  // configure layout
  var labels = labelLayout
      .dataFromMark(data)
      .size(_.size)
      .priority(_.priority)
      .distance(distance)
      .layout(),
      n = data.length;

  for (var i = 0; i < n; i++) {
    var l = labels[i],
        t = l.datum;
    
    t[as[0]] = l.x;
    t[as[1]] = l.y;
    t[as[2]] = l.z
    t[as[3]] = l.fill;
    t[as[4]] = 'center';
    t[as[5]] = 'middle';
  }

  return pulse.reflow(mod).modifies(as);
};
