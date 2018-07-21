vega.transforms.label = Label.label;

var jsonText;
var rawFile = new XMLHttpRequest();
rawFile.open('GET', '../spec/label_spec_test_time.vg.json', false);
rawFile.onreadystatechange = () => {
  if(rawFile.readyState === 4)
    if(rawFile.status === 200 || rawFile.status === 0)
      jsonText = rawFile.responseText;
}
rawFile.send(null);
var spec = JSON.parse(jsonText);
new vega.View(vega.parse(spec))
  .renderer('svg')     // set renderer (canvas or svg)
  .initialize('#vis')  // initialize view within parent DOM container
  .hover()             // enable hover encode set processing
  .run();
var count = 0;
var time = {};
var charts = document.getElementById("charts");
var n = 5;
var view = [];
var tmp = function() {return};
var paramsArray = [];
// while(n-- > 0) {
  for (var i = 2000; i <= 10000; i += 2000) {
    [1000, 10000].forEach(function(tableSize) {
      ["", "_cluster_3"].forEach(function(type) {
        var params = {
          tableSize: tableSize,
          url: "../data/test_label" + type + "_" + i + ".json",
          i: i
        }
        paramsArray.push(params);
      });
    });
  }
// }
var fontSize = spec.marks[0].encode.enter.fontSize.value;
count = 0;
var int = setInterval(function() {
  spec.width = paramsArray[count].tableSize;
  spec.marks[0].transform[0].size[0] = paramsArray[count].tableSize;
  spec.height = paramsArray[count].tableSize;
  spec.marks[0].transform[0].size[1] = paramsArray[count].tableSize;
  spec.marks[0].encode.enter.fontSize.value = fontSize * paramsArray[count].tableSize/1000;
  spec.data[0].url = paramsArray[count].url;
  var chart = document.createElement('div');
  chart.setAttribute("id", "chart_" + count);
  charts.appendChild(chart);
  view[count] = new vega.View(vega.parse(spec));
  view[count]
    .renderer('svg')     // set renderer (canvas or svg)
    .initialize('#chart_' + count)  // initialize view within parent DOM container
    .hover()             // enable hover encode set processing
    .run();

  count++;
  if (count >= paramsArray.length) {
    clearInterval(int);
  }
}, 10000);