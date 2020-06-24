var spec = {
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "background": "white",
  "padding": 5,
  "width": 800,
  "height": 500,
  "config": {
    "view": {
      "stroke": "transparent"
    }
  },
  "data": [
    {
      "name": "data_states",
      "url": "data/us-10m.json",
      "format": { "type": "topojson", "feature": "states" }
    },
    {
      "name": "projected_states",
      "source": "data_states",
      "transform": [
        {
          "type": "geopath",
          "projection": "projection"
        }
      ]
    },
    {
      "name": "data_airports",
      "url": "data/airports.csv",
      "format": { "type": "csv", "delimiter": "," }
    },
    {
      "name": "data_flights",
      "url": "data/flights-airport.csv",
      "format": {
        "type": "csv",
        "parse": { "origin": "string" },
        "delimiter": ","
      },
      "transform": [
        { "type": "filter", "expr": "datum['origin']==='SEA'" },
        {
          "type": "lookup",
          "from": "data_airports",
          "key": "iata",
          "fields": ["origin"],
          "values": ["latitude", "longitude"],
          "as": ["origin_latitude", "origin_longitude"]
        },
        {
          "type": "lookup",
          "from": "data_airports",
          "key": "iata",
          "fields": ["destination"],
          "values": ["latitude", "longitude", "name"],
          "as": ["dest_latitude", "dest_longitude", "name"]
        },
        {
          "type": "geojson",
          "fields": ["dest_longitude", "dest_latitude"],
          "signal": "flights_geojson"
        },
        {
          "type": "geopoint",
          "projection": "projection",
          "fields": ["origin_longitude", "origin_latitude"],
          "as": ["origin_x", "origin_y"]
        },
        {
          "type": "geopoint",
          "projection": "projection",
          "fields": ["dest_longitude", "dest_latitude"],
          "as": ["dest_x", "dest_y"]
        }
      ]
    },
    {
      "name": "projected_airports",
      "source": "data_airports",
      "transform": [
        {
          "type": "lookup",
          "from": "data_flights",
          "key": "destination",
          "fields": ["iata"],
          "values": ["name"],
          "as": ["is_dest"]
        },
        { "type": "filter", "expr": "datum['is_dest']===null" },
        {
          "type": "geopoint",
          "projection": "projection",
          "fields": ["longitude", "latitude"],
          "as": ["_x", "_y"]
        }
      ]
    }
  ],
  "projections": [
    {
      "name": "projection",
      "size": { "signal": "[width, height]" },
      "fit": {
        "signal": "[data('data_states'), flights_geojson]"
      },
      "type": "albersUsa"
    }
  ],
  "marks": [
    {
      "type": "path",
      "name": "us_map",
      "from": { "data": "projected_states" },
      "encode": {
        "enter": {
          "fill": { "value": null },
          "stroke": { "value": "lightgray" },
          "strokeWidth": { "value": 1 }
        },
        "update": {
          "path": { "field": "path" }
        }
      }
    },
    {
      "name": "airport_points",
      "type": "symbol",
      "style": ["circle"],
      "from": { "data": "projected_airports" },
      "zindex": 2,
      "encode": {
        "update": {
          "opacity": { "value": 1 },
          "fill": { "value": "darkgray" },
          "x": { "field": "_x" },
          "y": { "field": "_y" },
          "size": { "value": 4 },
          "shape": { "value": "circle" }
        }
      }
    },
    {
      "name": "reachable_lines",
      "type": "rule",
      "style": ["rule"],
      "from": { "data": "data_flights" },
      "zindex": 2,
      "encode": {
        "update": {
          "stroke": { "value": "black" },
          "strokeWidth": { "value": 1 },
          "x": { "field": "origin_x" },
          "x2": { "field": "dest_x" },
          "y": { "field": "origin_y" },
          "y2": { "field": "dest_y" }
        }
      }
    },
    {
      "name": "reachable_endpoints",
      "type": "symbol",
      "style": ["circle"],
      "from": { "data": "reachable_lines" },
      "zindex": 2,
      "encode": {
        "update": {
          "size": { "value": 6 },
          "fill": { "value": "black" },
          "x": { "field": "x2" },
          "y": { "field": "y2" }
        }
      }
    },
    {
      "name": "label_endpoints",
      "type": "text",
      "from": { "data": "reachable_endpoints" },
      "zindex": 2,
      "encode": {
        "enter": {
          "x": { "field": "x" },
          "y": { "field": "y" },
          "fill": { "value": "firebrick" },
          "text": { "field": "datum.datum.name" },
          "fontSize": { "value": 7 }
        }
      },
      "transform": [{
        "type": "label",
        "size": [500, 300, {"noText": true}],
        "avoidMarks": ["reachable_lines", "reachable_endpoints"]
      }]
    },
    {
      "name": "label_endpoints_background",
      "type": "rect",
      "from": { "data": "label_endpoints" },
      "zindex": 1,
      "encode": {
        "enter": {
          "x": { "field": "x0" },
          "y": { "field": "y0" },
          "x2": { "field": "x1" },
          "y2": { "field": "y1" },
          "fillOpacity": { "value": 0.1 },
          "fill": { "field": "fill" },
          "strokeOpacity": { "value": 0.3 },
          "stroke": { "field": "fill" }
        }
      }
    },
    {
      "name": "label_airports",
      "type": "text",
      "from": { "data": "airport_points" },
      "zindex": 2,
      "encode": {
        "enter": {
          "x": { "field": "x" },
          "y": { "field": "y" },
          "fill": { "value": "teal" },
          "text": { "field": "datum.name" },
          "fontSize": { "value": 5 }
        }
      },
      "transform": [{
        "type": "label",
        "size": [500, 300, {}],
        "avoidMarks": [
          "reachable_lines",
          "label_endpoints_background",
          "reachable_endpoints",
          "airport_points",
          "us_map"
        ]
      }]
    },
    {
      "name": "label_airports_background",
      "type": "rect",
      "from": { "data": "label_airports" },
      "zindex": 1,
      "encode": {
        "enter": {
          "x": { "field": "x0" },
          "y": { "field": "y0" },
          "x2": { "field": "x1" },
          "y2": { "field": "y1" },
          "fillOpacity": { "value": 0.1 },
          "fill": { "field": "fill" },
          "strokeOpacity": { "value": 0.3 },
          "stroke": { "field": "fill" }
        }
      }
    },
    {
      "name": "label_airports_rule",
      "type": "rule",
      "from": { "data": "label_airports" },
      "zindex": 1,
      "encode": {
        "enter": {
          "x": { "field": "datum.x" },
          "y": { "field": "datum.y" },
          "x2": { "field": "xAnchor" },
          "y2": { "field": "yAnchor" },
          "strokeOpacity": { "value": 0.3 },
          "stroke": { "field": "fill" }
        }
      }
    },
    {
      "name": "label_endpoints_rule",
      "type": "rule",
      "from": { "data": "label_endpoints" },
      "zindex": 1,
      "encode": {
        "enter": {
          "x": { "field": "datum.x" },
          "y": { "field": "datum.y" },
          "x2": { "field": "xAnchor" },
          "y2": { "field": "yAnchor" },
          "strokeOpacity": { "value": 0.3 },
          "stroke": { "field": "fill" }
        }
      }
    }
  ]
};

module.exports = { spec: spec };