# vega-label

Labeling algorithm for Vega.

This module provides the following Vega post encoding transform:
- **Label**

## Syntax for label transform
```
"transform": [
  {
    "type": "label",
    "size": [800, 500],          // size of the chart [width, height]
    "offset": 2.5,               // offset from the boundbox of mark
    "sort": {                    // order for labeling
      "field": "datum.year"
    },
    "anchors": ["top", "right"]  // the order of positions to be considered by vega-label for placing a label
    "marks": [                   // The data of mark that vega-label avoids when placing labels
      "basePoint",
      "baseLine"
    ] 
  }
]
```

- `size`: size of the chart in format `[width, height]`

- `offset`: offset from the bounding box of the **base mark**.

- `sort`: order of label to be placed (**greater** will be placed **last**)

- `anchors`: list of anchor points of labels to its mark's bounding box
  - From the example above, for each label, vega-label will try to place it at the `top` first, relative to its mark.
  - If it collide with some other mark or label, vega-label will try to place it at the `right`, relative to its mark.
  - If it still collide with some other mark or label, vega-label will hide it.

- `marks`: list of data of mark; labels will not collide with these marks
  - The first mark data is the **base mark** vega-label use to calculate bounding box for `offset` and `anchor`.
  - Right now, vega-label works with `symbol`, `line`, and `rect`.