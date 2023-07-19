"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
require("./NativeWorklets");
var _types = require("./types");
Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _types[key];
    }
  });
});
var _useSharedValue = require("./hooks/useSharedValue");
Object.keys(_useSharedValue).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _useSharedValue[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _useSharedValue[key];
    }
  });
});
var _useWorklet = require("./hooks/useWorklet");
Object.keys(_useWorklet).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _useWorklet[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _useWorklet[key];
    }
  });
});
//# sourceMappingURL=index.js.map