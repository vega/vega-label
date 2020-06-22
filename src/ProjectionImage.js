import {canvas} from 'vega-canvas';
import {Marks} from 'vega-scenegraph';

export function drawAvoidMarks(avoidMarks, width, height) {
  var context = canvas(width, height).getContext("2d");
  avoidMarks.forEach(function(items) {draw(context, items)});
  return context;
}

function draw(context, items) {
  if (!items.length) return;
  var type = items[0].mark.marktype;

  if (type === 'group') {
    items.forEach(function(group) {
      group.items.forEach(function(mark) {draw(context, mark.items)});
    });
  } else {
    Marks[type].draw(context, {items: items});
  }
}
