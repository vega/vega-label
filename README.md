# Vega-Label

Vega-Label is a post-encoding transform for [Vega](https://github.com/vega/vega).

[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

## Syntax for label transform

```
"transform": [
  {
    "type": "label",
    "size": [800, 500]
    "offsets": [ 1, 2, -1 ],
    "sort": { "field": "datum.year" },
    "anchors": [ "top", "right" ]
    "avoidMarks": [ "basePoint", "baseLine" ],
    "allowOutside": true
  }
]
```

- `sort`: order of label to be placed (**greater** will be placed **after**)

- `size`: size of the chart in format `[width, height]`. **This size have to match with the chart size**

- `anchors`: list of anchor points of labels to its mark's bounding box

  - From the example above, for each label, vega-label will try to place it at the `top` first, relative to its mark.
  - If it collide with some other mark or label, vega-label will try to place it at the `right`, relative to its mark.

- `offsets`: list of offset values from the bounding box of the **base mark**.

  - From the example above, vega-label will try to place label with offset value 1 first.
  - If it cannot place the label, vega-label will try to place label with offset value 2.
  - If it cannot place the label, vega-label will try to place label with offset value 1 inside its mark.
    - **Note**: label will be placed inside its mark if offset is negative.

- `avoidMarks`: list of data of mark; labels will not collide with these marks
  - Right now, `avoidMarks` works with `symbol`, `line`, `rect`, and `group`.

- `allowOutside`: a flag if labels are allow to be placed outside the area of chart.

- label transform has to be used with reactive geometry to use it as base mark to calculate positions of label
  - Right now, reactive geometry works with `symbol`, `line`, `rect`, and `group` of `line` and `area`

# Examples of vega-label

## With area

### In groupped area plot - Job Voyager Example

![area_job_voyager](pics/label_area_job_voyager.png)

Groups of area are used as the base mark, so one label is placed inside each area.
Here is the [Vega Specification](./spec/label_area_job_voyager.vg.json)

This example is from Vega [Job Voyager Example](https://vega.github.io/vega/examples/job-voyager/)

## With line

### In connected scatter plot - Connected Scatter Plot Example

![line_connected_scatter](pics/label_line_connected_scatter.png)

Symbol is used as the base mark to label, and line is the mark to avoid when labeling.
Here is the [Vega Specification](./spec/label_line_connected_scatter.vg.json)

This example is from Vega [Connected Scatter Plot Example](https://vega.github.io/vega/examples/connected-scatter-plot/)

### In groupped lines plot - Carbon Dioxide in the Atmosphere

![line_end](pics/label_line_end.png)

Groups of line are used as the base mark to label, so one label is placed at the end of each line.
Here is the [Vega Specification](./spec/label_line_end.vg.json)

This example is inspired by Vega-Lite [Carbon Dioxide in the Atmosphere](https://vega.github.io/vega-lite/examples/layer_line_co2_concentration.html)

## With rect

### In stacked bar chart - Stacked Bar Chart Example

![rect_stack](pics/label_rect_stack.png)

Rect is used as the base mark to label, and label positions is set to the top of each bar (inside then outside)
Here is the [Vega Specification](./spec/label_rect_stack.vg.json)

This example is inspired by Vega [Stacked Bar Chart Example](https://vega.github.io/vega/examples/stacked-bar-chart/)

## With symbol

### In scatter plot - Asteroid Positions

![scatter_asteroids](pics/label_scatter_asteroids.png)

Symbol is used as the base mark to label.
Here is the [Vega Specification](./spec/label_scatter_asteroids.vg.json)

The data is from The Data Intensive Research in Astrophysics and Cosmology at the University of Washington
