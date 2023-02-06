"use strict";

var _reactNative = require("react-native");
var _decorators = require("./decorators");
const WorkletsInstaller = _reactNative.TurboModuleRegistry.getEnforcing("Worklets");
console.log("Loading react-native-worklets...");
if (global.Worklets === undefined || global.Worklets == null) {
  if (WorkletsInstaller == null || typeof WorkletsInstaller.install !== "function") {
    console.error("Native Worklets Module cannot be found! Make sure you correctly " + "installed native dependencies and rebuilt your app.");
  } else {
    // Install the module
    const result = WorkletsInstaller.install();
    if (result !== true) {
      console.error(`Native Worklets Module failed to correctly install JSI Bindings! Result: ${result}`);
    } else {
      console.log("Worklets loaded successfully");
      (0, _decorators.addDecorators)();
    }
  }
} else {
  console.log("react-native-worklets installed.");
  (0, _decorators.addDecorators)();
}
//# sourceMappingURL=NativeWorklets.js.map