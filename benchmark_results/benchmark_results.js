const Q = 'quantitative';
const N = 'nominal';

const LABELERS_LEGENDS = {
  pixel: 'Bitmap',
  particle: 'Particle',
  improvedParticle: 'Improved Particle',
};

const LABELERS = ['particle', 'improvedParticle', 'pixel'];

const filterLabeler = (labeler) => ({ filter: `datum.labeler === '${labeler}'` });
const fieldDef = (field, type) => ({ field, type });
const createSpecLabel = ({ filter, baseline, dx, dy }) => ({
  transform: [filterLabeler(filter)],
  mark: { type: "text", baseline, dx, dy },
});

const createSpecCompare = (baselineLabeler, comparingLabeler, criterion, title) => ({
  "height": 170,
  "width": 200,
  "encoding": {
    "x": { ...fieldDef('chart_width', Q), "scale": { "type": "log" }, "title": "Chart width" },
    "y": { ...fieldDef(criterion, Q), "title": title ? title : null, scale: {nice: false}},
    "color": {
      ...fieldDef('labeler', N),
      "legend": {
        "title": "Overlaps Detection Techniques",
        "orient": "bottom",
        "values": LABELERS.map(l => LABELERS_LEGENDS[l])
      }
    }
  },
  "layer": [
    {
      "transform": [filterLabeler(baselineLabeler)],
      "mark": { "type": "area" },
      "encoding": {
        "y2": fieldDef(`pixel_${criterion}`, undefined),
        "color": { "value": "lightgray" }
      }
    },
    { "mark": { "type": "line", "point": true } },
    {
      "encoding": { "text": { ...fieldDef(criterion, Q), "format": ".0f" } },
      "layer": [
        { filter: baselineLabeler, baseline: 'bottom', dy: -5 },
        { filter: comparingLabeler, baseline: 'top', dx: 7, dy: 5 }
      ].map(createSpecLabel)
    },
    {
      ...createSpecLabel({filter: baselineLabeler, baseline: "middle"}),
      "encoding": {
        "y": fieldDef(`center_${criterion}`, Q),
        "text": fieldDef(`text_diff_${criterion}`, N),
        "color": { "value": "black" }
      }
    }
  ]
});

const createSpecCompareRuntimeAndQuality = (baselineLabeler, comparingLabeler, yTitle) => ({
  "data": { url: filename(baselineLabeler, comparingLabeler) },
  "transform": [
    { calculate: `datum.labeler === '${comparingLabeler}' ? '${LABELERS_LEGENDS[comparingLabeler]}' : '${LABELERS_LEGENDS[baselineLabeler]}'`, as: "labeler" },
    { calculate: "~~(datum.diff_runtime * 100)", as: "diff_runtime_p" },
    { calculate: "~~(datum.diff_placed * 100)", as: "diff_placed_p" },
    { calculate: "~~datum.diff_runtime + '%'", as: "text_diff_runtime" },
    { calculate: "~~datum.diff_placed + '%'", as: "text_diff_placed" },
  ],
  "title": `${LABELERS_LEGENDS[baselineLabeler]} vs ${LABELERS_LEGENDS[comparingLabeler]}`,
  "vconcat": [
    createSpecCompare(LABELERS_LEGENDS[baselineLabeler], LABELERS_LEGENDS[comparingLabeler], "runtime", yTitle && "Runtime (ms)"),
    createSpecCompare(LABELERS_LEGENDS[baselineLabeler], LABELERS_LEGENDS[comparingLabeler], "placed", yTitle && "Number of labels placed")
  ]
});

const BASE_DIR = 'results/';

const filename = (labeler1, labeler2) => {
  return `${BASE_DIR}aggregated_results_${labeler1}_${labeler2}.csv`;
}

const spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
  "hconcat": [
    createSpecCompareRuntimeAndQuality(
      'particle',
      'pixel',
      true
    ),
    createSpecCompareRuntimeAndQuality(
      'improvedParticle',
      'pixel',
      null
    ),
    createSpecCompareRuntimeAndQuality(
      'particle',
      'improvedParticle',
      null
    ),
  ]
}
