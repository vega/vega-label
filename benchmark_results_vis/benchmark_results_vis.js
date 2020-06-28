const Q = 'quantitative';
const N = 'nominal';

const LABELERS_LEGENDS = {
  bitmap: 'Bitmap-Based',
  particle: 'Original Particle-Based',
  improved: 'Improved Particle-Based',
};

const LABELERS = ['particle', 'improved', 'bitmap'];

const filterLabeler = (labeler) => ({ filter: `datum.labeler === '${labeler}'` });
const fieldDef = (field, type) => ({ field, type });
const createSpecLabel = ({ filter, baseline, dx, dy }) => ({
  transform: [filterLabeler(filter)],
  mark: { type: "text", baseline, dx, dy },
});

const createSpecCompare = (compareTo, dy, criterion, title) => ({
  "title": { "text": title, dy },
  "height": 170,
  "width": 200,
  "encoding": {
    "x": { ...fieldDef('chart_width', Q), "scale": { "type": "log" }, "title": "Chart width" },
    "y": { ...fieldDef(criterion, Q), "title": null },
    "color": {
      ...fieldDef('labeler', N),
      "legend": {
        "orient": "bottom",
        "values": LABELERS.map(l => LABELERS_LEGENDS[l])
      }
    }
  },
  "layer": [
    {
      "transform": [filterLabeler(compareTo)],
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
        { filter: compareTo, baseline: 'bottom', dy: -5 },
        { filter: LABELERS_LEGENDS.bitmap, baseline: 'top', dx: 7, dy: 5 }
      ].map(createSpecLabel)
    },
    {
      ...createSpecLabel({filter: compareTo, baseline: "middle"}),
      "encoding": {
        "y": fieldDef(`center_${criterion}`, Q),
        "text": fieldDef(`text_diff_${criterion}`, N),
        "color": { "value": "black" }
      }
    }
  ]
});

const createSpecCompareRuntimeAndQuality = (url, compareTo, dy) => ({
  "data": { url },
  "transform": [
    { calculate: `datum.labeler === 'pixel' ? '${LABELERS_LEGENDS.bitmap}' : '${compareTo}'`, as: "labeler" },
    { calculate: "~~(datum.diff_runtime * 100)", as: "diff_runtime_p" },
    { calculate: "~~(datum.diff_placed * 100)", as: "diff_placed_p" },
    { calculate: "~~datum.diff_runtime + '%'", as: "text_diff_runtime" },
    { calculate: "~~datum.diff_placed + '%'", as: "text_diff_placed" },
  ],
  "hconcat": [
    createSpecCompare(compareTo, dy, "runtime", "Runtime (ms)"),
    createSpecCompare(compareTo, 0, "placed", "Number of labels placed")
  ]
});

const spec = {
  "$schema": "https://vega.github.io/schema/vega-lite/v4.json",
  "vconcat": [
    createSpecCompareRuntimeAndQuality(
      "https://gist.githubusercontent.com/chanwutk/34d78049ebb6980d26ebf3483af9d5a2" +
      "/raw/60628ce9257ddcbcd6ccaceb043173fb75040153/reachable_airports_aggregated_particle_2020_06_26.csv",
      LABELERS_LEGENDS.particle,
      -9
    ),
    createSpecCompareRuntimeAndQuality(
      "https://gist.githubusercontent.com/chanwutk/bff99aebcec483e2fdeb24ec2d8a45ac" +
      "/raw/fa02b140a3c3f029d7825947918b26bb80e1b187/reachable_airports_aggregated_particle_2020_06_26.csv",
      LABELERS_LEGENDS.improved,
      -4
    ),
  ]
}
