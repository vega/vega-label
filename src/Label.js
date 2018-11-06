/*eslint no-console: "warn"*/
/*eslint no-unused-vars: "warn"*/
import labelLayout from './LabelLayout';
import { Transform } from 'vega-dataflow';
import { inherits, isFunction } from 'vega-util';

var Output = ['x', 'y', 'opacity', 'align', 'baseline', 'originalOpacity', 'transformed'];

var Params = ['offset'];

var defaultAnchors = [
  'top-left',
  'left',
  'bottom-left',
  'top',
  'bottom',
  'top-right',
  'right',
  'bottom-right',
];

export default function Label(params) {
  Transform.call(this, labelLayout(), params);
}

Label.Definition = {
  type: 'Label',
  metadata: { modifies: true },
  params: [
    { name: 'padding', type: 'number', default: 0 },
    { name: 'markIdx', type: 'number', default: 0 },
    { name: 'lineAnchor', type: 'string', values: ['begin', 'end'], default: 'end' },
    { name: 'avoidBaseMark', type: 'boolean', default: true },
    { name: 'size', type: 'number', array: true, length: [2] },
    { name: 'offset', type: 'number', array: true, default: [1] },
    { name: 'sort', type: 'field' },
    { name: 'anchor', type: 'string', array: true, default: defaultAnchors },
    { name: 'avoidMarks', type: 'data', array: true },
    {
      name: 'as',
      type: 'string',
      array: true,
      length: Output.length,
      default: Output,
    },
  ],
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
    offset = _.offset ? _.offset : [1],
    anchor = _.anchor ? _.anchor : defaultAnchors,
    numberPositions = offset.length > anchor.length ? offset.length : anchor.length;

  // configure layout
  var labels = labelLayout
      .texts(data)
      .sort(_.sort)
      .offset(offset, numberPositions)
      .anchor(anchor, numberPositions)
      .avoidMarks(_.avoidMarks ? _.avoidMarks : [])
      .size(_.size)
      .avoidBaseMark(_.avoidBaseMark !== undefined ? _.avoidBaseMark : true)
      .lineAnchor(_.lineAnchor ? _.lineAnchor : 'end')
      .markIdx(_.markIdx ? _.markIdx : 0)
      .padding(_.padding ? _.padding : 0)
      .layout(),
    n = data.length;

  // fill the information of transformed labels back into data
  var l, t;
  for (var i = 0; i < n; i++) {
    l = labels[i];
    t = l.datum;

    t[as[0]] = l.x;
    t[as[1]] = l.y;
    t[as[2]] = l.opacity;
    t[as[3]] = l.align;
    t[as[4]] = l.baseline;
    t[as[5]] = l.originalOpacity;
    t[as[6]] = true;
  }

  return pulse.reflow(mod).modifies(as);
};
