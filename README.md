# vega-label

Labeling algorithm for Vega.

This module provides the following Vega post encoding transform:
- **Label**

## Syntax for label transform
```
"transform": [
    {
        "type": "label",
        "size": [800, 500],                 // size of the chart [width, height]
        "offset": 2.5,                      // offset from the boundbox of mark
        "sort": { "field": "datum.year" },  // order for labeling
        "anchors": ["top", "right"]         // the order of positions to be considered by bega-label to place a label
    }
]
```

- [Reactive Geometry](https://vega.github.io/vega/docs/marks/) has to be used in order for vega-label to use know the information of the base mark.

- Right now, vega-label works with `symbol` and `rect`.