"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addDecorators = void 0;
/*const consoleDecorator = () => {
  console.log("Adding console decorator");
  const obj = {
    log: Worklets.createRunInJsFn((...args: any[]) => {
      "worklet";
      return console.log(...args);
    }),
    warn: Worklets.createRunInJsFn((...args: any[]) => {
      "worklet";
      return console.warn(...args);
    }),
    error: Worklets.createRunInJsFn((...args: any[]) => {
      "worklet";
      return console.error(...args);
    }),
    info: Worklets.createRunInJsFn((...args: any[]) => {
      "worklet";
      return console.info(...args);
    }),
  };
  Worklets.addDecorator("console", obj);
};*/

const addDecorators = () => {
  //console.log("Adding decorators...");
  //consoleDecorator();
  //console.log("Done decorating.");
};
exports.addDecorators = addDecorators;
//# sourceMappingURL=decorators.js.map