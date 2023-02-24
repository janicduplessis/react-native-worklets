import { TurboModuleRegistry } from "react-native";
const WorkletsInstaller = TurboModuleRegistry.getEnforcing("Worklets");
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
    }
  }
} else {
  console.log("react-native-worklets installed.");
}
//# sourceMappingURL=NativeWorklets.js.map