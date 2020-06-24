var vega = require('vega')
var Label = require('../build/label');
var spec = require('./spec').spec;

global.performance = require('perf_hooks').performance;
vega.transforms.label = Label.label;

var sizes = Label.benchmarkUtils.sizes;
var resize = Label.benchmarkUtils.resize;

async function test(s) {
  // create a new view instance for a given Vega JSON spec
  var view = new vega.View(vega.parse(s), {renderer: 'none'});

  // generate a static PNG image
  await view.toCanvas()
    .catch(function(err) { console.error(err); });
}

(async function run() {
  var i;
  for (i = 0; i < sizes.length; i++) {
    await test(resize(spec, sizes[i]));
  }
})();