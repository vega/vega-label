/*eslint no-console: "warn"*/
/*eslint no-empty: "warn"*/

export function labelWidth(context, text, fontSize, font) {
  // TODO: support other font properties
  context.font = fontSize + 'px ' + font;
  return context.measureText(text).width;
}
