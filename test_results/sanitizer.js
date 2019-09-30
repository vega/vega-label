const fs = require("fs");
const dir = "./test_results";

const labelers = ["old_pixel", "pixel", "partical"];
const data = [];
function sanitize(labeler, scale) {
  const content = fs.readFileSync(`${dir}/${labeler}_${scale}.txt`, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i += 2) {
    const [type, numPoint, chartWidth] = lines[i].split(" ");
    const runtime = parseInt(lines[i + 1]);
    data.push({
      type,
      num_point: parseInt(numPoint),
      chart_width: parseInt(chartWidth),
      runtime,
      labeler,
      scale
    });
  }
}

labelers.forEach(labeler => {
  sanitize(labeler, "scale");
  sanitize(labeler, "not_scale");
});

fs.writeFileSync(`${dir}/results.json`, JSON.stringify(data, null, 2));
