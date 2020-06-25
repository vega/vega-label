var vega = require('vega')
var Label = require('../build/label');
var spec = require('./spec').spec;

global.performance = require('perf_hooks').performance;
vega.transforms.label = Label.label;

var NUM_TESTS = 20;
var sizes = Label.benchmarkUtils.sizes;
var resize = Label.benchmarkUtils.resize;
// var labelers = ["particle", "improvedParticle", "pixel"];
var labelers = ["particle", "improvedParticle", "pixel"];

async function test(s) {
  // create a new view instance for a given Vega JSON spec
  var view = new vega.View(vega.parse(s), {renderer: 'none'});

  // generate a static PNG image
  await view.toCanvas()
    .catch(function(err) { console.error(err); });
}

(async function run() {
  var i0, i1, i2;
  for (i0 = 0; i0 < sizes.length; i0++) {
    for (i1 = 0; i1 < labelers.length; i1++) {
      for (i2 = 0; i2 < NUM_TESTS; i2++) {
        await test(resize(spec, sizes[i0], labelers[i1], i2));
      }
    }
  }
})();