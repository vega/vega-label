/*eslint no-unused-vars: "warn"*/
/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/

export function labelWidth(context, text, fontSize, font) {
  context.font = fontSize + 'px ' + font; // TODO: add other font properties
  return context.measureText(text).width;
}
