"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addDecorators = void 0;
const consoleDecorator = () => {
  console.log("Adding console decorator");
  const obj = {
    log: Worklets.createRunInJsFn(function () {
      "worklet";

      return console.log(...arguments);
    }),
    warn: Worklets.createRunInJsFn(function () {
      "worklet";

      return console.warn(...arguments);
    }),
    error: Worklets.createRunInJsFn(function () {
      "worklet";

      return console.error(...arguments);
    }),
    info: Worklets.createRunInJsFn(function () {
      "worklet";

      return console.info(...arguments);
    })
  };
  Worklets.addDecorator("console", obj);
};
const addDecorators = () => {
  console.log("Adding decorators...");
  consoleDecorator();
  console.log("Done decorating.");
};
exports.addDecorators = addDecorators;
//# sourceMappingURL=decorators.js.map