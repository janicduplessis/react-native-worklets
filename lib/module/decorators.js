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
export const addDecorators = () => {
  console.log("Adding decorators...");
  consoleDecorator();
  console.log("Done decorating.");
};
//# sourceMappingURL=decorators.js.map