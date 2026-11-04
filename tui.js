// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
function __accessProp(key) {
  return this[key];
}
var __toESMCache_node;
var __toESMCache_esm;
var __toESM = (mod, isNodeMode, target) => {
  var canCache = mod != null && typeof mod === "object";
  if (canCache) {
    var cache = isNodeMode ? __toESMCache_node ??= new WeakMap : __toESMCache_esm ??= new WeakMap;
    var cached = cache.get(mod);
    if (cached)
      return cached;
  }
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  if (mod && typeof mod === "object" || typeof mod === "function") {
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: __accessProp.bind(mod, key),
          enumerable: true
        });
  }
  if (canCache)
    cache.set(mod, to);
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

// node_modules/js-binary-schema-parser/lib/index.js
var require_lib = __commonJS(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.loop = exports.conditional = exports.parse = undefined;
  var parse = function parse(stream, schema) {
    var result = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var parent = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : result;
    if (Array.isArray(schema)) {
      schema.forEach(function(partSchema) {
        return parse(stream, partSchema, result, parent);
      });
    } else if (typeof schema === "function") {
      schema(stream, result, parent, parse);
    } else {
      var key = Object.keys(schema)[0];
      if (Array.isArray(schema[key])) {
        parent[key] = {};
        parse(stream, schema[key], result, parent[key]);
      } else {
        parent[key] = schema[key](stream, result, parent, parse);
      }
    }
    return result;
  };
  exports.parse = parse;
  var conditional = function conditional(schema, conditionFunc) {
    return function(stream, result, parent, parse) {
      if (conditionFunc(stream, result, parent)) {
        parse(stream, schema, result, parent);
      }
    };
  };
  exports.conditional = conditional;
  var loop = function loop(schema, continueFunc) {
    return function(stream, result, parent, parse) {
      var arr = [];
      var lastStreamPos = stream.pos;
      while (continueFunc(stream, result, parent)) {
        var newParent = {};
        parse(stream, schema, result, newParent);
        if (stream.pos === lastStreamPos) {
          break;
        }
        lastStreamPos = stream.pos;
        arr.push(newParent);
      }
      return arr;
    };
  };
  exports.loop = loop;
});

// node_modules/js-binary-schema-parser/lib/parsers/uint8.js
var require_uint8 = __commonJS(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.readBits = exports.readArray = exports.readUnsigned = exports.readString = exports.peekBytes = exports.readBytes = exports.peekByte = exports.readByte = exports.buildStream = undefined;
  var buildStream = function buildStream(uint8Data) {
    return {
      data: uint8Data,
      pos: 0
    };
  };
  exports.buildStream = buildStream;
  var readByte = function readByte() {
    return function(stream) {
      return stream.data[stream.pos++];
    };
  };
  exports.readByte = readByte;
  var peekByte = function peekByte() {
    var offset = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
    return function(stream) {
      return stream.data[stream.pos + offset];
    };
  };
  exports.peekByte = peekByte;
  var readBytes = function readBytes(length) {
    return function(stream) {
      return stream.data.subarray(stream.pos, stream.pos += length);
    };
  };
  exports.readBytes = readBytes;
  var peekBytes = function peekBytes(length) {
    return function(stream) {
      return stream.data.subarray(stream.pos, stream.pos + length);
    };
  };
  exports.peekBytes = peekBytes;
  var readString = function readString(length) {
    return function(stream) {
      return Array.from(readBytes(length)(stream)).map(function(value) {
        return String.fromCharCode(value);
      }).join("");
    };
  };
  exports.readString = readString;
  var readUnsigned = function readUnsigned(littleEndian) {
    return function(stream) {
      var bytes = readBytes(2)(stream);
      return littleEndian ? (bytes[1] << 8) + bytes[0] : (bytes[0] << 8) + bytes[1];
    };
  };
  exports.readUnsigned = readUnsigned;
  var readArray = function readArray(byteSize, totalOrFunc) {
    return function(stream, result, parent) {
      var total = typeof totalOrFunc === "function" ? totalOrFunc(stream, result, parent) : totalOrFunc;
      var parser = readBytes(byteSize);
      var arr = new Array(total);
      for (var i = 0;i < total; i++) {
        arr[i] = parser(stream);
      }
      return arr;
    };
  };
  exports.readArray = readArray;
  var subBitsTotal = function subBitsTotal(bits, startIndex, length) {
    var result = 0;
    for (var i = 0;i < length; i++) {
      result += bits[startIndex + i] && Math.pow(2, length - i - 1);
    }
    return result;
  };
  var readBits = function readBits(schema) {
    return function(stream) {
      var _byte = readByte()(stream);
      var bits = new Array(8);
      for (var i = 0;i < 8; i++) {
        bits[7 - i] = !!(_byte & 1 << i);
      }
      return Object.keys(schema).reduce(function(res, key) {
        var def = schema[key];
        if (def.length) {
          res[key] = subBitsTotal(bits, def.index, def.length);
        } else {
          res[key] = bits[def.index];
        }
        return res;
      }, {});
    };
  };
  exports.readBits = readBits;
});

// node_modules/js-binary-schema-parser/lib/schemas/gif.js
var require_gif = __commonJS(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = undefined;
  var _ = require_lib();
  var _uint = require_uint8();
  var subBlocksSchema = {
    blocks: function blocks(stream) {
      var terminator = 0;
      var chunks = [];
      var streamSize = stream.data.length;
      var total = 0;
      for (var size = (0, _uint.readByte)()(stream);size !== terminator; size = (0, _uint.readByte)()(stream)) {
        if (!size)
          break;
        if (stream.pos + size >= streamSize) {
          var availableSize = streamSize - stream.pos;
          chunks.push((0, _uint.readBytes)(availableSize)(stream));
          total += availableSize;
          break;
        }
        chunks.push((0, _uint.readBytes)(size)(stream));
        total += size;
      }
      var result = new Uint8Array(total);
      var offset = 0;
      for (var i = 0;i < chunks.length; i++) {
        result.set(chunks[i], offset);
        offset += chunks[i].length;
      }
      return result;
    }
  };
  var gceSchema = (0, _.conditional)({
    gce: [{
      codes: (0, _uint.readBytes)(2)
    }, {
      byteSize: (0, _uint.readByte)()
    }, {
      extras: (0, _uint.readBits)({
        future: {
          index: 0,
          length: 3
        },
        disposal: {
          index: 3,
          length: 3
        },
        userInput: {
          index: 6
        },
        transparentColorGiven: {
          index: 7
        }
      })
    }, {
      delay: (0, _uint.readUnsigned)(true)
    }, {
      transparentColorIndex: (0, _uint.readByte)()
    }, {
      terminator: (0, _uint.readByte)()
    }]
  }, function(stream) {
    var codes = (0, _uint.peekBytes)(2)(stream);
    return codes[0] === 33 && codes[1] === 249;
  });
  var imageSchema = (0, _.conditional)({
    image: [{
      code: (0, _uint.readByte)()
    }, {
      descriptor: [{
        left: (0, _uint.readUnsigned)(true)
      }, {
        top: (0, _uint.readUnsigned)(true)
      }, {
        width: (0, _uint.readUnsigned)(true)
      }, {
        height: (0, _uint.readUnsigned)(true)
      }, {
        lct: (0, _uint.readBits)({
          exists: {
            index: 0
          },
          interlaced: {
            index: 1
          },
          sort: {
            index: 2
          },
          future: {
            index: 3,
            length: 2
          },
          size: {
            index: 5,
            length: 3
          }
        })
      }]
    }, (0, _.conditional)({
      lct: (0, _uint.readArray)(3, function(stream, result, parent) {
        return Math.pow(2, parent.descriptor.lct.size + 1);
      })
    }, function(stream, result, parent) {
      return parent.descriptor.lct.exists;
    }), {
      data: [{
        minCodeSize: (0, _uint.readByte)()
      }, subBlocksSchema]
    }]
  }, function(stream) {
    return (0, _uint.peekByte)()(stream) === 44;
  });
  var textSchema = (0, _.conditional)({
    text: [{
      codes: (0, _uint.readBytes)(2)
    }, {
      blockSize: (0, _uint.readByte)()
    }, {
      preData: function preData(stream, result, parent) {
        return (0, _uint.readBytes)(parent.text.blockSize)(stream);
      }
    }, subBlocksSchema]
  }, function(stream) {
    var codes = (0, _uint.peekBytes)(2)(stream);
    return codes[0] === 33 && codes[1] === 1;
  });
  var applicationSchema = (0, _.conditional)({
    application: [{
      codes: (0, _uint.readBytes)(2)
    }, {
      blockSize: (0, _uint.readByte)()
    }, {
      id: function id(stream, result, parent) {
        return (0, _uint.readString)(parent.blockSize)(stream);
      }
    }, subBlocksSchema]
  }, function(stream) {
    var codes = (0, _uint.peekBytes)(2)(stream);
    return codes[0] === 33 && codes[1] === 255;
  });
  var commentSchema = (0, _.conditional)({
    comment: [{
      codes: (0, _uint.readBytes)(2)
    }, subBlocksSchema]
  }, function(stream) {
    var codes = (0, _uint.peekBytes)(2)(stream);
    return codes[0] === 33 && codes[1] === 254;
  });
  var schema = [
    {
      header: [{
        signature: (0, _uint.readString)(3)
      }, {
        version: (0, _uint.readString)(3)
      }]
    },
    {
      lsd: [{
        width: (0, _uint.readUnsigned)(true)
      }, {
        height: (0, _uint.readUnsigned)(true)
      }, {
        gct: (0, _uint.readBits)({
          exists: {
            index: 0
          },
          resolution: {
            index: 1,
            length: 3
          },
          sort: {
            index: 4
          },
          size: {
            index: 5,
            length: 3
          }
        })
      }, {
        backgroundColorIndex: (0, _uint.readByte)()
      }, {
        pixelAspectRatio: (0, _uint.readByte)()
      }]
    },
    (0, _.conditional)({
      gct: (0, _uint.readArray)(3, function(stream, result) {
        return Math.pow(2, result.lsd.gct.size + 1);
      })
    }, function(stream, result) {
      return result.lsd.gct.exists;
    }),
    {
      frames: (0, _.loop)([gceSchema, applicationSchema, commentSchema, imageSchema, textSchema], function(stream) {
        var nextCode = (0, _uint.peekByte)()(stream);
        return nextCode === 33 || nextCode === 44;
      })
    }
  ];
  var _default = schema;
  exports.default = _default;
});

// node_modules/gifuct-js/lib/deinterlace.js
var require_deinterlace = __commonJS(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.deinterlace = undefined;
  var deinterlace = function deinterlace(pixels, width) {
    var newPixels = new Array(pixels.length);
    var rows = pixels.length / width;
    var cpRow = function cpRow(toRow, fromRow) {
      var fromPixels = pixels.slice(fromRow * width, (fromRow + 1) * width);
      newPixels.splice.apply(newPixels, [toRow * width, width].concat(fromPixels));
    };
    var offsets = [0, 4, 2, 1];
    var steps = [8, 8, 4, 2];
    var fromRow = 0;
    for (var pass = 0;pass < 4; pass++) {
      for (var toRow = offsets[pass];toRow < rows; toRow += steps[pass]) {
        cpRow(toRow, fromRow);
        fromRow++;
      }
    }
    return newPixels;
  };
  exports.deinterlace = deinterlace;
});

// node_modules/gifuct-js/lib/lzw.js
var require_lzw = __commonJS(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.lzw = undefined;
  var lzw = function lzw(minCodeSize, data, pixelCount) {
    var MAX_STACK_SIZE = 4096;
    var nullCode = -1;
    var npix = pixelCount;
    var available, clear, code_mask, code_size, end_of_information, in_code, old_code, bits, code, i, datum, data_size, first, top, bi, pi;
    var dstPixels = new Array(pixelCount);
    var prefix = new Array(MAX_STACK_SIZE);
    var suffix = new Array(MAX_STACK_SIZE);
    var pixelStack = new Array(MAX_STACK_SIZE + 1);
    data_size = minCodeSize;
    clear = 1 << data_size;
    end_of_information = clear + 1;
    available = clear + 2;
    old_code = nullCode;
    code_size = data_size + 1;
    code_mask = (1 << code_size) - 1;
    for (code = 0;code < clear; code++) {
      prefix[code] = 0;
      suffix[code] = code;
    }
    var datum, bits, count, first, top, pi, bi;
    datum = bits = count = first = top = pi = bi = 0;
    for (i = 0;i < npix; ) {
      if (top === 0) {
        if (bits < code_size) {
          datum += data[bi] << bits;
          bits += 8;
          bi++;
          continue;
        }
        code = datum & code_mask;
        datum >>= code_size;
        bits -= code_size;
        if (code > available || code == end_of_information) {
          break;
        }
        if (code == clear) {
          code_size = data_size + 1;
          code_mask = (1 << code_size) - 1;
          available = clear + 2;
          old_code = nullCode;
          continue;
        }
        if (old_code == nullCode) {
          pixelStack[top++] = suffix[code];
          old_code = code;
          first = code;
          continue;
        }
        in_code = code;
        if (code == available) {
          pixelStack[top++] = first;
          code = old_code;
        }
        while (code > clear) {
          pixelStack[top++] = suffix[code];
          code = prefix[code];
        }
        first = suffix[code] & 255;
        pixelStack[top++] = first;
        if (available < MAX_STACK_SIZE) {
          prefix[available] = old_code;
          suffix[available] = first;
          available++;
          if ((available & code_mask) === 0 && available < MAX_STACK_SIZE) {
            code_size++;
            code_mask += available;
          }
        }
        old_code = in_code;
      }
      top--;
      dstPixels[pi++] = pixelStack[top];
      i++;
    }
    for (i = pi;i < npix; i++) {
      dstPixels[i] = 0;
    }
    return dstPixels;
  };
  exports.lzw = lzw;
});

// node_modules/gifuct-js/lib/index.js
var require_lib2 = __commonJS(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.decompressFrames = exports.decompressFrame = exports.parseGIF = undefined;
  var _gif = _interopRequireDefault(require_gif());
  var _jsBinarySchemaParser = require_lib();
  var _uint = require_uint8();
  var _deinterlace = require_deinterlace();
  var _lzw = require_lzw();
  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }
  var parseGIF = function parseGIF(arrayBuffer) {
    var byteData = new Uint8Array(arrayBuffer);
    return (0, _jsBinarySchemaParser.parse)((0, _uint.buildStream)(byteData), _gif["default"]);
  };
  exports.parseGIF = parseGIF;
  var generatePatch = function generatePatch(image) {
    var totalPixels = image.pixels.length;
    var patchData = new Uint8ClampedArray(totalPixels * 4);
    for (var i = 0;i < totalPixels; i++) {
      var pos = i * 4;
      var colorIndex = image.pixels[i];
      var color = image.colorTable[colorIndex] || [0, 0, 0];
      patchData[pos] = color[0];
      patchData[pos + 1] = color[1];
      patchData[pos + 2] = color[2];
      patchData[pos + 3] = colorIndex !== image.transparentIndex ? 255 : 0;
    }
    return patchData;
  };
  var decompressFrame = function decompressFrame(frame, gct, buildImagePatch) {
    if (!frame.image) {
      console.warn("gif frame does not have associated image.");
      return;
    }
    var image = frame.image;
    var totalPixels = image.descriptor.width * image.descriptor.height;
    var pixels = (0, _lzw.lzw)(image.data.minCodeSize, image.data.blocks, totalPixels);
    if (image.descriptor.lct.interlaced) {
      pixels = (0, _deinterlace.deinterlace)(pixels, image.descriptor.width);
    }
    var resultImage = {
      pixels,
      dims: {
        top: frame.image.descriptor.top,
        left: frame.image.descriptor.left,
        width: frame.image.descriptor.width,
        height: frame.image.descriptor.height
      }
    };
    if (image.descriptor.lct && image.descriptor.lct.exists) {
      resultImage.colorTable = image.lct;
    } else {
      resultImage.colorTable = gct;
    }
    if (frame.gce) {
      resultImage.delay = (frame.gce.delay || 10) * 10;
      resultImage.disposalType = frame.gce.extras.disposal;
      if (frame.gce.extras.transparentColorGiven) {
        resultImage.transparentIndex = frame.gce.transparentColorIndex;
      }
    }
    if (buildImagePatch) {
      resultImage.patch = generatePatch(resultImage);
    }
    return resultImage;
  };
  exports.decompressFrame = decompressFrame;
  var decompressFrames = function decompressFrames(parsedGif, buildImagePatches) {
    return parsedGif.frames.filter(function(f) {
      return f.image;
    }).map(function(f) {
      return decompressFrame(f, parsedGif.gct, buildImagePatches);
    });
  };
  exports.decompressFrames = decompressFrames;
});

// src/canvas.tsx
import { memo as _$memo } from "@opentui/solid";
import { effect as _$effect } from "@opentui/solid";
import { insert as _$insert } from "@opentui/solid";
import { createTextNode as _$createTextNode } from "@opentui/solid";
import { insertNode as _$insertNode } from "@opentui/solid";
import { setProp as _$setProp } from "@opentui/solid";
import { createElement as _$createElement } from "@opentui/solid";
import { createComponent as _$createComponent } from "@opentui/solid";
import { BaseRenderable, TextAttributes as TextAttributes6 } from "@opentui/core";
import { spawn } from "child_process";
import path5 from "path";

// node_modules/opentui-markdown-render/src/app.tsx
import { createMemo as createMemo6, createSignal as createSignal5, onCleanup as onCleanup4 } from "solid-js";

// node_modules/opentui-markdown-render/src/graphics.ts
import { createMemo, createSignal, onCleanup } from "solid-js";
function resolveGraphicsProtocol(capabilities, hasResolution) {
  const configured = capabilities?.image_protocol;
  if (configured && configured !== "auto")
    return configured === "sixel" && !hasResolution ? "blocks" : configured;
  if (!capabilities || capabilities.multiplexer === "tmux")
    return "blocks";
  if (capabilities.kitty_graphics)
    return "kitty";
  if (capabilities.sixel && hasResolution)
    return "sixel";
  return "blocks";
}
var mosaicScale = (protocol) => protocol === "blocks" ? 2 : 1;
function useCanvasGraphics(renderer) {
  const [queried, setQueried] = createSignal(0);
  const onCapabilities = () => setQueried((value) => value + 1);
  renderer.on("capabilities", onCapabilities);
  let refresh;
  const onResize = () => {
    if (refresh)
      clearTimeout(refresh);
    refresh = setTimeout(() => {
      refresh = undefined;
      setQueried((value) => value + 1);
    }, 250);
  };
  renderer.on("resize", onResize);
  const probe = setInterval(() => {
    if (!renderer.resolution)
      return;
    clearInterval(probe);
    setQueried((value) => value + 1);
  }, 50);
  const stopProbe = setTimeout(() => clearInterval(probe), 1000);
  onCleanup(() => {
    renderer.off("capabilities", onCapabilities);
    renderer.off("resize", onResize);
    clearInterval(probe);
    clearTimeout(stopProbe);
    if (refresh)
      clearTimeout(refresh);
  });
  const resolution = createMemo(() => {
    queried();
    const value = renderer.resolution;
    return value && value.width > 0 && value.height > 0 ? value : null;
  });
  const cell = createMemo(() => {
    const value = resolution();
    const width = renderer.terminalWidth;
    const height = renderer.terminalHeight;
    if (!value || width <= 0 || height <= 0)
      return null;
    const cellWidth = value.width / width;
    const cellHeight = value.height / height;
    if (cellWidth <= 0 || cellHeight <= 0)
      return null;
    return { width: Math.max(1, Math.round(cellWidth)), height: Math.max(1, Math.round(cellHeight)) };
  });
  const protocol = createMemo(() => {
    queried();
    return resolveGraphicsProtocol(renderer.capabilities, resolution() !== null);
  });
  const hyperlinks = createMemo(() => {
    queried();
    return renderer.capabilities?.hyperlinks === true;
  });
  return { cell, protocol, hyperlinks };
}

// node_modules/opentui-markdown-render/src/headings.ts
import { TextAttributes } from "@opentui/core";
var headingLevels = [1, 2, 3, 4, 5, 6];
var defaultHeadingStyles = {
  1: { bold: true, italic: false, underline: true, dim: false, uppercase: false, marginTop: 2, marginBottom: 1 },
  2: { bold: true, italic: false, underline: false, dim: false, uppercase: false, marginTop: 1, marginBottom: 0 },
  3: { bold: true, italic: false, underline: false, dim: false, uppercase: false, marginTop: 1, marginBottom: 0 },
  4: { bold: false, italic: true, underline: false, dim: false, uppercase: false, marginTop: 1, marginBottom: 0 },
  5: { bold: false, italic: true, underline: false, dim: true, uppercase: false, marginTop: 1, marginBottom: 0 },
  6: { bold: false, italic: false, underline: false, dim: true, uppercase: false, marginTop: 1, marginBottom: 0 }
};
function mergeHeadingStyle(base, override) {
  if (!override)
    return base;
  return {
    bold: override.bold ?? base.bold,
    italic: override.italic ?? base.italic,
    underline: override.underline ?? base.underline,
    dim: override.dim ?? base.dim,
    uppercase: override.uppercase ?? base.uppercase,
    marginTop: override.marginTop ?? base.marginTop,
    marginBottom: override.marginBottom ?? base.marginBottom
  };
}
function resolveHeadingStyles(config) {
  const styles = {};
  for (const level of headingLevels) {
    styles[level] = mergeHeadingStyle(defaultHeadingStyles[level], config?.levels?.[`${level}`]);
  }
  return styles;
}
function headingAttributes(style) {
  let attributes = TextAttributes.NONE;
  if (style.bold)
    attributes |= TextAttributes.BOLD;
  if (style.italic)
    attributes |= TextAttributes.ITALIC;
  if (style.underline)
    attributes |= TextAttributes.UNDERLINE;
  if (style.dim)
    attributes |= TextAttributes.DIM;
  return attributes;
}
function headingColor(theme, level) {
  return theme.markdown.headingLevels?.[level - 1] ?? theme.markdown.heading;
}

// node_modules/opentui-markdown-render/src/math/index.ts
import { createHash } from "crypto";

// node_modules/opentui-markdown-render/src/math/native.ts
import path from "path";
import { createRequire } from "module";
var loaded;
function loadNativeMath() {
  loaded ??= importNativeMath();
  return loaded;
}
async function importNativeMath() {
  if (process.platform !== "linux" || process.arch !== "x64")
    return;
  const relative = path.join("prebuilds", "linux-x64-gnu", "opentui_markdown_render.node");
  const candidates = [
    path.join(import.meta.dir, "..", "..", relative),
    path.join(import.meta.dir, relative),
    path.join(import.meta.dir, "node_modules", "opentui-markdown-render", relative)
  ];
  for (const file of candidates) {
    try {
      return createRequire(import.meta.url)(file);
    } catch {}
  }
  return;
}

// node_modules/opentui-markdown-render/src/math/renderer.ts
var limit = 128;
var cache = new Map;
function renderMath(request) {
  if (request.enabled === false)
    return Promise.resolve(undefined);
  const scale = request.scale ?? 2;
  const display = request.display ?? false;
  const cellWidth = request.cellWidth ?? 8;
  const cellHeight = request.cellHeight ?? 16;
  const compact = request.compact ?? false;
  const standard = request.standard ?? false;
  const key = JSON.stringify({
    latex: request.latex,
    scale,
    foreground: request.foreground,
    background: request.background,
    display,
    cellWidth,
    cellHeight,
    compact,
    standard
  });
  const cached = cache.get(key);
  if (cached)
    return cached;
  const result = loadNativeMath().then(async (native) => {
    if (!native)
      return;
    const image = await native.renderLatex({
      latex: request.latex,
      scale,
      foreground: request.foreground,
      background: request.background,
      display,
      cellWidth,
      cellHeight,
      compact,
      standard
    });
    return {
      png: image.png,
      pixelWidth: image.pixelWidth,
      pixelHeight: image.pixelHeight,
      baseline: image.baseline,
      clamped: image.clamped
    };
  }).catch(() => {
    return;
  });
  cache.set(key, result);
  if (cache.size > limit)
    cache.delete(cache.keys().next().value);
  return result;
}

// node_modules/opentui-markdown-render/src/math/validate.ts
function isRenderableLatex(content) {
  let depth = 0;
  let left = 0;
  let right = 0;
  for (let index = 0;index < content.length; index++) {
    const character = content[index];
    if (character === "\\") {
      if (content[index + 1] === undefined)
        return false;
      if (!/[A-Za-z]/.test(content[index + 1])) {
        index++;
        continue;
      }
      let cursor = index + 1;
      while (cursor < content.length && /[A-Za-z]/.test(content[cursor]))
        cursor++;
      const name = content.slice(index, cursor);
      if (name === "\\left")
        left++;
      else if (name === "\\right")
        right++;
      index = cursor - 1;
      continue;
    }
    if (character === "{") {
      depth++;
      continue;
    }
    if (character === "}") {
      if (depth === 0)
        return false;
      depth--;
    }
  }
  return depth === 0 && left === right;
}

// node_modules/opentui-markdown-render/src/math/index.ts
function rgbaToHex(color) {
  const channel = (value) => Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, "0");
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}
function mathImageID(content, display, color, cell, scale = 1, compact = false, standard = false) {
  return createHash("sha256").update(JSON.stringify({ content, display, color, cell, scale, compact, standard, renderer: "mitex-typst-png-v2" })).digest("hex");
}
var fontSizePoints = 12;
async function renderMathImage(content, display, color, background, cell, scale = 1, compact = false, standard = false) {
  const latex = content.trim();
  if (!isRenderableLatex(latex))
    return;
  const cellWidth = cell?.width ?? 8;
  const cellHeight = cell?.height ?? 16;
  const base = cellHeight / fontSizePoints;
  const rendered = await renderMath({
    latex,
    foreground: color,
    background,
    scale: base * scale,
    display,
    cellWidth,
    cellHeight,
    compact,
    standard
  });
  if (!rendered)
    return;
  const columns = Math.max(1, Math.round(rendered.pixelWidth / cellWidth));
  const rows = Math.max(1, Math.round(rendered.pixelHeight / cellHeight));
  const baseline = rendered.baseline / cellHeight;
  return { png: rendered.png, columns, rows, baseline, clamped: rendered.clamped };
}

// node_modules/opentui-markdown-render/src/config/load.ts
import { existsSync, readFileSync, statSync } from "fs";
import os from "os";
import path2 from "path";

// node_modules/ansi-regex/index.js
function ansiRegex({ onlyFirst = false } = {}) {
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const osc = `(?:(?:\\u001B\\]|\\u009D)[^\\u0007\\u001B\\u009C\\u009D]*${ST})`;
  const csi = "[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]";
  const pattern = `${osc}|${csi}`;
  return new RegExp(pattern, onlyFirst ? undefined : "g");
}

// node_modules/strip-ansi/index.js
var regex = ansiRegex();
function stripAnsi(string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  return string.replace(regex, "");
}

// node_modules/get-east-asian-width/lookup-data.js
var ambiguousMinimalCodePoint = 161;
var ambiguousMaximumCodePoint = 1114109;
var ambiguousRanges = [161, 161, 164, 164, 167, 168, 170, 170, 173, 174, 176, 180, 182, 186, 188, 191, 198, 198, 208, 208, 215, 216, 222, 225, 230, 230, 232, 234, 236, 237, 240, 240, 242, 243, 247, 250, 252, 252, 254, 254, 257, 257, 273, 273, 275, 275, 283, 283, 294, 295, 299, 299, 305, 307, 312, 312, 319, 322, 324, 324, 328, 331, 333, 333, 338, 339, 358, 359, 363, 363, 462, 462, 464, 464, 466, 466, 468, 468, 470, 470, 472, 472, 474, 474, 476, 476, 593, 593, 609, 609, 708, 708, 711, 711, 713, 715, 717, 717, 720, 720, 728, 731, 733, 733, 735, 735, 768, 879, 913, 929, 931, 937, 945, 961, 963, 969, 1025, 1025, 1040, 1103, 1105, 1105, 8208, 8208, 8211, 8214, 8216, 8217, 8220, 8221, 8224, 8226, 8228, 8231, 8240, 8240, 8242, 8243, 8245, 8245, 8251, 8251, 8254, 8254, 8308, 8308, 8319, 8319, 8321, 8324, 8364, 8364, 8451, 8451, 8453, 8453, 8457, 8457, 8467, 8467, 8470, 8470, 8481, 8482, 8486, 8486, 8491, 8491, 8531, 8532, 8539, 8542, 8544, 8555, 8560, 8569, 8585, 8585, 8592, 8601, 8632, 8633, 8658, 8658, 8660, 8660, 8679, 8679, 8704, 8704, 8706, 8707, 8711, 8712, 8715, 8715, 8719, 8719, 8721, 8721, 8725, 8725, 8730, 8730, 8733, 8736, 8739, 8739, 8741, 8741, 8743, 8748, 8750, 8750, 8756, 8759, 8764, 8765, 8776, 8776, 8780, 8780, 8786, 8786, 8800, 8801, 8804, 8807, 8810, 8811, 8814, 8815, 8834, 8835, 8838, 8839, 8853, 8853, 8857, 8857, 8869, 8869, 8895, 8895, 8978, 8978, 9312, 9449, 9451, 9547, 9552, 9587, 9600, 9615, 9618, 9621, 9632, 9633, 9635, 9641, 9650, 9651, 9654, 9655, 9660, 9661, 9664, 9665, 9670, 9672, 9675, 9675, 9678, 9681, 9698, 9701, 9711, 9711, 9733, 9734, 9737, 9737, 9742, 9743, 9756, 9756, 9758, 9758, 9792, 9792, 9794, 9794, 9824, 9825, 9827, 9829, 9831, 9834, 9836, 9837, 9839, 9839, 9886, 9887, 9919, 9919, 9926, 9933, 9935, 9939, 9941, 9953, 9955, 9955, 9960, 9961, 9963, 9969, 9972, 9972, 9974, 9977, 9979, 9980, 9982, 9983, 10045, 10045, 10102, 10111, 11094, 11097, 12872, 12879, 57344, 63743, 65024, 65039, 65533, 65533, 127232, 127242, 127248, 127277, 127280, 127337, 127344, 127373, 127375, 127376, 127387, 127404, 917760, 917999, 983040, 1048573, 1048576, 1114109];
var fullwidthMinimalCodePoint = 12288;
var fullwidthMaximumCodePoint = 65510;
var fullwidthRanges = [12288, 12288, 65281, 65376, 65504, 65510];
var wideMinimalCodePoint = 4352;
var wideMaximumCodePoint = 262141;
var wideRanges = [4352, 4447, 8986, 8987, 9001, 9002, 9193, 9196, 9200, 9200, 9203, 9203, 9725, 9726, 9748, 9749, 9776, 9783, 9800, 9811, 9855, 9855, 9866, 9871, 9875, 9875, 9889, 9889, 9898, 9899, 9917, 9918, 9924, 9925, 9934, 9934, 9940, 9940, 9962, 9962, 9970, 9971, 9973, 9973, 9978, 9978, 9981, 9981, 9989, 9989, 9994, 9995, 10024, 10024, 10060, 10060, 10062, 10062, 10067, 10069, 10071, 10071, 10133, 10135, 10160, 10160, 10175, 10175, 11035, 11036, 11088, 11088, 11093, 11093, 11904, 11929, 11931, 12019, 12032, 12245, 12272, 12287, 12289, 12350, 12353, 12438, 12441, 12543, 12549, 12591, 12593, 12686, 12688, 12773, 12783, 12830, 12832, 12871, 12880, 42124, 42128, 42182, 43360, 43388, 44032, 55203, 63744, 64255, 65040, 65049, 65072, 65106, 65108, 65126, 65128, 65131, 94176, 94180, 94192, 94198, 94208, 101594, 101631, 101664, 101760, 101874, 101888, 102801, 102816, 102866, 110576, 110579, 110581, 110587, 110589, 110590, 110592, 110888, 110898, 110898, 110928, 110930, 110933, 110933, 110948, 110952, 110960, 111355, 119552, 119638, 119648, 119670, 126980, 126980, 127183, 127183, 127374, 127374, 127377, 127386, 127406, 127406, 127488, 127490, 127504, 127547, 127552, 127560, 127568, 127569, 127584, 127589, 127744, 127776, 127789, 127797, 127799, 127868, 127870, 127891, 127904, 127946, 127951, 127955, 127968, 127984, 127988, 127988, 127992, 128062, 128064, 128064, 128066, 128252, 128255, 128317, 128331, 128334, 128336, 128359, 128378, 128378, 128405, 128406, 128420, 128420, 128507, 128591, 128640, 128709, 128716, 128716, 128720, 128722, 128725, 128729, 128732, 128735, 128747, 128748, 128756, 128764, 128986, 128986, 128992, 129003, 129008, 129008, 129292, 129338, 129340, 129349, 129351, 129535, 129648, 129660, 129664, 129734, 129736, 129736, 129740, 129757, 129759, 129771, 129775, 129786, 131072, 196605, 196608, 262141];

// node_modules/get-east-asian-width/utilities.js
var isInRange = (ranges, codePoint) => {
  let low = 0;
  let high = Math.floor(ranges.length / 2) - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const i = mid * 2;
    if (codePoint < ranges[i]) {
      high = mid - 1;
    } else if (codePoint > ranges[i + 1]) {
      low = mid + 1;
    } else {
      return true;
    }
  }
  return false;
};

// node_modules/get-east-asian-width/lookup.js
var commonCjkCodePoint = 19968;
var [wideFastPathStart, wideFastPathEnd] = /* @__PURE__ */ findWideFastPathRange(wideRanges);
function findWideFastPathRange(ranges) {
  let fastPathStart = ranges[0];
  let fastPathEnd = ranges[1];
  for (let index = 0;index < ranges.length; index += 2) {
    const start = ranges[index];
    const end = ranges[index + 1];
    if (commonCjkCodePoint >= start && commonCjkCodePoint <= end) {
      return [start, end];
    }
    if (end - start > fastPathEnd - fastPathStart) {
      fastPathStart = start;
      fastPathEnd = end;
    }
  }
  return [fastPathStart, fastPathEnd];
}
var isAmbiguous = (codePoint) => {
  if (codePoint < ambiguousMinimalCodePoint || codePoint > ambiguousMaximumCodePoint) {
    return false;
  }
  return isInRange(ambiguousRanges, codePoint);
};
var isFullwidth = (codePoint) => {
  if (codePoint < fullwidthMinimalCodePoint || codePoint > fullwidthMaximumCodePoint) {
    return false;
  }
  return isInRange(fullwidthRanges, codePoint);
};
var isWide = (codePoint) => {
  if (codePoint >= wideFastPathStart && codePoint <= wideFastPathEnd) {
    return true;
  }
  if (codePoint < wideMinimalCodePoint || codePoint > wideMaximumCodePoint) {
    return false;
  }
  return isInRange(wideRanges, codePoint);
};

// node_modules/get-east-asian-width/index.js
function validate(codePoint) {
  if (!Number.isSafeInteger(codePoint)) {
    throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
  }
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
  validate(codePoint);
  if (isFullwidth(codePoint) || isWide(codePoint) || ambiguousAsWide && isAmbiguous(codePoint)) {
    return 2;
  }
  return 1;
}

// node_modules/emoji-regex/index.mjs
var emoji_regex_default = () => {
  return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
};

// node_modules/string-width/index.js
var segmenter = new Intl.Segmenter;
var defaultIgnorableCodePointRegex = /^\p{Default_Ignorable_Code_Point}$/u;
function stringWidth(string, options = {}) {
  if (typeof string !== "string" || string.length === 0) {
    return 0;
  }
  const {
    ambiguousIsNarrow = true,
    countAnsiEscapeCodes = false
  } = options;
  if (!countAnsiEscapeCodes) {
    string = stripAnsi(string);
  }
  if (string.length === 0) {
    return 0;
  }
  let width = 0;
  const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
  for (const { segment: character } of segmenter.segment(string)) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159) {
      continue;
    }
    if (codePoint >= 8203 && codePoint <= 8207 || codePoint === 65279) {
      continue;
    }
    if (codePoint >= 768 && codePoint <= 879 || codePoint >= 6832 && codePoint <= 6911 || codePoint >= 7616 && codePoint <= 7679 || codePoint >= 8400 && codePoint <= 8447 || codePoint >= 65056 && codePoint <= 65071) {
      continue;
    }
    if (codePoint >= 55296 && codePoint <= 57343) {
      continue;
    }
    if (codePoint >= 65024 && codePoint <= 65039) {
      continue;
    }
    if (defaultIgnorableCodePointRegex.test(character)) {
      continue;
    }
    if (emoji_regex_default().test(character)) {
      width += 2;
      continue;
    }
    width += eastAsianWidth(codePoint, eastAsianWidthOptions);
  }
  return width;
}

// node_modules/opentui-markdown-render/src/core/frame.ts
var frameAligns = ["left", "center", "right"];
function isFrameAlign(value) {
  return typeof value === "string" && frameAligns.includes(value);
}
var frameStyles = ["box", "ascii", "rounded", "heavy", "double"];
function isFrameStyle(value) {
  return typeof value === "string" && frameStyles.includes(value);
}
var borderWidth = 1;
var noInsets = { left: 0, right: 0, top: 0, bottom: 0 };
function whole(value, fallback) {
  if (value === undefined)
    return fallback;
  if (!Number.isFinite(value))
    return fallback;
  return Math.max(0, Math.floor(value));
}
function alignOffset(align, available, width) {
  if (align === "right")
    return Math.max(0, available - width);
  if (align === "center")
    return Math.max(0, Math.floor((available - width) / 2));
  return 0;
}
function fitTitle(title, columns) {
  if (!title || columns <= 0)
    return;
  let result = "";
  for (const character of title) {
    if (stringWidth(result + character) > columns)
      break;
    result += character;
  }
  return result || undefined;
}
function resolveFrame(viewport, config) {
  const available = Math.max(1, Math.floor(viewport) || 1);
  const align = config?.align ?? "left";
  const style = config?.style ?? "box";
  const titleAlign = config?.titleAlign ?? "left";
  const enabled = config?.enabled ?? false;
  if (!enabled) {
    return {
      enabled: false,
      contentWidth: available,
      width: available,
      offsetX: 0,
      insets: noInsets,
      align,
      style,
      paddingX: 0,
      paddingY: 0,
      title: undefined,
      titleAlign
    };
  }
  const paddingX = whole(config?.paddingX, 1);
  const paddingY = whole(config?.paddingY, 0);
  const insets = {
    left: borderWidth + paddingX,
    right: borderWidth + paddingX,
    top: borderWidth + paddingY,
    bottom: borderWidth + paddingY
  };
  const minWidth = insets.left + insets.right + 1;
  const width = config?.width === undefined ? available : Math.max(minWidth, Math.min(available, Math.floor(config.width)));
  const contentWidth = Math.max(1, width - insets.left - insets.right);
  return {
    enabled: true,
    contentWidth,
    width,
    offsetX: alignOffset(align, available, width),
    insets,
    align,
    style,
    paddingX,
    paddingY,
    title: fitTitle(config?.title, Math.max(0, width - borderWidth * 2 - 2)),
    titleAlign
  };
}

// node_modules/opentui-markdown-render/src/core/tables.ts
var tableWidthModes = ["content", "full"];
function isTableWidthMode(value) {
  return typeof value === "string" && tableWidthModes.includes(value);
}
var tableOverflows = ["scroll", "wrap"];
function isTableOverflow(value) {
  return typeof value === "string" && tableOverflows.includes(value);
}
var tableColumnFitters = ["proportional", "balanced"];
function isTableColumnFitter(value) {
  return typeof value === "string" && tableColumnFitters.includes(value);
}
function resolveTableOptions(config) {
  const widthMode = config?.widthMode ?? "content";
  const overflow = config?.overflow ?? "scroll";
  return {
    widthMode,
    overflow,
    columnFitter: config?.columnFitter ?? "balanced",
    cellPaddingX: config?.cellPaddingX ?? 1,
    wrapMode: overflow === "scroll" && widthMode === "content" ? "none" : "word"
  };
}

// node_modules/opentui-markdown-render/src/config/types.ts
var statusLineStyles = ["plain", "bar"];
function isStatusLineStyle(value) {
  return typeof value === "string" && statusLineStyles.includes(value);
}
var headingLevelKeys = ["1", "2", "3", "4", "5", "6"];
function isHeadingLevelKey(value) {
  return headingLevelKeys.includes(value);
}
var statusLineFields = [
  "title",
  "mode",
  "protocol",
  "cell",
  "mathScale",
  "position",
  "hint",
  "text"
];
function isStatusLineField(value) {
  return typeof value === "string" && statusLineFields.includes(value);
}

// node_modules/opentui-markdown-render/src/config/theme.ts
var colorNames = new Set([
  "transparent",
  "black",
  "white",
  "red",
  "green",
  "blue",
  "yellow",
  "cyan",
  "magenta",
  "silver",
  "gray",
  "grey",
  "maroon",
  "olive",
  "lime",
  "aqua",
  "teal",
  "navy",
  "fuchsia",
  "purple",
  "orange",
  "brightblack",
  "brightred",
  "brightgreen",
  "brightblue",
  "brightyellow",
  "brightcyan",
  "brightmagenta",
  "brightwhite"
]);
var colors = (keys) => Object.fromEntries(keys.map((key) => [key, "color"]));
var themeFileFields = {
  mode: "mode",
  palette: "colors",
  accent: "color",
  categorical: "colors",
  text: {
    base: "color",
    muted: "color",
    feedback: colors(["error", "warning", "success", "info"]),
    action: { primary: { focused: "color" } }
  },
  background: { base: "color" },
  border: { base: "color" },
  frame: colors(["border", "title"]),
  statusline: colors(["background", "foreground", "title", "muted", "border"]),
  markdown: colors([
    "text",
    "heading",
    "heading1",
    "heading2",
    "heading3",
    "heading4",
    "heading5",
    "heading6",
    "link",
    "linkText",
    "code",
    "blockQuote",
    "emphasis",
    "strong",
    "horizontalRule",
    "listItem",
    "listEnumeration",
    "image",
    "imageText",
    "codeBlock"
  ]),
  syntax: colors(["comment", "keyword", "function", "variable", "string", "number", "type", "operator", "punctuation"]),
  diff: {
    text: colors(["added", "removed", "context"]),
    background: colors(["added", "removed", "context"])
  }
};
function isColor(value) {
  return typeof value === "string" && (/^#?(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value) || colorNames.has(value.toLowerCase()));
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function validateTheme(value, file, report) {
  const warn = (message) => {
    if (report)
      report(message);
    else
      console.warn(`[opentui-markdown-render] ${message}`);
  };
  const validate = (source, fields, prefix) => {
    const result = Object.create(null);
    for (const [key, entry] of Object.entries(source)) {
      const field = Object.hasOwn(fields, key) ? fields[key] : undefined;
      const location = `${prefix}.${key}`;
      if (field === undefined) {
        warn(`Unknown theme option "${location}" in ${file}`);
        continue;
      }
      if (field === "color" && isColor(entry))
        result[key] = entry;
      else if (field === "mode" && (entry === "light" || entry === "dark" || entry === "solarized-light" || entry === "solarized-dark"))
        result[key] = entry;
      else if (field === "colors" && Array.isArray(entry)) {
        result[key] = entry.filter((color, index) => {
          if (isColor(color))
            return true;
          warn(`Invalid theme option "${location}[${index}]" in ${file}`);
          return false;
        });
      } else if (typeof field === "object" && isRecord(entry)) {
        result[key] = validate(entry, field, location);
      } else {
        warn(`Invalid theme option "${location}" in ${file}`);
      }
    }
    return result;
  };
  return validate(value, themeFileFields, "theme");
}
function validateThemeConfig(value, file, report) {
  const warn = (message) => {
    if (report)
      report(message);
    else
      console.warn(`[opentui-markdown-render] ${message}`);
  };
  const result = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key !== "name") {
      warn(`Unknown theme option "theme.${key}" in ${file}`);
      continue;
    }
    if (typeof entry !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(entry)) {
      warn(`Invalid theme option "theme.name" in ${file}`);
      continue;
    }
    result.name = entry;
  }
  return result;
}

// node_modules/opentui-markdown-render/src/config/load.ts
var configFilenames = ["opentui-markdown-render.jsonc", "opentui-markdown-render.json"];
var xdgConfigFilenames = ["config.jsonc", "config.json"];
var xdgConfigDirectory = "otmd";
function warn(report, message) {
  if (report)
    report(message);
  else
    console.warn(`[opentui-markdown-render] ${message}`);
}
function loadConfig(explicitPath, cwd, report) {
  const file = explicitPath ?? discoverConfig(cwd ?? process.cwd());
  if (!file)
    return {};
  if (!existsSync(file)) {
    if (explicitPath)
      throw new Error(`Config not found: ${file}`);
    return {};
  }
  return parseConfig(readFileSync(file, "utf8"), file, report);
}
function loadRendererConfig(configPath, cwd, options = {}) {
  if (options.discover === false && !configPath)
    return {};
  try {
    return loadConfig(configPath, cwd, options.report);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warn(options.report, message);
    return {};
  }
}
function discoverConfig(start, environment = { XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME, HOME: process.env.HOME }) {
  let directory = path2.resolve(start);
  while (true) {
    for (const name of configFilenames) {
      const candidate = path2.join(directory, name);
      if (existsSync(candidate) && statSync(candidate).isFile())
        return candidate;
    }
    const parent = path2.dirname(directory);
    if (parent === directory)
      break;
    directory = parent;
  }
  return discoverXdgConfig(environment);
}
function discoverXdgConfig(environment) {
  const configured = environment.XDG_CONFIG_HOME;
  const configHome = configured && path2.isAbsolute(configured) ? configured : path2.join(environment.HOME || os.homedir(), ".config");
  const directory = path2.join(configHome, xdgConfigDirectory);
  for (const name of xdgConfigFilenames) {
    const candidate = path2.join(directory, name);
    if (existsSync(candidate) && statSync(candidate).isFile())
      return candidate;
  }
  return;
}
function parseConfig(source, file = "config", report) {
  const parsed = parseJsonc(source, file);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Invalid config ${file}: expected a JSON object`);
  }
  return validateConfig(parsed, file, report);
}
function parseJsonc(source, file = "config") {
  try {
    return JSON.parse(stripJsonComments(source));
  } catch (error) {
    throw new Error(`Invalid config ${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
var sections = ["theme", "statusline", "images", "mermaid", "headings", "frame", "tables"];
function validateConfig(value, file, report) {
  for (const key of Object.keys(value)) {
    if (key === "$schema")
      continue;
    if (!sections.includes(key)) {
      warn(report, `Unknown config section "${key}" in ${file}`);
    }
  }
  return {
    theme: isRecord2(value.theme) ? validateThemeConfig(value.theme, file, report) : undefined,
    statusline: isRecord2(value.statusline) ? validateStatusLine(value.statusline, file, report) : undefined,
    images: isRecord2(value.images) ? validateImages(value.images) : undefined,
    mermaid: isRecord2(value.mermaid) ? validateMermaid(value.mermaid, file, report) : undefined,
    headings: isRecord2(value.headings) ? validateHeadings(value.headings, file, report) : undefined,
    frame: isRecord2(value.frame) ? validateFrame(value.frame, file, report) : undefined,
    tables: isRecord2(value.tables) ? validateTables(value.tables, file, report) : undefined
  };
}
function validateStatusLine(value, file, report) {
  const fields = [];
  if (Array.isArray(value.fields)) {
    for (const entry of value.fields) {
      if (isStatusLineField(entry))
        fields.push(entry);
      else
        warn(report, `Unknown status line field "${String(entry)}" in ${file}`);
    }
  }
  if (value.style !== undefined && !isStatusLineStyle(value.style)) {
    warn(report, `Unknown status line style "${String(value.style)}" in ${file}`);
  }
  if (value.highlight !== undefined && !isStatusLineField(value.highlight)) {
    warn(report, `Unknown status line field "${String(value.highlight)}" in ${file}`);
  }
  return {
    enabled: typeof value.enabled === "boolean" ? value.enabled : undefined,
    fields: fields.length ? fields : undefined,
    separator: typeof value.separator === "string" ? value.separator : undefined,
    border: value.border === "none" || value.border === "top" || value.border === "bottom" ? value.border : undefined,
    style: isStatusLineStyle(value.style) ? value.style : undefined,
    highlight: isStatusLineField(value.highlight) ? value.highlight : undefined
  };
}
function validateImages(value) {
  return {
    maxColumns: positiveInteger(value.maxColumns),
    maxRows: positiveInteger(value.maxRows)
  };
}
function validateMermaid(value, file, report) {
  if (value.classLayout !== undefined && value.classLayout !== "builtin" && value.classLayout !== "dagre") {
    warn(report, `Unknown Mermaid class layout "${String(value.classLayout)}" in ${file}`);
  }
  return {
    compact: typeof value.compact === "boolean" ? value.compact : undefined,
    layoutMaxWidth: positiveInteger(value.layoutMaxWidth),
    classLayout: value.classLayout === "dagre" || value.classLayout === "builtin" ? value.classLayout : undefined
  };
}
function validateFrame(value, file, report) {
  const option = (name, check) => {
    const entry = value[name];
    if (entry === undefined)
      return;
    if (check(entry))
      return entry;
    warn(report, `Invalid frame option "${name}" in ${file}`);
    return;
  };
  const padding = (name) => {
    const entry = value[name];
    if (entry === undefined)
      return;
    if (isNonNegativeInteger(entry))
      return entry;
    warn(report, `Invalid frame option "${name}" in ${file}`);
    return;
  };
  const boolean = (name) => {
    const entry = value[name];
    if (entry === undefined)
      return;
    if (typeof entry === "boolean")
      return entry;
    warn(report, `Invalid frame option "${name}" in ${file}`);
    return;
  };
  const width = (() => {
    const entry = value.width;
    if (entry === undefined)
      return;
    if (typeof entry === "number" && Number.isInteger(entry) && entry > 0)
      return entry;
    warn(report, `Invalid frame option "width" in ${file}`);
    return;
  })();
  const title = value.title;
  if (title !== undefined && typeof title !== "string") {
    warn(report, `Invalid frame option "title" in ${file}`);
  }
  return {
    enabled: boolean("enabled"),
    width,
    align: option("align", isFrameAlign),
    style: option("style", isFrameStyle),
    paddingX: padding("paddingX"),
    paddingY: padding("paddingY"),
    title: typeof title === "string" ? title : undefined,
    titleAlign: option("titleAlign", isFrameAlign)
  };
}
function validateTables(value, file, report) {
  const option = (name, check) => {
    const entry = value[name];
    if (entry === undefined)
      return;
    if (check(entry))
      return entry;
    warn(report, `Invalid tables option "${name}" in ${file}`);
    return;
  };
  const padding = value.cellPaddingX;
  if (padding !== undefined && !isNonNegativeInteger(padding)) {
    warn(report, `Invalid tables option "cellPaddingX" in ${file}`);
  }
  return {
    widthMode: option("widthMode", isTableWidthMode),
    overflow: option("overflow", isTableOverflow),
    columnFitter: option("columnFitter", isTableColumnFitter),
    cellPaddingX: isNonNegativeInteger(padding) ? padding : undefined
  };
}
function validateHeadings(value, file, report) {
  if (value.levels !== undefined && !isRecord2(value.levels)) {
    warn(report, `Invalid heading levels in ${file}`);
    return;
  }
  const levels = {};
  for (const [key, entry] of Object.entries(value.levels ?? {})) {
    if (!isHeadingLevelKey(key)) {
      warn(report, `Unknown heading level "${key}" in ${file}`);
      continue;
    }
    if (!isRecord2(entry)) {
      warn(report, `Invalid heading level "${key}" in ${file}`);
      continue;
    }
    levels[key] = validateHeadingLevel(key, entry, file, report);
  }
  return Object.keys(levels).length ? { levels } : undefined;
}
function validateHeadingLevel(key, value, file, report) {
  const style = {};
  for (const [name, entry] of Object.entries(value)) {
    switch (name) {
      case "bold":
      case "italic":
      case "underline":
      case "dim":
      case "uppercase":
        if (typeof entry !== "boolean") {
          warn(report, `Invalid heading option "${name}" for level ${key} in ${file}`);
          continue;
        }
        style[name] = entry;
        break;
      case "marginTop":
      case "marginBottom":
        if (!isNonNegativeInteger(entry)) {
          warn(report, `Invalid heading option "${name}" for level ${key} in ${file}`);
          continue;
        }
        style[name] = entry;
        break;
      default:
        warn(report, `Unknown heading option "${name}" for level ${key} in ${file}`);
    }
  }
  return style;
}
function isNonNegativeInteger(value) {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}
function positiveInteger(value) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}
function isRecord2(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function stripJsonComments(source) {
  let result = "";
  let index = 0;
  let inString = false;
  let quote = "";
  while (index < source.length) {
    const character = source[index];
    if (inString) {
      result += character;
      if (character === "\\") {
        result += source[index + 1] ?? "";
        index += 2;
        continue;
      }
      if (character === quote)
        inString = false;
      index++;
      continue;
    }
    if (character === '"' || character === "'") {
      inString = true;
      quote = character;
      result += character;
      index++;
      continue;
    }
    if (character === "/" && source[index + 1] === "/") {
      while (index < source.length && source[index] !== `
`)
        index++;
      continue;
    }
    if (character === "/" && source[index + 1] === "*") {
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/"))
        index++;
      index += 2;
      continue;
    }
    result += character;
    index++;
  }
  return result.replace(/,(\s*[}\]])/g, "$1");
}
// node_modules/opentui-markdown-render/src/theme/resolve.ts
import { parseColor } from "@opentui/core";

// node_modules/opentui-markdown-render/src/theme/defaults.ts
import { RGBA } from "@opentui/core";
var h = (hex) => RGBA.fromHex(hex);
var solarizedPalette = [
  "#002b36",
  "#073642",
  "#586e75",
  "#657b83",
  "#839496",
  "#93a1a1",
  "#eee8d5",
  "#fdf6e3",
  "#b58900",
  "#cb4b16",
  "#dc322f",
  "#d33682",
  "#6c71c4",
  "#268bd2",
  "#2aa198",
  "#859900"
].map(h);
var light = {
  mode: "light",
  accent: h("#0969da"),
  categorical: [h("#0969da"), h("#8250df"), h("#1a7f37"), h("#9a6700"), h("#cf222e"), h("#bc4c00")],
  text: {
    base: h("#1f2328"),
    muted: h("#59636e"),
    feedback: {
      error: h("#cf222e"),
      warning: h("#9a6700"),
      success: h("#1a7f37"),
      info: h("#0969da")
    },
    action: { primary: { focused: h("#0969da") } }
  },
  background: { base: h("#ffffff") },
  border: { base: h("#8c959f") },
  frame: { border: h("#8c959f"), title: h("#59636e") },
  markdown: {
    text: h("#1f2328"),
    heading: h("#8250df"),
    headingLevels: [h("#0969da"), h("#8250df"), h("#8250df"), h("#6f42c1"), h("#3d444d"), h("#3d444d")],
    link: h("#0969da"),
    linkText: h("#0969da"),
    code: h("#953800"),
    blockQuote: h("#59636e"),
    emphasis: h("#1f2328"),
    strong: h("#1f2328"),
    horizontalRule: h("#d1d9e0"),
    listItem: h("#1f2328"),
    listEnumeration: h("#1f2328"),
    image: h("#0969da"),
    imageText: h("#0969da"),
    codeBlock: h("#1f2328")
  },
  syntax: {
    comment: h("#59636e"),
    keyword: h("#cf222e"),
    function: h("#8250df"),
    variable: h("#1f2328"),
    string: h("#0a3069"),
    number: h("#0550ae"),
    type: h("#0550ae"),
    operator: h("#0550ae"),
    punctuation: h("#1f2328")
  },
  diff: {
    text: { added: h("#1a7f37"), removed: h("#cf222e"), context: h("#59636e") },
    background: { added: h("#dafbe1"), removed: h("#ffebe9"), context: h("#f6f8fa") }
  }
};
var dark = {
  mode: "dark",
  accent: h("#58a6ff"),
  categorical: [h("#58a6ff"), h("#d2a8ff"), h("#3fb950"), h("#d29922"), h("#f85149"), h("#ffa657")],
  text: {
    base: h("#e6edf3"),
    muted: h("#8b949e"),
    feedback: {
      error: h("#f85149"),
      warning: h("#d29922"),
      success: h("#3fb950"),
      info: h("#58a6ff")
    },
    action: { primary: { focused: h("#58a6ff") } }
  },
  background: { base: h("#0d1117") },
  border: { base: h("#30363d") },
  frame: { border: h("#30363d"), title: h("#8b949e") },
  markdown: {
    text: h("#e6edf3"),
    heading: h("#d2a8ff"),
    headingLevels: [h("#58a6ff"), h("#d2a8ff"), h("#d2a8ff"), h("#8b949e"), h("#8b949e"), h("#8b949e")],
    link: h("#58a6ff"),
    linkText: h("#58a6ff"),
    code: h("#ffa657"),
    blockQuote: h("#8b949e"),
    emphasis: h("#e6edf3"),
    strong: h("#e6edf3"),
    horizontalRule: h("#30363d"),
    listItem: h("#e6edf3"),
    listEnumeration: h("#e6edf3"),
    image: h("#58a6ff"),
    imageText: h("#58a6ff"),
    codeBlock: h("#e6edf3")
  },
  syntax: {
    comment: h("#8b949e"),
    keyword: h("#ff7b72"),
    function: h("#d2a8ff"),
    variable: h("#ffa657"),
    string: h("#a5d6ff"),
    number: h("#79c0ff"),
    type: h("#ffa657"),
    operator: h("#ff7b72"),
    punctuation: h("#c9d1d9")
  },
  diff: {
    text: { added: h("#3fb950"), removed: h("#f85149"), context: h("#8b949e") },
    background: { added: h("#12261e"), removed: h("#25171c"), context: h("#161b22") }
  }
};
var solarizedLight = {
  mode: "light",
  palette: solarizedPalette,
  accent: h("#268bd2"),
  categorical: [h("#268bd2"), h("#6c71c4"), h("#859900"), h("#b58900"), h("#dc322f"), h("#cb4b16")],
  text: {
    base: h("#586e75"),
    muted: h("#657b83"),
    feedback: { error: h("#dc322f"), warning: h("#b58900"), success: h("#859900"), info: h("#268bd2") },
    action: { primary: { focused: h("#268bd2") } }
  },
  background: { base: h("#fdf6e3") },
  border: { base: h("#657b83") },
  frame: { border: h("#657b83"), title: h("#586e75") },
  markdown: {
    text: h("#586e75"),
    heading: h("#268bd2"),
    headingLevels: [h("#268bd2"), h("#268bd2"), h("#268bd2"), h("#268bd2"), h("#268bd2"), h("#268bd2")],
    link: h("#268bd2"),
    linkText: h("#268bd2"),
    code: h("#cb4b16"),
    blockQuote: h("#657b83"),
    emphasis: h("#586e75"),
    strong: h("#586e75"),
    horizontalRule: h("#657b83"),
    listItem: h("#586e75"),
    listEnumeration: h("#586e75"),
    image: h("#268bd2"),
    imageText: h("#268bd2"),
    codeBlock: h("#586e75")
  },
  syntax: {
    comment: h("#657b83"),
    keyword: h("#dc322f"),
    function: h("#6c71c4"),
    variable: h("#586e75"),
    string: h("#2aa198"),
    number: h("#d33682"),
    type: h("#b58900"),
    operator: h("#268bd2"),
    punctuation: h("#586e75")
  },
  diff: {
    text: { added: h("#859900"), removed: h("#dc322f"), context: h("#657b83") },
    background: { added: h("#eee8d5"), removed: h("#eee8d5"), context: h("#eee8d5") }
  }
};
var solarizedDark = {
  mode: "dark",
  palette: solarizedPalette,
  accent: h("#268bd2"),
  categorical: [h("#268bd2"), h("#6c71c4"), h("#859900"), h("#b58900"), h("#dc322f"), h("#cb4b16")],
  text: {
    base: h("#93a1a1"),
    muted: h("#839496"),
    feedback: { error: h("#dc322f"), warning: h("#b58900"), success: h("#859900"), info: h("#268bd2") },
    action: { primary: { focused: h("#268bd2") } }
  },
  background: { base: h("#002b36") },
  border: { base: h("#586e75") },
  frame: { border: h("#586e75"), title: h("#93a1a1") },
  markdown: {
    text: h("#93a1a1"),
    heading: h("#268bd2"),
    headingLevels: [h("#268bd2"), h("#268bd2"), h("#268bd2"), h("#268bd2"), h("#268bd2"), h("#268bd2")],
    link: h("#268bd2"),
    linkText: h("#268bd2"),
    code: h("#cb4b16"),
    blockQuote: h("#839496"),
    emphasis: h("#93a1a1"),
    strong: h("#93a1a1"),
    horizontalRule: h("#586e75"),
    listItem: h("#93a1a1"),
    listEnumeration: h("#93a1a1"),
    image: h("#268bd2"),
    imageText: h("#268bd2"),
    codeBlock: h("#93a1a1")
  },
  syntax: {
    comment: h("#839496"),
    keyword: h("#dc322f"),
    function: h("#6c71c4"),
    variable: h("#93a1a1"),
    string: h("#2aa198"),
    number: h("#d33682"),
    type: h("#b58900"),
    operator: h("#268bd2"),
    punctuation: h("#93a1a1")
  },
  diff: {
    text: { added: h("#859900"), removed: h("#dc322f"), context: h("#839496") },
    background: { added: h("#073642"), removed: h("#073642"), context: h("#073642") }
  }
};
function defaultTheme(preset) {
  switch (preset) {
    case "light":
      return light;
    case "dark":
      return dark;
    case "solarized-light":
      return solarizedLight;
    case "solarized-dark":
      return solarizedDark;
  }
}

// node_modules/opentui-markdown-render/src/theme/colors.ts
import { RGBA as RGBA2 } from "@opentui/core";
function mixColors(over, base, ratio) {
  const weight = Math.min(Math.max(ratio, 0), 1);
  const [overR, overG, overB] = over.toInts();
  const [baseR, baseG, baseB] = base.toInts();
  const channel = (from, to) => Math.round(to + (from - to) * weight);
  return RGBA2.fromInts(channel(overR, baseR), channel(overG, baseG), channel(overB, baseB), 255);
}

// node_modules/opentui-markdown-render/src/theme/resolve.ts
function resolveTheme(options) {
  const override = options.override;
  const mode = override?.mode ?? options.mode ?? "light";
  return mergeTheme(defaultTheme(mode), override);
}
function deriveStatusLineTheme(theme) {
  const ratio = theme.mode === "light" ? 0.12 : 0.14;
  return {
    background: theme.palette?.[theme.mode === "light" ? 6 : 1] ?? mixColors(theme.accent, theme.background.base, ratio),
    foreground: theme.text.base,
    title: theme.accent,
    muted: theme.text.muted,
    border: theme.accent
  };
}
function mergeTheme(base, override) {
  if (!override)
    return base;
  const color = (value, fallback) => value === undefined ? fallback : parseColor(value);
  const accent = color(override.accent, base.accent);
  const palette = override.palette ? override.palette.map((entry) => parseColor(entry)) : base.palette;
  const background = { base: color(override.background?.base, base.background.base) };
  const text = {
    base: color(override.text?.base, base.text.base),
    muted: color(override.text?.muted, base.text.muted)
  };
  const border = { base: color(override.border?.base, base.border.base) };
  const frame = {
    border: color(override.frame?.border, override.border?.base !== undefined ? border.base : base.frame?.border ?? border.base),
    title: color(override.frame?.title, override.text?.muted !== undefined ? text.muted : base.frame?.title ?? text.muted)
  };
  const mode = override.mode ? override.mode.endsWith("light") ? "light" : "dark" : base.mode;
  const derived = deriveStatusLineTheme({ mode, accent, background, text, palette });
  return {
    mode,
    palette,
    accent,
    categorical: override.categorical ? override.categorical.map((entry) => parseColor(entry)) : base.categorical,
    text: {
      base: text.base,
      muted: text.muted,
      feedback: {
        error: color(override.text?.feedback?.error, base.text.feedback.error),
        warning: color(override.text?.feedback?.warning, base.text.feedback.warning),
        success: color(override.text?.feedback?.success, base.text.feedback.success),
        info: color(override.text?.feedback?.info, base.text.feedback.info)
      },
      action: {
        primary: { focused: color(override.text?.action?.primary?.focused, base.text.action.primary.focused) }
      }
    },
    background,
    border,
    frame,
    statusline: mergeStatusLineTheme(derived, base.statusline, override.statusline),
    markdown: mergeMarkdownTheme(base.markdown, override.markdown),
    syntax: mergeColors(base.syntax, override.syntax),
    diff: {
      text: {
        added: color(override.diff?.text?.added, base.diff.text.added),
        removed: color(override.diff?.text?.removed, base.diff.text.removed),
        context: color(override.diff?.text?.context, base.diff.text.context)
      },
      background: {
        added: color(override.diff?.background?.added, base.diff.background.added),
        removed: color(override.diff?.background?.removed, base.diff.background.removed),
        context: color(override.diff?.background?.context, base.diff.background.context)
      }
    }
  };
}
function mergeStatusLineTheme(derived, base, override) {
  const color = (value, fallback) => value === undefined ? fallback : parseColor(value);
  const pick = (key) => color(override?.[key], base?.[key] ?? derived[key]);
  return {
    background: pick("background"),
    foreground: pick("foreground"),
    title: pick("title"),
    muted: pick("muted"),
    border: pick("border")
  };
}
function mergeColors(base, override) {
  if (!override)
    return base;
  const merged = { ...base };
  for (const key of Object.keys(base)) {
    const value = override[key];
    if (value !== undefined)
      merged[key] = parseColor(value);
  }
  return merged;
}
function mergeMarkdownTheme(base, override) {
  const levels = override ?? {};
  const pick = (level, fallback) => {
    const color = levels[`heading${level}`];
    if (color !== undefined)
      return parseColor(color);
    if (levels.heading !== undefined)
      return parseColor(levels.heading);
    return fallback;
  };
  const [one, two, three, four, five, six] = base.headingLevels ?? [
    base.heading,
    base.heading,
    base.heading,
    base.heading,
    base.heading,
    base.heading
  ];
  const headingLevels = [
    pick(1, one),
    pick(2, two),
    pick(3, three),
    pick(4, four),
    pick(5, five),
    pick(6, six)
  ];
  const { headingLevels: _levels, ...colors } = base;
  const merged = mergeColors(colors, override);
  return { ...merged, headingLevels };
}

// node_modules/opentui-markdown-render/src/theme/load.ts
import { existsSync as existsSync2, readFileSync as readFileSync2, statSync as statSync2 } from "fs";
import os2 from "os";
import path3 from "path";
var themeFileNames = [".jsonc", ".json"];
function loadTheme(name, environment = { XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME, HOME: process.env.HOME }) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(name))
    return;
  const configured = environment.XDG_CONFIG_HOME;
  const configHome = configured && path3.isAbsolute(configured) ? configured : path3.join(environment.HOME || os2.homedir(), ".config");
  const directories = [
    path3.join(configHome, "otmd", "themes"),
    path3.resolve(import.meta.dir, "..", "..", "themes")
  ];
  for (const directory of directories) {
    for (const suffix of themeFileNames) {
      const file = path3.join(directory, `${name}${suffix}`);
      if (!existsSync2(file) || !statSync2(file).isFile())
        continue;
      const parsed = parseJsonc(readFileSync2(file, "utf8"), file);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed))
        return;
      return validateTheme(parsed, file);
    }
  }
  return;
}
// node_modules/opentui-markdown-render/src/core/layout.ts
function createDocumentLayout(input) {
  const frame = resolveFrame(input.viewport, input.frame);
  return {
    frame,
    contentWidth: frame.contentWidth,
    tables: resolveTableOptions(input.tables)
  };
}
// node_modules/opentui-markdown-render/src/core/document.ts
function assertNever(value) {
  throw new Error(`Unexpected document node: ${String(value)}`);
}
// node_modules/marked/lib/marked.esm.js
function L() {
  return { async: false, breaks: false, extensions: null, gfm: true, hooks: null, pedantic: false, renderer: null, silent: false, tokenizer: null, walkTokens: null };
}
var T = L();
function Z(u) {
  T = u;
}
var C = { exec: () => null };
function k(u, e = "") {
  let t = typeof u == "string" ? u : u.source, n = { replace: (r, i) => {
    let s = typeof i == "string" ? i : i.source;
    return s = s.replace(m.caret, "$1"), t = t.replace(r, s), n;
  }, getRegex: () => new RegExp(t, e) };
  return n;
}
var me = (() => {
  try {
    return !!new RegExp("(?<=1)(?<!1)");
  } catch {
    return false;
  }
})();
var m = { codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm, outputLinkReplace: /\\([\[\]])/g, indentCodeCompensation: /^(\s+)(?:```)/, beginningSpace: /^\s+/, endingHash: /#$/, startingSpaceChar: /^ /, endingSpaceChar: / $/, nonSpaceChar: /[^ ]/, newLineCharGlobal: /\n/g, tabCharGlobal: /\t/g, multipleSpaceGlobal: /\s+/g, blankLine: /^[ \t]*$/, doubleBlankLine: /\n[ \t]*\n[ \t]*$/, blockquoteStart: /^ {0,3}>/, blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g, blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm, listReplaceTabs: /^\t+/, listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g, listIsTask: /^\[[ xX]\] +\S/, listReplaceTask: /^\[[ xX]\] +/, listTaskCheckbox: /\[[ xX]\]/, anyLine: /\n.*\n/, hrefBrackets: /^<(.*)>$/, tableDelimiter: /[:|]/, tableAlignChars: /^\||\| *$/g, tableRowBlankLine: /\n[ \t]*$/, tableAlignRight: /^ *-+: *$/, tableAlignCenter: /^ *:-+: *$/, tableAlignLeft: /^ *:-+ *$/, startATag: /^<a /i, endATag: /^<\/a>/i, startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i, endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i, startAngleBracket: /^</, endAngleBracket: />$/, pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/, unicodeAlphaNumeric: /[\p{L}\p{N}]/u, escapeTest: /[&<>"']/, escapeReplace: /[&<>"']/g, escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/, escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g, unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, caret: /(^|[^\[])\^/g, percentDecode: /%25/g, findPipe: /\|/g, splitPipe: / \|/, slashPipe: /\\\|/g, carriageReturn: /\r\n|\r/g, spaceLine: /^ +$/gm, notSpaceStart: /^\S*/, endingNewline: /\n$/, listItemRegex: (u) => new RegExp(`^( {0,3}${u})((?:[	 ][^\\n]*)?(?:\\n|$))`), nextBulletRegex: (u) => new RegExp(`^ {0,${Math.min(3, u - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`), hrRegex: (u) => new RegExp(`^ {0,${Math.min(3, u - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`), fencesBeginRegex: (u) => new RegExp(`^ {0,${Math.min(3, u - 1)}}(?:\`\`\`|~~~)`), headingBeginRegex: (u) => new RegExp(`^ {0,${Math.min(3, u - 1)}}#`), htmlBeginRegex: (u) => new RegExp(`^ {0,${Math.min(3, u - 1)}}<(?:[a-z].*>|!--)`, "i") };
var xe = /^(?:[ \t]*(?:\n|$))+/;
var be = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/;
var Re = /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/;
var I = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/;
var Te = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/;
var N = /(?:[*+-]|\d{1,9}[.)])/;
var re = /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/;
var se = k(re).replace(/bull/g, N).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/\|table/g, "").getRegex();
var Oe = k(re).replace(/bull/g, N).replace(/blockCode/g, /(?: {4}| {0,3}\t)/).replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g, / {0,3}>/).replace(/heading/g, / {0,3}#{1,6}/).replace(/html/g, / {0,3}<[^\n>]+>\n/).replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex();
var Q = /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/;
var we = /^[^\n]+/;
var F = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/;
var ye = k(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label", F).replace("title", /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/).getRegex();
var Pe = k(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/).replace(/bull/g, N).getRegex();
var v = "address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul";
var j = /<!--(?:-?>|[\s\S]*?(?:-->|$))/;
var Se = k("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ \t]*)+\\n|$))", "i").replace("comment", j).replace("tag", v).replace("attribute", / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex();
var ie = k(Q).replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("|table", "").replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex();
var $e = k(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/).replace("paragraph", ie).getRegex();
var U = { blockquote: $e, code: be, def: ye, fences: Re, heading: Te, hr: I, html: Se, lheading: se, list: Pe, newline: xe, paragraph: ie, table: C, text: we };
var te = k("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("blockquote", " {0,3}>").replace("code", "(?: {4}| {0,3}\t)[^\\n]").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex();
var _e = { ...U, lheading: Oe, table: te, paragraph: k(Q).replace("hr", I).replace("heading", " {0,3}#{1,6}(?:\\s|$)").replace("|lheading", "").replace("table", te).replace("blockquote", " {0,3}>").replace("fences", " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n").replace("list", " {0,3}(?:[*+-]|1[.)]) ").replace("html", "</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)").replace("tag", v).getRegex() };
var Le = { ...U, html: k(`^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`).replace("comment", j).replace(/tag/g, "(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(), def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/, heading: /^(#{1,6})(.*)(?:\n+|$)/, fences: C, lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/, paragraph: k(Q).replace("hr", I).replace("heading", ` *#{1,6} *[^
]`).replace("lheading", se).replace("|table", "").replace("blockquote", " {0,3}>").replace("|fences", "").replace("|list", "").replace("|html", "").replace("|tag", "").getRegex() };
var Me = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/;
var ze = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/;
var oe = /^( {2,}|\\)\n(?!\s*$)/;
var Ae = /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/;
var D = /[\p{P}\p{S}]/u;
var K = /[\s\p{P}\p{S}]/u;
var ae = /[^\s\p{P}\p{S}]/u;
var Ce = k(/^((?![*_])punctSpace)/, "u").replace(/punctSpace/g, K).getRegex();
var le = /(?!~)[\p{P}\p{S}]/u;
var Ie = /(?!~)[\s\p{P}\p{S}]/u;
var Ee = /(?:[^\s\p{P}\p{S}]|~)/u;
var Be = k(/link|precode-code|html/, "g").replace("link", /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-", me ? "(?<!`)()" : "(^^|[^`])").replace("code", /(?<b>`+)[^`]+\k<b>(?!`)/).replace("html", /<(?! )[^<>]*?>/).getRegex();
var ue = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/;
var qe = k(ue, "u").replace(/punct/g, D).getRegex();
var ve = k(ue, "u").replace(/punct/g, le).getRegex();
var pe = "^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)";
var De = k(pe, "gu").replace(/notPunctSpace/g, ae).replace(/punctSpace/g, K).replace(/punct/g, D).getRegex();
var He = k(pe, "gu").replace(/notPunctSpace/g, Ee).replace(/punctSpace/g, Ie).replace(/punct/g, le).getRegex();
var Ze = k("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)", "gu").replace(/notPunctSpace/g, ae).replace(/punctSpace/g, K).replace(/punct/g, D).getRegex();
var Ge = k(/\\(punct)/, "gu").replace(/punct/g, D).getRegex();
var Ne = k(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme", /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email", /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex();
var Qe = k(j).replace("(?:-->|$)", "-->").getRegex();
var Fe = k("^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment", Qe).replace("attribute", /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex();
var q = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/;
var je = k(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/).replace("label", q).replace("href", /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/).replace("title", /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/).getRegex();
var ce = k(/^!?\[(label)\]\[(ref)\]/).replace("label", q).replace("ref", F).getRegex();
var he = k(/^!?\[(ref)\](?:\[\])?/).replace("ref", F).getRegex();
var Ue = k("reflink|nolink(?!\\()", "g").replace("reflink", ce).replace("nolink", he).getRegex();
var ne = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/;
var W = { _backpedal: C, anyPunctuation: Ge, autolink: Ne, blockSkip: Be, br: oe, code: ze, del: C, emStrongLDelim: qe, emStrongRDelimAst: De, emStrongRDelimUnd: Ze, escape: Me, link: je, nolink: he, punctuation: Ce, reflink: ce, reflinkSearch: Ue, tag: Fe, text: Ae, url: C };
var Ke = { ...W, link: k(/^!?\[(label)\]\((.*?)\)/).replace("label", q).getRegex(), reflink: k(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label", q).getRegex() };
var G = { ...W, emStrongRDelimAst: He, emStrongLDelim: ve, url: k(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("protocol", ne).replace("email", /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/).getRegex(), _backpedal: /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/, del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/, text: k(/^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/).replace("protocol", ne).getRegex() };
var We = { ...G, br: k(oe).replace("{2,}", "*").getRegex(), text: k(G.text).replace("\\b_", "\\b_| {2,}\\n").replace(/\{2,\}/g, "*").getRegex() };
var E = { normal: U, gfm: _e, pedantic: Le };
var M = { normal: W, gfm: G, breaks: We, pedantic: Ke };
var Xe = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
var ke = (u) => Xe[u];
function w(u, e) {
  if (e) {
    if (m.escapeTest.test(u))
      return u.replace(m.escapeReplace, ke);
  } else if (m.escapeTestNoEncode.test(u))
    return u.replace(m.escapeReplaceNoEncode, ke);
  return u;
}
function X(u) {
  try {
    u = encodeURI(u).replace(m.percentDecode, "%");
  } catch {
    return null;
  }
  return u;
}
function J(u, e) {
  let t = u.replace(m.findPipe, (i, s, a) => {
    let o = false, l = s;
    for (;--l >= 0 && a[l] === "\\"; )
      o = !o;
    return o ? "|" : " |";
  }), n = t.split(m.splitPipe), r = 0;
  if (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), e)
    if (n.length > e)
      n.splice(e);
    else
      for (;n.length < e; )
        n.push("");
  for (;r < n.length; r++)
    n[r] = n[r].trim().replace(m.slashPipe, "|");
  return n;
}
function z(u, e, t) {
  let n = u.length;
  if (n === 0)
    return "";
  let r = 0;
  for (;r < n; ) {
    let i = u.charAt(n - r - 1);
    if (i === e && !t)
      r++;
    else if (i !== e && t)
      r++;
    else
      break;
  }
  return u.slice(0, n - r);
}
function de(u, e) {
  if (u.indexOf(e[1]) === -1)
    return -1;
  let t = 0;
  for (let n = 0;n < u.length; n++)
    if (u[n] === "\\")
      n++;
    else if (u[n] === e[0])
      t++;
    else if (u[n] === e[1] && (t--, t < 0))
      return n;
  return t > 0 ? -2 : -1;
}
function ge(u, e, t, n, r) {
  let i = e.href, s = e.title || null, a = u[1].replace(r.other.outputLinkReplace, "$1");
  n.state.inLink = true;
  let o = { type: u[0].charAt(0) === "!" ? "image" : "link", raw: t, href: i, title: s, text: a, tokens: n.inlineTokens(a) };
  return n.state.inLink = false, o;
}
function Je(u, e, t) {
  let n = u.match(t.other.indentCodeCompensation);
  if (n === null)
    return e;
  let r = n[1];
  return e.split(`
`).map((i) => {
    let s = i.match(t.other.beginningSpace);
    if (s === null)
      return i;
    let [a] = s;
    return a.length >= r.length ? i.slice(r.length) : i;
  }).join(`
`);
}
var y = class {
  options;
  rules;
  lexer;
  constructor(e) {
    this.options = e || T;
  }
  space(e) {
    let t = this.rules.block.newline.exec(e);
    if (t && t[0].length > 0)
      return { type: "space", raw: t[0] };
  }
  code(e) {
    let t = this.rules.block.code.exec(e);
    if (t) {
      let n = t[0].replace(this.rules.other.codeRemoveIndent, "");
      return { type: "code", raw: t[0], codeBlockStyle: "indented", text: this.options.pedantic ? n : z(n, `
`) };
    }
  }
  fences(e) {
    let t = this.rules.block.fences.exec(e);
    if (t) {
      let n = t[0], r = Je(n, t[3] || "", this.rules);
      return { type: "code", raw: n, lang: t[2] ? t[2].trim().replace(this.rules.inline.anyPunctuation, "$1") : t[2], text: r };
    }
  }
  heading(e) {
    let t = this.rules.block.heading.exec(e);
    if (t) {
      let n = t[2].trim();
      if (this.rules.other.endingHash.test(n)) {
        let r = z(n, "#");
        (this.options.pedantic || !r || this.rules.other.endingSpaceChar.test(r)) && (n = r.trim());
      }
      return { type: "heading", raw: t[0], depth: t[1].length, text: n, tokens: this.lexer.inline(n) };
    }
  }
  hr(e) {
    let t = this.rules.block.hr.exec(e);
    if (t)
      return { type: "hr", raw: z(t[0], `
`) };
  }
  blockquote(e) {
    let t = this.rules.block.blockquote.exec(e);
    if (t) {
      let n = z(t[0], `
`).split(`
`), r = "", i = "", s = [];
      for (;n.length > 0; ) {
        let a = false, o = [], l;
        for (l = 0;l < n.length; l++)
          if (this.rules.other.blockquoteStart.test(n[l]))
            o.push(n[l]), a = true;
          else if (!a)
            o.push(n[l]);
          else
            break;
        n = n.slice(l);
        let p = o.join(`
`), c = p.replace(this.rules.other.blockquoteSetextReplace, `
    $1`).replace(this.rules.other.blockquoteSetextReplace2, "");
        r = r ? `${r}
${p}` : p, i = i ? `${i}
${c}` : c;
        let g = this.lexer.state.top;
        if (this.lexer.state.top = true, this.lexer.blockTokens(c, s, true), this.lexer.state.top = g, n.length === 0)
          break;
        let h = s.at(-1);
        if (h?.type === "code")
          break;
        if (h?.type === "blockquote") {
          let R = h, f = R.raw + `
` + n.join(`
`), O = this.blockquote(f);
          s[s.length - 1] = O, r = r.substring(0, r.length - R.raw.length) + O.raw, i = i.substring(0, i.length - R.text.length) + O.text;
          break;
        } else if (h?.type === "list") {
          let R = h, f = R.raw + `
` + n.join(`
`), O = this.list(f);
          s[s.length - 1] = O, r = r.substring(0, r.length - h.raw.length) + O.raw, i = i.substring(0, i.length - R.raw.length) + O.raw, n = f.substring(s.at(-1).raw.length).split(`
`);
          continue;
        }
      }
      return { type: "blockquote", raw: r, tokens: s, text: i };
    }
  }
  list(e) {
    let t = this.rules.block.list.exec(e);
    if (t) {
      let n = t[1].trim(), r = n.length > 1, i = { type: "list", raw: "", ordered: r, start: r ? +n.slice(0, -1) : "", loose: false, items: [] };
      n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`, this.options.pedantic && (n = r ? n : "[*+-]");
      let s = this.rules.other.listItemRegex(n), a = false;
      for (;e; ) {
        let l = false, p = "", c = "";
        if (!(t = s.exec(e)) || this.rules.block.hr.test(e))
          break;
        p = t[0], e = e.substring(p.length);
        let g = t[2].split(`
`, 1)[0].replace(this.rules.other.listReplaceTabs, (O) => " ".repeat(3 * O.length)), h = e.split(`
`, 1)[0], R = !g.trim(), f = 0;
        if (this.options.pedantic ? (f = 2, c = g.trimStart()) : R ? f = t[1].length + 1 : (f = t[2].search(this.rules.other.nonSpaceChar), f = f > 4 ? 1 : f, c = g.slice(f), f += t[1].length), R && this.rules.other.blankLine.test(h) && (p += h + `
`, e = e.substring(h.length + 1), l = true), !l) {
          let O = this.rules.other.nextBulletRegex(f), V = this.rules.other.hrRegex(f), Y = this.rules.other.fencesBeginRegex(f), ee = this.rules.other.headingBeginRegex(f), fe = this.rules.other.htmlBeginRegex(f);
          for (;e; ) {
            let H = e.split(`
`, 1)[0], A;
            if (h = H, this.options.pedantic ? (h = h.replace(this.rules.other.listReplaceNesting, "  "), A = h) : A = h.replace(this.rules.other.tabCharGlobal, "    "), Y.test(h) || ee.test(h) || fe.test(h) || O.test(h) || V.test(h))
              break;
            if (A.search(this.rules.other.nonSpaceChar) >= f || !h.trim())
              c += `
` + A.slice(f);
            else {
              if (R || g.replace(this.rules.other.tabCharGlobal, "    ").search(this.rules.other.nonSpaceChar) >= 4 || Y.test(g) || ee.test(g) || V.test(g))
                break;
              c += `
` + h;
            }
            !R && !h.trim() && (R = true), p += H + `
`, e = e.substring(H.length + 1), g = A.slice(f);
          }
        }
        i.loose || (a ? i.loose = true : this.rules.other.doubleBlankLine.test(p) && (a = true)), i.items.push({ type: "list_item", raw: p, task: !!this.options.gfm && this.rules.other.listIsTask.test(c), loose: false, text: c, tokens: [] }), i.raw += p;
      }
      let o = i.items.at(-1);
      if (o)
        o.raw = o.raw.trimEnd(), o.text = o.text.trimEnd();
      else
        return;
      i.raw = i.raw.trimEnd();
      for (let l of i.items) {
        if (this.lexer.state.top = false, l.tokens = this.lexer.blockTokens(l.text, []), l.task) {
          if (l.text = l.text.replace(this.rules.other.listReplaceTask, ""), l.tokens[0]?.type === "text" || l.tokens[0]?.type === "paragraph") {
            l.tokens[0].raw = l.tokens[0].raw.replace(this.rules.other.listReplaceTask, ""), l.tokens[0].text = l.tokens[0].text.replace(this.rules.other.listReplaceTask, "");
            for (let c = this.lexer.inlineQueue.length - 1;c >= 0; c--)
              if (this.rules.other.listIsTask.test(this.lexer.inlineQueue[c].src)) {
                this.lexer.inlineQueue[c].src = this.lexer.inlineQueue[c].src.replace(this.rules.other.listReplaceTask, "");
                break;
              }
          }
          let p = this.rules.other.listTaskCheckbox.exec(l.raw);
          if (p) {
            let c = { type: "checkbox", raw: p[0] + " ", checked: p[0] !== "[ ]" };
            l.checked = c.checked, i.loose ? l.tokens[0] && ["paragraph", "text"].includes(l.tokens[0].type) && "tokens" in l.tokens[0] && l.tokens[0].tokens ? (l.tokens[0].raw = c.raw + l.tokens[0].raw, l.tokens[0].text = c.raw + l.tokens[0].text, l.tokens[0].tokens.unshift(c)) : l.tokens.unshift({ type: "paragraph", raw: c.raw, text: c.raw, tokens: [c] }) : l.tokens.unshift(c);
          }
        }
        if (!i.loose) {
          let p = l.tokens.filter((g) => g.type === "space"), c = p.length > 0 && p.some((g) => this.rules.other.anyLine.test(g.raw));
          i.loose = c;
        }
      }
      if (i.loose)
        for (let l of i.items) {
          l.loose = true;
          for (let p of l.tokens)
            p.type === "text" && (p.type = "paragraph");
        }
      return i;
    }
  }
  html(e) {
    let t = this.rules.block.html.exec(e);
    if (t)
      return { type: "html", block: true, raw: t[0], pre: t[1] === "pre" || t[1] === "script" || t[1] === "style", text: t[0] };
  }
  def(e) {
    let t = this.rules.block.def.exec(e);
    if (t) {
      let n = t[1].toLowerCase().replace(this.rules.other.multipleSpaceGlobal, " "), r = t[2] ? t[2].replace(this.rules.other.hrefBrackets, "$1").replace(this.rules.inline.anyPunctuation, "$1") : "", i = t[3] ? t[3].substring(1, t[3].length - 1).replace(this.rules.inline.anyPunctuation, "$1") : t[3];
      return { type: "def", tag: n, raw: t[0], href: r, title: i };
    }
  }
  table(e) {
    let t = this.rules.block.table.exec(e);
    if (!t || !this.rules.other.tableDelimiter.test(t[2]))
      return;
    let n = J(t[1]), r = t[2].replace(this.rules.other.tableAlignChars, "").split("|"), i = t[3]?.trim() ? t[3].replace(this.rules.other.tableRowBlankLine, "").split(`
`) : [], s = { type: "table", raw: t[0], header: [], align: [], rows: [] };
    if (n.length === r.length) {
      for (let a of r)
        this.rules.other.tableAlignRight.test(a) ? s.align.push("right") : this.rules.other.tableAlignCenter.test(a) ? s.align.push("center") : this.rules.other.tableAlignLeft.test(a) ? s.align.push("left") : s.align.push(null);
      for (let a = 0;a < n.length; a++)
        s.header.push({ text: n[a], tokens: this.lexer.inline(n[a]), header: true, align: s.align[a] });
      for (let a of i)
        s.rows.push(J(a, s.header.length).map((o, l) => ({ text: o, tokens: this.lexer.inline(o), header: false, align: s.align[l] })));
      return s;
    }
  }
  lheading(e) {
    let t = this.rules.block.lheading.exec(e);
    if (t)
      return { type: "heading", raw: t[0], depth: t[2].charAt(0) === "=" ? 1 : 2, text: t[1], tokens: this.lexer.inline(t[1]) };
  }
  paragraph(e) {
    let t = this.rules.block.paragraph.exec(e);
    if (t) {
      let n = t[1].charAt(t[1].length - 1) === `
` ? t[1].slice(0, -1) : t[1];
      return { type: "paragraph", raw: t[0], text: n, tokens: this.lexer.inline(n) };
    }
  }
  text(e) {
    let t = this.rules.block.text.exec(e);
    if (t)
      return { type: "text", raw: t[0], text: t[0], tokens: this.lexer.inline(t[0]) };
  }
  escape(e) {
    let t = this.rules.inline.escape.exec(e);
    if (t)
      return { type: "escape", raw: t[0], text: t[1] };
  }
  tag(e) {
    let t = this.rules.inline.tag.exec(e);
    if (t)
      return !this.lexer.state.inLink && this.rules.other.startATag.test(t[0]) ? this.lexer.state.inLink = true : this.lexer.state.inLink && this.rules.other.endATag.test(t[0]) && (this.lexer.state.inLink = false), !this.lexer.state.inRawBlock && this.rules.other.startPreScriptTag.test(t[0]) ? this.lexer.state.inRawBlock = true : this.lexer.state.inRawBlock && this.rules.other.endPreScriptTag.test(t[0]) && (this.lexer.state.inRawBlock = false), { type: "html", raw: t[0], inLink: this.lexer.state.inLink, inRawBlock: this.lexer.state.inRawBlock, block: false, text: t[0] };
  }
  link(e) {
    let t = this.rules.inline.link.exec(e);
    if (t) {
      let n = t[2].trim();
      if (!this.options.pedantic && this.rules.other.startAngleBracket.test(n)) {
        if (!this.rules.other.endAngleBracket.test(n))
          return;
        let s = z(n.slice(0, -1), "\\");
        if ((n.length - s.length) % 2 === 0)
          return;
      } else {
        let s = de(t[2], "()");
        if (s === -2)
          return;
        if (s > -1) {
          let o = (t[0].indexOf("!") === 0 ? 5 : 4) + t[1].length + s;
          t[2] = t[2].substring(0, s), t[0] = t[0].substring(0, o).trim(), t[3] = "";
        }
      }
      let r = t[2], i = "";
      if (this.options.pedantic) {
        let s = this.rules.other.pedanticHrefTitle.exec(r);
        s && (r = s[1], i = s[3]);
      } else
        i = t[3] ? t[3].slice(1, -1) : "";
      return r = r.trim(), this.rules.other.startAngleBracket.test(r) && (this.options.pedantic && !this.rules.other.endAngleBracket.test(n) ? r = r.slice(1) : r = r.slice(1, -1)), ge(t, { href: r && r.replace(this.rules.inline.anyPunctuation, "$1"), title: i && i.replace(this.rules.inline.anyPunctuation, "$1") }, t[0], this.lexer, this.rules);
    }
  }
  reflink(e, t) {
    let n;
    if ((n = this.rules.inline.reflink.exec(e)) || (n = this.rules.inline.nolink.exec(e))) {
      let r = (n[2] || n[1]).replace(this.rules.other.multipleSpaceGlobal, " "), i = t[r.toLowerCase()];
      if (!i) {
        let s = n[0].charAt(0);
        return { type: "text", raw: s, text: s };
      }
      return ge(n, i, n[0], this.lexer, this.rules);
    }
  }
  emStrong(e, t, n = "") {
    let r = this.rules.inline.emStrongLDelim.exec(e);
    if (!r || r[3] && n.match(this.rules.other.unicodeAlphaNumeric))
      return;
    if (!(r[1] || r[2] || "") || !n || this.rules.inline.punctuation.exec(n)) {
      let s = [...r[0]].length - 1, a, o, l = s, p = 0, c = r[0][0] === "*" ? this.rules.inline.emStrongRDelimAst : this.rules.inline.emStrongRDelimUnd;
      for (c.lastIndex = 0, t = t.slice(-1 * e.length + s);(r = c.exec(t)) != null; ) {
        if (a = r[1] || r[2] || r[3] || r[4] || r[5] || r[6], !a)
          continue;
        if (o = [...a].length, r[3] || r[4]) {
          l += o;
          continue;
        } else if ((r[5] || r[6]) && s % 3 && !((s + o) % 3)) {
          p += o;
          continue;
        }
        if (l -= o, l > 0)
          continue;
        o = Math.min(o, o + l + p);
        let g = [...r[0]][0].length, h = e.slice(0, s + r.index + g + o);
        if (Math.min(s, o) % 2) {
          let f = h.slice(1, -1);
          return { type: "em", raw: h, text: f, tokens: this.lexer.inlineTokens(f) };
        }
        let R = h.slice(2, -2);
        return { type: "strong", raw: h, text: R, tokens: this.lexer.inlineTokens(R) };
      }
    }
  }
  codespan(e) {
    let t = this.rules.inline.code.exec(e);
    if (t) {
      let n = t[2].replace(this.rules.other.newLineCharGlobal, " "), r = this.rules.other.nonSpaceChar.test(n), i = this.rules.other.startingSpaceChar.test(n) && this.rules.other.endingSpaceChar.test(n);
      return r && i && (n = n.substring(1, n.length - 1)), { type: "codespan", raw: t[0], text: n };
    }
  }
  br(e) {
    let t = this.rules.inline.br.exec(e);
    if (t)
      return { type: "br", raw: t[0] };
  }
  del(e) {
    let t = this.rules.inline.del.exec(e);
    if (t)
      return { type: "del", raw: t[0], text: t[2], tokens: this.lexer.inlineTokens(t[2]) };
  }
  autolink(e) {
    let t = this.rules.inline.autolink.exec(e);
    if (t) {
      let n, r;
      return t[2] === "@" ? (n = t[1], r = "mailto:" + n) : (n = t[1], r = n), { type: "link", raw: t[0], text: n, href: r, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  url(e) {
    let t;
    if (t = this.rules.inline.url.exec(e)) {
      let n, r;
      if (t[2] === "@")
        n = t[0], r = "mailto:" + n;
      else {
        let i;
        do
          i = t[0], t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? "";
        while (i !== t[0]);
        n = t[0], t[1] === "www." ? r = "http://" + t[0] : r = t[0];
      }
      return { type: "link", raw: t[0], text: n, href: r, tokens: [{ type: "text", raw: n, text: n }] };
    }
  }
  inlineText(e) {
    let t = this.rules.inline.text.exec(e);
    if (t) {
      let n = this.lexer.state.inRawBlock;
      return { type: "text", raw: t[0], text: t[0], escaped: n };
    }
  }
};
var x = class u {
  tokens;
  options;
  state;
  inlineQueue;
  tokenizer;
  constructor(e) {
    this.tokens = [], this.tokens.links = Object.create(null), this.options = e || T, this.options.tokenizer = this.options.tokenizer || new y, this.tokenizer = this.options.tokenizer, this.tokenizer.options = this.options, this.tokenizer.lexer = this, this.inlineQueue = [], this.state = { inLink: false, inRawBlock: false, top: true };
    let t = { other: m, block: E.normal, inline: M.normal };
    this.options.pedantic ? (t.block = E.pedantic, t.inline = M.pedantic) : this.options.gfm && (t.block = E.gfm, this.options.breaks ? t.inline = M.breaks : t.inline = M.gfm), this.tokenizer.rules = t;
  }
  static get rules() {
    return { block: E, inline: M };
  }
  static lex(e, t) {
    return new u(t).lex(e);
  }
  static lexInline(e, t) {
    return new u(t).inlineTokens(e);
  }
  lex(e) {
    e = e.replace(m.carriageReturn, `
`), this.blockTokens(e, this.tokens);
    for (let t = 0;t < this.inlineQueue.length; t++) {
      let n = this.inlineQueue[t];
      this.inlineTokens(n.src, n.tokens);
    }
    return this.inlineQueue = [], this.tokens;
  }
  blockTokens(e, t = [], n = false) {
    for (this.options.pedantic && (e = e.replace(m.tabCharGlobal, "    ").replace(m.spaceLine, ""));e; ) {
      let r;
      if (this.options.extensions?.block?.some((s) => (r = s.call({ lexer: this }, e, t)) ? (e = e.substring(r.raw.length), t.push(r), true) : false))
        continue;
      if (r = this.tokenizer.space(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        r.raw.length === 1 && s !== undefined ? s.raw += `
` : t.push(r);
        continue;
      }
      if (r = this.tokenizer.code(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.at(-1).src = s.text) : t.push(r);
        continue;
      }
      if (r = this.tokenizer.fences(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.heading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.hr(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.blockquote(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.list(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.html(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.def(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "paragraph" || s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.raw, this.inlineQueue.at(-1).src = s.text) : this.tokens.links[r.tag] || (this.tokens.links[r.tag] = { href: r.href, title: r.title }, t.push(r));
        continue;
      }
      if (r = this.tokenizer.table(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      if (r = this.tokenizer.lheading(e)) {
        e = e.substring(r.raw.length), t.push(r);
        continue;
      }
      let i = e;
      if (this.options.extensions?.startBlock) {
        let s = 1 / 0, a = e.slice(1), o;
        this.options.extensions.startBlock.forEach((l) => {
          o = l.call({ lexer: this }, a), typeof o == "number" && o >= 0 && (s = Math.min(s, o));
        }), s < 1 / 0 && s >= 0 && (i = e.substring(0, s + 1));
      }
      if (this.state.top && (r = this.tokenizer.paragraph(i))) {
        let s = t.at(-1);
        n && s?.type === "paragraph" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r), n = i.length !== e.length, e = e.substring(r.raw.length);
        continue;
      }
      if (r = this.tokenizer.text(e)) {
        e = e.substring(r.raw.length);
        let s = t.at(-1);
        s?.type === "text" ? (s.raw += (s.raw.endsWith(`
`) ? "" : `
`) + r.raw, s.text += `
` + r.text, this.inlineQueue.pop(), this.inlineQueue.at(-1).src = s.text) : t.push(r);
        continue;
      }
      if (e) {
        let s = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(s);
          break;
        } else
          throw new Error(s);
      }
    }
    return this.state.top = true, t;
  }
  inline(e, t = []) {
    return this.inlineQueue.push({ src: e, tokens: t }), t;
  }
  inlineTokens(e, t = []) {
    let n = e, r = null;
    if (this.tokens.links) {
      let o = Object.keys(this.tokens.links);
      if (o.length > 0)
        for (;(r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null; )
          o.includes(r[0].slice(r[0].lastIndexOf("[") + 1, -1)) && (n = n.slice(0, r.index) + "[" + "a".repeat(r[0].length - 2) + "]" + n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
    }
    for (;(r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null; )
      n = n.slice(0, r.index) + "++" + n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
    let i;
    for (;(r = this.tokenizer.rules.inline.blockSkip.exec(n)) != null; )
      i = r[2] ? r[2].length : 0, n = n.slice(0, r.index + i) + "[" + "a".repeat(r[0].length - i - 2) + "]" + n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex);
    n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
    let s = false, a = "";
    for (;e; ) {
      s || (a = ""), s = false;
      let o;
      if (this.options.extensions?.inline?.some((p) => (o = p.call({ lexer: this }, e, t)) ? (e = e.substring(o.raw.length), t.push(o), true) : false))
        continue;
      if (o = this.tokenizer.escape(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.tag(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.link(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.reflink(e, this.tokens.links)) {
        e = e.substring(o.raw.length);
        let p = t.at(-1);
        o.type === "text" && p?.type === "text" ? (p.raw += o.raw, p.text += o.text) : t.push(o);
        continue;
      }
      if (o = this.tokenizer.emStrong(e, n, a)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.codespan(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.br(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.del(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (o = this.tokenizer.autolink(e)) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      if (!this.state.inLink && (o = this.tokenizer.url(e))) {
        e = e.substring(o.raw.length), t.push(o);
        continue;
      }
      let l = e;
      if (this.options.extensions?.startInline) {
        let p = 1 / 0, c = e.slice(1), g;
        this.options.extensions.startInline.forEach((h) => {
          g = h.call({ lexer: this }, c), typeof g == "number" && g >= 0 && (p = Math.min(p, g));
        }), p < 1 / 0 && p >= 0 && (l = e.substring(0, p + 1));
      }
      if (o = this.tokenizer.inlineText(l)) {
        e = e.substring(o.raw.length), o.raw.slice(-1) !== "_" && (a = o.raw.slice(-1)), s = true;
        let p = t.at(-1);
        p?.type === "text" ? (p.raw += o.raw, p.text += o.text) : t.push(o);
        continue;
      }
      if (e) {
        let p = "Infinite loop on byte: " + e.charCodeAt(0);
        if (this.options.silent) {
          console.error(p);
          break;
        } else
          throw new Error(p);
      }
    }
    return t;
  }
};
var P = class {
  options;
  parser;
  constructor(e) {
    this.options = e || T;
  }
  space(e) {
    return "";
  }
  code({ text: e, lang: t, escaped: n }) {
    let r = (t || "").match(m.notSpaceStart)?.[0], i = e.replace(m.endingNewline, "") + `
`;
    return r ? '<pre><code class="language-' + w(r) + '">' + (n ? i : w(i, true)) + `</code></pre>
` : "<pre><code>" + (n ? i : w(i, true)) + `</code></pre>
`;
  }
  blockquote({ tokens: e }) {
    return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
  }
  html({ text: e }) {
    return e;
  }
  def(e) {
    return "";
  }
  heading({ tokens: e, depth: t }) {
    return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
  }
  hr(e) {
    return `<hr>
`;
  }
  list(e) {
    let { ordered: t, start: n } = e, r = "";
    for (let a = 0;a < e.items.length; a++) {
      let o = e.items[a];
      r += this.listitem(o);
    }
    let i = t ? "ol" : "ul", s = t && n !== 1 ? ' start="' + n + '"' : "";
    return "<" + i + s + `>
` + r + "</" + i + `>
`;
  }
  listitem(e) {
    return `<li>${this.parser.parse(e.tokens)}</li>
`;
  }
  checkbox({ checked: e }) {
    return "<input " + (e ? 'checked="" ' : "") + 'disabled="" type="checkbox"> ';
  }
  paragraph({ tokens: e }) {
    return `<p>${this.parser.parseInline(e)}</p>
`;
  }
  table(e) {
    let t = "", n = "";
    for (let i = 0;i < e.header.length; i++)
      n += this.tablecell(e.header[i]);
    t += this.tablerow({ text: n });
    let r = "";
    for (let i = 0;i < e.rows.length; i++) {
      let s = e.rows[i];
      n = "";
      for (let a = 0;a < s.length; a++)
        n += this.tablecell(s[a]);
      r += this.tablerow({ text: n });
    }
    return r && (r = `<tbody>${r}</tbody>`), `<table>
<thead>
` + t + `</thead>
` + r + `</table>
`;
  }
  tablerow({ text: e }) {
    return `<tr>
${e}</tr>
`;
  }
  tablecell(e) {
    let t = this.parser.parseInline(e.tokens), n = e.header ? "th" : "td";
    return (e.align ? `<${n} align="${e.align}">` : `<${n}>`) + t + `</${n}>
`;
  }
  strong({ tokens: e }) {
    return `<strong>${this.parser.parseInline(e)}</strong>`;
  }
  em({ tokens: e }) {
    return `<em>${this.parser.parseInline(e)}</em>`;
  }
  codespan({ text: e }) {
    return `<code>${w(e, true)}</code>`;
  }
  br(e) {
    return "<br>";
  }
  del({ tokens: e }) {
    return `<del>${this.parser.parseInline(e)}</del>`;
  }
  link({ href: e, title: t, tokens: n }) {
    let r = this.parser.parseInline(n), i = X(e);
    if (i === null)
      return r;
    e = i;
    let s = '<a href="' + e + '"';
    return t && (s += ' title="' + w(t) + '"'), s += ">" + r + "</a>", s;
  }
  image({ href: e, title: t, text: n, tokens: r }) {
    r && (n = this.parser.parseInline(r, this.parser.textRenderer));
    let i = X(e);
    if (i === null)
      return w(n);
    e = i;
    let s = `<img src="${e}" alt="${n}"`;
    return t && (s += ` title="${w(t)}"`), s += ">", s;
  }
  text(e) {
    return "tokens" in e && e.tokens ? this.parser.parseInline(e.tokens) : ("escaped" in e) && e.escaped ? e.text : w(e.text);
  }
};
var $ = class {
  strong({ text: e }) {
    return e;
  }
  em({ text: e }) {
    return e;
  }
  codespan({ text: e }) {
    return e;
  }
  del({ text: e }) {
    return e;
  }
  html({ text: e }) {
    return e;
  }
  text({ text: e }) {
    return e;
  }
  link({ text: e }) {
    return "" + e;
  }
  image({ text: e }) {
    return "" + e;
  }
  br() {
    return "";
  }
  checkbox({ raw: e }) {
    return e;
  }
};
var b = class u {
  options;
  renderer;
  textRenderer;
  constructor(e) {
    this.options = e || T, this.options.renderer = this.options.renderer || new P, this.renderer = this.options.renderer, this.renderer.options = this.options, this.renderer.parser = this, this.textRenderer = new $;
  }
  static parse(e, t) {
    return new u(t).parse(e);
  }
  static parseInline(e, t) {
    return new u(t).parseInline(e);
  }
  parse(e) {
    let t = "";
    for (let n = 0;n < e.length; n++) {
      let r = e[n];
      if (this.options.extensions?.renderers?.[r.type]) {
        let s = r, a = this.options.extensions.renderers[s.type].call({ parser: this }, s);
        if (a !== false || !["space", "hr", "heading", "code", "table", "blockquote", "list", "html", "def", "paragraph", "text"].includes(s.type)) {
          t += a || "";
          continue;
        }
      }
      let i = r;
      switch (i.type) {
        case "space": {
          t += this.renderer.space(i);
          break;
        }
        case "hr": {
          t += this.renderer.hr(i);
          break;
        }
        case "heading": {
          t += this.renderer.heading(i);
          break;
        }
        case "code": {
          t += this.renderer.code(i);
          break;
        }
        case "table": {
          t += this.renderer.table(i);
          break;
        }
        case "blockquote": {
          t += this.renderer.blockquote(i);
          break;
        }
        case "list": {
          t += this.renderer.list(i);
          break;
        }
        case "checkbox": {
          t += this.renderer.checkbox(i);
          break;
        }
        case "html": {
          t += this.renderer.html(i);
          break;
        }
        case "def": {
          t += this.renderer.def(i);
          break;
        }
        case "paragraph": {
          t += this.renderer.paragraph(i);
          break;
        }
        case "text": {
          t += this.renderer.text(i);
          break;
        }
        default: {
          let s = 'Token with "' + i.type + '" type was not found.';
          if (this.options.silent)
            return console.error(s), "";
          throw new Error(s);
        }
      }
    }
    return t;
  }
  parseInline(e, t = this.renderer) {
    let n = "";
    for (let r = 0;r < e.length; r++) {
      let i = e[r];
      if (this.options.extensions?.renderers?.[i.type]) {
        let a = this.options.extensions.renderers[i.type].call({ parser: this }, i);
        if (a !== false || !["escape", "html", "link", "image", "strong", "em", "codespan", "br", "del", "text"].includes(i.type)) {
          n += a || "";
          continue;
        }
      }
      let s = i;
      switch (s.type) {
        case "escape": {
          n += t.text(s);
          break;
        }
        case "html": {
          n += t.html(s);
          break;
        }
        case "link": {
          n += t.link(s);
          break;
        }
        case "image": {
          n += t.image(s);
          break;
        }
        case "checkbox": {
          n += t.checkbox(s);
          break;
        }
        case "strong": {
          n += t.strong(s);
          break;
        }
        case "em": {
          n += t.em(s);
          break;
        }
        case "codespan": {
          n += t.codespan(s);
          break;
        }
        case "br": {
          n += t.br(s);
          break;
        }
        case "del": {
          n += t.del(s);
          break;
        }
        case "text": {
          n += t.text(s);
          break;
        }
        default: {
          let a = 'Token with "' + s.type + '" type was not found.';
          if (this.options.silent)
            return console.error(a), "";
          throw new Error(a);
        }
      }
    }
    return n;
  }
};
var S = class {
  options;
  block;
  constructor(e) {
    this.options = e || T;
  }
  static passThroughHooks = new Set(["preprocess", "postprocess", "processAllTokens", "emStrongMask"]);
  static passThroughHooksRespectAsync = new Set(["preprocess", "postprocess", "processAllTokens"]);
  preprocess(e) {
    return e;
  }
  postprocess(e) {
    return e;
  }
  processAllTokens(e) {
    return e;
  }
  emStrongMask(e) {
    return e;
  }
  provideLexer() {
    return this.block ? x.lex : x.lexInline;
  }
  provideParser() {
    return this.block ? b.parse : b.parseInline;
  }
};
var B = class {
  defaults = L();
  options = this.setOptions;
  parse = this.parseMarkdown(true);
  parseInline = this.parseMarkdown(false);
  Parser = b;
  Renderer = P;
  TextRenderer = $;
  Lexer = x;
  Tokenizer = y;
  Hooks = S;
  constructor(...e) {
    this.use(...e);
  }
  walkTokens(e, t) {
    let n = [];
    for (let r of e)
      switch (n = n.concat(t.call(this, r)), r.type) {
        case "table": {
          let i = r;
          for (let s of i.header)
            n = n.concat(this.walkTokens(s.tokens, t));
          for (let s of i.rows)
            for (let a of s)
              n = n.concat(this.walkTokens(a.tokens, t));
          break;
        }
        case "list": {
          let i = r;
          n = n.concat(this.walkTokens(i.items, t));
          break;
        }
        default: {
          let i = r;
          this.defaults.extensions?.childTokens?.[i.type] ? this.defaults.extensions.childTokens[i.type].forEach((s) => {
            let a = i[s].flat(1 / 0);
            n = n.concat(this.walkTokens(a, t));
          }) : i.tokens && (n = n.concat(this.walkTokens(i.tokens, t)));
        }
      }
    return n;
  }
  use(...e) {
    let t = this.defaults.extensions || { renderers: {}, childTokens: {} };
    return e.forEach((n) => {
      let r = { ...n };
      if (r.async = this.defaults.async || r.async || false, n.extensions && (n.extensions.forEach((i) => {
        if (!i.name)
          throw new Error("extension name required");
        if ("renderer" in i) {
          let s = t.renderers[i.name];
          s ? t.renderers[i.name] = function(...a) {
            let o = i.renderer.apply(this, a);
            return o === false && (o = s.apply(this, a)), o;
          } : t.renderers[i.name] = i.renderer;
        }
        if ("tokenizer" in i) {
          if (!i.level || i.level !== "block" && i.level !== "inline")
            throw new Error("extension level must be 'block' or 'inline'");
          let s = t[i.level];
          s ? s.unshift(i.tokenizer) : t[i.level] = [i.tokenizer], i.start && (i.level === "block" ? t.startBlock ? t.startBlock.push(i.start) : t.startBlock = [i.start] : i.level === "inline" && (t.startInline ? t.startInline.push(i.start) : t.startInline = [i.start]));
        }
        "childTokens" in i && i.childTokens && (t.childTokens[i.name] = i.childTokens);
      }), r.extensions = t), n.renderer) {
        let i = this.defaults.renderer || new P(this.defaults);
        for (let s in n.renderer) {
          if (!(s in i))
            throw new Error(`renderer '${s}' does not exist`);
          if (["options", "parser"].includes(s))
            continue;
          let a = s, o = n.renderer[a], l = i[a];
          i[a] = (...p) => {
            let c = o.apply(i, p);
            return c === false && (c = l.apply(i, p)), c || "";
          };
        }
        r.renderer = i;
      }
      if (n.tokenizer) {
        let i = this.defaults.tokenizer || new y(this.defaults);
        for (let s in n.tokenizer) {
          if (!(s in i))
            throw new Error(`tokenizer '${s}' does not exist`);
          if (["options", "rules", "lexer"].includes(s))
            continue;
          let a = s, o = n.tokenizer[a], l = i[a];
          i[a] = (...p) => {
            let c = o.apply(i, p);
            return c === false && (c = l.apply(i, p)), c;
          };
        }
        r.tokenizer = i;
      }
      if (n.hooks) {
        let i = this.defaults.hooks || new S;
        for (let s in n.hooks) {
          if (!(s in i))
            throw new Error(`hook '${s}' does not exist`);
          if (["options", "block"].includes(s))
            continue;
          let a = s, o = n.hooks[a], l = i[a];
          S.passThroughHooks.has(s) ? i[a] = (p) => {
            if (this.defaults.async && S.passThroughHooksRespectAsync.has(s))
              return (async () => {
                let g = await o.call(i, p);
                return l.call(i, g);
              })();
            let c = o.call(i, p);
            return l.call(i, c);
          } : i[a] = (...p) => {
            if (this.defaults.async)
              return (async () => {
                let g = await o.apply(i, p);
                return g === false && (g = await l.apply(i, p)), g;
              })();
            let c = o.apply(i, p);
            return c === false && (c = l.apply(i, p)), c;
          };
        }
        r.hooks = i;
      }
      if (n.walkTokens) {
        let i = this.defaults.walkTokens, s = n.walkTokens;
        r.walkTokens = function(a) {
          let o = [];
          return o.push(s.call(this, a)), i && (o = o.concat(i.call(this, a))), o;
        };
      }
      this.defaults = { ...this.defaults, ...r };
    }), this;
  }
  setOptions(e) {
    return this.defaults = { ...this.defaults, ...e }, this;
  }
  lexer(e, t) {
    return x.lex(e, t ?? this.defaults);
  }
  parser(e, t) {
    return b.parse(e, t ?? this.defaults);
  }
  parseMarkdown(e) {
    return (n, r) => {
      let i = { ...r }, s = { ...this.defaults, ...i }, a = this.onError(!!s.silent, !!s.async);
      if (this.defaults.async === true && i.async === false)
        return a(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));
      if (typeof n > "u" || n === null)
        return a(new Error("marked(): input parameter is undefined or null"));
      if (typeof n != "string")
        return a(new Error("marked(): input parameter is of type " + Object.prototype.toString.call(n) + ", string expected"));
      if (s.hooks && (s.hooks.options = s, s.hooks.block = e), s.async)
        return (async () => {
          let o = s.hooks ? await s.hooks.preprocess(n) : n, p = await (s.hooks ? await s.hooks.provideLexer() : e ? x.lex : x.lexInline)(o, s), c = s.hooks ? await s.hooks.processAllTokens(p) : p;
          s.walkTokens && await Promise.all(this.walkTokens(c, s.walkTokens));
          let h = await (s.hooks ? await s.hooks.provideParser() : e ? b.parse : b.parseInline)(c, s);
          return s.hooks ? await s.hooks.postprocess(h) : h;
        })().catch(a);
      try {
        s.hooks && (n = s.hooks.preprocess(n));
        let l = (s.hooks ? s.hooks.provideLexer() : e ? x.lex : x.lexInline)(n, s);
        s.hooks && (l = s.hooks.processAllTokens(l)), s.walkTokens && this.walkTokens(l, s.walkTokens);
        let c = (s.hooks ? s.hooks.provideParser() : e ? b.parse : b.parseInline)(l, s);
        return s.hooks && (c = s.hooks.postprocess(c)), c;
      } catch (o) {
        return a(o);
      }
    };
  }
  onError(e, t) {
    return (n) => {
      if (n.message += `
Please report this to https://github.com/markedjs/marked.`, e) {
        let r = "<p>An error occurred:</p><pre>" + w(n.message + "", true) + "</pre>";
        return t ? Promise.resolve(r) : r;
      }
      if (t)
        return Promise.reject(n);
      throw n;
    };
  }
};
var _ = new B;
function d(u, e) {
  return _.parse(u, e);
}
d.options = d.setOptions = function(u) {
  return _.setOptions(u), d.defaults = _.defaults, Z(d.defaults), d;
};
d.getDefaults = L;
d.defaults = T;
d.use = function(...u) {
  return _.use(...u), d.defaults = _.defaults, Z(d.defaults), d;
};
d.walkTokens = function(u, e) {
  return _.walkTokens(u, e);
};
d.parseInline = _.parseInline;
d.Parser = b;
d.parser = b.parse;
d.Renderer = P;
d.TextRenderer = $;
d.Lexer = x;
d.lexer = x.lex;
d.Tokenizer = y;
d.Hooks = S;
d.parse = d;
var Dt = d.options;
var Ht = d.setOptions;
var Zt = d.use;
var Gt = d.walkTokens;
var Nt = d.parseInline;
var Ft = b.parse;
var jt = x.lex;

// node_modules/opentui-markdown-render/src/core/math.ts
function isEscaped(src, index) {
  let backslashes = 0;
  let i = index - 1;
  while (i >= 0 && src[i] === "\\") {
    backslashes++;
    i--;
  }
  return backslashes % 2 === 1;
}
function closing(src, delimiter, start, singleLine) {
  for (let index = start;index < src.length; index++) {
    if (singleLine && src[index] === `
`)
      break;
    if (src.startsWith(delimiter, index) && !isEscaped(src, index))
      return index;
  }
  return -1;
}
function createMathInlineExtension() {
  return {
    name: "mathInline",
    level: "inline",
    start(src) {
      let i = 0;
      while (i < src.length) {
        const ch = src[i];
        if (ch === "\\") {
          if (src[i + 1] === "(") {
            if (!isEscaped(src, i))
              return i;
          }
          i += 2;
          continue;
        }
        if (ch === "$") {
          if (src[i + 1] === "$") {
            i += 2;
            continue;
          }
          if (!isEscaped(src, i))
            return i;
        }
        i++;
      }
      return;
    },
    tokenizer(src) {
      if (src.startsWith("\\(")) {
        const end = closing(src, "\\)", 2, true);
        if (end > 2 && src.slice(2, end).indexOf(`
`) === -1) {
          const content = src.slice(2, end);
          const raw = src.slice(0, end + 2);
          return {
            type: "mathInline",
            raw,
            text: content,
            content,
            open: "\\(",
            close: "\\)"
          };
        }
      }
      if (src[0] === "$" && src[1] !== "$") {
        let j = 1;
        while (j < src.length) {
          if (src[j] === `
`)
            break;
          if (src[j] === "$" && !isEscaped(src, j)) {
            if (j === 1)
              break;
            const content = src.slice(1, j);
            const raw = src.slice(0, j + 1);
            return {
              type: "mathInline",
              raw,
              text: content,
              content,
              open: "$",
              close: "$"
            };
          }
          j++;
        }
      }
      return;
    }
  };
}
function createMathDisplayExtension() {
  return {
    name: "mathDisplay",
    level: "inline",
    start(src) {
      let i = 0;
      while (i < src.length) {
        const ch = src[i];
        if (ch === "\\") {
          if (src[i + 1] === "[") {
            if (!isEscaped(src, i))
              return i;
          }
          i += 2;
          continue;
        }
        if (ch === "$") {
          if (src[i + 1] === "$" && !isEscaped(src, i))
            return i;
        }
        i++;
      }
      return;
    },
    tokenizer(src) {
      if (src.startsWith("$$")) {
        const end = closing(src, "$$", 2, false);
        if (end > 2) {
          const content = src.slice(2, end);
          const raw = src.slice(0, end + 2);
          return {
            type: "mathDisplay",
            raw,
            text: content,
            content,
            open: "$$",
            close: "$$"
          };
        }
      }
      if (src.startsWith("\\[")) {
        const end = closing(src, "\\]", 2, false);
        if (end > 2) {
          const content = src.slice(2, end);
          const raw = src.slice(0, end + 2);
          return {
            type: "mathDisplay",
            raw,
            text: content,
            content,
            open: "\\[",
            close: "\\]"
          };
        }
      }
      return;
    }
  };
}

// node_modules/opentui-markdown-render/src/core/parse.ts
var parser = new B({
  gfm: true,
  breaks: false,
  async: false,
  extensions: [createMathDisplayExtension(), createMathInlineExtension()]
});
function isDisplay(token) {
  return token.type === "mathDisplay";
}
function isInlineMath(token) {
  return token.type === "mathInline";
}
function childrenOf(token) {
  return "tokens" in token && Array.isArray(token.tokens) ? token.tokens : [];
}
function inlineToken(token) {
  if (isInlineMath(token)) {
    return [{ type: "math", content: token.content, raw: token.raw, open: token.open, close: token.close }];
  }
  if (isDisplay(token))
    return [{ type: "text", text: token.raw }];
  switch (token.type) {
    case "text":
      return childrenOf(token).length ? convertInline(childrenOf(token)) : [{ type: "text", text: token.text }];
    case "escape":
      return [{ type: "text", text: token.text }];
    case "codespan":
      return [{ type: "code", text: token.text }];
    case "strong":
    case "em":
    case "del":
      return [{ type: token.type, children: convertInline(token.tokens ?? []) }];
    case "link":
      return [{ type: "link", href: token.href, title: token.title ?? null, children: convertInline(token.tokens ?? []) }];
    case "image":
      return [{ type: "inline-image", href: token.href, title: token.title ?? null, alt: token.text }];
    case "br":
      return [{ type: "break", hard: true }];
    case "checkbox":
      return [];
    default:
      return token.raw ? [{ type: "text", text: token.raw }] : [];
  }
}
function convertInline(tokens) {
  return tokens.flatMap(inlineToken);
}
function directInline(tokens) {
  return tokens.flatMap((token) => token.type === "text" && childrenOf(token).length ? childrenOf(token) : [token]);
}
function convertParagraph(token, source) {
  const tokens = directInline(childrenOf(token));
  const visible = convertInline(tokens).filter((node) => node.type !== "text" || node.text.trim().length > 0);
  if (visible.length === 1 && visible[0].type === "inline-image") {
    const image = visible[0];
    return [{ type: "image", href: image.href, alt: image.alt, title: image.title, raw: token.raw, source }];
  }
  if (!tokens.some(isDisplay))
    return [{ type: "paragraph", children: convertInline(tokens), raw: token.raw, source }];
  const blocks = [];
  let pending = [];
  let offset = source?.start ?? 0;
  let aligned = source !== null;
  let pendingStart = offset;
  const flush = () => {
    if (!pending.length)
      return;
    const raw = pending.map((child) => child.raw).join("");
    const children = convertInline(pending);
    if (children.length)
      blocks.push({ type: "paragraph", raw, source: aligned ? { start: pendingStart, end: offset } : null, children });
    pending = [];
    pendingStart = offset;
  };
  for (const child of tokens) {
    if (aligned && token.raw.slice(offset - source.start, offset - source.start + child.raw.length) !== child.raw)
      aligned = false;
    if (isDisplay(child)) {
      flush();
      offset += child.raw.length;
      blocks.push({
        type: "display-math",
        content: child.content,
        open: child.open,
        close: child.close,
        raw: child.raw,
        source: aligned ? { start: offset - child.raw.length, end: offset } : null
      });
      pendingStart = offset;
    } else {
      pending.push(child);
      offset += child.raw.length;
    }
  }
  flush();
  return blocks;
}
function convertBlocks(tokens, source, start = 0) {
  const blocks = [];
  let cursor = start;
  for (const token of tokens) {
    const range = source !== null && source.slice(cursor, cursor + token.raw.length) === token.raw ? { start: cursor, end: cursor + token.raw.length } : null;
    cursor += token.raw.length;
    if (token.type === "space" || token.type === "def" || token.type === "checkbox")
      continue;
    if (isDisplay(token)) {
      blocks.push({ type: "display-math", content: token.content, open: token.open, close: token.close, raw: token.raw, source: range });
      continue;
    }
    switch (token.type) {
      case "paragraph":
      case "text":
        blocks.push(...convertParagraph(token, range));
        break;
      case "heading":
        blocks.push({ type: "heading", level: token.depth, children: convertInline(childrenOf(token)), raw: token.raw, source: range });
        break;
      case "blockquote":
        blocks.push({ type: "quote", blocks: convertBlocks(childrenOf(token), null), raw: token.raw, source: range });
        break;
      case "list": {
        const list = token;
        let cursor = 0;
        const items = list.items.map((item) => {
          let itemSource = null;
          if (range !== null && list.raw.slice(cursor, cursor + item.raw.length) === item.raw) {
            itemSource = { start: range.start + cursor, end: range.start + cursor + item.raw.length };
          }
          cursor += item.raw.length;
          return {
            task: item.task,
            checked: item.task ? item.checked ?? false : null,
            loose: item.loose,
            blocks: convertBlocks(item.tokens, null),
            source: itemSource
          };
        });
        blocks.push({
          type: "list",
          raw: list.raw,
          source: range,
          ordered: list.ordered,
          start: list.start === "" ? 1 : list.start,
          loose: list.loose,
          items
        });
        break;
      }
      case "table": {
        const table = token;
        const convertCell = (cell, header, align) => ({
          children: cell ? convertInline(cell.tokens) : [],
          header,
          align
        });
        const align = table.align;
        const header = table.header.map((cell, i) => convertCell(cell, true, align[i] ?? null));
        const rows = table.rows.map((row) => header.map((_, i) => convertCell(row[i], false, align[i] ?? null)));
        blocks.push({ type: "table", align, header, rows, raw: table.raw, source: range });
        break;
      }
      case "code": {
        const language = token.lang ?? null;
        if (language?.trim().split(/\s+/)[0]?.toLowerCase() === "mermaid") {
          blocks.push({ type: "mermaid", content: token.text, language: "mermaid", raw: token.raw, source: range });
        } else {
          blocks.push({ type: "code", content: token.text, language, fenced: /^ {0,3}(?:`{3,}|~{3,})/.test(token.raw), raw: token.raw, source: range });
        }
        break;
      }
      case "hr":
        blocks.push({ type: "rule", raw: token.raw, source: range });
        break;
      default:
        if (token.raw)
          blocks.push({ type: "literal", text: token.raw, raw: token.raw, source: range });
    }
  }
  return blocks;
}
function parseDocument(source) {
  const normalized = source.replace(/\r\n?/g, `
`);
  const blocks = convertBlocks(parser.lexer(normalized), normalized);
  if (normalized === source)
    return { source, blocks };
  const offsets = [0];
  for (let index = 0;index < source.length; index++) {
    if (source[index] === "\r" && source[index + 1] === `
`)
      index++;
    offsets.push(index + 1);
  }
  const originalRange = (range) => range === null ? null : { start: offsets[range.start], end: offsets[range.end] };
  const originalBlock = (block) => {
    if (block.type === "list")
      return {
        ...block,
        source: originalRange(block.source),
        items: block.items.map((item) => ({ ...item, source: originalRange(item.source) }))
      };
    return { ...block, source: originalRange(block.source) };
  };
  return { source, blocks: blocks.map(originalBlock) };
}
// node_modules/opentui-markdown-render/src/config/resolve.ts
function resolveConfiguredTheme(config, runtime = {}) {
  if (runtime.theme)
    return runtime.theme;
  const explicit = runtime.themeMode ?? undefined;
  const override = loadTheme(explicit ?? config.theme?.name ?? "light");
  const mode = override?.mode ?? "light";
  return resolveTheme({ mode, override });
}
function resolveConfiguredLayout(config, runtime) {
  return createDocumentLayout({
    viewport: runtime.viewport,
    frame: runtime.frame ?? config.frame,
    tables: runtime.tables ?? config.tables
  });
}
// node_modules/opentui-markdown-render/src/view/frame.tsx
import { jsxDEV } from "@opentui/solid/jsx-dev-runtime";
var asciiBorder = {
  topLeft: "+",
  topRight: "+",
  bottomLeft: "+",
  bottomRight: "+",
  horizontal: "-",
  vertical: "|",
  topT: "+",
  bottomT: "+",
  leftT: "+",
  rightT: "+",
  cross: "+"
};
function borderStyle(style) {
  if (style === "rounded" || style === "heavy" || style === "double")
    return style;
  return "single";
}
function alignSelf(align) {
  if (align === "left")
    return "flex-start";
  if (align === "right")
    return "flex-end";
  return "center";
}
function frameBorderColor(theme) {
  return theme.frame?.border ?? theme.border.base;
}
function frameTitleColor(theme) {
  return theme.frame?.title ?? theme.text.muted;
}
function borderProps(frame, theme) {
  if (!frame.enabled)
    return {};
  return {
    border: true,
    borderStyle: borderStyle(frame.style),
    customBorderChars: frame.style === "ascii" ? asciiBorder : undefined,
    borderColor: frameBorderColor(theme),
    title: frame.title,
    titleColor: frameTitleColor(theme),
    titleAlignment: frame.titleAlign
  };
}
function MarkdownFrame(props) {
  return /* @__PURE__ */ jsxDEV("box", {
    width: props.frame.width,
    alignSelf: alignSelf(props.frame.align),
    flexDirection: "column",
    flexShrink: 0,
    backgroundColor: props.theme.background.base,
    paddingLeft: props.frame.paddingX,
    paddingRight: props.frame.paddingX,
    paddingTop: props.frame.paddingY,
    paddingBottom: props.frame.paddingY,
    ...borderProps(props.frame, props.theme),
    children: props.children
  }, undefined, false, undefined, this);
}

// node_modules/opentui-markdown-render/src/view/document.tsx
import { createMemo as createMemo5, For as For2 } from "solid-js";

// node_modules/opentui-markdown-render/src/media.tsx
var import_gifuct_js = __toESM(require_lib2(), 1);
import { NativeImage, imageInfo, parseColor as parseColor2 } from "@opentui/core";
import path4 from "path";
import { createEffect, createResource, createSignal as createSignal2, Match, onCleanup as onCleanup2, Switch } from "solid-js";
import { jsxDEV as jsxDEV2 } from "@opentui/solid/jsx-dev-runtime";
var maxRows = 32;
var maxColumns = 80;
var TRANSPARENT_BACKGROUND = "#000000";
function isRgba(value) {
  return typeof value === "object" && value !== null && "r" in value && "g" in value && "b" in value;
}
function resolveBackground(input) {
  if (input === undefined)
    return [0, 0, 0];
  if (isRgba(input)) {
    const channel = (value) => Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 255);
    return [channel(input.r), channel(input.g), channel(input.b)];
  }
  try {
    const color = parseColor2(input);
    const channel = (value) => Math.round(Math.max(0, Math.min(1, value)) * 255);
    return [channel(color.r), channel(color.g), channel(color.b)];
  } catch {
    const color = parseColor2(TRANSPARENT_BACKGROUND);
    return [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255)];
  }
}
function rgbToHex(color) {
  const channel = (value) => Math.round(value).toString(16).padStart(2, "0");
  return `#${channel(color[0])}${channel(color[1])}${channel(color[2])}`;
}
function resolveLocalImage(base, href) {
  if (!base)
    return { error: "No asset base is configured" };
  if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith("//"))
    return { error: "Only local image paths are supported" };
  const root = path4.resolve(base);
  const target = path4.resolve(root, href);
  if (target !== root && !target.startsWith(`${root}${path4.sep}`))
    return { error: "Image path escapes the asset root" };
  return { path: target };
}
function imageBox(width, height, columns, cellAspectRatio, limits) {
  const ratio = width / height;
  const aspect = Number.isFinite(cellAspectRatio) && cellAspectRatio > 0 ? cellAspectRatio : 2;
  const columnLimit = Math.max(1, limits?.maxColumns ?? maxColumns);
  const rowLimit = Math.max(1, limits?.maxRows ?? maxRows);
  const clamped = Math.max(1, Math.min(Math.max(1, columns), columnLimit));
  const naturalRows = Math.max(1, Math.ceil(clamped / (ratio * aspect)));
  if (naturalRows <= rowLimit)
    return { columns: clamped, rows: naturalRows };
  return { columns: Math.max(1, Math.round(ratio * rowLimit * aspect)), rows: rowLimit };
}
function LocalImage(props) {
  const [failure, setFailure] = createSignal2();
  const [loaded] = createResource(() => JSON.stringify({
    href: props.href,
    base: props.base(),
    columns: props.columns(),
    cell: props.cell() ?? null,
    background: rgbToHex(resolveBackground(props.background())),
    limits: props.limits ?? null
  }), async (key) => {
    const input = JSON.parse(key);
    const resolved = resolveLocalImage(input.base, input.href);
    if (resolved.path === undefined)
      return { error: resolved.error ?? "Image path is invalid" };
    const file = Bun.file(resolved.path);
    if (!await file.exists())
      return { error: `Image does not exist: ${input.href}` };
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const info = imageInfo(bytes);
      const box = imageBox(info.width, info.height, Math.max(1, input.columns), input.cell ? input.cell.height / input.cell.width : 2, input.limits ?? undefined);
      const target = { width: Math.max(1, Math.round(box.columns * (input.cell?.width ?? 8))), height: Math.max(1, Math.round(box.rows * (input.cell?.height ?? 16))) };
      const background = resolveBackground(input.background);
      if (info.format === "gif")
        return loadGif(bytes, box, target, background);
      return { box, image: prepareImage(NativeImage.decode(bytes), target, background) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  });
  const media = () => {
    const value = loaded();
    return value && !("error" in value) ? value : undefined;
  };
  const error = () => {
    const value = loaded();
    return failure() ?? (value && "error" in value ? value.error : undefined);
  };
  const [frame, setFrame] = createSignal2();
  createEffect(() => {
    const value = media();
    if (!value?.frames?.length) {
      setFrame(value?.image);
      return;
    }
    let index = 0;
    let timer;
    const next = () => {
      const current = value.frames[index];
      setFrame(current.image);
      index = (index + 1) % value.frames.length;
      timer = setTimeout(next, current.delay);
    };
    next();
    onCleanup2(() => {
      if (timer)
        clearTimeout(timer);
    });
  });
  createEffect(() => {
    const value = media();
    onCleanup2(() => disposeMedia(value));
  });
  return /* @__PURE__ */ jsxDEV2("box", {
    width: "100%",
    flexDirection: "column",
    flexShrink: 0,
    overflow: "hidden",
    children: /* @__PURE__ */ jsxDEV2(Switch, {
      children: [
        /* @__PURE__ */ jsxDEV2(Match, {
          when: loaded.loading,
          children: /* @__PURE__ */ jsxDEV2("box", {
            width: "100%",
            flexDirection: "row",
            children: [
              /* @__PURE__ */ jsxDEV2("text", {
                fg: props.labelColor?.(),
                flexShrink: 0,
                children: "Loading image: "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("text", {
                fg: props.textColor?.(),
                wrapMode: "word",
                flexGrow: 1,
                children: props.alt || props.href
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2(Match, {
          when: error(),
          children: /* @__PURE__ */ jsxDEV2("box", {
            width: "100%",
            flexDirection: "row",
            children: [
              /* @__PURE__ */ jsxDEV2("text", {
                fg: props.labelColor?.(),
                flexShrink: 0,
                children: "Could not render image "
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV2("text", {
                fg: props.textColor?.(),
                wrapMode: "word",
                flexGrow: 1,
                children: `${props.alt || props.href}: ${error()}`
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV2(Match, {
          when: media() && frame(),
          children: /* @__PURE__ */ jsxDEV2("image", {
            id: `opentui-markdown-image-${props.href}`,
            source: frame(),
            fit: "fit",
            protocol: "auto",
            width: media().box.columns,
            height: media().box.rows,
            onError: (error) => setFailure(error instanceof Error ? error.message : String(error))
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        "      "
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}
function loadGif(bytes, box, target, background) {
  const gif = import_gifuct_js.parseGIF(bytes.slice().buffer);
  const width = gif.lsd.width;
  const height = gif.lsd.height;
  const canvas = new Uint8Array(width * height * 4);
  const frames = import_gifuct_js.decompressFrames(gif, true).map((frame) => {
    const before = canvas.slice();
    drawPatch(canvas, width, height, frame.patch, frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
    const image = prepareImage(NativeImage.fromRgba(canvas.slice(), width, height), target, background);
    if (frame.disposalType === 2)
      clearPatch(canvas, width, frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
    if (frame.disposalType === 3)
      canvas.set(before);
    return { image, delay: Math.max(50, frame.delay || 100) };
  });
  if (!frames.length)
    throw new Error("GIF contains no frames");
  return { box, frames };
}
function drawPatch(canvas, width, height, patch, left, top, patchWidth, patchHeight) {
  for (let y = 0;y < patchHeight; y++) {
    if (top + y < 0 || top + y >= height)
      continue;
    for (let x = 0;x < patchWidth; x++) {
      if (left + x < 0 || left + x >= width)
        continue;
      const source = (y * patchWidth + x) * 4;
      const target = ((top + y) * width + left + x) * 4;
      const alpha = patch[source + 3] / 255;
      const inverse = 1 - alpha;
      canvas[target] = Math.round(patch[source] * alpha + canvas[target] * inverse);
      canvas[target + 1] = Math.round(patch[source + 1] * alpha + canvas[target + 1] * inverse);
      canvas[target + 2] = Math.round(patch[source + 2] * alpha + canvas[target + 2] * inverse);
      canvas[target + 3] = Math.round((alpha + canvas[target + 3] / 255 * inverse) * 255);
    }
  }
}
function clearPatch(canvas, width, left, top, patchWidth, patchHeight) {
  for (let y = 0;y < patchHeight; y++) {
    for (let x = 0;x < patchWidth; x++)
      canvas.fill(0, ((top + y) * width + left + x) * 4, ((top + y) * width + left + x + 1) * 4);
  }
}
function prepareImage(image, target, background) {
  const targetWidth = Math.max(1, Math.round(target.width));
  const targetHeight = Math.max(1, Math.round(target.height));
  const scale = Math.min(targetWidth / image.width, targetHeight / image.height);
  const newWidth = Math.max(1, Math.round(image.width * scale));
  const newHeight = Math.max(1, Math.round(image.height * scale));
  const resized = scale !== 1 ? image.resize({ width: newWidth, height: newHeight }) : image;
  if (resized !== image)
    image.dispose();
  if (!resized.info().hasAlpha)
    return resized;
  const raw = resized.raw();
  const pixels = new Uint8Array(raw.width * raw.height * 4);
  const color = background;
  for (let index = 0;index < pixels.length; index += 4) {
    const alpha = raw.data[index + 3] / 255;
    pixels[index] = Math.round(raw.data[index] * alpha + color[0] * (1 - alpha));
    pixels[index + 1] = Math.round(raw.data[index + 1] * alpha + color[1] * (1 - alpha));
    pixels[index + 2] = Math.round(raw.data[index + 2] * alpha + color[2] * (1 - alpha));
    pixels[index + 3] = 255;
  }
  const composited = NativeImage.fromRgba(pixels, raw.width, raw.height);
  resized.dispose();
  return composited;
}
function disposeMedia(media) {
  media?.image?.dispose();
  media?.frames?.forEach((frame) => frame.image.dispose());
}

// node_modules/opentui-markdown-render/src/view/code.tsx
import { infoStringToFiletype } from "@opentui/core";
import { useRenderer } from "@opentui/solid";
import { onCleanup as onCleanup3 } from "solid-js";

// node_modules/opentui-markdown-render/src/theme/syntax.ts
import { SyntaxStyle } from "@opentui/core";
function generateSyntax(theme, headings = defaultHeadingStyles, defaultColor = theme.text.base, owner) {
  const { markdown, syntax, text } = theme;
  const feedback = text.feedback;
  const headingStyle = (level) => {
    const style = headings[level];
    return {
      bold: style.bold,
      italic: style.italic,
      underline: style.underline,
      dim: style.dim
    };
  };
  const headingRules = headingLevels.map((level) => rule([`markup.heading.${level}`], headingColor(theme, level), headingStyle(level)));
  const rules = [
    rule(["default"], defaultColor),
    rule(["prompt"], theme.accent),
    rule(["comment", "comment.documentation"], syntax.comment, { italic: true }),
    rule(["string", "symbol", "character.special", "character"], syntax.string),
    rule(["number", "boolean", "constant", "float"], syntax.number),
    rule(["keyword.return", "keyword.conditional", "keyword.repeat", "keyword.coroutine"], syntax.keyword, {
      italic: true
    }),
    rule(["keyword.type"], syntax.type, { bold: true, italic: true }),
    rule(["keyword.function", "function.method"], syntax.function),
    rule(["keyword"], syntax.keyword, { italic: true }),
    rule(["keyword.import", "string.escape", "string.regexp", "tag.attribute", "keyword.export"], syntax.keyword),
    rule(["operator", "keyword.operator", "punctuation.delimiter", "keyword.conditional.ternary"], syntax.operator),
    rule(["variable", "variable.parameter", "function.method.call", "function.call", "property", "parameter", "field"], syntax.variable),
    rule(["variable.member", "function", "constructor"], syntax.function),
    rule(["type", "module", "class", "namespace"], syntax.type),
    rule(["type.definition"], syntax.type, { bold: true }),
    rule(["punctuation", "punctuation.bracket"], syntax.punctuation),
    rule(["variable.builtin", "type.builtin", "function.builtin", "module.builtin", "constant.builtin", "variable.super"], feedback.error),
    rule(["keyword.directive", "keyword.modifier", "keyword.exception"], syntax.keyword, { italic: true }),
    rule(["punctuation.special", "tag.delimiter"], syntax.operator),
    rule(["markup.heading"], headingColor(theme, 1), headingStyle(1)),
    ...headingRules,
    rule(["markup.bold", "markup.strong"], markdown.strong, { bold: true }),
    rule(["markup.italic"], markdown.emphasis, { italic: true }),
    rule(["markup.list"], markdown.listItem),
    rule(["markup.list.enumeration"], markdown.listEnumeration),
    rule(["markup.quote"], markdown.blockQuote, { italic: true }),
    rule(["markup.raw"], markdown.code),
    rule(["markup.raw.block"], markdown.codeBlock),
    rule(["markup.raw.inline"], markdown.code, { background: theme.background.base }),
    rule(["markup.link", "markup.link.url", "string.special", "string.special.url"], markdown.link, {
      underline: true
    }),
    rule(["markup.link.label"], markdown.linkText, { underline: true }),
    rule(["label"], markdown.linkText),
    rule(["markup.underline"], text.base, { underline: true }),
    rule(["markup.strikethrough", "markup.list.unchecked", "debug"], text.muted),
    rule(["markup.list.checked"], feedback.success),
    rule(["comment.error"], feedback.error, { italic: true, bold: true }),
    rule(["comment.warning"], feedback.warning, { italic: true, bold: true }),
    rule(["comment.todo", "comment.note"], feedback.info, { italic: true, bold: true }),
    rule(["attribute", "annotation"], feedback.warning),
    rule(["tag"], feedback.error),
    rule(["diff.plus"], theme.diff.text.added, { background: theme.diff.background.added }),
    rule(["diff.minus"], theme.diff.text.removed, { background: theme.diff.background.removed }),
    rule(["diff.delta"], theme.diff.text.context, { background: theme.diff.background.context }),
    rule(["error"], feedback.error, { bold: true }),
    rule(["warning"], feedback.warning, { bold: true }),
    rule(["info"], feedback.info)
  ];
  const fromTheme = SyntaxStyle.fromTheme;
  return fromTheme(rules, owner);
}
function rule(scope, foreground, style = {}) {
  return { scope, style: { foreground, ...style } };
}

// node_modules/opentui-markdown-render/src/view/code.tsx
import { jsxDEV as jsxDEV3 } from "@opentui/solid/jsx-dev-runtime";
function CodeBlock(props) {
  const renderer = useRenderer();
  const nativeScene = renderer.nativeScene;
  const owned = props.syntaxStyle ? undefined : generateSyntax(props.theme, props.headings, props.theme.markdown.codeBlock, nativeScene);
  onCleanup3(() => owned?.destroy());
  return /* @__PURE__ */ jsxDEV3("code", {
    content: props.content,
    filetype: infoStringToFiletype(props.language ?? ""),
    syntaxStyle: props.syntaxStyle ?? owned,
    fg: props.theme.markdown.codeBlock,
    bg: props.theme.background.base,
    conceal: false,
    drawUnstyledText: true,
    streaming: false,
    width: "100%"
  }, undefined, false, undefined, this);
}

// node_modules/opentui-markdown-render/src/view/document-slots.ts
import { createSignal as createSignal3 } from "solid-js";
function sameKind(old, next) {
  if (old.type !== next.type)
    return false;
  return old.type !== "mermaid" || next.type === "mermaid" && old.language === next.language;
}
function sameValue(a, b) {
  if (Object.is(a, b))
    return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null)
    return false;
  if (Array.isArray(a) !== Array.isArray(b))
    return false;
  if (Array.isArray(a)) {
    const other = b;
    return a.length === other.length && a.every((value, index) => sameValue(value, other[index]));
  }
  const left = a;
  const right = b;
  const keys = Object.keys(left);
  const otherKeys = Object.keys(right);
  return keys.filter((key) => key !== "source").length === otherKeys.filter((key) => key !== "source").length && keys.every((key) => key === "source" || Object.prototype.hasOwnProperty.call(right, key) && sameValue(left[key], right[key]));
}
function sameBlock(old, next) {
  return sameValue(old, next);
}
function sameRange(old, next) {
  return old?.start === next?.start && old?.end === next?.end;
}
function sameUnitRanges(old, next) {
  if (!sameRange(old.source, next.source))
    return false;
  if (old.type !== "list" || next.type !== "list")
    return true;
  return old.items.length === next.items.length && old.items.every((item, index) => sameRange(item.source, next.items[index]?.source));
}
function refresh(slot, next) {
  const changed = !sameBlock(slot.block(), next);
  if (changed)
    slot.update(next);
  if (changed || !sameUnitRanges(slot.latest(), next))
    slot.updateLatest(next);
}
function createSlot(block) {
  const [get, set] = createSignal3(block);
  const [latest, updateLatest] = createSignal3(block);
  return { kind: block.type, block: get, update: set, latest, updateLatest };
}
function reconcileSlots(prev, next) {
  if (prev.length === 0) {
    return next.map(createSlot);
  }
  let prefix = 0;
  while (prefix < prev.length && prefix < next.length) {
    const old = prev[prefix].block();
    const incoming = next[prefix];
    if (!sameKind(old, incoming) || old.raw !== incoming.raw)
      break;
    refresh(prev[prefix], incoming);
    prefix++;
  }
  let suffix = 0;
  while (suffix < prev.length - prefix && suffix < next.length - prefix) {
    const old = prev[prev.length - 1 - suffix].block();
    const incoming = next[next.length - 1 - suffix];
    if (!sameKind(old, incoming) || old.raw !== incoming.raw)
      break;
    refresh(prev[prev.length - 1 - suffix], incoming);
    suffix++;
  }
  const result = [];
  for (let i = 0;i < prefix; i++)
    result.push(prev[i]);
  if (prev.length - prefix - suffix === 1 && next.length - prefix - suffix === 1) {
    const slot = prev[prefix];
    const incoming = next[prefix];
    if (sameKind(slot.block(), incoming)) {
      refresh(slot, incoming);
      result.push(slot);
    } else {
      result.push(createSlot(incoming));
    }
  } else {
    for (let i = prefix;i < next.length - suffix; i++) {
      const b = next[i];
      result.push(createSlot(b));
    }
  }
  for (let i = prev.length - suffix;i < prev.length; i++)
    result.push(prev[i]);
  return result;
}

// node_modules/opentui-markdown-render/src/view/document-table.tsx
import { TextAttributes as TextAttributes3, TextTableRenderable as TextTableRenderable2 } from "@opentui/core";
import { extend } from "@opentui/solid";

// node_modules/opentui-markdown-render/src/view/table.ts
import {
  BoxRenderable
} from "@opentui/core";
function tableWidth(table) {
  const layout = table.computeLayout?.(undefined);
  const width = layout?.tableWidth;
  if (typeof width === "number" && Number.isFinite(width) && width > 0)
    return Math.round(width);
  return Number.isFinite(table.width) ? Math.round(table.width) : 0;
}

class ScrollableTableRenderable extends BoxRenderable {
  table;
  offset = 0;
  panEnabled = true;
  dragX;
  constructor(ctx, table) {
    super(ctx, {
      width: "100%",
      flexDirection: "row",
      flexShrink: 0,
      overflow: "hidden"
    });
    this.table = table;
    table.flexShrink = 0;
    this.add(table);
    this.onMouseDown = (event) => {
      if (event.button !== 0)
        return;
      this.dragX = event.x;
    };
    this.onMouseDrag = (event) => {
      if (this.dragX === undefined || !this.panEnabled)
        return;
      const dx = event.x - this.dragX;
      this.dragX = event.x;
      if (!dx || !this.overflows())
        return;
      event.preventDefault();
      event.stopPropagation();
      this.scrollBy(-dx);
    };
    this.onMouseDragEnd = () => {
      this.dragX = undefined;
    };
    this.onMouseUp = () => {
      this.dragX = undefined;
    };
    this.onMouseScroll = (event) => {
      const direction = event.scroll?.direction;
      if (!this.panEnabled || direction !== "left" && direction !== "right")
        return;
      if (!this.overflows())
        return;
      event.preventDefault();
      event.stopPropagation();
      this.scrollBy(direction === "left" ? -2 : 2);
    };
  }
  onResize(width, _height) {
    super.onResize(width, _height);
    this.syncOverflowState(width);
  }
  syncOverflowState(width = this.width) {
    if (!Number.isFinite(width) || width <= 0)
      return;
    const viewport = Math.round(width);
    const max = Math.max(0, tableWidth(this.table) - viewport);
    this.offset = this.panEnabled ? Math.min(this.offset, max) : 0;
    this.table.marginLeft = -this.offset;
    this.table.selectable = !this.panEnabled || max === 0;
  }
  overflows(width = this.width) {
    const viewportWidth = Number.isFinite(width) ? Math.round(width) : 0;
    return tableWidth(this.table) > viewportWidth;
  }
  scrollBy(delta) {
    const viewportWidth = Number.isFinite(this.width) ? Math.round(this.width) : 0;
    const max = Math.max(0, tableWidth(this.table) - viewportWidth);
    this.offset = Math.max(0, Math.min(max, this.offset + delta));
    this.table.marginLeft = -this.offset;
  }
}

// node_modules/opentui-markdown-render/src/view/inline-style.ts
import { TextAttributes as TextAttributes2 } from "@opentui/core";
function flattenInline(inlines, ctx) {
  const out = [];
  const baseAttr = (ctx.attributes ?? 0) | (ctx.heading ? headingAttributes(ctx.headings[ctx.heading.level]) : 0) | (ctx.quote ? TextAttributes2.ITALIC : 0);
  const quote = !!ctx.quote;
  const linkCtx = ctx.link;
  function walk(list, attr, link) {
    for (const node of list) {
      if (node.type === "text") {
        let fg = ctx.theme.markdown.text;
        if (quote && !link && !ctx.heading)
          fg = ctx.theme.markdown.blockQuote;
        if (ctx.heading)
          fg = headingColor(ctx.theme, ctx.heading.level);
        if (link)
          fg = ctx.theme.markdown.linkText;
        else if (attr & TextAttributes2.BOLD && !ctx.heading)
          fg = ctx.theme.markdown.strong;
        else if (attr & TextAttributes2.ITALIC && !ctx.heading && !quote)
          fg = ctx.theme.markdown.emphasis;
        if (node.text)
          out.push({ type: "text", text: node.text, fg, attributes: baseAttr | attr | (link ? TextAttributes2.UNDERLINE : 0), href: link?.href });
        continue;
      }
      if (node.type === "code") {
        const fg = ctx.theme.markdown.code;
        out.push({ type: "text", text: node.text, fg, attributes: TextAttributes2.NONE, href: link?.href });
        continue;
      }
      if (node.type === "math") {
        out.push({ type: "math", content: node.content, raw: node.raw, open: node.open, close: node.close });
        continue;
      }
      if (node.type === "break") {
        out.push({ type: "break", hard: true });
        continue;
      }
      if (node.type === "strong") {
        walk(node.children, attr | TextAttributes2.BOLD, link);
        continue;
      }
      if (node.type === "em") {
        walk(node.children, attr | TextAttributes2.ITALIC, link);
        continue;
      }
      if (node.type === "del") {
        walk(node.children, attr | TextAttributes2.STRIKETHROUGH, link);
        continue;
      }
      if (node.type === "link") {
        const l = { href: node.href, title: node.title };
        walk(node.children, attr, l);
        const label = node.children.map((child) => child.type === "text" || child.type === "code" ? child.text : "").join("");
        if (ctx.hyperlinks === false && label !== node.href) {
          out.push({ type: "text", text: ` (${node.href})`, fg: ctx.theme.markdown.link, attributes: baseAttr, href: node.href });
        }
        continue;
      }
      if (node.type === "inline-image") {
        const l = link;
        out.push({ type: "text", text: node.alt || node.href || "image", fg: ctx.theme.markdown.linkText, attributes: baseAttr | attr, href: l?.href || node.href });
        continue;
      }
    }
  }
  walk(inlines, baseAttr, linkCtx);
  return out;
}
function toTableChunks(inlines, theme, headings, hyperlinks = true) {
  const chunks = [];
  for (const atom of flattenInline(inlines, { theme, headings, hyperlinks })) {
    if (atom.type === "text") {
      chunks.push({
        __isChunk: true,
        text: atom.text,
        fg: atom.fg,
        attributes: atom.attributes,
        ...atom.href ? { link: { url: atom.href } } : {}
      });
    } else if (atom.type === "math") {
      chunks.push({ __isChunk: true, text: atom.raw, fg: theme.markdown.text });
    } else {
      chunks.push({ __isChunk: true, text: `
`, fg: theme.markdown.text });
    }
  }
  return chunks.length ? chunks : [{ __isChunk: true, text: " ", fg: theme.markdown.text }];
}

// node_modules/opentui-markdown-render/src/view/document-table.tsx
import { jsxDEV as jsxDEV4 } from "@opentui/solid/jsx-dev-runtime";

class MarkdownTableRenderable extends ScrollableTableRenderable {
  constructor(ctx, _options) {
    const defaults = resolveTableOptions();
    const table = new TextTableRenderable2(ctx, {
      content: [],
      columnWidthMode: defaults.widthMode,
      columnFitter: defaults.columnFitter,
      cellPaddingX: defaults.cellPaddingX,
      wrapMode: defaults.wrapMode,
      showBorders: true,
      border: true,
      outerBorder: true,
      borderStyle: "single",
      selectable: true
    });
    super(ctx, table);
  }
  get tableData() {
    return this.table.content;
  }
  set tableData(value) {
    this.table.content = value;
    this.syncOverflowState();
  }
  get resolved() {
    return {
      widthMode: this.table.columnWidthMode,
      columnFitter: this.table.columnFitter,
      cellPaddingX: this.table.cellPaddingX,
      wrapMode: this.table.wrapMode === "none" ? "none" : "word",
      overflow: this.panEnabled ? "scroll" : "wrap"
    };
  }
  set resolved(value) {
    this.table.columnWidthMode = value.widthMode;
    this.table.columnFitter = value.columnFitter;
    this.table.cellPaddingX = value.cellPaddingX;
    this.table.wrapMode = value.wrapMode;
    this.panEnabled = value.widthMode === "content" && value.overflow === "scroll";
    this.syncOverflowState();
  }
  get foreground() {
    return this.table.fg;
  }
  set foreground(value) {
    this.table.fg = value;
    this.syncOverflowState();
  }
  get tableBorderColor() {
    return this.table.borderColor;
  }
  set tableBorderColor(value) {
    this.table.borderColor = value;
  }
  get background() {
    return this.backgroundColor;
  }
  set background(value) {
    this.backgroundColor = value;
    this.syncOverflowState();
  }
}
extend({ md_text_table: MarkdownTableRenderable });
function TableBlock(props) {
  const cell = (inlines, header) => {
    const chunks = toTableChunks(inlines, props.theme, props.headings, props.hyperlinks);
    if (!header)
      return chunks;
    return chunks.map((chunk) => ({ ...chunk, fg: props.theme.markdown.heading, attributes: TextAttributes3.BOLD }));
  };
  const content = () => [
    props.block.header.map((value) => cell(value.children, true)),
    ...props.block.rows.map((row) => row.map((value) => cell(value.children, false)))
  ];
  return /* @__PURE__ */ jsxDEV4("md_text_table", {
    tableData: content(),
    resolved: props.options,
    foreground: props.theme.markdown.text,
    background: props.theme.background.base,
    tableBorderColor: props.theme.border.base
  }, undefined, false, undefined, this);
}

// node_modules/opentui-markdown-render/src/view/inline-flow.tsx
import { createEffect as createEffect2, createMemo as createMemo3, For, Show as Show2 } from "solid-js";
import { StyledText } from "@opentui/core";

// node_modules/opentui-markdown-render/src/view/inline-layout.ts
function hardChunks(content, columns) {
  const chunks = [];
  let current = "";
  for (const character of content) {
    if (current && stringWidth(current + character) > columns) {
      chunks.push(current);
      current = character;
      continue;
    }
    current += character;
  }
  if (current)
    chunks.push(current);
  return chunks;
}
function layoutAtoms(atoms, columns, measureOf, compactOverflow) {
  columns = Math.max(1, columns);
  const lines = [];
  let current = { runs: [], columns: 0, height: 1, textRow: 0 };
  const flush = (force = false) => {
    if (!current.runs.length && !force)
      return;
    lines.push(current);
    current = { runs: [], columns: 0, height: 1, textRow: 0 };
  };
  const place = (run, textRow = 0) => {
    const add = (entry) => {
      current.runs.push(entry);
      current.columns += entry.columns;
      current.height = Math.max(current.height, entry.rows, textRow + 1);
      current.textRow = Math.max(current.textRow, textRow);
    };
    if (current.columns + run.columns <= columns || !current.runs.length) {
      add(run);
      return;
    }
    if (run.atom.type === "text") {
      const text = run.atom.text.trimStart();
      const trimmed = { ...run, atom: { ...run.atom, text }, columns: stringWidth(text) };
      if (current.columns + trimmed.columns <= columns) {
        add(trimmed);
        return;
      }
      flush();
      add(trimmed);
      return;
    }
    flush();
    add(run);
  };
  for (const atom of atoms) {
    if (atom.type === "break") {
      flush(true);
      continue;
    }
    if (atom.type === "math") {
      const natural = measureOf(atom.content)?.normal;
      const squeezed = natural ? natural.columns > columns : false;
      const entry = natural ? { atom, columns: squeezed ? columns : natural.columns, rows: Math.max(1, Math.round(squeezed ? natural.rows * columns / natural.columns : natural.rows)) } : { atom, columns: Math.min(columns, Math.max(3, atom.raw.length)), rows: 1 };
      place(entry, natural ? Math.max(0, Math.ceil(natural.baseline) - 1) : 0);
      continue;
    }
    const normalized = atom.text.replace(/\r?\n/g, " ");
    const words = normalized.match(/\s*\S+\s*/g) ?? (normalized ? [normalized] : []);
    for (const word of words) {
      if (stringWidth(word) > columns) {
        for (const chunk of hardChunks(word.trimEnd(), columns)) {
          place({ atom: { ...atom, text: chunk }, columns: stringWidth(chunk), rows: 1 });
        }
      } else {
        place({ atom: { ...atom, text: word }, columns: stringWidth(word), rows: 1 });
      }
    }
  }
  flush();
  if (compactOverflow) {
    let changed = true;
    while (changed) {
      changed = false;
      const occupied = lines.flatMap((line, row) => {
        let column = 0;
        return line.runs.map((entry) => {
          const area = {
            entry,
            column,
            row: row + (entry.atom.type === "text" ? line.textRow : 0),
            rows: entry.atom.type === "math" ? entry.rows : 1
          };
          column += entry.columns;
          return area;
        });
      });
      for (const area of occupied) {
        if (area.entry.atom.type !== "math" || area.entry.variant === "compact" || area.rows <= 1)
          continue;
        const collision = occupied.some((other) => other.entry !== area.entry && other.column < area.column + area.entry.columns && area.column < other.column + other.entry.columns && other.row < area.row + area.rows && area.row + 1 < other.row + other.rows);
        if (!collision)
          continue;
        const compact = measureOf(area.entry.atom.content)?.compact;
        if (!compact)
          continue;
        area.entry.variant = "compact";
        area.entry.columns = compact.columns;
        area.entry.rows = compact.rows;
        changed = true;
      }
    }
  }
  for (const line of lines) {
    const entry = line.runs.at(-1);
    if (!entry || entry.atom.type !== "math" || entry.variant === "compact")
      continue;
    const standard = measureOf(entry.atom.content)?.standard;
    if (!standard || line.columns - entry.columns + standard.columns > columns)
      continue;
    entry.variant = "standard";
    entry.columns = standard.columns;
    entry.rows = standard.rows;
  }
  for (const line of lines) {
    line.columns = line.runs.reduce((total, entry) => total + entry.columns, 0);
    line.textRow = Math.max(0, ...line.runs.flatMap((entry) => {
      if (entry.atom.type !== "math")
        return [];
      const measured = measureOf(entry.atom.content);
      return measured ? [Math.max(0, Math.ceil(measured[entry.variant ?? "normal"].baseline) - 1)] : [];
    }));
    line.height = Math.max(1, line.textRow + 1, ...line.runs.map((entry) => entry.rows));
  }
  return lines;
}

// node_modules/opentui-markdown-render/src/view/inline-math.ts
import { createMemo as createMemo2, createResource as createResource2 } from "solid-js";
function useInlineMathImages(contents, foreground, background, cell) {
  const [rendered] = createResource2(() => JSON.stringify({ contents: contents(), color: foreground(), surface: background(), cell: cell() }), async (key) => {
    const input = JSON.parse(key);
    return Promise.all(input.contents.map(async (content) => {
      try {
        const normal = await renderMathImage(content, false, input.color, input.surface, input.cell);
        if (!normal)
          return;
        const compact = normal.rows > 1 ? await renderMathImage(content, false, input.color, input.surface, input.cell, 1, true) : normal;
        const standard = normal.clamped ? await renderMathImage(content, false, input.color, input.surface, input.cell, 1, false, true) : normal;
        return { normal, compact: compact ?? normal, standard: standard ?? normal };
      } catch {
        return;
      }
    }));
  });
  return createMemo2(() => {
    const values = rendered();
    if (!values)
      return new Map;
    return new Map(contents().flatMap((content, index) => {
      const image = values[index];
      return image ? [[content, image]] : [];
    }));
  });
}

// node_modules/opentui-markdown-render/src/view/inline-flow.tsx
import { jsxDEV as jsxDEV5 } from "@opentui/solid/jsx-dev-runtime";
function PrefixSegment(props) {
  let ref;
  createEffect2(() => {
    if (ref)
      ref.content = new StyledText(props.chunks());
  });
  return /* @__PURE__ */ jsxDEV5("text", {
    ref,
    wrapMode: "none",
    width: props.width,
    flexShrink: 0
  }, undefined, false, undefined, this);
}
function StyledSegment(props) {
  let ref;
  createEffect2(() => {
    const atom = props.entry.atom;
    if (ref && atom.type === "text") {
      ref.content = new StyledText([{
        __isChunk: true,
        text: atom.text,
        fg: atom.fg,
        attributes: atom.attributes,
        ...atom.href ? { link: { url: atom.href } } : {}
      }]);
    }
  });
  return /* @__PURE__ */ jsxDEV5("text", {
    ref,
    width: props.entry.columns,
    flexShrink: 0,
    wrapMode: "none",
    marginTop: props.textRow
  }, undefined, false, undefined, this);
}
function InlineFlow(props) {
  const atoms = createMemo3(() => {
    const ctx = {
      theme: props.theme,
      headings: props.headings,
      quote: props.quote,
      heading: props.heading,
      hyperlinks: props.graphics.hyperlinks?.() ?? true
    };
    return flattenInline(props.inlines, ctx);
  });
  const contents = createMemo3(() => [...new Set(atoms().flatMap((atom) => atom.type === "math" ? [atom.content] : []))]);
  const foreground = () => rgbaToHex(props.heading ? headingColor(props.theme, props.heading.level) : props.theme.text.base);
  const images = useInlineMathImages(contents, foreground, props.surface, props.graphics.cell);
  const scale = createMemo3(() => mosaicScale(props.graphics.protocol()));
  const prefixWidth = () => props.prefix?.(0).length ?? 0;
  const columns = () => Math.max(1, props.columns - prefixWidth());
  const lines = createMemo3(() => layoutAtoms(atoms(), columns(), (content) => {
    const image = images().get(content);
    if (!image)
      return;
    return {
      normal: { columns: Math.max(1, Math.round(image.normal.columns * scale())), rows: Math.max(1, Math.round(image.normal.rows * scale())), baseline: image.normal.baseline * scale() },
      compact: { columns: Math.max(1, Math.round(image.compact.columns * scale())), rows: image.compact.rows === 1 ? 1 : Math.max(1, Math.round(image.compact.rows * scale())), baseline: image.compact.baseline * scale() },
      standard: { columns: Math.max(1, Math.round(image.standard.columns * scale())), rows: Math.max(1, Math.round(image.standard.rows * scale())), baseline: image.standard.baseline * scale() }
    };
  }, props.graphics.protocol() !== "blocks"));
  return /* @__PURE__ */ jsxDEV5("box", {
    width: "100%",
    flexDirection: "column",
    flexShrink: 0,
    children: /* @__PURE__ */ jsxDEV5(For, {
      each: lines(),
      children: (line, index) => /* @__PURE__ */ jsxDEV5("box", {
        flexDirection: "row",
        alignItems: "flex-start",
        width: "100%",
        height: line.height,
        flexShrink: 0,
        backgroundColor: props.theme.background.base,
        children: [
          /* @__PURE__ */ jsxDEV5(Show2, {
            when: props.prefix,
            children: /* @__PURE__ */ jsxDEV5(Show2, {
              when: props.prefixChunks,
              fallback: /* @__PURE__ */ jsxDEV5("text", {
                fg: props.prefixColor?.() ?? props.theme.markdown.text,
                wrapMode: "none",
                width: prefixWidth(),
                flexShrink: 0,
                children: props.prefix?.(index()) ?? ""
              }, undefined, false, undefined, this),
              children: (chunks) => /* @__PURE__ */ jsxDEV5(PrefixSegment, {
                chunks: () => chunks()(index()),
                width: prefixWidth()
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ jsxDEV5(For, {
            each: line.runs,
            children: (entry, position) => {
              const atom = entry.atom;
              if (atom.type === "text") {
                const visible = position() === line.runs.length - 1 ? atom.text.trimEnd() : atom.text;
                return /* @__PURE__ */ jsxDEV5(StyledSegment, {
                  entry: { ...entry, atom: { ...atom, text: visible } },
                  textRow: line.textRow
                }, undefined, false, undefined, this);
              }
              const variant = entry.variant ?? "normal";
              return /* @__PURE__ */ jsxDEV5(Show2, {
                when: images().get(atom.content)?.[variant],
                fallback: /* @__PURE__ */ jsxDEV5("text", {
                  fg: props.theme.text.muted,
                  wrapMode: "none",
                  width: entry.columns,
                  flexShrink: 0,
                  children: atom.raw
                }, undefined, false, undefined, this),
                children: (image) => /* @__PURE__ */ jsxDEV5("image", {
                  id: `opentui-markdown-math-${mathImageID(atom.content, false, foreground(), props.graphics.cell(), 1, variant === "compact", variant === "standard")}-${props.surface()}`,
                  source: image().png,
                  fit: "fit",
                  protocol: "auto",
                  width: entry.columns,
                  height: entry.rows,
                  flexShrink: 0
                }, undefined, false, undefined, this)
              }, undefined, false, undefined, this);
            }
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

// node_modules/opentui-markdown-render/src/view/math.tsx
import { createResource as createResource3, createSignal as createSignal4, Match as Match2, Switch as Switch2 } from "solid-js";
import { jsxDEV as jsxDEV6 } from "@opentui/solid/jsx-dev-runtime";
function DisplayMath(props) {
  const [failed, setFailed] = createSignal4(false);
  const color = () => rgbaToHex(props.theme().text.base);
  const mosaic = () => mosaicScale(props.graphics.protocol());
  const [rendered] = createResource3(() => JSON.stringify({
    content: props.content,
    color: color(),
    background: props.surface(),
    cell: props.graphics.cell(),
    scale: props.scale()
  }), async (key) => {
    const input = JSON.parse(key);
    try {
      const raster = await renderMathImage(input.content, true, input.color, input.background, input.cell, input.scale);
      return raster ? { raster } : { error: "Renderer returned no image" };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  });
  const raster = () => {
    const value = rendered();
    return value && "raster" in value ? value.raster : undefined;
  };
  const source = () => `${props.open}${props.content}${props.close}`;
  const box = () => {
    const image = raster();
    const columns = (image ? image.columns : Math.min(24, props.maxWidth())) * mosaic();
    const rows = (image ? image.rows : 3) * mosaic();
    const max = props.maxWidth();
    if (columns <= max)
      return { columns, rows: Math.max(1, rows) };
    return { columns: max, rows: Math.max(1, Math.round(rows * max / columns)) };
  };
  return /* @__PURE__ */ jsxDEV6("box", {
    width: "100%",
    flexShrink: 0,
    flexDirection: "column",
    marginTop: 1,
    marginBottom: 1,
    children: /* @__PURE__ */ jsxDEV6(Switch2, {
      children: [
        /* @__PURE__ */ jsxDEV6(Match2, {
          when: rendered.loading,
          children: /* @__PURE__ */ jsxDEV6("text", {
            fg: props.theme().text.muted,
            alignSelf: "center",
            children: "Rendering math..."
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV6(Match2, {
          when: failed() || rendered() && "error" in rendered(),
          children: /* @__PURE__ */ jsxDEV6("box", {
            flexDirection: "column",
            border: ["left"],
            borderColor: props.theme().text.feedback.error,
            paddingLeft: 1,
            alignSelf: "center",
            children: [
              /* @__PURE__ */ jsxDEV6("text", {
                fg: props.theme().text.feedback.error,
                children: "Could not render TeX; showing source"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV6("text", {
                fg: props.theme().text.base,
                wrapMode: "word",
                children: source()
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsxDEV6(Match2, {
          when: raster(),
          children: /* @__PURE__ */ jsxDEV6("box", {
            width: "100%",
            height: box().rows,
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            children: /* @__PURE__ */ jsxDEV6("image", {
              id: `opentui-markdown-math-${mathImageID(props.content, true, color(), props.graphics.cell(), props.scale())}-${props.surface()}`,
              source: raster().png,
              fit: "fit",
              protocol: "auto",
              width: box().columns,
              height: box().rows,
              onError: () => setFailed(true)
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}

// node_modules/opentui-markdown-render/src/view/mermaid.tsx
import { createEffect as createEffect3, createMemo as createMemo4, Show as Show3 } from "solid-js";

// node_modules/opentui-markdown-render/src/merman/diagram.ts
import {
  parseColor as parseColor3,
  StyledText as StyledText3
} from "@opentui/core";

// node_modules/opentui-markdown-render/src/merman/class/drawing.ts
import { BorderChars as BorderChars2 } from "@opentui/core";

// node_modules/opentui-markdown-render/src/merman/core/text-lines.ts
function parseDiagramTextLines(value) {
  return value.split(/<br\s*\/?>/i).map((line) => {
    const runs = [];
    const source = line.trim();
    const tag = /<\/?(?:i|em)\s*>/gi;
    let italic = false;
    let offset = 0;
    for (const match of source.matchAll(tag)) {
      if (match.index > offset)
        runs.push({ text: source.slice(offset, match.index), italic });
      italic = !match[0].startsWith("</");
      offset = match.index + match[0].length;
    }
    if (offset < source.length)
      runs.push({ text: source.slice(offset), italic });
    return { text: runs.map((run) => run.text).join(""), runs };
  });
}
function splitDiagramLines(value) {
  return parseDiagramTextLines(value).map((line) => line.text);
}

// node_modules/opentui-markdown-render/src/merman/core/text.ts
function diagramTextWidth(value) {
  return stringWidth(value);
}
var DIAGRAM_LABEL_PADDING_X = 1;
function padDiagramLabelLine(value) {
  const padding = " ".repeat(DIAGRAM_LABEL_PADDING_X);
  return `${padding}${value}${padding}`;
}
function measureDiagramLabelWidth(value, measure = diagramTextWidth) {
  return Math.max(...splitDiagramLines(value).map((line) => measure(line) + DIAGRAM_LABEL_PADDING_X * 2));
}
var graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
function* diagramTextGraphemes(value) {
  for (const { segment } of graphemeSegmenter.segment(value))
    yield segment;
}
function measureDiagramTextBox(value, options = {}) {
  const lines = splitDiagramLines(value);
  const innerWidth = Math.max(...lines.map(diagramTextWidth), options.minInnerWidth ?? 1);
  return {
    width: innerWidth + (options.paddingX ?? 0) * 2,
    height: lines.length + (options.paddingY ?? 0) * 2,
    lines
  };
}

// node_modules/opentui-markdown-render/src/merman/core/canvas.ts
var MAX_DIAGRAM_CELLS = 250000;

class DiagramCanvasSizeError extends Error {
  width;
  height;
  constructor(width, height) {
    const invalid = !Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 0 || height < 0;
    super(invalid ? `Diagram canvas dimensions must be non-negative safe integers, received ${width}x${height}` : `Diagram canvas ${width}x${height} exceeds the ${MAX_DIAGRAM_CELLS.toLocaleString()} cell limit`);
    this.width = width;
    this.height = height;
    this.name = "DiagramCanvasSizeError";
  }
}
function createEmptyCell() {
  return { char: " " };
}
function sameKey(left, right) {
  return Boolean(left && left.length === right.length && left.every((value, index) => Object.is(value, right[index])));
}

class DiagramCanvas {
  width;
  height;
  cells;
  measure;
  mergeCell;
  rowEnds;
  constructor(width, height, options = {}) {
    this.width = width;
    this.height = height;
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width < 0 || height < 0) {
      throw new DiagramCanvasSizeError(width, height);
    }
    if (width * height > MAX_DIAGRAM_CELLS)
      throw new DiagramCanvasSizeError(width, height);
    this.measure = options.measure ?? stringWidth;
    this.mergeCell = options.mergeCell;
    this.cells = Array.from({ length: height }, () => Array.from({ length: width }, () => createEmptyCell()));
    this.rowEnds = new Uint32Array(height);
  }
  get rows() {
    return this.cells;
  }
  rowText(row, rowEnd) {
    return row.slice(0, rowEnd).map((cell) => cell.char).join("");
  }
  textRowRange(trimTop, trimBottom) {
    let start = 0;
    let end = this.cells.length;
    if (trimTop)
      while (start < end && this.rowEnds[start] === 0)
        start += 1;
    if (trimBottom)
      while (end > start && this.rowEnds[end - 1] === 0)
        end -= 1;
    return { start, end };
  }
  setCell(x, y, char, style, metadata) {
    this.writeCell(x, y, char, style, metadata, true);
  }
  replaceCell(x, y, char, style, metadata) {
    this.writeCell(x, y, char, style, metadata, false);
  }
  writeCell(x, y, char, style, metadata, merge) {
    if (y < 0 || y >= this.cells.length || x < 0 || x >= this.cells[y].length)
      return;
    const incoming = { char, style, ...metadata };
    const cell = merge ? this.mergeCell?.(this.cells[y][x], incoming) ?? incoming : incoming;
    this.cells[y][x] = cell;
    if (cell.char !== " ") {
      this.rowEnds[y] = Math.max(this.rowEnds[y], x + 1);
    } else if (this.rowEnds[y] === x + 1) {
      let end = x;
      while (end > 0 && this.cells[y][end - 1]?.char === " ")
        end -= 1;
      this.rowEnds[y] = end;
    }
  }
  getCell(x, y) {
    return this.cells[y]?.[x];
  }
  setText(x, y, text, style, metadata) {
    const metadataAt = (cellX) => typeof metadata === "function" ? metadata(cellX, y) : metadata;
    if (this.measure === stringWidth && /^[\x20-\x7e]*$/.test(text)) {
      for (let index = 0;index < text.length; index++) {
        this.setCell(x + index, y, text[index], style, metadataAt(x + index));
      }
      return;
    }
    let offset = 0;
    for (const grapheme of diagramTextGraphemes(text)) {
      const width = Math.max(1, this.measure(grapheme));
      if (x + offset < 0 || x + offset + width > this.width) {
        offset += width;
        continue;
      }
      this.setCell(x + offset, y, grapheme, style, metadataAt(x + offset));
      for (let continuation = 1;continuation < width; continuation++) {
        this.setCell(x + offset + continuation, y, "", style, metadataAt(x + offset + continuation));
      }
      offset += width;
    }
  }
  toString(options = {}) {
    const lines = [];
    const rows = this.textRowRange(options.trimTop ?? false, options.trimBottom ?? false);
    for (let rowIndex = rows.start;rowIndex < rows.end; rowIndex++) {
      lines.push(this.rowText(this.cells[rowIndex], this.rowEnds[rowIndex]));
    }
    return lines.join(`
`);
  }
  getTextSize(options = {}) {
    const rows = this.textRowRange(options.trimTop ?? false, options.trimBottom ?? false);
    let width = 0;
    for (let rowIndex = rows.start;rowIndex < rows.end; rowIndex++) {
      const row = this.cells[rowIndex];
      const rowEnd = this.rowEnds[rowIndex];
      if (rowEnd > 0)
        width = Math.max(width, this.measure(this.rowText(row, rowEnd)));
    }
    return { width, height: rows.end - rows.start };
  }
  getTextHeight(options = {}) {
    const rows = this.textRowRange(options.trimTop ?? false, options.trimBottom ?? false);
    return rows.end - rows.start;
  }
  forEachRun(onRun, onLineEnd, options = {}) {
    const key = options.key;
    const rows = this.textRowRange(options.trimTop ?? false, options.trimBottom ?? false);
    for (let rowIndex = rows.start;rowIndex < rows.end; rowIndex++) {
      const row = this.cells[rowIndex];
      let rowEnd = this.rowEnds[rowIndex];
      while (rowEnd < row.length && row[rowEnd]?.style !== undefined)
        rowEnd += 1;
      let currentCell;
      let currentKey;
      let currentText = "";
      const flush = () => {
        if (!currentText || !currentCell)
          return;
        onRun({ text: currentText, style: currentCell.style, cell: currentCell });
        currentText = "";
      };
      for (let x = 0;x < rowEnd; x++) {
        const cell = row[x];
        const nextKey = key?.(cell);
        const sameRun = currentCell && (key ? sameKey(currentKey, nextKey) : currentCell.style === cell.style);
        if (!sameRun) {
          flush();
          currentCell = cell;
          currentKey = nextKey;
        }
        currentText += cell.char;
      }
      flush();
      if (rowIndex < rows.end - 1)
        onLineEnd();
    }
  }
}

// node_modules/opentui-markdown-render/src/merman/core/drawing.ts
import { BorderChars } from "@opentui/core";

// node_modules/opentui-markdown-render/src/merman/core/geometry.ts
var DIRECTION_AXIS = {
  left: "x",
  right: "x",
  up: "y",
  down: "y"
};
var DIRECTION_SIGN = {
  left: -1,
  right: 1,
  up: -1,
  down: 1
};
var DIRECTION_SIDE = {
  left: "left",
  right: "right",
  up: "top",
  down: "bottom"
};
var OPPOSITE_SIDE = {
  left: "right",
  right: "left",
  top: "bottom",
  bottom: "top"
};
function point(x, y) {
  return { x, y };
}
function diagramBoundsFromRect(left, top, width, height) {
  return {
    left,
    top,
    width,
    height,
    centerX: left + Math.floor(width / 2),
    centerY: top + Math.floor(height / 2)
  };
}
function translateDiagramBounds(bounds, dx, dy) {
  bounds.left += dx;
  bounds.top += dy;
  bounds.centerX += dx;
  bounds.centerY += dy;
}
function diagramBoundsFromBounds(bounds) {
  if (bounds.length === 0)
    return;
  const left = Math.min(...bounds.map((bound) => bound.left));
  const top = Math.min(...bounds.map((bound) => bound.top));
  const right = Math.max(...bounds.map((bound) => bound.left + bound.width));
  const bottom = Math.max(...bounds.map((bound) => bound.top + bound.height));
  return diagramBoundsFromRect(left, top, right - left, bottom - top);
}
function diagramBoundsFromPoints(points) {
  if (points.length === 0)
    return;
  const left = Math.min(...points.map((point) => point.x));
  const top = Math.min(...points.map((point) => point.y));
  const right = Math.max(...points.map((point) => point.x));
  const bottom = Math.max(...points.map((point) => point.y));
  return diagramBoundsFromRect(left, top, right - left + 1, bottom - top + 1);
}
function coordinate(point, axis) {
  return point[axis];
}
function withCoordinate(point, axis, value) {
  return axis === "x" ? { x: value, y: point.y } : { x: point.x, y: value };
}
function shiftPoint(point, direction, distance = 1) {
  switch (direction) {
    case "left":
      return { x: point.x - distance, y: point.y };
    case "right":
      return { x: point.x + distance, y: point.y };
    case "up":
      return { x: point.x, y: point.y - distance };
    case "down":
      return { x: point.x, y: point.y + distance };
  }
}
function clampPoint(point, min = { x: 0, y: 0 }) {
  return { x: Math.max(min.x, point.x), y: Math.max(min.y, point.y) };
}
function samePoint(left, right) {
  return left.x === right.x && left.y === right.y;
}
function directionAxis(direction) {
  return DIRECTION_AXIS[direction];
}
function directionSign(direction) {
  return DIRECTION_SIGN[direction];
}
function sideForDirection(direction) {
  return DIRECTION_SIDE[direction];
}
function oppositeSide(side) {
  return OPPOSITE_SIDE[side];
}
function directionBetween(from, to) {
  if (from.y === to.y) {
    if (to.x > from.x)
      return "right";
    if (to.x < from.x)
      return "left";
  }
  if (from.x === to.x) {
    if (to.y > from.y)
      return "down";
    if (to.y < from.y)
      return "up";
  }
  return;
}
function boundsCenter(bounds) {
  return point(bounds.centerX, bounds.centerY);
}
function boundsSidePoint(bounds, side, surface = "outside") {
  switch (side) {
    case "left":
      return point(bounds.left - (surface === "outside" ? 1 : 0), bounds.centerY);
    case "right":
      return point(bounds.left + bounds.width - (surface === "outside" ? 0 : 1), bounds.centerY);
    case "top":
      return point(bounds.centerX, bounds.top - (surface === "outside" ? 1 : 0));
    case "bottom":
      return point(bounds.centerX, bounds.top + bounds.height - (surface === "outside" ? 0 : 1));
  }
}
function centerCoordinate(bounds, axis) {
  return axis === "x" ? bounds.centerX : bounds.centerY;
}
function snapCoordinate(source, target, tolerance) {
  return Math.abs(source - target) <= tolerance ? target : source;
}
function pathThrough(points) {
  const path = [];
  for (const next of points) {
    if (!path.length || !samePoint(path[path.length - 1], next))
      path.push(point(next.x, next.y));
  }
  return path;
}
function lane(axis, coordinate) {
  return { axis, coordinate };
}
function pathViaLane(start, routeLane, end) {
  return pathThrough([
    start,
    withCoordinate(start, routeLane.axis, routeLane.coordinate),
    withCoordinate(end, routeLane.axis, routeLane.coordinate),
    end
  ]);
}
function dominantAxis(start, end) {
  return Math.abs(end.x - start.x) >= Math.abs(end.y - start.y) ? "x" : "y";
}
function terminalLane(start, end, axis, terminalClearance) {
  const startCoordinate = coordinate(start, axis);
  const endCoordinate = coordinate(end, axis);
  const delta = endCoordinate - startCoordinate;
  const sign = Math.sign(delta);
  if (sign === 0)
    return endCoordinate;
  return endCoordinate - sign * Math.min(terminalClearance, Math.max(1, Math.abs(delta) - 1));
}
function orthogonalPath(start, end, options = {}) {
  if (start.x === end.x || start.y === end.y)
    return pathThrough([start, end]);
  const laneAxis = options.preferredAxis ?? dominantAxis(start, end);
  return pathViaLane(start, lane(laneAxis, terminalLane(start, end, laneAxis, options.terminalClearance ?? 4)), end);
}
function segmentBetween(from, to) {
  const direction = directionBetween(from, to);
  if (!direction)
    return;
  return {
    from,
    to,
    axis: directionAxis(direction),
    direction,
    length: Math.abs(coordinate(to, directionAxis(direction)) - coordinate(from, directionAxis(direction)))
  };
}
function walkOrthogonalSegment(from, to, includeStart, visit) {
  const direction = directionBetween(from, to);
  if (!direction)
    return;
  const dx = direction === "right" ? 1 : direction === "left" ? -1 : 0;
  const dy = direction === "down" ? 1 : direction === "up" ? -1 : 0;
  let cursor = includeStart ? from : point(from.x + dx, from.y + dy);
  while (!samePoint(cursor, to)) {
    if (visit(cursor) === false)
      return;
    cursor = point(cursor.x + dx, cursor.y + dy);
  }
}
function orthogonalPathPoints(points) {
  const path = [];
  for (let index = 1;index < points.length; index++) {
    const from = points[index - 1];
    const to = points[index];
    const direction = directionBetween(from, to);
    if (!direction)
      continue;
    const dx = direction === "right" ? 1 : direction === "left" ? -1 : 0;
    const dy = direction === "down" ? 1 : direction === "up" ? -1 : 0;
    let cursor = path.length === 0 ? point(from.x, from.y) : point(from.x + dx, from.y + dy);
    while (true) {
      path.push(cursor);
      if (samePoint(cursor, to))
        break;
      cursor = point(cursor.x + dx, cursor.y + dy);
    }
  }
  return path;
}
function orderedSpan(left, right) {
  return left <= right ? { start: left, end: right } : { start: right, end: left };
}
function segmentSpan(segment) {
  return orderedSpan(coordinate(segment.from, segment.axis), coordinate(segment.to, segment.axis));
}
function pointOnSegment(segment, coordinateValue) {
  return withCoordinate(segment.from, segment.axis, coordinateValue);
}
function insetSpan(span, amount) {
  return { start: span.start + amount, end: span.end - amount };
}
function spanCapacity(span) {
  return Math.max(0, span.end - span.start + 1);
}
function centeredSpanStart(span, width) {
  return span.start + Math.floor((spanCapacity(span) - width) / 2);
}
function midpoint(span) {
  return Math.round((span.start + span.end) / 2);
}
function advanceCoordinate(origin, direction, distance) {
  return origin + directionSign(direction) * distance;
}
function beforeNearestCoordinate(points, axis, direction, clearance) {
  const coordinates = points.map((point) => coordinate(point, axis));
  const nearest = directionSign(direction) > 0 ? Math.min(...coordinates) : Math.max(...coordinates);
  return advanceCoordinate(nearest, direction, -clearance);
}
function afterFarthestCoordinate(points, axis, direction, clearance) {
  const coordinates = points.map((point) => coordinate(point, axis));
  const farthest = directionSign(direction) > 0 ? Math.max(...coordinates) : Math.min(...coordinates);
  return advanceCoordinate(farthest, direction, clearance);
}
function keepBefore(preferred, boundary, direction) {
  return directionSign(direction) > 0 ? Math.min(preferred, boundary) : Math.max(preferred, boundary);
}
function keepAfter(preferred, boundary, direction) {
  return directionSign(direction) > 0 ? Math.max(preferred, boundary) : Math.min(preferred, boundary);
}

// node_modules/opentui-markdown-render/src/merman/core/drawing.ts
var DIAGRAM_ARROW_HEADS = new Set(["\u25B6", "\u25C0", "\u25BC", "\u25B2", "\u2192", "\u2190", "\u2193", "\u2191"]);
var HEAVY_LINE_GLYPHS = new Set(Object.values(BorderChars.heavy));
var DIAGRAM_DIAMOND_CHARS = {
  topLeft: "\u256D",
  topRight: "\u256E",
  upperLeft: "\u256D",
  upperLeftJoin: "\u256F",
  upperRightJoin: "\u2570",
  upperRight: "\u256E",
  vertical: "\u2502",
  lowerLeft: "\u2570",
  lowerLeftJoin: "\u256E",
  lowerRightJoin: "\u256D",
  lowerRight: "\u256F",
  bottomLeft: "\u2570",
  bottomRight: "\u256F",
  horizontal: "\u2500"
};
function diagramDiamondCharactersFromBorder(chars) {
  return {
    topLeft: chars.topLeft,
    topRight: chars.topRight,
    upperLeft: chars.topLeft,
    upperLeftJoin: chars.bottomRight,
    upperRightJoin: chars.bottomLeft,
    upperRight: chars.topRight,
    vertical: chars.vertical,
    lowerLeft: chars.bottomLeft,
    lowerLeftJoin: chars.topRight,
    lowerRightJoin: chars.topLeft,
    lowerRight: chars.bottomRight,
    bottomLeft: chars.bottomLeft,
    bottomRight: chars.bottomRight,
    horizontal: chars.horizontal
  };
}
function lineDirections(char) {
  switch (char) {
    case "\u2500":
      return ["left", "right"];
    case "\u2502":
      return ["up", "down"];
    case "\u2501":
      return ["left", "right"];
    case "\u2503":
      return ["up", "down"];
    case "\u250C":
    case "\u256D":
    case "\u250F":
      return ["right", "down"];
    case "\u2510":
    case "\u256E":
    case "\u2513":
      return ["left", "down"];
    case "\u2514":
    case "\u2570":
    case "\u2517":
      return ["up", "right"];
    case "\u2518":
    case "\u256F":
    case "\u251B":
      return ["up", "left"];
    case "\u251C":
    case "\u2523":
      return ["up", "down", "right"];
    case "\u2524":
    case "\u252B":
      return ["up", "down", "left"];
    case "\u252C":
    case "\u2533":
      return ["left", "right", "down"];
    case "\u2534":
    case "\u253B":
      return ["left", "right", "up"];
    case "\u253C":
    case "\u254B":
      return ["up", "down", "left", "right"];
    default:
      return;
  }
}
function diagramLineGlyph(directions, cornerStyle = "square", lineStyle = "single") {
  const up = directions.has("up");
  const down = directions.has("down");
  const left = directions.has("left");
  const right = directions.has("right");
  if (lineStyle === "heavy") {
    const chars = BorderChars.heavy;
    if (up && down && left && right)
      return chars.cross;
    if (up && down && right)
      return chars.leftT;
    if (up && down && left)
      return chars.rightT;
    if (left && right && down)
      return chars.topT;
    if (left && right && up)
      return chars.bottomT;
    if (up && right)
      return chars.bottomLeft;
    if (up && left)
      return chars.bottomRight;
    if (down && right)
      return chars.topLeft;
    if (down && left)
      return chars.topRight;
    if (up || down)
      return chars.vertical;
    return chars.horizontal;
  }
  if (up && down && left && right)
    return "\u253C";
  if (up && down && right)
    return "\u251C";
  if (up && down && left)
    return "\u2524";
  if (left && right && down)
    return "\u252C";
  if (left && right && up)
    return "\u2534";
  if (up && right)
    return cornerStyle === "rounded" ? "\u2570" : "\u2514";
  if (up && left)
    return cornerStyle === "rounded" ? "\u256F" : "\u2518";
  if (down && right)
    return cornerStyle === "rounded" ? "\u256D" : "\u250C";
  if (down && left)
    return cornerStyle === "rounded" ? "\u256E" : "\u2510";
  if (up || down)
    return "\u2502";
  return "\u2500";
}
function isHeavyLineGlyph(char) {
  return HEAVY_LINE_GLYPHS.has(char);
}
function segmentGlyph(direction, lineStyle) {
  const directions = new Set(direction === "left" || direction === "right" ? ["left", "right"] : ["up", "down"]);
  return diagramLineGlyph(directions, "square", lineStyle === "heavy" ? "heavy" : "single");
}
function mergeDiagramLineGlyph(existing, incoming, cornerStyle = "square") {
  const existingDirections = lineDirections(existing);
  const incomingDirections = lineDirections(incoming);
  if (!existingDirections || !incomingDirections)
    return;
  return diagramLineGlyph(new Set([...existingDirections, ...incomingDirections]), cornerStyle, isHeavyLineGlyph(existing) && isHeavyLineGlyph(incoming) ? "heavy" : "single");
}
function diagramArrowHead(direction, style = "filled") {
  if (style === "line") {
    if (direction === "right")
      return "\u2192";
    if (direction === "left")
      return "\u2190";
    if (direction === "up")
      return "\u2191";
    return "\u2193";
  }
  if (direction === "right")
    return "\u25B6";
  if (direction === "left")
    return "\u25C0";
  if (direction === "up")
    return "\u25B2";
  return "\u25BC";
}
function diagramArrowHeadBetween(from, to, style = "filled") {
  const direction = directionBetween(from, to);
  return direction ? diagramArrowHead(direction, style) : diagramArrowHead("right", style);
}
function drawDiagramFrame(bounds, chars, setCell) {
  setCell(bounds.left, bounds.top, chars.topLeft);
  setCell(bounds.left + bounds.width - 1, bounds.top, chars.topRight);
  setCell(bounds.left, bounds.top + bounds.height - 1, chars.bottomLeft);
  setCell(bounds.left + bounds.width - 1, bounds.top + bounds.height - 1, chars.bottomRight);
  for (let x = bounds.left + 1;x < bounds.left + bounds.width - 1; x++) {
    setCell(x, bounds.top, chars.horizontal);
    setCell(x, bounds.top + bounds.height - 1, chars.horizontal);
  }
  for (let y = bounds.top + 1;y < bounds.top + bounds.height - 1; y++) {
    setCell(bounds.left, y, chars.vertical);
    setCell(bounds.left + bounds.width - 1, y, chars.vertical);
  }
}
function fillDiagramFrameInterior(bounds, setCell) {
  for (let y = bounds.top + 1;y < bounds.top + bounds.height - 1; y++) {
    for (let x = bounds.left + 1;x < bounds.left + bounds.width - 1; x++)
      setCell(x, y);
  }
}
function drawDiagramDiamond(bounds, setCell, chars = DIAGRAM_DIAMOND_CHARS) {
  const left = bounds.left;
  const right = bounds.left + bounds.width - 1;
  const top = bounds.top;
  const bottom = bounds.top + bounds.height - 1;
  const capInset = Math.min(2, Math.max(1, Math.floor((bounds.width - 1) / 2)));
  const capLeft = left + capInset;
  const capRight = right - capInset;
  setCell(capLeft, top, chars.topLeft);
  for (let x = capLeft + 1;x < capRight; x++)
    setCell(x, top, chars.horizontal);
  setCell(capRight, top, chars.topRight);
  setCell(left, top + 1, chars.upperLeft);
  for (let x = left + 1;x < capLeft; x++)
    setCell(x, top + 1, chars.horizontal);
  setCell(capLeft, top + 1, chars.upperLeftJoin);
  setCell(capRight, top + 1, chars.upperRightJoin);
  for (let x = capRight + 1;x < right; x++)
    setCell(x, top + 1, chars.horizontal);
  setCell(right, top + 1, chars.upperRight);
  for (let y = top + 2;y < bottom - 1; y++) {
    setCell(left, y, chars.vertical);
    setCell(right, y, chars.vertical);
  }
  setCell(left, bottom - 1, chars.lowerLeft);
  for (let x = left + 1;x < capLeft; x++)
    setCell(x, bottom - 1, chars.horizontal);
  setCell(capLeft, bottom - 1, chars.lowerLeftJoin);
  setCell(capRight, bottom - 1, chars.lowerRightJoin);
  for (let x = capRight + 1;x < right; x++)
    setCell(x, bottom - 1, chars.horizontal);
  setCell(right, bottom - 1, chars.lowerRight);
  setCell(capLeft, bottom, chars.bottomLeft);
  for (let x = capLeft + 1;x < capRight; x++)
    setCell(x, bottom, chars.horizontal);
  setCell(capRight, bottom, chars.bottomRight);
}
function drawOrthogonalPath(points, setCell, options = {}) {
  for (let index = 1;index < points.length; index++) {
    const from = points[index - 1];
    const to = points[index];
    const direction = directionBetween(from, to);
    if (!direction)
      continue;
    const glyph = segmentGlyph(direction, options.lineStyle);
    const horizontal = direction === "left" || direction === "right";
    const dashOn = horizontal ? 2 : 1;
    const dashPeriod = horizontal ? 4 : 2;
    let step = index === 1 ? 0 : 1;
    walkOrthogonalSegment(from, to, index === 1, (point) => {
      if (options.lineStyle !== "dashed" || step % dashPeriod < dashOn)
        setCell(point.x, point.y, glyph);
      step += 1;
    });
  }
  for (let index = 1;index < points.length - 1; index++) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const fromDirection = directionBetween(current, previous);
    const toDirection = directionBetween(current, next);
    const directions = new Set;
    if (fromDirection)
      directions.add(fromDirection);
    if (toDirection)
      directions.add(toDirection);
    setCell(current.x, current.y, diagramLineGlyph(directions, options.cornerStyle, options.lineStyle === "heavy" ? "heavy" : "single"));
  }
}

// node_modules/@dagrejs/dagre/dist/dagre.esm.js
var Te2 = Object.defineProperty;
var Sn = (e, n, t) => (n in e) ? Te2(e, n, { enumerable: true, configurable: true, writable: true, value: t }) : e[n] = t;
var Mn = (e, n) => {
  for (var t in n)
    Te2(e, t, { get: n[t], enumerable: true });
};
var je2 = (e, n, t) => Sn(e, typeof n != "symbol" ? n + "" : n, t);
var ie2 = {};
Mn(ie2, { Graph: () => T2, alg: () => H });
var Pn = Object.defineProperty;
var Se2 = (e, n) => {
  for (var t in n)
    Pn(e, t, { get: n[t], enumerable: true });
};
var Q2 = class {
  constructor(e) {
    this._isDirected = true, this._isMultigraph = false, this._isCompound = false, this._nodes = {}, this._in = {}, this._preds = {}, this._out = {}, this._sucs = {}, this._edgeObjs = {}, this._edgeLabels = {}, this._nodeCount = 0, this._edgeCount = 0, this._defaultNodeLabelFn = () => {}, this._defaultEdgeLabelFn = () => {}, e && (this._isDirected = ("directed" in e) ? e.directed : true, this._isMultigraph = ("multigraph" in e) ? e.multigraph : false, this._isCompound = ("compound" in e) ? e.compound : false), this._isCompound && (this._parent = {}, this._children = {}, this._children["\x00"] = {});
  }
  isDirected() {
    return this._isDirected;
  }
  isMultigraph() {
    return this._isMultigraph;
  }
  isCompound() {
    return this._isCompound;
  }
  setGraph(e) {
    return this._label = e, this;
  }
  graph() {
    return this._label;
  }
  setDefaultNodeLabel(e) {
    return typeof e != "function" ? this._defaultNodeLabelFn = () => e : this._defaultNodeLabelFn = e, this;
  }
  nodeCount() {
    return this._nodeCount;
  }
  nodes() {
    return Object.keys(this._nodes);
  }
  sources() {
    return this.nodes().filter((e) => Object.keys(this._in[e]).length === 0);
  }
  sinks() {
    return this.nodes().filter((e) => Object.keys(this._out[e]).length === 0);
  }
  setNodes(e, n) {
    return e.forEach((t) => {
      n !== undefined ? this.setNode(t, n) : this.setNode(t);
    }), this;
  }
  setNode(e, n) {
    return e in this._nodes ? (arguments.length > 1 && (this._nodes[e] = n), this) : (this._nodes[e] = arguments.length > 1 ? n : this._defaultNodeLabelFn(e), this._isCompound && (this._parent[e] = "\x00", this._children[e] = {}, this._children["\x00"][e] = true), this._in[e] = {}, this._preds[e] = {}, this._out[e] = {}, this._sucs[e] = {}, ++this._nodeCount, this);
  }
  node(e) {
    return this._nodes[e];
  }
  hasNode(e) {
    return e in this._nodes;
  }
  removeNode(e) {
    if (e in this._nodes) {
      let n = (t) => this.removeEdge(this._edgeObjs[t]);
      delete this._nodes[e], this._isCompound && (this._removeFromParentsChildList(e), delete this._parent[e], this.children(e).forEach((t) => {
        this.setParent(t);
      }), delete this._children[e]), Object.keys(this._in[e]).forEach(n), delete this._in[e], delete this._preds[e], Object.keys(this._out[e]).forEach(n), delete this._out[e], delete this._sucs[e], --this._nodeCount;
    }
    return this;
  }
  setParent(e, n) {
    if (!this._isCompound)
      throw new Error("Cannot set parent in a non-compound graph");
    if (n === undefined)
      n = "\x00";
    else {
      n += "";
      for (let t = n;t !== undefined; t = this.parent(t))
        if (t === e)
          throw new Error("Setting " + n + " as parent of " + e + " would create a cycle");
      this.setNode(n);
    }
    return this.setNode(e), this._removeFromParentsChildList(e), this._parent[e] = n, this._children[n][e] = true, this;
  }
  parent(e) {
    if (this._isCompound) {
      let n = this._parent[e];
      if (n !== "\x00")
        return n;
    }
  }
  children(e = "\x00") {
    if (this._isCompound) {
      let n = this._children[e];
      if (n)
        return Object.keys(n);
    } else {
      if (e === "\x00")
        return this.nodes();
      if (this.hasNode(e))
        return [];
    }
    return [];
  }
  predecessors(e) {
    let n = this._preds[e];
    if (n)
      return Object.keys(n);
  }
  successors(e) {
    let n = this._sucs[e];
    if (n)
      return Object.keys(n);
  }
  neighbors(e) {
    let n = this.predecessors(e);
    if (n) {
      let t = new Set(n), r = this.successors(e);
      if (r)
        for (let o of r)
          t.add(o);
      return Array.from(t.values());
    }
  }
  isLeaf(e) {
    var n;
    let t;
    return this.isDirected() ? t = this.successors(e) : t = this.neighbors(e), ((n = t == null ? undefined : t.length) != null ? n : 0) === 0;
  }
  filterNodes(e) {
    let n = new this.constructor({ directed: this._isDirected, multigraph: this._isMultigraph, compound: this._isCompound });
    n.setGraph(this.graph()), Object.entries(this._nodes).forEach(([o, i]) => {
      e(o) && n.setNode(o, i);
    }), Object.values(this._edgeObjs).forEach((o) => {
      n.hasNode(o.v) && n.hasNode(o.w) && n.setEdge(o, this.edge(o));
    });
    let t = {}, r = (o) => {
      let i = this.parent(o);
      return !i || n.hasNode(i) ? (t[o] = i, i) : (i in t) ? t[i] : r(i);
    };
    return this._isCompound && n.nodes().forEach((o) => n.setParent(o, r(o))), n;
  }
  setDefaultEdgeLabel(e) {
    return typeof e != "function" ? this._defaultEdgeLabelFn = () => e : this._defaultEdgeLabelFn = e, this;
  }
  edgeCount() {
    return this._edgeCount;
  }
  edges() {
    return Object.values(this._edgeObjs);
  }
  setPath(e, n) {
    return e.reduce((t, r) => (n !== undefined ? this.setEdge(t, r, n) : this.setEdge(t, r), r)), this;
  }
  setEdge(e, n, t, r) {
    let o, i, s, a, l = false;
    typeof e == "object" && e !== null && "v" in e ? (o = e.v, i = e.w, s = e.name, arguments.length === 2 && (a = n, l = true)) : (o = e, i = n, s = r, arguments.length > 2 && (a = t, l = true)), o = "" + o, i = "" + i, s !== undefined && (s = "" + s);
    let u = z2(this._isDirected, o, i, s);
    if (u in this._edgeLabels)
      return l && (this._edgeLabels[u] = a), this;
    if (s !== undefined && !this._isMultigraph)
      throw new Error("Cannot set a named edge when isMultigraph = false");
    this.setNode(o), this.setNode(i), this._edgeLabels[u] = l ? a : this._defaultEdgeLabelFn(o, i, s);
    let d = Fn(this._isDirected, o, i, s);
    return o = d.v, i = d.w, Object.freeze(d), this._edgeObjs[u] = d, Re2(this._preds[i], o), Re2(this._sucs[o], i), this._in[i][u] = d, this._out[o][u] = d, this._edgeCount++, this;
  }
  edge(e, n, t) {
    let r = arguments.length === 1 ? oe2(this._isDirected, e) : z2(this._isDirected, e, n, t);
    return this._edgeLabels[r];
  }
  edgeAsObj(e, n, t) {
    let r = arguments.length === 1 ? this.edge(e) : this.edge(e, n, t);
    return typeof r != "object" || r === null ? { label: r } : r;
  }
  hasEdge(e, n, t) {
    return (arguments.length === 1 ? oe2(this._isDirected, e) : z2(this._isDirected, e, n, t)) in this._edgeLabels;
  }
  removeEdge(e, n, t) {
    let r = arguments.length === 1 ? oe2(this._isDirected, e) : z2(this._isDirected, e, n, t), o = this._edgeObjs[r];
    if (o) {
      let { v: i, w: s } = o;
      delete this._edgeLabels[r], delete this._edgeObjs[r], Ie2(this._preds[s], i), Ie2(this._sucs[i], s), delete this._in[s][r], delete this._out[i][r], this._edgeCount--;
    }
    return this;
  }
  inEdges(e, n) {
    return this.isDirected() ? this.filterEdges(this._in[e], e, n) : this.nodeEdges(e, n);
  }
  outEdges(e, n) {
    return this.isDirected() ? this.filterEdges(this._out[e], e, n) : this.nodeEdges(e, n);
  }
  nodeEdges(e, n) {
    if (e in this._nodes)
      return this.filterEdges({ ...this._in[e], ...this._out[e] }, e, n);
  }
  _removeFromParentsChildList(e) {
    delete this._children[this._parent[e]][e];
  }
  filterEdges(e, n, t) {
    if (!e)
      return;
    let r = Object.values(e);
    return t ? r.filter((o) => o.v === n && o.w === t || o.v === t && o.w === n) : r;
  }
};
function Re2(e, n) {
  e[n] ? e[n]++ : e[n] = 1;
}
function Ie2(e, n) {
  e[n] !== undefined && !--e[n] && delete e[n];
}
function z2(e, n, t, r) {
  let o = "" + n, i = "" + t;
  if (!e && o > i) {
    let s = o;
    o = i, i = s;
  }
  return o + "\x01" + i + "\x01" + (r === undefined ? "\x00" : r);
}
function Fn(e, n, t, r) {
  let o = "" + n, i = "" + t;
  if (!e && o > i) {
    let a = o;
    o = i, i = a;
  }
  let s = { v: o, w: i };
  return r && (s.name = r), s;
}
function oe2(e, n) {
  return z2(e, n.v, n.w, n.name);
}
var Dn = {};
Se2(Dn, { read: () => Bn, write: () => An });
function An(e) {
  let n = { options: { directed: e.isDirected(), multigraph: e.isMultigraph(), compound: e.isCompound() }, nodes: Vn(e), edges: Yn(e) }, t = e.graph();
  return t !== undefined && (n.value = structuredClone(t)), n;
}
function Vn(e) {
  return e.nodes().map((n) => {
    let t = e.node(n), r = e.parent(n), o = { v: n };
    return t !== undefined && (o.value = t), r !== undefined && (o.parent = r), o;
  });
}
function Yn(e) {
  return e.edges().map((n) => {
    let t = e.edge(n), r = { v: n.v, w: n.w };
    return n.name !== undefined && (r.name = n.name), t !== undefined && (r.value = t), r;
  });
}
function Bn(e) {
  let n = new Q2(e.options);
  return e.value !== undefined && n.setGraph(e.value), e.nodes.forEach((t) => {
    n.setNode(t.v, t.value), t.parent && n.setParent(t.v, t.parent);
  }), e.edges.forEach((t) => {
    n.setEdge({ v: t.v, w: t.w, name: t.name }, t.value);
  }), n;
}
var H = {};
Se2(H, { CycleException: () => K2, bellmanFord: () => Me2, components: () => zn, dijkstra: () => J2, dijkstraAll: () => $n, findCycles: () => Un, floydWarshall: () => Kn, isAcyclic: () => Zn, postorder: () => nt, preorder: () => tt, prim: () => rt, shortestPaths: () => ot, tarjan: () => Fe2, topsort: () => De2 });
var Wn = () => 1;
function Me2(e, n, t, r) {
  return Xn(e, String(n), t || Wn, r || function(o) {
    var i;
    return (i = e.outEdges(o)) != null ? i : [];
  });
}
function Xn(e, n, t, r) {
  let o = {}, i, s = 0, a = e.nodes(), l = function(c) {
    let f = o[c.v], h = o[c.w];
    if (!f || !h)
      return;
    let g = t(c);
    f.distance + g < h.distance && (o[c.w] = { distance: f.distance + g, predecessor: c.v }, i = true);
  }, u = function() {
    a.forEach(function(c) {
      r(c).forEach(function(f) {
        let h = f.v === c ? f.v : f.w, g = h === f.v ? f.w : f.v;
        l({ v: h, w: g });
      });
    });
  };
  a.forEach(function(c) {
    let f = c === n ? 0 : Number.POSITIVE_INFINITY;
    o[c] = { distance: f, predecessor: "" };
  });
  let d = a.length;
  for (let c = 1;c < d && (i = false, s++, u(), !!i); c++)
    ;
  if (s === d - 1 && (i = false, u(), i))
    throw new Error("The graph contains a negative weight cycle");
  return o;
}
function zn(e) {
  let n = {}, t = [], r;
  function o(i) {
    var s, a;
    i in n || (n[i] = true, r.push(i), (s = e.successors(i)) == null || s.forEach(o), (a = e.predecessors(i)) == null || a.forEach(o));
  }
  return e.nodes().forEach(function(i) {
    r = [], o(i), r.length && t.push(r);
  }), t;
}
var Pe2 = class {
  constructor() {
    this._arr = [], this._keyIndices = {};
  }
  size() {
    return this._arr.length;
  }
  keys() {
    return this._arr.map((e) => e.key);
  }
  has(e) {
    return e in this._keyIndices;
  }
  priority(e) {
    let n = this._keyIndices[e];
    if (n !== undefined)
      return this._arr[n].priority;
  }
  min() {
    if (this.size() === 0)
      throw new Error("Queue underflow");
    return this._arr[0].key;
  }
  add(e, n) {
    let t = this._keyIndices, r = String(e);
    if (!(r in t)) {
      let o = this._arr, i = o.length;
      return t[r] = i, o.push({ key: r, priority: n }), this._decrease(i), true;
    }
    return false;
  }
  removeMin() {
    if (this.size() === 0)
      throw new Error("Queue underflow");
    this._swap(0, this._arr.length - 1);
    let e = this._arr.pop();
    return delete this._keyIndices[e.key], this._heapify(0), e.key;
  }
  decrease(e, n) {
    let t = this._keyIndices[e];
    if (t === undefined)
      throw new Error(`Key not found: ${e}`);
    let r = this._arr[t].priority;
    if (n > r)
      throw new Error(`New priority is greater than current priority. Key: ${e} Old: ${r} New: ${n}`);
    this._arr[t].priority = n, this._decrease(t);
  }
  _heapify(e) {
    let n = this._arr, t = 2 * e, r = t + 1, o = e;
    t < n.length && (o = n[t].priority < n[o].priority ? t : o, r < n.length && (o = n[r].priority < n[o].priority ? r : o), o !== e && (this._swap(e, o), this._heapify(o)));
  }
  _decrease(e) {
    let n = this._arr, t = n[e].priority, r;
    for (;e !== 0 && (r = e >> 1, !(n[r].priority < t)); )
      this._swap(e, r), e = r;
  }
  _swap(e, n) {
    let t = this._arr, r = this._keyIndices, o = t[e], i = t[n];
    t[e] = i, t[n] = o, r[i.key] = e, r[o.key] = n;
  }
};
var Hn = () => 1;
function J2(e, n, t, r) {
  let o = function(i) {
    var s;
    return (s = e.outEdges(i)) != null ? s : [];
  };
  return qn(e, String(n), t || Hn, r || o);
}
function qn(e, n, t, r) {
  let o = {}, i = new Pe2, s, a, l = function(u) {
    let d = u.v !== s ? u.v : u.w, c = o[d];
    if (!c)
      return;
    let f = t(u), h = a.distance + f;
    if (f < 0)
      throw new Error("dijkstra does not allow negative edge weights. Bad edge: " + u + " Weight: " + f);
    h < c.distance && (c.distance = h, c.predecessor = s, i.decrease(d, h));
  };
  for (e.nodes().forEach(function(u) {
    let d = u === n ? 0 : Number.POSITIVE_INFINITY;
    o[u] = { distance: d, predecessor: "" }, i.add(u, d);
  });i.size() > 0; ) {
    s = i.removeMin();
    let u = o[s];
    if (!u || u.distance === Number.POSITIVE_INFINITY)
      break;
    a = u, r(s).forEach(l);
  }
  return o;
}
function $n(e, n, t) {
  return e.nodes().reduce(function(r, o) {
    return r[o] = J2(e, o, n, t), r;
  }, {});
}
function Fe2(e) {
  let n = 0, t = [], r = {}, o = [];
  function i(s) {
    var a;
    let l = r[s] = { onStack: true, lowlink: n, index: n++ };
    if (t.push(s), (a = e.successors(s)) == null || a.forEach(function(u) {
      if (u in r) {
        let d = r[u];
        d != null && d.onStack && (l.lowlink = Math.min(l.lowlink, d.index));
      } else {
        i(u);
        let d = r[u];
        d && (l.lowlink = Math.min(l.lowlink, d.lowlink));
      }
    }), l.lowlink === l.index) {
      let u = [], d;
      do {
        d = t.pop();
        let c = r[d];
        c && (c.onStack = false), u.push(d);
      } while (s !== d);
      o.push(u);
    }
  }
  return e.nodes().forEach(function(s) {
    s in r || i(s);
  }), o;
}
function Un(e) {
  return Fe2(e).filter(function(n) {
    var t;
    let r = n[0];
    return r ? n.length > 1 || n.length === 1 && ((t = e.outEdges(r, r)) != null ? t : []).length > 0 : false;
  });
}
var Jn = () => 1;
function Kn(e, n, t) {
  return Qn(e, n || Jn, t || function(r) {
    var o;
    return (o = e.outEdges(r)) != null ? o : [];
  });
}
function Qn(e, n, t) {
  let r = {}, o = e.nodes();
  return o.forEach(function(i) {
    let s = {};
    r[i] = s, s[i] = { distance: 0, predecessor: "" }, o.forEach(function(a) {
      i !== a && (s[a] = { distance: Number.POSITIVE_INFINITY, predecessor: "" });
    }), t(i).forEach(function(a) {
      let l = a.v === i ? a.w : a.v, u = n(a);
      s[l] = { distance: u, predecessor: i };
    });
  }), o.forEach(function(i) {
    let s = r[i];
    s && o.forEach(function(a) {
      let l = r[a];
      l && o.forEach(function(u) {
        let d = l[i], c = s[u], f = l[u];
        if (d && c && f) {
          let h = d.distance + c.distance;
          h < f.distance && (f.distance = h, f.predecessor = c.predecessor);
        }
      });
    });
  }), r;
}
var K2 = class extends Error {
  constructor(e) {
    super(e), this.name = "CycleException";
  }
};
function De2(e) {
  let n = {}, t = {}, r = [];
  function o(i) {
    var s;
    if (i in t)
      throw new K2;
    i in n || (t[i] = true, n[i] = true, (s = e.predecessors(i)) == null || s.forEach(o), delete t[i], r.push(i));
  }
  if (e.sinks().forEach(o), Object.keys(n).length !== e.nodeCount())
    throw new K2;
  return r;
}
function Zn(e) {
  try {
    De2(e);
  } catch (n) {
    if (n instanceof K2)
      return false;
    throw n;
  }
  return true;
}
function et(e, n, t, r, o) {
  Array.isArray(n) || (n = [n]);
  let i = (a) => {
    var l;
    return (l = e.isDirected() ? e.successors(a) : e.neighbors(a)) != null ? l : [];
  }, s = {};
  return n.forEach(function(a) {
    if (!e.hasNode(a))
      throw new Error("Graph does not have node: " + a);
    o = Ae2(e, a, t === "post", s, i, r, o);
  }), o;
}
function Ae2(e, n, t, r, o, i, s) {
  return n in r || (r[n] = true, t || (s = i(s, n)), o(n).forEach(function(a) {
    s = Ae2(e, a, t, r, o, i, s);
  }), t && (s = i(s, n))), s;
}
function Ve(e, n, t) {
  return et(e, n, t, function(r, o) {
    return r.push(o), r;
  }, []);
}
function nt(e, n) {
  return Ve(e, n, "post");
}
function tt(e, n) {
  return Ve(e, n, "pre");
}
function rt(e, n) {
  var t;
  let r = new Q2, o = {}, i = new Pe2, s;
  function a(d) {
    let c = d.v === s ? d.w : d.v, f = i.priority(c);
    if (f !== undefined) {
      let h = n(d);
      h < f && (o[c] = s, i.decrease(c, h));
    }
  }
  if (e.nodeCount() === 0)
    return r;
  e.nodes().forEach(function(d) {
    i.add(d, Number.POSITIVE_INFINITY), r.setNode(d);
  });
  let l = e.nodes()[0];
  l !== undefined && i.decrease(l, 0);
  let u = false;
  for (;i.size() > 0; ) {
    if (s = i.removeMin(), s in o)
      r.setEdge(s, o[s]);
    else {
      if (u)
        throw new Error("Input graph is not connected: " + e);
      u = true;
    }
    (t = e.nodeEdges(s)) == null || t.forEach(a);
  }
  return r;
}
function ot(e, n, t, r) {
  return it(e, n, t, r != null ? r : (o) => {
    var i;
    return (i = e.outEdges(o)) != null ? i : [];
  });
}
function it(e, n, t, r) {
  if (t === undefined)
    return J2(e, n, t, r);
  let o = false, i = e.nodes();
  for (let s = 0;s < i.length; s++) {
    let a = i[s];
    if (a === undefined)
      continue;
    let l = r(a);
    for (let u = 0;u < l.length; u++) {
      let d = l[u];
      if (!d)
        continue;
      let c = d.v === a ? d.v : d.w, f = c === d.v ? d.w : d.v;
      t({ v: c, w: f }) < 0 && (o = true);
    }
    if (o)
      return Me2(e, n, t, r);
  }
  return J2(e, n, t, r);
}
var T2 = Q2;
function M2(e, n, t, r) {
  let o = r;
  for (;e.hasNode(o); )
    o = $2(r);
  return t.dummy = n, e.setNode(o, t), o;
}
function Ye(e) {
  let n = new T2().setGraph(e.graph());
  return e.nodes().forEach((t) => n.setNode(t, e.node(t))), e.edges().forEach((t) => {
    let r = n.edge(t.v, t.w) || { weight: 0, minlen: 1 }, o = e.edge(t);
    n.setEdge(t.v, t.w, { weight: r.weight + o.weight, minlen: Math.max(r.minlen, o.minlen) });
  }), n;
}
function Z2(e) {
  let n = new T2({ multigraph: e.isMultigraph() }).setGraph(e.graph());
  return e.nodes().forEach((t) => {
    e.children(t).length || n.setNode(t, e.node(t));
  }), e.edges().forEach((t) => {
    n.setEdge(t, e.edge(t));
  }), n;
}
function se2(e, n) {
  let { x: t, y: r } = e, o = n.x - t, i = n.y - r, s = e.width / 2, a = e.height / 2;
  if (!o && !i)
    throw new Error("Not possible to find intersection inside of the rectangle");
  let l, u;
  return o === 0 || Math.abs(i) * s > Math.abs(o) * a ? (i < 0 && (a = -a), l = a * o / i, u = a) : (o < 0 && (s = -s), l = s, u = s * i / o), { x: t + l, y: r + u };
}
function P2(e) {
  let n = D2(de2(e) + 1).map(() => []);
  return e.nodes().forEach((t) => {
    let r = e.node(t), o = r.rank;
    o !== undefined && (n[o] || (n[o] = []), n[o][r.order] = t);
  }), n;
}
function Be2(e) {
  let n = e.nodes().map((r) => {
    let o = e.node(r).rank;
    return o === undefined ? Number.MAX_VALUE : o;
  }), t = S2(Math.min, n);
  e.nodes().forEach((r) => {
    let o = e.node(r);
    Object.hasOwn(o, "rank") && (o.rank -= t);
  });
}
function We2(e) {
  let n = e.nodes().map((s) => e.node(s).rank).filter((s) => s !== undefined), t = S2(Math.min, n), r = [];
  e.nodes().forEach((s) => {
    let a = e.node(s).rank - t;
    r[a] || (r[a] = []), r[a].push(s);
  });
  let o = 0, i = e.graph().nodeRankFactor;
  Array.from(r).forEach((s, a) => {
    s === undefined && a % i !== 0 ? --o : s !== undefined && o && s.forEach((l) => e.node(l).rank += o);
  });
}
function ae2(e, n, t, r) {
  let o = { width: 0, height: 0 };
  return arguments.length >= 4 && (o.rank = t, o.order = r), M2(e, "border", o, n);
}
function st(e, n = Xe2) {
  let t = [];
  for (let r = 0;r < e.length; r += n) {
    let o = e.slice(r, r + n);
    t.push(o);
  }
  return t;
}
var Xe2 = 65535;
function S2(e, n) {
  if (n.length > Xe2) {
    let t = st(n);
    return e(...t.map((r) => e(...r)));
  } else
    return e(...n);
}
function de2(e) {
  let t = e.nodes().map((r) => {
    let o = e.node(r).rank;
    return o === undefined ? Number.MIN_VALUE : o;
  });
  return S2(Math.max, t);
}
function ze2(e, n) {
  let t = { lhs: [], rhs: [] };
  return e.forEach((r) => {
    n(r) ? t.lhs.push(r) : t.rhs.push(r);
  }), t;
}
function q2(e, n) {
  return n();
}
var at = 0;
function $2(e) {
  let n = ++at;
  return e + ("" + n);
}
function D2(e, n, t = 1) {
  n == null && (n = e, e = 0);
  let r = (i) => i < n;
  t < 0 && (r = (i) => n < i);
  let o = [];
  for (let i = e;r(i); i += t)
    o.push(i);
  return o;
}
function W2(e, n) {
  let t = {};
  for (let r of n)
    e[r] !== undefined && (t[r] = e[r]);
  return t;
}
function X2(e, n) {
  let t;
  return typeof n == "string" ? t = (r) => r[n] : t = n, Object.entries(e).reduce((r, [o, i]) => (r[o] = t(i, o), r), {});
}
function He2(e, n) {
  return e.reduce((t, r, o) => (t[r] = n[o], t), {});
}
var V = "\x00";
function ee(e, n, t) {
  var u, d, c, f, h, g;
  if (!(e && n && t && n.dummy === "edge" && t.dummy === "edge" && n.edgeObj && t.edgeObj && e[n.edgeObj.v] && e[t.edgeObj.v] && e[n.edgeObj.w] && e[t.edgeObj.w]))
    return 0;
  let r = true;
  n.edgeObj.w === t.edgeObj.w && (r = false);
  let o = r ? (d = (u = e[n.edgeObj.v]) == null ? undefined : u.rank) != null ? d : NaN + 1 : (f = (c = e[n.edgeObj.w]) == null ? undefined : c.rank) != null ? f : NaN - 1, i = Object.entries(e).find((m) => {
    var L, y;
    return ((L = m[1].edgeObj) == null ? undefined : L.v) === n.edgeObj.v && ((y = m[1].edgeObj) == null ? undefined : y.w) === n.edgeObj.w && m[1].rank === o;
  }), s = Object.entries(e).find((m) => {
    var L, y;
    return ((L = m[1].edgeObj) == null ? undefined : L.v) === t.edgeObj.v && ((y = m[1].edgeObj) == null ? undefined : y.w) === t.edgeObj.w && m[1].rank === o;
  });
  if (!i || !s)
    return 0;
  let a = (h = i[1].order) != null ? h : NaN, l = (g = s[1].order) != null ? g : NaN;
  return isNaN(a - l) ? 0 : a - l;
}
var ce2 = class {
  constructor() {
    je2(this, "_sentinel");
    let n = {};
    n._next = n._prev = n, this._sentinel = n;
  }
  dequeue() {
    let n = this._sentinel, t = n._prev;
    if (t !== n)
      return qe2(t), t;
  }
  enqueue(n) {
    let t = this._sentinel;
    n._prev && n._next && qe2(n), n._next = t._next, t._next._prev = n, t._next = n, n._prev = t;
  }
  toString() {
    let n = [], t = this._sentinel, r = t._prev;
    for (;r !== t; )
      n.push(JSON.stringify(r, dt)), r = r._prev;
    return "[" + n.join(", ") + "]";
  }
};
function qe2(e) {
  e._prev._next = e._next, e._next._prev = e._prev, delete e._next, delete e._prev;
}
function dt(e, n) {
  if (e !== "_next" && e !== "_prev")
    return n;
}
var $e2 = ce2;
var lt = () => 1;
function be2(e, n) {
  if (e.nodeCount() <= 1)
    return [];
  let t = ct(e, n || lt);
  return ut(t.graph, t.buckets, t.zeroIdx).flatMap((o) => e.outEdges(o.v, o.w) || []);
}
function ut(e, n, t) {
  var a;
  let r = [], o = n[n.length - 1], i = n[0], s;
  for (;e.nodeCount(); ) {
    for (;s = i.dequeue(); )
      fe(e, n, t, s);
    for (;s = o.dequeue(); )
      fe(e, n, t, s);
    if (e.nodeCount()) {
      for (let l = n.length - 2;l > 0; --l)
        if (s = (a = n[l]) == null ? undefined : a.dequeue(), s) {
          r = r.concat(fe(e, n, t, s, true) || []);
          break;
        }
    }
  }
  return r;
}
function fe(e, n, t, r, o) {
  let i = [], s = o ? i : undefined;
  return (e.inEdges(r.v) || []).forEach((a) => {
    let l = e.edge(a), u = e.node(a.v);
    o && i.push({ v: a.v, w: a.w }), u.out -= l, he2(n, t, u);
  }), (e.outEdges(r.v) || []).forEach((a) => {
    let l = e.edge(a), u = a.w, d = e.node(u);
    d.in -= l, he2(n, t, d);
  }), e.removeNode(r.v), s;
}
function ct(e, n) {
  let t = new T2, r = 0, o = 0;
  e.nodes().forEach((a) => {
    t.setNode(a, { v: a, in: 0, out: 0 });
  }), e.edges().forEach((a) => {
    let l = t.edge(a.v, a.w) || 0, u = n(a), d = l + u;
    t.setEdge(a.v, a.w, d);
    let c = t.node(a.v), f = t.node(a.w);
    o = Math.max(o, c.out += u), r = Math.max(r, f.in += u);
  });
  let i = ft(o + r + 3).map(() => new $e2), s = r + 1;
  return t.nodes().forEach((a) => {
    he2(i, s, t.node(a));
  }), { graph: t, buckets: i, zeroIdx: s };
}
function he2(e, n, t) {
  var r, o, i;
  t.out ? t.in ? (i = e[t.out - t.in + n]) == null || i.enqueue(t) : (o = e[e.length - 1]) == null || o.enqueue(t) : (r = e[0]) == null || r.enqueue(t);
}
function ft(e) {
  let n = [];
  for (let t = 0;t < e; t++)
    n.push(t);
  return n;
}
function Ue2(e, n) {
  (e.graph().acyclicer === "greedy" ? be2(e, r(e)) : ht(e, n != null ? n : null)).forEach((o) => {
    let i = e.edge(o);
    e.removeEdge(o), i.forwardName = o.name, i.reversed = true, e.setEdge(o.w, o.v, i, $2("rev"));
  });
  function r(o) {
    return (i) => o.edge(i).weight;
  }
}
function ht(e, n) {
  let t = [], r = {}, o = {};
  function i(l) {
    Object.hasOwn(o, l) || (o[l] = true, r[l] = true, e.outEdges(l).forEach((u) => {
      Object.hasOwn(r, u.w) ? t.push(u) : i(u.w);
    }), delete r[l]);
  }
  function s(l) {
    var u;
    Object.hasOwn(o, l) || (o[l] = true, r[l] = true, (u = e.outEdges(l)) == null || u.forEach((d) => {
      var c, f;
      Object.hasOwn(r, d.w) || ((c = n.node(l)) == null ? undefined : c.rank) > ((f = n.node(d.w)) == null ? undefined : f.rank) && bt(e, d.w, d) ? t.push(d) : s(d.w);
    }), delete r[l]);
  }
  let a = i;
  return n && typeof n.node == "function" && (a = s), e.sources().forEach(a), e.nodes().forEach(a), t;
}
function Je2(e) {
  e.edges().forEach((n) => {
    let t = e.edge(n);
    if (t.reversed) {
      e.removeEdge(n);
      let r = t.forwardName;
      delete t.reversed, delete t.forwardName, e.setEdge(n.w, n.v, t, r);
    }
  });
}
function bt(e, n, t) {
  let r = new Set;
  function o(i) {
    var s;
    if (e.sources().includes(i))
      return true;
    r.add(i);
    for (let a of (s = e.inEdges(i)) != null ? s : [])
      if (!(a.v === t.v && a.w === t.w) && !r.has(a.v) && o(a.v))
        return true;
    return false;
  }
  return o(n);
}
function Ke2(e) {
  e.graph().dummyChains = [], e.edges().forEach((n) => pt(e, n));
}
function pt(e, n) {
  let t = n.v, r = e.node(t).rank, o = n.w, i = e.node(o).rank, s = n.name, a = e.edge(n), l = a.labelRank;
  if (i === r + 1)
    return;
  e.removeEdge(n);
  let u, d, c;
  for (c = 0, ++r;r < i; ++c, ++r)
    a.points = [], d = { width: 0, height: 0, edgeLabel: a, edgeObj: n, rank: r }, u = M2(e, "edge", d, "_d"), r === l && (d.width = a.width, d.height = a.height, d.dummy = "edge-label", d.labelpos = a.labelpos), e.setEdge(t, u, { weight: a.weight }, s), c === 0 && e.graph().dummyChains.push(u), t = u;
  e.setEdge(t, o, { weight: a.weight }, s);
}
function Qe2(e) {
  e.graph().dummyChains.forEach((n) => {
    let t = e.node(n), r = t.edgeLabel, o;
    for (e.setEdge(t.edgeObj, r);t.dummy; )
      o = e.successors(n)[0], e.removeNode(n), r.points.push({ x: t.x, y: t.y }), t.dummy === "edge-label" && (r.x = t.x, r.y = t.y, r.width = t.width, r.height = t.height), n = o, t = e.node(n);
  });
}
function U2(e) {
  let n = {};
  function t(r) {
    let o = e.node(r);
    if (Object.hasOwn(n, r))
      return o.rank;
    n[r] = true;
    let i = e.outEdges(r), s = i ? i.map((l) => l == null ? Number.POSITIVE_INFINITY : t(l.w) - e.edge(l).minlen) : [], a = S2(Math.min, s);
    return a === Number.POSITIVE_INFINITY && (a = 0), o.rank = a;
  }
  e.sources().forEach(t);
}
function A(e, n) {
  return e.node(n.w).rank - e.node(n.v).rank - e.edge(n).minlen;
}
var ne2 = Et;
function Et(e) {
  let n = new T2({ directed: false }), t = e.nodes();
  if (t.length === 0)
    throw new Error("Graph must have at least one node");
  let r = t[0], o = e.nodeCount();
  n.setNode(r, {});
  let i, s;
  for (;Lt(n, e) < o && (i = yt(n, e), !!i); )
    s = n.hasNode(i.v) ? A(e, i) : -A(e, i), wt(n, e, s);
  return n;
}
function Lt(e, n) {
  function t(r) {
    let o = n.nodeEdges(r);
    o && o.forEach((i) => {
      let s = i.v, a = r === s ? i.w : s;
      !e.hasNode(a) && !A(n, i) && (e.setNode(a, {}), e.setEdge(r, a, {}), t(a));
    });
  }
  return e.nodes().forEach(t), e.nodeCount();
}
function yt(e, n) {
  return n.edges().reduce((r, o) => {
    let i = Number.POSITIVE_INFINITY;
    return e.hasNode(o.v) !== e.hasNode(o.w) && (i = A(n, o)), i < r[0] ? [i, o] : r;
  }, [Number.POSITIVE_INFINITY, null])[1];
}
function wt(e, n, t) {
  e.nodes().forEach((r) => n.node(r).rank += t);
}
var { preorder: Nt2, postorder: Gt2 } = H;
var en = Y;
Y.initLowLimValues = pe2;
Y.initCutValues = ge2;
Y.calcCutValue = nn;
Y.leaveEdge = rn;
Y.enterEdge = on;
Y.exchangeEdges = sn;
function Y(e) {
  e = Ye(e), U2(e);
  let n = ne2(e);
  pe2(n), ge2(n, e);
  let t, r;
  for (;t = rn(n); )
    r = on(n, e, t), sn(n, e, t, r);
}
function ge2(e, n) {
  let t = Gt2(e, e.nodes());
  t = t.slice(0, t.length - 1), t.forEach((r) => vt(e, n, r));
}
function vt(e, n, t) {
  let o = e.node(t).parent, i = e.edge(t, o);
  i.cutvalue = nn(e, n, t);
}
function nn(e, n, t) {
  let o = e.node(t).parent, i = true, s = n.edge(t, o), a = 0;
  s || (i = false, s = n.edge(o, t)), a = s.weight;
  let l = n.nodeEdges(t);
  return l && l.forEach((u) => {
    let d = u.v === t, c = d ? u.w : u.v;
    if (c !== o) {
      let f = d === i, h = n.edge(u).weight;
      if (a += f ? h : -h, xt(e, t, c)) {
        let m = e.edge(t, c).cutvalue;
        a += f ? -m : m;
      }
    }
  }), a;
}
function pe2(e, n) {
  arguments.length < 2 && (n = e.nodes()[0]), tn(e, {}, 1, n);
}
function tn(e, n, t, r, o) {
  let i = t, s = e.node(r);
  n[r] = true;
  let a = e.neighbors(r);
  return a && a.forEach((l) => {
    Object.hasOwn(n, l) || (t = tn(e, n, t, l, r));
  }), s.low = i, s.lim = t++, o ? s.parent = o : delete s.parent, t;
}
function rn(e) {
  return e.edges().find((n) => e.edge(n).cutvalue < 0);
}
function on(e, n, t) {
  let { v: r, w: o } = t;
  n.hasEdge(r, o) || (r = t.w, o = t.v);
  let i = e.node(r), s = e.node(o), a = i, l = false;
  return i.lim > s.lim && (a = s, l = true), n.edges().filter((d) => l === Ze2(e, e.node(d.v), a) && l !== Ze2(e, e.node(d.w), a)).reduce((d, c) => A(n, c) < A(n, d) ? c : d);
}
function sn(e, n, t, r) {
  let { v: o, w: i } = t;
  e.removeEdge(o, i), e.setEdge(r.v, r.w, {}), pe2(e), ge2(e, n), kt(e, n);
}
function kt(e, n) {
  let t = e.nodes().find((o) => !e.node(o).parent);
  if (!t)
    return;
  let r = Nt2(e, [t]);
  r = r.slice(1), r.forEach((o) => {
    let s = e.node(o).parent, a = n.edge(o, s), l = false;
    a || (a = n.edge(s, o), l = true), n.node(o).rank = n.node(s).rank + (l ? a.minlen : -a.minlen);
  });
}
function xt(e, n, t) {
  return e.hasEdge(n, t);
}
function Ze2(e, n, t) {
  return t.low <= n.lim && n.lim <= t.lim;
}
var dn = _t;
function _t(e) {
  let n = e.graph().ranker;
  if (typeof n == "function")
    return n(e);
  switch (n) {
    case "network-simplex":
      an(e);
      break;
    case "tight-tree":
      Ct(e);
      break;
    case "longest-path":
      Ot(e);
      break;
    case "none":
      break;
    default:
      an(e);
  }
}
var Ot = U2;
function Ct(e) {
  U2(e), ne2(e);
}
function an(e) {
  en(e);
}
var ln = Tt;
function Tt(e) {
  let n = Rt(e), t = e.graph();
  if (!Array.isArray(t.dummyChains))
    return;
  t.dummyChains.forEach((o) => {
    let i = e.node(o), s = i.edgeObj, a = jt2(e, n, s.v, s.w), { path: l, lca: u } = a, d = 0, c = l[d], f = true;
    for (;o !== s.w; ) {
      if (i = e.node(o), f) {
        for (;(c = l[d]) !== u && e.node(c).maxRank < i.rank; )
          d++;
        c === u && (f = false);
      }
      if (!f) {
        for (;d < l.length - 1 && e.node(l[d + 1]).minRank <= i.rank; )
          d++;
        c = l[d];
      }
      c !== undefined && e.setParent(o, c), o = e.successors(o)[0];
    }
  });
}
function jt2(e, n, t, r) {
  let o = [], i = [], s = Math.min(n[t].low, n[r].low), a = Math.max(n[t].lim, n[r].lim), l;
  l = t;
  do
    l = e.parent(l), o.push(l);
  while (l && (n[l].low > s || a > n[l].lim));
  let u = l, d = r;
  for (;(d = e.parent(d)) !== u; )
    i.push(d);
  return { path: o.concat(i.reverse()), lca: u };
}
function Rt(e) {
  let n = {}, t = 0;
  function r(o) {
    let i = t;
    e.children(o).forEach(r), n[o] = { low: i, lim: t++ };
  }
  return e.children(V).forEach(r), n;
}
function un(e) {
  let n = M2(e, "root", {}, "_root"), t = It(e), r = Object.values(t), o = S2(Math.max, r) - 1, i = 2 * o + 1;
  e.graph().nestingRoot = n, e.edges().forEach((a) => e.edge(a).minlen *= i);
  let s = St(e) + 1;
  e.children(V).forEach((a) => {
    cn(e, n, i, s, o, t, a);
  }), e.graph().nodeRankFactor = i;
}
function cn(e, n, t, r, o, i, s) {
  var c;
  let a = e.children(s);
  if (!a.length) {
    s !== n && e.setEdge(n, s, { weight: 0, minlen: t });
    return;
  }
  let l = ae2(e, "_bt"), u = ae2(e, "_bb"), d = e.node(s);
  e.setParent(l, s), d.borderTop = l, e.setParent(u, s), d.borderBottom = u, a.forEach((f) => {
    var b;
    cn(e, n, t, r, o, i, f);
    let h = e.node(f), g = h.borderTop ? h.borderTop : f, m = h.borderBottom ? h.borderBottom : f, L = h.borderTop ? r : 2 * r, y = g !== m ? 1 : o - ((b = i[s]) != null ? b : 0) + 1;
    e.setEdge(l, g, { weight: L, minlen: y, nestingEdge: true }), e.setEdge(m, u, { weight: L, minlen: y, nestingEdge: true });
  }), e.parent(s) || e.setEdge(n, l, { weight: 0, minlen: o + ((c = i[s]) != null ? c : 0) });
}
function It(e) {
  let n = {};
  function t(r, o) {
    let i = e.children(r);
    i && i.length && i.forEach((s) => t(s, o + 1)), n[r] = o;
  }
  return e.children(V).forEach((r) => t(r, 1)), n;
}
function St(e) {
  return e.edges().reduce((n, t) => n + e.edge(t).weight, 0);
}
function fn(e) {
  let n = e.graph();
  e.removeNode(n.nestingRoot), delete n.nestingRoot, e.edges().forEach((t) => {
    e.edge(t).nestingEdge && e.removeEdge(t);
  });
}
var bn = Pt;
function Pt(e) {
  function n(t) {
    let r = e.children(t), o = e.node(t);
    if (r.length && r.forEach(n), o && Object.hasOwn(o, "minRank")) {
      o.borderLeft = [], o.borderRight = [];
      for (let i = o.minRank, s = o.maxRank + 1;i < s; ++i)
        hn(e, "borderLeft", "_bl", t, o, i), hn(e, "borderRight", "_br", t, o, i);
    }
  }
  e.children(V).forEach(n);
}
function hn(e, n, t, r, o, i) {
  let s = { width: 0, height: 0, rank: i, borderType: n }, a = o[n][i - 1], l = M2(e, "border", s, t);
  o[n][i] = l, e.setParent(l, r), a && e.setEdge(a, l, { weight: 1 });
}
function pn(e) {
  var t;
  let n = (t = e.graph().rankdir) == null ? undefined : t.toLowerCase();
  (n === "lr" || n === "rl") && En(e);
}
function mn(e) {
  var t;
  let n = (t = e.graph().rankdir) == null ? undefined : t.toLowerCase();
  (n === "bt" || n === "rl") && Ft2(e), (n === "lr" || n === "rl") && (Dt2(e), En(e));
}
function En(e) {
  e.nodes().forEach((n) => gn(e.node(n))), e.edges().forEach((n) => gn(e.edge(n)));
}
function gn(e) {
  let n = e.width;
  e.width = e.height, e.height = n;
}
function Ft2(e) {
  e.nodes().forEach((n) => me2(e.node(n))), e.edges().forEach((n) => {
    var r;
    let t = e.edge(n);
    (r = t.points) == null || r.forEach(me2), Object.hasOwn(t, "y") && me2(t);
  });
}
function me2(e) {
  e.y = -e.y;
}
function Dt2(e) {
  e.nodes().forEach((n) => Ee2(e.node(n))), e.edges().forEach((n) => {
    var r;
    let t = e.edge(n);
    (r = t.points) == null || r.forEach(Ee2), Object.hasOwn(t, "x") && Ee2(t);
  });
}
function Ee2(e) {
  let n = e.x;
  e.x = e.y, e.y = n;
}
function Le2(e, n = null) {
  let t = {}, r = e.nodes().filter((d) => !e.children(d).length), o = r.map((d) => e.node(d).rank), i = S2(Math.max, o), s = D2(i + 1).map(() => []);
  function a(d) {
    if (t[d])
      return;
    t[d] = true;
    let c = e.node(d);
    s[c.rank].push(d);
    let f = e.successors(d);
    f && [...f].sort((g, m) => u(g, m)).forEach(a);
  }
  r.sort((d, c) => e.node(d).rank - e.node(c).rank).forEach(a);
  function u(d, c) {
    let f = e.node(d), h = e.node(c);
    return ee(n, f, h);
  }
  return s;
}
function ye2(e, n) {
  let t = 0;
  for (let r = 1;r < n.length; ++r)
    t += Vt(e, n[r - 1], n[r]);
  return t;
}
function Vt(e, n, t) {
  let r = He2(t, t.map((u, d) => d)), o = n.flatMap((u) => {
    let d = e.outEdges(u);
    return d ? d.map((c) => ({ pos: r[c.w], weight: e.edge(c).weight })).sort((c, f) => c.pos - f.pos) : [];
  }), i = 1;
  for (;i < t.length; )
    i <<= 1;
  let s = 2 * i - 1;
  i -= 1;
  let a = new Array(s).fill(0), l = 0;
  return o.forEach((u) => {
    let d = u.pos + i;
    a[d] += u.weight;
    let c = 0;
    for (;d > 0; )
      d % 2 && (c += a[d + 1]), d = d - 1 >> 1, a[d] += u.weight;
    l += u.weight * c;
  }), l;
}
function we2(e, n = []) {
  return n.map((t) => {
    let r = e.inEdges(t);
    if (!r || !r.length)
      return { v: t };
    {
      let o = r.reduce((i, s) => {
        let a = e.edge(s), l = e.node(s.v);
        return { sum: i.sum + a.weight * l.order, weight: i.weight + a.weight };
      }, { sum: 0, weight: 0 });
      return { v: t, barycenter: o.sum / o.weight, weight: o.weight };
    }
  });
}
function Ne2(e, n) {
  let t = {};
  e.forEach((o, i) => {
    let s = { indegree: 0, in: [], out: [], vs: [o.v], i };
    o.barycenter !== undefined && (s.barycenter = o.barycenter, s.weight = o.weight), t[o.v] = s;
  }), n.edges().forEach((o) => {
    let i = t[o.v], s = t[o.w];
    i !== undefined && s !== undefined && (s.indegree++, i.out.push(s));
  });
  let r = Object.values(t).filter((o) => !o.indegree);
  return Yt(r);
}
function Yt(e) {
  let n = [];
  function t(o) {
    return (i) => {
      i.merged || (i.barycenter === undefined || o.barycenter === undefined || i.barycenter >= o.barycenter) && Bt(o, i);
    };
  }
  function r(o) {
    return (i) => {
      i.in.push(o), --i.indegree === 0 && e.push(i);
    };
  }
  for (;e.length; ) {
    let o = e.pop();
    n.push(o), o.in.reverse().forEach(t(o)), o.out.forEach(r(o));
  }
  return n.filter((o) => !o.merged).map((o) => W2(o, ["vs", "i", "barycenter", "weight"]));
}
function Bt(e, n) {
  let t = 0, r = 0;
  e.weight && (t += e.barycenter * e.weight, r += e.weight), n.weight && (t += n.barycenter * n.weight, r += n.weight), e.vs = n.vs.concat(e.vs), e.barycenter = t / r, e.weight = r, e.i = Math.min(n.i, e.i), n.merged = true;
}
function Ge2(e, n, t, r, o) {
  let i = {}, s = null, a = null, l = o;
  typeof n == "boolean" ? (l = n, i = {}) : n && (i = n, s = t != null ? t : null, a = r != null ? r : null);
  let u = ze2(e, (y) => Object.hasOwn(y, "barycenter")), d = u.lhs, c = u.rhs.sort((y, b) => b.i - y.i), f = [], h = 0, g = 0, m = 0;
  d.sort(Wt(a, s, !!l));
  for (let [y, b] of Object.entries(i)) {
    let p = d.findIndex((E) => E.vs[0] === y);
    d.splice(p + 1, 0, b);
  }
  m = Ln(f, c, m), d.forEach((y) => {
    m += y.vs.length, f.push(y.vs), h += y.barycenter * y.weight, g += y.weight, m = Ln(f, c, m);
  });
  let L = { vs: f.flat(1) };
  return g && (L.barycenter = h / g, L.weight = g), L;
}
function Ln(e, n, t) {
  let r;
  for (;n.length && (r = n[n.length - 1]).i <= t; )
    n.pop(), e.push(r.vs), t++;
  return t;
}
function Wt(e, n, t) {
  return (r, o) => {
    if (r.barycenter < o.barycenter)
      return -1;
    if (r.barycenter > o.barycenter)
      return 1;
    if (e && (typeof r.vs[0] == "string" || typeof o.vs[0] == "string")) {
      let i = e.node(r.vs[0]), s = e.node(o.vs[0]), a = ee(n, i, s);
      if (a !== 0)
        return a;
    }
    return t ? o.i - r.i : r.i - o.i;
  };
}
function te2(e, n, t, r, o) {
  var y, b, p, E, w, k, _, O, j, R, I;
  let i = null, s = o;
  typeof r == "boolean" ? (s = r, i = null) : r !== undefined && (i = r);
  let a = e.children(n), l = e.node(n), u = l ? l.borderLeft : undefined, d = l ? l.borderRight : undefined, c = {};
  u && (a = a.filter((v) => v !== u && v !== d));
  let f = we2(e, a);
  f.forEach((v) => {
    if (e.children(v.v).length) {
      let { result: x } = te2(e, v.v, t, i, s);
      c[v.v] = x, Object.hasOwn(x, "barycenter") && zt(v, x);
    }
  });
  let h = Ne2(f, t);
  Xt(h, c);
  let g = {}, m = false;
  for (let v = 0;v < h.length; v++)
    for (let x = v + 1;x < h.length; x++)
      if (!(!h[v] || !h[x] || !((y = h[v]) != null && y.barycenter) || !((b = h[x]) != null && b.barycenter)) && ((p = h[v]) == null ? undefined : p.barycenter) === h[x].barycenter) {
        let G = (w = (E = h[v]) == null ? undefined : E.vs[0]) != null ? w : "", N = (_ = (k = h[x]) == null ? undefined : k.vs[0]) != null ? _ : "", C = e.node(G), B = e.node(N);
        if (C.dummy === "edge" && B.dummy === "edge" && ((O = C.edgeObj) == null ? undefined : O.v) === ((j = B.edgeObj) == null ? undefined : j.v) && ((R = C.edgeObj) == null ? undefined : R.w) === ((I = B.edgeObj) == null ? undefined : I.w))
          if (C.edgeLabel.reversed) {
            g[N] = h[v], h.splice(v, 1), v--;
            break;
          } else
            g[G] || (g[G] = h[x], h.splice(x, 1), x--);
        else
          m = true;
      }
  let L = Ge2(h, g, i, e, s);
  if (u && d) {
    L.vs = [u, L.vs, d].flat(1);
    let v = e.predecessors(u);
    if (v && v.length) {
      let x = e.node(v[0]), G = e.predecessors(d), N = e.node(G[0]);
      Object.hasOwn(L, "barycenter") || (L.barycenter = 0, L.weight = 0), L.barycenter = (L.barycenter * L.weight + x.order + N.order) / (L.weight + 2), L.weight += 2;
    }
  }
  return Object.defineProperty(L, "result", { value: L, enumerable: false, configurable: true, writable: true }), Object.defineProperty(L, "usedBias", { value: m, enumerable: false, configurable: true, writable: true }), L;
}
function Xt(e, n) {
  e.forEach((t) => {
    t.vs = t.vs.flatMap((r) => n[r] ? n[r].vs : r);
  });
}
function zt(e, n) {
  e.barycenter !== undefined ? (e.barycenter = (e.barycenter * e.weight + n.barycenter * n.weight) / (e.weight + n.weight), e.weight += n.weight) : (e.barycenter = n.barycenter, e.weight = n.weight);
}
function ve2(e, n, t, r) {
  r || (r = e.nodes());
  let o = Ht2(e), i = new T2({ compound: true }).setGraph({ root: o }).setDefaultNodeLabel((s) => e.node(s));
  return r.forEach((s) => {
    let a = e.node(s), l = e.parent(s);
    if (a.rank === n || a.minRank <= n && n <= a.maxRank) {
      i.setNode(s), i.setParent(s, l || o);
      let u = e[t](s);
      u && u.forEach((d) => {
        let c = d.v === s ? d.w : d.v, f = i.edge(c, s), h = f !== undefined ? f.weight : 0;
        i.setEdge(c, s, { weight: e.edge(d).weight + h });
      }), Object.hasOwn(a, "minRank") && i.setNode(s, { borderLeft: a.borderLeft[n], borderRight: a.borderRight[n] });
    }
  }), i;
}
function Ht2(e) {
  let n;
  for (;e.hasNode(n = $2("_root")); )
    ;
  return n;
}
function ke2(e, n, t) {
  let r = {}, o;
  t.forEach((i) => {
    let s = e.parent(i), a, l;
    for (;s; ) {
      if (a = e.parent(s), a ? (l = r[a], r[a] = s) : (l = o, o = s), l && l !== s) {
        n.setEdge(l, s);
        return;
      }
      s = a;
    }
  });
}
function re2(e, n = {}, t = null) {
  if (typeof n.customOrder == "function") {
    n.customOrder(e, re2);
    return;
  }
  let r = de2(e), o = yn(e, D2(1, r + 1), "inEdges"), i = yn(e, D2(r - 1, -1, -1), "outEdges"), s = Le2(e, t);
  if (wn(e, s), n.disableOptimalOrderHeuristic)
    return;
  let a = Number.POSITIVE_INFINITY, l, u = n.constraints || [];
  for (let d = 0, c = 0;c < 4; ++d, ++c) {
    qt(d % 2 ? o : i, d % 4 >= 2, u, t), s = P2(e);
    let f = ye2(e, s);
    f < a ? (c = 0, l = Object.assign({}, s), a = f) : f === a && (l = structuredClone(s));
  }
  wn(e, l);
}
function yn(e, n, t) {
  let r = new Map, o = (i, s) => {
    r.has(i) || r.set(i, []), r.get(i).push(s);
  };
  for (let i of e.nodes()) {
    let s = e.node(i);
    if (typeof s.rank == "number" && o(s.rank, i), typeof s.minRank == "number" && typeof s.maxRank == "number")
      for (let a = s.minRank;a <= s.maxRank; a++)
        a !== s.rank && o(a, i);
  }
  return n.map(function(i) {
    return ve2(e, i, t, r.get(i) || []);
  });
}
function qt(e, n, t, r) {
  let o = true, i = new T2;
  e.forEach(function(s) {
    t.forEach((d) => i.setEdge(d.left, d.right));
    let a = s.graph().root, { result: l, usedBias: u } = te2(s, a, i, r, o);
    n && u && (o = !o), l.vs.forEach((d, c) => s.node(d).order = c), ke2(s, i, l.vs);
  });
}
function wn(e, n) {
  Object.values(n).forEach((t) => t.forEach((r, o) => e.node(r).order = o));
}
function $t(e, n) {
  let t = {};
  function r(o, i) {
    let s = 0, a = 0, l = o.length, u = i[i.length - 1];
    return i.forEach((d, c) => {
      let f = Jt(e, d), h = f ? e.node(f).order : l;
      (f || d === u) && (i.slice(a, c + 1).forEach((g) => {
        let m = e.predecessors(g);
        m && m.forEach((L) => {
          let y = e.node(L), b = y.order;
          (b < s || h < b) && !(y.dummy && e.node(g).dummy) && Gn(t, L, g);
        });
      }), a = c + 1, s = h);
    }), i;
  }
  return n.length && n.reduce(r), t;
}
function Ut(e, n) {
  let t = {};
  function r(a) {
    var l;
    return ((l = e.node(a)) == null ? undefined : l.dummy) === "border";
  }
  if (!e.nodes().some(r))
    return t;
  function i(a, l, u, d, c) {
    D2(l, u).forEach((f) => {
      let h = a[f];
      if (h !== undefined && e.node(h).dummy) {
        let g = e.predecessors(h);
        g && g.forEach((m) => {
          if (m === undefined)
            return;
          let L = e.node(m);
          L.dummy && (L.order < d || L.order > c) && Gn(t, m, h);
        });
      }
    });
  }
  function s(a, l) {
    let u = -1, d = -1, c = 0;
    return l.forEach((f, h) => {
      if (r(f)) {
        let g = e.predecessors(f);
        if (g && g.length) {
          let m = g[0];
          if (m === undefined)
            return;
          d = e.node(m).order, i(l, c, h, u, d), c = h, u = d;
        }
      }
      i(l, c, l.length, d, a.length);
    }), l;
  }
  return n.length && n.reduce(s), t;
}
function Jt(e, n) {
  if (e.node(n).dummy) {
    let t = e.predecessors(n);
    if (t)
      return t.find((r) => e.node(r).dummy);
  }
}
function Gn(e, n, t) {
  if (n > t) {
    let o = n;
    n = t, t = o;
  }
  let r = e[n];
  r || (e[n] = r = {}), r[t] = true;
}
function Kt(e, n, t) {
  if (n > t) {
    let o = n;
    n = t, t = o;
  }
  let r = e[n];
  return r !== undefined && Object.hasOwn(r, t);
}
function Qt(e, n, t, r, o) {
  let i = {}, s = {}, a = {};
  return n.forEach((l) => {
    l.forEach((u, d) => {
      i[u] = u, s[u] = u, a[u] = d;
    });
  }), n.forEach((l) => {
    let u = -1, d = -1, c = false, f = l, h = l.findIndex((g) => (o == null ? undefined : o.includes(g)) || Nn(g, e, o));
    h > 0 && (f = [l[h], ...l.slice(0, h), ...l.slice(h + 1)], c = true), f.forEach((g) => {
      var L;
      let m = r(g);
      if (m && m.length) {
        o != null && o.includes(g) && (m = m.filter((p) => Nn(p, e, o)));
        let y = m.sort((p, E) => {
          let w = a[p], k = a[E];
          return (w !== undefined ? w : 0) - (k !== undefined ? k : 0);
        }), b = (y.length - 1) / 2;
        for (let p = Math.floor(b), E = Math.ceil(b);p <= E; ++p) {
          let w = y[p];
          if (w === undefined)
            continue;
          let k = a[w];
          if (k !== undefined && s[g] === g && u < k && a[w] !== d && !Kt(t, g, w)) {
            let _ = i[w];
            _ !== undefined && (s[w] = g, s[g] = i[g] = _, u = k, c && (u = -1, d = (L = a[w]) != null ? L : -1, c = false));
          }
        }
      }
    });
  }), { root: i, align: s };
}
function Zt2(e, n, t, r, o = false) {
  let i = {}, s = er(e, n, t, o), a = o ? "borderLeft" : "borderRight";
  function l(h, g) {
    let m = s.nodes().slice(), L = {}, y = m.pop();
    for (;y; ) {
      if (L[y])
        h(y);
      else {
        L[y] = true, m.push(y);
        for (let b of g(y))
          m.push(b);
      }
      y = m.pop();
    }
  }
  function u(h) {
    let g = s.inEdges(h);
    g ? i[h] = g.reduce((m, L) => {
      var p;
      let y = (p = i[L.v]) != null ? p : 0, b = s.edge(L);
      return Math.max(m, y + (b !== undefined ? b : 0));
    }, 0) : i[h] = 0;
  }
  function d(h) {
    let g = s.outEdges(h), m = Number.POSITIVE_INFINITY;
    g && (m = g.reduce((y, b) => {
      let p = i[b.w], E = s.edge(b);
      return Math.min(y, (p !== undefined ? p : 0) - (E !== undefined ? E : 0));
    }, Number.POSITIVE_INFINITY));
    let L = e.node(h);
    m !== Number.POSITIVE_INFINITY && L.borderType !== a && (i[h] = Math.max(i[h] !== undefined ? i[h] : 0, m));
  }
  function c(h) {
    return s.predecessors(h) || [];
  }
  function f(h) {
    return s.successors(h) || [];
  }
  return l(u, c), l(d, f), Object.keys(r).forEach((h) => {
    var m;
    let g = t[h];
    g !== undefined && (i[h] = (m = i[g]) != null ? m : 0);
  }), i;
}
function er(e, n, t, r) {
  let o = new T2, i = e.graph(), s = or(i.nodesep, i.edgesep, r);
  return n.forEach((a) => {
    let l;
    a.forEach((u) => {
      let d = t[u];
      if (d !== undefined) {
        if (o.setNode(d), l !== undefined) {
          let c = t[l];
          if (c !== undefined) {
            let f = o.edge(c, d);
            o.setEdge(c, d, Math.max(s(e, u, l), f || 0));
          }
        }
        l = u;
      }
    });
  }), o;
}
function nr(e, n) {
  return Object.values(n).reduce((t, r) => {
    let { NEGATIVE_INFINITY: o, POSITIVE_INFINITY: i } = Number;
    Object.entries(r).forEach(([a, l]) => {
      let u = ir(e, a) / 2;
      o = Math.max(l + u, o), i = Math.min(l - u, i);
    });
    let s = o - i;
    return s < t[0] && (t = [s, r]), t;
  }, [Number.POSITIVE_INFINITY, null])[1];
}
function tr(e, n) {
  let t = Object.values(n), r = S2(Math.min, t), o = S2(Math.max, t);
  ["u", "d"].forEach((i) => {
    ["l", "r"].forEach((s) => {
      let a = i + s, l = e[a];
      if (!l || l === n)
        return;
      let u = Object.values(l), d = r - S2(Math.min, u);
      s !== "l" && (d = o - S2(Math.max, u)), d && (e[a] = X2(l, (c) => c + d));
    });
  });
}
function rr(e, n = undefined) {
  let t = e.ul;
  return t ? X2(t, (r, o) => {
    var s, a;
    if (n) {
      let l = n.toLowerCase(), u = e[l];
      if (u && u[o] !== undefined)
        return u[o];
    }
    let i = Object.values(e).map((l) => {
      let u = l[o];
      return u !== undefined ? u : 0;
    }).sort((l, u) => l - u);
    return (((s = i[1]) != null ? s : 0) + ((a = i[2]) != null ? a : 0)) / 2;
  }) : {};
}
function vn(e, n) {
  let t = P2(e), r = Object.assign($t(e, t), Ut(e, t)), o = {}, i;
  ["u", "d"].forEach((a) => {
    i = a === "u" ? t : Object.values(t).reverse(), ["l", "r"].forEach((l) => {
      l === "r" && (i = i.map((f) => Object.values(f).reverse()));
      let d = Qt(e, i, r, (f) => (a === "u" ? e.predecessors(f) : e.successors(f)) || [], n), c = Zt2(e, i, d.root, d.align, l === "r");
      l === "r" && (c = X2(c, (f) => -f)), o[a + l] = c;
    });
  });
  let s = nr(e, o);
  return tr(o, s), rr(o, e.graph().align);
}
function or(e, n, t) {
  return (r, o, i) => {
    let s = r.node(o), a = r.node(i), l = 0, u;
    if (l += s.width / 2, Object.hasOwn(s, "labelpos"))
      switch (s.labelpos.toLowerCase()) {
        case "l":
          u = -s.width / 2;
          break;
        case "r":
          u = s.width / 2;
          break;
      }
    if (u && (l += t ? u : -u), u = undefined, l += (s.dummy ? n : e) / 2, l += (a.dummy ? n : e) / 2, l += a.width / 2, Object.hasOwn(a, "labelpos"))
      switch (a.labelpos.toLowerCase()) {
        case "l":
          u = a.width / 2;
          break;
        case "r":
          u = -a.width / 2;
          break;
      }
    return u && (l += t ? u : -u), l;
  };
}
function ir(e, n) {
  return e.node(n).width;
}
function Nn(e, n, t) {
  var s;
  if (!t)
    return false;
  let r = (s = n.node(e)) == null ? undefined : s.edgeObj;
  if (!r || n.node(e).edgeLabel.reversed)
    return false;
  let o = t.indexOf(r == null ? undefined : r.v), i = t.indexOf(r == null ? undefined : r.w);
  return o !== -1 && i !== -1 && o === (i + 1) % t.length || o === (i - 1) % t.length;
}
function kn(e, n) {
  e = Z2(e), sr(e), Object.entries(vn(e, n)).forEach(([t, r]) => e.node(t).x = r);
}
function sr(e) {
  let n = P2(e), t = e.graph(), { ranksep: r, rankalign: o } = t, i = 0;
  n.forEach((s) => {
    let a = s.reduce((l, u) => {
      var c;
      let d = (c = e.node(u).height) != null ? c : 0;
      return l > d ? l : d;
    }, 0);
    s.forEach((l) => {
      let u = e.node(l);
      o === "top" ? u.y = i + u.height / 2 : o === "bottom" ? u.y = i + a - u.height / 2 : u.y = i + a / 2;
    }), i += a + r;
  });
}
var xn = new WeakMap;
function Oe2(e, n = {}) {
  return In(e, q2, n), e;
}
function _n(e, n, t) {
  let r = n;
  for (;r !== undefined; ) {
    let o = e.parent(r);
    if (o === t)
      return r;
    r = o;
  }
}
function In(e, n, t) {
  var y;
  let r = e.nodes().filter((b) => e.children(b).length), o = {};
  r.forEach((b) => {
    let p = e.node(b);
    if (p && p.rankdir) {
      let E = new T2({ multigraph: true, compound: true });
      E.setGraph({ rankdir: p.rankdir });
      let w = e.children(b);
      w.forEach((G) => {
        let N = { ...e.node(G) };
        E.setNode(G, N);
        let C = e.parent(G);
        C && C !== b && w.includes(C) && E.setParent(G, C);
      });
      let k = new Set;
      e.edges().forEach((G) => {
        let N = _n(e, G.v, b), C = _n(e, G.w, b);
        if (N === G.v && C === G.w)
          E.setEdge(G, { ...e.edge(G) });
        else if (N && C && N !== C) {
          let B = `${N}\x00${C}`;
          k.has(B) || (k.add(B), E.setEdge(N, C, { ...e.edge(G) }));
        }
      }), In(E, n, t);
      let _ = Rn(E);
      Cn(_, n, t, null), Tn(E, _);
      let O = 1 / 0, j = 1 / 0, R = -1 / 0, I = -1 / 0;
      E.nodes().forEach((G) => {
        if (G === b)
          return;
        let N = E.node(G);
        N && typeof N.x == "number" && typeof N.y == "number" && typeof N.width == "number" && typeof N.height == "number" && (O = Math.min(O, N.x - N.width / 2), R = Math.max(R, N.x + N.width / 2), j = Math.min(j, N.y - N.height / 2), I = Math.max(I, N.y + N.height / 2));
      }), (!isFinite(O) || !isFinite(j) || !isFinite(R) || !isFinite(I)) && (O = j = 0, R = I = 0);
      let v = R - O, x = I - j;
      o[b] = { minX: O, minY: j, maxX: R, maxY: I, width: v, height: x, offsetX: O, offsetY: j }, p._dagreClusterSubgraph = E;
    }
  });
  let i = [], s = (b) => {
    let p = [], E = (e.children(b) || []).filter((w) => w !== b);
    for (;E.length > 0; ) {
      let w = E.shift();
      p.push(w), (e.children(w) || []).filter((k) => k !== w).forEach((k) => E.push(k));
    }
    return p;
  }, a = new Map;
  r.forEach((b) => {
    let p = e.node(b);
    p && p.rankdir && o[b] && a.set(b, (e.children(b) || []).filter((E) => E !== b));
  });
  let l = new Set([...a.values()].flat()), u = new Map;
  a.forEach((b, p) => {
    l.has(p) || u.set(p, s(p));
  });
  let d = new Set([...u.values()].flat()), c = (b) => {
    for (let [p, E] of u)
      if (E.includes(b))
        return p;
    return b;
  }, f = [];
  e.edges().forEach((b) => {
    (d.has(b.v) || d.has(b.w)) && f.push({ edge: b, label: e.edge(b) });
  });
  let h = new Map;
  d.forEach((b) => {
    let p = e.parent(b);
    h.set(b, typeof p == "string" ? p : undefined);
  }), u.forEach((b, p) => {
    let E = e.node(p), w = [];
    b.forEach((O) => {
      let j = e.node(O);
      j && (w.push({ id: O, node: j, parent: h.get(O) }), e.removeNode(O));
    });
    let k = f.filter(({ edge: O }) => b.includes(O.v) || b.includes(O.w)), _ = o[p];
    E && (i.push({ clusterId: p, subgraph: E._dagreClusterSubgraph, bounds: _, children: b, removedNodes: w, removedEdges: k }), E.width = _.width, E.height = _.height);
  });
  let g = new Set;
  f.forEach(({ edge: b, label: p }) => {
    let E = c(b.v), w = c(b.w);
    if (E !== w && e.hasNode(E) && e.hasNode(w)) {
      let k = `${E}\x00${w}`;
      g.has(k) || (g.add(k), e.setEdge(E, w, { ...p, width: 0, height: 0 }));
    }
  });
  let m = Rn(e), L = Cn(m, n, t, (y = xn.get(e)) != null ? y : null);
  xn.set(e, L), Tn(e, m), g.forEach((b) => {
    let p = b.indexOf("\x00"), E = b.slice(0, p), w = b.slice(p + 1);
    e.hasEdge(E, w) && e.removeEdge(E, w);
  }), i.forEach(({ clusterId: b, subgraph: p, bounds: E, removedNodes: w, removedEdges: k }) => {
    var v, x;
    let _ = e.node(b), O = (v = _ == null ? undefined : _.x) != null ? v : 0, j = (x = _ == null ? undefined : _.y) != null ? x : 0, R = (E.minX + E.maxX) / 2, I = (E.minY + E.maxY) / 2;
    w.forEach(({ id: G, node: N, parent: C }) => {
      e.setNode(G, N), C !== undefined && e.setParent(G, C);
    }), k.forEach(({ edge: G, label: N }) => {
      e.setEdge(G, N);
    }), p.nodes().forEach((G) => {
      if (G === b)
        return;
      let N = p.node(G), C = e.node(G);
      C && N && typeof N.x == "number" && typeof N.y == "number" && (C.x = O + (N.x - R), C.y = j + (N.y - I));
    }), On(e, p, O - R, j - I), delete _._dagreClusterSubgraph;
  }), r.forEach((b) => {
    var w, k;
    let p = e.node(b), E = o[b];
    if (p && p.rankdir && p._dagreClusterSubgraph && E) {
      let _ = p._dagreClusterSubgraph, O = (w = p.x) != null ? w : 0, j = (k = p.y) != null ? k : 0, R = (E.minX + E.maxX) / 2, I = (E.minY + E.maxY) / 2;
      _.nodes().forEach((v) => {
        if (v === b)
          return;
        let x = _.node(v), G = e.node(v);
        if (G && x && typeof x.x == "number" && typeof x.y == "number") {
          let N = x.x - R, C = x.y - I;
          G.x = O + N, G.y = j + C;
        }
      }), On(e, _, O - R, j - I), delete p._dagreClusterSubgraph;
    }
  });
}
function On(e, n, t, r) {
  n.edges().forEach((o) => {
    if (!e.hasEdge(o))
      return;
    let i = n.edge(o), s = e.edge(o);
    s.points = i.points.map((a) => ({ x: a.x + t, y: a.y + r })), Object.hasOwn(i, "x") && (s.x = i.x + t, s.y = i.y + r);
  });
}
function Cn(e, n, t, r = null) {
  var l, u;
  let o = (t == null ? undefined : t.useDynamic) !== false, i = o && (l = r == null ? undefined : r.graph) != null ? l : null, s = o && (u = r == null ? undefined : r.rawNodes) != null ? u : null;
  n("    makeSpaceForEdgeLabels", () => br(e)), n("    removeSelfEdges", () => Gr(e)), n("    acyclic", () => Ue2(e, i)), n("    nestingGraph.run", () => un(e)), n("    rank", () => dn(Z2(e))), n("    injectEdgeLabelProxies", () => gr(e)), n("    removeEmptyRanks", () => We2(e)), n("    nestingGraph.cleanup", () => fn(e)), n("    normalizeRanks", () => Be2(e)), n("    assignRankMinMax", () => pr(e)), n("    removeEdgeLabelProxies", () => mr(e)), n("    normalize.run", () => Ke2(e)), n("    parentDummyChains", () => ln(e)), n("    addBorderSegments", () => bn(e)), n("    order", () => re2(e, t, s)), n("    insertSelfEdges", () => vr(e)), n("    adjustCoordinateSystem", () => pn(e)), n("    position", () => kn(e, t.corePath)), n("    positionSelfEdges", () => kr(e));
  let a = JSON.parse(JSON.stringify(e._nodes));
  return n("    removeBorderNodes", () => Nr(e)), n("    normalize.undo", () => Qe2(e)), n("    fixupEdgeLabelCoords", () => yr(e)), n("    undoCoordinateSystem", () => mn(e)), n("    translateGraph", () => Er(e)), n("    assignNodeIntersects", () => Lr(e)), n("    reversePoints", () => wr(e)), n("    acyclic.undo", () => Je2(e)), { graph: e, rawNodes: a };
}
function Tn(e, n) {
  e.nodes().forEach((t) => {
    let r = e.node(t), o = n.node(t);
    r && (r.x = o.x, r.y = o.y, r.order = o.order, r.rank = o.rank, n.children(t).length && (r.width = o.width, r.height = o.height));
  }), e.edges().forEach((t) => {
    let r = e.edge(t), o = n.edge(t);
    r.points = o.points, Object.hasOwn(o, "x") && (r.x = o.x, r.y = o.y);
  }), e.graph().width = n.graph().width, e.graph().height = n.graph().height;
}
var ar = ["nodesep", "edgesep", "ranksep", "marginx", "marginy"];
var dr = { ranksep: 50, edgesep: 20, nodesep: 50, rankdir: "TB", rankalign: "center" };
var lr = ["acyclicer", "ranker", "rankdir", "align", "rankalign"];
var ur = ["width", "height", "rank"];
var jn = { width: 0, height: 0 };
var cr = ["minlen", "weight", "width", "height", "labeloffset"];
var fr = { minlen: 1, weight: 1, width: 0, height: 0, labeloffset: 10, labelpos: "r" };
var hr = ["labelpos"];
function Rn(e) {
  let n = new T2({ multigraph: true, compound: true }), t = _e2(e.graph());
  return n.setGraph(Object.assign({}, dr, xe2(t, ar), W2(t, lr))), e.nodes().forEach((r) => {
    let o = _e2(e.node(r)), i = xe2(o, ur);
    Object.keys(jn).forEach((a) => {
      i[a] === undefined && (i[a] = jn[a]);
    }), n.setNode(r, i);
    let s = e.parent(r);
    s !== undefined && n.setParent(r, s);
  }), e.edges().forEach((r) => {
    let o = _e2(e.edge(r));
    n.setEdge(r, Object.assign({}, fr, xe2(o, cr), W2(o, hr)));
  }), n;
}
function br(e) {
  let n = e.graph();
  n.ranksep /= 2, e.edges().forEach((t) => {
    var o;
    let r = e.edge(t);
    r.minlen *= 2, ((o = r.labelpos) != null ? o : "r").toLowerCase() !== "c" && (n.rankdir === "TB" || n.rankdir === "BT" ? r.width += r.labeloffset : r.height += r.labeloffset);
  });
}
function gr(e) {
  e.edges().forEach((n) => {
    let t = e.edge(n);
    if (t.width && t.height) {
      let r = e.node(n.v), i = { rank: (e.node(n.w).rank - r.rank) / 2 + r.rank, e: n };
      M2(e, "edge-proxy", i, "_ep");
    }
  });
}
function pr(e) {
  let n = 0;
  e.nodes().forEach((t) => {
    let r = e.node(t);
    r.borderTop && (r.minRank = e.node(r.borderTop).rank, r.maxRank = e.node(r.borderBottom).rank, n = Math.max(n, r.maxRank));
  }), e.graph().maxRank = n;
}
function mr(e) {
  e.nodes().forEach((n) => {
    let t = e.node(n);
    if (t.dummy === "edge-proxy") {
      let r = t;
      e.edge(r.e).labelRank = t.rank, e.removeNode(n);
    }
  });
}
function Er(e) {
  let n = Number.POSITIVE_INFINITY, t = 0, r = Number.POSITIVE_INFINITY, o = 0, i = e.graph(), s = i.marginx || 0, a = i.marginy || 0;
  function l(u) {
    let { x: d, y: c, width: f, height: h } = u;
    n = Math.min(n, d - f / 2), t = Math.max(t, d + f / 2), r = Math.min(r, c - h / 2), o = Math.max(o, c + h / 2);
  }
  e.nodes().forEach((u) => l(e.node(u))), e.edges().forEach((u) => {
    let d = e.edge(u);
    Object.hasOwn(d, "x") && l(d);
  }), n -= s, r -= a, e.nodes().forEach((u) => {
    let d = e.node(u);
    d.x -= n, d.y -= r;
  }), e.edges().forEach((u) => {
    let d = e.edge(u);
    d.points.forEach((c) => {
      c.x -= n, c.y -= r;
    }), Object.hasOwn(d, "x") && (d.x -= n), Object.hasOwn(d, "y") && (d.y -= r);
  }), i.width = t - n + s, i.height = o - r + a;
}
function Lr(e) {
  e.edges().forEach((n) => {
    if (n.v === n.w)
      return;
    let t = e.edge(n), r = e.node(n.v), o = e.node(n.w), i, s;
    t.points ? (i = t.points[0], s = t.points[t.points.length - 1]) : (t.points = [], i = o, s = r), t.points.unshift(se2(r, i)), t.points.push(se2(o, s));
  });
}
function yr(e) {
  e.edges().forEach((n) => {
    let t = e.edge(n);
    if (Object.hasOwn(t, "x"))
      switch ((t.labelpos === "l" || t.labelpos === "r") && (t.width -= t.labeloffset), t.labelpos) {
        case "l":
          t.x -= t.width / 2 + t.labeloffset;
          break;
        case "r":
          t.x += t.width / 2 + t.labeloffset;
          break;
      }
  });
}
function wr(e) {
  e.edges().forEach((n) => {
    let t = e.edge(n);
    t.reversed && t.points.reverse();
  });
}
function Nr(e) {
  e.nodes().forEach((n) => {
    if (e.children(n).length) {
      let t = e.node(n), r = e.node(t.borderTop), o = e.node(t.borderBottom), i = e.node(t.borderLeft[t.borderLeft.length - 1]), s = e.node(t.borderRight[t.borderRight.length - 1]);
      t.width = Math.abs(s.x - i.x), t.height = Math.abs(o.y - r.y), t.x = i.x + t.width / 2, t.y = r.y + t.height / 2;
    }
  }), e.nodes().forEach((n) => {
    e.node(n).dummy === "border" && e.removeNode(n);
  });
}
function Gr(e) {
  e.edges().forEach((n) => {
    if (n.v === n.w) {
      let t = e.node(n.v);
      t.selfEdges || (t.selfEdges = []), t.selfEdges.push({ e: n, label: e.edge(n) }), e.removeEdge(n);
    }
  });
}
function vr(e) {
  P2(e).forEach((t) => {
    let r = 0;
    t.forEach((o, i) => {
      let s = e.node(o);
      typeof s.rank != "number" && (s.rank = 0), s.order = i + r, (s.selfEdges || []).forEach((a) => {
        M2(e, "selfedge", { width: a.label.width, height: a.label.height, rank: s.rank, order: i + ++r, e: a.e, edgeLabel: a.label }, "_se"), (!Array.isArray(a.label.points) || a.label.points.length !== 7) && (a.label.points = [{ x: 0, y: -10 }, { x: 0, y: -10 }, { x: 0, y: 0 }, { x: 0, y: 10 }, { x: 0, y: 10 }, { x: 0, y: 0 }, { x: 0, y: 0 }]);
      }), delete s.selfEdges;
    });
  });
}
function kr(e) {
  e.nodes().forEach((n) => {
    let t = e.node(n), r = (o) => typeof o == "number" && isFinite(o);
    if (t.dummy === "selfedge") {
      let o = t, i = e.node(o.e.v), s = r(i == null ? undefined : i.x) ? i.x : 0, a = r(i == null ? undefined : i.y) ? i.y : 0, l = r(i == null ? undefined : i.width) ? i.width : 0, u = r(i == null ? undefined : i.height) ? i.height : 0, d = r(t.x) ? t.x : s, c = r(t.y) ? t.y : a, f = l / 2, h = u / 2;
      o.edgeLabel.points = [{ x: d + f, y: c - h }, { x: d + f, y: c - h }, { x: d, y: c }, { x: d - f, y: c + h }, { x: d - f, y: c + h }, { x: d, y: c }, { x: d, y: c }], o.edgeLabel.x = d, o.edgeLabel.y = c, e.setEdge(o.e, o.edgeLabel), e.removeNode(n);
    } else
      t && Array.isArray(t.selfEdges) && t.selfEdges.forEach((o) => {
        if (!Array.isArray(o.label.points) || o.label.points.length !== 7) {
          let i = r(t.x) ? t.x : 0, s = r(t.y) ? t.y : 0, a = r(t.width) ? t.width : 0, l = r(t.height) ? t.height : 0, u = a / 2, d = l / 2;
          o.label.points = [{ x: i + u, y: s - d }, { x: i + u, y: s - d }, { x: i, y: s }, { x: i - u, y: s + d }, { x: i - u, y: s + d }, { x: i, y: s }, { x: i, y: s }];
        }
      });
  });
}
function xe2(e, n) {
  return X2(W2(e, n), Number);
}
function _e2(e) {
  let n = {};
  return e && Object.entries(e).forEach(([t, r]) => {
    typeof t == "string" && (t = t.toLowerCase()), n[t] = r;
  }), n;
}
/*! For license information please see dagre.esm.js.LEGAL.txt */

// node_modules/opentui-markdown-render/src/merman/class/labels.ts
function classLabelAnchor(path, lineCount, width, vertical) {
  let bestFrom = path[0];
  let bestTo = path[path.length - 1];
  let bestLength = -1;
  const preferredLength = (from, to) => {
    const horizontal = from.y === to.y;
    return horizontal === vertical ? Math.abs(from.x - to.x) + Math.abs(from.y - to.y) : -1;
  };
  for (let index = 1;index < path.length; index++) {
    const from = path[index - 1];
    const to = path[index];
    const length = preferredLength(from, to);
    if (length > bestLength) {
      bestLength = length;
      bestFrom = from;
      bestTo = to;
    }
  }
  if (bestLength < 0) {
    for (let index = 1;index < path.length; index++) {
      const from = path[index - 1];
      const to = path[index];
      const length = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
      if (length > bestLength) {
        bestLength = length;
        bestFrom = from;
        bestTo = to;
      }
    }
  }
  const midX = Math.floor((bestFrom.x + bestTo.x) / 2);
  const midY = Math.floor((bestFrom.y + bestTo.y) / 2);
  if (bestFrom.y === bestTo.y)
    return { x: midX - Math.floor(width / 2), y: bestFrom.y - lineCount };
  if (bestFrom.x === bestTo.x)
    return { x: bestFrom.x + 2, y: midY - Math.floor(lineCount / 2) };
  return { x: midX, y: midY };
}

// node_modules/opentui-markdown-render/src/merman/class/layout.ts
var CLASS_CONTENT_OFFSET_X = 2;
var CONTENT_PADDING = 2;
var NODE_H_GAP = 6;
var NODE_MIN_GAP = 3;
var MARGIN_TOP = 2;
var MARGIN_RIGHT = 4;
var MARGIN_BOTTOM = 2;
function displayClassName(id) {
  let open = true;
  return id.replace(/~/g, () => {
    const glyph = open ? "<" : ">";
    open = !open;
    return glyph;
  });
}
function classBoxSectionLines(definition) {
  return {
    titleLines: [
      ...definition.stereotype ? [`\xAB${definition.stereotype}\xBB`] : [],
      displayClassName(definition.label ?? definition.id)
    ],
    attributeLines: [
      ...definition.members.filter((member) => !member.method).map((member) => member.text),
      ...(definition.notes ?? []).map((note) => `\u24D8 ${note}`)
    ],
    methodLines: definition.members.filter((member) => member.method).map((member) => member.text)
  };
}
function measureClassBox(definition) {
  const { titleLines, attributeLines, methodLines } = classBoxSectionLines(definition);
  const contentWidth = Math.max(1, ...titleLines.map(diagramTextWidth), ...attributeLines.map(diagramTextWidth), ...methodLines.map(diagramTextWidth));
  let height = 2 + titleLines.length;
  if (attributeLines.length)
    height += 1 + attributeLines.length;
  if (methodLines.length)
    height += 1 + methodLines.length;
  return { titleLines, attributeLines, methodLines, contentWidth, width: contentWidth + CONTENT_PADDING * 2, height };
}
function layoutClassDiagram(diagram, direction) {
  const vertical = direction === "TB" || direction === "BT";
  const metrics = new Map(diagram.classes.map((definition) => [definition.id, measureClassBox(definition)]));
  const rank = computeRanks(diagram, direction);
  const byId = new Map(diagram.classes.map((definition) => [definition.id, definition]));
  const groups = new Map;
  for (const definition of diagram.classes) {
    const key = rank.get(definition.id) ?? 0;
    const list = groups.get(key) ?? [];
    list.push(definition);
    groups.set(key, list);
  }
  const rankKeys = [...groups.keys()].sort((left, right) => left - right);
  const records = diagram.relationships.map((relationship) => ({
    relationship,
    from: byId.get(relationship.from),
    to: byId.get(relationship.to),
    fromRank: rank.get(relationship.from) ?? 0,
    toRank: rank.get(relationship.to) ?? 0
  }));
  const spacing = computeSpacing(records, vertical);
  const boxes = [];
  const boxById = new Map;
  const bands = new Map;
  let mainExtent = 0;
  if (vertical) {
    const laneWidths = rankKeys.map((key) => laneWidth(groups.get(key), metrics));
    const totalWidth = Math.max(0, ...laneWidths);
    let y = 0;
    rankKeys.forEach((key, index) => {
      const nodes = groups.get(key);
      const bandHeight = Math.max(0, ...nodes.map((node) => metrics.get(node.id).height));
      let x = Math.floor((totalWidth - laneWidths[index]) / 2);
      for (const definition of nodes) {
        const size = metrics.get(definition.id);
        const box = makeClassBox(definition, x, y, size);
        boxes.push(box);
        boxById.set(definition.id, box);
        x += size.width + NODE_H_GAP;
      }
      bands.set(key, { start: y, end: y + bandHeight - 1 });
      y += bandHeight + spacing.gapFor(key);
    });
    mainExtent = Math.max(0, ...boxes.map((box) => box.bounds.left + box.bounds.width));
  } else {
    const laneHeights = rankKeys.map((key) => laneHeight(groups.get(key), metrics));
    const totalHeight = Math.max(0, ...laneHeights);
    let x = 0;
    rankKeys.forEach((key, index) => {
      const nodes = groups.get(key);
      const bandWidth = Math.max(0, ...nodes.map((node) => metrics.get(node.id).width));
      let y = Math.floor((totalHeight - laneHeights[index]) / 2);
      for (const definition of nodes) {
        const size = metrics.get(definition.id);
        const box = makeClassBox(definition, x, y, size);
        boxes.push(box);
        boxById.set(definition.id, box);
        y += size.height + NODE_MIN_GAP;
      }
      bands.set(key, { start: x, end: x + bandWidth - 1 });
      x += bandWidth + spacing.gapFor(key);
    });
    mainExtent = Math.max(0, ...boxes.map((box) => box.bounds.top + box.bounds.height));
  }
  const corridors = { low: 0, high: 0 };
  const takeCorridor = (side) => {
    const index = corridors[side]++;
    return side === "low" ? -3 - index : mainExtent + 3 + index;
  };
  const bandFor = (rank) => bands.get(rank);
  const edges = records.map((record, edgeIndex) => {
    const from = boxById.get(record.from.id);
    const to = boxById.get(record.to.id);
    const lane = (gap) => bands.get(gap).end + spacing.laneBase + spacing.laneFor(gap, edgeIndex) * spacing.stride;
    const tieBreak = edgeIndex % 2 === 0 ? "low" : "high";
    const path = vertical ? verticalRoute(record, from.bounds, to.bounds, lane, bandFor, mainExtent, tieBreak, takeCorridor) : horizontalRoute(record, from.bounds, to.bounds, lane, bandFor, mainExtent, tieBreak, takeCorridor);
    return {
      relationship: record.relationship,
      fromId: record.from.id,
      toId: record.to.id,
      from: from.bounds,
      to: to.bounds,
      path: dedupePath(path)
    };
  });
  return finalizeClassDiagramLayout(boxes, edges, direction);
}
function makeClassBox(definition, x, y, size) {
  return {
    definition,
    bounds: diagramBoundsFromRect(x, y, size.width, size.height),
    titleLines: size.titleLines,
    attributeLines: size.attributeLines,
    methodLines: size.methodLines,
    contentWidth: size.contentWidth
  };
}
function laneWidth(nodes, metrics) {
  if (nodes.length === 0)
    return 0;
  return nodes.reduce((sum, node) => sum + metrics.get(node.id).width, 0) + (nodes.length - 1) * NODE_H_GAP;
}
function laneHeight(nodes, metrics) {
  if (nodes.length === 0)
    return 0;
  return nodes.reduce((sum, node) => sum + metrics.get(node.id).height, 0) + (nodes.length - 1) * NODE_MIN_GAP;
}
function gapIndices(record) {
  const upper = Math.min(record.fromRank, record.toRank);
  const lower = Math.max(record.fromRank, record.toRank);
  return lower - upper <= 1 ? [upper] : [];
}
function computeSpacing(records, vertical) {
  const groupsByGap = new Map;
  const laneByEdge = new Map;
  const labelWidthByGap = new Map;
  for (const [edgeIndex, record] of records.entries()) {
    const label = record.relationship.label ?? "";
    for (const gap of new Set(gapIndices(record))) {
      const groups = groupsByGap.get(gap) ?? new Map;
      const groupKey = `${record.from.id}\x00${label}`;
      let slot = groups.get(groupKey);
      if (slot === undefined) {
        slot = groups.size;
        groups.set(groupKey, slot);
      }
      groupsByGap.set(gap, groups);
      laneByEdge.set(`${edgeIndex}:${gap}`, slot);
      if (label) {
        const labelWidth = Math.max(...splitDiagramLines(label).map(diagramTextWidth));
        labelWidthByGap.set(gap, Math.max(labelWidthByGap.get(gap) ?? 0, labelWidth));
      }
    }
  }
  const stride = vertical ? 2 : Math.max(2, Math.max(0, ...labelWidthByGap.values()) + 2);
  const laneBase = vertical ? 2 : 1;
  const gapSizes = new Map;
  for (const [gap, groups] of groupsByGap) {
    const gapSize = vertical ? Math.max(NODE_MIN_GAP, laneBase + groups.size * stride) : Math.max(NODE_MIN_GAP, Math.max(0, groups.size - 1) * stride + (labelWidthByGap.get(gap) ?? 0) + 3);
    gapSizes.set(gap, gapSize);
  }
  return {
    stride,
    laneBase,
    gapFor: (gap) => gapSizes.get(gap) ?? NODE_MIN_GAP,
    laneFor: (gap, edgeIndex) => laneByEdge.get(`${edgeIndex}:${gap}`) ?? 0
  };
}
function chooseCorridorSide(from, to, extent, tieBreak) {
  const low = -3;
  const high = extent + 3;
  const lowCost = Math.abs(from - low) + Math.abs(to - low);
  const highCost = Math.abs(from - high) + Math.abs(to - high);
  if (lowCost === highCost)
    return tieBreak;
  return lowCost < highCost ? "low" : "high";
}
function sideInset(size) {
  return Math.max(1, Math.min(2, Math.floor((size - 2) / 2)));
}
function sidePortX(bounds, side) {
  const inset = sideInset(bounds.width);
  return side === "low" ? bounds.left + inset : bounds.left + bounds.width - 1 - inset;
}
function sidePortY(bounds, side) {
  const inset = sideInset(bounds.height);
  return side === "low" ? bounds.top + inset : bounds.top + bounds.height - 1 - inset;
}
function verticalRoute(record, from, to, laneFor, bandFor, mainExtent, tieBreak, takeCorridor) {
  const { fromRank, toRank } = record;
  if (fromRank === toRank) {
    const lane = laneFor(fromRank);
    return [
      point2(from.centerX, from.top + from.height),
      point2(from.centerX, lane),
      point2(to.centerX, lane),
      point2(to.centerX, to.top + to.height)
    ];
  }
  const upper = Math.min(fromRank, toRank);
  const lower = Math.max(fromRank, toRank);
  if (lower - upper === 1) {
    const lane = laneFor(upper);
    return fromRank < toRank ? [
      point2(from.centerX, from.top + from.height),
      point2(from.centerX, lane),
      point2(to.centerX, lane),
      point2(to.centerX, to.top - 1)
    ] : [
      point2(from.centerX, from.top - 1),
      point2(from.centerX, lane),
      point2(to.centerX, lane),
      point2(to.centerX, to.top + to.height)
    ];
  }
  const side = chooseCorridorSide(from.centerX, to.centerX, mainExtent, tieBreak);
  const corridorX = takeCorridor(side);
  const sourceX = sidePortX(from, side);
  const targetX = sidePortX(to, side);
  if (fromRank < toRank) {
    const sourceLane = bandFor(fromRank + 1).start - 1;
    const targetLane = to.top - 2;
    return [
      point2(sourceX, from.top + from.height),
      point2(sourceX, sourceLane),
      point2(corridorX, sourceLane),
      point2(corridorX, targetLane),
      point2(targetX, targetLane),
      point2(targetX, to.top - 1)
    ];
  }
  const sourceLane = bandFor(fromRank).start - 1;
  const targetLane = bandFor(toRank + 1).start - 1;
  return [
    point2(sourceX, from.top - 1),
    point2(sourceX, sourceLane),
    point2(corridorX, sourceLane),
    point2(corridorX, targetLane),
    point2(targetX, targetLane),
    point2(targetX, to.top + to.height)
  ];
}
function horizontalRoute(record, from, to, laneFor, bandFor, mainExtent, tieBreak, takeCorridor) {
  const { fromRank, toRank } = record;
  if (fromRank === toRank) {
    const lane = laneFor(fromRank);
    return [
      point2(from.left + from.width, from.centerY),
      point2(lane, from.centerY),
      point2(lane, to.centerY),
      point2(to.left + to.width, to.centerY)
    ];
  }
  const upper = Math.min(fromRank, toRank);
  const lower = Math.max(fromRank, toRank);
  if (lower - upper === 1) {
    const lane = laneFor(upper);
    return fromRank < toRank ? [
      point2(from.left + from.width, from.centerY),
      point2(lane, from.centerY),
      point2(lane, to.centerY),
      point2(to.left - 1, to.centerY)
    ] : [
      point2(from.left - 1, from.centerY),
      point2(lane, from.centerY),
      point2(lane, to.centerY),
      point2(to.left + to.width, to.centerY)
    ];
  }
  const side = chooseCorridorSide(from.centerY, to.centerY, mainExtent, tieBreak);
  const corridorY = takeCorridor(side);
  const sourceY = sidePortY(from, side);
  const targetY = sidePortY(to, side);
  if (fromRank < toRank) {
    const sourceLane = bandFor(fromRank + 1).start - 1;
    const targetLane = to.left - 2;
    return [
      point2(from.left + from.width, sourceY),
      point2(sourceLane, sourceY),
      point2(sourceLane, corridorY),
      point2(targetLane, corridorY),
      point2(targetLane, targetY),
      point2(to.left - 1, targetY)
    ];
  }
  const sourceLane = bandFor(fromRank).start - 1;
  const targetLane = bandFor(toRank + 1).start - 1;
  return [
    point2(from.left - 1, sourceY),
    point2(sourceLane, sourceY),
    point2(sourceLane, corridorY),
    point2(targetLane, corridorY),
    point2(targetLane, targetY),
    point2(to.left + to.width, targetY)
  ];
}
function point2(x, y) {
  return { x, y };
}
function dedupePath(points) {
  const result = [];
  for (const point of points) {
    const last = result[result.length - 1];
    if (!last || last.x !== point.x || last.y !== point.y)
      result.push(point);
  }
  return result;
}
function computeRanks(diagram, direction) {
  const ids = diagram.classes.map((definition) => definition.id);
  const adjacency = new Map(ids.map((id) => [id, []]));
  const edges = [];
  for (const relationship of diagram.relationships) {
    const key = `${relationship.from}\x00${relationship.to}\x00${edges.length}`;
    edges.push({ from: relationship.from, to: relationship.to, key });
    adjacency.get(relationship.from)?.push({ to: relationship.to, key });
  }
  const state = new Map;
  const back = new Set;
  const visit = (id) => {
    state.set(id, 1);
    for (const { to, key } of adjacency.get(id) ?? []) {
      const seen = state.get(to) ?? 0;
      if (seen === 1)
        back.add(key);
      else if (seen === 0)
        visit(to);
    }
    state.set(id, 2);
  };
  for (const id of ids)
    if ((state.get(id) ?? 0) === 0)
      visit(id);
  const rank = new Map(ids.map((id) => [id, 0]));
  let changed = true;
  let guard = ids.length + 1;
  while (changed && guard-- > 0) {
    changed = false;
    for (const edge of edges) {
      if (back.has(edge.key))
        continue;
      const next = (rank.get(edge.from) ?? 0) + 1;
      if (next > (rank.get(edge.to) ?? 0)) {
        rank.set(edge.to, next);
        changed = true;
      }
    }
  }
  if (direction === "BT" || direction === "RL") {
    const maxRank = Math.max(0, ...rank.values());
    for (const [id, value] of rank)
      rank.set(id, maxRank - value);
  }
  return rank;
}
function finalizeClassDiagramLayout(boxes, edges, direction) {
  const points = [
    ...boxes.flatMap((box) => [
      { x: box.bounds.left, y: box.bounds.top },
      { x: box.bounds.left + box.bounds.width, y: box.bounds.top + box.bounds.height }
    ]),
    ...edges.flatMap((edge) => edge.path)
  ];
  const minX = Math.min(0, ...points.map((p) => p.x));
  const minY = Math.min(0, ...points.map((p) => p.y));
  const dx = -minX;
  const dy = -minY + MARGIN_TOP;
  if (dx !== 0 || dy !== 0) {
    for (const box of boxes)
      translateDiagramBounds(box.bounds, dx, dy);
    for (const edge of edges) {
      for (const p of edge.path) {
        p.x += dx;
        p.y += dy;
      }
    }
  }
  const maxX = Math.max(0, ...boxes.map((box) => box.bounds.left + box.bounds.width), ...edges.flatMap((edge) => edge.path.map((p) => p.x + 1)));
  const maxY = Math.max(0, ...boxes.map((box) => box.bounds.top + box.bounds.height), ...edges.flatMap((edge) => edge.path.map((p) => p.y + 1)));
  return { direction, boxes, edges, width: maxX + MARGIN_RIGHT, height: maxY + MARGIN_BOTTOM };
}

// node_modules/opentui-markdown-render/src/merman/class/dagre-layout.ts
function attachment(box, center, size, point) {
  const sides = [
    ["top", Math.abs(point.y - (center.y - size.height / 2))],
    ["bottom", Math.abs(point.y - (center.y + size.height / 2))],
    ["left", Math.abs(point.x - (center.x - size.width / 2))],
    ["right", Math.abs(point.x - (center.x + size.width / 2))]
  ];
  const side = sides.reduce((best, entry) => entry[1] < best[1] ? entry : best)[0];
  const x = Math.max(box.left + 1, Math.min(box.left + box.width - 2, Math.round(point.x)));
  const y = Math.max(box.top + 1, Math.min(box.top + box.height - 2, Math.round(point.y)));
  if (side === "top")
    return { x, y: box.top - 1 };
  if (side === "bottom")
    return { x, y: box.top + box.height };
  if (side === "left")
    return { x: box.left - 1, y };
  return { x: box.left + box.width, y };
}
function intersectsBox(from, to, box) {
  const right = box.left + box.width - 1;
  const bottom = box.top + box.height - 1;
  if (from.y === to.y)
    return from.y >= box.top && from.y <= bottom && Math.max(from.x, to.x) >= box.left && Math.min(from.x, to.x) <= right;
  return from.x >= box.left && from.x <= right && Math.max(from.y, to.y) >= box.top && Math.min(from.y, to.y) <= bottom;
}
function orthogonalize(points, boxes, vertical) {
  const result = [points[0]];
  for (const to of points.slice(1)) {
    const from = result[result.length - 1];
    if (from.x !== to.x && from.y !== to.y) {
      const candidates = vertical ? [{ x: from.x, y: to.y }, { x: to.x, y: from.y }] : [{ x: to.x, y: from.y }, { x: from.x, y: to.y }];
      const cost = (bend) => boxes.reduce((total, box) => total + Number(intersectsBox(from, bend, box.bounds)) + Number(intersectsBox(bend, to, box.bounds)), 0);
      const bend = cost(candidates[1]) < cost(candidates[0]) ? candidates[1] : candidates[0];
      if (from.x !== bend.x || from.y !== bend.y)
        result.push(bend);
    }
    if (result.at(-1).x !== to.x || result.at(-1).y !== to.y)
      result.push(to);
  }
  return result;
}
function selfLoop(box, vertical, offset, labelWidth) {
  const left = box.left;
  const right = box.left + box.width - 1;
  const top = box.top;
  const bottom = box.top + box.height - 1;
  if (vertical) {
    const portX = right - 1;
    const outsideX = right + Math.max(3, labelWidth + 3) + offset * 2;
    return [
      { x: portX, y: bottom + 1 },
      { x: portX, y: bottom + 3 + offset },
      { x: outsideX, y: bottom + 3 + offset },
      { x: outsideX, y: top - 3 - offset },
      { x: portX, y: top - 3 - offset },
      { x: portX, y: top - 1 }
    ];
  }
  const portY = bottom - 1;
  const outsideY = bottom + 3 + offset * 2;
  return [
    { x: right + 1, y: portY },
    { x: right + 3 + offset, y: portY },
    { x: right + 3 + offset, y: outsideY },
    { x: left - 3 - offset, y: outsideY },
    { x: left - 3 - offset, y: portY },
    { x: left - 1, y: portY }
  ];
}
function layoutDagreClassDiagram(diagram, direction) {
  if (diagram.classes.length === 0)
    return { direction, boxes: [], edges: [], width: 0, height: 0 };
  const graph = new T2({ multigraph: true });
  graph.setGraph({ rankdir: direction, nodesep: 8, ranksep: 10, edgesep: 4 });
  graph.setDefaultEdgeLabel(() => ({}));
  const metrics = new Map(diagram.classes.map((definition) => [definition.id, measureClassBox(definition)]));
  for (const definition of diagram.classes) {
    const size = metrics.get(definition.id);
    graph.setNode(definition.id, { width: size.width, height: size.height });
  }
  diagram.relationships.forEach((edge, index) => {
    const width = edge.label ? Math.max(...splitDiagramLines(edge.label).map(diagramTextWidth)) + 2 : 0;
    const height = edge.label ? splitDiagramLines(edge.label).length + 1 : 0;
    graph.setEdge(edge.from, edge.to, { width, height, weight: edge.kind === "inheritance" ? 2 : 1 }, String(index));
  });
  Oe2(graph);
  const boxes = diagram.classes.map((definition) => {
    const node = graph.node(definition.id);
    const size = metrics.get(definition.id);
    return makeClassBox(definition, Math.round(node.x - size.width / 2), Math.round(node.y - size.height / 2), size);
  });
  const boxById = new Map(boxes.map((box) => [box.definition.id, box]));
  const vertical = direction === "TB" || direction === "BT";
  const loopCounts = new Map;
  const edges = diagram.relationships.map((relationship, index) => {
    const from = boxById.get(relationship.from).bounds;
    const to = boxById.get(relationship.to).bounds;
    if (relationship.from === relationship.to) {
      const offset = loopCounts.get(relationship.from) ?? 0;
      loopCounts.set(relationship.from, offset + 1);
      return {
        relationship,
        fromId: relationship.from,
        toId: relationship.to,
        from,
        to,
        path: selfLoop(from, vertical, offset, relationship.label ? Math.max(...splitDiagramLines(relationship.label).map(diagramTextWidth)) : 0)
      };
    }
    const waypoints = graph.edge({ v: relationship.from, w: relationship.to, name: String(index) })?.points ?? [];
    const source = graph.node(relationship.from);
    const target = graph.node(relationship.to);
    const first = waypoints[0] ?? { x: source.x, y: source.y };
    const last = waypoints.at(-1) ?? { x: target.x, y: target.y };
    const start = attachment(from, { x: source.x, y: source.y }, metrics.get(relationship.from), first);
    const end = attachment(to, { x: target.x, y: target.y }, metrics.get(relationship.to), last);
    const direct = (start.x === end.x || start.y === end.y) && boxes.every((box) => !intersectsBox(start, end, box.bounds));
    const path = direct ? [start, end] : orthogonalize([
      start,
      ...waypoints.slice(1, -1).map((point) => ({ x: Math.round(point.x), y: Math.round(point.y) })),
      end
    ], boxes, vertical);
    return { relationship, fromId: relationship.from, toId: relationship.to, from, to, path };
  });
  const result = finalizeClassDiagramLayout(boxes, edges, direction);
  let minX = 0;
  let minY = 0;
  let maxX = result.width;
  let maxY = result.height;
  for (const edge of result.edges) {
    if (!edge.relationship.label)
      continue;
    const lines = splitDiagramLines(edge.relationship.label);
    const width = Math.max(...lines.map(diagramTextWidth));
    const anchor = classLabelAnchor(edge.path, lines.length, width, vertical);
    minX = Math.min(minX, anchor.x - 1);
    minY = Math.min(minY, anchor.y);
    maxX = Math.max(maxX, anchor.x + width + 2);
    maxY = Math.max(maxY, anchor.y + lines.length + 1);
  }
  const dx = -minX;
  const dy = -minY;
  if (dx || dy) {
    for (const box of result.boxes)
      translateDiagramBounds(box.bounds, dx, dy);
    for (const edge of result.edges)
      for (const point of edge.path) {
        point.x += dx;
        point.y += dy;
      }
  }
  result.width = maxX + dx;
  result.height = maxY + dy;
  return result;
}

// node_modules/opentui-markdown-render/src/merman/class/drawing.ts
var HOLLOW_TRIANGLE = { up: "\u25B3", down: "\u25BD", left: "\u25C1", right: "\u25B7" };
var OPEN_ARROW = { up: "\u2191", down: "\u2193", left: "\u2190", right: "\u2192" };
var FILLED_DIAMOND = "\u25C6";
var HOLLOW_DIAMOND = "\u25C7";
function drawClassDiagramGrid(diagram, options = {}) {
  return drawClassDiagramLayout(createClassDiagramLayout(diagram, options));
}
function createClassDiagramLayout(diagram, options = {}) {
  const place = options.classLayout === "dagre" ? layoutDagreClassDiagram : layoutClassDiagram;
  const requested = diagram.direction;
  const maxWidth = options.layoutMaxWidth !== undefined && Number.isFinite(options.layoutMaxWidth) ? Math.max(1, Math.trunc(options.layoutMaxWidth)) : undefined;
  if (maxWidth === undefined || requested !== "LR" && requested !== "RL") {
    return place(diagram, requested);
  }
  const wide = place(diagram, requested);
  if (wide.width <= maxWidth)
    return wide;
  const fallbackDirection = requested === "RL" ? "BT" : "TB";
  const fallback = place(diagram, fallbackDirection);
  return fallback.width < wide.width ? fallback : wide;
}
function drawClassDiagramLayout(layout) {
  if (layout.boxes.length === 0)
    return new DiagramCanvas(0, 0);
  const grid = makeGrid(Math.max(1, layout.width), Math.max(1, layout.height));
  const vertical = layout.direction === "TB" || layout.direction === "BT";
  for (const box of layout.boxes)
    drawBox(grid, box);
  for (const edge of layout.edges)
    drawEdgeLine(grid, edge);
  for (const edge of layout.edges)
    drawEdgeEndpoints(grid, edge);
  bridgeIndependentCrossings(grid, layout.edges);
  for (const edge of layout.edges)
    drawEdgeLabels(grid, edge, vertical);
  return grid;
}
function makeGrid(width, height) {
  return new DiagramCanvas(width, height, {
    mergeCell: (existing, incoming) => ({
      ...incoming,
      char: existing.style === "edge" && incoming.style === "edge" ? mergeDiagramLineGlyph(existing.char, incoming.char) ?? incoming.char : incoming.char
    })
  });
}
function setCell(grid, x, y, char, style) {
  grid.setCell(x, y, char, style);
}
function drawBox(grid, box) {
  const bounds = box.bounds;
  drawDiagramFrame(bounds, BorderChars2.single, (x, y, char) => setCell(grid, x, y, char, "border"));
  let y = bounds.top + 1;
  box.titleLines.forEach((line, index) => {
    const x = bounds.left + CLASS_CONTENT_OFFSET_X + Math.floor((box.contentWidth - diagramTextWidth(line)) / 2);
    setText(grid, x, y + index, line, box.definition.stereotype && index === 0 ? "stereotype" : "title");
  });
  y += box.titleLines.length;
  if (box.attributeLines.length) {
    drawSeparator(grid, bounds, y);
    y += 1;
    box.attributeLines.forEach((line, index) => setText(grid, bounds.left + CLASS_CONTENT_OFFSET_X, y + index, line, "member"));
    y += box.attributeLines.length;
  }
  if (box.methodLines.length) {
    drawSeparator(grid, bounds, y);
    y += 1;
    box.methodLines.forEach((line, index) => setText(grid, bounds.left + CLASS_CONTENT_OFFSET_X, y + index, line, "member"));
  }
}
function drawSeparator(grid, bounds, y) {
  const left = bounds.left;
  const right = bounds.left + bounds.width - 1;
  setCell(grid, left, y, "\u251C", "border");
  for (let x = left + 1;x < right; x++)
    setCell(grid, x, y, "\u2500", "border");
  setCell(grid, right, y, "\u2524", "border");
}
function drawEdgeLine(grid, edge) {
  const { relationship, path } = edge;
  if (path.length < 2)
    return;
  drawOrthogonalPath(path, (x, y, char) => setCell(grid, x, y, char, "edge"), {
    cornerStyle: "square",
    lineStyle: relationship.dashed ? "dashed" : "single"
  });
}
function rememberOwner(owners, owner) {
  if (owners.length < 2 && !owners.includes(owner))
    owners.push(owner);
}
function independent(first, second) {
  return first.length > 0 && second.length > 0 && (first.length > 1 || second.length > 1 || first[0] !== second[0]);
}
function bridgeIndependentCrossings(grid, edges) {
  const cells = new Map;
  const seenPaths = new Set;
  edges.forEach((edge, edgeIndex) => {
    const pathKey = edge.path.map(({ x, y }) => `${x}:${y}`).join(";");
    if (seenPaths.has(pathKey))
      return;
    seenPaths.add(pathKey);
    for (let index = 1;index < edge.path.length; index++) {
      const from = edge.path[index - 1];
      const to = edge.path[index];
      const horizontal = from.y === to.y;
      if (!horizontal && from.x !== to.x)
        continue;
      const start = horizontal ? from.x : from.y;
      const end = horizontal ? to.x : to.y;
      for (let position = Math.min(start, end);position <= Math.max(start, end); position++) {
        const x = horizontal ? position : from.x;
        const y = horizontal ? from.y : position;
        const cellKey = y * grid.width + x;
        const cell = cells.get(cellKey) ?? {
          horizontal: { through: [], ends: [] },
          vertical: { through: [], ends: [] }
        };
        const axis = horizontal ? cell.horizontal : cell.vertical;
        if (position !== start && position !== end)
          rememberOwner(axis.through, edgeIndex);
        else if (position === start && index === 1 || position === end && index === edge.path.length - 1) {
          rememberOwner(axis.ends, edgeIndex);
        }
        cells.set(cellKey, cell);
      }
    }
  });
  for (const [cellKey, cell] of cells) {
    const x = cellKey % grid.width;
    const y = Math.floor(cellKey / grid.width);
    if (grid.getCell(x, y)?.char !== "\u253C")
      continue;
    if (independent(cell.horizontal.through, cell.vertical.through) || independent(cell.horizontal.ends, cell.vertical.through)) {
      grid.replaceCell(x, y, "\u2500", "edge");
    } else if (independent(cell.horizontal.through, cell.vertical.ends)) {
      grid.replaceCell(x, y, "\u2502", "edge");
    }
  }
}
function drawEdgeEndpoints(grid, edge) {
  const { relationship, path } = edge;
  if (path.length < 2)
    return;
  drawStartCell(grid, path, relationship.headAt === "from" ? relationship.kind : undefined);
  drawEndCell(grid, path, relationship.headAt === "to" ? relationship.kind : undefined);
}
function drawStartCell(grid, path, markerKind) {
  const start = path[0];
  const next = path[1];
  const direction = directionBetween(start, next) ?? "right";
  const marker = markerKind ? relationshipMarker(markerKind, opposite(direction)) : undefined;
  if (marker)
    setCell(grid, start.x, start.y, marker, "edge");
  else
    setCell(grid, start.x, start.y, diagramLineGlyph(new Set([direction])), "edge");
}
function drawEndCell(grid, path, markerKind) {
  const end = path[path.length - 1];
  const previous = path[path.length - 2];
  const direction = directionBetween(previous, end) ?? "right";
  const marker = markerKind ? relationshipMarker(markerKind, direction) : undefined;
  if (marker)
    setCell(grid, end.x, end.y, marker, "edge");
  else
    setCell(grid, end.x, end.y, diagramLineGlyph(new Set([direction])), "edge");
}
function relationshipMarker(kind, direction) {
  switch (kind) {
    case "inheritance":
    case "realization":
      return HOLLOW_TRIANGLE[direction];
    case "composition":
      return FILLED_DIAMOND;
    case "aggregation":
      return HOLLOW_DIAMOND;
    case "association":
    case "dependency":
      return OPEN_ARROW[direction];
    case "link":
      return;
  }
}
function opposite(direction) {
  switch (direction) {
    case "up":
      return "down";
    case "down":
      return "up";
    case "left":
      return "right";
    case "right":
      return "left";
  }
}
function drawEdgeLabels(grid, edge, vertical) {
  const { relationship, path } = edge;
  let labelWidth = 0;
  let labelHeight = 0;
  let labelX = 0;
  let labelY = 0;
  if (relationship.label) {
    const lines = splitDiagramLines(relationship.label);
    labelWidth = Math.max(...lines.map(diagramTextWidth));
    labelHeight = lines.length;
    const anchor = classLabelAnchor(path, lines.length, labelWidth, vertical);
    labelX = anchor.x;
    labelY = anchor.y;
    drawTextTag(grid, anchor.x, anchor.y, lines);
  }
  if (relationship.fromCardinality) {
    const width = diagramTextWidth(relationship.fromCardinality);
    const anchor = cardinalityAnchor(path, width, true, labelX, labelY, labelWidth, labelHeight);
    drawTextTag(grid, anchor.x, anchor.y, [relationship.fromCardinality]);
  }
  if (relationship.toCardinality) {
    const width = diagramTextWidth(relationship.toCardinality);
    const anchor = cardinalityAnchor(path, width, false, labelX, labelY, labelWidth, labelHeight);
    drawTextTag(grid, anchor.x, anchor.y, [relationship.toCardinality]);
  }
}
function cardinalityAnchor(path, width, atStart, labelX, labelY, labelWidth, labelHeight) {
  const point = atStart ? path[0] : path[path.length - 1];
  const neighbor = atStart ? path[1] : path[path.length - 2];
  const direction = directionBetween(point, neighbor) ?? "right";
  const horizontal = direction === "left" || direction === "right";
  const baseX = point.x + (horizontal ? direction === "right" ? 1 : -1 : 0);
  const baseY = point.y + (horizontal ? 0 : direction === "down" ? 1 : -1);
  const candidates = horizontal ? [
    { x: baseX, y: baseY - 1 },
    { x: baseX, y: baseY + 1 },
    { x: baseX, y: baseY - 2 },
    { x: baseX, y: baseY + 2 }
  ] : [
    { x: baseX + 1, y: baseY },
    { x: baseX - 1, y: baseY },
    { x: baseX + 1, y: baseY - 1 },
    { x: baseX + 1, y: baseY + 1 },
    { x: baseX - 1, y: baseY - 1 },
    { x: baseX - 1, y: baseY + 1 }
  ];
  for (const candidate of candidates) {
    if (!touchesLabel(candidate.x, width, candidate.y, 1, labelX, labelY, labelWidth, labelHeight))
      return candidate;
  }
  return candidates[0];
}
function touchesLabel(x, width, y, height, labelX, labelY, labelWidth, labelHeight) {
  if (labelWidth <= 0 || labelHeight <= 0)
    return false;
  const rowOverlap = y <= labelY + labelHeight - 1 && y + height - 1 >= labelY;
  if (!rowOverlap)
    return false;
  const clearX = x + width < labelX || x > labelX + labelWidth;
  return !clearX;
}
function drawTextTag(grid, x, y, lines) {
  lines.forEach((line, index) => {
    const row = y + index;
    if (grid.getCell(x - 1, row)?.char === " ")
      setCell(grid, x - 1, row, " ", "label");
    setText(grid, x, row, line, "label");
    const rightX = x + diagramTextWidth(line);
    if (grid.getCell(rightX, row)?.char === " ")
      setCell(grid, rightX, row, " ", "label");
  });
}
function setText(grid, x, y, text, style) {
  grid.setText(x, y, text, style);
}

// node_modules/entities/dist/esm/decode-codepoint.js
var _a;
var decodeMap = new Map([
  [0, 65533],
  [128, 8364],
  [130, 8218],
  [131, 402],
  [132, 8222],
  [133, 8230],
  [134, 8224],
  [135, 8225],
  [136, 710],
  [137, 8240],
  [138, 352],
  [139, 8249],
  [140, 338],
  [142, 381],
  [145, 8216],
  [146, 8217],
  [147, 8220],
  [148, 8221],
  [149, 8226],
  [150, 8211],
  [151, 8212],
  [152, 732],
  [153, 8482],
  [154, 353],
  [155, 8250],
  [156, 339],
  [158, 382],
  [159, 376]
]);
var fromCodePoint = (_a = String.fromCodePoint) !== null && _a !== undefined ? _a : (codePoint) => {
  let output = "";
  if (codePoint > 65535) {
    codePoint -= 65536;
    output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
    codePoint = 56320 | codePoint & 1023;
  }
  output += String.fromCharCode(codePoint);
  return output;
};
function replaceCodePoint(codePoint) {
  var _a;
  if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
    return 65533;
  }
  return (_a = decodeMap.get(codePoint)) !== null && _a !== undefined ? _a : codePoint;
}

// node_modules/entities/dist/esm/internal/decode-shared.js
function decodeBase64(input) {
  const binary = typeof atob === "function" ? atob(input) : typeof Buffer.from === "function" ? Buffer.from(input, "base64").toString("binary") : new Buffer(input, "base64").toString("binary");
  const evenLength = binary.length & ~1;
  const out = new Uint16Array(evenLength / 2);
  for (let index = 0, outIndex = 0;index < evenLength; index += 2) {
    const lo = binary.charCodeAt(index);
    const hi = binary.charCodeAt(index + 1);
    out[outIndex++] = lo | hi << 8;
  }
  return out;
}

// node_modules/entities/dist/esm/generated/decode-data-html.js
var htmlDecodeTree = /* @__PURE__ */ decodeBase64("QR08ALkAAgH6AYsDNQR2BO0EPgXZBQEGLAbdBxMISQrvCmQLfQurDKQNLw4fD4YPpA+6D/IPAAAAAAAAAAAAAAAAKhBMEY8TmxUWF2EYLBkxGuAa3RsJHDscWR8YIC8jSCSIJcMl6ie3Ku8rEC0CLjoupS7kLgAIRU1hYmNmZ2xtbm9wcnN0dVQAWgBeAGUAaQBzAHcAfgCBAIQAhwCSAJoAoACsALMAbABpAGcAO4DGAMZAUAA7gCYAJkBjAHUAdABlADuAwQDBQHIiZXZlAAJhAAFpeW0AcgByAGMAO4DCAMJAEGRyAADgNdgE3XIAYQB2AGUAO4DAAMBA8CFoYZFj4SFjcgBhZAAAoFMqAAFncIsAjgBvAG4ABGFmAADgNdg43fAlbHlGdW5jdGlvbgCgYSBpAG4AZwA7gMUAxUAAAWNzpACoAHIAAOA12Jzc6SFnbgCgVCJpAGwAZABlADuAwwDDQG0AbAA7gMQAxEAABGFjZWZvcnN1xQDYANoA7QDxAPYA+QD8AAABY3LJAM8AayNzbGFzaAAAoBYidgHTANUAAKDnKmUAZAAAoAYjeQARZIABY3J0AOAA5QDrAGEidXNlAACgNSLuI291bGxpcwCgLCFhAJJjcgAA4DXYBd1wAGYAAOA12Dnd5SF2ZdhiYwDyAOoAbSJwZXEAAKBOIgAHSE9hY2RlZmhpbG9yc3UXARoBHwE6AVIBVQFiAWQBZgGCAakB6QHtAfIBYwB5ACdkUABZADuAqQCpQIABY3B5ACUBKAE1AfUhdGUGYWmg0iJ0KGFsRGlmZmVyZW50aWFsRAAAoEUhbCJleXMAAKAtIQACYWVpb0EBRAFKAU0B8iFvbgxhZABpAGwAO4DHAMdAcgBjAAhhbiJpbnQAAKAwIm8AdAAKYQABZG5ZAV0BaSJsbGEAuGB0I2VyRG90ALdg8gA5AWkAp2NyImNsZQAAAkRNUFRwAXQBeQF9AW8AdAAAoJkiaSJudXMAAKCWIuwhdXMAoJUiaSJtZXMAAKCXIm8AAAFjc4cBlAFrKndpc2VDb250b3VySW50ZWdyYWwAAKAyImUjQ3VybHkAAAFEUZwBpAFvJXVibGVRdW90ZQAAoB0gdSJvdGUAAKAZIAACbG5wdbABtgHNAdgBbwBuAGWgNyIAoHQqgAFnaXQAvAHBAcUB8iJ1ZW50AKBhIm4AdAAAoC8i7yV1ckludGVncmFsAKAuIgABZnLRAdMBAKACIe8iZHVjdACgECJuLnRlckNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbAAAoDMi7yFzcwCgLypjAHIAAOA12J7ccABDoNMiYQBwAACgTSKABURKU1phY2VmaW9zAAsCEgIVAhgCGwIsAjQCOQI9AnMCfwNvoEUh9CJyYWhkAKARKWMAeQACZGMAeQAFZGMAeQAPZIABZ3JzACECJQIoAuchZXIAoCEgcgAAoKEhaAB2AACg5CoAAWF5MAIzAvIhb24OYRRkbAB0oAciYQCUY3IAAOA12AfdAAFhZkECawIAAWNtRQJnAvIjaXRpY2FsAAJBREdUUAJUAl8CYwJjInV0ZQC0YG8AdAFZAloC2WJiJGxlQWN1dGUA3WJyImF2ZQBgYGkibGRlANxi7yFuZACgxCJmJWVyZW50aWFsRAAAoEYhcAR9AgAAAAAAAIECjgIAABoDZgAA4DXYO91EoagAhQKJAm8AdAAAoNwgcSJ1YWwAAKBQIuIhbGUAA0NETFJVVpkCqAK1Au8C/wIRA28AbgB0AG8AdQByAEkAbgB0AGUAZwByAGEA7ADEAW8AdAKvAgAAAACwAqhgbiNBcnJvdwAAoNMhAAFlb7kC0AJmAHQAgAFBUlQAwQLGAs0CciJyb3cAAKDQIekkZ2h0QXJyb3cAoNQhZQDlACsCbgBnAAABTFLWAugC5SFmdAABQVLcAuECciJyb3cAAKD4J+kkZ2h0QXJyb3cAoPon6SRnaHRBcnJvdwCg+SdpImdodAAAAUFU9gL7AnIicm93AACg0iFlAGUAAKCoInAAQQIGAwAAAAALA3Iicm93AACg0SFvJHduQXJyb3cAAKDVIWUlcnRpY2FsQmFyAACgJSJuAAADQUJMUlRhJAM2AzoDWgNxA3oDciJyb3cAAKGTIUJVLAMwA2EAcgAAoBMpcCNBcnJvdwAAoPUhciJldmUAEWPlIWZ00gJDAwAASwMAAFIDaSVnaHRWZWN0b3IAAKBQKWUkZVZlY3RvcgAAoF4p5SJjdG9yQqC9IWEAcgAAoFYpaSJnaHQA1AFiAwAAaQNlJGVWZWN0b3IAAKBfKeUiY3RvckKgwSFhAHIAAKBXKWUAZQBBoKQiciJyb3cAAKCnIXIAcgBvAPcAtAIAAWN0gwOHA3IAAOA12J/c8iFvaxBhAAhOVGFjZGZnbG1vcHFzdHV4owOlA6kDsAO/A8IDxgPNA9ID8gP9AwEEFAQeBCAEJQRHAEphSAA7gNAA0EBjAHUAdABlADuAyQDJQIABYWl5ALYDuQO+A/Ihb24aYXIAYwA7gMoAykAtZG8AdAAWYXIAAOA12AjdcgBhAHYAZQA7gMgAyEDlIm1lbnQAoAgiAAFhcNYD2QNjAHIAEmF0AHkAUwLhAwAAAADpA20lYWxsU3F1YXJlAACg+yVlJ3J5U21hbGxTcXVhcmUAAKCrJQABZ3D2A/kDbwBuABhhZgAA4DXYPN3zImlsb26VY3UAAAFhaQYEDgRsAFSgdSppImxkZQAAoEIi7CNpYnJpdW0AoMwhAAFjaRgEGwRyAACgMCFtAACgcyphAJdjbQBsADuAywDLQAABaXApBC0E8yF0cwCgAyLvJG5lbnRpYWxFAKBHIYACY2Zpb3MAPQQ/BEMEXQRyBHkAJGRyAADgNdgJ3WwibGVkAFMCTAQAAAAAVARtJWFsbFNxdWFyZQAAoPwlZSdyeVNtYWxsU3F1YXJlAACgqiVwA2UEAABpBAAAAABtBGYAAOA12D3dwSFsbACgACLyI2llcnRyZgCgMSFjAPIAcQQABkpUYWJjZGZnb3JzdIgEiwSOBJMElwSkBKcEqwStBLIE5QTqBGMAeQADZDuAPgA+QO0hbWFkoJMD3GNyImV2ZQAeYYABZWl5AJ0EoASjBOQhaWwiYXIAYwAcYRNkbwB0ACBhcgAA4DXYCt0AoNkicABmAADgNdg+3eUiYXRlcgADRUZHTFNUvwTIBM8E1QTZBOAEcSJ1YWwATKBlIuUhc3MAoNsidSRsbEVxdWFsAACgZyJyI2VhdGVyAACgoirlIXNzAKB3IuwkYW50RXF1YWwAoH4qaSJsZGUAAKBzImMAcgAA4DXYotwAoGsiAARBYWNmaW9zdfkE/QQFBQgFCwUTBSIFKwVSIkRjeQAqZAABY3QBBQQFZQBrAMdiXmDpIXJjJGFyAACgDCFsJWJlcnRTcGFjZQAAoAsh8AEYBQAAGwVmAACgDSHpJXpvbnRhbExpbmUAoAAlAAFjdCYFKAXyABIF8iFvayZhbQBwAEQBMQU5BW8AdwBuAEgAdQBtAPAAAAFxInVhbAAAoE8iAAdFSk9hY2RmZ21ub3N0dVMFVgVZBVwFYwVtBXAFcwV6BZAFtgXFBckFzQVjAHkAFWTsIWlnMmFjAHkAAWRjAHUAdABlADuAzQDNQAABaXlnBWwFcgBjADuAzgDOQBhkbwB0ADBhcgAAoBEhcgBhAHYAZQA7gMwAzEAAoREhYXB/BYsFAAFjZ4MFhQVyACphaSNuYXJ5SQAAoEghbABpAGUA8wD6AvQBlQUAAKUFZaAsIgABZ3KaBZ4F8iFhbACgKyLzI2VjdGlvbgCgwiJpI3NpYmxlAAABQ1SsBbEFbyJtbWEAAKBjIGkibWVzAACgYiCAAWdwdAC8Bb8FwwVvAG4ALmFmAADgNdhA3WEAmWNjAHIAAKAQIWkibGRlAChh6wHSBQAA1QVjAHkABmRsADuAzwDPQIACY2Zvc3UA4QXpBe0F8gX9BQABaXnlBegFcgBjADRhGWRyAADgNdgN3XAAZgAA4DXYQd3jAfcFAAD7BXIAAOA12KXc8iFjeQhk6yFjeQRkgANISmFjZm9zAAwGDwYSBhUGHQYhBiYGYwB5ACVkYwB5AAxk8CFwYZpjAAFleRkGHAbkIWlsNmEaZHIAAOA12A7dcABmAADgNdhC3WMAcgAA4DXYptyABUpUYWNlZmxtb3N0AD0GQAZDBl4GawZkB2gHcAd0B80H2gdjAHkACWQ7gDwAPECAAmNtbnByAEwGTwZSBlUGWwb1IXRlOWHiIWRhm2NnAACg6ifsI2FjZXRyZgCgEiFyAACgniGAAWFleQBkBmcGagbyIW9uPWHkIWlsO2EbZAABZnNvBjQHdAAABUFDREZSVFVWYXKABp4GpAbGBssG3AYDByEHwQIqBwABbnKEBowGZyVsZUJyYWNrZXQAAKDoJ/Ihb3cAoZAhQlKTBpcGYQByAACg5CHpJGdodEFycm93AKDGIWUjaWxpbmcAAKAII28A9QGqBgAAsgZiJWxlQnJhY2tldAAAoOYnbgDUAbcGAAC+BmUkZVZlY3RvcgAAoGEp5SJjdG9yQqDDIWEAcgAAoFkpbCJvb3IAAKAKI2kiZ2h0AAABQVbSBtcGciJyb3cAAKCUIeUiY3RvcgCgTikAAWVy4AbwBmUAAKGjIkFW5gbrBnIicm93AACgpCHlImN0b3IAoFopaSNhbmdsZQBCorIi+wYAAAAA/wZhAHIAAKDPKXEidWFsAACgtCJwAIABRFRWAAoHEQcYB+8kd25WZWN0b3IAoFEpZSRlVmVjdG9yAACgYCnlImN0b3JCoL8hYQByAACgWCnlImN0b3JCoLwhYQByAACgUilpAGcAaAB0AGEAcgByAG8A9wDMAnMAAANFRkdMU1Q/B0cHTgdUB1gHXwfxJXVhbEdyZWF0ZXIAoNoidSRsbEVxdWFsAACgZiJyI2VhdGVyAACgdiLlIXNzAKChKuwkYW50RXF1YWwAoH0qaSJsZGUAAKByInIAAOA12A/dZaDYIuYjdGFycm93AKDaIWkiZG90AD9hgAFucHcAege1B7kHZwAAAkxSbHKCB5QHmwerB+UhZnQAAUFSiAeNB3Iicm93AACg9SfpJGdodEFycm93AKD3J+kkZ2h0QXJyb3cAoPYn5SFmdAABYXLcAqEHaQBnAGgAdABhAHIAcgBvAPcA5wJpAGcAaAB0AGEAcgByAG8A9wDuAmYAAOA12EPdZQByAAABTFK/B8YHZSRmdEFycm93AACgmSHpJGdodEFycm93AKCYIYABY2h0ANMH1QfXB/IAWgYAoLAh8iFva0FhAKBqIgAEYWNlZmlvc3XpB+wH7gf/BwMICQgOCBEIcAAAoAUpeQAcZAABZGzyB/kHaSR1bVNwYWNlAACgXyBsI2ludHJmAACgMyFyAADgNdgQ3e4jdXNQbHVzAKATInAAZgAA4DXYRN1jAPIA/gecY4AESmFjZWZvc3R1ACEIJAgoCDUIgQiFCDsKQApHCmMAeQAKZGMidXRlAENhgAFhZXkALggxCDQI8iFvbkdh5CFpbEVhHWSAAWdzdwA7CGEIfQjhInRpdmWAAU1UVgBECEwIWQhlJWRpdW1TcGFjZQAAoAsgaABpAAABY25SCFMIawBTAHAAYQBjAOUASwhlAHIAeQBUAGgAaQDuAFQI9CFlZAABR0xnCHUIcgBlAGEAdABlAHIARwByAGUAYQB0AGUA8gDrBGUAcwBzAEwAZQBzAPMA2wdMImluZQAKYHIAAOA12BHdAAJCbnB0jAiRCJkInAhyImVhawAAoGAgwiZyZWFraW5nU3BhY2WgYGYAAKAVIUOq7CqzCMIIzQgAAOcIGwkAAAAAAAAtCQAAbwkAAIcJAACdCcAJGQoAADQKAAFvdbYIvAjuI2dydWVudACgYiJwIkNhcAAAoG0ibyh1YmxlVmVydGljYWxCYXIAAKAmIoABbHF4ANII1wjhCOUibWVudACgCSL1IWFsVKBgImkibGRlAADgQiI4A2kic3RzAACgBCJyI2VhdGVyAACjbyJFRkdMU1T1CPoIAgkJCQ0JFQlxInVhbAAAoHEidSRsbEVxdWFsAADgZyI4A3IjZWF0ZXIAAOBrIjgD5SFzcwCgeSLsJGFudEVxdWFsAOB+KjgDaSJsZGUAAKB1IvUhbXBEASAJJwnvI3duSHVtcADgTiI4A3EidWFsAADgTyI4A2UAAAFmczEJRgn0JFRyaWFuZ2xlQqLqIj0JAAAAAEIJYQByAADgzyk4A3EidWFsAACg7CJzAICibiJFR0xTVABRCVYJXAlhCWkJcSJ1YWwAAKBwInIjZWF0ZXIAAKB4IuUhc3MA4GoiOAPsJGFudEVxdWFsAOB9KjgDaSJsZGUAAKB0IuUic3RlZAABR0x1CX8J8iZlYXRlckdyZWF0ZXIA4KIqOAPlI3NzTGVzcwDgoSo4A/IjZWNlZGVzAKGAIkVTjwmVCXEidWFsAADgryo4A+wkYW50RXF1YWwAoOAiAAFlaaAJqQl2JmVyc2VFbGVtZW50AACgDCLnJWh0VHJpYW5nbGVCousitgkAAAAAuwlhAHIAAODQKTgDcSJ1YWwAAKDtIgABcXXDCeAJdSNhcmVTdQAAAWJwywnVCfMhZXRF4I8iOANxInVhbAAAoOIi5SJyc2V0ReCQIjgDcSJ1YWwAAKDjIoABYmNwAOYJ8AkNCvMhZXRF4IIi0iBxInVhbAAAoIgi4yJlZWRzgKGBIkVTVAD6CQAKBwpxInVhbAAA4LAqOAPsJGFudEVxdWFsAKDhImkibGRlAADgfyI4A+UicnNldEXggyLSIHEidWFsAACgiSJpImxkZQCAoUEiRUZUACIKJwouCnEidWFsAACgRCJ1JGxsRXF1YWwAAKBHImkibGRlAACgSSJlJXJ0aWNhbEJhcgAAoCQiYwByAADgNdip3GkAbABkAGUAO4DRANFAnWMAB0VhY2RmZ21vcHJzdHV2XgphCmgKcgp2CnoKgQqRCpYKqwqtCrsKyArNCuwhaWdSYWMAdQB0AGUAO4DTANNAAAFpeWwKcQpyAGMAO4DUANRAHmRiImxhYwBQYXIAAOA12BLdcgBhAHYAZQA7gNIA0kCAAWFlaQCHCooKjQpjAHIATGFnAGEAqWNjInJvbgCfY3AAZgAA4DXYRt3lI25DdXJseQABRFGeCqYKbyV1YmxlUXVvdGUAAKAcIHUib3RlAACgGCAAoFQqAAFjbLEKtQpyAADgNdiq3GEAcwBoADuA2ADYQGkAbAHACsUKZABlADuA1QDVQGUAcwAAoDcqbQBsADuA1gDWQGUAcgAAAUJQ0wrmCgABYXLXCtoKcgAAoD4gYQBjAAABZWvgCuIKAKDeI2UAdAAAoLQjYSVyZW50aGVzaXMAAKDcI4AEYWNmaGlsb3JzAP0KAwsFCwkLCwsMCxELIwtaC3IjdGlhbEQAAKACInkAH2RyAADgNdgT3WkApmOgY/Ujc01pbnVzsWAAAWlwFQsgC24AYwBhAHIAZQBwAGwAYQBuAOUACgVmAACgGSGAobsqZWlvACoLRQtJC+MiZWRlc4CheiJFU1QANAs5C0ALcSJ1YWwAAKCvKuwkYW50RXF1YWwAoHwiaSJsZGUAAKB+Im0AZQAAoDMgAAFkcE0LUQv1IWN0AKAPIm8jcnRpb24AYaA3ImwAAKAdIgABY2leC2ILcgAA4DXYq9yoYwACVWZvc2oLbwtzC3cLTwBUADuAIgAiQHIAAOA12BTdcABmAACgGiFjAHIAAOA12KzcAAZCRWFjZWZoaW9yc3WPC5MLlwupC7YL2AvbC90LhQyTDJoMowzhIXJyAKAQKUcAO4CuAK5AgAFjbnIAnQugC6ML9SF0ZVRhZwAAoOsncgB0oKAhbAAAoBYpgAFhZXkArwuyC7UL8iFvblhh5CFpbFZhIGR2oBwhZSJyc2UAAAFFVb8LzwsAAWxxwwvIC+UibWVudACgCyL1JGlsaWJyaXVtAKDLIXAmRXF1aWxpYnJpdW0AAKBvKXIAAKAcIW8AoWPnIWh0AARBQ0RGVFVWYewLCgwQDDIMNwxeDHwM9gIAAW5y8Av4C2clbGVCcmFja2V0AACg6SfyIW93AKGSIUJM/wsDDGEAcgAAoOUhZSRmdEFycm93AACgxCFlI2lsaW5nAACgCSNvAPUBFgwAAB4MYiVsZUJyYWNrZXQAAKDnJ24A1AEjDAAAKgxlJGVWZWN0b3IAAKBdKeUiY3RvckKgwiFhAHIAAKBVKWwib29yAACgCyMAAWVyOwxLDGUAAKGiIkFWQQxGDHIicm93AACgpiHlImN0b3IAoFspaSNhbmdsZQBCorMiVgwAAAAAWgxhAHIAAKDQKXEidWFsAACgtSJwAIABRFRWAGUMbAxzDO8kd25WZWN0b3IAoE8pZSRlVmVjdG9yAACgXCnlImN0b3JCoL4hYQByAACgVCnlImN0b3JCoMAhYQByAACgUykAAXB1iQyMDGYAAKAdIe4kZEltcGxpZXMAoHAp6SRnaHRhcnJvdwCg2yEAAWNongyhDHIAAKAbIQCgsSHsJGVEZWxheWVkAKD0KYAGSE9hY2ZoaW1vcXN0dQC/DMgMzAzQDOIM5gwKDQ0NFA0ZDU8NVA1YDQABQ2PDDMYMyCFjeSlkeQAoZEYiVGN5ACxkYyJ1dGUAWmEAorwqYWVpedgM2wzeDOEM8iFvbmBh5CFpbF5hcgBjAFxhIWRyAADgNdgW3e8hcnQAAkRMUlXvDPYM/QwEDW8kd25BcnJvdwAAoJMhZSRmdEFycm93AACgkCHpJGdodEFycm93AKCSIXAjQXJyb3cAAKCRIechbWGjY+EkbGxDaXJjbGUAoBgicABmAADgNdhK3XICHw0AAAAAIg10AACgGiLhIXJlgKGhJUlTVQAqDTINSg3uJXRlcnNlY3Rpb24AoJMidQAAAWJwNw1ADfMhZXRFoI8icSJ1YWwAAKCRIuUicnNldEWgkCJxInVhbAAAoJIibiJpb24AAKCUImMAcgAA4DXYrtxhAHIAAKDGIgACYmNtcF8Nag2ODZANc6DQImUAdABFoNAicSJ1YWwAAKCGIgABY2huDYkNZSJlZHMAgKF7IkVTVAB4DX0NhA1xInVhbAAAoLAq7CRhbnRFcXVhbACgfSJpImxkZQAAoH8iVABoAGEA9ADHCwCgESIAodEiZXOVDZ8NciJzZXQARaCDInEidWFsAACghyJlAHQAAKDRIoAFSFJTYWNmaGlvcnMAtQ27Db8NyA3ODdsN3w3+DRgOHQ4jDk8AUgBOADuA3gDeQMEhREUAoCIhAAFIY8MNxg1jAHkAC2R5ACZkAAFidcwNzQ0JYKRjgAFhZXkA1A3XDdoN8iFvbmRh5CFpbGJhImRyAADgNdgX3QABZWnjDe4N8gHoDQAA7Q3lImZvcmUAoDQiYQCYYwABY27yDfkNayNTcGFjZQAA4F8gCiDTInBhY2UAoAkg7CFkZYChPCJFRlQABw4MDhMOcSJ1YWwAAKBDInUkbGxFcXVhbAAAoEUiaSJsZGUAAKBIInAAZgAA4DXYS93pI3BsZURvdACg2yAAAWN0Jw4rDnIAAOA12K/c8iFva2Zh4QpFDlYOYA5qDgAAbg5yDgAAAAAAAAAAAAB5DnwOqA6zDgAADg8RDxYPGg8AAWNySA5ODnUAdABlADuA2gDaQHIAb6CfIeMhaXIAoEkpcgDjAVsOAABdDnkADmR2AGUAbGEAAWl5Yw5oDnIAYwA7gNsA20AjZGIibGFjAHBhcgAA4DXYGN1yAGEAdgBlADuA2QDZQOEhY3JqYQABZGl/Dp8OZQByAAABQlCFDpcOAAFhcokOiw5yAF9gYQBjAAABZWuRDpMOAKDfI2UAdAAAoLUjYSVyZW50aGVzaXMAAKDdI28AbgBQoMMi7CF1cwCgjiIAAWdwqw6uDm8AbgByYWYAAOA12EzdAARBREVUYWRwc78O0g7ZDuEOBQPqDvMOBw9yInJvdwDCoZEhyA4AAMwOYQByAACgEilvJHduQXJyb3cAAKDFIW8kd25BcnJvdwAAoJUhcSV1aWxpYnJpdW0AAKBuKWUAZQBBoKUiciJyb3cAAKClIW8AdwBuAGEAcgByAG8A9wAQA2UAcgAAAUxS+Q4AD2UkZnRBcnJvdwAAoJYh6SRnaHRBcnJvdwCglyFpAGyg0gNvAG4ApWPpIW5nbmFjAHIAAOA12LDcaSJsZGUAaGFtAGwAO4DcANxAgAREYmNkZWZvc3YALQ8xDzUPNw89D3IPdg97D4AP4SFzaACgqyJhAHIAAKDrKnkAEmThIXNobKCpIgCg5ioAAWVyQQ9DDwCgwSKAAWJ0eQBJD00Paw9hAHIAAKAWIGmgFiDjIWFsAAJCTFNUWA9cD18PZg9hAHIAAKAjIukhbmV8YGUkcGFyYXRvcgAAoFgnaSJsZGUAAKBAItQkaGluU3BhY2UAoAogcgAA4DXYGd1wAGYAAOA12E3dYwByAADgNdix3GQiYXNoAACgqiKAAmNlZm9zAI4PkQ+VD5kPng/pIXJjdGHkIWdlAKDAInIAAOA12BrdcABmAADgNdhO3WMAcgAA4DXYstwAAmZpb3OqD64Prw+0D3IAAOA12BvdnmNwAGYAAOA12E/dYwByAADgNdiz3IAEQUlVYWNmb3N1AMgPyw/OD9EP2A/gD+QP6Q/uD2MAeQAvZGMAeQAHZGMAeQAuZGMAdQB0AGUAO4DdAN1AAAFpedwP3w9yAGMAdmErZHIAAOA12BzdcABmAADgNdhQ3WMAcgAA4DXYtNxtAGwAeGEABEhhY2RlZm9z/g8BEAUQDRAQEB0QIBAkEGMAeQAWZGMidXRlAHlhAAFheQkQDBDyIW9ufWEXZG8AdAB7YfIBFRAAABwQbwBXAGkAZAB0AOgAVAhhAJZjcgAAoCghcABmAACgJCFjAHIAAOA12LXc4QtCEEkQTRAAAGcQbRByEAAAAAAAAAAAeRCKEJcQ8hD9EAAAGxEhETIROREAAD4RYwB1AHQAZQA7gOEA4UByImV2ZQADYYCiPiJFZGl1eQBWEFkQWxBgEGUQAOA+IjMDAKA/InIAYwA7gOIA4kB0AGUAO4C0ALRAMGRsAGkAZwA7gOYA5kByoGEgAOA12B7dcgBhAHYAZQA7gOAA4EAAAWVwfBCGEAABZnCAEIQQ8yF5bQCgNSHoAIMQaABhALFjAAFhcI0QWwAAAWNskRCTEHIAAWFnAACgPypkApwQAAAAALEQAKInImFkc3ajEKcQqRCuEG4AZAAAoFUqAKBcKmwib3BlAACgWCoAoFoqAKMgImVsbXJzersQvRDAEN0Q5RDtEACgpCllAACgICJzAGQAYaAhImEEzhDQENIQ1BDWENgQ2hDcEACgqCkAoKkpAKCqKQCgqykAoKwpAKCtKQCgrikAoK8pdAB2oB8iYgBkoL4iAKCdKQABcHTpEOwQaAAAoCIixWDhIXJyAKB8IwABZ3D1EPgQbwBuAAVhZgAA4DXYUt0Ao0giRWFlaW9wBxEJEQ0RDxESERQRAKBwKuMhaXIAoG8qAKBKImQAAKBLInMAJ2DyIW94ZaBIIvEADhFpAG4AZwA7gOUA5UCAAWN0eQAmESoRKxFyAADgNdi23CpgbQBwAGWgSCLxAPgBaQBsAGQAZQA7gOMA40BtAGwAO4DkAORAAAFjaUERRxFvAG4AaQBuAPQA6AFuAHQAAKARKgAITmFiY2RlZmlrbG5vcHJzdWQRaBGXEZ8RpxGrEdIR1hErEjASexKKEn0RThNbE3oTbwB0AACg7SoAAWNybBGJEWsAAAJjZXBzdBF4EX0RghHvIW5nAKBMInAjc2lsb24A9mNyImltZQAAoDUgaQBtAGWgPSJxAACgzSJ2AY0RkRFlAGUAAKC9ImUAZABnoAUjZQAAoAUjcgBrAHSgtSPiIXJrAKC2IwABb3mjEaYRbgDnAHcRMWTxIXVvAKAeIIACY21wcnQAtBG5Eb4RwRHFEeEhdXPloDUi5ABwInR5dgAAoLApcwDpAH0RbgBvAPUA6gCAAWFodwDLEcwRzhGyYwCgNiHlIWVuAKBsInIAAOA12B/dZwCAA2Nvc3R1dncA4xHyEQUSEhIhEiYSKRKAAWFpdQDpEesR7xHwAKMFcgBjAACg7yVwAACgwyKAAWRwdAD4EfwRABJvAHQAAKAAKuwhdXMAoAEqaSJtZXMAAKACKnECCxIAAAAADxLjIXVwAKAGKmEAcgAAoAUm8iNpYW5nbGUAAWR1GhIeEu8hd24AoL0lcAAAoLMlcCJsdXMAAKAEKmUA5QBCD+UAkg9hInJvdwAAoA0pgAFha28ANhJoEncSAAFjbjoSZRJrAIABbHN0AEESRxJNEm8jemVuZ2UAAKDrKXEAdQBhAHIA5QBcBPIjaWFuZ2xlgKG0JWRscgBYElwSYBLvIXduAKC+JeUhZnQAoMIlaSJnaHQAAKC4JWsAAKAjJLEBbRIAAHUSsgFxEgAAcxIAoJIlAKCRJTQAAKCTJWMAawAAoIglAAFlb38ShxJx4D0A5SD1IWl2AOBhIuUgdAAAoBAjAAJwdHd4kRKVEpsSnxJmAADgNdhT3XSgpSJvAG0AAKClIvQhaWUAoMgiAAZESFVWYmRobXB0dXayEsES0RLgEvcS+xIKExoTHxMjEygTNxMAAkxSbHK5ErsSvRK/EgCgVyUAoFQlAKBWJQCgUyUAolAlRFVkdckSyxLNEs8SAKBmJQCgaSUAoGQlAKBnJQACTFJsctgS2hLcEt4SAKBdJQCgWiUAoFwlAKBZJQCjUSVITFJobHLrEu0S7xLxEvMS9RIAoGwlAKBjJQCgYCUAoGslAKBiJQCgXyVvAHgAAKDJKQACTFJscgITBBMGEwgTAKBVJQCgUiUAoBAlAKAMJQCiACVEVWR1EhMUExYTGBMAoGUlAKBoJQCgLCUAoDQlaSJudXMAAKCfIuwhdXMAoJ4iaSJtZXMAAKCgIgACTFJsci8TMRMzEzUTAKBbJQCgWCUAoBglAKAUJQCjAiVITFJobHJCE0QTRhNIE0oTTBMAoGolAKBhJQCgXiUAoDwlAKAkJQCgHCUAAWV2UhNVE3YA5QD5AGIAYQByADuApgCmQAACY2Vpb2ITZhNqE24TcgAA4DXYt9xtAGkAAKBPIG0A5aA9IogRbAAAoVwAYmh0E3YTAKDFKfMhdWIAoMgnbAF+E4QTbABloCIgdAAAoCIgcAAAoU4iRWWJE4sTAKCuKvGgTyI8BeEMqRMAAN8TABQDFB8UAAAjFDQUAAAAAIUUAAAAAI0UAAAAANcU4xT3FPsUAACIFQAAlhWAAWNwcgCuE7ET1RP1IXRlB2GAoikiYWJjZHMAuxO/E8QTzhPSE24AZAAAoEQqciJjdXAAAKBJKgABYXXIE8sTcAAAoEsqcAAAoEcqbwB0AACgQCoA4CkiAP4AAWVv2RPcE3QAAKBBIO4ABAUAAmFlaXXlE+8T9RP4E/AB6hMAAO0TcwAAoE0qbwBuAA1hZABpAGwAO4DnAOdAcgBjAAlhcABzAHOgTCptAACgUCpvAHQAC2GAAWRtbgAIFA0UEhRpAGwAO4C4ALhAcCJ0eXYAAKCyKXQAAIGiADtlGBQZFKJAcgBkAG8A9ABiAXIAAOA12CDdgAFjZWkAKBQqFDIUeQBHZGMAawBtoBMn4SFyawCgEyfHY3IAAKPLJUVjZWZtcz8UQRRHFHcUfBSAFACgwykAocYCZWxGFEkUcQAAoFciZQBhAlAUAAAAAGAUciJyb3cAAAFsclYUWhTlIWZ0AKC6IWkiZ2h0AACguyGAAlJTYWNkAGgUaRRrFG8UcxSuYACgyCRzAHQAAKCbIukhcmMAoJoi4SFzaACgnSJuImludAAAoBAqaQBkAACg7yrjIWlyAKDCKfUhYnN1oGMmaQB0AACgYybsApMUmhS2FAAAwxRvAG4AZaA6APGgVCKrAG0CnxQAAAAAoxRhAHSgLABAYAChASJmbKcUqRTuABMNZQAAAW14rhSyFOUhbnQAoAEiZQDzANIB5wG6FAAAwBRkoEUibwB0AACgbSpuAPQAzAGAAWZyeQDIFMsUzhQA4DXYVN1vAOQA1wEAgakAO3MeAdMUcgAAoBchAAFhb9oU3hRyAHIAAKC1IXMAcwAAoBcnAAFjdeYU6hRyAADgNdi43AABYnDuFPIUZaDPKgCg0SploNAqAKDSKuQhb3QAoO8igANkZWxwcnZ3AAYVEBUbFSEVRBVlFYQV4SFycgABbHIMFQ4VAKA4KQCgNSlwAhYVAAAAABkVcgAAoN4iYwAAoN8i4SFycnCgtiEAoD0pgKIqImJjZG9zACsVMBU6FT4VQRVyImNhcAAAoEgqAAFhdTQVNxVwAACgRipwAACgSipvAHQAAKCNInIAAKBFKgDgKiIA/gACYWxydksVURVuFXMVcgByAG2gtyEAoDwpeQCAAWV2dwBYFWUVaRVxAHACXxUAAAAAYxVyAGUA4wAXFXUA4wAZFWUAZQAAoM4iZSJkZ2UAAKDPImUAbgA7gKQApEBlI2Fycm93AAABbHJ7FX8V5SFmdACgtiFpImdodAAAoLchZQDkAG0VAAFjaYsVkRVvAG4AaQBuAPQAkwFuAHQAAKAxImwiY3R5AACgLSOACUFIYWJjZGVmaGlqbG9yc3R1d3oAuBW7Fb8V1RXgFegV+RUKFhUWHxZUFlcWZRbFFtsW7xb7FgUXChdyAPIAtAJhAHIAAKBlKQACZ2xyc8YVyhXOFdAV5yFlcgCgICDlIXRoAKA4IfIA9QxoAHagECAAoKMiawHZFd4VYSJyb3cAAKAPKWEA4wBfAgABYXnkFecV8iFvbg9hNGQAoUYhYW/tFfQVAAFnciEC8RVyAACgyiF0InNlcQAAoHcqgAFnbG0A/xUCFgUWO4CwALBAdABhALRjcCJ0eXYAAKCxKQABaXIOFhIW8yFodACgfykA4DXYId1hAHIAAAFschsWHRYAoMMhAKDCIYACYWVnc3YAKBauAjYWOhY+Fm0AAKHEIm9zLhY0Fm4AZABzoMQi9SFpdACgZiZhIm1tYQDdY2kAbgAAoPIiAKH3AGlvQxZRFmQAZQAAgfcAO29KFksW90BuI3RpbWVzAACgxyJuAPgAUBZjAHkAUmRjAG8CXhYAAAAAYhZyAG4AAKAeI28AcAAAoA0jgAJscHR1dwBuFnEWdRaSFp4W7CFhciRgZgAA4DXYVd0AotkCZW1wc30WhBaJFo0WcQBkoFAibwB0AACgUSJpIm51cwAAoDgi7CF1cwCgFCLxInVhcmUAoKEiYgBsAGUAYgBhAHIAdwBlAGQAZwDlANcAbgCAAWFkaAClFqoWtBZyAHIAbwD3APUMbwB3AG4AYQByAHIAbwB3APMA8xVhI3Jwb29uAAABbHK8FsAWZQBmAPQAHBZpAGcAaAD0AB4WYgHJFs8WawBhAHIAbwD3AJILbwLUFgAAAADYFnIAbgAAoB8jbwBwAACgDCOAAWNvdADhFukW7BYAAXJ55RboFgDgNdi53FVkbAAAoPYp8iFvaxFhAAFkcvMW9xZvAHQAAKDxImkA5qC/JVsSAAFhaP8WAhdyAPIANQNhAPIA1wvhIm5nbGUAoKYpAAFjaQ4XEBd5AF9k5yJyYXJyAKD/JwAJRGFjZGVmZ2xtbm9wcXJzdHV4MRc4F0YXWxcyBF4XaRd5F40XrBe0F78X2RcVGCEYLRg1GEAYAAFEbzUXgRZvAPQA+BUAAWNzPBdCF3UAdABlADuA6QDpQPQhZXIAoG4qAAJhaW95TRdQF1YXWhfyIW9uG2FyAGOgViI7gOoA6kDsIW9uAKBVIk1kbwB0ABdhAAFEcmIXZhdvAHQAAKBSIgDgNdgi3XKhmipuF3QXYQB2AGUAO4DoAOhAZKCWKm8AdAAAoJgqgKGZKmlscwCAF4UXhxfuInRlcnMAoOcjAKATIWSglSpvAHQAAKCXKoABYXBzAJMXlheiF2MAcgATYXQAeQBzogUinxcAAAAAoRdlAHQAAKAFInAAMaADIDMBqRerFwCgBCAAoAUgAAFnc7AXsRdLYXAAAKACIAABZ3C4F7sXbwBuABlhZgAA4DXYVt2AAWFscwDFF8sXzxdyAHOg1SJsAACg4yl1AHMAAKBxKmkAAKG1A2x21RfYF28AbgC1Y/VjAAJjc3V24BfoF/0XEBgAAWlv5BdWF3IAYwAAoFYiaQLuFwAAAADwF+0ADQThIW50AAFnbPUX+Rd0AHIAAKCWKuUhc3MAoJUqgAFhZWkAAxgGGAoYbABzAD1gcwB0AACgXyJ2AESgYSJEAACgeCrwImFyc2wAoOUpAAFEYRkYHRhvAHQAAKBTInIAcgAAoHEpgAFjZGkAJxgqGO0XcgAAoC8hbwD0AIwCAAFhaDEYMhi3YzuA8ADwQAABbXI5GD0YbAA7gOsA60BvAACgrCCAAWNpcABGGEgYSxhsACFgcwD0ACwEAAFlb08YVxhjAHQAYQB0AGkAbwDuABoEbgBlAG4AdABpAGEAbADlADME4Ql1GAAAgRgAAIMYiBgAAAAAoRilGAAAqhgAALsYvhjRGAAA1xgnGWwAbABpAG4AZwBkAG8AdABzAGUA8QBlF3kARGRtImFsZQAAoEAmgAFpbHIAjRiRGJ0Y7CFpZwCgA/tpApcYAAAAAJoYZwAAoAD7aQBnAACgBPsA4DXYI93sIWlnAKAB++whaWcA4GYAagCAAWFsdACvGLIYthh0AACgbSZpAGcAAKAC+24AcwAAoLElbwBmAJJh8AHCGAAAxhhmAADgNdhX3QABYWvJGMwYbADsAGsEdqDUIgCg2SphI3J0aW50AACgDSoAAWFv2hgiGQABY3PeGB8ZsQPnGP0YBRkSGRUZAAAdGbID7xjyGPQY9xj5GAAA+xg7gL0AvUAAoFMhO4C8ALxAAKBVIQCgWSEAoFshswEBGQAAAxkAoFQhAKBWIbQCCxkOGQAAAAAQGTuAvgC+QACgVyEAoFwhNQAAoFghtgEZGQAAGxkAoFohAKBdITgAAKBeIWwAAKBEIHcAbgAAoCIjYwByAADgNdi73IAIRWFiY2RlZmdpamxub3JzdHYARhlKGVoZXhlmGWkZkhmWGZkZnRmgGa0ZxhnLGc8Z4BkjGmygZyIAoIwqgAFjbXAAUBlTGVgZ9SF0ZfVhbQBhAOSgswM6FgCghipyImV2ZQAfYQABaXliGWUZcgBjAB1hM2RvAHQAIWGAoWUibHFzAMYEcBl6GfGhZSLOBAAAdhlsAGEAbgD0AN8EgKF+KmNkbACBGYQZjBljAACgqSpvAHQAb6CAKmyggioAoIQqZeDbIgD+cwAAoJQqcgAA4DXYJN3noGsirATtIWVsAKA3IWMAeQBTZIChdyJFYWoApxmpGasZAKCSKgCgpSoAoKQqAAJFYWVztBm2Gb0ZwhkAoGkicABwoIoq8iFveACgiipxoIgq8aCIKrUZaQBtAACg5yJwAGYAAOA12FjdYQB2AOUAYwIAAWNp0xnWGXIAAKAKIW0AAKFzImVs3BneGQCgjioAoJAqAIM+ADtjZGxxco0E6xn0GfgZ/BkBGgABY2nvGfEZAKCnKnIAAKB6Km8AdAAAoNci0CFhcgCglSl1ImVzdAAAoHwqgAJhZGVscwAKGvQZFhrVBCAa8AEPGgAAFBpwAHIAbwD4AFkZcgAAoHgpcQAAAWxxxAQbGmwAZQBzAPMASRlpAO0A5AQAAWVuJxouGnIjdG5lcXEAAOBpIgD+xQAsGgAFQWFiY2Vma29zeUAaQxpmGmoabRqDGocalhrCGtMacgDyAMwCAAJpbG1yShpOGlAaVBpyAHMA8ABxD2YAvWBpAGwA9AASBQABZHJYGlsaYwB5AEpkAKGUIWN3YBpkGmkAcgAAoEgpAKCtIWEAcgAAoA8h6SFyYyVhgAFhbHIAcxp7Gn8a8iF0c3WgZSZpAHQAAKBlJuwhaXAAoCYg4yFvbgCguSJyAADgNdgl3XMAAAFld4wakRphInJvdwAAoCUpYSJyb3cAAKAmKYACYW1vcHIAnxqjGqcauhq+GnIAcgAAoP8h9CFodACgOyJrAAABbHKsGrMaZSRmdGFycm93AACgqSHpJGdodGFycm93AKCqIWYAAOA12Fnd4iFhcgCgFSCAAWNsdADIGswa0BpyAADgNdi93GEAcwDoAGka8iFvaydhAAFicNca2xr1IWxsAKBDIOghZW4AoBAg4Qr2GgAA/RoAAAgbExsaGwAAIRs7GwAAAAA+G2IbmRuVG6sbAACyG80b0htjAHUAdABlADuA7QDtQAChYyBpeQEbBhtyAGMAO4DuAO5AOGQAAWN4CxsNG3kANWRjAGwAO4ChAKFAAAFmcssCFhsA4DXYJt1yAGEAdgBlADuA7ADsQIChSCFpbm8AJxsyGzYbAAFpbisbLxtuAHQAAKAMKnQAAKAtIuYhaW4AoNwpdABhAACgKSHsIWlnM2GAAWFvcABDG1sbXhuAAWNndABJG0sbWRtyACthgAFlbHAAcQVRG1UbaQBuAOUAyAVhAHIA9AByBWgAMWFmAACgtyJlAGQAtWEAoggiY2ZvdGkbbRt1G3kb4SFyZQCgBSFpAG4AdKAeImkAZQAAoN0pZABvAPQAWxsAoisiY2VscIEbhRuPG5QbYQBsAACguiIAAWdyiRuNG2UAcgDzACMQ4wCCG2EicmhrAACgFyryIW9kAKA8KgACY2dwdJ8boRukG6gbeQBRZG8AbgAvYWYAAOA12FrdYQC5Y3UAZQBzAHQAO4C/AL9AAAFjabUbuRtyAADgNdi+3G4AAKIIIkVkc3bCG8QbyBvQAwCg+SJvAHQAAKD1Inag9CIAoPMiaaBiIOwhZGUpYesB1hsAANkbYwB5AFZkbAA7gO8A70AAA2NmbW9zdeYb7hvyG/Ub+hsFHAABaXnqG+0bcgBjADVhOWRyAADgNdgn3eEhdGg3YnAAZgAA4DXYW93jAf8bAAADHHIAAOA12L/c8iFjeVhk6yFjeVRkAARhY2ZnaGpvcxUcGhwiHCYcKhwtHDAcNRzwIXBhdqC6A/BjAAFleR4cIRzkIWlsN2E6ZHIAAOA12CjdciJlZW4AOGFjAHkARWRjAHkAXGRwAGYAAOA12FzdYwByAADgNdjA3IALQUJFSGFiY2RlZmdoamxtbm9wcnN0dXYAXhxtHHEcdRx5HN8cBx0dHTwd3B3tHfEdAR4EHh0eLB5FHrwewx7hHgkfPR9LH4ABYXJ0AGQcZxxpHHIA8gBvB/IAxQLhIWlsAKAbKeEhcnIAoA4pZ6BmIgCgiyphAHIAAKBiKWMJjRwAAJAcAACVHAAAAAAAAAAAAACZHJwcAACmHKgcrRwAANIc9SF0ZTph7SJwdHl2AKC0KXIAYQDuAFoG4iFkYbtjZwAAoegnZGyhHKMcAKCRKeUAiwYAoIUqdQBvADuAqwCrQHIAgKOQIWJmaGxwc3QAuhy/HMIcxBzHHMoczhxmoOQhcwAAoB8pcwAAoB0p6wCyGnAAAKCrIWwAAKA5KWkAbQAAoHMpbAAAoKIhAKGrKmFl1hzaHGkAbAAAoBkpc6CtKgDgrSoA/oABYWJyAOUc6RztHHIAcgAAoAwpcgBrAACgcicAAWFr8Rz4HGMAAAFla/Yc9xx7YFtgAAFlc/wc/hwAoIspbAAAAWR1Ax0FHQCgjykAoI0pAAJhZXV5Dh0RHRodHB3yIW9uPmEAAWRpFR0YHWkAbAA8YewAowbiAPccO2QAAmNxcnMkHScdLB05HWEAAKA2KXUAbwDyoBwgqhEAAWR1MB00HeghYXIAoGcpcyJoYXIAAKBLKWgAAKCyIQCiZCJmZ3FzRB1FB5Qdnh10AIACYWhscnQATh1WHWUdbB2NHXIicm93AHSgkCFhAOkAzxxhI3Jwb29uAAABZHVeHWId7yF3bgCgvSFwAACgvCHlJGZ0YXJyb3dzAKDHIWkiZ2h0AIABYWhzAHUdex2DHXIicm93APOglCGdBmEAcgBwAG8AbwBuAPMAzgtxAHUAaQBnAGEAcgByAG8A9wBlGugkcmVldGltZXMAoMsi8aFkIk0HAACaHWwAYQBuAPQAXgcAon0qY2Rnc6YdqR2xHbcdYwAAoKgqbwB0AG+gfypyoIEqAKCDKmXg2iIA/nMAAKCTKoACYWRlZ3MAwB3GHcod1h3ZHXAAcAByAG8A+ACmHG8AdAAAoNYicQAAAWdxzx3SHXQA8gBGB2cAdADyAHQcdADyAFMHaQDtAGMHgAFpbHIA4h3mHeod8yFodACgfClvAG8A8gDKBgDgNdgp3UWgdiIAoJEqYQH1Hf4dcgAAAWR1YB35HWygvCEAoGopbABrAACghCVjAHkAWWQAomoiYWNodAweDx4VHhkecgDyAGsdbwByAG4AZQDyAGAW4SFyZACgaylyAGkAAKD6JQABaW8hHiQe5CFvdEBh9SFzdGGgsCPjIWhlAKCwIwACRWFlczMeNR48HkEeAKBoInAAcKCJKvIhb3gAoIkqcaCHKvGghyo0HmkAbQAAoOYiAARhYm5vcHR3elIeXB5fHoUelh6mHqsetB4AAW5yVh5ZHmcAAKDsJ3IAAKD9IXIA6wCwBmcAgAFsbXIAZh52Hnse5SFmdAABYXKIB2weaQBnAGgAdABhAHIAcgBvAPcAkwfhInBzdG8AoPwnaQBnAGgAdABhAHIAcgBvAPcAmgdwI2Fycm93AAABbHKNHpEeZQBmAPQAxhxpImdodAAAoKwhgAFhZmwAnB6fHqIecgAAoIUpAOA12F3ddQBzAACgLSppIm1lcwAAoDQqYQGvHrMecwB0AACgFyLhAIoOZaHKJbkeRhLuIWdlAKDKJWEAcgBsoCgAdAAAoJMpgAJhY2htdADMHs8e1R7bHt0ecgDyAJ0GbwByAG4AZQDyANYWYQByAGSgyyEAoG0pAKAOIHIAaQAAoL8iAANhY2hpcXTrHu8e1QfzHv0eBh/xIXVvAKA5IHIAAOA12MHcbQDloXIi+h4AAPweAKCNKgCgjyoAAWJ19xwBH28AcqAYIACgGiDyIW9rQmEAhDwAO2NkaGlscXJCBhcfxh0gHyQfKB8sHzEfAAFjaRsfHR8AoKYqcgAAoHkqcgBlAOUAkx3tIWVzAKDJIuEhcnIAoHYpdSJlc3QAAKB7KgABUGk1HzkfYQByAACglillocMlAgdfEnIAAAFkdUIfRx9zImhhcgAAoEop6CFhcgCgZikAAWVuTx9WH3IjdG5lcXEAAOBoIgD+xQBUHwAHRGFjZGVmaGlsbm9wc3VuH3Ifoh+rH68ftx+7H74f5h/uH/MfBwj/HwsgxCFvdACgOiIAAmNscHJ5H30fiR+eH3IAO4CvAK9AAAFldIEfgx8AoEImZaAgJ3MAZQAAoCAnc6CmIXQAbwCAoaYhZGx1AJQfmB+cH28AdwDuAHkDZQBmAPQA6gbwAOkO6yFlcgCgriUAAW95ph+qH+0hbWEAoCkqPGThIXNoAKAUIOElc3VyZWRhbmdsZQCgISJyAADgNdgq3W8AAKAnIYABY2RuAMQfyR/bH3IAbwA7gLUAtUBhoiMi0B8AANMf1x9zAPQAKxFpAHIAAKDwKm8AdAA7gLcAt0B1AHMA4qESIh4TAADjH3WgOCIAoCoqYwHqH+0fcAAAoNsq8gB+GnAAbAB1APMACAgAAWRw9x/7H+UhbHMAoKciZgAA4DXYXt0AAWN0AyAHIHIAAOA12MLc8CFvcwCgPiJsobwDECAVIPQiaW1hcACguCJhAPAAEyAADEdMUlZhYmNkZWZnaGlqbG1vcHJzdHV2dzwgRyBmIG0geSCqILgg2iDeIBEhFSEyIUMhTSFQIZwhnyHSIQAiIyKLIrEivyIUIwABZ3RAIEMgAODZIjgD9uBrItIgBwmAAWVsdABNIF8gYiBmAHQAAAFhclMgWCByInJvdwAAoM0h6SRnaHRhcnJvdwCgziEA4NgiOAP24Goi0iBfCekkZ2h0YXJyb3cAoM8hAAFEZHEgdSDhIXNoAKCvIuEhc2gAoK4igAJiY25wdACCIIYgiSCNIKIgbABhAACgByL1IXRlRGFnAADgICLSIACiSSJFaW9wlSCYIJwgniAA4HAqOANkAADgSyI4A3MASWFyAG8A+AAyCnUAcgBhoG4mbADzoG4mmwjzAa8gAACzIHAAO4CgAKBAbQBwAOXgTiI4AyoJgAJhZW91eQDBIMogzSDWINkg8AHGIAAAyCAAoEMqbwBuAEhh5CFpbEZhbgBnAGSgRyJvAHQAAOBtKjgDcAAAoEIqPWThIXNoAKATIACjYCJBYWRxc3jpIO0g+SD+IAIhDCFyAHIAAKDXIXIAAAFocvIg9SBrAACgJClvoJch9wAGD28AdAAA4FAiOAN1AGkA9gC7CAABZWkGIQohYQByAACgKCntAN8I6SFzdPOgBCLlCHIAAOA12CvdAAJFZXN0/wgcISshLiHxoXEiIiEAABMJ8aFxIgAJAAAnIWwAYQBuAPQAEwlpAO0AGQlyoG8iAKBvIoABQWFwADghOyE/IXIA8gBeIHIAcgAAoK4hYQByAACg8ipzogsiSiEAAAAAxwtkoPwiAKD6ImMAeQBaZIADQUVhZGVzdABcIV8hYiFmIWkhkyGWIXIA8gBXIADgZiI4A3IAcgAAoJohcgAAoCUggKFwImZxcwBwIYQhjiF0AAABYXJ1IXohcgByAG8A9wBlIWkAZwBoAHQAYQByAHIAbwD3AD4h8aFwImAhAACKIWwAYQBuAPQAZwlz4H0qOAMAoG4iaQDtAG0JcqBuImkA5aDqIkUJaQDkADoKAAFwdKMhpyFmAADgNdhf3YCBrAA7aW4AriGvIcchrEBuAIChCSJFZHYAtyG6Ib8hAOD5IjgDbwB0AADg9SI4A+EB1gjEIcYhAKD3IgCg9iJpAHagDCLhAagJzyHRIQCg/iIAoP0igAFhb3IA2CHsIfEhcgCAoSYiYXN0AOAh5SHpIWwAbABlAOwAywhsAADg/SrlIADgAiI4A2wiaW50AACgFCrjoYAi9yEAAPohdQDlAJsJY+CvKjgDZaCAIvEAkwkAAkFhaXQHIgoiFyIeInIA8gBsIHIAcgAAoZshY3cRIhQiAOAzKTgDAOCdITgDZyRodGFycm93AACgmyFyAGkA5aDrIr4JgANjaGltcHF1AC8iPCJHIpwhTSJQIloigKGBImNlcgA2Iv0JOSJ1AOUABgoA4DXYw9zvIXJ0bQKdIQAAAABEImEAcgDhAOEhbQBloEEi8aBEIiYKYQDyAMsIcwB1AAABYnBWIlgi5QDUCeUA3wmAAWJjcABgInMieCKAoYQiRWVzAGci7glqIgDgxSo4A2UAdABl4IIi0iBxAPGgiCJoImMAZaCBIvEA/gmAoYUiRWVzAH8iFgqCIgDgxio4A2UAdABl4IMi0iBxAPGgiSKAIgACZ2lscpIilCKaIpwi7AAMCWwAZABlADuA8QDxQOcAWwlpI2FuZ2xlAAABbHKkIqoi5SFmdGWg6iLxAEUJaSJnaHQAZaDrIvEAvgltoL0DAKEjAGVzuCK8InIAbwAAoBYhcAAAoAcggARESGFkZ2lscnMAziLSItYi2iLeIugi7SICIw8j4SFzaACgrSLhIXJyAKAEKXAAAOBNItIg4SFzaACgrCIAAWV04iLlIgDgZSLSIADgPgDSIG4iZmluAACg3imAAUFldADzIvci+iJyAHIAAKACKQDgZCLSIHLgPADSIGkAZQAA4LQi0iAAAUF0BiMKI3IAcgAAoAMp8iFpZQDgtSLSIGkAbQAA4Dwi0iCAAUFhbgAaIx4jKiNyAHIAAKDWIXIAAAFociMjJiNrAACgIylvoJYh9wD/DuUhYXIAoCcpUxJqFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVCMAAF4jaSN/I4IjjSOeI8AUAAAAAKYjwCMAANoj3yMAAO8jHiQvJD8kRCQAAWNzVyNsFHUAdABlADuA8wDzQAABaXlhI2cjcgBjoJoiO4D0APRAPmSAAmFiaW9zAHEjdCN3I3EBeiNzAOgAdhTsIWFjUWF2AACgOCrvIWxkAKC8KewhaWdTYQABY3KFI4kjaQByAACgvykA4DXYLN1vA5QjAAAAAJYjAACcI24A22JhAHYAZQA7gPIA8kAAoMEpAAFibaEjjAphAHIAAKC1KQACYWNpdKwjryO6I70jcgDyAFkUAAFpcrMjtiNyAACgvinvIXNzAKC7KW4A5QDZCgCgwCmAAWFlaQDFI8gjyyNjAHIATWFnAGEAyWOAAWNkbgDRI9Qj1iPyIW9uv2MAoLYpdQDzAHgBcABmAADgNdhg3YABYWVsAOQj5yPrI3IAAKC3KXIAcAAAoLkpdQDzAHwBAKMoImFkaW9zdvkj/CMPJBMkFiQbJHIA8gBeFIChXSplZm0AAyQJJAwkcgBvoDQhZgAAoDQhO4CqAKpAO4C6ALpA5yFvZgCgtiJyAACgVipsIm9wZQAAoFcqAKBbKoABY2xvACMkJSQrJPIACCRhAHMAaAA7gPgA+EBsAACgmCJpAGwBMyQ4JGQAZQA7gPUA9UBlAHMAYaCXInMAAKA2Km0AbAA7gPYA9kDiIWFyAKA9I+EKXiQAAHokAAB8JJQkAACYJKkkAAAAALUkEQsAAPAkAAAAAAQleiUAAIMlcgCAoSUiYXN0AGUkbyQBCwCBtgA7bGokayS2QGwAZQDsABgDaQJ1JAAAAAB4JG0AAKDzKgCg/Sp5AD9kcgCAAmNpbXB0AIUkiCSLJJkSjyRuAHQAJWBvAGQALmBpAGwAAKAwIOUhbmsAoDEgcgAA4DXYLd2AAWltbwCdJKAkpCR2oMYD1WNtAGEA9AD+B24AZQAAoA4m9KHAA64kAAC0JGMjaGZvcmsAAKDUItZjAAFhdbgkxCRuAAABY2u9JMIkawBooA8hAKAOIfYAaRpzAACkKwBhYmNkZW1zdNMkIRPXJNsk4STjJOck6yTjIWlyAKAjKmkAcgAAoCIqAAFvdYsW3yQAoCUqAKByKm4AO4CxALFAaQBtAACgJip3AG8AAKAnKoABaXB1APUk+iT+JO4idGludACgFSpmAADgNdhh3W4AZAA7gKMAo0CApHoiRWFjZWlub3N1ABMlFSUYJRslTCVRJVklSSV1JQCgsypwAACgtyp1AOUAPwtjoK8qgKJ6ImFjZW5zACclLSU0JTYlSSVwAHAAcgBvAPgAFyV1AHIAbAB5AGUA8QA/C/EAOAuAAWFlcwA8JUElRSXwInByb3gAoLkqcQBxAACgtSppAG0AAKDoImkA7QBEC20AZQDzoDIgIguAAUVhcwBDJVclRSXwAEAlgAFkZnAATwtfJXElgAFhbHMAZSVpJW0l7CFhcgCgLiPpIW5lAKASI/UhcmYAoBMjdKAdIu8AWQvyIWVsAKCwIgABY2l9JYElcgAA4DXYxdzIY24iY3NwAACgCCAAA2Zpb3BzdZElKxuVJZolnyWkJXIAAOA12C7dcABmAADgNdhi3XIiaW1lAACgVyBjAHIAAOA12MbcgAFhZW8AqiW6JcAldAAAAWVpryW2JXIAbgBpAG8AbgDzABkFbgB0AACgFipzAHQAZaA/APEACRj0AG0LgApBQkhhYmNkZWZoaWxtbm9wcnN0dXgA4yXyJfYl+iVpJpAmpia9JtUm5ib4JlonaCdxJ3UnnietJ7EnyCfiJ+cngAFhcnQA6SXsJe4lcgDyAJkM8gD6AuEhaWwAoBwpYQByAPIA3BVhAHIAAKBkKYADY2RlbnFydAAGJhAmEyYYJiYmKyZaJgABZXUKJg0mAOA9IjEDdABlAFVhaQDjACAN7SJwdHl2AKCzKWcAgKHpJ2RlbAAgJiImJCYAoJIpAKClKeUA9wt1AG8AO4C7ALtAcgAApZIhYWJjZmhscHN0dz0mQCZFJkcmSiZMJk4mUSZVJlgmcAAAoHUpZqDlIXMAAKAgKQCgMylzAACgHinrALka8ACVHmwAAKBFKWkAbQAAoHQpbAAAoKMhAKCdIQABYWleJmImaQBsAACgGilvAG6gNiJhAGwA8wB2C4ABYWJyAG8mciZ2JnIA8gAvEnIAawAAoHMnAAFha3omgSZjAAABZWt/JoAmfWBdYAABZXOFJocmAKCMKWwAAAFkdYwmjiYAoI4pAKCQKQACYWV1eZcmmiajJqUm8iFvbllhAAFkaZ4moSZpAGwAV2HsAA8M4gCAJkBkAAJjbHFzrSawJrUmuiZhAACgNylkImhhcgAAoGkpdQBvAPKgHSCjAWgAAKCzIYABYWNnAMMm0iaUC2wAgKEcIWlwcwDLJs4migxuAOUAoAxhAHIA9ADaC3QAAKCtJYABaWxyANsm3ybjJvMhaHQAoH0pbwBvAPIANgwA4DXYL90AAWFv6ib1JnIAAAFkde8m8SYAoMEhbKDAIQCgbCl2oMED8WOAAWducwD+Jk4nUCdoAHQAAANhaGxyc3QKJxInISc1Jz0nRydyInJvdwB0oJIhYQDpAFYmYSNycG9vbgAAAWR1GiceJ28AdwDuAPAmcAAAoMAh5SFmdAABYWgnJy0ncgByAG8AdwDzAAkMYQByAHAAbwBvAG4A8wATBGklZ2h0YXJyb3dzAACgySFxAHUAaQBnAGEAcgByAG8A9wBZJugkcmVldGltZXMAoMwiZwDaYmkAbgBnAGQAbwB0AHMAZQDxABwYgAFhaG0AYCdjJ2YncgDyAAkMYQDyABMEAKAPIG8idXN0AGGgsSPjIWhlAKCxI+0haWQAoO4qAAJhYnB0fCeGJ4knmScAAW5ygCeDJ2cAAKDtJ3IAAKD+IXIA6wAcDIABYWZsAI8nkieVJ3IAAKCGKQDgNdhj3XUAcwAAoC4qaSJtZXMAAKA1KgABYXCiJ6gncgBnoCkAdAAAoJQp7yJsaW50AKASKmEAcgDyADwnAAJhY2hxuCe8J6EMwCfxIXVvAKA6IHIAAOA12MfcAAFidYAmxCdvAPKgGSCoAYABaGlyAM4n0ifWJ3IAZQDlAE0n7SFlcwCgyiJpAIChuSVlZmwAXAxjEt4n9CFyaQCgzinsInVoYXIAoGgpAKAeIWENBSgJKA0oSyhVKIYoAACLKLAoAAAAAOMo5ygAABApJCkxKW0pcSmHKaYpAACYKgAAAACxKmMidXRlAFthcQB1AO8ABR+ApHsiRWFjZWlucHN5ABwoHignKCooLygyKEEoRihJKACgtCrwASMoAAAlKACguCpvAG4AYWF1AOUAgw1koLAqaQBsAF9hcgBjAF1hgAFFYXMAOCg6KD0oAKC2KnAAAKC6KmkAbQAAoOki7yJsaW50AKATKmkA7QCIDUFkbwB0AGKixSKRFgAAAABTKACgZiqAA0FhY21zdHgAYChkKG8ocyh1KHkogihyAHIAAKDYIXIAAAFocmkoayjrAJAab6CYIfcAzAd0ADuApwCnQGkAO2D3IWFyAKApKW0AAAFpbn4ozQBuAHUA8wDOAHQAAKA2J3IA7+A12DDdIxkAAmFjb3mRKJUonSisKHIAcAAAoG8mAAFoeZkonChjAHkASWRIZHIAdABtAqUoAAAAAKgoaQDkAFsPYQByAGEA7ABsJDuArQCtQAABZ22zKLsobQBhAAChwwNmdroouijCY4CjPCJkZWdsbnByAMgozCjPKNMo1yjaKN4obwB0AACgairxoEMiCw5FoJ4qAKCgKkWgnSoAoJ8qZQAAoEYi7CF1cwCgJCrhIXJyAKByKWEAcgDyAPwMAAJhZWl07Sj8KAEpCCkAAWxz8Sj4KGwAcwBlAHQAbQDpAH8oaABwAACgMyrwImFyc2wAoOQpAAFkbFoPBSllAACgIyNloKoqc6CsKgDgrCoA/oABZmxwABUpGCkfKfQhY3lMZGKgLwBhoMQpcgAAoD8jZgAA4DXYZN1hAAABZHIoKRcDZQBzAHWgYCZpAHQAAKBgJoABY3N1ADYpRilhKQABYXU6KUApcABzoJMiAOCTIgD+cABzoJQiAOCUIgD+dQAAAWJwSylWKQChjyJlcz4NUCllAHQAZaCPIvEAPw0AoZAiZXNIDVspZQB0AGWgkCLxAEkNAKGhJWFmZilbBHIAZQFrKVwEAKChJWEAcgDyAAMNAAJjZW10dyl7KX8pgilyAADgNdjI3HQAbQDuAM4AaQDsAAYpYQByAOYAVw0AAWFyiimOKXIA5qAGJhESAAFhbpIpoylpImdodAAAAWVwmSmgKXAAcwBpAGwAbwDuANkXaADpAKAkcwCvYIACYmNtbnAArin8KY4NJSooKgCkgiJFZGVtbnByc7wpvinCKcgpzCnUKdgp3CkAoMUqbwB0AACgvSpkoIYibwB0AACgwyr1IWx0AKDBKgABRWXQKdIpAKDLKgCgiiLsIXVzAKC/KuEhcnIAoHkpgAFlaXUA4inxKfQpdAAAoYIiZW7oKewpcQDxoIYivSllAHEA8aCKItEpbQAAoMcqAAFicPgp+ikAoNUqAKDTKmMAgKJ7ImFjZW5zAAcqDSoUKhYqRihwAHAAcgBvAPgAIyh1AHIAbAB5AGUA8QCDDfEAfA2AAWFlcwAcKiIqPShwAHAAcgBvAPgAPChxAPEAOShnAACgaiYApoMiMTIzRWRlaGxtbnBzPCo/KkIqRSpHKlIqWCpjKmcqaypzKncqO4C5ALlAO4CyALJAO4CzALNAAKDGKgABb3NLKk4qdAAAoL4qdQBiAACg2CpkoIcibwB0AACgxCpzAAABb3VdKmAqbAAAoMknYgAAoNcq4SFycgCgeyn1IWx0AKDCKgABRWVvKnEqAKDMKgCgiyLsIXVzAKDAKoABZWl1AH0qjCqPKnQAAKGDImVugyqHKnEA8aCHIkYqZQBxAPGgiyJwKm0AAKDIKgABYnCTKpUqAKDUKgCg1iqAAUFhbgCdKqEqrCpyAHIAAKDZIXIAAAFocqYqqCrrAJUab6CZIfcAxQf3IWFyAKAqKWwAaQBnADuA3wDfQOELzyrZKtwq6SrsKvEqAAD1KjQrAAAAAAAAAAAAAEwrbCsAAHErvSsAAAAAAADRK3IC1CoAAAAA2CrnIWV0AKAWI8RjcgDrAOUKgAFhZXkA4SrkKucq8iFvbmVh5CFpbGNhQmRvAPQAIg5sInJlYwAAoBUjcgAA4DXYMd0AAmVpa2/7KhIrKCsuK/IBACsAAAkrZQAAATRm6g0EK28AcgDlAOsNYQBzorgDECsAAAAAEit5AG0A0WMAAWNuFislK2sAAAFhcxsrIStwAHAAcgBvAPgAFw5pAG0AAKA8InMA8AD9DQABYXMsKyEr8AAXDnIAbgA7gP4A/kDsATgrOyswG2QA5QBnAmUAcwCAgdcAO2JkAEMrRCtJK9dAYaCgInIAAKAxKgCgMCqAAWVwcwBRK1MraSvhAAkh4qKkIlsrXysAAAAAYytvAHQAAKA2I2kAcgAAoPEqb+A12GXdcgBrAACg2irhAHgociJpbWUAAKA0IIABYWlwAHYreSu3K2QA5QC+DYADYWRlbXBzdACFK6MrmiunK6wrsCuzK24iZ2xlAACitSVkbHFykCuUK5ornCvvIXduAKC/JeUhZnRloMMl8QACBwCgXCJpImdodABloLkl8QBdDG8AdAAAoOwlaSJudXMAAKA6KuwhdXMAoDkqYgAAoM0p6SFtZQCgOyrlInppdW0AoOIjgAFjaHQAwivKK80rAAFyecYrySsA4DXYydxGZGMAeQBbZPIhb2tnYQABaW/UK9creAD0ANERaCJlYWQAAAFsct4r5ytlAGYAdABhAHIAcgBvAPcAXQbpJGdodGFycm93AKCgIQAJQUhhYmNkZmdobG1vcHJzdHV3CiwNLBEsHSwnLDEsQCxLLFIsYix6LIQsjyzLLOgs7Sz/LAotcgDyAAkDYQByAACgYykAAWNyFSwbLHUAdABlADuA+gD6QPIACQ1yAOMBIywAACUseQBeZHYAZQBtYQABaXkrLDAscgBjADuA+wD7QENkgAFhYmgANyw6LD0scgDyANEO7CFhY3FhYQDyAOAOAAFpckQsSCzzIWh0AKB+KQDgNdgy3XIAYQB2AGUAO4D5APlAYQFWLF8scgAAAWxyWixcLACgvyEAoL4hbABrAACggCUAAWN0Zix2LG8CbCwAAAAAcyxyAG4AZaAcI3IAAKAcI28AcAAAoA8jcgBpAACg+CUAAWFsfiyBLGMAcgBrYTuAqACoQAABZ3CILIssbwBuAHNhZgAA4DXYZt0AA2FkaGxzdZksniynLLgsuyzFLHIAcgBvAPcACQ1vAHcAbgBhAHIAcgBvAPcA2A5hI3Jwb29uAAABbHKvLLMsZQBmAPQAWyxpAGcAaAD0AF0sdQDzAKYOaQAAocUDaGzBLMIs0mNvAG4AxWPwI2Fycm93cwCgyCGAAWNpdADRLOEs5CxvAtcsAAAAAN4scgBuAGWgHSNyAACgHSNvAHAAAKAOI24AZwBvYXIAaQAAoPklYwByAADgNdjK3IABZGlyAPMs9yz6LG8AdAAAoPAi7CFkZWlhaQBmoLUlAKC0JQABYW0DLQYtcgDyAMosbAA7gPwA/EDhIm5nbGUAoKcpgAdBQkRhY2RlZmxub3Byc3oAJy0qLTAtNC2bLZ0toS2/LcMtxy3TLdgt3C3gLfwtcgDyABADYQByAHag6CoAoOkqYQBzAOgA/gIAAW5yOC08LechcnQAoJwpgANla25wcnN0AJkpSC1NLVQtXi1iLYItYQBwAHAA4QAaHG8AdABoAGkAbgDnAKEXgAFoaXIAoSmzJFotbwBwAPQAdCVooJUh7wD4JgABaXVmLWotZwBtAOEAuygAAWJwbi14LXMjZXRuZXEAceCKIgD+AODLKgD+cyNldG5lcQBx4IsiAP4A4MwqAP4AAWhyhi2KLWUAdADhABIraSNhbmdsZQAAAWxyki2WLeUhZnQAoLIiaSJnaHQAAKCzInkAMmThIXNoAKCiIoABZWxyAKcttC24LWKiKCKuLQAAAACyLWEAcgAAoLsicQAAoFoi7CFpcACg7iIAAWJ0vC1eD2EA8gBfD3IAAOA12DPddAByAOkAlS1zAHUAAAFicM0t0C0A4IIi0iAA4IMi0iBwAGYAAOA12GfdcgBvAPAAWQt0AHIA6QCaLQABY3XkLegtcgAA4DXYy9wAAWJw7C30LW4AAAFFZXUt8S0A4IoiAP5uAAABRWV/LfktAOCLIgD+6SJnemFnAKCaKYADY2Vmb3BycwANLhAuJS4pLiMuLi40LukhcmN1YQABZGkULiEuAAFiZxguHC5hAHIAAKBfKmUAcaAnIgCgWSLlIXJwAKAYIXIAAOA12DTdcABmAADgNdho3WWgQCJhAHQA6ABqD2MAcgAA4DXYzNzjCuQRUC4AAFQuAABYLmIuAAAAAGMubS5wLnQuAAAAAIguki4AAJouJxIqEnQAcgDpAB0ScgAA4DXYNd0AAUFhWy5eLnIA8gDnAnIA8gCTB75jAAFBYWYuaS5yAPIA4AJyAPIAjAdhAPAAeh5pAHMAAKD7IoABZHB0APgReS6DLgABZmx9LoAuAOA12GnddQDzAP8RaQBtAOUABBIAAUFhiy6OLnIA8gDuAnIA8gCaBwABY3GVLgoScgAA4DXYzdwAAXB0nS6hLmwAdQDzACUScgDpACASAARhY2VmaW9zdbEuvC7ELsguzC7PLtQu2S5jAAABdXm2LrsudABlADuA/QD9QE9kAAFpecAuwy5yAGMAd2FLZG4AO4ClAKVAcgAA4DXYNt1jAHkAV2RwAGYAAOA12GrdYwByAADgNdjO3AABY23dLt8ueQBOZGwAO4D/AP9AAAVhY2RlZmhpb3N38y73Lv8uAi8MLxAvEy8YLx0vIi9jInV0ZQB6YQABYXn7Lv4u8iFvbn5hN2RvAHQAfGEAAWV0Bi8KL3QAcgDmAB8QYQC2Y3IAAOA12DfdYwB5ADZk5yJyYXJyAKDdIXAAZgAA4DXYa91jAHIAAOA12M/cAAFqbiYvKC8AoA0gagAAoAwg");

// node_modules/entities/dist/esm/internal/bin-trie-flags.js
var BinTrieFlags;
(function(BinTrieFlags) {
  BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
  BinTrieFlags[BinTrieFlags["FLAG13"] = 8192] = "FLAG13";
  BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 8064] = "BRANCH_LENGTH";
  BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
})(BinTrieFlags || (BinTrieFlags = {}));

// node_modules/entities/dist/esm/decode.js
var CharCodes;
(function(CharCodes) {
  CharCodes[CharCodes["NUM"] = 35] = "NUM";
  CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
  CharCodes[CharCodes["EQUALS"] = 61] = "EQUALS";
  CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
  CharCodes[CharCodes["NINE"] = 57] = "NINE";
  CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
  CharCodes[CharCodes["LOWER_F"] = 102] = "LOWER_F";
  CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
  CharCodes[CharCodes["LOWER_Z"] = 122] = "LOWER_Z";
  CharCodes[CharCodes["UPPER_A"] = 65] = "UPPER_A";
  CharCodes[CharCodes["UPPER_F"] = 70] = "UPPER_F";
  CharCodes[CharCodes["UPPER_Z"] = 90] = "UPPER_Z";
})(CharCodes || (CharCodes = {}));
var TO_LOWER_BIT = 32;
function isNumber(code) {
  return code >= CharCodes.ZERO && code <= CharCodes.NINE;
}
function isHexadecimalCharacter(code) {
  return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F;
}
function isAsciiAlphaNumeric(code) {
  return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z || isNumber(code);
}
function isEntityInAttributeInvalidEnd(code) {
  return code === CharCodes.EQUALS || isAsciiAlphaNumeric(code);
}
var EntityDecoderState;
(function(EntityDecoderState) {
  EntityDecoderState[EntityDecoderState["EntityStart"] = 0] = "EntityStart";
  EntityDecoderState[EntityDecoderState["NumericStart"] = 1] = "NumericStart";
  EntityDecoderState[EntityDecoderState["NumericDecimal"] = 2] = "NumericDecimal";
  EntityDecoderState[EntityDecoderState["NumericHex"] = 3] = "NumericHex";
  EntityDecoderState[EntityDecoderState["NamedEntity"] = 4] = "NamedEntity";
})(EntityDecoderState || (EntityDecoderState = {}));
var DecodingMode;
(function(DecodingMode) {
  DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
  DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
  DecodingMode[DecodingMode["Attribute"] = 2] = "Attribute";
})(DecodingMode || (DecodingMode = {}));

class EntityDecoder {
  constructor(decodeTree, emitCodePoint, errors) {
    this.decodeTree = decodeTree;
    this.emitCodePoint = emitCodePoint;
    this.errors = errors;
    this.state = EntityDecoderState.EntityStart;
    this.consumed = 1;
    this.result = 0;
    this.treeIndex = 0;
    this.excess = 1;
    this.decodeMode = DecodingMode.Strict;
    this.runConsumed = 0;
  }
  startEntity(decodeMode) {
    this.decodeMode = decodeMode;
    this.state = EntityDecoderState.EntityStart;
    this.result = 0;
    this.treeIndex = 0;
    this.excess = 1;
    this.consumed = 1;
    this.runConsumed = 0;
  }
  write(input, offset) {
    switch (this.state) {
      case EntityDecoderState.EntityStart: {
        if (input.charCodeAt(offset) === CharCodes.NUM) {
          this.state = EntityDecoderState.NumericStart;
          this.consumed += 1;
          return this.stateNumericStart(input, offset + 1);
        }
        this.state = EntityDecoderState.NamedEntity;
        return this.stateNamedEntity(input, offset);
      }
      case EntityDecoderState.NumericStart: {
        return this.stateNumericStart(input, offset);
      }
      case EntityDecoderState.NumericDecimal: {
        return this.stateNumericDecimal(input, offset);
      }
      case EntityDecoderState.NumericHex: {
        return this.stateNumericHex(input, offset);
      }
      case EntityDecoderState.NamedEntity: {
        return this.stateNamedEntity(input, offset);
      }
    }
  }
  stateNumericStart(input, offset) {
    if (offset >= input.length) {
      return -1;
    }
    if ((input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
      this.state = EntityDecoderState.NumericHex;
      this.consumed += 1;
      return this.stateNumericHex(input, offset + 1);
    }
    this.state = EntityDecoderState.NumericDecimal;
    return this.stateNumericDecimal(input, offset);
  }
  stateNumericHex(input, offset) {
    while (offset < input.length) {
      const char = input.charCodeAt(offset);
      if (isNumber(char) || isHexadecimalCharacter(char)) {
        const digit = char <= CharCodes.NINE ? char - CharCodes.ZERO : (char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10;
        this.result = this.result * 16 + digit;
        this.consumed++;
        offset++;
      } else {
        return this.emitNumericEntity(char, 3);
      }
    }
    return -1;
  }
  stateNumericDecimal(input, offset) {
    while (offset < input.length) {
      const char = input.charCodeAt(offset);
      if (isNumber(char)) {
        this.result = this.result * 10 + (char - CharCodes.ZERO);
        this.consumed++;
        offset++;
      } else {
        return this.emitNumericEntity(char, 2);
      }
    }
    return -1;
  }
  emitNumericEntity(lastCp, expectedLength) {
    var _a;
    if (this.consumed <= expectedLength) {
      (_a = this.errors) === null || _a === undefined || _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
      return 0;
    }
    if (lastCp === CharCodes.SEMI) {
      this.consumed += 1;
    } else if (this.decodeMode === DecodingMode.Strict) {
      return 0;
    }
    this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
    if (this.errors) {
      if (lastCp !== CharCodes.SEMI) {
        this.errors.missingSemicolonAfterCharacterReference();
      }
      this.errors.validateNumericCharacterReference(this.result);
    }
    return this.consumed;
  }
  stateNamedEntity(input, offset) {
    const { decodeTree } = this;
    let current = decodeTree[this.treeIndex];
    let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
    while (offset < input.length) {
      if (valueLength === 0 && (current & BinTrieFlags.FLAG13) !== 0) {
        const runLength = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
        if (this.runConsumed === 0) {
          const firstChar = current & BinTrieFlags.JUMP_TABLE;
          if (input.charCodeAt(offset) !== firstChar) {
            return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
          }
          offset++;
          this.excess++;
          this.runConsumed++;
        }
        while (this.runConsumed < runLength) {
          if (offset >= input.length) {
            return -1;
          }
          const charIndexInPacked = this.runConsumed - 1;
          const packedWord = decodeTree[this.treeIndex + 1 + (charIndexInPacked >> 1)];
          const expectedChar = charIndexInPacked % 2 === 0 ? packedWord & 255 : packedWord >> 8 & 255;
          if (input.charCodeAt(offset) !== expectedChar) {
            this.runConsumed = 0;
            return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
          }
          offset++;
          this.excess++;
          this.runConsumed++;
        }
        this.runConsumed = 0;
        this.treeIndex += 1 + (runLength >> 1);
        current = decodeTree[this.treeIndex];
        valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
      }
      if (offset >= input.length)
        break;
      const char = input.charCodeAt(offset);
      if (char === CharCodes.SEMI && valueLength !== 0 && (current & BinTrieFlags.FLAG13) !== 0) {
        return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
      }
      this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
      if (this.treeIndex < 0) {
        return this.result === 0 || this.decodeMode === DecodingMode.Attribute && (valueLength === 0 || isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
      }
      current = decodeTree[this.treeIndex];
      valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
      if (valueLength !== 0) {
        if (char === CharCodes.SEMI) {
          return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
        }
        if (this.decodeMode !== DecodingMode.Strict && (current & BinTrieFlags.FLAG13) === 0) {
          this.result = this.treeIndex;
          this.consumed += this.excess;
          this.excess = 0;
        }
      }
      offset++;
      this.excess++;
    }
    return -1;
  }
  emitNotTerminatedNamedEntity() {
    var _a;
    const { result, decodeTree } = this;
    const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
    this.emitNamedEntityData(result, valueLength, this.consumed);
    (_a = this.errors) === null || _a === undefined || _a.missingSemicolonAfterCharacterReference();
    return this.consumed;
  }
  emitNamedEntityData(result, valueLength, consumed) {
    const { decodeTree } = this;
    this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~(BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13) : decodeTree[result + 1], consumed);
    if (valueLength === 3) {
      this.emitCodePoint(decodeTree[result + 2], consumed);
    }
    return consumed;
  }
  end() {
    var _a;
    switch (this.state) {
      case EntityDecoderState.NamedEntity: {
        return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
      }
      case EntityDecoderState.NumericDecimal: {
        return this.emitNumericEntity(0, 2);
      }
      case EntityDecoderState.NumericHex: {
        return this.emitNumericEntity(0, 3);
      }
      case EntityDecoderState.NumericStart: {
        (_a = this.errors) === null || _a === undefined || _a.absenceOfDigitsInNumericCharacterReference(this.consumed);
        return 0;
      }
      case EntityDecoderState.EntityStart: {
        return 0;
      }
    }
  }
}
function getDecoder(decodeTree) {
  let returnValue = "";
  const decoder = new EntityDecoder(decodeTree, (data) => returnValue += fromCodePoint(data));
  return function decodeWithTrie(input, decodeMode) {
    let lastIndex = 0;
    let offset = 0;
    while ((offset = input.indexOf("&", offset)) >= 0) {
      returnValue += input.slice(lastIndex, offset);
      decoder.startEntity(decodeMode);
      const length = decoder.write(input, offset + 1);
      if (length < 0) {
        lastIndex = offset + decoder.end();
        break;
      }
      lastIndex = offset + length;
      offset = length === 0 ? lastIndex + 1 : lastIndex;
    }
    const result = returnValue + input.slice(lastIndex);
    returnValue = "";
    return result;
  };
}
function determineBranch(decodeTree, current, nodeIndex, char) {
  const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
  const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
  if (branchCount === 0) {
    return jumpOffset !== 0 && char === jumpOffset ? nodeIndex : -1;
  }
  if (jumpOffset) {
    const value = char - jumpOffset;
    return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIndex + value] - 1;
  }
  const packedKeySlots = branchCount + 1 >> 1;
  let lo = 0;
  let hi = branchCount - 1;
  while (lo <= hi) {
    const mid = lo + hi >>> 1;
    const slot = mid >> 1;
    const packed = decodeTree[nodeIndex + slot];
    const midKey = packed >> (mid & 1) * 8 & 255;
    if (midKey < char) {
      lo = mid + 1;
    } else if (midKey > char) {
      hi = mid - 1;
    } else {
      return decodeTree[nodeIndex + packedKeySlots + mid];
    }
  }
  return -1;
}
var htmlDecoder = /* @__PURE__ */ getDecoder(htmlDecodeTree);
function decodeHTMLStrict(htmlString) {
  return htmlDecoder(htmlString, DecodingMode.Strict);
}
// node_modules/entities/dist/esm/index.js
var EntityLevel;
(function(EntityLevel) {
  EntityLevel[EntityLevel["XML"] = 0] = "XML";
  EntityLevel[EntityLevel["HTML"] = 1] = "HTML";
})(EntityLevel || (EntityLevel = {}));
var EncodingMode;
(function(EncodingMode) {
  EncodingMode[EncodingMode["UTF8"] = 0] = "UTF8";
  EncodingMode[EncodingMode["ASCII"] = 1] = "ASCII";
  EncodingMode[EncodingMode["Extensive"] = 2] = "Extensive";
  EncodingMode[EncodingMode["Attribute"] = 3] = "Attribute";
  EncodingMode[EncodingMode["Text"] = 4] = "Text";
})(EncodingMode || (EncodingMode = {}));

// node_modules/opentui-markdown-render/src/merman/core/mermaid.ts
function* numberedMermaidLines(content) {
  const lines = content.split(/\r?\n/);
  for (let index = 0;index < lines.length; index += 1) {
    yield { lineNumber: index + 1, text: lines[index].trim() };
  }
}
function* meaningfulNumberedMermaidLines(content) {
  for (const line of numberedMermaidLines(content)) {
    if (line.text && !line.text.startsWith("%%"))
      yield line;
  }
}
function firstMeaningfulMermaidLine(content) {
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line && !line.startsWith("%%"))
      return line;
  }
  return;
}
function stripMermaidQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"') || trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return decodeMermaidText(trimmed.slice(1, -1));
  }
  return decodeMermaidText(trimmed);
}
function decodeMermaidText(value) {
  return decodeHTMLStrict(value);
}

// node_modules/opentui-markdown-render/src/merman/diagnostics.ts
class MermaidSyntaxError extends Error {
  kind;
  lineNumber;
  sourceLine;
  _tag = "MermaidSyntaxError";
  constructor(kind, lineNumber, sourceLine, reason = "Unsupported syntax") {
    super(`${reason} in ${kind} diagram at line ${lineNumber}: "${sourceLine}"`);
    this.kind = kind;
    this.lineNumber = lineNumber;
    this.sourceLine = sourceLine;
    this.name = "MermaidSyntaxError";
  }
}

// node_modules/opentui-markdown-render/src/merman/class/parser.ts
var HEADER_RE = /^classDiagram(?:\s+(TB|BT|LR|RL))?$/i;
var DIRECTION_RE = /^direction\s+(TB|BT|LR|RL)$/i;
var ACCESSIBILITY_RE = /^acc(?:Title|Descr)(?::|\s|$)/i;
var CLASS_NAME_RE = /^[A-Za-z0-9_][A-Za-z0-9_.\-~]*$/;
var ANNOTATION_RE = /^<<(.+?)>>\s+(.+)$/;
var STEREOTYPE_ONLY_RE = /^<<(.+?)>>$/;
var CLASS_LABEL_RE = /^([A-Za-z0-9_][A-Za-z0-9_.\-~]*)\s*\[(["'])(.+)\2\]$/;
var CLASS_NOTE_RE = /^note\s+for\s+(\S+)\s+(["'])(.+)\2$/i;
var RELATIONSHIP_OPERATOR_LIST = [
  { token: "<|--", kind: "inheritance", headAt: "from", dashed: false },
  { token: "--|>", kind: "inheritance", headAt: "to", dashed: false },
  { token: "<|..", kind: "realization", headAt: "from", dashed: true },
  { token: "..|>", kind: "realization", headAt: "to", dashed: true },
  { token: "*--", kind: "composition", headAt: "from", dashed: false },
  { token: "--*", kind: "composition", headAt: "to", dashed: false },
  { token: "o--", kind: "aggregation", headAt: "from", dashed: false },
  { token: "--o", kind: "aggregation", headAt: "to", dashed: false },
  { token: "-->", kind: "association", headAt: "to", dashed: false },
  { token: "<--", kind: "association", headAt: "from", dashed: false },
  { token: "..>", kind: "dependency", headAt: "to", dashed: true },
  { token: "<..", kind: "dependency", headAt: "from", dashed: true },
  { token: "--", kind: "link", headAt: "none", dashed: false },
  { token: "..", kind: "link", headAt: "none", dashed: true }
];
var RELATIONSHIP_OPERATORS = [...RELATIONSHIP_OPERATOR_LIST].sort((left, right) => right.token.length - left.token.length);
function isMermaidClassDiagram(content) {
  return HEADER_RE.test(firstMeaningfulMermaidLine(content) ?? "");
}
function parseMermaidClassDiagram(content) {
  const firstLine = firstMeaningfulMermaidLine(content);
  if (!HEADER_RE.test(firstLine ?? ""))
    throw syntaxError(1, firstLine ?? "", "Class diagram header is required");
  const classes = [];
  const byId = new Map;
  const relationships = [];
  let direction = "TB";
  let current;
  let inAccessibilityDescription = false;
  let lastLineNumber = 1;
  let lastLineText = firstLine ?? "";
  const ensureClass = (id) => {
    let definition = byId.get(id);
    if (!definition) {
      definition = { id, members: [] };
      byId.set(id, definition);
      classes.push(definition);
    }
    return definition;
  };
  for (const source of meaningfulNumberedMermaidLines(content)) {
    lastLineNumber = source.lineNumber;
    const line = stripComment(source.text);
    lastLineText = line;
    if (inAccessibilityDescription) {
      if (line === "}")
        inAccessibilityDescription = false;
      continue;
    }
    if (/^accDescr\s*\{$/i.test(line)) {
      inAccessibilityDescription = true;
      continue;
    }
    if (!line || ACCESSIBILITY_RE.test(line))
      continue;
    if (current) {
      if (line === "}") {
        current = undefined;
        continue;
      }
      const stereotype = line.match(STEREOTYPE_ONLY_RE);
      if (stereotype) {
        setStereotype(current, stereotype[1], source.lineNumber, line);
        continue;
      }
      current.members.push(parseMember(line));
      continue;
    }
    const header = line.match(HEADER_RE);
    if (header) {
      direction = header[1]?.toUpperCase() ?? direction;
      continue;
    }
    const directionMatch = line.match(DIRECTION_RE);
    if (directionMatch) {
      direction = directionMatch[1].toUpperCase();
      continue;
    }
    const noteMatch = line.match(CLASS_NOTE_RE);
    if (noteMatch) {
      const id = normalizeClassName(noteMatch[1]);
      if (!id)
        throw syntaxError(source.lineNumber, line, "Class note target is not a valid class name");
      const definition = ensureClass(id);
      definition.notes ??= [];
      definition.notes.push(stripMermaidQuotes(noteMatch[2] + noteMatch[3] + noteMatch[2]));
      continue;
    }
    const annotation = line.match(ANNOTATION_RE);
    if (annotation) {
      const id = normalizeClassName(annotation[2]);
      if (!id)
        throw syntaxError(source.lineNumber, line, "Class annotation target is not a valid class name");
      setStereotype(ensureClass(id), annotation[1], source.lineNumber, line);
      continue;
    }
    const classMatch = line.match(/^class\s+(.+)$/i);
    if (classMatch) {
      let raw = classMatch[1].trim();
      let openBody = false;
      if (raw.endsWith("{")) {
        openBody = true;
        raw = raw.slice(0, -1).trim();
      }
      const labelMatch = raw.match(CLASS_LABEL_RE);
      const id = normalizeClassName(labelMatch?.[1] ?? raw);
      if (!id)
        throw syntaxError(source.lineNumber, line, "Class name is not valid");
      const definition = ensureClass(id);
      if (labelMatch)
        definition.label = stripMermaidQuotes(labelMatch[2] + labelMatch[3] + labelMatch[2]);
      if (openBody)
        current = definition;
      continue;
    }
    const found = findOperator(line);
    if (found) {
      relationships.push(parseRelationship(line, found.operator, found.index, source.lineNumber, ensureClass));
      continue;
    }
    const colon = line.indexOf(":");
    if (colon > 0) {
      const id = normalizeClassName(line.slice(0, colon));
      if (id) {
        const right = line.slice(colon + 1).trim();
        const stereotype = right.match(STEREOTYPE_ONLY_RE);
        if (stereotype)
          setStereotype(ensureClass(id), stereotype[1], source.lineNumber, line);
        else if (right)
          ensureClass(id).members.push(parseMember(right));
        continue;
      }
    }
    throw syntaxError(source.lineNumber, line, unsupportedReason(line));
  }
  if (current)
    throw syntaxError(lastLineNumber, lastLineText, "Unclosed class body");
  return { direction, classes, relationships };
}
function parseMember(text) {
  const value = text.trim();
  return { text: value, method: value.includes("(") && value.includes(")") };
}
function setStereotype(definition, stereotype, lineNumber, line) {
  const value = stereotype.trim();
  if (!value)
    throw syntaxError(lineNumber, line, "Class stereotype cannot be empty");
  definition.stereotype = value;
}
function findOperator(line) {
  let quote;
  for (let index = 0;index < line.length; index++) {
    const char = line[index];
    if (char === '"' || char === "'") {
      if (quote === undefined)
        quote = char;
      else if (quote === char)
        quote = undefined;
      continue;
    }
    if (quote !== undefined)
      continue;
    for (const operator of RELATIONSHIP_OPERATORS) {
      if (line.startsWith(operator.token, index))
        return { operator, index };
    }
  }
  return;
}
function parseRelationship(line, operator, index, lineNumber, ensureClass) {
  const leftRaw = line.slice(0, index).trim();
  const rightRaw = line.slice(index + operator.token.length).trim();
  let targetPart = rightRaw;
  let label;
  const colon = rightRaw.indexOf(":");
  if (colon >= 0) {
    targetPart = rightRaw.slice(0, colon).trim();
    label = stripMermaidQuotes(rightRaw.slice(colon + 1).trim()) || undefined;
  }
  const from = splitSourceCardinality(leftRaw);
  const to = splitTargetCardinality(targetPart);
  if (!from.name)
    throw syntaxError(lineNumber, line, "Relationship source is missing");
  if (!to.name)
    throw syntaxError(lineNumber, line, "Relationship target is missing");
  const fromId = normalizeClassName(from.name);
  const toId = normalizeClassName(to.name);
  if (!fromId)
    throw syntaxError(lineNumber, line, "Relationship source is not a valid class name");
  if (!toId)
    throw syntaxError(lineNumber, line, "Relationship target is not a valid class name");
  ensureClass(fromId);
  ensureClass(toId);
  return {
    from: fromId,
    to: toId,
    kind: operator.kind,
    headAt: operator.headAt,
    dashed: operator.dashed,
    ...label === undefined ? {} : { label },
    ...from.cardinality === undefined ? {} : { fromCardinality: from.cardinality },
    ...to.cardinality === undefined ? {} : { toCardinality: to.cardinality }
  };
}
function splitSourceCardinality(value) {
  const match = value.match(/^(.*?)\s*(?:"([^"]*)"|'([^']*)')$/);
  if (match?.[1]?.trim())
    return { name: match[1].trim(), cardinality: match[2] ?? match[3] };
  return { name: value };
}
function splitTargetCardinality(value) {
  const match = value.match(/^(?:"([^"]*)"|'([^']*)')\s+(.+)$/);
  if (match)
    return { name: match[3].trim(), cardinality: match[1] ?? match[2] };
  return { name: value };
}
function normalizeClassName(raw) {
  const trimmed = raw.trim();
  if (!trimmed)
    return;
  const quoted = trimmed.startsWith('"') && trimmed.endsWith('"') || trimmed.startsWith("'") && trimmed.endsWith("'");
  if (quoted) {
    const value = trimmed.slice(1, -1).trim();
    return value || undefined;
  }
  return CLASS_NAME_RE.test(trimmed) ? trimmed : undefined;
}
function stripComment(value) {
  let quote;
  for (let index = 0;index < value.length - 1; index += 1) {
    const char = value[index];
    if ((char === '"' || char === "'") && (quote === undefined || quote === char)) {
      quote = quote === char ? undefined : char;
      continue;
    }
    if (quote === undefined && char === "%" && value[index + 1] === "%")
      return value.slice(0, index).trim();
  }
  return value.trim();
}
function unsupportedReason(line) {
  const keyword = line.split(/[\s:{]/, 1)[0]?.toLowerCase() ?? "";
  switch (keyword) {
    case "note":
      return "Standalone class diagram notes are not supported";
    case "namespace":
      return "Class diagram namespaces are not supported";
    case "package":
      return "Class diagram packages are not supported";
    case "click":
    case "link":
    case "callback":
      return "Class diagram hyperlinks are not supported";
    case "style":
    case "classdef":
    case "cssclass":
      return "Class diagram styling is not supported";
    default:
      return "Unsupported class diagram syntax";
  }
}
function syntaxError(lineNumber, sourceLine, reason) {
  return new MermaidSyntaxError("classDiagram", lineNumber, sourceLine, reason);
}

// node_modules/opentui-markdown-render/src/merman/core/render-grid.ts
import { StyledText as StyledText2 } from "@opentui/core";
function renderDiagramGridStyledText(grid, fg, bg, options) {
  const chunks = [];
  grid.forEachRun((run) => {
    chunks.push({
      __isChunk: true,
      text: run.text,
      fg: fg(run),
      bg: bg?.(run),
      attributes: options?.attributes?.(run)
    });
  }, () => {
    chunks.push({ __isChunk: true, text: `
` });
  }, options);
  return new StyledText2(chunks);
}
function renderDiagramGridStyledTextByStyle(grid, foregrounds, backgrounds, options) {
  const background = backgrounds && Object.values(backgrounds).some((value) => value !== undefined) ? (run) => run.style ? backgrounds[run.style] : undefined : undefined;
  return renderDiagramGridStyledText(grid, (run) => run.style ? foregrounds[run.style] : undefined, background, options);
}

// node_modules/opentui-markdown-render/src/merman/class/render-grid.ts
function renderClassGridStyledText(grid, colors) {
  return renderDiagramGridStyledText(grid, (run) => run.style ? colors[run.style] : undefined, undefined, {
    trimTop: true,
    trimBottom: true
  });
}

// node_modules/opentui-markdown-render/src/merman/core/color/style.ts
import { RGBA as RGBA3 } from "@opentui/core";
var DIAGRAM_FADE_STEPS = [1, 2, 3, 4, 5];
function numberedStyleKeys(prefix, steps) {
  return steps.map((step) => `${prefix}${step}`);
}
function rgba(rgb) {
  return RGBA3.fromInts(rgb[0], rgb[1], rgb[2], 255);
}
function blendColor(from, to, amount) {
  if (!from && !to)
    return;
  if (!from)
    return to;
  if (!to)
    return from;
  const [fromR, fromG, fromB, fromA] = from.toInts();
  const [toR, toG, toB, toA] = to.toInts();
  const mix = (left, right) => left + (right - left) * amount;
  return RGBA3.fromInts(mix(fromR, toR), mix(fromG, toG), mix(fromB, toB), mix(fromA, toA));
}
function createColorRampTheme(styles, from, to) {
  return Object.fromEntries(styles.map((style, index) => [style, blendColor(from, to, (index + 1) / (styles.length + 1))]));
}

// node_modules/opentui-markdown-render/src/merman/class/style.ts
var DEFAULT_THEME_RGB = {
  border: [141, 169, 155],
  title: [228, 239, 232],
  stereotype: [154, 184, 169],
  member: [215, 229, 221],
  edge: [134, 225, 200],
  label: [134, 225, 200]
};
function resolveClassStyleColors(colors = {}) {
  return {
    border: colors.border ?? rgba(DEFAULT_THEME_RGB.border),
    title: colors.title ?? rgba(DEFAULT_THEME_RGB.title),
    stereotype: colors.stereotype ?? colors.title ?? rgba(DEFAULT_THEME_RGB.stereotype),
    member: colors.member ?? rgba(DEFAULT_THEME_RGB.member),
    edge: colors.edge ?? rgba(DEFAULT_THEME_RGB.edge),
    label: colors.label ?? colors.edge ?? rgba(DEFAULT_THEME_RGB.label)
  };
}

// node_modules/opentui-markdown-render/src/merman/flowchart/parser.ts
var DEFAULT_DIRECTION = "TD";
var FLOWCHART_HEADER_RE = /^(flowchart|graph)(?:\s+(TB|TD|BT|LR|RL))?$/i;
var ID_RE = "[A-Za-z_][A-Za-z0-9_.-]*";
var SUBGRAPH_RE = /^subgraph\s+(.+)$/i;
var SUBGRAPH_WITH_LABEL_RE = new RegExp(`^(${ID_RE})\\s*\\[(.+)\\]$`);
var SUBGRAPH_DIRECTION_RE = /^direction\s+(TB|TD|BT|LR|RL)$/i;
var IGNORED_PRESENTATION_RE = /^(?:classDef|class|style|linkStyle)\b/i;
var DATABASE_NODE_RE = new RegExp(`^(${ID_RE})\\[\\((.+)\\)\\]$`);
var SUBROUTINE_NODE_RE = new RegExp(`^(${ID_RE})\\[\\[(.+)\\]\\]$`);
var ROUNDED_BRACKET_NODE_RE = new RegExp(`^(${ID_RE})\\(\\[(.+)\\]\\)$`);
var ROUNDED_NODE_RE = new RegExp(`^(${ID_RE})\\((.+)\\)$`);
var HEXAGON_NODE_RE = new RegExp(`^(${ID_RE})\\{\\{(.+)\\}\\}$`);
var PARALLELOGRAM_NODE_RE = new RegExp(`^(${ID_RE})\\[/(.+)/\\]$`);
var DECISION_NODE_RE = new RegExp(`^(${ID_RE})\\{(.+)\\}$`);
var BOX_NODE_RE = new RegExp(`^(${ID_RE})\\[(.+)\\]$`);
var ID_ONLY_RE = new RegExp(`^${ID_RE}$`);
var EXPLICIT_NODE_SHAPE_RE = new RegExp(`^${ID_RE}(?:\\[|\\(|\\{)`);
var CIRCLE_NODE_RE = new RegExp(`^(${ID_RE})\\(\\((.+)\\)\\)$`);
var MAX_FLOWCHART_LINE_LENGTH = 1e4;
var EDGE_OPERATOR_RE = /(-\.(?!->)(.+?)\.(?:->|-))|(--|==|-\.)\s+(.+?)\s+(-->|==>|\.->|-\.->|\.-)|(<-->|-->|==>|-\.->|---|~~~)\s*(?:\|([^|]*)\|\s*)?/dg;
function normalizeDirection(value) {
  const upper = value?.toUpperCase();
  if (upper === "TB" || upper === "TD" || upper === "BT" || upper === "LR" || upper === "RL")
    return upper;
  return DEFAULT_DIRECTION;
}
function normalizeSubgraphId(value, index) {
  const stripped = stripMermaidQuotes(value);
  return ID_ONLY_RE.test(stripped) ? stripped : `subgraph_${index + 1}`;
}
function parseSubgraphToken(token, index) {
  const trimmed = token.trim().replace(/\s*:::.*$/, "").replace(/;$/, "");
  const withLabel = trimmed.match(SUBGRAPH_WITH_LABEL_RE);
  if (withLabel) {
    return { id: withLabel[1], label: stripMermaidQuotes(withLabel[2]) };
  }
  const label = stripMermaidQuotes(trimmed);
  return { id: normalizeSubgraphId(trimmed, index), label };
}
function parseNodeToken(token) {
  const trimmed = token.trim().replace(/;$/, "");
  const database = trimmed.match(DATABASE_NODE_RE);
  if (database)
    return { id: database[1], label: stripMermaidQuotes(database[2]), shape: "database" };
  const subroutine = trimmed.match(SUBROUTINE_NODE_RE);
  if (subroutine)
    return { id: subroutine[1], label: stripMermaidQuotes(subroutine[2]), shape: "subroutine" };
  const roundedBracket = trimmed.match(ROUNDED_BRACKET_NODE_RE);
  if (roundedBracket)
    return { id: roundedBracket[1], label: stripMermaidQuotes(roundedBracket[2]), shape: "rounded" };
  const circle = trimmed.match(CIRCLE_NODE_RE);
  if (circle)
    return { id: circle[1], label: stripMermaidQuotes(circle[2]), shape: "circle" };
  const rounded = trimmed.match(ROUNDED_NODE_RE);
  if (rounded)
    return { id: rounded[1], label: stripMermaidQuotes(rounded[2]), shape: "rounded" };
  const hexagon = trimmed.match(HEXAGON_NODE_RE);
  if (hexagon)
    return { id: hexagon[1], label: stripMermaidQuotes(hexagon[2]), shape: "hexagon" };
  const parallelogram = trimmed.match(PARALLELOGRAM_NODE_RE);
  if (parallelogram)
    return { id: parallelogram[1], label: stripMermaidQuotes(parallelogram[2]), shape: "parallelogram" };
  const decision = trimmed.match(DECISION_NODE_RE);
  if (decision)
    return { id: decision[1], label: stripMermaidQuotes(decision[2]), shape: "decision" };
  const box = trimmed.match(BOX_NODE_RE);
  if (box)
    return { id: box[1], label: stripMermaidQuotes(box[2]), shape: "box" };
  return { id: trimmed, label: trimmed, shape: "box" };
}
function isSupportedNodeToken(token) {
  const trimmed = stripNodeToken(token);
  return ID_ONLY_RE.test(trimmed) || DATABASE_NODE_RE.test(trimmed) || SUBROUTINE_NODE_RE.test(trimmed) || ROUNDED_BRACKET_NODE_RE.test(trimmed) || CIRCLE_NODE_RE.test(trimmed) || ROUNDED_NODE_RE.test(trimmed) || HEXAGON_NODE_RE.test(trimmed) || PARALLELOGRAM_NODE_RE.test(trimmed) || DECISION_NODE_RE.test(trimmed) || BOX_NODE_RE.test(trimmed);
}
function hasExplicitNodeShape(token) {
  return EXPLICIT_NODE_SHAPE_RE.test(token.trim());
}
function ensureNode(nodes, token) {
  const node = parseNodeToken(token);
  const existing = nodes.get(node.id);
  if (!existing) {
    nodes.set(node.id, node);
    return node;
  }
  if (hasExplicitNodeShape(token)) {
    existing.label = node.label;
    existing.shape = node.shape;
  }
  return existing;
}
function addNodeToSubgraph(subgraph, nodeId) {
  if (!subgraph || subgraph.nodeIds.includes(nodeId))
    return;
  subgraph.nodeIds.push(nodeId);
}
function stripNodeToken(token) {
  return token.replace(/\s*:::.*$/, "").replace(/;$/, "").trim();
}
function splitNodeGroup(token) {
  const groups = [];
  const stack = [];
  let quote;
  let start = 0;
  const closes = { "[": "]", "(": ")", "{": "}" };
  for (let index = 0;index < token.length; index++) {
    const character = token[index];
    if (quote) {
      if (character === quote && token[index - 1] !== "\\")
        quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character in closes) {
      stack.push(character);
      continue;
    }
    if (stack.length > 0 && character === closes[stack.at(-1)]) {
      stack.pop();
      continue;
    }
    if (stack.length === 0 && character === "&") {
      groups.push(token.slice(start, index));
      start = index + 1;
    }
  }
  groups.push(token.slice(start));
  return groups;
}
function edgeStyleFromArrow(...arrows) {
  if (arrows.some((arrow) => arrow.includes("==")))
    return "thick";
  if (arrows.some((arrow) => arrow.includes(".")))
    return "dashed";
  return;
}
function createEdge(from, to, label, style, arrowhead, sourceArrowhead) {
  const edge = style ? { from, to, label, style } : { from, to, label };
  if (!arrowhead)
    edge.arrowhead = false;
  if (sourceArrowhead)
    edge.sourceArrowhead = true;
  return edge;
}
function parseEdgeOperators(line) {
  return [...maskNodeLabelOperators(line).matchAll(EDGE_OPERATOR_RE)].map((match) => {
    const inlineDashedArrow = match[1];
    const startArrow = inlineDashedArrow ?? match[3] ?? match[6];
    const endArrow = inlineDashedArrow ?? match[5] ?? match[6];
    const labelGroup = match[2] ? 2 : match[4] ? 4 : match[7] ? 7 : undefined;
    const labelRange = labelGroup === undefined ? undefined : match.indices?.[labelGroup];
    return {
      index: match.index,
      end: match.index + match[0].length,
      label: stripMermaidQuotes(labelRange ? line.slice(labelRange[0], labelRange[1]) : ""),
      style: edgeStyleFromArrow(startArrow, endArrow),
      arrowhead: endArrow === "~~~" || endArrow.endsWith(">"),
      sourceArrowhead: startArrow.startsWith("<"),
      orderOnly: endArrow === "~~~"
    };
  });
}
function maskNodeLabelOperators(line) {
  const characters = line.split("");
  const stack = [];
  let quote;
  const closes = { "[": "]", "(": ")", "{": "}" };
  for (let index = 0;index < characters.length; index++) {
    const character = characters[index];
    if (quote) {
      if (character === quote && characters[index - 1] !== "\\")
        quote = undefined;
      else if (/[<>=.-]/.test(character))
        characters[index] = " ";
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character in closes) {
      stack.push(character);
      continue;
    }
    if (stack.length > 0 && character === closes[stack.at(-1)]) {
      stack.pop();
      continue;
    }
    if (stack.length > 0 && /[<>=.-]/.test(character))
      characters[index] = " ";
  }
  return characters.join("");
}
function splitStatements(line) {
  const statements = [];
  const stack = [];
  let quote;
  let edgeLabel = false;
  const closes = { "[": "]", "(": ")", "{": "}" };
  let start = 0;
  for (let index = 0;index < line.length; index++) {
    const character = line[index];
    if (quote) {
      if (character === quote && line[index - 1] !== "\\")
        quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character in closes) {
      stack.push(character);
      continue;
    }
    if (stack.length > 0 && character === closes[stack.at(-1)]) {
      stack.pop();
      continue;
    }
    if (stack.length === 0 && character === "|") {
      edgeLabel = !edgeLabel;
      continue;
    }
    if (character === ";" && stack.length === 0 && !edgeLabel) {
      const statement = line.slice(start, index).trim();
      if (statement)
        statements.push(statement);
      start = index + 1;
    }
  }
  const last = line.slice(start).trim();
  if (last)
    statements.push(last);
  return statements;
}
function stripInlineComment(line) {
  const stack = [];
  let quote;
  let edgeLabel = false;
  const closes = { "[": "]", "(": ")", "{": "}" };
  for (let index = 0;index < line.length - 1; index++) {
    const character = line[index];
    if (quote) {
      if (character === quote && line[index - 1] !== "\\")
        quote = undefined;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (character in closes) {
      stack.push(character);
      continue;
    }
    if (stack.length && character === closes[stack.at(-1)]) {
      stack.pop();
      continue;
    }
    if (character === "|" && stack.length === 0) {
      edgeLabel = !edgeLabel;
      continue;
    }
    if (character === "%" && line[index + 1] === "%" && stack.length === 0 && !edgeLabel) {
      return line.slice(0, index).trimEnd();
    }
  }
  return line;
}
function* flowchartStatements(content) {
  for (const source of meaningfulNumberedMermaidLines(content)) {
    if (source.text.length > MAX_FLOWCHART_LINE_LENGTH) {
      throw new MermaidSyntaxError("flowchart", source.lineNumber, source.text, "Flowchart statement is too long");
    }
    for (const text of splitStatements(stripInlineComment(source.text))) {
      if (IGNORED_PRESENTATION_RE.test(text))
        break;
      yield { ...source, text };
    }
  }
}
function isMermaidFlowchartDiagram(content) {
  const first = stripInlineComment(firstMeaningfulMermaidLine(content) ?? "").trim();
  return FLOWCHART_HEADER_RE.test(first) || first.includes(";") && FLOWCHART_HEADER_RE.test(splitStatements(first)[0] ?? "");
}
function parseMermaidFlowchartDiagram(content) {
  const nodes = new Map;
  const edges = [];
  const subgraphs = [];
  const subgraphStack = [];
  let direction = DEFAULT_DIRECTION;
  for (const source of flowchartStatements(content)) {
    const line = source.text;
    const header = line.match(FLOWCHART_HEADER_RE);
    if (header) {
      direction = normalizeDirection(header[2]);
      continue;
    }
    if (IGNORED_PRESENTATION_RE.test(line))
      continue;
    const subgraphMatch = line.match(SUBGRAPH_RE);
    if (subgraphMatch) {
      const parsed = parseSubgraphToken(subgraphMatch[1], subgraphs.length);
      const subgraph = {
        ...parsed,
        nodeIds: [],
        parentId: subgraphStack[subgraphStack.length - 1]?.subgraph.id
      };
      subgraphs.push(subgraph);
      subgraphStack.push({ subgraph, lineNumber: source.lineNumber, sourceLine: line });
      continue;
    }
    if (/^end$/i.test(line)) {
      if (subgraphStack.length === 0) {
        throw new MermaidSyntaxError("flowchart", source.lineNumber, line, 'Unexpected "end" without an open subgraph');
      }
      subgraphStack.pop();
      continue;
    }
    const currentSubgraph = subgraphStack[subgraphStack.length - 1]?.subgraph;
    const subgraphDirection = line.match(SUBGRAPH_DIRECTION_RE);
    if (subgraphDirection) {
      if (!currentSubgraph) {
        throw new MermaidSyntaxError("flowchart", source.lineNumber, line, 'A "direction" statement requires an open subgraph');
      }
      currentSubgraph.direction = normalizeDirection(subgraphDirection[1]);
      continue;
    }
    const edgeOperators = parseEdgeOperators(line);
    if (edgeOperators.length > 0) {
      const nodeGroups = [
        line.slice(0, edgeOperators[0].index),
        ...edgeOperators.map((operator, index) => line.slice(operator.end, edgeOperators[index + 1]?.index ?? line.length))
      ].map((group) => splitNodeGroup(group).map(stripNodeToken));
      if (nodeGroups.every((group) => group.every((token) => token.length > 0))) {
        const unsupportedEndpoint = nodeGroups.find((group, index) => {
          const orderOnlyEndpoint = edgeOperators[index - 1]?.orderOnly || edgeOperators[index]?.orderOnly;
          return group.some((stripped) => !(orderOnlyEndpoint && subgraphs.some((subgraph) => subgraph.id === stripped)) && !isSupportedNodeToken(stripped));
        });
        if (unsupportedEndpoint)
          throw new MermaidSyntaxError("flowchart", source.lineNumber, line);
        const chainNodeIds = nodeGroups.map((group, index) => {
          const orderOnlyEndpoint = edgeOperators[index - 1]?.orderOnly || edgeOperators[index]?.orderOnly;
          return group.map((stripped) => {
            if (orderOnlyEndpoint && subgraphs.some((subgraph) => subgraph.id === stripped))
              return stripped;
            return ensureNode(nodes, stripped).id;
          });
        });
        for (const nodeId of chainNodeIds.flat()) {
          if (nodes.has(nodeId))
            addNodeToSubgraph(currentSubgraph, nodeId);
        }
        for (let index = 0;index < edgeOperators.length; index++) {
          const operator = edgeOperators[index];
          for (const from of chainNodeIds[index]) {
            for (const to of chainNodeIds[index + 1]) {
              const edge = createEdge(from, to, operator.label, operator.style, operator.arrowhead, operator.sourceArrowhead);
              edges.push(operator.orderOnly ? { ...edge, orderOnly: true } : edge);
            }
          }
        }
        continue;
      }
    }
    const nodeGroup = splitNodeGroup(line);
    if (nodeGroup.every(isSupportedNodeToken)) {
      for (const token of nodeGroup)
        addNodeToSubgraph(currentSubgraph, ensureNode(nodes, stripNodeToken(token)).id);
      continue;
    }
    throw new MermaidSyntaxError("flowchart", source.lineNumber, line);
  }
  const unclosedSubgraph = subgraphStack[subgraphStack.length - 1];
  if (unclosedSubgraph) {
    throw new MermaidSyntaxError("flowchart", unclosedSubgraph.lineNumber, unclosedSubgraph.sourceLine, 'Unclosed subgraph; expected "end"');
  }
  return { direction, nodes: [...nodes.values()], edges, subgraphs };
}

// node_modules/opentui-markdown-render/src/merman/gantt/parser.ts
var HEADER_RE2 = /^gantt$/i;
var DIRECTIVE_RE = /^(title|dateFormat|axisFormat|tickInterval|excludes|todayMarker)\s+(.+)$/i;
var SECTION_RE = /^section(?:\s+(.+))?$/i;
var ACCESSIBILITY_RE2 = /^acc(?:Title|Descr)(?::|\s|$)/i;
var TASK_STATES = new Set(["active", "done", "crit", "milestone", "vert"]);
function isMermaidGanttDiagram(content) {
  return HEADER_RE2.test(firstMeaningfulMermaidLine(content) ?? "");
}
function parseMermaidGanttDiagram(content) {
  const tasks = [];
  const entries = [];
  const tasksById = new Map;
  let title;
  let dateFormat = "YYYY-MM-DD";
  let axisFormat = "%Y-%m-%d";
  let explicitAxisFormat = false;
  let tickInterval;
  let section;
  let headerSeen = false;
  let inAccessibilityDescription = false;
  for (const source of meaningfulNumberedMermaidLines(content)) {
    const line = stripComment2(source.text);
    if (inAccessibilityDescription) {
      if (line === "}")
        inAccessibilityDescription = false;
      continue;
    }
    if (/^accDescr\s*\{$/i.test(line)) {
      inAccessibilityDescription = true;
      continue;
    }
    if (ACCESSIBILITY_RE2.test(line))
      continue;
    if (!line)
      continue;
    if (HEADER_RE2.test(line)) {
      if (headerSeen)
        throw syntaxError2(source.lineNumber, line, "Gantt header can only appear once");
      headerSeen = true;
      continue;
    }
    if (!headerSeen)
      throw syntaxError2(source.lineNumber, line, "Gantt header is required");
    const sectionMatch = line.match(SECTION_RE);
    if (sectionMatch) {
      if (!sectionMatch[1])
        throw syntaxError2(source.lineNumber, line, "Gantt section cannot be empty");
      section = { label: stripMermaidQuotes(sectionMatch[1]) };
      entries.push({ type: "section", section });
      continue;
    }
    const directive = line.match(DIRECTIVE_RE);
    if (directive) {
      const name = directive[1].toLowerCase();
      const value = directive[2].trim();
      if (name === "title")
        title = stripMermaidQuotes(value);
      if (name === "dateformat") {
        dateFormat = value;
        if (!explicitAxisFormat && (value === "HH:mm" || value === "HH:mm:ss")) {
          axisFormat = value === "HH:mm" ? "%H:%M" : "%H:%M:%S";
        }
      }
      if (name === "axisformat") {
        axisFormat = value;
        explicitAxisFormat = true;
      }
      if (name === "tickinterval") {
        const duration = value.match(/^(\d+)\s*(ms|s|m|h|d|w|seconds?|minutes?|hours?|days?|weeks?)$/i);
        const units = {
          ms: 1,
          s: 1000,
          m: 60000,
          h: 3600000,
          d: 86400000,
          w: 604800000,
          second: 1000,
          minute: 60000,
          hour: 3600000,
          day: 86400000,
          week: 604800000
        };
        if (!duration || Number(duration[1]) <= 0)
          throw syntaxError2(source.lineNumber, line, `Unsupported tick interval "${value}"`);
        const unit = duration[2].toLowerCase();
        tickInterval = Number(duration[1]) * (units[unit] ?? units[unit.slice(0, -1)]);
        if (!Number.isSafeInteger(tickInterval))
          throw syntaxError2(source.lineNumber, line, `Unsupported tick interval "${value}"`);
      }
      if (!["title", "dateformat", "axisformat", "tickinterval"].includes(name)) {
        throw syntaxError2(source.lineNumber, line, `${directive[1]} is not supported`);
      }
      continue;
    }
    const separator = line.indexOf(":");
    if (separator < 1)
      throw syntaxError2(source.lineNumber, line);
    const label = stripMermaidQuotes(line.slice(0, separator));
    const fields = line.slice(separator + 1).split(",").map((field) => field.trim()).filter(Boolean);
    const flags = new Set;
    while (fields[0] && TASK_STATES.has(fields[0].toLowerCase()))
      flags.add(fields.shift().toLowerCase());
    if (fields.length < 2 || fields.length > 3) {
      throw syntaxError2(source.lineNumber, line, "Gantt tasks require a start and end or duration");
    }
    const id = fields.length === 3 ? fields.shift() : undefined;
    if (id && tasksById.has(id))
      throw syntaxError2(source.lineNumber, line, `Duplicate task id "${id}"`);
    const start = parseStart(fields[0], dateFormat, tasksById, source.lineNumber, line);
    const end = parseEnd(fields[1], start, dateFormat, source.lineNumber, line);
    if (end < start)
      throw syntaxError2(source.lineNumber, line, "Gantt task cannot end before it starts");
    const task = {
      label,
      ...id ? { id } : {},
      ...section ? { section } : {},
      start,
      end,
      state: taskState(flags)
    };
    tasks.push(task);
    entries.push({ type: "task", task });
    if (id)
      tasksById.set(id, task);
  }
  if (!headerSeen)
    throw new MermaidSyntaxError("gantt", 1, "", "Gantt header is required");
  return {
    ...title === undefined ? {} : { title },
    dateFormat,
    axisFormat,
    ...tickInterval === undefined ? {} : { tickInterval },
    tasks,
    entries
  };
}
function parseStart(value, format, tasksById, lineNumber, sourceLine) {
  const relative = value.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)$/i);
  if (relative && (format === "HH:mm" || format === "HH:mm:ss")) {
    const units = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
    return Date.UTC(1970, 0, 1) + Number(relative[1]) * units[relative[2].toLowerCase()];
  }
  if (!/^after\s+/i.test(value))
    return parseDate(value, format, lineNumber, sourceLine);
  const dependencies = value.replace(/^after\s+/i, "").trim().split(/\s+/);
  const tasks = dependencies.map((id) => tasksById.get(id));
  const missing = dependencies.find((_, index) => !tasks[index]);
  if (missing)
    throw syntaxError2(lineNumber, sourceLine, `Unknown Gantt task id "${missing}"`);
  return Math.max(...tasks.map((task) => task.end));
}
function parseEnd(value, start, format, lineNumber, sourceLine) {
  const duration = value.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)$/i);
  if (!duration)
    return parseDate(value, format, lineNumber, sourceLine);
  const units = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  return start + Number(duration[1]) * units[duration[2].toLowerCase()];
}
function parseDate(value, format, lineNumber, sourceLine) {
  const numeric = Number(value);
  if (format === "s" && Number.isFinite(numeric))
    return numeric * 1000;
  if (format === "X" && Number.isFinite(numeric))
    return numeric * 1000;
  if (format === "x" && Number.isFinite(numeric))
    return numeric;
  const clock = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (clock && ["HH:mm", "HH:mm:ss"].includes(format)) {
    const hours = Number(clock[1]);
    const minutes = Number(clock[2]);
    const seconds = Number(clock[3] ?? 0);
    if (hours < 24 && minutes < 60 && seconds < 60 && format === "HH:mm:ss" === (clock[3] !== undefined)) {
      return Date.UTC(1970, 0, 1, hours, minutes, seconds);
    }
  }
  const calendar = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (calendar && ["YYYY-MM-DD", "YYYY-MM-DD HH:mm", "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DDTHH:mm", "YYYY-MM-DDTHH:mm:ss"].includes(format)) {
    return Date.UTC(Number(calendar[1]), Number(calendar[2]) - 1, Number(calendar[3]), Number(calendar[4] ?? 0), Number(calendar[5] ?? 0), Number(calendar[6] ?? 0));
  }
  throw syntaxError2(lineNumber, sourceLine, `Unsupported date "${value}" for dateFormat ${format}`);
}
function taskState(flags) {
  if (flags.has("milestone"))
    return "milestone";
  if (flags.has("crit"))
    return "critical";
  if (flags.has("done"))
    return "done";
  if (flags.has("active"))
    return "active";
  return "task";
}
function stripComment2(value) {
  const comment = value.indexOf("%%");
  return (comment < 0 ? value : value.slice(0, comment)).trim();
}
function syntaxError2(lineNumber, sourceLine, reason) {
  return new MermaidSyntaxError("gantt", lineNumber, sourceLine, reason);
}

// node_modules/opentui-markdown-render/src/merman/gitgraph/parser.ts
var HEADER_RE3 = /^gitGraph(?:\s+(LR|TB|BT))?\s*:?$/i;
var ACCESSIBILITY_RE3 = /^acc(?:Title|Descr)(?::|\s|$)/i;
function isMermaidGitGraphDiagram(content) {
  return HEADER_RE3.test(firstMeaningfulMermaidLine(content) ?? "");
}
function parseMermaidGitGraphDiagram(content) {
  const firstLine = firstMeaningfulMermaidLine(content);
  if (!HEADER_RE3.test(firstLine ?? ""))
    throw syntaxError3(1, firstLine ?? "", "GitGraph header is required");
  const branches = [{ name: "main", order: 0 }];
  const commits = [];
  const heads = new Map([["main", undefined]]);
  const ids = new Set;
  let direction = "LR";
  let currentBranch = "main";
  let generatedId = 1;
  let inAccessibilityDescription = false;
  let headerSeen = false;
  const nextId = () => {
    while (ids.has(`commit-${generatedId}`))
      generatedId++;
    return `commit-${generatedId++}`;
  };
  for (const source of meaningfulNumberedMermaidLines(content)) {
    const line = stripComment3(source.text);
    if (inAccessibilityDescription) {
      if (line === "}")
        inAccessibilityDescription = false;
      continue;
    }
    if (/^accDescr\s*\{$/i.test(line)) {
      inAccessibilityDescription = true;
      continue;
    }
    if (!line || ACCESSIBILITY_RE3.test(line) || /^title(?:\s|$)/i.test(line))
      continue;
    const header = line.match(HEADER_RE3);
    if (header) {
      if (headerSeen)
        throw syntaxError3(source.lineNumber, line, "GitGraph header can only appear once");
      headerSeen = true;
      direction = header[1]?.toUpperCase() ?? "LR";
      continue;
    }
    const [command = "", ...rest] = tokenize(line);
    const operation = command.toLowerCase();
    if (operation === "commit") {
      const shorthandMessage = rest[0]?.match(/^(["']).*\1$/) ? stripMermaidQuotes(rest.shift()) : undefined;
      const attributes = parseAttributes(rest, source.lineNumber, line, ["id", "msg", "tag", "type"]);
      const id = single(attributes, "id", source.lineNumber, line) ?? nextId();
      if (!id)
        throw syntaxError3(source.lineNumber, line, "GitGraph commit id cannot be empty");
      if (ids.has(id))
        throw syntaxError3(source.lineNumber, line, `Duplicate commit id "${id}"`);
      const type = parseCommitType(single(attributes, "type", source.lineNumber, line), source.lineNumber, line);
      const parent = heads.get(currentBranch);
      const message = single(attributes, "msg", source.lineNumber, line) ?? shorthandMessage;
      const commit = {
        id,
        ...message === undefined ? {} : { message },
        tags: attributes.get("tag") ?? [],
        type,
        branch: currentBranch,
        parents: parent === undefined ? [] : [parent]
      };
      commits.push(commit);
      ids.add(id);
      heads.set(currentBranch, id);
      continue;
    }
    if (operation === "branch") {
      if (rest.length === 0)
        throw syntaxError3(source.lineNumber, line, "GitGraph branch name cannot be empty");
      const name = stripMermaidQuotes(rest[0]);
      if (!name)
        throw syntaxError3(source.lineNumber, line, "GitGraph branch name cannot be empty");
      if (heads.has(name))
        throw syntaxError3(source.lineNumber, line, `Duplicate branch "${name}"`);
      const attributes = parseAttributes(rest.slice(1), source.lineNumber, line, ["order"]);
      const orderValue = single(attributes, "order", source.lineNumber, line);
      const order = orderValue === undefined ? undefined : Number(orderValue);
      if (order !== undefined && (!Number.isInteger(order) || order < 0)) {
        throw syntaxError3(source.lineNumber, line, "GitGraph branch order must be a non-negative integer");
      }
      branches.push({ name, ...order === undefined ? {} : { order } });
      heads.set(name, heads.get(currentBranch));
      currentBranch = name;
      continue;
    }
    if (operation === "checkout" || operation === "switch") {
      if (rest.length !== 1)
        throw syntaxError3(source.lineNumber, line, `GitGraph ${operation} requires one branch`);
      const name = stripMermaidQuotes(rest[0]);
      if (!heads.has(name))
        throw syntaxError3(source.lineNumber, line, `Unknown branch "${name}"`);
      currentBranch = name;
      continue;
    }
    if (operation === "merge") {
      if (rest.length === 0)
        throw syntaxError3(source.lineNumber, line, "GitGraph merge requires a branch");
      const branch = stripMermaidQuotes(rest[0]);
      if (!heads.has(branch))
        throw syntaxError3(source.lineNumber, line, `Unknown branch "${branch}"`);
      if (branch === currentBranch)
        throw syntaxError3(source.lineNumber, line, "GitGraph cannot merge a branch into itself");
      const currentHead = heads.get(currentBranch);
      const mergedHead = heads.get(branch);
      if (currentHead === undefined)
        throw syntaxError3(source.lineNumber, line, `Branch "${currentBranch}" has no commits`);
      if (mergedHead === undefined)
        throw syntaxError3(source.lineNumber, line, `Branch "${branch}" has no commits`);
      if (currentHead === mergedHead)
        throw syntaxError3(source.lineNumber, line, `Branches already share head "${mergedHead}"`);
      const attributes = parseAttributes(rest.slice(1), source.lineNumber, line, ["id", "tag", "type"]);
      const id = single(attributes, "id", source.lineNumber, line) ?? nextId();
      if (ids.has(id))
        throw syntaxError3(source.lineNumber, line, `Duplicate commit id "${id}"`);
      const commit = {
        id,
        tags: attributes.get("tag") ?? [],
        type: parseCommitType(single(attributes, "type", source.lineNumber, line), source.lineNumber, line),
        branch: currentBranch,
        parents: [currentHead, mergedHead]
      };
      commits.push(commit);
      ids.add(id);
      heads.set(currentBranch, id);
      continue;
    }
    if (operation === "cherry-pick") {
      const attributes = parseAttributes(rest, source.lineNumber, line, ["id"]);
      const sourceId = single(attributes, "id", source.lineNumber, line);
      const picked = commits.find((commit) => commit.id === sourceId);
      if (!picked)
        throw syntaxError3(source.lineNumber, line, `Unknown cherry-pick commit "${sourceId ?? ""}"`);
      const parent = heads.get(currentBranch);
      if (!parent)
        throw syntaxError3(source.lineNumber, line, `Branch "${currentBranch}" has no commits`);
      const id = nextId();
      commits.push({
        id,
        message: picked.message ?? `cherry-pick ${picked.id}`,
        tags: [],
        type: "NORMAL",
        branch: currentBranch,
        parents: [parent]
      });
      ids.add(id);
      heads.set(currentBranch, id);
      continue;
    }
    throw syntaxError3(source.lineNumber, line);
  }
  const resolvedBranches = branches.map((branch) => {
    const head = heads.get(branch.name);
    return { ...branch, ...head === undefined ? {} : { head } };
  });
  return { direction, branches: orderBranches(resolvedBranches), commits };
}
function tokenize(line) {
  const tokens = [];
  let token = "";
  let quote;
  for (const char of line) {
    if ((char === '"' || char === "'") && (quote === undefined || quote === char)) {
      quote = quote === char ? undefined : char;
      token += char;
      continue;
    }
    if (/\s/.test(char) && quote === undefined) {
      if (token)
        tokens.push(token);
      token = "";
      continue;
    }
    token += char;
  }
  if (quote !== undefined)
    return [line];
  if (token)
    tokens.push(token);
  return tokens;
}
function parseAttributes(tokens, lineNumber, line, allowed) {
  const result = new Map;
  for (let index = 0;index < tokens.length; index += 1) {
    const keyToken = tokens[index];
    const separator = keyToken.indexOf(":");
    const key = (separator < 0 ? keyToken : keyToken.slice(0, separator)).toLowerCase();
    if (!allowed.includes(key))
      throw syntaxError3(lineNumber, line, `Unsupported GitGraph attribute "${key}"`);
    const inline = separator < 0 ? "" : keyToken.slice(separator + 1);
    const valueToken = inline || tokens[++index];
    if (valueToken === undefined)
      throw syntaxError3(lineNumber, line, `GitGraph attribute "${key}" requires a value`);
    const values = result.get(key) ?? [];
    values.push(stripMermaidQuotes(valueToken));
    result.set(key, values);
  }
  return result;
}
function single(attributes, key, lineNumber, line) {
  const values = attributes.get(key);
  if (values && values.length > 1)
    throw syntaxError3(lineNumber, line, `GitGraph attribute "${key}" cannot repeat`);
  return values?.[0];
}
function parseCommitType(value, lineNumber, line) {
  if (value === undefined)
    return "NORMAL";
  const type = value.toUpperCase();
  if (type === "NORMAL" || type === "REVERSE" || type === "HIGHLIGHT")
    return type;
  throw syntaxError3(lineNumber, line, `Unknown GitGraph commit type "${value}"`);
}
function orderBranches(branches) {
  const main = branches[0];
  const rest = branches.slice(1).map((branch, index) => ({ branch, index }));
  const unordered = rest.filter(({ branch }) => branch.order === undefined);
  const ordered = rest.filter(({ branch }) => branch.order !== undefined).sort((left, right) => left.branch.order - right.branch.order || left.index - right.index);
  return [main, ...unordered.map(({ branch }) => branch), ...ordered.map(({ branch }) => branch)];
}
function stripComment3(value) {
  let quote;
  for (let index = 0;index < value.length - 1; index += 1) {
    const char = value[index];
    if ((char === '"' || char === "'") && (quote === undefined || quote === char)) {
      quote = quote === char ? undefined : char;
      continue;
    }
    if (quote === undefined && char === "%" && value[index + 1] === "%")
      return value.slice(0, index).trim();
  }
  return value.trim();
}
function syntaxError3(lineNumber, sourceLine, reason) {
  return new MermaidSyntaxError("gitGraph", lineNumber, sourceLine, reason);
}

// node_modules/opentui-markdown-render/src/merman/sequence/parser.ts
var MESSAGE_RE = /^(.+?)\s*(-->>|->>|--x|-x|--\)|-\)|-->|->)([+-]?)\s*(.+?)\s*:\s*(.*)$/;
var NOTE_RE = /^note\s+(over|left\s+of|right\s+of)\s+(.+?)\s*:\s*(.*)$/i;
var PARTICIPANT_RE = /^(?:participant|actor)\s+(\S+)(?:\s+as\s+(.+))?$/i;
var ACTIVATION_RE = /^(activate|deactivate)\s+(.+)$/i;
var BOX_RE = /^box(?:\s+(.+))?$/i;
var ALT_RE = /^alt\s+(.+)$/i;
var ELSE_RE = /^else(?:\s+(.+))?$/i;
var LOOP_RE = /^loop\s+(.+)$/i;
var FRAGMENT_START_RE = /^(opt|par|critical|break)(?:\s+(.+))?$/i;
var FRAGMENT_BRANCH_RE = /^(and|option)(?:\s+(.+))?$/i;
var AUTONUMBER_RE = /^autonumber(?:\s+(\d+)(?:\s+(\d+))?)?$/i;
var UNSUPPORTED_BIDIRECTIONAL_MESSAGE_RE = /<<-{1,2}>>/;
var MESSAGE_OPERATOR_RE = /-->>|->>|--x|-x|--\)|-\)|-->|->/;
var CSS_COLOR_NAMES = new Set([
  "black",
  "white",
  "red",
  "green",
  "blue",
  "yellow",
  "cyan",
  "magenta",
  "silver",
  "gray",
  "grey",
  "maroon",
  "olive",
  "lime",
  "aqua",
  "teal",
  "navy",
  "fuchsia",
  "purple",
  "orange",
  "brightblack",
  "brightred",
  "brightgreen",
  "brightblue",
  "brightyellow",
  "brightcyan",
  "brightmagenta",
  "brightwhite"
]);
function arrowHeadForSyntax(arrow) {
  if (arrow.endsWith("x"))
    return "cross";
  if (arrow.endsWith(")"))
    return "async";
  if (arrow.endsWith(">") && !arrow.endsWith(">>"))
    return "open";
  return;
}
function isBoxColorToken(value) {
  const lowerValue = value.toLowerCase();
  return lowerValue === "transparent" || CSS_COLOR_NAMES.has(lowerValue) || /^#[0-9a-f]{3,8}$/i.test(value) || /^rgba?\(.+\)$/i.test(value);
}
function splitLeadingBoxToken(value) {
  if (/^rgba?\(/i.test(value)) {
    const closeIndex = value.indexOf(")");
    if (closeIndex >= 0) {
      return { token: value.slice(0, closeIndex + 1), rest: value.slice(closeIndex + 1).trim() };
    }
  }
  const firstSpace = value.search(/\s/);
  return firstSpace < 0 ? { token: value, rest: "" } : { token: value.slice(0, firstSpace), rest: value.slice(firstSpace + 1).trim() };
}
function boxLabelText(value) {
  const rawLabel = (value ?? "").trim();
  if (rawLabel.startsWith('"') && rawLabel.endsWith('"') || rawLabel.startsWith("'") && rawLabel.endsWith("'")) {
    return stripMermaidQuotes(rawLabel);
  }
  const label = stripMermaidQuotes(rawLabel);
  if (!label)
    return "";
  const { token, rest } = splitLeadingBoxToken(label);
  return isBoxColorToken(token) ? stripMermaidQuotes(rest) : label;
}
function addParticipantToGroup(group, participantId) {
  if (!group || group.participantIds.includes(participantId))
    return;
  group.participantIds.push(participantId);
}
function ensureParticipant(participants, id, label = id, replaceExistingLabel = false) {
  const existing = participants.find((participant) => participant.id === id);
  if (existing) {
    if (replaceExistingLabel)
      existing.label = label;
    return;
  }
  participants.push({ id, label });
}
function isMermaidSequenceDiagram(content) {
  return firstMeaningfulMermaidLine(content)?.toLowerCase() === "sequencediagram";
}
function parseMermaidSequenceDiagram(content) {
  const participants = [];
  const messages = [];
  const steps = [];
  const groups = [];
  const blockStack = [];
  const groupStack = [];
  let nextMessageNumber;
  let messageNumberIncrement = 1;
  for (const source of meaningfulNumberedMermaidLines(content)) {
    const line = source.text;
    if (line.toLowerCase() === "sequencediagram")
      continue;
    if (UNSUPPORTED_BIDIRECTIONAL_MESSAGE_RE.test(line)) {
      throw new MermaidSyntaxError("sequence", source.lineNumber, line);
    }
    const autonumberMatch = line.match(AUTONUMBER_RE);
    if (autonumberMatch) {
      nextMessageNumber = Number.parseInt(autonumberMatch[1] ?? "1", 10);
      messageNumberIncrement = Number.parseInt(autonumberMatch[2] ?? "1", 10);
      continue;
    }
    const boxMatch = line.match(BOX_RE);
    if (boxMatch) {
      const group = { label: boxLabelText(boxMatch[1]), participantIds: [] };
      groups.push(group);
      groupStack.push(group);
      blockStack.push({ kind: "box", lineNumber: source.lineNumber, sourceLine: line });
      continue;
    }
    const participantMatch = line.match(PARTICIPANT_RE);
    if (participantMatch) {
      const id = stripMermaidQuotes(participantMatch[1]);
      ensureParticipant(participants, id, stripMermaidQuotes(participantMatch[2] ?? id), true);
      addParticipantToGroup(groupStack[groupStack.length - 1], id);
      continue;
    }
    const noteMatch = line.match(NOTE_RE);
    if (noteMatch) {
      const position = noteMatch[1].toLowerCase().replace(/\s+of$/, "");
      const over = noteMatch[2].split(",").map((participant) => stripMermaidQuotes(participant)).filter((participant) => participant.length > 0);
      for (const participant of over)
        ensureParticipant(participants, participant);
      steps.push({
        type: "note",
        note: {
          over,
          label: stripMermaidQuotes(noteMatch[3]),
          ...position === "over" ? {} : { position }
        }
      });
      continue;
    }
    const activationMatch = line.match(ACTIVATION_RE);
    if (activationMatch) {
      const participant = stripMermaidQuotes(activationMatch[2]);
      ensureParticipant(participants, participant);
      steps.push({
        type: "activation",
        activation: { participant, active: activationMatch[1].toLowerCase() === "activate" }
      });
      continue;
    }
    const altMatch = line.match(ALT_RE);
    if (altMatch) {
      blockStack.push({ kind: "alt", lineNumber: source.lineNumber, sourceLine: line });
      steps.push({ type: "fragment", fragment: { kind: "alt", label: stripMermaidQuotes(altMatch[1]) } });
      continue;
    }
    const loopMatch = line.match(LOOP_RE);
    if (loopMatch) {
      blockStack.push({ kind: "loop", lineNumber: source.lineNumber, sourceLine: line });
      steps.push({ type: "fragment", fragment: { kind: "loop", label: stripMermaidQuotes(loopMatch[1]) } });
      continue;
    }
    const fragmentStart = line.match(FRAGMENT_START_RE);
    if (fragmentStart) {
      const kind = fragmentStart[1].toLowerCase();
      blockStack.push({ kind, lineNumber: source.lineNumber, sourceLine: line });
      steps.push({ type: "fragment", fragment: { kind, label: stripMermaidQuotes(fragmentStart[2] ?? "") } });
      continue;
    }
    const branchMatch = line.match(FRAGMENT_BRANCH_RE);
    if (branchMatch) {
      const kind = branchMatch[1].toLowerCase();
      const expected = kind === "and" ? "par" : "critical";
      if (blockStack[blockStack.length - 1]?.kind !== expected) {
        throw new MermaidSyntaxError("sequence", source.lineNumber, line, `Unexpected "${kind}" without an open "${expected}" block`);
      }
      steps.push({ type: "fragment", fragment: { kind, label: stripMermaidQuotes(branchMatch[2] ?? "") } });
      continue;
    }
    const elseMatch = line.match(ELSE_RE);
    if (elseMatch) {
      if (blockStack[blockStack.length - 1]?.kind !== "alt") {
        throw new MermaidSyntaxError("sequence", source.lineNumber, line, 'Unexpected "else" without an open "alt" block');
      }
      steps.push({ type: "fragment", fragment: { kind: "else", label: stripMermaidQuotes(elseMatch[1] ?? "") } });
      continue;
    }
    if (line.toLowerCase() === "end") {
      const block = blockStack.pop();
      if (!block)
        throw new MermaidSyntaxError("sequence", source.lineNumber, line, 'Unexpected "end" without an open block');
      if (block.kind === "box") {
        groupStack.pop();
        continue;
      }
      steps.push({ type: "fragment", fragment: { kind: "end", label: block.kind } });
      continue;
    }
    const messageMatch = line.match(MESSAGE_RE);
    if (messageMatch) {
      const from = stripMermaidQuotes(messageMatch[1]);
      const arrow = messageMatch[2];
      const activationMarker = messageMatch[3];
      const to = stripMermaidQuotes(messageMatch[4]);
      if (MESSAGE_OPERATOR_RE.test(from) || MESSAGE_OPERATOR_RE.test(to)) {
        throw new MermaidSyntaxError("sequence", source.lineNumber, line);
      }
      const message = {
        from,
        to,
        label: stripMermaidQuotes(messageMatch[5]),
        style: arrow.startsWith("--") ? "dashed" : "solid"
      };
      const activeGroup = groupStack[groupStack.length - 1];
      ensureParticipant(participants, from);
      ensureParticipant(participants, to);
      addParticipantToGroup(activeGroup, from);
      addParticipantToGroup(activeGroup, to);
      const head = arrowHeadForSyntax(arrow);
      if (head)
        message.head = head;
      if (nextMessageNumber !== undefined) {
        message.number = nextMessageNumber;
        nextMessageNumber += messageNumberIncrement;
      }
      if (activationMarker === "+")
        message.activate = to;
      else if (activationMarker === "-")
        message.deactivate = from;
      messages.push(message);
      steps.push({ type: "message", message });
      continue;
    }
    throw new MermaidSyntaxError("sequence", source.lineNumber, line);
  }
  const unclosedBlock = blockStack[blockStack.length - 1];
  if (unclosedBlock) {
    throw new MermaidSyntaxError("sequence", unclosedBlock.lineNumber, unclosedBlock.sourceLine, `Unclosed ${unclosedBlock.kind} block; expected "end"`);
  }
  return { participants, messages, steps, groups };
}

// node_modules/opentui-markdown-render/src/merman/state/endpoint.ts
function stateDiagramStartMarkerId(scope) {
  return scope ? `${scope}.__start` : "__start";
}
function stateDiagramEndMarkerId(scope) {
  return scope ? `${scope}.__end` : "__end";
}
function stateDiagramMarkerId(position, scope) {
  return position === "from" ? stateDiagramStartMarkerId(scope) : stateDiagramEndMarkerId(scope);
}
function normalizeStateDiagramEndpoint(value, position, scope) {
  return value === "[*]" ? stateDiagramMarkerId(position, scope) : value;
}

// node_modules/opentui-markdown-render/src/merman/state/parser.ts
var DEFAULT_DIRECTION2 = "LR";
var STATE_RE = /^state\s+"([^"]+)"\s+as\s+(\S+)$/i;
var STATE_DECLARE_RE = /^state\s+([A-Za-z_][A-Za-z0-9_.-]*)$/i;
var STATE_DESCRIPTION_RE = /^([A-Za-z_][A-Za-z0-9_.-]*)\s*:\s*(.+)$/;
var COMPOSITE_STATE_RE = /^state\s+(?:"([^"]+)"\s+as\s+)?(\S+)\s*\{$/i;
var CHOICE_STATE_RE = /^state\s+(\S+)\s+<<choice>>$/i;
var PARALLEL_STATE_RE = /^state\s+(\S+)\s+<<(fork|join)>>$/i;
var TRANSITION_RE = /^(\[\*\]|[^\s:]+)\s*-->\s*(\[\*\]|[^\s:]+)(?:\s*:\s*(.*))?$/;
var DIRECTION_RE2 = /^direction\s+(TB|TD|BT|LR|RL)$/i;
var NOTE_INLINE_RE = /^note\s+(left|right)\s+of\s+(\S+)\s*:\s*(.*)$/i;
var NOTE_START_RE = /^note\s+(left|right)\s+of\s+(\S+)\s*$/i;
var NOTE_END_RE = /^end\s+note$/i;
function normalizeDirection2(value) {
  const upper = value?.toUpperCase();
  if (upper === "TB" || upper === "TD" || upper === "BT" || upper === "LR" || upper === "RL")
    return upper;
  return DEFAULT_DIRECTION2;
}
function isMermaidHeader(line) {
  return line.toLowerCase() === "statediagram-v2" || line.toLowerCase() === "statediagram";
}
function ensureState(states, id, label = id, kind = "state", parentId) {
  const existing = states.get(id);
  if (existing) {
    if (existing.label === existing.id && label !== id)
      existing.label = label;
    if (parentId && !existing.parentId)
      existing.parentId = parentId;
    if (kind !== "state") {
      existing.kind = kind;
      existing.label = label;
    }
    return;
  }
  states.set(id, parentId ? { id, label, kind, parentId } : { id, label, kind });
}
function resolveCompositeTransitionEndpoint(id, markerId, compositeIds, states) {
  if (!compositeIds.has(id))
    return id;
  const marker = markerId(id);
  return states.has(marker) ? marker : id;
}
function resolveCompositeTransitions(transitions, compositeIds, states) {
  return transitions.map((transition) => ({
    from: resolveCompositeTransitionEndpoint(transition.from, stateDiagramEndMarkerId, compositeIds, states),
    to: resolveCompositeTransitionEndpoint(transition.to, stateDiagramStartMarkerId, compositeIds, states),
    label: transition.label
  }));
}
function isMermaidStateDiagram(content) {
  return isMermaidHeader(firstMeaningfulMermaidLine(content) ?? "");
}
function parseMermaidStateDiagram(content) {
  const states = new Map;
  const transitions = [];
  const composites = [];
  const notes = [];
  const parentStack = [];
  let pendingNote;
  let direction = DEFAULT_DIRECTION2;
  for (const source of numberedMermaidLines(content)) {
    const line = source.text;
    if (pendingNote) {
      if (NOTE_END_RE.test(line)) {
        notes.push({
          target: pendingNote.target,
          position: pendingNote.position,
          lines: pendingNote.lines.map(decodeMermaidText)
        });
        pendingNote = undefined;
      } else if (line || pendingNote.lines.length > 0) {
        pendingNote.lines.push(line);
      }
      continue;
    }
    if (!line || line.startsWith("%%") || isMermaidHeader(line))
      continue;
    if (line === "}") {
      if (parentStack.length === 0) {
        throw new MermaidSyntaxError("state", source.lineNumber, line, 'Unexpected "}" without an open composite state');
      }
      parentStack.pop();
      continue;
    }
    const parentId = parentStack[parentStack.length - 1]?.id;
    const directionMatch = line.match(DIRECTION_RE2);
    if (directionMatch) {
      if (parentStack.length > 0) {
        throw new MermaidSyntaxError("state", source.lineNumber, line, "Composite-local direction is not supported");
      }
      direction = normalizeDirection2(directionMatch[1]);
      continue;
    }
    const inlineNoteMatch = line.match(NOTE_INLINE_RE);
    if (inlineNoteMatch) {
      notes.push({
        position: inlineNoteMatch[1].toLowerCase(),
        target: inlineNoteMatch[2],
        lines: splitDiagramLines(decodeMermaidText(inlineNoteMatch[3].trim()))
      });
      continue;
    }
    const noteMatch = line.match(NOTE_START_RE);
    if (noteMatch) {
      pendingNote = {
        position: noteMatch[1].toLowerCase(),
        target: noteMatch[2],
        lines: [],
        lineNumber: source.lineNumber,
        sourceLine: line
      };
      continue;
    }
    const compositeMatch = line.match(COMPOSITE_STATE_RE);
    if (compositeMatch) {
      const id = compositeMatch[2];
      composites.push({
        id,
        label: decodeMermaidText(compositeMatch[1] ?? id),
        ...parentId ? { parentId } : {}
      });
      parentStack.push({ id, lineNumber: source.lineNumber, sourceLine: line });
      continue;
    }
    const stateMatch = line.match(STATE_RE);
    if (stateMatch) {
      ensureState(states, stateMatch[2], decodeMermaidText(stateMatch[1]), "state", parentId);
      continue;
    }
    const declaration = line.match(STATE_DECLARE_RE);
    if (declaration) {
      ensureState(states, declaration[1], declaration[1], "state", parentId);
      continue;
    }
    const description = line.match(STATE_DESCRIPTION_RE);
    if (description) {
      ensureState(states, description[1], decodeMermaidText(description[2]), "state", parentId);
      continue;
    }
    const choiceMatch = line.match(CHOICE_STATE_RE);
    if (choiceMatch) {
      ensureState(states, choiceMatch[1], "", "choice", parentId);
      continue;
    }
    const parallelMatch = line.match(PARALLEL_STATE_RE);
    if (parallelMatch) {
      ensureState(states, parallelMatch[1], "", parallelMatch[2].toLowerCase(), parentId);
      continue;
    }
    const transitionMatch = line.match(TRANSITION_RE);
    if (transitionMatch) {
      const rawFrom = transitionMatch[1];
      const rawTo = transitionMatch[2];
      if (rawFrom.includes("-->") || rawTo.includes("-->")) {
        throw new MermaidSyntaxError("state", source.lineNumber, line);
      }
      const from = normalizeStateDiagramEndpoint(rawFrom, "from", parentId);
      const to = normalizeStateDiagramEndpoint(rawTo, "to", parentId);
      ensureState(states, from, rawFrom === "[*]" ? "\u25CF" : from, rawFrom === "[*]" ? "start" : "state", parentId);
      ensureState(states, to, rawTo === "[*]" ? "\u25CE" : to, rawTo === "[*]" ? "end" : "state", parentId);
      transitions.push({ from, to, label: decodeMermaidText(transitionMatch[3]?.trim() ?? "") });
      continue;
    }
    throw new MermaidSyntaxError("state", source.lineNumber, line);
  }
  if (pendingNote) {
    throw new MermaidSyntaxError("state", pendingNote.lineNumber, pendingNote.sourceLine, 'Unclosed note; expected "end note"');
  }
  const unclosedComposite = parentStack[parentStack.length - 1];
  if (unclosedComposite) {
    throw new MermaidSyntaxError("state", unclosedComposite.lineNumber, unclosedComposite.sourceLine, 'Unclosed composite state; expected "}"');
  }
  if (composites.length === 0) {
    return { direction, states: [...states.values()], transitions, composites, notes };
  }
  const compositeIds = new Set(composites.map((composite) => composite.id));
  return {
    direction,
    states: [...states.values()].filter((state) => !compositeIds.has(state.id)),
    transitions: resolveCompositeTransitions(transitions, compositeIds, states),
    composites,
    notes
  };
}

// node_modules/opentui-markdown-render/src/merman/timeline/parser.ts
var HEADER_RE4 = /^timeline(?:\s+(TD|LR))?$/i;
var TITLE_RE = /^title(?:\s+(.+))?$/i;
var SECTION_RE2 = /^section(?:\s+(.+))?$/i;
var ACCESSIBILITY_RE4 = /^acc(?:Title|Descr)(?::|\s|$)/i;
function isMermaidTimelineDiagram(content) {
  return HEADER_RE4.test(firstMeaningfulMermaidLine(content) ?? "");
}
function parseMermaidTimelineDiagram(content) {
  const sections = [];
  const periods = [];
  const entries = [];
  let direction = "LR";
  let title;
  let currentPeriod;
  let inAccessibilityDescription = false;
  for (const source of meaningfulNumberedMermaidLines(content)) {
    const line = stripTimelineComment(source.text);
    if (inAccessibilityDescription) {
      if (line === "}")
        inAccessibilityDescription = false;
      continue;
    }
    if (/^accDescr\s*\{$/i.test(line)) {
      inAccessibilityDescription = true;
      continue;
    }
    if (!line || line.startsWith("#") || ACCESSIBILITY_RE4.test(line))
      continue;
    const header = line.match(HEADER_RE4);
    if (header) {
      direction = header[1]?.toUpperCase() ?? "LR";
      continue;
    }
    const titleMatch = line.match(TITLE_RE);
    if (titleMatch) {
      if (!titleMatch[1])
        throw syntaxError4(source.lineNumber, line, "Timeline title cannot be empty");
      title = stripMermaidQuotes(titleMatch[1]);
      continue;
    }
    const sectionMatch = line.match(SECTION_RE2);
    if (sectionMatch) {
      if (!sectionMatch[1])
        throw syntaxError4(source.lineNumber, line, "Timeline section cannot be empty");
      const section = { label: stripMermaidQuotes(sectionMatch[1]) };
      sections.push(section);
      entries.push({ type: "section", section });
      currentPeriod = undefined;
      continue;
    }
    if (line.startsWith(":")) {
      if (!currentPeriod) {
        throw syntaxError4(source.lineNumber, line, "Timeline continuation requires a preceding period");
      }
      currentPeriod.events.push(...parseEvents(line.slice(1), source.lineNumber, line));
      continue;
    }
    const fields = splitEventFields(line);
    const periodLabel = stripMermaidQuotes(fields.shift());
    if (!periodLabel)
      throw syntaxError4(source.lineNumber, line, "Timeline period cannot be empty");
    const period = {
      period: periodLabel,
      events: fields.length === 0 ? [] : parseEventFields(fields, source.lineNumber, line)
    };
    periods.push(period);
    entries.push({ type: "period", period });
    currentPeriod = period;
  }
  return { direction, ...title === undefined ? {} : { title }, sections, periods, entries };
}
function parseEvents(value, lineNumber, sourceLine) {
  return parseEventFields(splitEventFields(value), lineNumber, sourceLine);
}
function parseEventFields(fields, lineNumber, sourceLine) {
  const events = fields.map(stripMermaidQuotes);
  if (events.length === 0 || events.some((event) => event.length === 0)) {
    throw syntaxError4(lineNumber, sourceLine, "Timeline event cannot be empty");
  }
  return events;
}
function splitEventFields(value) {
  const fields = [];
  let quote;
  let start = 0;
  for (let index = 0;index < value.length; index++) {
    const char = value[index];
    if (char === '"' || char === "'") {
      if (quote === char)
        quote = undefined;
      else if (quote === undefined && value.slice(start, index).trim() === "")
        quote = char;
      continue;
    }
    const next = value[index + 1];
    if (char !== ":" || quote !== undefined || next !== undefined && !/\s/.test(next))
      continue;
    fields.push(value.slice(start, index));
    start = index + 1;
  }
  fields.push(value.slice(start));
  return fields;
}
function stripTimelineComment(value) {
  const comment = value.indexOf("%%");
  return (comment < 0 ? value : value.slice(0, comment)).trim();
}
function syntaxError4(lineNumber, sourceLine, reason) {
  return new MermaidSyntaxError("timeline", lineNumber, sourceLine, reason);
}

// node_modules/opentui-markdown-render/src/merman/detect.ts
function detectMermaidDiagram(content) {
  if (isMermaidClassDiagram(content))
    return "classDiagram";
  if (isMermaidFlowchartDiagram(content))
    return "flowchart";
  if (isMermaidGanttDiagram(content))
    return "gantt";
  if (isMermaidGitGraphDiagram(content))
    return "gitGraph";
  if (isMermaidSequenceDiagram(content))
    return "sequence";
  if (isMermaidStateDiagram(content))
    return "state";
  if (isMermaidTimelineDiagram(content))
    return "timeline";
  return;
}

// node_modules/opentui-markdown-render/src/merman/flowchart/drawing.ts
import { BorderChars as BorderChars3, TextAttributes as TextAttributes4 } from "@opentui/core";

// node_modules/opentui-markdown-render/src/merman/flowchart/labels.ts
var LABEL_BUS_CLEARANCE = 3;
var LABEL_NODE_CLEARANCE = 2;
var LABEL_LINE_CLEARANCE = 2;
var LABEL_TERMINAL_CLEARANCE = 1;
function flowchartLabelText(label) {
  return padDiagramLabelLine(label);
}
function flowchartLabelWidth(label, measure) {
  return measureDiagramLabelWidth(label, measure);
}
function minimumInlineLabelLength(labelWidth) {
  return labelWidth + LABEL_LINE_CLEARANCE * 2 - 1;
}
function flowchartHorizontalLabelRankGap(labelWidth) {
  return minimumInlineLabelLength(labelWidth) + LABEL_BUS_CLEARANCE + 1;
}
function flowchartVerticalBranchLabelGap(labelWidth) {
  return minimumInlineLabelLength(labelWidth) + LABEL_BUS_CLEARANCE + LABEL_NODE_CLEARANCE;
}
function inlineLabelSlot(segment, labelWidth) {
  const slot = insetSpan(segmentSpan(segment), LABEL_LINE_CLEARANCE);
  return { x: centeredSpanStart(slot, labelWidth), fits: spanCapacity(slot) >= labelWidth };
}
function segmentLabelPoint(segment, labelWidth, labelHeight) {
  if (segment.axis === "x") {
    const slot = inlineLabelSlot(segment, labelWidth);
    if (labelHeight === 1 && slot.fits)
      return point(slot.x, segment.from.y);
    if (labelHeight > 1) {
      return shiftPoint(point(slot.x, segment.from.y), "up", labelHeight);
    }
    return clampPoint(shiftPoint(shiftPoint(segment.from, segment.direction, LABEL_LINE_CLEARANCE), "up", labelHeight));
  }
  const slot = insetSpan(segmentSpan(segment), LABEL_TERMINAL_CLEARANCE);
  if (spanCapacity(slot) >= labelHeight) {
    return clampPoint(point(segment.from.x + 1, centeredSpanStart(slot, labelHeight)));
  }
  const center = shiftPoint(pointOnSegment(segment, midpoint(segmentSpan(segment))), "right");
  return clampPoint(shiftPoint(center, "up", Math.floor((labelHeight - 1) / 2)));
}
function bestLabelSegment(points, labelWidth, preferredAxis, preferredSegment) {
  const segments = points.slice(1).flatMap((to, index) => {
    const segment = segmentBetween(points[index], to);
    return segment ? [segment] : [];
  });
  if (preferredSegment !== undefined && segments[preferredSegment])
    return segments[preferredSegment];
  const preferred = preferredAxis ? segments.find((segment) => segment.axis === preferredAxis) : undefined;
  if (preferred)
    return preferred;
  let roomyHorizontal;
  let verticalBus;
  let longest;
  for (const segment of segments) {
    if (!roomyHorizontal && segment.axis === "x" && inlineLabelSlot(segment, labelWidth).fits)
      roomyHorizontal = segment;
    if (!verticalBus && segment.axis === "y")
      verticalBus = segment;
    if (!longest || segment.length > longest.length)
      longest = segment;
  }
  return roomyHorizontal ?? verticalBus ?? longest;
}
function flowchartLabelPoint(points, labelWidth, labelHeight, preferredAxis, preferredSegment) {
  const segment = bestLabelSegment(points, labelWidth, preferredAxis, preferredSegment);
  return segment ? segmentLabelPoint(segment, labelWidth, labelHeight) : points[0] ?? point(0, 0);
}
function flowchartEdgeLabelLayout(points, label, measure, preferredAxis, preferredSegment) {
  const lines = splitDiagramLines(label).map(flowchartLabelText);
  const width = flowchartLabelWidth(label, measure);
  const height = lines.length;
  return {
    lines,
    point: flowchartLabelPoint(points, width, height, preferredAxis, preferredSegment),
    width,
    height
  };
}
function flowchartRouteLabelLayout(route, measure) {
  const lines = splitDiagramLines(route.edge.label).map(flowchartLabelText);
  const width = flowchartLabelWidth(route.edge.label, measure);
  const height = lines.length;
  return {
    lines,
    point: route.labelPoint ?? flowchartLabelPoint(route.points, width, height, route.labelAxis),
    width,
    height
  };
}

// node_modules/opentui-markdown-render/src/merman/flowchart/routing.ts
var BUS_CLEARANCE = 3;
var NODE_CLEARANCE = 2;
var ROUTING_CANDIDATE_BUDGET = 1024;
function isVerticalDirection(direction) {
  return direction === "TB" || direction === "TD" || direction === "BT";
}
function verticalTravel(from, to) {
  return centerCoordinate(to, "y") >= centerCoordinate(from, "y") ? "down" : "up";
}
function isVerticalBackEdge(from, to, direction) {
  return direction === "BT" ? centerCoordinate(to, "y") > centerCoordinate(from, "y") : centerCoordinate(to, "y") < centerCoordinate(from, "y");
}
function isHorizontalBackEdge(from, to, direction) {
  return direction === "RL" ? centerCoordinate(to, "x") > centerCoordinate(from, "x") : centerCoordinate(to, "x") < centerCoordinate(from, "x");
}
function horizontalTravel(from, to, direction) {
  const targetIsRight = centerCoordinate(to, "x") > centerCoordinate(from, "x");
  const targetIsSameOrRight = centerCoordinate(to, "x") >= centerCoordinate(from, "x");
  return direction === "RL" ? targetIsRight ? "right" : "left" : targetIsSameOrRight ? "right" : "left";
}
function verticalBackEdgePath(from, to, leftBoundary) {
  const start = boundsSidePoint(from, "left");
  const end = boundsSidePoint(to, "left");
  const busX = Math.min(afterFarthestCoordinate([start, end], "x", "left", BUS_CLEARANCE), leftBoundary === undefined ? Number.POSITIVE_INFINITY : leftBoundary - BUS_CLEARANCE * 2);
  return pathViaLane(start, lane("x", busX), end);
}
function verticalForwardEdgePath(from, to) {
  const travel = verticalTravel(from, to);
  const startSide = sideForDirection(travel);
  const endSide = oppositeSide(startSide);
  const sourceCenter = boundsCenter(from);
  const targetCenter = boundsCenter(to);
  const start = withCoordinate(boundsSidePoint(from, startSide), "x", snapCoordinate(sourceCenter.x, targetCenter.x, 1));
  const end = boundsSidePoint(to, endSide);
  return orthogonalPath(start, end, { preferredAxis: "y" });
}
function horizontalBackEdgePath(from, to) {
  const start = boundsSidePoint(from, "top");
  const end = boundsSidePoint(to, "top");
  const busY = afterFarthestCoordinate([start, end], "y", "up", BUS_CLEARANCE);
  return pathViaLane(start, lane("y", busY), end);
}
function horizontalEdgePath(from, to, direction) {
  const overlapsHorizontally = from.left < to.left + to.width && to.left < from.left + from.width;
  if (overlapsHorizontally)
    return verticalForwardEdgePath(from, to);
  if (isHorizontalBackEdge(from, to, direction))
    return horizontalBackEdgePath(from, to);
  const travel = horizontalTravel(from, to, direction);
  const startSide = sideForDirection(travel);
  return orthogonalPath(boundsSidePoint(from, startSide), boundsSidePoint(to, oppositeSide(startSide)), {
    preferredAxis: "x"
  });
}
function selfEdgePath(bounds, laneOffset = 0) {
  const start = boundsSidePoint(bounds, "right");
  const end = boundsSidePoint(bounds, "bottom");
  const rightLaneX = bounds.left + bounds.width + BUS_CLEARANCE + laneOffset;
  const bottomLaneY = bounds.top + bounds.height + 1 + laneOffset;
  return [start, { x: rightLaneX, y: start.y }, { x: rightLaneX, y: bottomLaneY }, { x: end.x, y: bottomLaneY }, end];
}
function parallelEdgePath(from, to, axis, laneCoordinate) {
  if (axis === "y") {
    const start = boundsSidePoint(from, "bottom");
    const end = boundsSidePoint(to, "bottom");
    return pathViaLane(start, lane("y", laneCoordinate), end);
  }
  const start = boundsSidePoint(from, "right");
  const end = boundsSidePoint(to, "right");
  return pathViaLane(start, lane("x", laneCoordinate), end);
}
function labelHeight(edge) {
  return edge.label ? splitDiagramLines(edge.label).length : 0;
}
function rightRenderExtent(route) {
  let right = Math.max(...route.points.map((point) => point.x));
  if (route.edge.label) {
    const label = flowchartRouteLabelLayout(route, diagramTextWidth);
    right = Math.max(right, label.point.x + label.width - 1);
  }
  return right;
}
function parallelLaneAxis(from, to) {
  return Math.abs(to.centerX - from.centerX) >= Math.abs(to.centerY - from.centerY) ? "y" : "x";
}
function edgePath(from, to, direction, leftBoundary) {
  if (from.id === to.id)
    return selfEdgePath(from);
  if (!isVerticalDirection(direction))
    return horizontalEdgePath(from, to, direction);
  const overlapsVertically = from.top < to.top + to.height && to.top < from.top + from.height;
  if (overlapsVertically) {
    const travel = centerCoordinate(to, "x") >= centerCoordinate(from, "x") ? "right" : "left";
    return orthogonalPath(boundsSidePoint(from, sideForDirection(travel)), boundsSidePoint(to, oppositeSide(sideForDirection(travel))));
  }
  return isVerticalBackEdge(from, to, direction) ? verticalBackEdgePath(from, to, leftBoundary) : verticalForwardEdgePath(from, to);
}
function sourceFanOutLane(sourcePort, targetPorts, axis, travel) {
  const sourceCoordinate = coordinate(sourcePort, axis);
  const unclamped = keepBefore(advanceCoordinate(coordinate(sourcePort, axis), travel, BUS_CLEARANCE), beforeNearestCoordinate(targetPorts, axis, travel, NODE_CLEARANCE), travel);
  return keepAfter(unclamped, sourceCoordinate, travel);
}
function reserveFanOutLane(sourcePort, targetPorts, axis, travel, reserved) {
  const preferred = sourceFanOutLane(sourcePort, targetPorts, axis, travel);
  const boundary = beforeNearestCoordinate(targetPorts, axis, travel, NODE_CLEARANCE);
  const source = coordinate(sourcePort, axis);
  const available = (() => {
    let checked = 0;
    for (let offset = 0;offset <= Math.abs(boundary - preferred) && checked < ROUTING_CANDIDATE_BUDGET; offset++) {
      checked++;
      const candidate = advanceCoordinate(preferred, travel, offset);
      if (keepBefore(candidate, boundary, travel) === candidate && keepAfter(candidate, source, travel) === candidate && !reserved.has(candidate)) {
        return candidate;
      }
    }
    for (let offset = 1;offset <= Math.abs(preferred - source) && checked < ROUTING_CANDIDATE_BUDGET; offset++) {
      checked++;
      const candidate = advanceCoordinate(preferred, travel, -offset);
      if (keepBefore(candidate, boundary, travel) === candidate && keepAfter(candidate, source, travel) === candidate && !reserved.has(candidate)) {
        return candidate;
      }
    }
  })();
  const routeLane = available ?? preferred;
  reserved.add(routeLane);
  return routeLane;
}
function targetFanInLane(sourcePorts, targetPort, axis, travel) {
  const targetCoordinate = coordinate(targetPort, axis);
  const unclamped = keepAfter(advanceCoordinate(coordinate(targetPort, axis), travel, -BUS_CLEARANCE), afterFarthestCoordinate(sourcePorts, axis, travel, NODE_CLEARANCE), travel);
  return keepBefore(unclamped, advanceCoordinate(targetCoordinate, travel, -1), travel);
}
function portForTravel(bounds, travel, role) {
  const side = role === "source" ? sideForDirection(travel) : oppositeSide(sideForDirection(travel));
  return boundsSidePoint(bounds, side);
}
function horizontalForwardRecords(edges, bounds, direction) {
  const travel = direction === "RL" ? "left" : "right";
  const records = [];
  for (const edge of edges) {
    const source = bounds.get(edge.from);
    const target = bounds.get(edge.to);
    if (!source || !target)
      continue;
    const forward = direction === "RL" ? centerCoordinate(target, "x") < centerCoordinate(source, "x") : centerCoordinate(target, "x") > centerCoordinate(source, "x");
    if (!forward)
      continue;
    records.push({
      edge,
      sourcePort: portForTravel(source, travel, "source"),
      targetPort: portForTravel(target, travel, "target")
    });
  }
  return records;
}
function verticalForwardRecords(edges, bounds, direction) {
  const travel = direction === "BT" ? "up" : "down";
  const records = [];
  for (const edge of edges) {
    const source = bounds.get(edge.from);
    const target = bounds.get(edge.to);
    if (!source || !target)
      continue;
    const forward = direction === "BT" ? centerCoordinate(target, "y") < centerCoordinate(source, "y") : centerCoordinate(target, "y") > centerCoordinate(source, "y");
    if (!forward)
      continue;
    records.push({
      edge,
      sourcePort: portForTravel(source, travel, "source"),
      targetPort: portForTravel(target, travel, "target")
    });
  }
  return records;
}
function horizontalExitSubgraph(diagram, edge) {
  for (const subgraph of [...diagram.subgraphs ?? []].reverse()) {
    if (subgraph.direction !== "LR" && subgraph.direction !== "RL")
      continue;
    if (subgraph.nodeIds.includes(edge.from) && !subgraph.nodeIds.includes(edge.to))
      return subgraph;
  }
  return;
}
function horizontalEntrySubgraph(diagram, edge) {
  for (const subgraph of [...diagram.subgraphs ?? []].reverse()) {
    if (subgraph.direction !== "LR" && subgraph.direction !== "RL")
      continue;
    if (subgraph.nodeIds.includes(edge.to) && !subgraph.nodeIds.includes(edge.from))
      return subgraph;
  }
  return;
}
function horizontalSubgraphEntryTravel(subgraph) {
  return subgraph.direction === "RL" ? "left" : "right";
}
function horizontalSubgraphEntryLane(subgraph, subgraphBound) {
  return subgraph.direction === "RL" ? subgraphBound.left + subgraphBound.width + BUS_CLEARANCE : subgraphBound.left - BUS_CLEARANCE;
}
function horizontalSubgraphJoinY(from, targetSubgraphBound) {
  if (from.centerY <= targetSubgraphBound.centerY) {
    const start = from.top + from.height;
    const end = targetSubgraphBound.top - 1;
    return start <= end ? Math.floor((start + end) / 2) : start;
  }
  const start = targetSubgraphBound.top + targetSubgraphBound.height;
  const end = from.top - 1;
  return start <= end ? Math.floor((start + end) / 2) : end;
}
function horizontalSubgraphExitJoinY(from, targetPort, targetBelow) {
  if (targetBelow) {
    const outside = from.top + from.height;
    const beforeTarget = targetPort.y - 1;
    const preferred = targetPort.y - BUS_CLEARANCE;
    return outside <= beforeTarget ? Math.min(Math.max(outside, preferred), beforeTarget) : beforeTarget;
  }
  const outside = from.top - 1;
  const afterTarget = targetPort.y + 1;
  const preferred = targetPort.y + BUS_CLEARANCE;
  return afterTarget <= outside ? Math.max(Math.min(outside, preferred), afterTarget) : afterTarget;
}
function groupRecords(records, key) {
  const groups = new Map;
  for (const record of records) {
    const groupKey = key(record);
    const group = groups.get(groupKey) ?? [];
    group.push(record);
    groups.set(groupKey, group);
  }
  return groups;
}
function fanRoute(edge, sourcePort, targetPort, routeLane) {
  return { edge, points: pathViaLane(sourcePort, routeLane, targetPort) };
}
function alignClusteredVerticalSources(records) {
  const xs = records.map((record) => record.sourcePort.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  if (maxX - minX > 1)
    return [...records];
  const x = Math.round(xs.reduce((total, value) => total + value, 0) / xs.length);
  return records.map((record) => ({ ...record, sourcePort: { ...record.sourcePort, x } }));
}
function routeHorizontalFanOut(records, bounds, direction, handled, routes) {
  const reservedBusLanes = new Set;
  const targetOwners = new Map;
  for (const [sourceId, sourceRecords] of groupRecords(records, (record) => record.edge.from)) {
    if (sourceRecords.length < 2)
      continue;
    const travel = direction === "RL" ? "left" : "right";
    const sourcePort = sourceRecords[0].sourcePort;
    const targetPorts = sourceRecords.map((record) => record.targetPort);
    const busX = reserveFanOutLane(sourcePort, targetPorts, "x", travel, reservedBusLanes);
    for (const record of sourceRecords) {
      const targetOwner = targetOwners.get(record.edge.to);
      targetOwners.set(record.edge.to, targetOwner ?? sourceId);
      const target = bounds.get(record.edge.to);
      if (!targetOwner || targetOwner === sourceId || !target) {
        routes.push(fanRoute(record.edge, sourcePort, record.targetPort, lane("x", busX)));
        handled.add(record.edge);
        continue;
      }
      const targetSide = sourcePort.y < record.targetPort.y ? "top" : "bottom";
      const targetPoint = boundsSidePoint(target, targetSide);
      const approach = shiftPoint(targetPoint, targetSide === "top" ? "up" : "down");
      routes.push({
        edge: record.edge,
        points: pathThrough([
          sourcePort,
          { x: busX, y: sourcePort.y },
          { x: busX, y: approach.y },
          approach,
          targetPoint
        ])
      });
      handled.add(record.edge);
    }
  }
}
function routeHorizontalFanIn(records, direction, handled, routes) {
  const unhandledRecords = records.filter((record) => !handled.has(record.edge));
  for (const targetRecords of groupRecords(unhandledRecords, (record) => record.edge.to).values()) {
    if (targetRecords.length < 2)
      continue;
    const travel = direction === "RL" ? "left" : "right";
    const targetPort = targetRecords[0].targetPort;
    const sourcePorts = targetRecords.map((record) => record.sourcePort);
    const busX = targetFanInLane(sourcePorts, targetPort, "x", travel);
    for (const record of targetRecords) {
      routes.push(fanRoute(record.edge, record.sourcePort, targetPort, lane("x", busX)));
      handled.add(record.edge);
    }
  }
}
function routeVerticalFanOut(records, direction, handled, routes) {
  for (const sourceRecords of groupRecords(records, (record) => record.edge.from).values()) {
    if (sourceRecords.length < 2)
      continue;
    const travel = direction === "BT" ? "up" : "down";
    const sourcePort = sourceRecords[0].sourcePort;
    const targetPorts = sourceRecords.map((record) => record.targetPort);
    const busY = sourceFanOutLane(sourcePort, targetPorts, "y", travel);
    for (const record of sourceRecords) {
      routes.push(fanRoute(record.edge, sourcePort, record.targetPort, lane("y", busY)));
      handled.add(record.edge);
    }
  }
}
function routeVerticalFanIn(records, direction, handled, routes) {
  const unhandledRecords = records.filter((record) => !handled.has(record.edge));
  for (const unalignedTargetRecords of groupRecords(unhandledRecords, (record) => record.edge.to).values()) {
    const targetRecords = alignClusteredVerticalSources(unalignedTargetRecords);
    if (targetRecords.length < 2)
      continue;
    const travel = direction === "BT" ? "up" : "down";
    const targetPort = targetRecords[0].targetPort;
    const sourcePorts = targetRecords.map((record) => record.sourcePort);
    const busY = targetFanInLane(sourcePorts, targetPort, "y", travel);
    for (const record of targetRecords) {
      routes.push(fanRoute(record.edge, record.sourcePort, targetPort, lane("y", busY)));
      handled.add(record.edge);
    }
  }
}
function routeParallelEdges(diagram, bounds, directionForEdge, directionAligned, handled, routes) {
  const groups = groupRecords(diagram.edges, (edge) => `${edge.from}:${edge.to}`);
  for (const edges of groups.values()) {
    if (edges.length < 2)
      continue;
    const from = bounds.get(edges[0].from);
    const to = bounds.get(edges[0].to);
    if (!from || !to)
      continue;
    if (from.id === to.id) {
      let laneOffset = 0;
      for (const edge of edges) {
        routes.push({ edge, points: selfEdgePath(from, laneOffset) });
        handled.add(edge);
        laneOffset++;
      }
      continue;
    }
    const parallelAxis = directionAligned && isVerticalDirection(directionForEdge(edges[0])) ? "x" : parallelLaneAxis(from, to);
    let previousRoute;
    for (const edge of edges) {
      const height = labelHeight(edge);
      const laneCoordinate = parallelAxis === "x" ? previousRoute ? rightRenderExtent(previousRoute) + NODE_CLEARANCE : Math.max(boundsSidePoint(from, "right").x, boundsSidePoint(to, "right").x) + (directionAligned ? 1 : 0) : previousRoute ? Math.max(...previousRoute.points.map((point) => point.y)) + (height > 1 ? height + 1 : 1) : Math.max(boundsSidePoint(from, "bottom").y, boundsSidePoint(to, "bottom").y) + (height > 1 ? height : 0);
      const route = {
        edge,
        points: parallelEdgePath(from, to, parallelAxis, laneCoordinate),
        labelAxis: parallelAxis === "x" ? "y" : "x"
      };
      routes.push(route);
      handled.add(edge);
      previousRoute = route;
    }
  }
}
function routeHorizontalSubgraphExitFanIn(diagram, bounds, subgraphBounds, handled, routes) {
  if (!subgraphBounds)
    return;
  const groups = new Map;
  for (const edge of diagram.edges) {
    if (handled.has(edge))
      continue;
    const subgraph = horizontalExitSubgraph(diagram, edge);
    const source = bounds.get(edge.from);
    const target = bounds.get(edge.to);
    if (!subgraph || !source || !target)
      continue;
    const key = `${subgraph.id}:${edge.to}`;
    const group = groups.get(key) ?? [];
    group.push({ edge, subgraph, source });
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    const subgraph = group[0].subgraph;
    const subgraphBound = subgraphBounds.get(subgraph.id);
    const target = bounds.get(group[0].edge.to);
    if (!subgraphBound || !target)
      continue;
    const travel = subgraph.direction === "RL" ? "left" : "right";
    const busX = subgraph.direction === "RL" ? subgraphBound.left - BUS_CLEARANCE : subgraphBound.left + subgraphBound.width + BUS_CLEARANCE;
    const targetSubgraph = horizontalEntrySubgraph(diagram, group[0].edge);
    const targetSubgraphBound = targetSubgraph ? subgraphBounds.get(targetSubgraph.id) : undefined;
    const targetBelow = target.centerY >= subgraphBound.centerY;
    const targetPort = targetSubgraph ? portForTravel(target, horizontalSubgraphEntryTravel(targetSubgraph), "target") : boundsSidePoint(target, targetBelow ? "top" : "bottom");
    const joinY = targetSubgraphBound ? horizontalSubgraphJoinY(subgraphBound, targetSubgraphBound) : horizontalSubgraphExitJoinY(subgraphBound, targetPort, targetBelow);
    const entryX = targetSubgraph && targetSubgraphBound ? horizontalSubgraphEntryLane(targetSubgraph, targetSubgraphBound) : targetPort.x;
    for (const record of group) {
      const sourcePort = portForTravel(record.source, travel, "source");
      routes.push({
        edge: record.edge,
        points: pathThrough([
          sourcePort,
          { x: busX, y: sourcePort.y },
          { x: busX, y: joinY },
          { x: entryX, y: joinY },
          { x: entryX, y: targetPort.y },
          targetPort
        ])
      });
      handled.add(record.edge);
    }
  }
}
function routeHorizontalSubgraphEntries(diagram, bounds, subgraphBounds, handled, routes) {
  if (!subgraphBounds)
    return;
  for (const edge of diagram.edges) {
    if (handled.has(edge))
      continue;
    const subgraph = horizontalEntrySubgraph(diagram, edge);
    const subgraphBound = subgraph ? subgraphBounds.get(subgraph.id) : undefined;
    const from = bounds.get(edge.from);
    const to = bounds.get(edge.to);
    if (!subgraph || !subgraphBound || !from || !to)
      continue;
    const targetPort = portForTravel(to, horizontalSubgraphEntryTravel(subgraph), "target");
    const entryX = horizontalSubgraphEntryLane(subgraph, subgraphBound);
    const travel = verticalTravel(from, to);
    const sourcePort = portForTravel(from, travel, "source");
    routes.push({
      edge,
      points: pathThrough([sourcePort, { x: entryX, y: sourcePort.y }, { x: entryX, y: targetPort.y }, targetPort])
    });
    handled.add(edge);
  }
}
function pathIntersectsBounds(points, bounds, allowedContact = undefined) {
  const right = bounds.left + bounds.width - 1;
  const bottom = bounds.top + bounds.height - 1;
  for (let index = 1;index < points.length; index++) {
    const from = points[index - 1];
    const to = points[index];
    if (from.x === to.x) {
      if (from.x < bounds.left || from.x > right)
        continue;
      const overlapTop = Math.max(Math.min(from.y, to.y), bounds.top);
      const overlapBottom = Math.min(Math.max(from.y, to.y), bottom);
      if (overlapTop > overlapBottom)
        continue;
      const sourceContact = (allowedContact === "source" || allowedContact === "both") && index === 1 && overlapTop === overlapBottom && from.x === points[0].x && overlapTop === points[0].y;
      const targetContact = (allowedContact === "target" || allowedContact === "both") && index === points.length - 1 && overlapTop === overlapBottom && to.x === points.at(-1).x && overlapTop === points.at(-1).y;
      if (!sourceContact && !targetContact)
        return true;
      continue;
    }
    if (from.y < bounds.top || from.y > bottom)
      continue;
    const overlapLeft = Math.max(Math.min(from.x, to.x), bounds.left);
    const overlapRight = Math.min(Math.max(from.x, to.x), right);
    if (overlapLeft > overlapRight)
      continue;
    const sourceContact = (allowedContact === "source" || allowedContact === "both") && index === 1 && overlapLeft === overlapRight && overlapLeft === points[0].x && from.y === points[0].y;
    const targetContact = (allowedContact === "target" || allowedContact === "both") && index === points.length - 1 && overlapLeft === overlapRight && overlapLeft === points.at(-1).x && to.y === points.at(-1).y;
    if (!sourceContact && !targetContact)
      return true;
  }
  return false;
}
function labelIntersectsBounds(label, bounds) {
  if (!label)
    return false;
  return label.point.x <= bounds.left + bounds.width - 1 && label.point.x + label.width - 1 >= bounds.left && label.point.y <= bounds.top + bounds.height - 1 && label.point.y + label.height - 1 >= bounds.top;
}
function labelIntersectsSubgraphFrame(label, bounds) {
  if (!label)
    return false;
  const labelRight = label.point.x + label.width - 1;
  const labelBottom = label.point.y + label.height - 1;
  const right = bounds.left + bounds.width - 1;
  const bottom = bounds.top + bounds.height - 1;
  return label.point.x <= right && labelRight >= bounds.left && (label.point.y <= bounds.top && labelBottom >= bounds.top || label.point.y <= bottom && labelBottom >= bottom) || label.point.y <= bottom && labelBottom >= bounds.top && (label.point.x <= bounds.left && labelRight >= bounds.left || label.point.x <= right && labelRight >= right);
}
function routeLength(route) {
  let length = 0;
  for (let index = 1;index < route.points.length; index++) {
    const from = route.points[index - 1];
    const to = route.points[index];
    length += Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
  }
  return length;
}
function labelIntersectsLabels(label, otherLabels) {
  if (!label)
    return false;
  return otherLabels.some((otherLabel) => labelIntersectsBounds(label, {
    left: otherLabel.point.x,
    top: otherLabel.point.y,
    width: otherLabel.width,
    height: otherLabel.height
  }));
}
function labelIntersectsRoutePaths(label, routes) {
  if (!label)
    return false;
  return label.lines.some((line, lineIndex) => {
    const width = diagramTextWidth(line) - 2;
    if (width <= 0)
      return false;
    return routes.some((route) => pathIntersectsBounds(route.points, {
      left: label.point.x + 1,
      top: label.point.y + lineIndex,
      width,
      height: 1
    }));
  });
}
function routeIntersectsLabels(route, labels) {
  return labels.some((label) => label.lines.some((line, lineIndex) => {
    const width = diagramTextWidth(line) - 2;
    return width > 0 && pathIntersectsBounds(route.points, {
      left: label.point.x + 1,
      top: label.point.y + lineIndex,
      width,
      height: 1
    });
  }));
}
function pathsIntersect(left, right) {
  const occupied = new Set(orthogonalPathPoints(left).map((point) => `${point.x}:${point.y}`));
  return orthogonalPathPoints(right).some((point) => occupied.has(`${point.x}:${point.y}`));
}
function endpointDisjoint(left, right) {
  return left.from !== right.from && left.from !== right.to && left.to !== right.from && left.to !== right.to;
}
function endpointConflictsWithRoutes(route, otherRoutes) {
  const source = route.points[0];
  const target = route.points.at(-1);
  if (!source || !target)
    return false;
  return otherRoutes.some((other) => {
    const otherSource = other.points[0];
    const otherTarget = other.points.at(-1);
    return otherSource && target.x === otherSource.x && target.y === otherSource.y || otherTarget && source.x === otherTarget.x && source.y === otherTarget.y;
  });
}
function pathRunsAlongFrame(points, bounds) {
  const right = bounds.left + bounds.width - 1;
  const bottom = bounds.top + bounds.height - 1;
  for (let index = 1;index < points.length; index++) {
    const segment = segmentBetween(points[index - 1], points[index]);
    if (!segment)
      continue;
    const span = segmentSpan(segment);
    if (segment.axis === "x" && (segment.from.y === bounds.top || segment.from.y === bottom) && Math.min(span.end, right) > Math.max(span.start, bounds.left)) {
      return true;
    }
    if (segment.axis === "y" && (segment.from.x === bounds.left || segment.from.x === right) && Math.min(span.end, bottom) > Math.max(span.start, bounds.top)) {
      return true;
    }
  }
  return false;
}
function subgraphTitleBounds(bounds) {
  const lines = splitDiagramLines(bounds.label);
  return {
    left: bounds.left + 2,
    top: bounds.labelSide === "top" ? bounds.top : bounds.top + bounds.height - lines.length,
    width: Math.max(...lines.map((line) => diagramTextWidth(` ${line} `))),
    height: lines.length
  };
}
function avoidNodeObstacles(route, routes, bounds, subgraphBounds, routeIndex, diagram) {
  const allNodeBounds = [...bounds.values()];
  const allSubgraphBounds = [...subgraphBounds?.values() ?? []];
  const subgraphs = diagram.subgraphs ?? [];
  const contains = (subgraph, nodeId) => subgraph.nodeIds.includes(nodeId) || subgraphs.some((child) => child.parentId === subgraph.id && contains(child, nodeId));
  const owner = [...subgraphs].reverse().find((subgraph) => {
    if (!contains(subgraph, route.edge.from) || !contains(subgraph, route.edge.to))
      return false;
    const children = subgraphs.filter((child) => child.parentId === subgraph.id);
    return children.some((child) => contains(child, route.edge.from)) && children.some((child) => contains(child, route.edge.to)) && !children.some((child) => contains(child, route.edge.from) && contains(child, route.edge.to));
  });
  const ownerBounds = owner ? subgraphBounds?.get(owner.id) : undefined;
  const leavesOwner = (candidate) => Boolean(ownerBounds && candidate.points.some((point) => point.x <= ownerBounds.left || point.x >= ownerBounds.left + ownerBounds.width - 1 || point.y <= ownerBounds.top || point.y >= ownerBounds.top + ownerBounds.height - 1));
  const otherRoutes = routes.filter((_, index) => index !== routeIndex);
  const otherLabels = otherRoutes.flatMap((otherRoute) => otherRoute.edge.label ? [flowchartRouteLabelLayout(otherRoute, diagramTextWidth)] : []);
  const intersectsNode = (candidate) => allNodeBounds.some((bound) => {
    const isSource = bound.id === route.edge.from;
    const isTarget = bound.id === route.edge.to;
    const allowedContact = isSource && isTarget ? "both" : isSource ? "source" : isTarget ? "target" : undefined;
    return pathIntersectsBounds(candidate.points, bound, allowedContact);
  });
  const intersectsStructuralObstacle = (candidate) => intersectsNode(candidate) || allSubgraphBounds.some((bound) => pathRunsAlongFrame(candidate.points, bound) || bound.label.length > 0 && pathIntersectsBounds(candidate.points, subgraphTitleBounds(bound)));
  const intersectsRoutingObstacle = (candidate) => intersectsStructuralObstacle(candidate) || endpointConflictsWithRoutes(candidate, otherRoutes) || otherRoutes.some((other) => endpointDisjoint(candidate.edge, other.edge) && pathsIntersect(candidate.points, other.points));
  const intersectsObstacle = (candidate) => {
    const label = candidate.edge.label ? flowchartRouteLabelLayout(candidate, diagramTextWidth) : undefined;
    return leavesOwner(candidate) || intersectsRoutingObstacle(candidate) || allNodeBounds.some((bound) => labelIntersectsBounds(label, bound)) || allSubgraphBounds.some((bound) => labelIntersectsSubgraphFrame(label, bound)) || labelIntersectsLabels(label, otherLabels) || labelIntersectsRoutePaths(label, otherRoutes) || routeIntersectsLabels(candidate, otherLabels);
  };
  if (!intersectsObstacle(route))
    return route;
  const from = bounds.get(route.edge.from);
  const to = bounds.get(route.edge.to);
  if (!from || !to)
    return route;
  const routingBounds = [...allNodeBounds, ...allSubgraphBounds];
  const rightBusX = Math.max(...routingBounds.map((bound) => bound.left + bound.width - 1)) + BUS_CLEARANCE;
  const leftBusX = Math.min(...routingBounds.map((bound) => bound.left)) - BUS_CLEARANCE;
  const topBusY = Math.min(...routingBounds.map((bound) => bound.top)) - BUS_CLEARANCE;
  const bottomBusY = Math.max(...routingBounds.map((bound) => bound.top + bound.height - 1)) + BUS_CLEARANCE;
  const rightBusXs = [
    ...new Set([
      rightBusX,
      ...ownerBounds ? [ownerBounds.left + ownerBounds.width - 2] : [],
      ...otherLabels.map((label) => Math.max(rightBusX, label.point.x + label.width - 1 + NODE_CLEARANCE))
    ])
  ].sort((left, right) => left - right);
  const leftBusXs = [
    ...new Set([
      leftBusX,
      ...ownerBounds ? [ownerBounds.left + 1] : [],
      ...otherLabels.map((label) => Math.min(leftBusX, label.point.x - NODE_CLEARANCE))
    ])
  ].sort((left, right) => right - left);
  const topBusYs = [
    ...new Set([
      topBusY,
      ...ownerBounds ? [ownerBounds.top + 1] : [],
      ...otherLabels.map((label) => Math.min(topBusY, label.point.y - NODE_CLEARANCE))
    ])
  ].sort((left, right) => right - left);
  const bottomBusYs = [
    ...new Set([
      bottomBusY,
      ...ownerBounds ? [ownerBounds.top + ownerBounds.height - 2] : [],
      ...otherLabels.map((label) => Math.max(bottomBusY, label.point.y + label.height - 1 + NODE_CLEARANCE))
    ])
  ].sort((left, right) => left - right);
  const busLimit = Math.max(1, Math.floor(Math.sqrt(ROUTING_CANDIDATE_BUDGET / 4)));
  const candidateLeftBusXs = leftBusXs.length > busLimit ? leftBusXs.slice(0, busLimit) : leftBusXs;
  const candidateRightBusXs = rightBusXs.length > busLimit ? rightBusXs.slice(0, busLimit) : rightBusXs;
  const candidateTopBusYs = topBusYs.length > busLimit ? topBusYs.slice(0, busLimit) : topBusYs;
  const candidateBottomBusYs = bottomBusYs.length > busLimit ? bottomBusYs.slice(0, busLimit) : bottomBusYs;
  const buses = [
    ...candidateLeftBusXs.map((coordinate) => lane("x", coordinate)),
    ...candidateRightBusXs.map((coordinate) => lane("x", coordinate)),
    ...candidateTopBusYs.map((coordinate) => lane("y", coordinate)),
    ...candidateBottomBusYs.map((coordinate) => lane("y", coordinate))
  ];
  const routeViaBus = (start, targetSide, bus) => {
    const end = boundsSidePoint(to, targetSide);
    const approach = shiftPoint(end, targetSide === "left" ? "left" : targetSide === "right" ? "right" : targetSide === "top" ? "up" : "down");
    return {
      ...route,
      labelAxis: route.labelAxis === undefined ? undefined : bus.axis === "x" ? "y" : "x",
      points: bus.axis === "x" ? pathThrough([start, { x: bus.coordinate, y: start.y }, { x: bus.coordinate, y: approach.y }, approach, end]) : pathThrough([
        start,
        { x: start.x, y: bus.coordinate },
        { x: approach.x, y: bus.coordinate },
        approach,
        end
      ])
    };
  };
  const selfLoops = from.id !== to.id ? [] : [
    ...candidateRightBusXs.flatMap((busX) => candidateBottomBusYs.map((busY) => ({
      ...route,
      points: pathThrough([
        boundsSidePoint(from, "right"),
        { x: busX, y: from.centerY },
        { x: busX, y: busY },
        { x: from.centerX, y: busY },
        boundsSidePoint(from, "bottom")
      ])
    }))),
    ...candidateBottomBusYs.flatMap((busY) => candidateLeftBusXs.map((busX) => ({
      ...route,
      points: pathThrough([
        boundsSidePoint(from, "bottom"),
        { x: from.centerX, y: busY },
        { x: busX, y: busY },
        { x: busX, y: from.centerY },
        boundsSidePoint(from, "left")
      ])
    }))),
    ...candidateLeftBusXs.flatMap((busX) => candidateTopBusYs.map((busY) => ({
      ...route,
      points: pathThrough([
        boundsSidePoint(from, "left"),
        { x: busX, y: from.centerY },
        { x: busX, y: busY },
        { x: from.centerX, y: busY },
        boundsSidePoint(from, "top")
      ])
    }))),
    ...candidateTopBusYs.flatMap((busY) => candidateRightBusXs.map((busX) => ({
      ...route,
      points: pathThrough([
        boundsSidePoint(from, "top"),
        { x: from.centerX, y: busY },
        { x: busX, y: busY },
        { x: busX, y: from.centerY },
        boundsSidePoint(from, "right")
      ])
    })))
  ];
  const targetSides = ["left", "right", "top", "bottom"];
  const shortest = (candidates, accept) => candidates.filter(accept).sort((left, right) => routeLength(left) - routeLength(right))[0];
  if (from.id === to.id)
    return shortest(selfLoops, (candidate) => !intersectsObstacle(candidate)) ?? shortest(selfLoops, (candidate) => !intersectsStructuralObstacle(candidate)) ?? route;
  const currentTargetSide = sideForOutsidePoint(to, route.points.at(-1));
  const preservedTargets = buses.map((bus) => routeViaBus(route.points[0], currentTargetSide, bus));
  const sameSides = [
    ...candidateRightBusXs.map((busX) => ({
      ...route,
      labelAxis: route.labelAxis === undefined ? undefined : "y",
      points: pathViaLane(boundsSidePoint(from, "right"), lane("x", busX), boundsSidePoint(to, "right"))
    })),
    ...candidateLeftBusXs.map((busX) => ({
      ...route,
      labelAxis: route.labelAxis === undefined ? undefined : "y",
      points: pathViaLane(boundsSidePoint(from, "left"), lane("x", busX), boundsSidePoint(to, "left"))
    })),
    ...candidateTopBusYs.map((busY) => ({
      ...route,
      labelAxis: route.labelAxis === undefined ? undefined : "x",
      points: pathViaLane(boundsSidePoint(from, "top"), lane("y", busY), boundsSidePoint(to, "top"))
    })),
    ...candidateBottomBusYs.map((busY) => ({
      ...route,
      labelAxis: route.labelAxis === undefined ? undefined : "x",
      points: pathViaLane(boundsSidePoint(from, "bottom"), lane("y", busY), boundsSidePoint(to, "bottom"))
    }))
  ];
  const preservedSources = targetSides.flatMap((targetSide) => buses.map((bus) => routeViaBus(route.points[0], targetSide, bus)));
  const attachments = targetSides.flatMap((sourceSide) => targetSides.flatMap((targetSide) => buses.map((bus) => routeViaBus(boundsSidePoint(from, sourceSide), targetSide, bus))));
  if (subgraphBounds) {
    return shortest(preservedTargets, (candidate) => !intersectsObstacle(candidate)) ?? shortest(sameSides, (candidate) => !intersectsObstacle(candidate)) ?? shortest(preservedSources, (candidate) => !intersectsObstacle(candidate)) ?? shortest(attachments, (candidate) => !intersectsObstacle(candidate)) ?? shortest(preservedSources, (candidate) => !intersectsStructuralObstacle(candidate)) ?? shortest(attachments, (candidate) => !intersectsStructuralObstacle(candidate)) ?? route;
  }
  return sameSides.find((candidate) => !intersectsObstacle(candidate)) ?? shortest(preservedTargets, (candidate) => !intersectsObstacle(candidate)) ?? attachments.find((candidate) => !intersectsObstacle(candidate)) ?? shortest(preservedSources, (candidate) => !intersectsObstacle(candidate)) ?? shortest(attachments, (candidate) => !intersectsStructuralObstacle(candidate)) ?? shortest(preservedSources, (candidate) => !intersectsStructuralObstacle(candidate)) ?? route;
}
function avoidLabelOverlap(route, otherRoutes, bounds, subgraphBounds, targetWidth, includeLabelWidth = true) {
  if (!route.edge.label)
    return route;
  const nodeBounds = [...bounds.values()];
  const frameBounds = [...subgraphBounds?.values() ?? []];
  const otherLabels = otherRoutes.flatMap((other) => other.edge.label ? [flowchartRouteLabelLayout(other, diagramTextWidth)] : []);
  const otherConnectorBounds = otherRoutes.flatMap((other) => {
    const source = bounds.get(other.edge.from);
    const sourcePoint = other.points[0];
    if (!source || !sourcePoint)
      return [];
    const connector = flowchartSourceConnector(source, sourcePoint);
    return [
      { left: connector.x, top: connector.y, width: 1, height: 1 },
      { left: sourcePoint.x, top: sourcePoint.y, width: 1, height: 1 }
    ];
  });
  const hasParallelRoute = otherRoutes.some((other) => other.edge.from === route.edge.from && other.edge.to === route.edge.to);
  const intersectsObstacle = (label) => targetWidth !== undefined && (hasParallelRoute || !includeLabelWidth ? label.point.x > targetWidth : label.point.x + label.width > targetWidth) || nodeBounds.some((bound) => labelIntersectsBounds(label, bound)) || frameBounds.some((bound) => labelIntersectsSubgraphFrame(label, bound)) || labelIntersectsLabels(label, otherLabels) || labelIntersectsRoutePaths(label, otherRoutes) || otherConnectorBounds.some((bound) => labelIntersectsBounds(label, bound));
  const current = flowchartRouteLabelLayout(route, diagramTextWidth);
  if (!intersectsObstacle(current))
    return route;
  const seen = new Set;
  let remaining = ROUTING_CANDIDATE_BUDGET;
  const available = (candidate) => {
    remaining--;
    const key = `${candidate.x}:${candidate.y}`;
    if (seen.has(key))
      return false;
    seen.add(key);
    return !intersectsObstacle({ ...current, point: candidate });
  };
  for (let index = 1;index < route.points.length && remaining > 0; index++) {
    const segment = segmentBetween(route.points[index - 1], route.points[index]);
    if (!segment)
      continue;
    const label = flowchartEdgeLabelLayout(route.points, route.edge.label, diagramTextWidth, route.labelAxis, index - 1);
    const fixed = segment.axis === "y" ? [label.point, { x: segment.from.x - label.width, y: label.point.y }] : [
      label.point,
      { x: label.point.x, y: segment.from.y - label.height },
      { x: label.point.x, y: segment.from.y + 1 }
    ];
    for (const candidate of fixed) {
      if (remaining <= 0)
        return route;
      if (available(candidate))
        return { ...route, labelPoint: candidate };
    }
    if (segment.axis === "y") {
      const bottom = Math.max(segment.from.y, segment.to.y) - label.height + 1;
      for (let y = Math.min(segment.from.y, segment.to.y);y <= bottom && remaining > 0; y++) {
        for (const x of [segment.from.x + 1, segment.from.x - label.width]) {
          const candidate = { x, y };
          if (available(candidate))
            return { ...route, labelPoint: candidate };
          if (remaining <= 0)
            return route;
        }
      }
      continue;
    }
    const right = Math.max(segment.from.x, segment.to.x) - label.width + 1;
    for (let x = Math.min(segment.from.x, segment.to.x);x <= right && remaining > 0; x++) {
      for (const y of [segment.from.y, segment.from.y - label.height, segment.from.y + 1]) {
        const candidate = { x, y };
        if (available(candidate))
          return { ...route, labelPoint: candidate };
        if (remaining <= 0)
          return route;
      }
    }
  }
  if (targetWidth !== undefined && includeLabelWidth && current.point.x + current.width > targetWidth) {
    const x = Math.max(0, targetWidth - current.width);
    for (let distance = 0;distance < 100; distance++) {
      for (const y of distance === 0 ? [current.point.y] : [current.point.y - distance, current.point.y + distance]) {
        if (y < 0 || intersectsObstacle({ ...current, point: { x, y } }))
          continue;
        return { ...route, labelPoint: { x, y } };
      }
    }
  }
  return route;
}
function routeFlowchartEdges(diagram, bounds, directionForEdge = () => diagram.direction, subgraphBounds, targetWidth, directionAligned = false) {
  const routedDiagram = { ...diagram, edges: diagram.edges.filter((edge) => !edge.orderOnly) };
  const handled = new Set;
  const routes = [];
  const leftBoundary = subgraphBounds ? Math.min(...[...bounds.values(), ...subgraphBounds.values()].map((bound) => bound.left)) : undefined;
  routeParallelEdges(routedDiagram, bounds, directionForEdge, directionAligned, handled, routes);
  for (const direction of ["LR", "RL"]) {
    const horizontalEdges = routedDiagram.edges.filter((edge) => !handled.has(edge) && directionForEdge(edge) === direction);
    if (horizontalEdges.length === 0)
      continue;
    const records = horizontalForwardRecords(horizontalEdges, bounds, direction);
    routeHorizontalFanOut(records, bounds, direction, handled, routes);
    routeHorizontalFanIn(records, direction, handled, routes);
  }
  routeHorizontalSubgraphExitFanIn(routedDiagram, bounds, subgraphBounds, handled, routes);
  routeHorizontalSubgraphEntries(routedDiagram, bounds, subgraphBounds, handled, routes);
  for (const direction of ["TD", "TB", "BT"]) {
    const verticalEdges = routedDiagram.edges.filter((edge) => !handled.has(edge) && directionForEdge(edge) === direction);
    if (verticalEdges.length === 0)
      continue;
    const records = verticalForwardRecords(verticalEdges, bounds, direction);
    routeVerticalFanOut(records, direction, handled, routes);
    routeVerticalFanIn(records, direction, handled, routes);
  }
  for (const edge of routedDiagram.edges) {
    if (handled.has(edge))
      continue;
    const from = bounds.get(edge.from);
    const to = bounds.get(edge.to);
    if (!from || !to)
      continue;
    routes.push({ edge, points: edgePath(from, to, directionForEdge(edge), leftBoundary) });
  }
  for (let index = routes.length - 1;index >= 0; index--) {
    routes[index] = avoidNodeObstacles(routes[index], routes, bounds, subgraphBounds, index, routedDiagram);
  }
  const subgraphs = diagram.subgraphs ?? [];
  const subgraphById = new Map(subgraphs.map((subgraph) => [subgraph.id, subgraph]));
  const containers = (id) => {
    const ids = new Set;
    let current = subgraphs.find((subgraph) => subgraph.nodeIds.includes(id));
    while (current) {
      ids.add(current.id);
      current = current.parentId ? subgraphById.get(current.parentId) : undefined;
    }
    return ids;
  };
  const groupedLabelEdge = (edge) => {
    const fromContainers = containers(edge.from);
    if (![...containers(edge.to)].some((id) => fromContainers.has(id)))
      return false;
    const targets = new Set(routedDiagram.edges.filter((candidate) => candidate.label && candidate.from === edge.from).map((candidate) => candidate.to));
    const sources = new Set(routedDiagram.edges.filter((candidate) => candidate.label && candidate.to === edge.to).map((candidate) => candidate.from));
    return targets.size > 1 || sources.size > 1;
  };
  return routes.reduce((resolved, route, index) => {
    const grouped = groupedLabelEdge(route.edge);
    return [
      ...resolved,
      avoidLabelOverlap(route, [...resolved, ...routes.slice(index + 1)], bounds, subgraphBounds, targetWidth !== undefined && subgraphs.length > 0 && grouped ? Math.max(1, targetWidth - 5) : targetWidth, subgraphs.length === 0 || grouped)
    ];
  }, []);
}
function avoidFlowchartFrameBorders(routes, bounds, subgraphBounds) {
  const inside = (node, frame) => node.left >= frame.left && node.top >= frame.top && node.left + node.width <= frame.left + frame.width && node.top + node.height <= frame.top + frame.height;
  for (const route of routes) {
    const source = bounds.get(route.edge.from);
    const target = bounds.get(route.edge.to);
    for (const frame of subgraphBounds.values()) {
      const inward = Boolean(source && target && inside(source, frame) && inside(target, frame));
      const right = frame.left + frame.width - 1;
      const bottom = frame.top + frame.height - 1;
      const points = [route.points[0]];
      for (let index = 1;index < route.points.length; index++) {
        const from = route.points[index - 1];
        const to = route.points[index];
        const segment = segmentBetween(from, to);
        if (!segment)
          continue;
        const span = segmentSpan(segment);
        const horizontalSide = segment.axis === "x" && Math.min(span.end, right) > Math.max(span.start, frame.left) ? segment.from.y === frame.top ? "top" : segment.from.y === bottom ? "bottom" : undefined : undefined;
        const verticalSide = segment.axis === "y" && Math.min(span.end, bottom) > Math.max(span.start, frame.top) ? segment.from.x === frame.left ? "left" : segment.from.x === right ? "right" : undefined : undefined;
        if (!horizontalSide && !verticalSide) {
          points.push(to);
          continue;
        }
        const offset = horizontalSide ? horizontalSide === "top" ? frame.top + (inward ? 1 : -1) : bottom + (inward ? -1 : 1) : verticalSide === "left" ? frame.left + (inward ? 1 : -1) : right + (inward ? -1 : 1);
        if (horizontalSide)
          points.push({ x: from.x, y: offset }, { x: to.x, y: offset }, to);
        else
          points.push({ x: offset, y: from.y }, { x: offset, y: to.y }, to);
      }
      route.points = pathThrough(points);
    }
  }
}
function sideForOutsidePoint(bounds, sourcePoint) {
  if (sourcePoint.x < bounds.left)
    return "left";
  if (sourcePoint.x >= bounds.left + bounds.width)
    return "right";
  if (sourcePoint.y < bounds.top)
    return "top";
  return "bottom";
}
function connectorChar(side) {
  switch (side) {
    case "left":
      return "\u2524";
    case "right":
      return "\u251C";
    case "top":
      return "\u2534";
    case "bottom":
      return "\u252C";
  }
}
function flowchartSourceConnector(from, sourcePoint) {
  const side = sideForOutsidePoint(from, sourcePoint);
  const connector = boundsSidePoint(from, side, "border");
  return {
    x: side === "top" || side === "bottom" ? sourcePoint.x : connector.x,
    y: side === "left" || side === "right" ? sourcePoint.y : connector.y,
    char: connectorChar(side)
  };
}

// node_modules/opentui-markdown-render/src/merman/flowchart/layout.ts
var DEFAULT_MIN_NODE_GAP = 5;
var DEFAULT_MIN_BRANCH_LABEL_GAP = 12;
var DEFAULT_MAX_UNLABELED_RANK_WIDTH = 120;
var DEFAULT_MIN_RANK_GAP = 7;
var DEFAULT_MIN_VERTICAL_RANK_GAP = 4;
var COMPACT_MIN_RANK_GAP = 4;
var COMPACT_MIN_VERTICAL_RANK_GAP = 2;
var SUBGRAPH_PADDING_X = 2;
var SUBGRAPH_PADDING_TOP = 1;
var SUBGRAPH_PADDING_BOTTOM = 1;
function horizontalRankGaps(diagram, normalizedRanks, rankKeys, fallback) {
  const gaps = Array.from({ length: Math.max(0, rankKeys.length - 1) }, () => fallback);
  const rankIndexes = new Map(rankKeys.map((rank, index) => [rank, index]));
  for (const edge of diagram.edges) {
    if (!edge.label)
      continue;
    const fromIndex = rankIndexes.get(normalizedRanks.get(edge.from) ?? -1);
    const toIndex = rankIndexes.get(normalizedRanks.get(edge.to) ?? -1);
    if (fromIndex === undefined || toIndex === undefined || fromIndex === toIndex)
      continue;
    const labelGap = flowchartHorizontalLabelRankGap(flowchartLabelWidth(edge.label, visualLength));
    for (let index = Math.min(fromIndex, toIndex);index < Math.max(fromIndex, toIndex); index++) {
      gaps[index] = Math.max(gaps[index], labelGap);
    }
  }
  return gaps;
}
function verticalRankGaps(diagram, normalizedRanks, rankKeys, fallback) {
  const gaps = Array.from({ length: Math.max(0, rankKeys.length - 1) }, () => fallback);
  const rankIndexes = new Map(rankKeys.map((rank, index) => [rank, index]));
  for (const edge of diagram.edges) {
    if (!edge.label)
      continue;
    const fromIndex = rankIndexes.get(normalizedRanks.get(edge.from) ?? -1);
    const toIndex = rankIndexes.get(normalizedRanks.get(edge.to) ?? -1);
    if (fromIndex === undefined || toIndex === undefined || fromIndex === toIndex)
      continue;
    const labelHeight = splitDiagramLines(edge.label).length;
    for (let index = Math.min(fromIndex, toIndex);index < Math.max(fromIndex, toIndex); index++) {
      gaps[index] = Math.max(gaps[index], labelHeight + 2);
    }
  }
  return gaps;
}
function isHorizontalDirection(direction) {
  return direction === "LR" || direction === "RL";
}
function visualLength(value) {
  return diagramTextWidth(value);
}
function normalizePositiveInt(value, fallback) {
  if (value === undefined || !Number.isFinite(value))
    return fallback;
  return Math.max(1, Math.trunc(value));
}
function nodeSize(node) {
  const { lines, width } = measureDiagramTextBox(node.label, { paddingX: 2 });
  const innerWidth = width - 4;
  if (node.shape === "decision") {
    const width = innerWidth + 6;
    return {
      width: width % 2 === 0 ? width + 1 : width,
      height: Math.max(5, lines.length + 4),
      lines
    };
  }
  if (node.shape === "circle")
    return { width: Math.max(9, innerWidth + 6), height: Math.max(5, lines.length + 4), lines };
  if (node.shape === "hexagon")
    return { width: Math.max(9, innerWidth + 6), height: Math.max(5, lines.length + 4), lines };
  if (node.shape === "parallelogram")
    return { width: innerWidth + 6, height: lines.length + 2, lines };
  if (node.shape === "database")
    return { width: innerWidth + 4, height: lines.length + 4, lines };
  if (node.shape === "subroutine")
    return { width: innerWidth + 6, height: lines.length + 2, lines };
  return { width: innerWidth + 4, height: lines.length + 2, lines };
}
function rankNodes(diagram) {
  const ranks = new Map;
  const outgoing = new Map;
  const incoming = new Set;
  const incomingCounts = new Map(diagram.nodes.map((node) => [node.id, 0]));
  const nodeIds = new Set(diagram.nodes.map((node) => node.id));
  const rankEdges = diagram.edges.flatMap((edge) => {
    if (!edge.orderOnly)
      return [edge];
    const fromIds = nodeIds.has(edge.from) ? [edge.from] : [...collectSubgraphNodeIds(diagram, edge.from)];
    const toIds = nodeIds.has(edge.to) ? [edge.to] : [...collectSubgraphNodeIds(diagram, edge.to)];
    return fromIds.flatMap((from) => toIds.map((to) => ({ ...edge, from, to })));
  });
  for (const edge of rankEdges) {
    const list = outgoing.get(edge.from) ?? [];
    list.push(edge.to);
    outgoing.set(edge.from, list);
    incoming.add(edge.to);
    incomingCounts.set(edge.to, (incomingCounts.get(edge.to) ?? 0) + 1);
  }
  const starts = diagram.nodes.filter((node) => !incoming.has(node.id));
  if (starts.length === 0 && diagram.nodes[0])
    starts.push(diagram.nodes[0]);
  const queue = starts.map((node) => node.id);
  for (const node of starts)
    ranks.set(node.id, 0);
  for (let index = 0;index < queue.length; index++) {
    const id = queue[index];
    const rank = ranks.get(id) ?? 0;
    for (const to of outgoing.get(id) ?? []) {
      const nextRank = rank + 1;
      if ((ranks.get(to) ?? Number.POSITIVE_INFINITY) <= nextRank)
        continue;
      ranks.set(to, nextRank);
      queue.push(to);
    }
  }
  for (const node of diagram.nodes) {
    if (!ranks.has(node.id))
      ranks.set(node.id, ranks.size);
  }
  const acyclicRanks = new Map;
  const acyclicQueue = diagram.nodes.filter((node) => incomingCounts.get(node.id) === 0).map((node) => node.id);
  for (const id of acyclicQueue)
    acyclicRanks.set(id, 0);
  for (let index = 0;index < acyclicQueue.length; index++) {
    const id = acyclicQueue[index];
    const rank = acyclicRanks.get(id) ?? 0;
    for (const to of outgoing.get(id) ?? []) {
      acyclicRanks.set(to, Math.max(acyclicRanks.get(to) ?? 0, rank + 1));
      const remainingIncoming = (incomingCounts.get(to) ?? 0) - 1;
      incomingCounts.set(to, remainingIncoming);
      if (remainingIncoming === 0)
        acyclicQueue.push(to);
    }
  }
  for (const [id, rank] of acyclicRanks)
    ranks.set(id, rank);
  return ranks;
}
function translateBounds(bounds, dx, dy) {
  translateDiagramBounds(bounds, dx, dy);
}
function translateRoutes(routes, dx, dy) {
  for (const route of routes) {
    for (const point of route.points) {
      point.x += dx;
      point.y += dy;
    }
    if (route.labelPoint) {
      route.labelPoint.x += dx;
      route.labelPoint.y += dy;
    }
  }
}
function freezeRouteLabelPoints(routes) {
  for (const route of routes) {
    if (!route.edge.label || route.labelPoint)
      continue;
    route.labelPoint = flowchartEdgeLabelLayout(route.points, route.edge.label, visualLength, route.labelAxis).point;
  }
}
function boundsFromChildren(children) {
  return diagramBoundsFromBounds(children);
}
function subgraphBoundFromChildren(id, label, children) {
  const labelLines = splitDiagramLines(label);
  const labelHeight = labelLines.length;
  let left = Math.min(...children.map((child) => child.left)) - SUBGRAPH_PADDING_X;
  const top = Math.min(...children.map((child) => child.top)) - Math.max(SUBGRAPH_PADDING_TOP, labelHeight);
  let right = Math.max(...children.map((child) => child.left + child.width)) + SUBGRAPH_PADDING_X;
  const bottom = Math.max(...children.map((child) => child.top + child.height)) + Math.max(SUBGRAPH_PADDING_BOTTOM, labelHeight);
  const minWidth = Math.max(...labelLines.map(visualLength)) + 5;
  if (right - left < minWidth) {
    const extra = minWidth - (right - left);
    left -= Math.floor(extra / 2);
    right += Math.ceil(extra / 2);
  }
  const width = right - left;
  const height = Math.max(3, bottom - top);
  return {
    id,
    label,
    left,
    top,
    width,
    height,
    centerX: left + Math.floor(width / 2),
    centerY: top + Math.floor(height / 2),
    labelSide: "top"
  };
}
function spansOverlap(leftStart, leftEnd, rightStart, rightEnd) {
  return leftStart <= rightEnd && rightStart <= leftEnd;
}
function labelSlot(bounds, side) {
  const lines = splitDiagramLines(bounds.label);
  const left = bounds.left + 2;
  const height = lines.length;
  const top = side === "top" ? bounds.top : bounds.top + bounds.height - height;
  const width = Math.max(...lines.map((line) => visualLength(` ${line} `)));
  return { left, top, width, height, centerX: left + Math.floor(width / 2), centerY: top + Math.floor(height / 2) };
}
function segmentOverlapsSlot(from, to, slot) {
  const segment = segmentBetween(from, to);
  if (!segment)
    return false;
  const slotRight = slot.left + slot.width - 1;
  const slotBottom = slot.top + slot.height - 1;
  const span = segmentSpan(segment);
  if (segment.axis === "x") {
    return segment.from.y >= slot.top && segment.from.y <= slotBottom && spansOverlap(span.start, span.end, slot.left, slotRight);
  }
  return segment.from.x >= slot.left && segment.from.x <= slotRight && spansOverlap(span.start, span.end, slot.top, slotBottom);
}
function routeOverlapsSlot(route, slot) {
  for (let index = 1;index < route.points.length; index++) {
    if (segmentOverlapsSlot(route.points[index - 1], route.points[index], slot))
      return true;
  }
  const routeLabelBounds = labelBounds(route);
  if (!routeLabelBounds || !spansOverlap(routeLabelBounds.top, routeLabelBounds.top + routeLabelBounds.height - 1, slot.top, slot.top + slot.height - 1)) {
    return false;
  }
  return spansOverlap(routeLabelBounds.left, routeLabelBounds.left + routeLabelBounds.width - 1, slot.left, slot.left + slot.width - 1);
}
function chooseSubgraphLabelSide(bounds, routes) {
  const topSlot = labelSlot(bounds, "top");
  if (!routes.some((route) => routeOverlapsSlot(route, topSlot)))
    return "top";
  const bottomSlot = labelSlot(bounds, "bottom");
  return routes.some((route) => routeOverlapsSlot(route, bottomSlot)) ? "top" : "bottom";
}
function pathBounds(points) {
  return diagramBoundsFromPoints(points);
}
function labelBounds(route) {
  if (!route.edge.label)
    return;
  const label = flowchartRouteLabelLayout(route, visualLength);
  const { point, width, height } = label;
  return {
    left: point.x,
    top: point.y,
    width,
    height,
    centerX: point.x + Math.floor(width / 2),
    centerY: point.y + Math.floor(height / 2)
  };
}
function subgraphRouteBounds(subgraphNodeIds, routes) {
  return routeRenderBounds(routes.filter((route) => subgraphNodeIds.has(route.edge.from) && subgraphNodeIds.has(route.edge.to)));
}
function routeRenderBounds(routes) {
  const bounds = [];
  for (const route of routes) {
    const routeBounds = pathBounds(route.points);
    if (routeBounds)
      bounds.push(routeBounds);
    const routeLabelBounds = labelBounds(route);
    if (routeLabelBounds)
      bounds.push(routeLabelBounds);
  }
  return bounds;
}
function layoutRankedNodes(diagram, direction, sizes, minNodeGap, requestedMinRankGap, targetWidth) {
  const horizontal = isHorizontalDirection(direction);
  const ranks = rankNodes(diagram);
  const maxRank = Math.max(0, ...ranks.values());
  const ranksByIndex = new Map;
  const normalizedRanks = new Map;
  for (const node of diagram.nodes) {
    const rank = ranks.get(node.id) ?? 0;
    const normalizedRank = direction === "RL" || direction === "BT" ? maxRank - rank : rank;
    normalizedRanks.set(node.id, normalizedRank);
    const nodes = ranksByIndex.get(normalizedRank) ?? [];
    nodes.push(node);
    ranksByIndex.set(normalizedRank, nodes);
  }
  const spaciousNodeGap = Math.max(minNodeGap, DEFAULT_MIN_BRANCH_LABEL_GAP);
  const widestUnlabeledRank = Math.max(0, ...[...ranksByIndex.values()].map((nodes) => nodes.reduce((total, node) => total + sizes.get(node.id).width, 0) + Math.max(0, nodes.length - 1) * spaciousNodeGap));
  const verticalNodeGap = (rank) => {
    const widestLabel = Math.max(0, ...diagram.edges.filter((edge) => edge.label && (normalizedRanks.get(edge.from) === rank || normalizedRanks.get(edge.to) === rank)).map((edge) => flowchartLabelWidth(edge.label, visualLength)));
    if (widestLabel > 0)
      return Math.max(spaciousNodeGap, flowchartVerticalBranchLabelGap(widestLabel));
    return widestUnlabeledRank > DEFAULT_MAX_UNLABELED_RANK_WIDTH ? minNodeGap : spaciousNodeGap;
  };
  const rankKeys = [...ranksByIndex.keys()].sort((a, b) => a - b);
  const horizontalGaps = horizontal ? horizontalRankGaps(diagram, normalizedRanks, rankKeys, requestedMinRankGap) : [];
  const verticalGaps = horizontal ? [] : verticalRankGaps(diagram, normalizedRanks, rankKeys, requestedMinRankGap);
  const bounds = new Map;
  let wrapped = false;
  if (horizontal) {
    const columnWidths = rankKeys.map((rank) => Math.max(...ranksByIndex.get(rank).map((node) => sizes.get(node.id).width)));
    const columnHeights = rankKeys.map((rank) => {
      const nodes = ranksByIndex.get(rank);
      return nodes.reduce((total, node) => total + sizes.get(node.id).height, 0) + Math.max(0, nodes.length - 1) * minNodeGap;
    });
    const canvasHeight = Math.max(1, ...columnHeights);
    const centerBaseline = Math.floor(canvasHeight / 2);
    let x = 0;
    for (let rankIndex = 0;rankIndex < rankKeys.length; rankIndex++) {
      const rank = rankKeys[rankIndex];
      const nodes = ranksByIndex.get(rank);
      const columnWidth = columnWidths[rankIndex];
      let y = centerBaseline - Math.floor(columnHeights[rankIndex] / 2);
      for (const node of nodes) {
        const size = sizes.get(node.id);
        const left = x + Math.floor((columnWidth - size.width) / 2);
        bounds.set(node.id, {
          id: node.id,
          ...size,
          left,
          top: y,
          centerX: left + Math.floor(size.width / 2),
          centerY: y + Math.floor(size.height / 2)
        });
        y += size.height + minNodeGap;
      }
      x += columnWidth + (horizontalGaps[rankIndex] ?? 0);
    }
  } else {
    const rankBands = rankKeys.map((rank) => {
      const nodes = ranksByIndex.get(rank);
      const roomyNodeGap = verticalNodeGap(rank);
      const naturalWidth = nodes.reduce((total, node) => total + sizes.get(node.id).width, 0) + Math.max(0, nodes.length - 1) * roomyNodeGap;
      const labeledEdges = diagram.edges.filter((edge) => edge.label && (normalizedRanks.get(edge.from) === rank || normalizedRanks.get(edge.to) === rank));
      const needsLabelLanes = labeledEdges.length > 1 && labeledEdges.some((edge) => {
        const targets = new Set(labeledEdges.filter((candidate) => candidate.from === edge.from).map((candidate) => candidate.to));
        const sources = new Set(labeledEdges.filter((candidate) => candidate.to === edge.to).map((candidate) => candidate.from));
        const grouped = (ids) => !diagram.subgraphs?.length || diagram.subgraphs.some((subgraph) => ids.every((id) => subgraph.nodeIds.includes(id)));
        return targets.size > 1 && grouped([edge.from, ...targets]) || sources.size > 1 && grouped([edge.to, ...sources]);
      });
      const nodeGap = targetWidth !== undefined && naturalWidth > targetWidth && (!needsLabelLanes || !diagram.subgraphs?.length) ? minNodeGap : roomyNodeGap;
      const bands = [];
      for (const node of nodes) {
        const size = sizes.get(node.id);
        const current = bands.at(-1);
        const width = current ? current.width + nodeGap + size.width : size.width;
        if (current && targetWidth !== undefined && width > targetWidth) {
          wrapped = true;
          bands.push({ nodes: [node], width: size.width, height: size.height });
          continue;
        }
        if (!current) {
          bands.push({ nodes: [node], width: size.width, height: size.height });
          continue;
        }
        current.nodes.push(node);
        current.width = width;
        current.height = Math.max(current.height, size.height);
      }
      return { bands, nodeGap };
    });
    const canvasWidth = Math.max(1, ...rankBands.flatMap((rank) => rank.bands.map((band) => band.width)));
    let y = 0;
    for (let rankIndex = 0;rankIndex < rankKeys.length; rankIndex++) {
      const rank = rankBands[rankIndex];
      for (const [bandIndex, band] of rank.bands.entries()) {
        let x = Math.floor((canvasWidth - band.width) / 2);
        for (const node of band.nodes) {
          const size = sizes.get(node.id);
          const top = y + Math.floor((band.height - size.height) / 2);
          bounds.set(node.id, {
            id: node.id,
            ...size,
            left: x,
            top,
            centerX: x + Math.floor(size.width / 2),
            centerY: top + Math.floor(size.height / 2)
          });
          x += size.width + rank.nodeGap;
        }
        y += band.height + (bandIndex < rank.bands.length - 1 ? minNodeGap : 0);
      }
      y += verticalGaps[rankIndex] ?? 0;
    }
  }
  return { bounds, wrapped };
}
function layoutLocalSubgraphDirections(diagram, nodeBounds, minNodeGap, requestedMinRankGap, targetWidth) {
  let wrapped = false;
  const subgraphs = diagram.subgraphs ?? [];
  const subgraphById = new Map(subgraphs.map((subgraph) => [subgraph.id, subgraph]));
  for (const subgraph of [...subgraphs].reverse()) {
    let parent = subgraph.parentId ? subgraphById.get(subgraph.parentId) : undefined;
    while (parent && !parent.direction)
      parent = parent.parentId ? subgraphById.get(parent.parentId) : undefined;
    const direction = subgraph.direction ?? (parent && subgraphs.filter((child) => child.parentId === parent.id).length > 1 ? parent.direction : undefined);
    if (!direction || direction === diagram.direction)
      continue;
    const childSubgraphs = subgraphs.filter((child) => child.parentId === subgraph.id);
    const coveredNodeIds = new Set(childSubgraphs.flatMap((child) => [...collectSubgraphNodeIds(diagram, child.id)]));
    const items = [
      ...childSubgraphs.flatMap((child) => {
        const nodeIds = [...collectSubgraphNodeIds(diagram, child.id)];
        const content = boundsFromChildren(nodeIds.flatMap((id) => nodeBounds.get(id) ?? []));
        const bounds = content ? subgraphBoundFromChildren(child.id, child.label, [content]) : undefined;
        return bounds ? [{ id: `subgraph:${child.id}`, nodeIds, bounds, childId: child.id }] : [];
      }),
      ...subgraph.nodeIds.flatMap((id) => {
        if (coveredNodeIds.has(id))
          return [];
        const bounds = nodeBounds.get(id);
        return bounds ? [{ id, nodeIds: [id], bounds, childId: undefined }] : [];
      })
    ];
    if (items.length === 0)
      continue;
    const currentBounds = boundsFromChildren(items.map((item) => item.bounds));
    if (!currentBounds)
      continue;
    const itemByEndpoint = new Map;
    for (const item of items) {
      for (const nodeId of item.nodeIds)
        itemByEndpoint.set(nodeId, item.id);
      if (item.childId)
        itemByEndpoint.set(item.childId, item.id);
    }
    const nodes = items.map((item) => ({ id: item.id, label: item.id, shape: "box" }));
    const localDiagram = {
      direction,
      nodes,
      edges: diagram.edges.flatMap((edge) => {
        const from = itemByEndpoint.get(edge.from);
        const to = itemByEndpoint.get(edge.to);
        return from && to && from !== to ? [{ ...edge, from, to }] : [];
      }),
      subgraphs: []
    };
    const itemSizes = new Map(items.map((item) => [item.id, { width: item.bounds.width, height: item.bounds.height, lines: [item.id] }]));
    const localLayout = layoutRankedNodes(localDiagram, direction, itemSizes, Math.max(minNodeGap, SUBGRAPH_PADDING_X * 2 + 1), requestedMinRankGap, targetWidth);
    const localBounds = localLayout.bounds;
    wrapped ||= localLayout.wrapped;
    const localExtent = boundsFromChildren([...localBounds.values()]);
    if (!localExtent)
      continue;
    const targetLeft = currentBounds.left + Math.floor((currentBounds.width - localExtent.width) / 2);
    const targetTop = currentBounds.top + Math.floor((currentBounds.height - localExtent.height) / 2);
    const dx = targetLeft - localExtent.left;
    const dy = targetTop - localExtent.top;
    const translations = new Map;
    for (const item of items) {
      const bound = localBounds.get(item.id);
      const itemDx = bound.left + dx - item.bounds.left;
      const itemDy = bound.top + dy - item.bounds.top;
      for (const nodeId of item.nodeIds)
        translations.set(nodeId, { dx: itemDx, dy: itemDy });
    }
    let groupOffset = { x: 0, y: 0 };
    if (targetWidth !== undefined) {
      const localNodeIds = new Set(translations.keys());
      const external = [...nodeBounds.entries()].filter(([id]) => !localNodeIds.has(id)).map(([, bound]) => bound);
      const overlaps = (offset) => [...translations].some(([id, translation]) => {
        const bound = nodeBounds.get(id);
        const left = bound.left + translation.dx + offset.x;
        const top = bound.top + translation.dy + offset.y;
        return external.some((other) => left < other.left + other.width + minNodeGap && left + bound.width + minNodeGap > other.left && top < other.top + other.height + minNodeGap && top + bound.height + minNodeGap > other.top);
      });
      if (overlaps(groupOffset)) {
        const vertical = !isHorizontalDirection(diagram.direction);
        const sign = diagram.direction === "RL" || diagram.direction === "BT" ? -1 : 1;
        let found = false;
        search:
          for (let distance = 1;distance < 1000; distance++) {
            const candidates = vertical ? [
              { x: 0, y: sign * distance },
              { x: 0, y: -sign * distance },
              { x: distance, y: 0 },
              { x: -distance, y: 0 }
            ] : [
              { x: sign * distance, y: 0 },
              { x: -sign * distance, y: 0 },
              { x: 0, y: distance },
              { x: 0, y: -distance }
            ];
            for (const candidate of candidates) {
              if (overlaps(candidate))
                continue;
              groupOffset = candidate;
              found = true;
              break search;
            }
          }
        if (!found)
          throw new Error(`Subgraph ${subgraph.id} has no collision-free responsive position`);
      }
    }
    for (const [nodeId, translation] of translations) {
      const nodeBound = nodeBounds.get(nodeId);
      if (nodeBound)
        translateBounds(nodeBound, translation.dx + groupOffset.x, translation.dy + groupOffset.y);
    }
  }
  return wrapped;
}
function edgeDirection(diagram, edge) {
  for (const subgraph of [...diagram.subgraphs ?? []].reverse()) {
    if (!subgraph.direction)
      continue;
    if (subgraph.nodeIds.includes(edge.from) && subgraph.nodeIds.includes(edge.to))
      return subgraph.direction;
  }
  return diagram.direction;
}
function collectSubgraphNodeIds(diagram, subgraphId) {
  const nodeIds = new Set;
  for (const subgraph of diagram.subgraphs ?? []) {
    if (subgraph.id !== subgraphId && subgraph.parentId !== subgraphId)
      continue;
    for (const nodeId of subgraph.nodeIds)
      nodeIds.add(nodeId);
    if (subgraph.parentId === subgraphId) {
      for (const nodeId of collectSubgraphNodeIds(diagram, subgraph.id))
        nodeIds.add(nodeId);
    }
  }
  return nodeIds;
}
function rankGraphComponents(ids, outgoing) {
  const reachable = new Map;
  for (const id of ids) {
    const seen = new Set;
    const queue = [id];
    for (let index = 0;index < queue.length; index++) {
      const current = queue[index];
      if (seen.has(current))
        continue;
      seen.add(current);
      queue.push(...outgoing.get(current) ?? []);
    }
    reachable.set(id, seen);
  }
  const componentById = new Map;
  const components = [];
  for (const id of ids) {
    if (componentById.has(id))
      continue;
    const component = ids.filter((candidate) => !componentById.has(candidate) && reachable.get(id).has(candidate) && reachable.get(candidate).has(id));
    const componentIndex = components.length;
    components.push(component);
    for (const member of component)
      componentById.set(member, componentIndex);
  }
  const componentOutgoing = new Map(components.map((_, index) => [index, new Set]));
  const incoming = new Map(components.map((_, index) => [index, 0]));
  for (const [from, targets] of outgoing) {
    const fromComponent = componentById.get(from);
    for (const to of targets) {
      const toComponent = componentById.get(to);
      if (fromComponent === toComponent || componentOutgoing.get(fromComponent).has(toComponent))
        continue;
      componentOutgoing.get(fromComponent).add(toComponent);
      incoming.set(toComponent, incoming.get(toComponent) + 1);
    }
  }
  const componentRanks = new Map;
  const queue = components.map((_, index) => index).filter((index) => incoming.get(index) === 0);
  for (const component of queue)
    componentRanks.set(component, 0);
  for (let index = 0;index < queue.length; index++) {
    const component = queue[index];
    for (const to of componentOutgoing.get(component)) {
      componentRanks.set(to, Math.max(componentRanks.get(to) ?? 0, componentRanks.get(component) + 1));
      incoming.set(to, incoming.get(to) - 1);
      if (incoming.get(to) === 0)
        queue.push(to);
    }
  }
  return new Map(ids.map((id) => [id, componentRanks.get(componentById.get(id)) ?? 0]));
}
function separateTopLevelItems(diagram, nodeBounds, subgraphBounds, gap, targetWidth) {
  const hasLocalDirection = (diagram.subgraphs ?? []).some((subgraph) => subgraph.direction && subgraph.direction !== diagram.direction);
  const coveredNodeIds = new Set;
  const items = [];
  const itemByEndpoint = new Map;
  const subgraphs = diagram.subgraphs ?? [];
  const topLevelIds = new Set(subgraphs.filter((subgraph) => !subgraph.parentId).map((subgraph) => subgraph.id));
  const subgraphById = new Map(subgraphs.map((subgraph) => [subgraph.id, subgraph]));
  const topLevelSubgraphId = (id) => {
    let current = subgraphById.get(id);
    while (current?.parentId)
      current = subgraphById.get(current.parentId);
    return current?.id ?? id;
  };
  for (const subgraph of subgraphs) {
    if (subgraph.parentId)
      continue;
    const bounds = subgraphBounds.get(subgraph.id);
    const nodeIds = collectSubgraphNodeIds(diagram, subgraph.id);
    if (!bounds || nodeIds.size === 0)
      continue;
    items.push({ id: subgraph.id, bounds, nodeIds, rank: 0 });
    itemByEndpoint.set(subgraph.id, subgraph.id);
    for (const nodeId of nodeIds) {
      coveredNodeIds.add(nodeId);
      itemByEndpoint.set(nodeId, subgraph.id);
    }
  }
  for (const subgraph of subgraphs)
    itemByEndpoint.set(subgraph.id, topLevelSubgraphId(subgraph.id));
  for (const node of diagram.nodes) {
    if (coveredNodeIds.has(node.id))
      continue;
    const bounds = nodeBounds.get(node.id);
    if (!bounds)
      continue;
    items.push({ id: node.id, bounds, nodeIds: new Set([node.id]), rank: 0 });
    itemByEndpoint.set(node.id, node.id);
  }
  if (items.length < 2)
    return false;
  const horizontal = isHorizontalDirection(diagram.direction);
  const moveItem = (item, dx, dy) => {
    for (const nodeId of item.nodeIds) {
      const bounds = nodeBounds.get(nodeId);
      if (bounds)
        translateBounds(bounds, dx, dy);
    }
    if (!topLevelIds.has(item.id))
      return;
    for (const subgraph of subgraphs) {
      if (topLevelSubgraphId(subgraph.id) !== item.id)
        continue;
      const bounds = subgraphBounds.get(subgraph.id);
      if (bounds)
        translateBounds(bounds, dx, dy);
    }
  };
  if (hasLocalDirection) {
    const outgoing = new Map(items.map((item) => [item.id, new Set]));
    for (const edge of diagram.edges) {
      const from = itemByEndpoint.get(edge.from);
      const to = itemByEndpoint.get(edge.to);
      if (from && to && from !== to)
        outgoing.get(from)?.add(to);
    }
    const ranks = rankGraphComponents(items.map((item) => item.id), outgoing);
    items.sort((a, b) => ranks.get(a.id) - ranks.get(b.id) || (horizontal ? a.bounds.centerX - b.bounds.centerX : a.bounds.centerY - b.bounds.centerY));
    let cursor;
    let moved = false;
    for (const item of items) {
      const start = horizontal ? item.bounds.left : item.bounds.top;
      const size = horizontal ? item.bounds.width : item.bounds.height;
      if (cursor === undefined) {
        cursor = start + size + gap;
        continue;
      }
      const shift = cursor - start;
      moved ||= shift !== 0;
      moveItem(item, horizontal ? shift : 0, horizontal ? 0 : shift);
      cursor = start + shift + size + gap;
    }
    return moved;
  }
  const rankedItems = items.filter((item) => topLevelIds.has(item.id));
  if (rankedItems.length < 2)
    return false;
  const itemById = new Map(rankedItems.map((item) => [item.id, item]));
  const outgoing = new Map(rankedItems.map((item) => [item.id, new Set]));
  for (const edge of diagram.edges) {
    const from = itemByEndpoint.get(edge.from);
    const to = itemByEndpoint.get(edge.to);
    if (!from || !to || from === to || !itemById.has(from) || !itemById.has(to) || outgoing.get(from).has(to))
      continue;
    outgoing.get(from).add(to);
  }
  const ranks = rankGraphComponents(rankedItems.map((item) => item.id), outgoing);
  for (const item of rankedItems)
    item.rank = ranks.get(item.id);
  const reversed = diagram.direction === "RL" || diagram.direction === "BT";
  const primaryStart = (item) => {
    const start = horizontal ? item.bounds.left : item.bounds.top;
    const size = horizontal ? item.bounds.width : item.bounds.height;
    return reversed ? -(start + size) : start;
  };
  const itemsByRank = Map.groupBy(rankedItems, (item) => item.rank);
  const rankKeys = [...itemsByRank.keys()].sort((a, b) => a - b);
  let cursor;
  let moved = false;
  for (const rank of rankKeys) {
    const rankItems = itemsByRank.get(rank);
    const start = Math.min(...rankItems.map(primaryStart));
    const end = Math.max(...rankItems.map((item) => primaryStart(item) + (horizontal ? item.bounds.width : item.bounds.height)));
    if (cursor === undefined) {
      cursor = end + gap;
      continue;
    }
    const shift = Math.max(0, cursor - start);
    if (shift > 0) {
      moved = true;
      for (const item of rankItems) {
        const offset = reversed ? -shift : shift;
        moveItem(item, horizontal ? offset : 0, horizontal ? 0 : offset);
      }
    }
    cursor = end + shift + gap;
  }
  for (const rank of rankKeys) {
    const rankItems = itemsByRank.get(rank).toSorted((a, b) => horizontal ? a.bounds.top - b.bounds.top : a.bounds.left - b.bounds.left);
    let crossCursor;
    for (const item of rankItems) {
      const start = horizontal ? item.bounds.top : item.bounds.left;
      const size = horizontal ? item.bounds.height : item.bounds.width;
      if (crossCursor === undefined) {
        crossCursor = start + size + gap;
        continue;
      }
      const shift = Math.max(0, crossCursor - start);
      if (shift > 0) {
        moved = true;
        moveItem(item, horizontal ? 0 : shift, horizontal ? shift : 0);
      }
      crossCursor = start + shift + size + gap;
    }
  }
  if (targetWidth !== undefined && !horizontal) {
    const intersects = (left, right) => [...left.nodeIds].some((leftId) => {
      const leftBounds = nodeBounds.get(leftId);
      return [...right.nodeIds].some((rightId) => {
        const rightBounds = nodeBounds.get(rightId);
        return leftBounds.left <= rightBounds.left + rightBounds.width - 1 && leftBounds.left + leftBounds.width - 1 >= rightBounds.left && leftBounds.top <= rightBounds.top + rightBounds.height - 1 && leftBounds.top + leftBounds.height - 1 >= rightBounds.top;
      });
    });
    for (let rightIndex = 1;rightIndex < items.length; rightIndex++) {
      const right = items[rightIndex];
      for (let leftIndex = 0;leftIndex < rightIndex; leftIndex++) {
        const left = items[leftIndex];
        if (!intersects(left, right))
          continue;
        const leftBounds = boundsFromChildren([...left.nodeIds].map((id) => nodeBounds.get(id)));
        const rightBounds = boundsFromChildren([...right.nodeIds].map((id) => nodeBounds.get(id)));
        const shift = reversed ? leftBounds.top - gap - (rightBounds.top + rightBounds.height) : leftBounds.top + leftBounds.height + gap - rightBounds.top;
        moved ||= shift !== 0;
        moveItem(right, 0, shift);
      }
    }
  }
  return moved;
}
function layoutSubgraphs(diagram, nodeBounds, routes) {
  const subgraphBounds = new Map;
  const subgraphs = diagram.subgraphs ?? [];
  for (const subgraph of [...subgraphs].reverse()) {
    const children = [];
    for (const nodeId of subgraph.nodeIds) {
      const bound = nodeBounds.get(nodeId);
      if (bound)
        children.push(bound);
    }
    children.push(...subgraphRouteBounds(new Set(subgraph.nodeIds), routes));
    for (const childSubgraph of subgraphs) {
      if (childSubgraph.parentId !== subgraph.id)
        continue;
      const bound = subgraphBounds.get(childSubgraph.id);
      if (bound)
        children.push(bound);
    }
    if (children.length > 0) {
      const bound = subgraphBoundFromChildren(subgraph.id, subgraph.label, children);
      bound.labelSide = chooseSubgraphLabelSide(bound, routes);
      subgraphBounds.set(subgraph.id, bound);
    }
  }
  return subgraphBounds;
}
function layoutFlowchartWithDirection(sourceDiagram, options, direction, responsiveFallback = false) {
  const diagram = direction === sourceDiagram.direction ? sourceDiagram : { ...sourceDiagram, direction };
  const horizontal = isHorizontalDirection(direction);
  const minNodeGap = normalizePositiveInt(options.minNodeGap, DEFAULT_MIN_NODE_GAP);
  const requestedMinRankGap = normalizePositiveInt(options.minRankGap, options.compact ? horizontal ? COMPACT_MIN_RANK_GAP : COMPACT_MIN_VERTICAL_RANK_GAP : horizontal ? DEFAULT_MIN_RANK_GAP : DEFAULT_MIN_VERTICAL_RANK_GAP);
  const sizes = new Map(diagram.nodes.map((node) => [node.id, nodeSize(node)]));
  const targetWidth = !horizontal && options.layoutMaxWidth !== undefined && Number.isFinite(options.layoutMaxWidth) ? Math.max(1, Math.trunc(options.layoutMaxWidth)) : undefined;
  const ranked = layoutRankedNodes(diagram, direction, sizes, minNodeGap, requestedMinRankGap, targetWidth);
  const bounds = ranked.bounds;
  const responsive = layoutLocalSubgraphDirections(diagram, bounds, minNodeGap, requestedMinRankGap, targetWidth);
  const directionAligned = responsiveFallback || responsive || ranked.wrapped;
  const route = (frames) => routeFlowchartEdges(diagram, bounds, (edge) => edgeDirection(diagram, edge), frames, targetWidth, directionAligned);
  const subgraphs = diagram.subgraphs ?? [];
  let subgraphBounds = new Map;
  let routes;
  if (subgraphs.length === 0) {
    routes = route();
  } else {
    routes = route();
    subgraphBounds = layoutSubgraphs(diagram, bounds, routes);
    const moved = separateTopLevelItems(diagram, bounds, subgraphBounds, Math.max(1, Math.floor(requestedMinRankGap / 2)), targetWidth);
    if (moved) {
      routes = route();
      subgraphBounds = layoutSubgraphs(diagram, bounds, routes);
    }
    routes = route(subgraphBounds);
    subgraphBounds = layoutSubgraphs(diagram, bounds, routes);
    const expanded = separateTopLevelItems(diagram, bounds, subgraphBounds, Math.max(1, Math.floor(requestedMinRankGap / 2)), targetWidth);
    if (expanded)
      routes = route(subgraphBounds);
    avoidFlowchartFrameBorders(routes, bounds, subgraphBounds);
  }
  freezeRouteLabelPoints(routes);
  const allBounds = [...bounds.values(), ...subgraphBounds.values(), ...routeRenderBounds(routes)];
  const dx = Math.max(0, -Math.min(0, ...allBounds.map((bound) => bound.left)));
  const dy = Math.max(0, -Math.min(0, ...allBounds.map((bound) => bound.top)));
  if (dx > 0 || dy > 0) {
    for (const bound of allBounds)
      translateBounds(bound, dx, dy);
    translateRoutes(routes, dx, dy);
  }
  const maxX = Math.max(0, ...allBounds.map((bound) => bound.left + bound.width));
  const maxY = Math.max(0, ...allBounds.map((bound) => bound.top + bound.height));
  return { diagram, bounds, routes, subgraphBounds, width: maxX + 4, height: maxY + 4 };
}
function layoutFlowchartDiagram(sourceDiagram, options = {}) {
  const direction = options.direction ?? sourceDiagram.direction;
  const layout = layoutFlowchartWithDirection(sourceDiagram, options, direction);
  const maxWidth = options.layoutMaxWidth;
  if (!isHorizontalDirection(direction) || maxWidth === undefined || !Number.isFinite(maxWidth))
    return layout;
  if (layout.width <= Math.max(1, Math.trunc(maxWidth)))
    return layout;
  return layoutFlowchartWithDirection(sourceDiagram, options, direction === "RL" ? "BT" : "TD", true);
}

// node_modules/opentui-markdown-render/src/merman/flowchart/style.ts
var DEFAULT_THEME_RGB2 = {
  node: [228, 239, 232],
  nodeBorder: [141, 163, 151],
  database: [228, 239, 232],
  databaseBorder: [141, 163, 151],
  edge: [134, 225, 200],
  label: [134, 225, 200],
  group: [76, 99, 89],
  groupLabel: [76, 99, 89]
};
var NODE_EDGE_FADE_STYLES = numberedStyleKeys("nodeEdgeFade", DIAGRAM_FADE_STEPS);
var DATABASE_EDGE_FADE_STYLES = numberedStyleKeys("databaseEdgeFade", DIAGRAM_FADE_STEPS);
function resolveFlowchartStyleColors(colors = {}) {
  const node = colors.node ?? rgba(DEFAULT_THEME_RGB2.node);
  const nodeBorder = colors.nodeBorder ?? rgba(DEFAULT_THEME_RGB2.nodeBorder);
  const database = colors.database ?? rgba(DEFAULT_THEME_RGB2.database);
  const databaseBorder = colors.databaseBorder ?? rgba(DEFAULT_THEME_RGB2.databaseBorder);
  const edge = colors.edge ?? rgba(DEFAULT_THEME_RGB2.edge);
  return {
    node,
    nodeBorder,
    database,
    databaseBorder,
    edge,
    label: colors.label ?? rgba(DEFAULT_THEME_RGB2.label),
    group: colors.group ?? rgba(DEFAULT_THEME_RGB2.group),
    groupLabel: colors.groupLabel ?? colors.group ?? rgba(DEFAULT_THEME_RGB2.groupLabel),
    ...createColorRampTheme(NODE_EDGE_FADE_STYLES, nodeBorder, edge),
    ...createColorRampTheme(DATABASE_EDGE_FADE_STYLES, databaseBorder, edge)
  };
}
function renderGridStyledText(grid, colors, backgrounds) {
  return renderDiagramGridStyledTextByStyle(grid, colors, backgrounds, {
    key: (cell) => [cell.style, cell.attributes],
    attributes: (run) => run.cell.attributes,
    trimTop: true,
    trimBottom: true
  });
}

// node_modules/opentui-markdown-render/src/merman/flowchart/drawing.ts
var DEFAULT_BORDER_STYLE = "rounded";
function mergeFlowchartCell(existing, incoming) {
  if (incoming.style !== "edge")
    return incoming;
  if (existing.style === "label")
    return existing;
  if (incoming.char === " ")
    return existing;
  if (existing.style !== "edge" || existing.char === " ")
    return incoming;
  if (DIAGRAM_ARROW_HEADS.has(existing.char))
    return existing;
  if (DIAGRAM_ARROW_HEADS.has(incoming.char))
    return incoming;
  return {
    ...incoming,
    char: mergeDiagramLineGlyph(existing.char, incoming.char, "rounded") ?? incoming.char
  };
}
function setRichText(grid, x, y, runs, style) {
  let offset = 0;
  for (const run of runs) {
    grid.setText(x + offset, y, run.text, style, run.italic ? { attributes: TextAttributes4.ITALIC } : undefined);
    offset += visualLength(run.text);
  }
  return offset;
}
function drawNode(grid, node, bounds, borderStyle) {
  const chars = BorderChars3[borderStyle];
  const style = node.shape === "database" ? "database" : "node";
  const border = node.shape === "database" ? "databaseBorder" : "nodeBorder";
  if (node.shape === "decision") {
    drawDiagramDiamond(bounds, (x, y, char) => grid.setCell(x, y, char, border), diagramDiamondCharactersFromBorder(chars));
  } else if (node.shape === "circle") {
    fillDiagramFrameInterior(bounds, (x, y) => grid.setCell(x, y, " ", style));
    drawCircleNode(grid, bounds, chars, border);
  } else if (node.shape === "hexagon") {
    fillDiagramFrameInterior(bounds, (x, y) => grid.setCell(x, y, " ", style));
    drawHexagonNode(grid, bounds, chars, border);
  } else if (node.shape === "parallelogram") {
    fillDiagramFrameInterior(bounds, (x, y) => grid.setCell(x, y, " ", style));
    drawParallelogramNode(grid, bounds, chars, border);
  } else if (node.shape === "subroutine") {
    fillDiagramFrameInterior(bounds, (x, y) => grid.setCell(x, y, " ", style));
    drawSubroutineNode(grid, bounds, chars, border);
  } else if (node.shape === "database") {
    fillDiagramFrameInterior(bounds, (x, y) => grid.setCell(x, y, " ", style));
    drawDatabaseNode(grid, bounds, chars, border);
  } else if (node.shape === "rounded") {
    fillDiagramFrameInterior(bounds, (x, y) => grid.setCell(x, y, " ", style));
    drawRoundedNode(grid, bounds, border);
  } else {
    fillDiagramFrameInterior(bounds, (x, y) => grid.setCell(x, y, " ", style));
    drawDiagramFrame(bounds, chars, (x, y, char) => grid.setCell(x, y, char, border));
  }
  const textTop = node.shape === "decision" || node.shape === "circle" || node.shape === "hexagon" ? bounds.top + Math.floor((bounds.height - bounds.lines.length) / 2) : node.shape === "database" ? bounds.top + 2 : bounds.top + 1;
  const lines = parseDiagramTextLines(node.label);
  for (const [index, line] of bounds.lines.entries()) {
    const lineX = node.shape === "subroutine" ? bounds.left + 3 : bounds.left + Math.max(1, Math.floor((bounds.width - visualLength(line)) / 2));
    setRichText(grid, lineX, textTop + index, lines[index].runs, style);
  }
}
function drawRoundedNode(grid, bounds, style) {
  const { left, top, width, height } = bounds;
  const right = left + width - 1;
  const bottom = top + height - 1;
  const chars = BorderChars3.rounded;
  for (const y of [top, bottom]) {
    grid.setCell(left + 1, y, y === top ? chars.topLeft : chars.bottomLeft, style);
    grid.setCell(right - 1, y, y === top ? chars.topRight : chars.bottomRight, style);
    for (let x = left + 2;x < right - 1; x++)
      grid.setCell(x, y, chars.horizontal, style);
  }
  for (let y = top + 1;y < bottom; y++) {
    grid.setCell(left, y, chars.vertical, style);
    grid.setCell(right, y, chars.vertical, style);
  }
}
function drawCircleNode(grid, bounds, chars, style) {
  const right = bounds.left + bounds.width - 1;
  const bottom = bounds.top + bounds.height - 1;
  for (const y of [bounds.top, bottom]) {
    grid.setCell(bounds.left + 1, y, y === bounds.top ? chars.topLeft : chars.bottomLeft, style);
    grid.setCell(right - 1, y, y === bounds.top ? chars.topRight : chars.bottomRight, style);
    for (let x = bounds.left + 2;x < right - 1; x++)
      grid.setCell(x, y, chars.horizontal, style);
  }
  for (let y = bounds.top + 1;y < bottom; y++) {
    grid.setCell(bounds.left, y, y === bounds.top + 1 ? "\u2571" : y === bottom - 1 ? "\u2572" : chars.vertical, style);
    grid.setCell(right, y, y === bounds.top + 1 ? "\u2572" : y === bottom - 1 ? "\u2571" : chars.vertical, style);
  }
}
function drawHexagonNode(grid, bounds, chars, style) {
  const right = bounds.left + bounds.width - 1;
  const bottom = bounds.top + bounds.height - 1;
  for (const y of [bounds.top, bottom]) {
    const top = y === bounds.top;
    grid.setCell(bounds.left + 1, y, top ? "\u2571" : "\u2572", style);
    grid.setCell(right - 1, y, top ? "\u2572" : "\u2571", style);
    for (let x = bounds.left + 2;x < right - 1; x++)
      grid.setCell(x, y, chars.horizontal, style);
  }
  for (let y = bounds.top + 1;y < bottom; y++) {
    grid.setCell(bounds.left, y, chars.vertical, style);
    grid.setCell(right, y, chars.vertical, style);
  }
}
function drawParallelogramNode(grid, bounds, chars, style) {
  const left = bounds.left;
  const right = bounds.left + bounds.width - 1;
  const top = bounds.top;
  const bottom = bounds.top + bounds.height - 1;
  const height = bottom - top;
  const slant = Math.max(1, Math.min(2, Math.floor((bounds.width - 3) / 4)));
  for (let y = top;y <= bottom; y++) {
    const progress = height === 0 ? 1 : (bottom - y) / height;
    const leftX = left + Math.round(slant * progress);
    const rightX = right - Math.round(slant * (1 - progress));
    grid.setCell(leftX, y, "\u2571", style);
    grid.setCell(rightX, y, "\u2571", style);
    if (y === top || y === bottom) {
      for (let x = leftX + 1;x < rightX; x++)
        grid.setCell(x, y, chars.horizontal, style);
    }
  }
}
function drawSubroutineNode(grid, bounds, chars, style) {
  drawDiagramFrame(bounds, chars, (x, y, char) => grid.setCell(x, y, char, style));
  const leftRailX = bounds.left + 2;
  const rightRailX = bounds.left + bounds.width - 3;
  grid.setCell(leftRailX, bounds.top, chars.topT, style);
  grid.setCell(rightRailX, bounds.top, chars.topT, style);
  grid.setCell(leftRailX, bounds.top + bounds.height - 1, chars.bottomT, style);
  grid.setCell(rightRailX, bounds.top + bounds.height - 1, chars.bottomT, style);
  for (let y = bounds.top + 1;y < bounds.top + bounds.height - 1; y++) {
    grid.setCell(leftRailX, y, chars.vertical, style);
    grid.setCell(rightRailX, y, chars.vertical, style);
  }
}
function drawDatabaseNode(grid, bounds, chars, style) {
  drawDiagramFrame(bounds, chars, (x, y, char) => grid.setCell(x, y, char, style));
  const topRailY = bounds.top + 1;
  const bottomRailY = bounds.top + bounds.height - 2;
  for (const y of [topRailY, bottomRailY]) {
    grid.setCell(bounds.left, y, chars.leftT, style);
    grid.setCell(bounds.left + bounds.width - 1, y, chars.rightT, style);
    for (let x = bounds.left + 1;x < bounds.left + bounds.width - 1; x++) {
      grid.setCell(x, y, chars.horizontal, style);
    }
  }
}
function drawSubgraphFrame(grid, bounds, borderStyle) {
  const chars = BorderChars3[borderStyle];
  drawDiagramFrame(bounds, chars, (x, y, char) => grid.setCell(x, y, char, "group"));
}
function drawSubgraphLabel(grid, bounds) {
  if (bounds.label) {
    const lines = parseDiagramTextLines(bounds.label);
    const labelY = bounds.labelSide === "top" ? bounds.top : bounds.top + bounds.height - lines.length;
    for (const [index, line] of lines.entries()) {
      grid.setText(bounds.left + 2, labelY + index, " ", "groupLabel");
      const width = setRichText(grid, bounds.left + 3, labelY + index, line.runs, "groupLabel");
      grid.setText(bounds.left + width + 3, labelY + index, " ", "groupLabel");
    }
  }
}
function drawEdgeLabel(grid, route, style) {
  const label = flowchartRouteLabelLayout(route, visualLength);
  const padding = " ".repeat(DIAGRAM_LABEL_PADDING_X);
  for (const [index, line] of parseDiagramTextLines(route.edge.label).entries()) {
    grid.setText(label.point.x, label.point.y + index, padding, style);
    const width = setRichText(grid, label.point.x + DIAGRAM_LABEL_PADDING_X, label.point.y + index, line.runs, style);
    grid.setText(label.point.x + width + DIAGRAM_LABEL_PADDING_X, label.point.y + index, padding, style);
  }
}
function drawRoutedEdge(grid, route) {
  const { edge, points } = route;
  if (points.length < 2)
    return;
  const style = "edge";
  drawOrthogonalPath(points, (x, y, char) => grid.setCell(x, y, char, style), {
    cornerStyle: "rounded",
    lineStyle: edge.style === "thick" ? "heavy" : "single"
  });
  if (edge.arrowhead !== false) {
    const end = points[points.length - 1];
    const arrowFrom = points[points.length - 2];
    grid.setCell(end.x, end.y, diagramArrowHeadBetween(arrowFrom, end), style);
  } else {
    const end = points[points.length - 1];
    const endDirection = directionBetween(points[points.length - 2], end);
    if (endDirection)
      grid.setCell(end.x, end.y, diagramLineGlyph(new Set([endDirection])), style);
  }
  if (edge.label) {
    drawEdgeLabel(grid, route, "label");
  }
}
function flowchartNodeStyle(node) {
  return node?.shape === "database" ? "database" : "node";
}
function sourceFadeStyles(sourceStyle) {
  return sourceStyle === "database" ? DATABASE_EDGE_FADE_STYLES : NODE_EDGE_FADE_STYLES;
}
function styleExistingEdgeCell(grid, x, y, style) {
  const cell = grid.getCell(x, y);
  if (cell)
    grid.setCell(x, y, cell.char, style);
}
function routeCellOccupancy(routes) {
  const occupancy = new Map;
  for (const route of routes) {
    const routeCells = new Set;
    for (let index = 1;index < route.points.length; index++) {
      walkOrthogonalSegment(route.points[index - 1], route.points[index], index === 1, (point) => {
        routeCells.add(`${point.x}:${point.y}`);
      });
    }
    for (const key of routeCells)
      occupancy.set(key, (occupancy.get(key) ?? 0) + 1);
  }
  return occupancy;
}
function fadeSourcePath(grid, connector, points, styles, occupancy) {
  const from = points[0];
  const to = points[1];
  if (!from || !to)
    return;
  const privateCells = [connector];
  walkOrthogonalSegment(from, to, true, (point) => {
    const key = `${point.x}:${point.y}`;
    const cell = grid.getCell(point.x, point.y);
    if (occupancy.get(key) !== 1 || !cell || !"\u2500\u2501\u2502\u2503".includes(cell.char) || cell.style === "label")
      return false;
    privateCells.push(point);
  });
  for (const [index, point] of privateCells.entries()) {
    const styleIndex = Math.min(styles.length - 1, Math.floor((index + 1) * styles.length / (privateCells.length + 1)));
    styleExistingEdgeCell(grid, point.x, point.y, styles[styleIndex]);
  }
}
function drawSourceConnectors(grid, diagram, bounds, routes) {
  const nodesById = new Map(diagram.nodes.map((node) => [node.id, node]));
  const occupancy = routeCellOccupancy(routes);
  const sourceJunctions = new Map;
  for (const route of routes) {
    const sourcePoint = route.points[0];
    const next = route.points[1];
    if (!sourcePoint || !next)
      continue;
    const key = `${route.edge.from}:${sourcePoint.x}:${sourcePoint.y}`;
    const direction = directionBetween(sourcePoint, next);
    const junction = sourceJunctions.get(key) ?? { directions: new Set, heavy: true };
    if (direction)
      junction.directions.add(direction);
    junction.heavy &&= route.edge.style === "thick";
    sourceJunctions.set(key, junction);
  }
  for (const route of routes) {
    const from = bounds.get(route.edge.from);
    const sourcePoint = route.points[0];
    if (!from || !sourcePoint)
      continue;
    const styles = sourceFadeStyles(flowchartNodeStyle(nodesById.get(route.edge.from)));
    const connector = flowchartSourceConnector(from, sourcePoint);
    grid.setCell(connector.x, connector.y, connector.char, "edge");
    const connectorDirection = directionBetween(sourcePoint, connector);
    if (connectorDirection) {
      const cell = grid.getCell(sourcePoint.x, sourcePoint.y);
      if (cell && cell.style !== "label" && !DIAGRAM_ARROW_HEADS.has(cell.char)) {
        const key = `${route.edge.from}:${sourcePoint.x}:${sourcePoint.y}`;
        const junction = sourceJunctions.get(key);
        const directions = new Set(junction?.directions);
        directions.add(connectorDirection);
        grid.replaceCell(sourcePoint.x, sourcePoint.y, diagramLineGlyph(directions, "rounded", junction?.heavy ?? route.edge.style === "thick" ? "heavy" : "single"), "edge");
      }
    }
    fadeSourcePath(grid, connector, route.points, styles, occupancy);
    if (route.edge.sourceArrowhead && route.points[1]) {
      grid.setCell(sourcePoint.x, sourcePoint.y, diagramArrowHeadBetween(route.points[1], sourcePoint), "edge");
    }
  }
}
function drawFlowchartDiagramGrid(diagram, options = {}) {
  const borderStyle = options.borderStyle ?? DEFAULT_BORDER_STYLE;
  const layout = layoutFlowchartDiagram(diagram, options);
  const { bounds, routes, subgraphBounds, width, height } = layout;
  diagram = layout.diagram;
  const grid = new DiagramCanvas(width, height, {
    mergeCell: mergeFlowchartCell
  });
  for (const subgraph of diagram.subgraphs ?? []) {
    const bound = subgraphBounds.get(subgraph.id);
    if (bound)
      drawSubgraphFrame(grid, bound, borderStyle);
  }
  for (const route of routes)
    drawRoutedEdge(grid, route);
  for (const node of diagram.nodes) {
    const bound = bounds.get(node.id);
    if (bound)
      drawNode(grid, node, bound, borderStyle);
  }
  drawSourceConnectors(grid, diagram, bounds, routes);
  for (const subgraph of diagram.subgraphs ?? []) {
    const bound = subgraphBounds.get(subgraph.id);
    if (bound)
      drawSubgraphLabel(grid, bound);
  }
  return grid;
}

// node_modules/opentui-markdown-render/src/merman/gantt/drawing.ts
var LABEL_GAP = 2;
var MIN_CHART_WIDTH = 24;
var MAX_CHART_WIDTH = 64;
function drawGanttDiagramGrid(diagram, options = {}) {
  if (diagram.entries.length === 0)
    return new DiagramCanvas(0, 0);
  const labels = diagram.entries.map((_, index) => entryLabel(diagram, index, options.labels ?? "left"));
  const labelWidth = Math.max(...labels.map(diagramTextWidth));
  const entryRows = [];
  let bodyHeight = 0;
  diagram.entries.forEach((entry, index) => {
    if ((options.sections ?? "spaced") === "spaced" && entry.type === "section" && index > 0)
      bodyHeight += 1;
    entryRows.push(bodyHeight);
    bodyHeight += 1;
  });
  if (diagram.tasks.length === 0) {
    const grid = new DiagramCanvas(labelWidth, bodyHeight);
    diagram.entries.forEach((entry, index) => {
      if (entry.type === "section")
        grid.setText(0, entryRows[index], entry.section.label, "section");
    });
    return grid;
  }
  const available = (options.layoutMaxWidth ?? 120) - labelWidth - LABEL_GAP;
  const chartWidth = Math.max(MIN_CHART_WIDTH, Math.min(MAX_CHART_WIDTH, available));
  const starts = diagram.tasks.map((task) => task.start);
  const ends = diagram.tasks.map((task) => task.end);
  const minimum = Math.min(...starts);
  const maximum = Math.max(...ends);
  const span = Math.max(1, maximum - minimum);
  const titleHeight = diagram.title ? 2 : 0;
  const axisHeight = 2;
  const grid = new DiagramCanvas(labelWidth + LABEL_GAP + chartWidth, titleHeight + axisHeight + bodyHeight);
  const chartX = labelWidth + LABEL_GAP;
  if (diagram.title)
    grid.setText(Math.max(0, chartX + Math.floor((chartWidth - diagramTextWidth(diagram.title)) / 2)), 0, diagram.title, "title");
  drawAxis(grid, chartX, titleHeight, chartWidth, minimum, span, diagram.axisFormat, diagram.tickInterval);
  diagram.entries.forEach((entry, index) => {
    const y = titleHeight + axisHeight + entryRows[index];
    if (entry.type === "section") {
      grid.setText(0, y, labels[index], "section");
      return;
    }
    const label = labels[index];
    const labelX = options.labels === "right" ? labelWidth - diagramTextWidth(label) : 0;
    grid.setText(labelX, y, label, entry.task.state);
    drawTask(grid, entry.task, chartX, y, chartWidth, minimum, span, options);
  });
  return grid;
}
function drawAxis(grid, x, y, width, minimum, span, format, interval) {
  for (let offset = 0;offset < width; offset++)
    grid.setCell(x + offset, y + 1, "\u2500", "axis");
  const step = interval ? interval * Math.max(1, Math.ceil(span / (interval * 12))) : tickStep(span);
  const ticks = [];
  for (let value = Math.ceil(minimum / step) * step;value <= minimum + span; value += step)
    ticks.push(value);
  if (ticks.length === 0)
    ticks.push(minimum, minimum + span);
  for (const value of ticks) {
    const offset = Math.round((value - minimum) / span * (width - 1));
    const label = formatTime(value, format);
    const labelX = Math.max(x, Math.min(x + width - diagramTextWidth(label), x + offset - Math.floor(diagramTextWidth(label) / 2)));
    grid.setText(labelX, y, label, "axis");
    grid.setCell(x + offset, y + 1, "\u252C", "axis");
  }
}
function tickStep(span) {
  const steps = [
    1000,
    5000,
    1e4,
    30000,
    60000,
    300000,
    900000,
    3600000,
    21600000,
    43200000,
    86400000,
    172800000,
    604800000,
    2592000000,
    31536000000
  ];
  return steps.find((step) => step >= span / 4) ?? steps.at(-1);
}
function drawTask(grid, task, x, y, width, minimum, span, options) {
  const style = options.style ?? "track";
  const line = lineGlyph(options.line ?? "thin");
  const start = Math.round((task.start - minimum) / span * (width - 1));
  const end = Math.round((task.end - minimum) / span * (width - 1));
  if (task.state === "milestone" || start === end) {
    grid.setCell(x + start, y, "\u25C6", task.state);
    return;
  }
  if (style === "track") {
    for (let offset = 0;offset < width; offset++) {
      grid.setCell(x + offset, y, (options.track ?? "line") === "line" ? line : "\xB7", trackCellStyle(options));
    }
  }
  const glyph = style === "block" ? "\u2588" : line;
  for (let offset = start;offset <= end; offset++)
    grid.setCell(x + offset, y, glyph, task.state);
  if (style === "block")
    return;
  if (style === "capsule" || style === "track") {
    if (style === "track") {
      if (options.endpoints === "points") {
        grid.setCell(x + start, y, "\u25CF", trackCellStyle(options));
        grid.setCell(x + end, y, "\u25CF", trackCellStyle(options));
      }
      return;
    }
    const caps = capGlyphs(options.line ?? "thin");
    grid.setCell(x + start, y, caps.start, task.state);
    grid.setCell(x + end, y, caps.end, task.state);
    return;
  }
  if (style === "points") {
    grid.setCell(x + start, y, "\u25CF", task.state);
    grid.setCell(x + end, y, "\u25CF", task.state);
    return;
  }
  grid.setCell(x + start, y, "\u2523", task.state);
  grid.setCell(x + end, y, "\u252B", task.state);
}
function entryLabel(diagram, index, layout) {
  const entry = diagram.entries[index];
  if (entry.type === "section" || layout !== "tree") {
    return entry.type === "section" ? entry.section.label : entry.task.label;
  }
  const last = diagram.entries[index + 1]?.type !== "task";
  return `  ${last ? "\u2514" : "\u251C"}\u2500 ${entry.task.label}`;
}
function lineGlyph(line) {
  if (line === "thin")
    return "\u2500";
  if (line === "double")
    return "\u2550";
  if (line === "dashed")
    return "\u254C";
  return "\u2501";
}
function capGlyphs(line) {
  if (line === "thin" || line === "dashed")
    return { start: "\u2576", end: "\u2574" };
  if (line === "double")
    return { start: "\u255E", end: "\u2561" };
  return { start: "\u257A", end: "\u2578" };
}
function trackCellStyle(options) {
  if (options.trackTone === "medium")
    return "trackMedium";
  if (options.trackTone === "dim")
    return "trackDim";
  return "trackFaint";
}
function formatTime(value, format) {
  const date = new Date(value);
  const parts = {
    "%Y": String(date.getUTCFullYear()),
    "%m": String(date.getUTCMonth() + 1).padStart(2, "0"),
    "%d": String(date.getUTCDate()).padStart(2, "0"),
    "%H": String(date.getUTCHours()).padStart(2, "0"),
    "%M": String(date.getUTCMinutes()).padStart(2, "0"),
    "%S": String(date.getUTCSeconds()).padStart(2, "0")
  };
  return Object.entries(parts).reduce((result, [token, replacement]) => result.replaceAll(token, replacement), format);
}

// node_modules/opentui-markdown-render/src/merman/gantt/render-grid.ts
function renderGanttGridStyledText(grid, colors) {
  return renderDiagramGridStyledText(grid, (run) => run.style ? colors[run.style] : undefined, undefined, {
    trimBottom: true
  });
}

// node_modules/opentui-markdown-render/src/merman/gantt/style.ts
var DEFAULT_THEME_RGB3 = {
  title: [228, 239, 232],
  axis: [111, 138, 126],
  section: [154, 184, 169],
  task: [134, 225, 200],
  active: [134, 225, 200],
  critical: [230, 177, 126],
  done: [111, 138, 126],
  milestone: [198, 160, 246]
};
function resolveGanttStyleColors(colors = {}) {
  const axis = colors.axis ?? rgba(DEFAULT_THEME_RGB3.axis);
  const background = colors.background ?? rgba([13, 17, 23]);
  return {
    title: colors.title ?? rgba(DEFAULT_THEME_RGB3.title),
    axis,
    section: colors.section ?? rgba(DEFAULT_THEME_RGB3.section),
    task: colors.task ?? rgba(DEFAULT_THEME_RGB3.task),
    active: colors.active ?? rgba(DEFAULT_THEME_RGB3.active),
    critical: colors.critical ?? rgba(DEFAULT_THEME_RGB3.critical),
    done: colors.done ?? rgba(DEFAULT_THEME_RGB3.done),
    milestone: colors.milestone ?? rgba(DEFAULT_THEME_RGB3.milestone),
    trackMedium: blendColor(axis, background, 0.35),
    trackDim: blendColor(axis, background, 0.55),
    trackFaint: blendColor(axis, background, 0.72)
  };
}

// node_modules/opentui-markdown-render/src/merman/gitgraph/drawing.ts
var LANE_WIDTH = 2;
var LABEL_GAP2 = 2;
function drawGitGraphDiagramGrid(diagram, _options = {}) {
  if (diagram.commits.length === 0)
    return new DiagramCanvas(0, 0);
  const laneByBranch = new Map(diagram.branches.map((branch, index) => [branch.name, index]));
  const commitById = new Map(diagram.commits.map((commit) => [commit.id, commit]));
  const spans = branchSpans(diagram, commitById);
  const heads = branchHeads(diagram);
  const graphWidth = (diagram.branches.length - 1) * LANE_WIDTH + 1;
  let labelWidth = 0;
  for (const commit of diagram.commits)
    labelWidth = Math.max(labelWidth, diagramTextWidth(commitLabel(commit, heads)));
  const forks = diagram.commits.map((commit) => isFork(commit, laneByBranch, commitById));
  const height = diagram.commits.length + forks.filter(Boolean).length;
  const grid = new DiagramCanvas(graphWidth + LABEL_GAP2 + labelWidth, height);
  let row = 0;
  diagram.commits.forEach((commit, index) => {
    if (forks[index]) {
      drawTransitionRow(grid, spans, laneByBranch, commitById, commit, index, row);
      row += 1;
    }
    drawCommitRow(grid, diagram, spans, laneByBranch, commitById, commit, index, row);
    grid.setText(graphWidth + LABEL_GAP2, row, commitLabel(commit, heads), "label");
    row += 1;
  });
  return grid;
}
function drawTransitionRow(grid, spans, laneByBranch, commitById, commit, index, y) {
  const cells = new Map;
  for (const [branch, span] of spans) {
    if (span.first >= index || span.last < index)
      continue;
    const lane = laneByBranch.get(branch);
    connect(cells, lane * LANE_WIDTH, { up: true, down: true }, branchStyle(lane));
  }
  const lane = laneByBranch.get(commit.branch);
  const firstParent = commit.parents[0] === undefined ? undefined : commitById.get(commit.parents[0]);
  if (firstParent && firstParent.branch !== commit.branch) {
    const parentLane = laneByBranch.get(firstParent.branch);
    connectHorizontal(cells, parentLane, lane, { sourceUp: true, sourceDown: true, targetDown: true }, branchStyle(lane));
  }
  paintConnections(grid, cells, y);
}
function drawCommitRow(grid, diagram, spans, laneByBranch, commitById, commit, index, y) {
  const cells = new Map;
  for (const branch of diagram.branches) {
    const span = spans.get(branch.name);
    if (!span || span.first > index || span.last <= index && branch.name !== commit.branch)
      continue;
    const lane = laneByBranch.get(branch.name);
    connect(cells, lane * LANE_WIDTH, { up: index > 0, down: span.last > index }, branchStyle(lane));
  }
  const lane = laneByBranch.get(commit.branch);
  const secondParent = commit.parents[1] === undefined ? undefined : commitById.get(commit.parents[1]);
  if (secondParent) {
    const parentLane = laneByBranch.get(secondParent.branch);
    connectHorizontal(cells, lane, parentLane, { sourceUp: true, targetUp: true }, branchStyle(parentLane));
  }
  paintConnections(grid, cells, y);
  grid.setCell(lane * LANE_WIDTH, y, commitGlyph(commit), commitStyle(commit));
}
function connectHorizontal(cells, sourceLane, targetLane, vertical, style) {
  if (sourceLane === targetLane)
    return;
  const source = sourceLane * LANE_WIDTH;
  const target = targetLane * LANE_WIDTH;
  const direction = Math.sign(target - source);
  connect(cells, source, { ...verticalAt(vertical.sourceUp, vertical.sourceDown), ...direction > 0 ? { right: true } : { left: true } }, style);
  for (let x = source + direction;x !== target; x += direction) {
    connect(cells, x, { left: true, right: true }, style);
  }
  connect(cells, target, { ...verticalAt(vertical.targetUp, vertical.targetDown), ...direction > 0 ? { left: true } : { right: true } }, style);
}
function verticalAt(up, down) {
  return { ...up ? { up: true } : {}, ...down ? { down: true } : {} };
}
function connect(cells, x, additions, style) {
  const current = cells.get(x);
  cells.set(x, { ...current, ...additions, style: current?.style ?? style });
}
function paintConnections(grid, cells, y) {
  for (const [x, connections] of cells)
    grid.setCell(x, y, connectionGlyph(connections), connections.style);
}
function connectionGlyph({ up, down, left, right }) {
  const mask = `${up ? 1 : 0}${down ? 1 : 0}${left ? 1 : 0}${right ? 1 : 0}`;
  const glyphs = {
    "1100": "\u2502",
    "0011": "\u2500",
    "0101": "\u256D",
    "0110": "\u256E",
    "1001": "\u2570",
    "1010": "\u256F",
    "1101": "\u251C",
    "1110": "\u2524",
    "0111": "\u252C",
    "1011": "\u2534",
    "1111": "\u253C",
    "1000": "\u2502",
    "0100": "\u2502",
    "0010": "\u2500",
    "0001": "\u2500"
  };
  return glyphs[mask] ?? " ";
}
function branchSpans(diagram, commitById) {
  const spans = new Map;
  diagram.commits.forEach((commit, index) => {
    const span = spans.get(commit.branch);
    if (span)
      span.last = index;
    else
      spans.set(commit.branch, { first: index, last: index });
    for (const parentId of commit.parents) {
      const parent = commitById.get(parentId);
      if (!parent || parent.branch === commit.branch)
        continue;
      const parentSpan = spans.get(parent.branch);
      if (parentSpan)
        parentSpan.last = Math.max(parentSpan.last, index);
    }
  });
  return spans;
}
function branchHeads(diagram) {
  const heads = new Map;
  for (const branch of diagram.branches) {
    if (branch.head === undefined)
      continue;
    const names = heads.get(branch.head) ?? [];
    names.push(branch.name);
    heads.set(branch.head, names);
  }
  return heads;
}
function isFork(commit, laneByBranch, commitById) {
  const parent = commit.parents[0] === undefined ? undefined : commitById.get(commit.parents[0]);
  return parent !== undefined && laneByBranch.get(parent.branch) !== laneByBranch.get(commit.branch);
}
function commitGlyph(commit) {
  if (commit.type === "REVERSE")
    return "\u2297";
  if (commit.type === "HIGHLIGHT")
    return "\u25C6";
  return commit.parents.length > 1 ? "\u25CE" : "\u25CF";
}
function commitStyle(commit) {
  if (commit.type === "REVERSE")
    return "reverse";
  if (commit.type === "HIGHLIGHT")
    return "highlight";
  return commit.parents.length > 1 ? "merge" : "commit";
}
function commitLabel(commit, heads) {
  const subject = commit.message ?? commit.id;
  const decorations = [...heads.get(commit.id) ?? [], ...commit.tags].map((value) => `[${value}]`);
  return decorations.length === 0 ? subject : `${subject}  ${decorations.join(" ")}`;
}
function branchStyle(lane) {
  return `branch${lane % 8}`;
}

// node_modules/opentui-markdown-render/src/merman/gitgraph/render-grid.ts
function renderGitGraphGridStyledText(grid, colors) {
  return renderDiagramGridStyledText(grid, (run) => run.style ? colors[run.style] : undefined, undefined, {
    trimBottom: true
  });
}

// node_modules/opentui-markdown-render/src/merman/gitgraph/style.ts
var BRANCH_RGB = [
  [134, 225, 200],
  [230, 177, 126],
  [154, 184, 169],
  [198, 160, 246],
  [126, 189, 230],
  [225, 134, 166],
  [190, 210, 120],
  [180, 180, 210]
];
function resolveGitGraphStyleColors(colors = {}) {
  const rail = colors.muted ?? rgba([111, 138, 126]);
  return {
    branch0: rail,
    branch1: rail,
    branch2: rail,
    branch3: rail,
    branch4: rail,
    branch5: rail,
    branch6: rail,
    branch7: rail,
    commit: colors.primary ?? rgba(BRANCH_RGB[0]),
    merge: colors.secondary ?? rgba(BRANCH_RGB[2]),
    highlight: colors.warning ?? rgba(BRANCH_RGB[1]),
    reverse: colors.warning ?? rgba(BRANCH_RGB[5]),
    label: colors.text ?? rgba([228, 239, 232])
  };
}

// node_modules/opentui-markdown-render/src/merman/sequence/drawing.ts
import { BorderChars as BorderChars4 } from "@opentui/core";

// node_modules/opentui-markdown-render/src/merman/sequence/options.ts
var DEFAULT_MIN_PARTICIPANT_GAP = 18;
var DEFAULT_FRAGMENT_BORDER_STYLE = "rounded";
function normalizeSequenceMinParticipantGap(value) {
  return value === undefined || !Number.isFinite(value) ? DEFAULT_MIN_PARTICIPANT_GAP : Math.max(1, Math.floor(value));
}

// node_modules/opentui-markdown-render/src/merman/sequence/placement.ts
var NOTE_HORIZONTAL_PADDING = 2;
var GROUP_HORIZONTAL_PADDING = 2;
var FRAGMENT_HORIZONTAL_OVERHANG = 3;
function visualLength2(value) {
  return diagramTextWidth(value);
}
function mermaidLabelLines(label) {
  const lines = label.split(/(?:<br\s*\/?\s*>|\\n)/i).map((line) => line.trimEnd());
  return lines.length > 0 ? lines : [""];
}
function noteLabelLines(label) {
  const lines = mermaidLabelLines(label);
  const width = labelLinesWidth(lines);
  const padding = " ".repeat(NOTE_HORIZONTAL_PADDING);
  return lines.map((line) => `${padding}${line}${" ".repeat(width - visualLength2(line))}${padding}`);
}
function messageLabelText(message) {
  return message.number === undefined ? message.label : `${message.number}. ${message.label}`;
}
function participantHeaderWidth(label, compact) {
  const width = labelLinesWidth(mermaidLabelLines(label));
  return compact ? width : Math.max(3, width);
}
function fragmentLabelText(fragment) {
  if (fragment.kind === "end")
    return "";
  const prefix = fragment.kind === "loop" ? "\u21BB loop" : fragment.kind;
  return fragment.label ? ` ${prefix}: ${fragment.label} ` : ` ${prefix} `;
}
function isFragmentStart(kind) {
  return kind !== "else" && kind !== "and" && kind !== "option" && kind !== "end";
}
function messageLabelLines(label) {
  return mermaidLabelLines(label);
}
function labelLinesWidth(lines) {
  return lines.reduce((max, line) => Math.max(max, visualLength2(line)), 0);
}
function messageWidth(message) {
  return labelLinesWidth(messageLabelLines(messageLabelText(message)));
}
function selfMessageLoopWidthForLines(labelLines) {
  return Math.max(10, labelLinesWidth(labelLines) + 4);
}
function selfMessageLoopWidth(message) {
  return selfMessageLoopWidthForLines(messageLabelLines(messageLabelText(message)));
}
function arrowHeadX(toX, direction, head) {
  return head === undefined ? toX : toX - direction;
}
function inlineMessageLabel(message, labelLines, fromX, toX, compact) {
  if (!compact || message.from === message.to || labelLines.length !== 1)
    return;
  const label = ` ${labelLines[0]} `;
  return visualLength2(label) <= Math.abs(toX - fromX) - 3 ? label : undefined;
}
function getStepHeight(step, centers, participantIndexes, compact) {
  if (step.type === "note")
    return noteLabelLines(step.note.label).length + 2;
  if (step.type === "activation")
    return 0;
  if (step.type === "fragment")
    return 2;
  const labelLines = messageLabelLines(messageLabelText(step.message));
  const fromX = centers[participantIndexes.get(step.message.from) ?? -1];
  const toX = centers[participantIndexes.get(step.message.to) ?? -1];
  if (fromX !== undefined && toX !== undefined && inlineMessageLabel(step.message, labelLines, fromX, toX, compact)) {
    return 2;
  }
  return labelLines.length + (step.message.from === step.message.to ? 3 : 2);
}
function createParticipantIndexMap(diagram) {
  return new Map(diagram.participants.map((participant, index) => [participant.id, index]));
}
function getParticipantIndexes(participantIndexes, participantIds) {
  return participantIds.map((id) => participantIndexes.get(id) ?? -1).filter((index) => index >= 0);
}
function groupLabelText(group) {
  return group.label ? ` ${group.label} ` : "";
}
function getGroupRanges(diagram, participantIndexes) {
  return diagram.groups.flatMap((group) => {
    const indexes = getParticipantIndexes(participantIndexes, group.participantIds);
    return indexes.length === 0 ? [] : [{ group, startIndex: Math.min(...indexes), endIndex: Math.max(...indexes) }];
  });
}
function getStepParticipantIndexes(step, participantIndexes) {
  if (step.type === "message") {
    return getParticipantIndexes(participantIndexes, [step.message.from, step.message.to]);
  }
  if (step.type === "note")
    return getParticipantIndexes(participantIndexes, step.note.over);
  return [];
}
function getStepContentBounds(step, centers, participantIndexes) {
  if (step.type === "message") {
    const fromIndex = participantIndexes.get(step.message.from) ?? -1;
    const toIndex = participantIndexes.get(step.message.to) ?? -1;
    if (fromIndex < 0 || toIndex < 0)
      return;
    const fromX = centers[fromIndex];
    const toX = centers[toIndex];
    if (fromIndex === toIndex)
      return { leftX: fromX, rightX: fromX + selfMessageLoopWidth(step.message) };
    const leftX = Math.min(fromX, toX);
    const rightX = Math.max(fromX, toX);
    const labelWidth = messageWidth(step.message);
    const labelLeftX = leftX + 2;
    return { leftX: Math.min(leftX, labelLeftX), rightX: Math.max(rightX, labelLeftX + labelWidth - 1) };
  }
  if (step.type !== "note")
    return;
  const indexes = getParticipantIndexes(participantIndexes, step.note.over);
  if (indexes.length === 0)
    return;
  const centerX = Math.floor((centers[Math.min(...indexes)] + centers[Math.max(...indexes)]) / 2);
  const textLines = noteLabelLines(step.note.label);
  const width = labelLinesWidth(textLines);
  const leftX = step.note.position === "left" ? centerX - width - 2 : step.note.position === "right" ? centerX + 2 : centerX - Math.floor(width / 2);
  return { leftX, rightX: leftX + width - 1 };
}
function rangeContainsIndexes(range, indexes) {
  return indexes.length > 0 && indexes.every((index) => index >= range.startIndex && index <= range.endIndex);
}
function resolveGroupBounds(diagram, centers, participantIndexes, groupRanges, compact) {
  return groupRanges.map((range) => {
    let contentLeftX = centers[range.startIndex];
    let contentRightX = centers[range.endIndex];
    for (let i = range.startIndex;i <= range.endIndex; i++) {
      const headerWidth = participantHeaderWidth(diagram.participants[i].label, compact);
      const headerStartX = centers[i] - Math.floor(headerWidth / 2);
      contentLeftX = Math.min(contentLeftX, headerStartX);
      contentRightX = Math.max(contentRightX, headerStartX + headerWidth - 1);
    }
    for (const step of diagram.steps) {
      const indexes = getStepParticipantIndexes(step, participantIndexes);
      if (!rangeContainsIndexes(range, indexes))
        continue;
      const bounds = getStepContentBounds(step, centers, participantIndexes);
      if (bounds) {
        contentLeftX = Math.min(contentLeftX, bounds.leftX);
        contentRightX = Math.max(contentRightX, bounds.rightX);
      }
    }
    const labelText = groupLabelText(range.group);
    let leftX = contentLeftX - GROUP_HORIZONTAL_PADDING;
    let rightX = contentRightX + GROUP_HORIZONTAL_PADDING;
    const extraWidth = Math.max(0, visualLength2(labelText) + 4 - (rightX - leftX + 1));
    leftX -= Math.floor(extraWidth / 2);
    rightX += Math.ceil(extraWidth / 2);
    return { group: range.group, labelText, leftX, rightX };
  });
}
function expandHorizontalBounds(bounds, leftX, rightX) {
  bounds.leftX = Math.min(bounds.leftX, leftX);
  bounds.rightX = Math.max(bounds.rightX, rightX);
}
function getDiagramContentBounds(diagram, centers, participantIndexes, compact) {
  const bounds = { leftX: 0, rightX: 0 };
  for (let i = 0;i < diagram.participants.length; i++) {
    const headerWidth = participantHeaderWidth(diagram.participants[i].label, compact);
    const labelStartX = centers[i] - Math.floor(headerWidth / 2);
    expandHorizontalBounds(bounds, labelStartX, labelStartX + headerWidth - 1);
  }
  for (const step of diagram.steps) {
    const content = getStepContentBounds(step, centers, participantIndexes);
    if (content)
      expandHorizontalBounds(bounds, content.leftX, content.rightX);
  }
  return bounds;
}
function getFragmentFrameBounds(centers, fragment, nestingDepth = 0) {
  const leftParticipantX = centers[0];
  const rightParticipantX = centers[centers.length - 1];
  if (leftParticipantX === undefined || rightParticipantX === undefined)
    return;
  const leftX = leftParticipantX - FRAGMENT_HORIZONTAL_OVERHANG + nestingDepth;
  const participantRightX = rightParticipantX + FRAGMENT_HORIZONTAL_OVERHANG - nestingDepth;
  return { leftX, rightX: Math.max(participantRightX, leftX + 2 + visualLength2(fragmentLabelText(fragment)) + 1) };
}
function getFragmentFrameBoundsByStep(centers, steps, participantIndexes) {
  const boundsByStep = new Map;
  const activeFrames = [];
  for (const [index, step] of steps.entries()) {
    if (step.type !== "fragment") {
      const content = getStepContentBounds(step, centers, participantIndexes);
      if (content) {
        for (const frame of activeFrames) {
          expandHorizontalBounds(frame.bounds, content.leftX - 1, content.rightX + 1);
        }
      }
      continue;
    }
    const bounds = getFragmentFrameBounds(centers, step.fragment, activeFrames.length);
    if (!bounds)
      continue;
    if (isFragmentStart(step.fragment.kind)) {
      activeFrames.push({ startIndex: index, bounds: { ...bounds } });
      continue;
    }
    const frame = activeFrames[activeFrames.length - 1];
    if (!frame)
      continue;
    expandHorizontalBounds(frame.bounds, bounds.leftX, bounds.rightX);
    if (step.fragment.kind !== "end")
      continue;
    activeFrames.pop();
    boundsByStep.set(frame.startIndex, frame.bounds);
    const parent = activeFrames[activeFrames.length - 1];
    if (parent)
      expandHorizontalBounds(parent.bounds, frame.bounds.leftX - 1, frame.bounds.rightX + 1);
  }
  for (const frame of activeFrames)
    boundsByStep.set(frame.startIndex, frame.bounds);
  return boundsByStep;
}
function resolveParticipantCenters(diagram, participantIndexes, minParticipantGap, compact) {
  const gaps = Array.from({ length: Math.max(0, diagram.participants.length - 1) }, (_, index) => {
    const left = diagram.participants[index];
    const right = diagram.participants[index + 1];
    return Math.max(minParticipantGap, Math.ceil(participantHeaderWidth(left.label, compact) / 2) + Math.ceil(participantHeaderWidth(right.label, compact) / 2) + 6);
  });
  for (const message of diagram.messages) {
    const fromIndex = participantIndexes.get(message.from) ?? -1;
    const toIndex = participantIndexes.get(message.to) ?? -1;
    if (fromIndex === toIndex && fromIndex >= 0 && fromIndex < diagram.participants.length - 1) {
      gaps[fromIndex] = Math.max(gaps[fromIndex], selfMessageLoopWidth(message) + Math.ceil(labelLinesWidth(mermaidLabelLines(diagram.participants[fromIndex + 1].label)) / 2) + 2);
      continue;
    }
    if (fromIndex < 0 || toIndex < 0 || Math.abs(fromIndex - toIndex) !== 1)
      continue;
    const gapIndex = Math.min(fromIndex, toIndex);
    gaps[gapIndex] = Math.max(gaps[gapIndex], messageWidth(message) + 6);
  }
  for (const step of diagram.steps) {
    if (step.type !== "note")
      continue;
    const indexes = getParticipantIndexes(participantIndexes, step.note.over);
    if (indexes.length === 1 && step.note.position && step.note.position !== "over") {
      const participantIndex = indexes[0];
      const gapIndex = step.note.position === "left" ? participantIndex - 1 : participantIndex;
      if (gapIndex >= 0 && gapIndex < gaps.length) {
        gaps[gapIndex] = Math.max(gaps[gapIndex], labelLinesWidth(noteLabelLines(step.note.label)) + 4);
      }
      continue;
    }
    if (indexes.length !== 2 || Math.abs(indexes[0] - indexes[1]) !== 1)
      continue;
    const gapIndex = Math.min(indexes[0], indexes[1]);
    gaps[gapIndex] = Math.max(gaps[gapIndex], labelLinesWidth(noteLabelLines(step.note.label)) + 4);
  }
  const centers = [Math.max(1, Math.floor(participantHeaderWidth(diagram.participants[0]?.label ?? "", compact) / 2))];
  for (let i = 1;i < diagram.participants.length; i++)
    centers[i] = centers[i - 1] + gaps[i - 1];
  return centers;
}
function separateExpandedGroupsFromExternalParticipants(diagram, centers, participantIndexes, ranges, compact) {
  const adjusted = [...centers];
  for (let boundary = 0;boundary < adjusted.length - 1; boundary++) {
    const groups = resolveGroupBounds(diagram, adjusted, participantIndexes, ranges, compact);
    const leftWidth = participantHeaderWidth(diagram.participants[boundary].label, compact);
    const rightWidth = participantHeaderWidth(diagram.participants[boundary + 1].label, compact);
    let leftRight = adjusted[boundary] - Math.floor(leftWidth / 2) + leftWidth - 1;
    let rightLeft = adjusted[boundary + 1] - Math.floor(rightWidth / 2);
    let bordersGroup = false;
    for (const [index, range] of ranges.entries()) {
      if (range.endIndex === boundary) {
        leftRight = Math.max(leftRight, groups[index].rightX);
        bordersGroup = true;
      }
      if (range.startIndex === boundary + 1) {
        rightLeft = Math.min(rightLeft, groups[index].leftX);
        bordersGroup = true;
      }
    }
    if (!bordersGroup)
      continue;
    const shift = leftRight + GROUP_HORIZONTAL_PADDING + 1 - rightLeft;
    if (shift <= 0)
      continue;
    for (let participantIndex = boundary + 1;participantIndex < adjusted.length; participantIndex++) {
      adjusted[participantIndex] += shift;
    }
  }
  return adjusted;
}
function createSequencePlacementPlan(diagram, options = {}) {
  if (diagram.participants.length === 0) {
    return {
      width: 0,
      height: 0,
      rows: {
        participantHeaderTopY: 0,
        participantHeaderY: 0,
        participantRuleY: 0,
        lifelineStartY: 0,
        lifelineEndY: 0
      },
      participants: [],
      groups: [],
      activations: [],
      steps: []
    };
  }
  const indexes = createParticipantIndexMap(diagram);
  const compact = options.compact ?? false;
  let centers = resolveParticipantCenters(diagram, indexes, normalizeSequenceMinParticipantGap(options.minParticipantGap), compact);
  const ranges = getGroupRanges(diagram, indexes);
  centers = separateExpandedGroupsFromExternalParticipants(diagram, centers, indexes, ranges, compact);
  let groups = resolveGroupBounds(diagram, centers, indexes, ranges, compact);
  let contentBounds = getDiagramContentBounds(diagram, centers, indexes, compact);
  let frameBounds = getFragmentFrameBoundsByStep(centers, diagram.steps, indexes);
  const fragmentBounds = () => {
    const result = { leftX: 0, rightX: 0 };
    for (const bounds of frameBounds.values())
      expandHorizontalBounds(result, bounds.leftX, bounds.rightX);
    return result;
  };
  let fragments = fragmentBounds();
  const leftOverflow = Math.min(groups.reduce((left, group) => Math.min(left, group.leftX), 0), contentBounds.leftX, fragments.leftX, 0);
  if (leftOverflow < 0) {
    centers = centers.map((center) => center - leftOverflow);
    groups = resolveGroupBounds(diagram, centers, indexes, ranges, compact);
    contentBounds = getDiagramContentBounds(diagram, centers, indexes, compact);
    frameBounds = getFragmentFrameBoundsByStep(centers, diagram.steps, indexes);
    fragments = fragmentBounds();
  }
  const hasGroups = groups.length > 0;
  const participantLabelHeight = Math.max(1, ...diagram.participants.map((participant) => mermaidLabelLines(participant.label).length));
  const participantHeaderTopY = hasGroups ? 1 : 0;
  const participantHeaderY = participantHeaderTopY;
  const participantRuleY = participantHeaderTopY + (compact ? participantLabelHeight - 1 : participantLabelHeight);
  const lifelineStartY = participantRuleY + 1;
  const stepStartY = lifelineStartY + 1;
  const width = Math.max(contentBounds.rightX + 1, ...groups.map((group) => group.rightX + 1), fragments.rightX + 1);
  const baseHeight = stepStartY + diagram.steps.reduce((total, step) => total + getStepHeight(step, centers, indexes, compact), 0);
  const height = hasGroups ? Math.max(5, baseHeight + 1) : Math.max(3, baseHeight);
  const lifelineEndY = hasGroups ? height - 2 : height - 1;
  const participants = diagram.participants.map((participant, index) => {
    const centerX = centers[index];
    const width = participantHeaderWidth(participant.label, compact);
    const headerLeftX = centerX - Math.floor(width / 2);
    const labelLines = mermaidLabelLines(participant.label);
    return {
      participant,
      centerX,
      headerLeftX,
      headerRightX: headerLeftX + width - 1,
      labelLines
    };
  });
  const steps = [];
  const activations = [];
  const activeByParticipant = new Map;
  const lastEventYByParticipant = new Map;
  const openActivation = (participant, y) => {
    const active = activeByParticipant.get(participant) ?? [];
    active.push({ startY: y, depth: active.length });
    activeByParticipant.set(participant, active);
  };
  const closeActivation = (participant, y) => {
    const active = activeByParticipant.get(participant);
    const opened = active?.pop();
    const participantIndex = indexes.get(participant);
    if (!opened || participantIndex === undefined)
      return;
    activations.push({
      participant,
      centerX: centers[participantIndex],
      startY: opened.startY,
      endY: y,
      depth: opened.depth
    });
  };
  let stepY = stepStartY;
  const activeFrames = [];
  for (const [stepIndex, step] of diagram.steps.entries()) {
    if (step.type === "activation") {
      const eventY = Math.min(lastEventYByParticipant.get(step.activation.participant) ?? stepY, lifelineEndY);
      if (step.activation.active)
        openActivation(step.activation.participant, eventY);
      else
        closeActivation(step.activation.participant, eventY);
      continue;
    }
    const stepHeight = getStepHeight(step, centers, indexes, compact);
    if (step.type === "note") {
      const noteIndexes = getParticipantIndexes(indexes, step.note.over);
      if (noteIndexes.length > 0) {
        const centerX = Math.floor((centers[Math.min(...noteIndexes)] + centers[Math.max(...noteIndexes)]) / 2);
        const textLines = noteLabelLines(step.note.label);
        const width = labelLinesWidth(textLines);
        const textX = step.note.position === "left" ? centerX - width - 2 : step.note.position === "right" ? centerX + 2 : centerX - Math.floor(width / 2);
        steps.push({ type: "note", note: step.note, textLines, textX, textY: stepY + 1 });
      }
      stepY += stepHeight;
      continue;
    }
    if (step.type === "fragment") {
      let bounds = frameBounds.get(stepIndex) ?? getFragmentFrameBounds(centers, step.fragment);
      let wallsBefore;
      if (isFragmentStart(step.fragment.kind)) {
        if (bounds)
          activeFrames.push({ bounds, boundaryY: stepY });
      } else {
        const frame = activeFrames[activeFrames.length - 1];
        if (frame) {
          bounds = frame.bounds;
          wallsBefore = { bounds, startY: frame.boundaryY + 1, endY: stepY - 1 };
          if (step.fragment.kind === "end")
            activeFrames.pop();
          else
            frame.boundaryY = stepY;
        }
      }
      if (bounds)
        steps.push({
          type: "fragment",
          fragment: step.fragment,
          labelText: fragmentLabelText(step.fragment),
          bounds,
          y: stepY,
          wallsBefore
        });
      stepY += stepHeight;
      continue;
    }
    const fromIndex = indexes.get(step.message.from) ?? -1;
    const toIndex = indexes.get(step.message.to) ?? -1;
    if (fromIndex < 0 || toIndex < 0)
      continue;
    const labelLines = messageLabelLines(messageLabelText(step.message));
    if (fromIndex === toIndex) {
      const centerX = centers[fromIndex];
      const bottomY = stepY + labelLines.length + 1;
      steps.push({
        type: "selfMessage",
        message: step.message,
        labelLines,
        centerX,
        rightX: centerX + selfMessageLoopWidthForLines(labelLines),
        topY: stepY,
        bottomY
      });
      if (step.message.activate)
        openActivation(step.message.activate, bottomY);
      if (step.message.deactivate)
        closeActivation(step.message.deactivate, bottomY);
      lastEventYByParticipant.set(step.message.from, bottomY);
    } else {
      const fromX = centers[fromIndex];
      const toX = centers[toIndex];
      const direction = toX > fromX ? 1 : -1;
      const leftX = Math.min(fromX, toX);
      const rightX = Math.max(fromX, toX);
      const inlineLabel = inlineMessageLabel(step.message, labelLines, fromX, toX, compact);
      const arrowY = inlineLabel ? stepY : stepY + labelLines.length;
      const renderedLabelWidth = inlineLabel ? visualLength2(inlineLabel) : labelLinesWidth(labelLines);
      const labelX = inlineLabel ? Math.floor((leftX + rightX - renderedLabelWidth) / 2) : leftX + 2;
      steps.push({
        type: "message",
        message: step.message,
        labelLines,
        labelX,
        labelY: stepY,
        arrowY,
        fromX,
        toX,
        leftX,
        rightX,
        direction,
        headX: arrowHeadX(toX, direction, step.message.head),
        inlineLabel
      });
      if (step.message.activate)
        openActivation(step.message.activate, arrowY);
      if (step.message.deactivate)
        closeActivation(step.message.deactivate, arrowY);
      lastEventYByParticipant.set(step.message.from, arrowY);
      lastEventYByParticipant.set(step.message.to, arrowY);
    }
    stepY += stepHeight;
  }
  for (const [participant, active] of activeByParticipant) {
    while (active.length > 0)
      closeActivation(participant, lifelineEndY);
  }
  return {
    width,
    height,
    rows: { participantHeaderTopY, participantHeaderY, participantRuleY, lifelineStartY, lifelineEndY },
    participants,
    groups,
    activations,
    steps
  };
}

// node_modules/opentui-markdown-render/src/merman/sequence/style.ts
var SEQUENCE_FADE_STEPS = DIAGRAM_FADE_STEPS;
var LIFELINE_RAMP_STYLES = [
  "lifelineRamp1",
  "lifelineRamp2",
  "lifelineRamp3"
];
var DEFAULT_THEME_RGB4 = {
  participant: [228, 239, 232],
  lifeline: [111, 138, 126],
  group: [76, 99, 89],
  request: [134, 225, 200],
  response: [230, 177, 126],
  fragment: [154, 184, 169],
  fragmentLabelBg: [28, 43, 36],
  noteFg: [215, 229, 221],
  noteBg: [36, 56, 47]
};
function resolveSequenceStyleColors(colors = {}) {
  const participant = colors.participant ?? rgba(DEFAULT_THEME_RGB4.participant);
  const lifeline = colors.lifeline ?? rgba(DEFAULT_THEME_RGB4.lifeline);
  const request = colors.request ?? rgba(DEFAULT_THEME_RGB4.request);
  const response = colors.response ?? rgba(DEFAULT_THEME_RGB4.response);
  return {
    participant,
    lifeline,
    group: colors.group ?? rgba(DEFAULT_THEME_RGB4.group),
    request,
    response,
    fragment: colors.fragment ?? rgba(DEFAULT_THEME_RGB4.fragment),
    fragmentLabelBg: colors.fragmentLabelBg ?? rgba(DEFAULT_THEME_RGB4.fragmentLabelBg),
    note: colors.note ?? rgba(DEFAULT_THEME_RGB4.noteFg),
    noteBg: colors.noteBg ?? rgba(DEFAULT_THEME_RGB4.noteBg),
    ...createColorRampTheme(numberedStyleKeys("requestFade", SEQUENCE_FADE_STEPS), lifeline, request),
    ...createColorRampTheme(numberedStyleKeys("responseFade", SEQUENCE_FADE_STEPS), lifeline, response),
    ...createColorRampTheme(LIFELINE_RAMP_STYLES, participant, lifeline)
  };
}
function sequenceStyleColor(style, colors) {
  if (style === "noteBadge")
    return colors.note;
  if (style === "fragmentLabel")
    return colors.fragment;
  return style ? colors[style] : undefined;
}
function sequenceStyleBackgroundColor(style, colors) {
  if (style === "note" || style === "noteBadge")
    return colors.noteBg;
  if (style === "fragmentLabel")
    return colors.fragmentLabelBg;
  return;
}

// node_modules/opentui-markdown-render/src/merman/sequence/drawing.ts
var SEQUENCE_BORDER = BorderChars4.rounded;
function centeredStart(center, text) {
  return center - Math.floor(diagramTextWidth(text) / 2);
}
function arrowHeadChar(head, direction) {
  switch (head) {
    case "open":
      return direction === 1 ? ">" : "<";
    case "cross":
      return "\u2715";
    case "async":
      return direction === 1 ? ")" : "(";
    default:
      return direction === 1 ? "\u25BA" : "\u25C4";
  }
}
function createGrid(width, height) {
  return new DiagramCanvas(width, height);
}
function setCell2(grid, x, y, char, style) {
  grid.setCell(x, y, char, style);
}
function setText2(grid, x, y, text, style) {
  grid.setText(Math.max(0, x), y, text, style);
}
function setArrowDepartureFade(grid, x, y, direction, style) {
  setCell2(grid, x, y, direction === 1 ? SEQUENCE_BORDER.leftT : SEQUENCE_BORDER.rightT, `${style}Fade1`);
  for (let step = 2;step <= 5; step++) {
    setCell2(grid, x + direction * (step - 1), y, SEQUENCE_BORDER.horizontal, `${style}Fade${step}`);
  }
}
function groupVerticalChar(existing) {
  switch (existing) {
    case undefined:
    case " ":
      return SEQUENCE_BORDER.vertical;
    case SEQUENCE_BORDER.vertical:
      return SEQUENCE_BORDER.vertical;
    default:
      return;
  }
}
function setGroupVerticalCell(grid, x, y) {
  const existing = grid.getCell(x, y)?.char;
  const char = groupVerticalChar(existing);
  if (char)
    setCell2(grid, x, y, char, "group");
}
function renderParticipantGroups(grid, groupBounds, bottomY) {
  for (const bounds of groupBounds) {
    for (let x = bounds.leftX;x <= bounds.rightX; x++) {
      setCell2(grid, x, 0, SEQUENCE_BORDER.horizontal, "group");
      setCell2(grid, x, bottomY, SEQUENCE_BORDER.horizontal, "group");
    }
    setCell2(grid, bounds.leftX, 0, SEQUENCE_BORDER.topLeft, "group");
    setCell2(grid, bounds.rightX, 0, SEQUENCE_BORDER.topRight, "group");
    setCell2(grid, bounds.leftX, bottomY, SEQUENCE_BORDER.bottomLeft, "group");
    setCell2(grid, bounds.rightX, bottomY, SEQUENCE_BORDER.bottomRight, "group");
    for (let y = 1;y < bottomY; y++) {
      setGroupVerticalCell(grid, bounds.leftX, y);
      setGroupVerticalCell(grid, bounds.rightX, y);
    }
    if (bounds.labelText) {
      setText2(grid, bounds.leftX + 2, 0, bounds.labelText, "group");
    }
  }
}
function drawFragmentWalls(grid, bounds, startY, endY, borderStyle) {
  if (endY < startY)
    return;
  const border = BorderChars4[borderStyle];
  for (let y = startY;y <= endY; y++) {
    setCell2(grid, bounds.leftX, y, border.vertical, "fragment");
    setCell2(grid, bounds.rightX, y, border.vertical, "fragment");
  }
}
function renderFragment(grid, placement, borderStyle) {
  const { bounds, fragment, labelText: label, y } = placement;
  const border = BorderChars4[borderStyle];
  const { leftX, rightX } = bounds;
  const leftChar = isFragmentStart(fragment.kind) ? border.topLeft : fragment.kind !== "end" ? border.leftT : border.bottomLeft;
  const rightChar = isFragmentStart(fragment.kind) ? border.topRight : fragment.kind !== "end" ? border.rightT : border.bottomRight;
  for (let x = leftX;x <= rightX; x++) {
    setCell2(grid, x, y, border.horizontal, "fragment");
  }
  setCell2(grid, leftX, y, leftChar, "fragment");
  setCell2(grid, rightX, y, rightChar, "fragment");
  if (label) {
    setText2(grid, leftX + 2, y, label, "fragmentLabel");
  }
}
function renderSelfMessage(grid, placement, style) {
  const { centerX, rightX, topY: topRow, bottomY: bottomRow, labelLines, message } = placement;
  setArrowDepartureFade(grid, centerX, topRow, 1, style);
  for (let x = centerX + SEQUENCE_FADE_STEPS.length;x < rightX; x++) {
    setCell2(grid, x, topRow, SEQUENCE_BORDER.horizontal, style);
  }
  setCell2(grid, rightX, topRow, SEQUENCE_BORDER.topRight, style);
  for (let lineIndex = 0;lineIndex < labelLines.length; lineIndex++) {
    const y = topRow + lineIndex + 1;
    setCell2(grid, centerX, y, SEQUENCE_BORDER.vertical, "lifeline");
    setText2(grid, centerX + 2, y, labelLines[lineIndex], style);
    setCell2(grid, rightX, y, SEQUENCE_BORDER.vertical, style);
  }
  for (let x = centerX + 1;x < rightX; x++) {
    setCell2(grid, x, bottomRow, SEQUENCE_BORDER.horizontal, style);
  }
  const headX = message.head === undefined ? centerX : centerX + 1;
  setCell2(grid, headX, bottomRow, arrowHeadChar(message.head, -1), style);
  setCell2(grid, rightX, bottomRow, SEQUENCE_BORDER.bottomRight, style);
}
function renderNote(grid, placement) {
  placement.textLines.forEach((line, index) => setText2(grid, placement.textX, placement.textY + index, line, "noteBadge"));
}
function drawSequenceDiagramGrid(diagram, options = {}) {
  const plan = createSequencePlacementPlan(diagram, options);
  if (plan.width === 0 || plan.height === 0)
    return createGrid(0, 0);
  const fragmentBorderStyle = options.fragmentBorderStyle ?? DEFAULT_FRAGMENT_BORDER_STYLE;
  const grid = createGrid(plan.width, plan.height);
  if (plan.groups.length > 0)
    renderParticipantGroups(grid, plan.groups, plan.height - 1);
  for (const placement of plan.participants) {
    const { centerX: center, headerLeftX, headerRightX, labelLines } = placement;
    const { participantHeaderTopY, participantHeaderY, participantRuleY, lifelineStartY, lifelineEndY } = plan.rows;
    if (options.compact) {
      labelLines.forEach((line, index) => setText2(grid, centeredStart(center, line), participantHeaderY + index, line, "participant"));
    } else {
      labelLines.forEach((line, index) => setText2(grid, centeredStart(center, line), participantHeaderTopY + index, line, "participant"));
      for (let x = headerLeftX;x <= headerRightX; x++) {
        setCell2(grid, x, participantRuleY, SEQUENCE_BORDER.horizontal, "participant");
      }
      setCell2(grid, center, participantRuleY, SEQUENCE_BORDER.topT, "participant");
    }
    for (let y = lifelineStartY;y <= lifelineEndY; y++) {
      const distance = y - lifelineStartY;
      const style = !options.compact && distance < 3 ? `lifelineRamp${distance + 1}` : "lifeline";
      setCell2(grid, center, y, SEQUENCE_BORDER.vertical, style);
    }
  }
  for (const placement of plan.steps) {
    if (placement.type === "note") {
      renderNote(grid, placement);
      continue;
    }
    if (placement.type === "fragment") {
      if (placement.wallsBefore) {
        drawFragmentWalls(grid, placement.wallsBefore.bounds, placement.wallsBefore.startY, placement.wallsBefore.endY, fragmentBorderStyle);
      }
      renderFragment(grid, placement, fragmentBorderStyle);
      continue;
    }
    const message = placement.message;
    const messageStyle = message.style === "dashed" ? "response" : "request";
    if (placement.type === "selfMessage") {
      renderSelfMessage(grid, placement, messageStyle);
      continue;
    }
    if (!placement.inlineLabel) {
      for (let lineIndex = 0;lineIndex < placement.labelLines.length; lineIndex++) {
        setText2(grid, placement.labelX, placement.labelY + lineIndex, placement.labelLines[lineIndex], messageStyle);
      }
    }
    for (let x = placement.leftX + 1;x < placement.rightX; x++) {
      setCell2(grid, x, placement.arrowY, SEQUENCE_BORDER.horizontal, messageStyle);
    }
    setArrowDepartureFade(grid, placement.fromX, placement.arrowY, placement.direction, messageStyle);
    setCell2(grid, placement.headX, placement.arrowY, arrowHeadChar(message.head, placement.direction), messageStyle);
    if (placement.inlineLabel)
      setText2(grid, placement.labelX, placement.labelY, placement.inlineLabel, messageStyle);
  }
  for (const activation of plan.activations) {
    for (let y = activation.startY;y <= activation.endY; y++) {
      if (grid.getCell(activation.centerX, y)?.char === SEQUENCE_BORDER.vertical) {
        setCell2(grid, activation.centerX, y, "\u2503", "lifeline");
      }
    }
  }
  return grid;
}

// node_modules/opentui-markdown-render/src/merman/sequence/render-grid.ts
function renderSequenceGridStyledText(grid, colors) {
  return renderDiagramGridStyledText(grid, (run) => sequenceStyleColor(run.style, colors), (run) => sequenceStyleBackgroundColor(run.style, colors));
}

// node_modules/opentui-markdown-render/src/merman/state/drawing.ts
import { BorderChars as BorderChars6 } from "@opentui/core";

// node_modules/opentui-markdown-render/src/merman/core/spatial.ts
function normalizedSpan(y, fromX, toX) {
  return { y, fromX: Math.min(fromX, toX), toX: Math.max(fromX, toX) };
}
function assertFiniteInteger(value, name) {
  if (!Number.isFinite(value) || !Number.isInteger(value))
    throw new RangeError(`${name} must be a finite integer`);
}
function spatialRectSpans(bounds) {
  assertFiniteInteger(bounds.left, "bounds.left");
  assertFiniteInteger(bounds.top, "bounds.top");
  assertFiniteInteger(bounds.width, "bounds.width");
  assertFiniteInteger(bounds.height, "bounds.height");
  if (bounds.width <= 0 || bounds.height <= 0)
    throw new RangeError("Spatial bounds must have positive dimensions");
  return Array.from({ length: bounds.height }, (_, offset) => normalizedSpan(bounds.top + offset, bounds.left, bounds.left + bounds.width - 1));
}
function spatialPathSpans(points) {
  for (const [index, point] of points.entries()) {
    assertFiniteInteger(point.x, `points[${index}].x`);
    assertFiniteInteger(point.y, `points[${index}].y`);
    if (index > 0 && point.x !== points[index - 1].x && point.y !== points[index - 1].y) {
      throw new RangeError("Spatial paths must be orthogonal");
    }
  }
  const cells = new Map;
  const add = (point) => {
    const row = cells.get(point.y) ?? new Set;
    row.add(point.x);
    cells.set(point.y, row);
  };
  if (points.length === 1)
    add(points[0]);
  for (const point of orthogonalPathPoints(points))
    add(point);
  return [...cells.entries()].sort(([left], [right]) => left - right).flatMap(([y, xs]) => {
    const sorted = [...xs].sort((left, right) => left - right);
    const [first, ...rest] = sorted;
    if (first === undefined)
      return [];
    const spans = [];
    let start = first;
    let end = first;
    for (const x of rest) {
      if (x === end + 1) {
        end = x;
        continue;
      }
      spans.push(normalizedSpan(y, start, end));
      start = x;
      end = x;
    }
    spans.push(normalizedSpan(y, start, end));
    return spans;
  });
}
function spatialRectClaim(id, owner, role, bounds) {
  return { id, owner, role, spans: spatialRectSpans(bounds) };
}
function spatialPathClaim(id, owner, role, points) {
  return { id, owner, role, spans: spatialPathSpans(points) };
}
function compareClaims(left, right) {
  return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
}
function sameClaim(left, right) {
  return left.id === right.id && left.owner === right.owner && left.role === right.role && left.spans.length === right.spans.length && left.spans.every((span, index) => span.y === right.spans[index].y && span.fromX === right.spans[index].fromX && span.toX === right.spans[index].toX);
}
function pointIsContact(point, existing, contacts) {
  return contacts.some((contact) => contact.owner === existing.owner && contact.points.some((candidate) => candidate.x === point.x && candidate.y === point.y));
}
function rolesMayOverlap(moving, existing) {
  if (moving.owner === existing.owner)
    return true;
  return moving.role === "route" && existing.role === "route";
}
function normalizeClearance(clearance) {
  const x = typeof clearance === "number" ? clearance : clearance?.x ?? 0;
  const y = typeof clearance === "number" ? clearance : clearance?.y ?? 0;
  assertFiniteInteger(x, "clearance.x");
  assertFiniteInteger(y, "clearance.y");
  if (x < 0 || y < 0)
    throw new RangeError("Spatial clearance cannot be negative");
  return { x, y };
}
function inflateSpan(span, clearance) {
  return { y: span.y, fromX: span.fromX - clearance.x, toX: span.toX + clearance.x };
}

class SpatialIndex {
  static empty() {
    return new SpatialIndex([]);
  }
  claims;
  constructor(claims) {
    this.claims = Object.freeze(claims.map((claim) => Object.freeze({
      ...claim,
      spans: Object.freeze([...claim.spans].map((span) => Object.freeze({ ...span })).sort((left, right) => left.y - right.y || left.fromX - right.fromX || left.toX - right.toX))
    })));
  }
  add(...claims) {
    return this.overlay(new SpatialIndex(claims));
  }
  overlay(other) {
    const claims = new Map(this.claims.map((claim) => [claim.id, claim]));
    for (const claim of other.claims) {
      const existing = claims.get(claim.id);
      if (existing && !sameClaim(existing, claim))
        throw new Error(`Conflicting spatial claim id: ${claim.id}`);
      claims.set(claim.id, claim);
    }
    return new SpatialIndex([...claims.values()].sort(compareClaims));
  }
  conflicts(moving, policy = {}) {
    const contacts = policy.contacts ?? [];
    const conflicts = [];
    for (const existing of this.claims) {
      if (rolesMayOverlap(moving, existing))
        continue;
      const configuredClearance = typeof policy.clearance === "number" || policy.clearance && "x" in policy.clearance ? policy.clearance : policy.clearance?.[existing.role];
      const clearance = normalizeClearance(configuredClearance);
      for (const movingSpan of moving.spans) {
        for (let dy = -clearance.y;dy <= clearance.y; dy++) {
          const inflated = inflateSpan({ ...movingSpan, y: movingSpan.y + dy }, clearance);
          for (const existingSpan of existing.spans) {
            if (inflated.y !== existingSpan.y)
              continue;
            const fromX = Math.max(inflated.fromX, existingSpan.fromX);
            const toX = Math.min(inflated.toX, existingSpan.toX);
            for (let x = fromX;x <= toX; x++) {
              const point = { x, y: inflated.y };
              const movingOccupiesPoint = moving.spans.some((span) => span.y === point.y && point.x >= span.fromX && point.x <= span.toX);
              if (!(movingOccupiesPoint && pointIsContact(point, existing, contacts))) {
                conflicts.push({ moving, existing, point });
              }
            }
          }
        }
      }
    }
    return conflicts;
  }
  isFree(claim, policy = {}) {
    return this.conflicts(claim, policy).length === 0;
  }
  firstFit(candidates, policy = {}) {
    return candidates.find((candidate) => this.isFree(candidate.claim, policy));
  }
}

// node_modules/opentui-markdown-render/src/merman/state/routing.ts
import { BorderChars as BorderChars5 } from "@opentui/core";

// node_modules/opentui-markdown-render/src/merman/state/note.ts
function stateDiagramNoteConnector(bounds, target) {
  if (bounds.connector)
    return bounds.connector;
  const noteX = bounds.note.position === "right" ? bounds.left - 1 : bounds.left + bounds.width;
  const targetX = bounds.note.position === "right" ? target.left + target.width : target.left - 1;
  const targetBottom = target.top + target.height - 1;
  const noteBottom = bounds.top + bounds.height - 1;
  const noteAbove = noteBottom < target.top;
  const noteBelow = bounds.top > targetBottom;
  if (noteAbove || noteBelow) {
    const connectorY = bounds.centerY;
    return {
      connectorY,
      points: [
        { x: targetX, y: noteAbove ? target.top - 1 : targetBottom + 1 },
        { x: targetX, y: connectorY },
        { x: noteX, y: connectorY }
      ]
    };
  }
  const connectorY = Math.max(bounds.top + 1, Math.min(target.centerY, bounds.top + bounds.height - 2));
  return {
    connectorY,
    points: [
      { x: targetX, y: connectorY },
      { x: noteX, y: connectorY }
    ]
  };
}

// node_modules/opentui-markdown-render/src/merman/state/search.ts
var MAX_RENDER_SEARCH_VISITS = 250000;
function createStateSearchBudget() {
  return { remaining: MAX_RENDER_SEARCH_VISITS };
}
function createStateSearchSpace(space, clearance = () => 0) {
  const blocked = new Set;
  let minX = 0;
  let minY = 0;
  let maxX = 0;
  let maxY = 0;
  for (const claim of space.claims) {
    const padding = clearance(claim.role);
    for (const span of claim.spans) {
      for (let y = span.y - padding;y <= span.y + padding; y++) {
        for (let x = span.fromX - padding;x <= span.toX + padding; x++) {
          blocked.add(`${x}:${y}`);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
  }
  return { blocked, minX, minY, maxX, maxY };
}
function findStateManhattanPath(starts, goal, space, bounds, budget, isFree = (point) => !space.blocked.has(pointKey(point))) {
  const queue = [...new Map(starts.filter(isFree).map((point) => [pointKey(point), point])).values()];
  const parents = new Map(queue.map((point) => [pointKey(point), undefined]));
  const points = new Map(queue.map((point) => [pointKey(point), point]));
  for (let cursor = 0;cursor < queue.length && budget.remaining > 0; cursor++, budget.remaining--) {
    const current = queue[cursor];
    if (current.x === goal.x && current.y === goal.y)
      break;
    const dx = Math.sign(goal.x - current.x);
    const dy = Math.sign(goal.y - current.y);
    const candidates = [
      ...dx === 0 ? [] : [{ x: current.x + dx, y: current.y }],
      ...dy === 0 ? [] : [{ x: current.x, y: current.y + dy }],
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y - 1 }
    ];
    for (const candidate of candidates) {
      if (candidate.x < bounds.minX || candidate.x > bounds.maxX || candidate.y < bounds.minY || candidate.y > bounds.maxY)
        continue;
      const key = pointKey(candidate);
      if (parents.has(key) || !isFree(candidate))
        continue;
      parents.set(key, pointKey(current));
      points.set(key, candidate);
      queue.push(candidate);
    }
  }
  if (!parents.has(pointKey(goal)))
    return;
  const path = [];
  let cursor = pointKey(goal);
  while (cursor) {
    path.push(points.get(cursor));
    cursor = parents.get(cursor);
  }
  return path.reverse();
}
function pointKey(point) {
  return `${point.x}:${point.y}`;
}

// node_modules/opentui-markdown-render/src/merman/state/visible-model.ts
function isHiddenCompositeMarker(state) {
  return Boolean(state?.parentId && (state.kind === "start" || state.kind === "end"));
}
function composeTransitionLabel(incoming, outgoing) {
  return [incoming.label, outgoing.label].filter(Boolean).join("<br/>");
}
function collapseHiddenCompositeMarkerTransitionsOnce(transitions, statesById) {
  const hiddenMarkers = new Set([...statesById.values()].filter((state) => isHiddenCompositeMarker(state)).map((state) => state.id));
  if (hiddenMarkers.size === 0)
    return { transitions: [...transitions], changed: false };
  for (const markerId of hiddenMarkers) {
    const incoming = transitions.filter((transition) => transition.to === markerId && transition.from !== markerId);
    const outgoing = transitions.filter((transition) => transition.from === markerId && transition.to !== markerId);
    if (incoming.length === 0 || outgoing.length === 0)
      continue;
    const skipped = new Set([...incoming, ...outgoing]);
    return {
      transitions: [
        ...transitions.filter((transition) => !skipped.has(transition)),
        ...incoming.flatMap((incomingTransition) => outgoing.map((outgoingTransition) => ({
          from: incomingTransition.from,
          to: outgoingTransition.to,
          label: composeTransitionLabel(incomingTransition, outgoingTransition)
        })))
      ],
      changed: true
    };
  }
  return { transitions: [...transitions], changed: false };
}
function collapseHiddenCompositeMarkerTransitions(diagram) {
  const statesById = new Map(diagram.states.map((state) => [state.id, state]));
  let transitions = diagram.transitions.map((transition) => ({ ...transition }));
  while (true) {
    const result = collapseHiddenCompositeMarkerTransitionsOnce(transitions, statesById);
    transitions = result.transitions;
    if (!result.changed)
      return transitions;
  }
}
function prepareVisibleStateDiagram(diagram) {
  const transitions = collapseHiddenCompositeMarkerTransitions(diagram);
  const referencedHiddenMarkers = new Set;
  const statesById = new Map(diagram.states.map((state) => [state.id, state]));
  for (const transition of transitions) {
    const from = statesById.get(transition.from);
    const to = statesById.get(transition.to);
    if (from && isHiddenCompositeMarker(from))
      referencedHiddenMarkers.add(from.id);
    if (to && isHiddenCompositeMarker(to))
      referencedHiddenMarkers.add(to.id);
  }
  return {
    ...diagram,
    states: diagram.states.filter((state) => !isHiddenCompositeMarker(state) || referencedHiddenMarkers.has(state.id)),
    transitions
  };
}

// node_modules/opentui-markdown-render/src/merman/state/routing.ts
function measureStateTransitionLabel(label) {
  if (!label)
    return { lines: [], width: 0, height: 0 };
  const lines = splitDiagramLines(label);
  return { lines, width: Math.max(...lines.map(diagramTextWidth)), height: lines.length };
}
function hasReverseTransition(diagram, transition) {
  return diagram.transitions.some((other) => other.from === transition.to && other.to === transition.from);
}
function isStateHorizontalFeedback(diagram, from, to) {
  if (diagram.direction === "RL")
    return to.centerX > from.centerX;
  return to.centerX < from.centerX;
}
function feedbackIntervalsOverlap(left, right) {
  return left.left <= right.right && right.left <= left.right;
}
function feedbackIntervalsCross(left, right) {
  return left.left < right.left && right.left < left.right && left.right < right.right || right.left < left.left && left.left < right.right && right.right < left.right;
}
function createFeedbackAllocations(diagram, bounds, feedbackLaneY, laneGap, feedbackTopY) {
  if (diagram.direction !== "LR" && diagram.direction !== "RL")
    return new Map;
  const allocations = new Map;
  const sidedIntervals = { bottom: [], top: [] };
  const canonicalSides = new Map;
  const topLaneY = feedbackTopY ?? Math.min(...[...bounds.values()].map((bound) => bound.top)) - 3;
  const intervals = [];
  for (const transition of diagram.transitions) {
    const from = bounds.get(transition.from);
    const to = bounds.get(transition.to);
    if (!from || !to || transition.from === transition.to || !isStateHorizontalFeedback(diagram, from, to))
      continue;
    if (from.centerY !== to.centerY && !(from.centerY > to.centerY))
      continue;
    intervals.push({ transition, left: Math.min(from.centerX, to.centerX), right: Math.max(from.centerX, to.centerX) });
  }
  for (const interval of intervals) {
    const endpointKey = `${interval.transition.from}\x00${interval.transition.to}`;
    const side = canonicalSides.get(endpointKey) ?? ["bottom", "top"].find((candidate) => !sidedIntervals[candidate].some((existing) => feedbackIntervalsCross(existing, interval)));
    if (!side)
      continue;
    canonicalSides.set(endpointKey, side);
    interval.side = side;
    sidedIntervals[side].push(interval);
  }
  for (const side of ["bottom", "top"]) {
    const occupied = [];
    const intervalsByWidth = [...sidedIntervals[side]].sort((left, right) => left.right - left.left - (right.right - right.left));
    for (const interval of intervalsByWidth) {
      let lane = 0;
      while (occupied.some((existing) => existing.lane === lane && feedbackIntervalsOverlap(existing, interval)))
        lane++;
      const railY = side === "bottom" ? feedbackLaneY + lane * laneGap : topLaneY - lane * laneGap;
      occupied.push({ ...interval, side, lane, railY });
      allocations.set(interval.transition, { side, railY });
    }
  }
  return allocations;
}
function hasOpposingTopConnector(diagram, transition, bounds) {
  const from = bounds.get(transition.from);
  const to = bounds.get(transition.to);
  if (!from || !to || from.centerY === to.centerY)
    return false;
  const lowerId = from.centerY > to.centerY ? transition.from : transition.to;
  const lower = bounds.get(lowerId);
  const leavesLower = transition.from === lowerId;
  return diagram.transitions.some((other) => {
    if (other === transition || (leavesLower ? other.to !== lowerId : other.from !== lowerId))
      return false;
    const otherFrom = bounds.get(other.from);
    const otherTo = bounds.get(other.to);
    if (!otherFrom || !otherTo || Math.max(otherFrom.centerY, otherTo.centerY) !== lower.centerY)
      return false;
    if (other.from !== lowerId)
      return true;
    return !((diagram.direction === "LR" || diagram.direction === "RL") && isStateHorizontalFeedback(diagram, otherFrom, otherTo));
  });
}
function verticalCorridorCrossesUnrelatedState(diagram, transition, from, to, bounds) {
  const top = Math.min(from.top + from.height, to.top + to.height);
  const bottom = Math.max(from.top - 1, to.top - 1);
  return diagram.states.some((state) => {
    if (state.id === transition.from || state.id === transition.to || isHiddenCompositeMarker(state))
      return false;
    const bound = bounds.get(state.id);
    return Boolean(bound && from.centerX >= bound.left && from.centerX < bound.left + bound.width && top < bound.top + bound.height && bottom >= bound.top);
  });
}
function hasVerticalCorridor(from, to) {
  if (from.centerY < to.centerY)
    return from.top + from.height <= to.top - 1;
  return from.top - 1 >= to.top + to.height;
}
function horizontalCorridorCrossesUnrelatedState(diagram, transition, from, to, bounds) {
  const leftToRight = from.centerX <= to.centerX;
  const startX = leftToRight ? from.left + from.width : from.left - 1;
  const endX = leftToRight ? to.left - 1 : to.left + to.width;
  const space = SpatialIndex.empty().add(...diagram.states.flatMap((state) => {
    if (state.id === transition.from || state.id === transition.to || isHiddenCompositeMarker(state))
      return [];
    const bound = bounds.get(state.id);
    return bound ? [spatialRectClaim(`state:${state.id}`, `state:${state.id}`, "body", bound)] : [];
  }));
  const corridor = spatialPathClaim(`corridor:${transition.from}:${transition.to}`, `transition:${transition.from}:${transition.to}`, "route", [
    { x: startX, y: from.centerY },
    { x: endX, y: from.centerY }
  ]);
  return !space.isFree(corridor);
}
function bottomApproachX(diagram, transition, from, to, bounds, railY) {
  const targetX = to.width > 1 ? from.centerX > to.centerX ? to.left + 1 : to.left + to.width - 2 : to.centerX;
  const targetBottomY = to.top + to.height;
  const top = Math.min(targetBottomY, railY);
  const bottom = Math.max(targetBottomY, railY);
  const isClear = (x) => !diagram.states.some((state) => {
    if (state.id === transition.from || state.id === transition.to || isHiddenCompositeMarker(state))
      return false;
    const bound = bounds.get(state.id);
    return Boolean(bound && x >= bound.left && x < bound.left + bound.width && top < bound.top + bound.height && bottom >= bound.top);
  });
  if (isClear(targetX))
    return targetX;
  const maxX = Math.max(targetX, ...[...bounds.values()].map((bound) => bound.left + bound.width)) + 1;
  for (let distance = 1;distance <= maxX; distance++) {
    const right = targetX + distance;
    if (isClear(right))
      return right;
    const left = targetX - distance;
    if (left >= 0 && isClear(left))
      return left;
  }
  return targetX;
}
function sideParallelTargetApproach(diagram, transition, from, to, bounds, railX) {
  const space = SpatialIndex.empty().add(...diagram.states.flatMap((state) => {
    if (state.id === transition.from || state.id === transition.to || isHiddenCompositeMarker(state))
      return [];
    const bound = bounds.get(state.id);
    return bound ? [spatialRectClaim(`state:${state.id}`, `state:${state.id}`, "body", bound)] : [];
  }));
  const targetSideX = to.left + to.width;
  const claim = (points) => spatialPathClaim(`side-target:${transition.from}:${transition.to}`, "side-target", "route", points);
  if (space.isFree(claim([
    { x: railX, y: to.centerY },
    { x: targetSideX, y: to.centerY }
  ])))
    return;
  const targetX = innerConnectorX(to, from.centerX);
  const preferred = from.centerY > to.centerY ? "top" : "bottom";
  return [preferred, preferred === "top" ? "bottom" : "top"].find((side) => {
    const railY = side === "top" ? to.top - 2 : to.top + to.height + 1;
    const targetY = side === "top" ? to.top - 1 : to.top + to.height;
    return space.isFree(claim([
      { x: railX, y: railY },
      { x: targetX, y: railY },
      { x: targetX, y: targetY }
    ]));
  });
}
function containingCompositeIds(diagram, id) {
  const statesById = new Map(diagram.states.map((state) => [state.id, state]));
  const compositesById = new Map(diagram.composites.map((composite) => [composite.id, composite]));
  const ids = [];
  let parentId = statesById.get(id)?.parentId ?? compositesById.get(id)?.parentId;
  while (parentId) {
    ids.push(parentId);
    parentId = compositesById.get(parentId)?.parentId;
  }
  return ids;
}
function innermostCommonComposite(diagram, transition) {
  const target = new Set(containingCompositeIds(diagram, transition.to));
  return containingCompositeIds(diagram, transition.from).find((id) => target.has(id));
}
function createStateTransitionRoutePlans(diagram, bounds, feedbackLaneY, feedbackTopY) {
  const statesById = new Map(diagram.states.map((state) => [state.id, state]));
  const endpointOccurrences = new Map;
  const selfOccurrences = new Map;
  const parallelLaneGap = Math.max(3, ...diagram.transitions.map((transition) => measureStateTransitionLabel(transition.label).height + 2));
  let nextSideRailX = Math.max(0, ...[...bounds.values()].map((bound) => bound.left + bound.width)) + 3;
  const sideRailLanes = new Map;
  const feedbackAllocations = createFeedbackAllocations(diagram, bounds, feedbackLaneY, parallelLaneGap, feedbackTopY);
  let nextBottomRailY = Math.max(feedbackLaneY - parallelLaneGap, ...[...feedbackAllocations.values()].filter((allocation) => allocation.side === "bottom").map((allocation) => allocation.railY)) + parallelLaneGap;
  const allocateSideRail = (transition) => {
    const compositeId = innermostCommonComposite(diagram, transition);
    const composite = compositeId ? bounds.get(compositeId) : undefined;
    if (compositeId && composite) {
      const lane = sideRailLanes.get(compositeId) ?? 0;
      sideRailLanes.set(compositeId, lane + 1);
      const descendantRight = Math.max(composite.left + 1, ...diagram.states.flatMap((state) => {
        if (!containingCompositeIds(diagram, state.id).includes(compositeId))
          return [];
        const bound = bounds.get(state.id);
        return bound ? [bound.left + bound.width] : [];
      }));
      return Math.min(descendantRight + 2 + lane * 3, composite.left + composite.width - 2);
    }
    const railX = nextSideRailX;
    nextSideRailX += 3;
    return railX;
  };
  const allocateBottomRail = () => {
    const railY = nextBottomRailY;
    nextBottomRailY += parallelLaneGap;
    return railY;
  };
  return diagram.transitions.flatMap((transition) => {
    const from = bounds.get(transition.from);
    const to = bounds.get(transition.to);
    if (!from || !to)
      return [];
    const targetState = statesById.get(transition.to);
    const targetIsChoice = targetState?.kind === "choice";
    const targetIsHiddenMarker = isHiddenCompositeMarker(targetState);
    const base = { transition, from, to, targetIsChoice, targetIsHiddenMarker };
    const sideParallel = () => {
      const railX = allocateSideRail(transition);
      return {
        ...base,
        kind: "side-parallel",
        railX,
        targetApproach: sideParallelTargetApproach(diagram, transition, from, to, bounds, railX)
      };
    };
    if (transition.from === transition.to) {
      const lane = selfOccurrences.get(transition.from) ?? 0;
      selfOccurrences.set(transition.from, lane + 1);
      return [{ ...base, kind: "self", lane }];
    }
    const endpointKey = `${transition.from}\x00${transition.to}`;
    const parallelIndex = endpointOccurrences.get(endpointKey) ?? 0;
    endpointOccurrences.set(endpointKey, parallelIndex + 1);
    const feedback = (diagram.direction === "LR" || diagram.direction === "RL") && isStateHorizontalFeedback(diagram, from, to);
    const feedbackAllocation = feedbackAllocations.get(transition);
    if (feedbackAllocation) {
      if (feedbackAllocation.side === "bottom") {
        return [
          {
            ...base,
            kind: "bottom-feedback",
            railY: feedbackAllocation.railY,
            approachX: bottomApproachX(diagram, transition, from, to, bounds, feedbackAllocation.railY)
          }
        ];
      }
      return [
        {
          ...base,
          kind: "top-feedback",
          railY: feedbackAllocation.railY
        }
      ];
    }
    if (parallelIndex > 0) {
      if (from.centerY === to.centerY) {
        const railY = allocateBottomRail();
        return [
          {
            ...base,
            kind: "bottom-parallel",
            railY,
            approachX: bottomApproachX(diagram, transition, from, to, bounds, railY)
          }
        ];
      }
      return [sideParallel()];
    }
    if (diagram.direction !== "LR" && diagram.direction !== "RL") {
      const fromParent = statesById.get(transition.from)?.parentId;
      const toParent = statesById.get(transition.to)?.parentId;
      if (fromParent && toParent && fromParent !== toParent) {
        return [sideParallel()];
      }
      if (verticalCorridorCrossesUnrelatedState(diagram, transition, from, to, bounds)) {
        return [sideParallel()];
      }
      const verticalFeedback = diagram.direction === "BT" ? from.centerY < to.centerY : from.centerY > to.centerY;
      if (verticalFeedback) {
        return [sideParallel()];
      }
      if (from.centerY === to.centerY) {
        if (hasReverseTransition(diagram, transition) && from.centerX > to.centerX) {
          const railY = allocateBottomRail();
          return [
            {
              ...base,
              kind: "bottom-parallel",
              railY,
              approachX: bottomApproachX(diagram, transition, from, to, bounds, railY)
            }
          ];
        }
        return [{ ...base, kind: "horizontal-forward", leftToRight: from.centerX <= to.centerX }];
      }
      if (!hasVerticalCorridor(from, to)) {
        return [sideParallel()];
      }
      if (from.centerX !== to.centerX) {
        return [{ ...base, kind: "vertical-elbow", hasReverse: false, offsetConnector: false }];
      }
      return [{ ...base, kind: "vertical" }];
    }
    if (from.centerY !== to.centerY) {
      if (!hasVerticalCorridor(from, to)) {
        return [sideParallel()];
      }
      if (from.centerY > to.centerY && feedback)
        return [
          {
            ...base,
            kind: "bottom-feedback",
            railY: feedbackLaneY,
            approachX: bottomApproachX(diagram, transition, from, to, bounds, feedbackLaneY)
          }
        ];
      const hasReverse = hasReverseTransition(diagram, transition);
      return [
        {
          ...base,
          kind: "vertical-elbow",
          hasReverse,
          offsetConnector: hasReverse || hasOpposingTopConnector(diagram, transition, bounds)
        }
      ];
    }
    if (feedback)
      return [
        {
          ...base,
          kind: "bottom-feedback",
          railY: feedbackLaneY,
          approachX: bottomApproachX(diagram, transition, from, to, bounds, feedbackLaneY)
        }
      ];
    if (horizontalCorridorCrossesUnrelatedState(diagram, transition, from, to, bounds)) {
      const railY = allocateBottomRail();
      return [
        {
          ...base,
          kind: "bottom-parallel",
          railY,
          approachX: bottomApproachX(diagram, transition, from, to, bounds, railY)
        }
      ];
    }
    return [{ ...base, kind: "horizontal-forward", leftToRight: from.centerX <= to.centerX }];
  });
}
function addCell(builder, cell) {
  builder.cells.push(cell);
  builder.path.push([cell.x, cell.y]);
}
function addPathPoint(builder, x, y) {
  builder.path.push([x, y]);
}
function addLabel(builder, x, y, label) {
  const metrics = measureStateTransitionLabel(label);
  if (metrics.lines.length > 0)
    builder.label = { x, y, lines: metrics.lines };
}
function addHorizontalLine(builder, fromX, toX, y, direction) {
  for (let x = fromX;direction === 1 ? x <= toX : x >= toX; x += direction) {
    addCell(builder, { x, y, char: "\u2500" });
  }
}
function addVerticalLine(builder, x, fromY, toY, direction) {
  for (let y = fromY;direction === 1 ? y <= toY : y >= toY; y += direction) {
    addCell(builder, { x, y, char: "\u2502" });
  }
}
function addRightDeparture(builder, bounds) {
  if (bounds.width <= 1 || bounds.height <= 1)
    return;
  addCell(builder, {
    x: bounds.left + bounds.width - 1,
    y: bounds.centerY,
    char: BorderChars5.rounded.leftT
  });
}
function addLeftDeparture(builder, bounds) {
  if (bounds.width <= 1 || bounds.height <= 1)
    return;
  addCell(builder, { x: bounds.left, y: bounds.centerY, char: BorderChars5.rounded.rightT });
}
function addBottomDeparture(builder, bounds, x) {
  if (bounds.width <= 1 || bounds.height <= 1)
    return;
  addCell(builder, {
    x,
    y: bounds.top + bounds.height - 1,
    char: BorderChars5.rounded.topT
  });
}
function addTopDeparture(builder, bounds, x) {
  if (bounds.width <= 1 || bounds.height <= 1)
    return;
  addCell(builder, { x, y: bounds.top, char: BorderChars5.rounded.bottomT });
}
function addHorizontalForward(builder) {
  const { from, to, targetIsChoice, targetIsHiddenMarker, leftToRight, transition } = builder.route;
  const y = from.centerY;
  if (leftToRight)
    addRightDeparture(builder, from);
  else
    addLeftDeparture(builder, from);
  const step = leftToRight ? 1 : -1;
  const startX = leftToRight ? from.left + from.width : from.left - 1;
  const endX = leftToRight ? to.left - 1 : to.left + to.width;
  addHorizontalLine(builder, startX, endX - step, y, step);
  addCell(builder, targetIsHiddenMarker ? { x: endX, y, char: "\u2500" } : { x: endX, y, arrowDirection: leftToRight ? "right" : "left" });
  if (targetIsChoice || targetIsHiddenMarker)
    addPathPoint(builder, to.left, y);
  if (!transition.label)
    return;
  const metrics = measureStateTransitionLabel(transition.label);
  const labelX = Math.min(startX, endX) + Math.max(1, Math.floor((Math.abs(endX - startX) - metrics.width) / 2));
  addLabel(builder, labelX, Math.max(0, y - metrics.height), transition.label);
}
function addSelfTransition(builder) {
  const { from: bounds, transition, lane } = builder.route;
  if (bounds.width <= 1 || bounds.height <= 1) {
    const railX = bounds.left + 4 + lane * 4;
    const railY = bounds.top + 2 + lane * 2;
    addHorizontalLine(builder, bounds.left + 1, railX - 1, bounds.top, 1);
    addCell(builder, { x: railX, y: bounds.top, char: "\u256E" });
    addVerticalLine(builder, railX, bounds.top + 1, railY - 1, 1);
    addCell(builder, { x: railX, y: railY, char: "\u256F" });
    addHorizontalLine(builder, railX - 1, bounds.left + 1, railY, -1);
    addCell(builder, { x: bounds.left, y: railY, char: "\u2570" });
    for (let y = railY - 1;y > bounds.top + 1; y--)
      addCell(builder, { x: bounds.left, y, char: "\u2502" });
    addCell(builder, { x: bounds.left, y: bounds.top + 1, arrowDirection: "up" });
    addPathPoint(builder, bounds.left, bounds.top);
    if (transition.label)
      addLabel(builder, railX + 2, lane === 0 ? bounds.top + 1 : railY - 1, transition.label);
    return;
  }
  const sourceX = bounds.left + Math.max(2, Math.floor(bounds.width / 3));
  const bottomY = bounds.top + bounds.height - 1;
  const railY = bottomY + 2 + lane * 3;
  const targetX = Math.max(sourceX + 3, bounds.left + Math.min(bounds.width - 3, Math.ceil(bounds.width * 2 / 3))) + lane * 4;
  addBottomDeparture(builder, bounds, sourceX);
  addVerticalLine(builder, sourceX, bottomY + 1, railY - 1, 1);
  addCell(builder, { x: sourceX, y: railY, char: "\u2570" });
  for (let x = sourceX + 1;x < targetX; x++)
    addCell(builder, { x, y: railY, char: "\u2500" });
  addCell(builder, { x: targetX, y: railY, char: "\u256F" });
  for (let y = railY - 1;y > bottomY + 1; y--)
    addCell(builder, { x: targetX, y, char: "\u2502" });
  addCell(builder, { x: targetX, y: bottomY + 1, arrowDirection: "up" });
  if (transition.label)
    addLabel(builder, targetX + 2, lane === 0 ? bottomY + 1 : railY - 1, transition.label);
}
function outsideBottomY(bounds) {
  return bounds.top + bounds.height;
}
function outsideTopY(bounds) {
  return bounds.top - 1;
}
function addBottomLaneTransition(builder) {
  const { from, to, targetIsChoice, targetIsHiddenMarker, transition, railY, approachX } = builder.route;
  const sourceX = from.centerX;
  const targetX = to.width > 1 ? sourceX > to.centerX ? to.left + 1 : to.left + to.width - 2 : to.centerX;
  const targetRailCutsSource = targetX >= from.left && targetX <= from.left + from.width - 1;
  const railTargetX = targetRailCutsSource ? Math.max(from.left + from.width, to.left + to.width) + 2 : approachX;
  const sourceBottomY = outsideBottomY(from);
  const targetBottomY = outsideBottomY(to);
  addBottomDeparture(builder, from, sourceX);
  addVerticalLine(builder, sourceX, sourceBottomY, railY - 1, 1);
  addCell(builder, { x: sourceX, y: railY, char: sourceX > railTargetX ? "\u256F" : "\u2570" });
  if (sourceX !== railTargetX) {
    const horizontalStep = sourceX < railTargetX ? 1 : -1;
    for (let x = sourceX + horizontalStep;x !== railTargetX; x += horizontalStep) {
      addCell(builder, { x, y: railY, char: "\u2500" });
    }
  }
  addCell(builder, { x: railTargetX, y: railY, char: sourceX > railTargetX ? "\u2570" : "\u256F" });
  for (let y = railY - 1;y > targetBottomY; y--)
    addCell(builder, { x: railTargetX, y, char: "\u2502" });
  if (railTargetX !== targetX) {
    addCell(builder, { x: railTargetX, y: targetBottomY, char: railTargetX < targetX ? "\u256D" : "\u256E" });
    const horizontalStep = railTargetX < targetX ? 1 : -1;
    for (let x = railTargetX + horizontalStep;x !== targetX; x += horizontalStep) {
      addCell(builder, { x, y: targetBottomY, char: "\u2500" });
    }
  }
  addCell(builder, targetIsHiddenMarker ? { x: targetX, y: targetBottomY, char: "\u2502" } : { x: targetX, y: targetBottomY, arrowDirection: "up" });
  if (targetIsChoice || targetIsHiddenMarker)
    addPathPoint(builder, to.left, to.top);
  if (!transition.label)
    return;
  const metrics = measureStateTransitionLabel(transition.label);
  const horizontalRoom = Math.abs(sourceX - railTargetX) - 2;
  const labelX = metrics.width <= horizontalRoom ? Math.min(sourceX, railTargetX) + Math.max(1, Math.floor((Math.abs(sourceX - railTargetX) - metrics.width) / 2)) : railTargetX + 2;
  addLabel(builder, labelX, Math.max(0, railY - metrics.height), transition.label);
}
function addTopFeedbackTransition(builder) {
  const { from, to, targetIsChoice, targetIsHiddenMarker, transition, railY } = builder.route;
  const sourceX = from.centerX;
  const targetX = to.width > 1 ? sourceX > to.centerX ? to.left + to.width - 2 : to.left + 1 : to.centerX;
  const sourceTopY = outsideTopY(from);
  const targetTopY = outsideTopY(to);
  addTopDeparture(builder, from, sourceX);
  addVerticalLine(builder, sourceX, sourceTopY, railY + 1, -1);
  addCell(builder, { x: sourceX, y: railY, char: sourceX > targetX ? "\u256E" : "\u256D" });
  if (sourceX !== targetX) {
    const horizontalStep = sourceX < targetX ? 1 : -1;
    for (let x = sourceX + horizontalStep;x !== targetX; x += horizontalStep)
      addCell(builder, { x, y: railY, char: "\u2500" });
  }
  addCell(builder, { x: targetX, y: railY, char: sourceX > targetX ? "\u256D" : "\u256E" });
  for (let y = railY + 1;y < targetTopY; y++)
    addCell(builder, { x: targetX, y, char: "\u2502" });
  addCell(builder, targetIsHiddenMarker ? { x: targetX, y: targetTopY, char: "\u2502" } : { x: targetX, y: targetTopY, arrowDirection: "down" });
  if (targetIsChoice || targetIsHiddenMarker)
    addPathPoint(builder, to.left, to.top);
  if (!transition.label)
    return;
  const metrics = measureStateTransitionLabel(transition.label);
  const horizontalRoom = Math.abs(sourceX - targetX) - 2;
  const labelX = metrics.width <= horizontalRoom ? Math.min(sourceX, targetX) + Math.max(1, Math.floor((Math.abs(sourceX - targetX) - metrics.width) / 2)) : targetX + 2;
  addLabel(builder, labelX, railY - metrics.height, transition.label);
}
function addSideParallelTransition(builder) {
  const { from, to, targetIsChoice, targetIsHiddenMarker, transition, railX, targetApproach } = builder.route;
  const startX = from.left + from.width;
  const startY = from.centerY;
  const endY = targetApproach === "top" ? to.top - 2 : targetApproach === "bottom" ? to.top + to.height + 1 : to.centerY;
  const verticalStep = startY <= endY ? 1 : -1;
  addRightDeparture(builder, from);
  addHorizontalLine(builder, startX, railX - 1, startY, 1);
  addCell(builder, { x: railX, y: startY, char: verticalStep === 1 ? "\u256E" : "\u256F" });
  for (let y = startY + verticalStep;y !== endY; y += verticalStep)
    addCell(builder, { x: railX, y, char: "\u2502" });
  addCell(builder, { x: railX, y: endY, char: verticalStep === 1 ? "\u256F" : "\u256E" });
  if (targetApproach) {
    const targetX = innerConnectorX(to, from.centerX);
    for (let x = railX - 1;x > targetX; x--)
      addCell(builder, { x, y: endY, char: "\u2500" });
    addCell(builder, { x: targetX, y: endY, char: targetApproach === "top" ? "\u256D" : "\u2570" });
    addCell(builder, {
      x: targetX,
      y: targetApproach === "top" ? endY + 1 : endY - 1,
      arrowDirection: targetApproach === "top" ? "down" : "up"
    });
    if (targetIsChoice || targetIsHiddenMarker)
      addPathPoint(builder, to.left, to.top);
    if (transition.label) {
      const metrics = measureStateTransitionLabel(transition.label);
      addLabel(builder, railX + 2, Math.max(0, Math.floor((startY + to.centerY - metrics.height + 1) / 2)), transition.label);
    }
    return;
  }
  const endX = to.left + to.width;
  for (let x = railX - 1;x > endX; x--)
    addCell(builder, { x, y: endY, char: "\u2500" });
  addCell(builder, targetIsHiddenMarker ? { x: endX, y: endY, char: "\u2500" } : { x: endX, y: endY, arrowDirection: "left" });
  if (targetIsChoice || targetIsHiddenMarker)
    addPathPoint(builder, to.left, to.top);
  if (transition.label) {
    const metrics = measureStateTransitionLabel(transition.label);
    const labelY = Math.max(0, Math.floor((startY + endY - metrics.height + 1) / 2));
    addLabel(builder, railX + 2, labelY, transition.label);
  }
}
function innerConnectorX(bounds, preferredX) {
  if (bounds.width <= 2)
    return bounds.centerX;
  return Math.max(bounds.left + 1, Math.min(bounds.left + bounds.width - 2, preferredX));
}
function addVerticalElbowTransition(builder) {
  const { from, to, transition, targetIsChoice, targetIsHiddenMarker, hasReverse, offsetConnector } = builder.route;
  const topToBottom = from.centerY < to.centerY;
  const offset = offsetConnector ? topToBottom ? -2 : 2 : 0;
  const startX = innerConnectorX(from, from.centerX + offset);
  const endX = innerConnectorX(to, to.centerX + offset);
  const startY = topToBottom ? from.top + from.height : from.top - 1;
  const endY = topToBottom ? to.top - 1 : to.top + to.height;
  const verticalStep = topToBottom ? 1 : -1;
  if (topToBottom)
    addBottomDeparture(builder, from, startX);
  else
    addTopDeparture(builder, from, startX);
  const availableApproach = Math.max(0, Math.abs(endY - startY) - 1);
  const bendY = startX === endX ? endY : topToBottom ? endY - verticalStep * Math.min(2, availableApproach) : startY;
  const targetApproachLength = Math.abs(endY - bendY);
  const hasTargetApproach = targetApproachLength > 0;
  if (startY !== bendY)
    addVerticalLine(builder, startX, startY, bendY - verticalStep, verticalStep);
  if (startX !== endX) {
    const horizontalStep = startX < endX ? 1 : -1;
    addCell(builder, {
      x: startX,
      y: bendY,
      char: topToBottom ? startX < endX ? "\u2570" : "\u256F" : startX < endX ? "\u256D" : "\u256E"
    });
    for (let x = startX + horizontalStep;x !== endX; x += horizontalStep)
      addCell(builder, { x, y: bendY, char: "\u2500" });
    if (hasTargetApproach) {
      addCell(builder, {
        x: endX,
        y: bendY,
        char: topToBottom ? startX < endX ? "\u256E" : "\u256D" : startX < endX ? "\u256F" : "\u2570"
      });
      for (let distance = 1;distance < targetApproachLength; distance++) {
        addCell(builder, { x: endX, y: bendY + verticalStep * distance, char: "\u2502" });
      }
    }
  }
  const targetChar = targetIsHiddenMarker ? hasTargetApproach || startX === endX ? "\u2502" : topToBottom ? "\u252C" : "\u2534" : undefined;
  addCell(builder, {
    x: endX,
    y: endY,
    ...targetChar ? { char: targetChar } : { arrowDirection: topToBottom ? "down" : "up" }
  });
  if (targetIsChoice || targetIsHiddenMarker)
    addPathPoint(builder, to.left, to.top);
  if (!transition.label)
    return;
  const metrics = measureStateTransitionLabel(transition.label);
  if (topToBottom) {
    const leftLabelX = startX - metrics.width - 2;
    const labelX = from.width === 1 && Math.abs(endX - startX) >= metrics.width + 2 ? Math.min(startX, endX) + Math.floor((Math.abs(endX - startX) - metrics.width) / 2) : hasReverse || endX < startX ? leftLabelX >= 0 ? leftLabelX : startX + 4 : startX + 2;
    addLabel(builder, labelX, hasTargetApproach ? Math.max(0, bendY - metrics.height) : Math.min(startY + 1, endY), transition.label);
  } else {
    const labelX = Math.min(startX, endX) + Math.max(1, Math.floor((Math.abs(endX - startX) - metrics.width) / 2));
    addLabel(builder, startX === endX ? startX + 3 : labelX, hasTargetApproach ? Math.max(0, bendY - metrics.height) : Math.max(0, startY), transition.label);
  }
}
function addVerticalTransition(builder) {
  const { from, to, transition, targetIsChoice, targetIsHiddenMarker } = builder.route;
  const topToBottom = from.centerY <= to.centerY;
  const x = from.centerX;
  const startY = topToBottom ? from.top + from.height : from.top - 1;
  const endY = topToBottom ? to.top - 1 : to.top + to.height;
  const step = topToBottom ? 1 : -1;
  if (topToBottom)
    addBottomDeparture(builder, from, x);
  else
    addTopDeparture(builder, from, x);
  if (startY !== endY)
    addVerticalLine(builder, x, startY, endY - step, step);
  addCell(builder, {
    x,
    y: endY,
    ...targetIsHiddenMarker ? { char: "\u2502" } : { arrowDirection: topToBottom ? "down" : "up" }
  });
  if (targetIsChoice || targetIsHiddenMarker)
    addPathPoint(builder, to.left, to.top);
  if (transition.label)
    addLabel(builder, x + 2, Math.min(startY, endY) + 1, transition.label);
}
function createStateTransitionRenderPlan(route) {
  const builder = { route, cells: [], path: [] };
  switch (route.kind) {
    case "self":
      addSelfTransition(builder);
      break;
    case "horizontal-forward":
      addHorizontalForward(builder);
      break;
    case "bottom-feedback":
    case "bottom-parallel":
      addBottomLaneTransition(builder);
      break;
    case "top-feedback":
      addTopFeedbackTransition(builder);
      break;
    case "vertical-elbow":
      addVerticalElbowTransition(builder);
      break;
    case "vertical":
      addVerticalTransition(builder);
      break;
    case "side-parallel":
      addSideParallelTransition(builder);
      break;
  }
  return builder;
}
function pointIsInsideBounds(point, bounds) {
  return point[0] >= bounds.left && point[0] < bounds.left + bounds.width && point[1] >= bounds.top && point[1] < bounds.top + bounds.height;
}
function routeIntersectsUnrelatedState(plan, diagram, bounds, noteBounds) {
  if (diagram.states.some((state) => {
    if (state.id === plan.route.transition.from || state.id === plan.route.transition.to || isHiddenCompositeMarker(state))
      return false;
    const bound = bounds.get(state.id);
    return Boolean(bound && plan.path.some((point) => pointIsInsideBounds(point, bound)));
  }))
    return true;
  return noteBounds.some((noteBound) => {
    if (plan.path.some((point) => pointIsInsideBounds(point, noteBound)))
      return true;
    const target = bounds.get(noteBound.note.target);
    if (!target)
      return false;
    const connector = spatialPathClaim(`note-connector:${noteBound.id}`, `note-connector:${noteBound.id}`, "boundary", stateDiagramNoteConnector(noteBound, target).points);
    return plan.path.some(([x, y]) => connector.spans.some((span) => span.y === y && x >= span.fromX && x <= span.toX));
  });
}
function findBodySafePath(start, end, diagram, bounds, plan, search, budget) {
  const margin = Math.max(8, bounds.size * 2);
  const compositeId = innermostCommonComposite(diagram, plan.route.transition);
  const composite = compositeId ? bounds.get(compositeId) : undefined;
  const searchBounds = {
    minX: composite ? composite.left + 1 : search.minX - margin,
    minY: composite ? composite.top + 1 : Math.min(search.minY, ...plan.path.map((point) => point[1])) - margin,
    maxX: composite ? composite.left + composite.width - 2 : Math.max(search.maxX, ...plan.path.map((point) => point[0])) + margin,
    maxY: composite ? composite.top + composite.height - 2 : Math.max(search.maxY, ...plan.path.map((point) => point[1])) + margin
  };
  const isFree = ([x, y]) => x >= searchBounds.minX && x <= searchBounds.maxX && y >= searchBounds.minY && y <= searchBounds.maxY && !search.blocked.has(`${x}:${y}`);
  const pathMinX = Math.min(...plan.path.map((point) => point[0]));
  const pathMinY = Math.min(...plan.path.map((point) => point[1]));
  const pathMaxX = Math.max(...plan.path.map((point) => point[0]));
  const pathMaxY = Math.max(...plan.path.map((point) => point[1]));
  const directCandidates = [
    [start, [start[0], end[1]], end],
    [start, [end[0], start[1]], end],
    ...Array.from({ length: 4 }, (_, index) => index + 1).flatMap((offset) => [
      [start, [start[0], pathMinY - offset], [end[0], pathMinY - offset], end],
      [start, [start[0], pathMaxY + offset], [end[0], pathMaxY + offset], end],
      [start, [pathMinX - offset, start[1]], [pathMinX - offset, end[1]], end],
      [start, [pathMaxX + offset, start[1]], [pathMaxX + offset, end[1]], end]
    ])
  ];
  const direct = directCandidates.map((points) => orthogonalPathPoints(points.map(([x, y]) => ({ x, y }))).map(({ x, y }) => [x, y])).filter((points) => points.every(isFree)).sort((left, right) => left.length - right.length)[0];
  if (direct)
    return direct;
  const path = findStateManhattanPath([{ x: start[0], y: start[1] }], { x: end[0], y: end[1] }, search, searchBounds, budget);
  return path?.map((point) => [point.x, point.y]);
}
function bodySafeTransitionPlan(plan, diagram, bounds, noteBounds, search, budget, forceRepair = false) {
  if (!forceRepair && !routeIntersectsUnrelatedState(plan, diagram, bounds, noteBounds))
    return plan;
  const sourceOutsideIndex = plan.path.findIndex((point) => !pointIsInsideBounds(point, plan.route.from));
  const targetOutsideIndex = plan.path.findLastIndex((point) => !pointIsInsideBounds(point, plan.route.to));
  if (sourceOutsideIndex < 0 || targetOutsideIndex < sourceOutsideIndex)
    return plan;
  const safePath = findBodySafePath(plan.path[sourceOutsideIndex], plan.path[targetOutsideIndex], diagram, bounds, plan, search, budget);
  if (!safePath)
    return alternateBodySafeTransitionPlan(plan, diagram, bounds, noteBounds, search, budget);
  const prefix = plan.path.slice(0, sourceOutsideIndex);
  const suffix = plan.path.slice(targetOutsideIndex + 1);
  const repaired = renderBodySafeTransitionPlan(plan, safePath, prefix, suffix);
  if (safePath.length <= plan.path.length + 4)
    return repaired;
  const alternate = alternateBodySafeTransitionPlan(plan, diagram, bounds, noteBounds, search, budget);
  return alternate !== plan && alternate.path.length < repaired.path.length ? alternate : repaired;
}
function alternateBodySafeTransitionPlan(plan, diagram, bounds, noteBounds, search, budget) {
  const candidates = [];
  for (const source of stateRoutePorts(plan.route.from)) {
    for (const target of stateRoutePorts(plan.route.to)) {
      const safePath = findBodySafePath(source.outside, target.outside, diagram, bounds, plan, search, budget);
      if (!safePath)
        continue;
      const prefix = plan.route.from.width > 1 && plan.route.from.height > 1 ? [source.border] : [];
      const suffix = plan.route.targetIsChoice || plan.route.targetIsHiddenMarker ? [[plan.route.to.left, plan.route.to.top]] : [];
      const repaired = renderBodySafeTransitionPlan(plan, safePath, prefix, suffix, source.char);
      if (!routeIntersectsUnrelatedState(repaired, diagram, bounds, noteBounds))
        candidates.push(repaired);
    }
  }
  return candidates.sort((left, right) => left.path.length - right.path.length)[0] ?? plan;
}
function stateRoutePorts(bounds) {
  return [
    {
      outside: [bounds.centerX, bounds.top - 1],
      border: [bounds.centerX, bounds.top],
      char: BorderChars5.rounded.bottomT
    },
    {
      outside: [bounds.centerX, bounds.top + bounds.height],
      border: [bounds.centerX, bounds.top + bounds.height - 1],
      char: BorderChars5.rounded.topT
    },
    {
      outside: [bounds.left - 1, bounds.centerY],
      border: [bounds.left, bounds.centerY],
      char: BorderChars5.rounded.rightT
    },
    {
      outside: [bounds.left + bounds.width, bounds.centerY],
      border: [bounds.left + bounds.width - 1, bounds.centerY],
      char: BorderChars5.rounded.leftT
    }
  ].filter((port) => port.outside[0] >= 0);
}
function renderBodySafeTransitionPlan(plan, safePath, prefix, suffix, sourceChar) {
  const prefixKeys = new Set(prefix.map(([x, y]) => `${x}:${y}`));
  const cells = sourceChar ? prefix.map(([x, y]) => ({ x, y, char: sourceChar })) : plan.cells.filter((cell) => prefixKeys.has(`${cell.x}:${cell.y}`));
  const fullPath = [...prefix, ...safePath, ...suffix];
  const previous = prefix.at(-1);
  for (const [index, point] of safePath.entries()) {
    if (index === safePath.length - 1) {
      const targetDirection = connectionDirection(point, [plan.route.to.centerX, plan.route.to.centerY]);
      cells.push(plan.route.targetIsHiddenMarker ? { x: point[0], y: point[1], char: targetDirection === "left" || targetDirection === "right" ? "\u2500" : "\u2502" } : { x: point[0], y: point[1], arrowDirection: targetDirection });
      continue;
    }
    const before = index === 0 ? previous : safePath[index - 1];
    const after = safePath[index + 1];
    const connections = new Set;
    if (before)
      connections.add(connectionDirection(point, before));
    connections.add(connectionDirection(point, after));
    cells.push({ x: point[0], y: point[1], char: diagramLineGlyph(connections, "rounded") });
  }
  return { ...plan, cells, path: fullPath, pathRepaired: true };
}
function labelDistanceToPath(x, y, width, height, path) {
  return Math.min(...path.map(([pathX, pathY]) => {
    const dx = pathX < x ? x - pathX : pathX >= x + width ? pathX - (x + width - 1) : 0;
    const dy = pathY < y ? y - pathY : pathY >= y + height ? pathY - (y + height - 1) : 0;
    return dx + dy;
  }));
}
function stateTransitionLabelCandidates(plan, width, height) {
  const candidates = new Map;
  const add = (x, y) => candidates.set(`${x}:${y}`, { x, y });
  if (plan.label && (!plan.pathRepaired || labelDistanceToPath(plan.label.x, plan.label.y, width, height, plan.path) <= 4)) {
    add(plan.label.x, plan.label.y);
  }
  for (const [x, y] of plan.path) {
    add(x + 2, y - Math.floor(height / 2));
    add(x - width - 2, y - Math.floor(height / 2));
    add(x - Math.floor(width / 2), y - height - 1);
    add(x - Math.floor(width / 2), y + 2);
  }
  const preferred = plan.label ?? { x: plan.path[0]?.[0] ?? 0, y: plan.path[0]?.[1] ?? 0 };
  return [...candidates.values()].sort((left, right) => {
    const leftDistance = Math.abs(left.x - preferred.x) + Math.abs(left.y - preferred.y);
    const rightDistance = Math.abs(right.x - preferred.x) + Math.abs(right.y - preferred.y);
    return leftDistance - rightDistance;
  });
}
function placeStateTransitionLabels(plans, diagram, bounds, noteBounds) {
  let space = SpatialIndex.empty().add(...diagram.states.flatMap((state) => {
    const bound = bounds.get(state.id);
    return bound && !isHiddenCompositeMarker(state) ? [spatialRectClaim(`state:${state.id}`, `state:${state.id}`, "body", bound)] : [];
  }), ...plans.map((plan, index) => spatialPathClaim(`route:${index}`, `route:${index}`, "route", plan.path.map(([x, y]) => ({ x, y })))), ...diagram.composites.flatMap((composite) => {
    const bound = bounds.get(composite.id);
    if (!bound)
      return [];
    return [
      spatialPathClaim(`composite:${composite.id}`, `composite:${composite.id}`, "boundary", [
        { x: bound.left, y: bound.top },
        { x: bound.left + bound.width - 1, y: bound.top },
        { x: bound.left + bound.width - 1, y: bound.top + bound.height - 1 },
        { x: bound.left, y: bound.top + bound.height - 1 },
        { x: bound.left, y: bound.top }
      ])
    ];
  }), ...noteBounds.flatMap((noteBound) => {
    const target = bounds.get(noteBound.note.target);
    return [
      spatialRectClaim(`note:${noteBound.id}`, `note:${noteBound.id}`, "body", noteBound),
      ...target ? [
        spatialPathClaim(`note-connector:${noteBound.id}`, `note-connector:${noteBound.id}`, "boundary", stateDiagramNoteConnector(noteBound, target).points)
      ] : []
    ];
  }));
  const placed = new Map;
  const endpointCounts = new Map;
  for (const plan of plans) {
    const key = `${plan.route.transition.from}\x00${plan.route.transition.to}`;
    endpointCounts.set(key, (endpointCounts.get(key) ?? 0) + 1);
  }
  const placementOrder = [...plans.keys()].sort((left, right) => Number(Boolean(plans[left].pathRepaired)) - Number(Boolean(plans[right].pathRepaired)));
  for (const planIndex of placementOrder) {
    const plan = plans[planIndex];
    if (!plan.label) {
      placed.set(planIndex, plan);
      continue;
    }
    const width = Math.max(...plan.label.lines.map(diagramTextWidth));
    const endpointKey = `${plan.route.transition.from}\x00${plan.route.transition.to}`;
    const needsLaneClearance = (endpointCounts.get(endpointKey) ?? 0) > 1;
    const statePadding = needsLaneClearance || plan.label.lines.length > 1 ? 1 : 0;
    const labelClaim = (x, y) => spatialRectClaim(`label:${planIndex}`, `label:${planIndex}`, "label", {
      left: x,
      top: y,
      width,
      height: plan.label.lines.length
    });
    const sharesLoopCorridor = plans.some((candidate) => candidate.route.transition.from === plan.route.transition.from && candidate.route.kind === (plan.route.kind === "self" ? "vertical" : "self"));
    const corridorTop = plan.route.kind === "side-parallel" && plans.some((candidate) => candidate !== plan && candidate.route.transition.to === plan.route.transition.to) ? Math.min(...plan.path.map(([, y]) => y)) : sharesLoopCorridor && (plan.route.kind === "self" || plan.route.kind === "vertical" && plan.route.from.centerY < plan.route.to.centerY) ? plan.route.from.top + plan.route.from.height : undefined;
    const corridorBottom = corridorTop === undefined ? undefined : Math.max(...plan.path.map(([, y]) => y));
    const isClear = (x, y) => {
      if (x < 0 || y < 0 || corridorTop !== undefined && (y < corridorTop || y > corridorBottom))
        return false;
      return space.isFree(labelClaim(x, y), {
        clearance: {
          body: statePadding,
          label: { x: 1, y: 1 },
          route: plan.pathRepaired || plan.route.kind === "side-parallel" || needsLaneClearance || corridorTop !== undefined ? {
            x: 1,
            y: 0
          } : 0
        }
      });
    };
    const candidates = stateTransitionLabelCandidates(plan, width, plan.label.lines.length);
    const nearby = candidates.find((candidate) => (!(plan.pathRepaired || plan.route.kind === "side-parallel" || needsLaneClearance || corridorTop !== undefined) || labelDistanceToPath(candidate.x, candidate.y, width, plan.label.lines.length, plan.path) >= 2) && isClear(candidate.x, candidate.y));
    let x = nearby?.x ?? candidates[0]?.x ?? plan.label.x;
    let y = nearby?.y ?? candidates[0]?.y ?? plan.label.y;
    if (!nearby) {
      search:
        for (let distance = 1;distance < 500; distance++) {
          for (let dx = -distance;dx <= distance; dx++) {
            const dy = distance - Math.abs(dx);
            for (const candidateY of dy === 0 ? [y] : [y - dy, y + dy]) {
              const candidateX = x + dx;
              if (!isClear(candidateX, candidateY))
                continue;
              const pathDistance = labelDistanceToPath(candidateX, candidateY, width, plan.label.lines.length, plan.path);
              if (pathDistance < 2 || pathDistance > 8)
                continue;
              x = candidateX;
              y = candidateY;
              break search;
            }
          }
        }
    }
    if (!isClear(x, y)) {
      fallback:
        for (let distance = 1;distance < 500; distance++) {
          for (let dx = -distance;dx <= distance; dx++) {
            const dy = distance - Math.abs(dx);
            for (const candidateY of dy === 0 ? [y] : [y - dy, y + dy]) {
              const candidateX = x + dx;
              if (!isClear(candidateX, candidateY))
                continue;
              x = candidateX;
              y = candidateY;
              break fallback;
            }
          }
        }
    }
    if (!isClear(x, y))
      throw new Error(`Transition ${endpointKey} has no clear label position`);
    space = space.add(labelClaim(x, y));
    placed.set(planIndex, { ...plan, label: { ...plan.label, x, y } });
  }
  return plans.map((plan, index) => placed.get(index) ?? plan);
}
function createStateTransitionRenderPlans(diagram, bounds, feedbackLaneY, options = {}) {
  const noteBounds = options.noteBounds ?? [];
  const budget = options.searchBudget ?? createStateSearchBudget();
  const plans = createStateTransitionRoutePlans(diagram, bounds, feedbackLaneY, options.feedbackTopY).map(createStateTransitionRenderPlan);
  if (options.repairRoutes === false)
    return placeStateTransitionLabels(plans, diagram, bounds, noteBounds);
  const baseObstacles = transitionObstacles(diagram, bounds, noteBounds);
  const repaired = [];
  for (const [index, plan] of plans.entries()) {
    const disjoint = repaired.filter((previous) => transitionsHaveDisjointEndpoints(previous, plan));
    const routeObstacles = repaired.filter((previous) => disjoint.includes(previous) || transitionsAreReciprocal(previous, plan));
    const routeSpace = createStateSearchSpace(baseObstacles.add(...routeObstacles.map((previous, previousIndex) => spatialPathClaim(`transition:${index}:obstacle:${previousIndex}`, `transition:${index}:obstacle:${previousIndex}`, "route", previous.path.map(([x, y]) => ({ x, y }))))));
    repaired.push(bodySafeTransitionPlan(plan, diagram, bounds, noteBounds, routeSpace, budget, disjoint.some((previous) => pathsIntersect2(previous.path, plan.path))));
  }
  return placeStateTransitionLabels(repaired, diagram, bounds, noteBounds);
}
function transitionsHaveDisjointEndpoints(left, right) {
  const leftEndpoints = new Set([left.route.transition.from, left.route.transition.to]);
  return !leftEndpoints.has(right.route.transition.from) && !leftEndpoints.has(right.route.transition.to);
}
function transitionsAreReciprocal(left, right) {
  return left.route.transition.from === right.route.transition.to && left.route.transition.to === right.route.transition.from;
}
function pathsIntersect2(left, right) {
  const occupied = new Set(left.map(([x, y]) => `${x}:${y}`));
  return right.some(([x, y]) => occupied.has(`${x}:${y}`));
}
function transitionObstacles(diagram, bounds, noteBounds) {
  return SpatialIndex.empty().add(...diagram.states.flatMap((state) => {
    const bound = bounds.get(state.id);
    return bound && !isHiddenCompositeMarker(state) ? [spatialRectClaim(`state:${state.id}`, `state:${state.id}`, "body", bound)] : [];
  }), ...noteBounds.flatMap((noteBound) => {
    const target = bounds.get(noteBound.note.target);
    return [
      spatialRectClaim(`note:${noteBound.id}`, `note:${noteBound.id}`, "body", noteBound),
      ...target ? [
        spatialPathClaim(`note-connector:${noteBound.id}`, `note-connector:${noteBound.id}`, "boundary", stateDiagramNoteConnector(noteBound, target).points)
      ] : []
    ];
  }));
}
function connectionDirection(from, to) {
  const deltaX = to[0] - from[0];
  const deltaY = to[1] - from[1];
  if (Math.abs(deltaX) >= Math.abs(deltaY) && deltaX !== 0)
    return deltaX > 0 ? "right" : "left";
  if (deltaY !== 0)
    return deltaY > 0 ? "down" : "up";
  return "right";
}
function createStateTransitionJunctionPlans(diagram, bounds, renderPlans) {
  const renderPlanByTransition = new Map(renderPlans.map((plan) => [plan.route.transition, plan]));
  return diagram.states.flatMap((state) => {
    const kind = state.kind === "choice" || state.kind === "fork" || state.kind === "join" ? state.kind : isHiddenCompositeMarker(state) ? "hidden-composite-marker" : undefined;
    if (!kind)
      return [];
    const stateBounds = bounds.get(state.id);
    if (!stateBounds)
      return [];
    const connections = new Set;
    const transitions = [];
    for (const transition of diagram.transitions) {
      const renderPlan = renderPlanByTransition.get(transition);
      let connected = false;
      if (transition.to === state.id) {
        const junction = renderPlan?.path.at(-1);
        const neighbor = renderPlan?.path.at(-2);
        if (junction && neighbor)
          connections.add(connectionDirection(junction, neighbor));
        connected = true;
      }
      if (transition.from === state.id) {
        const neighbor = renderPlan?.path[0];
        if (neighbor)
          connections.add(connectionDirection([stateBounds.left, stateBounds.top], neighbor));
        connected = true;
      }
      if (connected)
        transitions.push(transition);
    }
    return [{ state, bounds: stateBounds, connections, transitions, kind }];
  });
}

// node_modules/opentui-markdown-render/src/merman/state/layout.ts
var MAX_STRICT_NOTE_PLACEMENTS = 24;
function computeRanks2(diagram) {
  const ranks = new Map;
  const outgoing = new Map;
  for (const transition of diagram.transitions) {
    const list = outgoing.get(transition.from) ?? [];
    list.push(transition.to);
    outgoing.set(transition.from, list);
  }
  const first = diagram.states.find((state) => state.kind === "start")?.id ?? diagram.states[0]?.id;
  if (!first)
    return ranks;
  ranks.set(first, 0);
  const queue = [first];
  while (queue.length > 0) {
    const id = queue.shift();
    const rank = ranks.get(id) ?? 0;
    for (const to of outgoing.get(id) ?? []) {
      const nextRank = rank + 1;
      if ((ranks.get(to) ?? Number.POSITIVE_INFINITY) <= nextRank)
        continue;
      ranks.set(to, nextRank);
      queue.push(to);
    }
  }
  for (const state of diagram.states) {
    if (!ranks.has(state.id))
      ranks.set(state.id, ranks.size);
  }
  return ranks;
}
function outgoingTransitions(diagram) {
  const outgoing = new Map;
  for (const transition of diagram.transitions) {
    const list = outgoing.get(transition.from) ?? [];
    list.push(transition);
    outgoing.set(transition.from, list);
  }
  return outgoing;
}
function reaches(outgoing, from, target) {
  const visited = new Set;
  const stack = [from];
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === target)
      return true;
    if (visited.has(id))
      continue;
    visited.add(id);
    for (const transition of outgoing.get(id) ?? [])
      stack.push(transition.to);
  }
  return false;
}
function computeMainPath(diagram) {
  const outgoing = outgoingTransitions(diagram);
  const statesById = new Map(diagram.states.map((state) => [state.id, state]));
  const start = diagram.states.find((state) => state.kind === "start")?.id ?? diagram.states[0]?.id;
  if (!start)
    return [];
  const path = [start];
  const visited = new Set(path);
  let current = start;
  while (true) {
    const candidates = (outgoing.get(current) ?? []).filter((transition) => !visited.has(transition.to));
    if (candidates.length === 0)
      break;
    const next = candidates.find((transition) => statesById.get(transition.to)?.kind === "end") ?? candidates.find((transition) => !reaches(outgoing, transition.to, current)) ?? candidates.find((transition) => !hasReverseTransition(diagram, transition)) ?? candidates.find((transition) => {
      const fromParent = statesById.get(current)?.parentId;
      const toParent = statesById.get(transition.to)?.parentId;
      return Boolean(fromParent && toParent && fromParent !== toParent);
    }) ?? (candidates.length === 1 ? candidates[0] : undefined);
    if (!next)
      break;
    path.push(next.to);
    visited.add(next.to);
    current = next.to;
  }
  return path;
}
function stateSize(state) {
  if (state.kind !== "state")
    return { width: 1, height: 1, lines: [state.label] };
  return measureDiagramTextBox(state.label, { paddingX: 2, paddingY: 1 });
}
function noteLines(note) {
  const lines = note.lines.flatMap(splitDiagramLines).map((line) => line.trim());
  return lines.length > 0 ? lines : [""];
}
function noteSize(note) {
  const lines = noteLines(note);
  const innerWidth = Math.max(...lines.map(diagramTextWidth), 1);
  return { width: innerWidth + 4, height: lines.length + 2, lines };
}
function emptyLayout(bounds, sizes) {
  return { bounds, sizes, compositeBounds: new Map, noteBounds: [] };
}
function isNoteBound(bound) {
  return "note" in bound;
}
function shiftBounds(bounds, dx, dy) {
  for (const bound of bounds) {
    translateDiagramBounds(bound, dx, dy);
    if (!isNoteBound(bound) || !bound.connector)
      continue;
    bound.connector = {
      connectorY: bound.connector.connectorY + dy,
      points: bound.connector.points.map((point) => ({ x: point.x + dx, y: point.y + dy }))
    };
  }
}
function translateStateDiagramLayout(layout, dx, dy) {
  shiftBounds(uniqueBounds(layout.bounds.values(), layout.compositeBounds.values(), layout.noteBounds), dx, dy);
}
function uniqueBounds(...bounds) {
  return [...new Set(bounds.flatMap((group) => [...group]))];
}
function normalizeLayout(layout) {
  const allBounds = uniqueBounds(layout.bounds.values(), layout.compositeBounds.values(), layout.noteBounds);
  if (allBounds.length === 0)
    return;
  const connectorPoints = layout.noteBounds.flatMap((bound) => bound.connector?.points ?? []);
  const minX = Math.min(0, ...allBounds.map((bound) => bound.left), ...connectorPoints.map((point) => point.x));
  const minY = Math.min(0, ...allBounds.map((bound) => bound.top), ...connectorPoints.map((point) => point.y));
  if (minX === 0 && minY === 0)
    return;
  shiftBounds(allBounds, -minX, -minY);
}
function addCompositeBounds(diagram, layout) {
  const statesByParent = new Map;
  const compositesByParent = new Map;
  for (const state of diagram.states) {
    if (!state.parentId)
      continue;
    const states = statesByParent.get(state.parentId) ?? [];
    states.push(state.id);
    statesByParent.set(state.parentId, states);
  }
  for (const composite of diagram.composites) {
    if (!composite.parentId)
      continue;
    const composites = compositesByParent.get(composite.parentId) ?? [];
    composites.push(composite);
    compositesByParent.set(composite.parentId, composites);
  }
  const addComposite = (composite) => {
    const existing = layout.compositeBounds.get(composite.id);
    if (existing)
      return existing;
    for (const child of compositesByParent.get(composite.id) ?? [])
      addComposite(child);
    const childBounds = [
      ...statesByParent.get(composite.id) ?? [],
      ...(compositesByParent.get(composite.id) ?? []).map((child) => child.id)
    ].map((id) => layout.bounds.get(id)).filter((bound) => Boolean(bound));
    if (childBounds.length === 0)
      return;
    const left = Math.min(...childBounds.map((bound) => bound.left)) - 2;
    const top = Math.min(...childBounds.map((bound) => bound.top)) - 2;
    const right = Math.max(...childBounds.map((bound) => bound.left + bound.width)) + 2;
    const bottom = Math.max(...childBounds.map((bound) => bound.top + bound.height)) + 2;
    const width = Math.max(right - left, diagramTextWidth(composite.label) + 5);
    const bound = {
      id: composite.id,
      left,
      top,
      width,
      height: bottom - top,
      centerX: left + Math.floor(width / 2),
      centerY: top + Math.floor((bottom - top) / 2)
    };
    layout.compositeBounds.set(composite.id, bound);
    layout.bounds.set(composite.id, bound);
    return bound;
  };
  for (const composite of diagram.composites)
    addComposite(composite);
}
function intersects(left, top, width, height, bound, padding = 1) {
  return left < bound.left + bound.width + padding && left + width + padding > bound.left && top < bound.top + bound.height + padding && top + height + padding > bound.top;
}
function createNoteBound(note, index, left, top, size) {
  return {
    id: `${note.target}-note-${index}`,
    left,
    top,
    width: size.width,
    height: size.height,
    centerX: left + Math.floor(size.width / 2),
    centerY: top + Math.floor(size.height / 2),
    note,
    lines: size.lines
  };
}
function findNoteConnector(search, bounds, target, budget) {
  const connectorY = Math.max(bounds.top + 1, Math.min(target.centerY, bounds.top + bounds.height - 2));
  const end = {
    x: bounds.note.position === "right" ? bounds.left - 1 : bounds.left + bounds.width,
    y: connectorY
  };
  const goal = { x: end.x + (bounds.note.position === "right" ? -1 : 1), y: end.y };
  const targetX = bounds.note.position === "right" ? target.left + target.width : target.left - 1;
  const preferredStarts = [
    { x: targetX, y: target.centerY },
    { x: targetX, y: target.top - 1 },
    { x: targetX, y: target.top + target.height }
  ];
  const perimeterStarts = [
    ...Array.from({ length: target.height }, (_, offset) => ({ x: target.left - 1, y: target.top + offset })),
    ...Array.from({ length: target.height }, (_, offset) => ({
      x: target.left + target.width,
      y: target.top + offset
    })),
    ...Array.from({ length: target.width }, (_, offset) => ({ x: target.left + offset, y: target.top - 1 })),
    ...Array.from({ length: target.width }, (_, offset) => ({
      x: target.left + offset,
      y: target.top + target.height
    }))
  ];
  const starts = [...preferredStarts, ...perimeterStarts];
  const isFree = (point) => point.x >= 0 && !search.blocked.has(`${point.x}:${point.y}`) && !(point.x >= bounds.left && point.x < bounds.left + bounds.width && point.y >= bounds.top && point.y < bounds.top + bounds.height);
  if (!isFree(end) || !isFree(goal))
    return;
  for (const start of starts.filter(isFree)) {
    const directPaths = [
      [start, { x: start.x, y: goal.y }, goal, end],
      [start, { x: goal.x, y: start.y }, goal, end]
    ];
    const direct = directPaths.find((points) => orthogonalPathPoints(points).every(isFree));
    if (direct)
      return { connectorY, points: direct };
  }
  const margin = 8;
  const minY = Math.min(target.top, bounds.top, search.minY) - margin;
  const maxX = Math.max(target.left + target.width, bounds.left + bounds.width, search.maxX) + margin;
  const maxY = Math.max(target.top + target.height, bounds.top + bounds.height, search.maxY) + margin;
  const path = findStateManhattanPath(starts, goal, search, { minX: 0, minY, maxX, maxY }, budget, isFree);
  return path ? { connectorY, points: [...path, end] } : undefined;
}
function belongsToComposite(id, compositeId, statesById, compositesById) {
  let parentId = statesById.get(id)?.parentId ?? compositesById.get(id)?.parentId;
  while (parentId) {
    if (parentId === compositeId)
      return true;
    parentId = compositesById.get(parentId)?.parentId;
  }
  return false;
}
function expandCompositeBoundsForNotes(diagram, layout) {
  const statesById = new Map(diagram.states.map((state) => [state.id, state]));
  const compositesById = new Map(diagram.composites.map((composite) => [composite.id, composite]));
  for (const composite of [...diagram.composites].reverse()) {
    const bound = layout.compositeBounds.get(composite.id);
    if (!bound)
      continue;
    const descendantNotes = layout.noteBounds.filter((noteBound) => belongsToComposite(noteBound.note.target, composite.id, statesById, compositesById));
    if (descendantNotes.length === 0)
      continue;
    const connectorPoints = descendantNotes.flatMap((note) => note.connector?.points ?? []);
    const left = Math.min(bound.left, ...descendantNotes.map((note) => note.left - 2), ...connectorPoints.map((point) => point.x - 1));
    const top = Math.min(bound.top, ...descendantNotes.map((note) => note.top - 1), ...connectorPoints.map((point) => point.y - 1));
    const right = Math.max(bound.left + bound.width, ...descendantNotes.map((note) => note.left + note.width + 2), ...connectorPoints.map((point) => point.x + 2));
    const bottom = Math.max(bound.top + bound.height, ...descendantNotes.map((note) => note.top + note.height + 1), ...connectorPoints.map((point) => point.y + 2));
    bound.left = left;
    bound.top = top;
    bound.width = Math.max(right - left, diagramTextWidth(composite.label) + 5);
    bound.height = bottom - top;
    bound.centerX = bound.left + Math.floor(bound.width / 2);
    bound.centerY = bound.top + Math.floor(bound.height / 2);
  }
}
function expandCompositeBoundsForInternalRouting(diagram, layout) {
  if (diagram.direction === "LR" || diagram.direction === "RL")
    return;
  const statesById = new Map(diagram.states.map((state) => [state.id, state]));
  const compositesById = new Map(diagram.composites.map((composite) => [composite.id, composite]));
  for (const composite of [...diagram.composites].reverse()) {
    const bound = layout.compositeBounds.get(composite.id);
    if (!bound)
      continue;
    const internal = diagram.transitions.filter((transition) => transition.from !== transition.to && innermostCommonCompositeId(transition, statesById, compositesById) === composite.id);
    const endpointOccurrences = new Map;
    const hasNestedComposite = diagram.composites.some((candidate) => candidate.parentId === composite.id);
    const sideRoutes = internal.filter((transition) => {
      const from = layout.bounds.get(transition.from);
      const to = layout.bounds.get(transition.to);
      if (!from || !to)
        return false;
      const key = `${transition.from}\x00${transition.to}`;
      const occurrence = endpointOccurrences.get(key) ?? 0;
      endpointOccurrences.set(key, occurrence + 1);
      const fromParent = statesById.get(transition.from)?.parentId;
      const toParent = statesById.get(transition.to)?.parentId;
      return occurrence > 0 || from.centerY > to.centerY && (!hasNestedComposite || from.left - 1 <= bound.left) || fromParent !== toParent && (from.centerX !== to.centerX || statesById.get(transition.from)?.kind !== "state" || statesById.get(transition.to)?.kind !== "state");
    });
    if (sideRoutes.length === 0)
      continue;
    const childRight = Math.max(...diagram.states.flatMap((state) => {
      if (!belongsToComposite(state.id, composite.id, statesById, compositesById))
        return [];
      const child = layout.bounds.get(state.id);
      return child ? [child.left + child.width] : [];
    }), ...diagram.composites.flatMap((childComposite) => {
      if (childComposite.parentId !== composite.id)
        return [];
      const child = layout.compositeBounds.get(childComposite.id);
      return child ? [child.left + child.width] : [];
    }));
    const labelWidth = Math.max(...sideRoutes.map((transition) => measureStateTransitionLabel(transition.label).width));
    const right = childRight + labelWidth + sideRoutes.length * 3 + 6;
    if (right <= bound.left + bound.width)
      continue;
    bound.width = right - bound.left;
    bound.centerX = bound.left + Math.floor(bound.width / 2);
  }
  enforceCompositeMargins(diagram, layout.compositeBounds);
}
function innermostCommonCompositeId(transition, statesById, compositesById) {
  const containers = (id) => {
    const ids = [];
    let parentId = statesById.get(id)?.parentId ?? compositesById.get(id)?.parentId;
    while (parentId) {
      ids.push(parentId);
      parentId = compositesById.get(parentId)?.parentId;
    }
    return ids;
  };
  const target = new Set(containers(transition.to));
  return containers(transition.from).find((id) => target.has(id));
}
function enforceCompositeMargins(diagram, compositeBounds) {
  const compositesByParent = new Map;
  for (const composite of diagram.composites) {
    if (!composite.parentId)
      continue;
    const children = compositesByParent.get(composite.parentId) ?? [];
    children.push(composite);
    compositesByParent.set(composite.parentId, children);
  }
  const expand = (composite) => {
    const bound = compositeBounds.get(composite.id);
    if (!bound)
      return;
    const children = (compositesByParent.get(composite.id) ?? []).map(expand).filter((child) => Boolean(child));
    if (children.length === 0)
      return bound;
    const left = Math.min(bound.left, ...children.map((child) => child.left - 2));
    const top = Math.min(bound.top, ...children.map((child) => child.top - 2));
    const right = Math.max(bound.left + bound.width, ...children.map((child) => child.left + child.width + 2));
    const bottom = Math.max(bound.top + bound.height, ...children.map((child) => child.top + child.height + 2));
    bound.left = left;
    bound.top = top;
    bound.width = right - left;
    bound.height = bottom - top;
    bound.centerX = left + Math.floor(bound.width / 2);
    bound.centerY = top + Math.floor(bound.height / 2);
    return bound;
  };
  for (const composite of diagram.composites.filter((candidate) => !candidate.parentId))
    expand(composite);
}
function boundsIntersect(left, right) {
  return intersects(left.left, left.top, left.width, left.height, right, 0);
}
function separateExternalBoundsFromComposites(diagram, layout) {
  const statesById = new Map(diagram.states.map((state) => [state.id, state]));
  const compositesById = new Map(diagram.composites.map((composite) => [composite.id, composite]));
  let shifted = false;
  for (const composite of diagram.composites) {
    const compositeBound = layout.compositeBounds.get(composite.id);
    if (!compositeBound)
      continue;
    for (const state of diagram.states) {
      if (belongsToComposite(state.id, composite.id, statesById, compositesById))
        continue;
      const bound = layout.bounds.get(state.id);
      if (!bound || !boundsIntersect(bound, compositeBound))
        continue;
      const dx = compositeBound.left + compositeBound.width + 4 - bound.left;
      if (dx <= 0)
        continue;
      const leftThreshold = bound.left;
      const boundsToShift = [];
      for (const candidate of diagram.states) {
        if (belongsToComposite(candidate.id, composite.id, statesById, compositesById))
          continue;
        const candidateBound = layout.bounds.get(candidate.id);
        if (candidateBound && candidateBound.left >= leftThreshold)
          boundsToShift.push(candidateBound);
      }
      for (const candidate of diagram.composites) {
        if (candidate.id === composite.id || belongsToComposite(candidate.id, composite.id, statesById, compositesById))
          continue;
        const candidateBound = layout.compositeBounds.get(candidate.id);
        if (candidateBound && candidateBound.left >= leftThreshold)
          boundsToShift.push(candidateBound);
      }
      for (const noteBound of layout.noteBounds) {
        const target = layout.bounds.get(noteBound.note.target);
        if (target && boundsToShift.includes(target))
          boundsToShift.push(noteBound);
      }
      shiftBounds(uniqueBounds(boundsToShift), dx, 0);
      shifted = true;
    }
  }
  return shifted;
}
function finalizeLayout(diagram, layout, budget) {
  if (diagram.composites.length === 0 && diagram.notes.length === 0)
    return layout;
  addCompositeBounds(diagram, layout);
  normalizeLayout(layout);
  expandCompositeBoundsForInternalRouting(diagram, layout);
  if (diagram.notes.length > 0) {
    const allBounds = [...layout.bounds.values()];
    placeStateDiagramNotesAroundTransitions(diagram, layout, createStateTransitionRenderPlans(diagram, layout.bounds, Math.max(0, ...allBounds.map((bound) => bound.top + bound.height)) + 3, {
      feedbackTopY: Math.min(0, ...allBounds.map((bound) => bound.top)) - 3,
      repairRoutes: false,
      searchBudget: budget
    }), budget);
  }
  expandCompositeBoundsForNotes(diagram, layout);
  expandCompositeBoundsForInternalRouting(diagram, layout);
  separateExternalBoundsFromComposites(diagram, layout);
  normalizeLayout(layout);
  return layout;
}
function createStateDiagramLayout(diagram, options) {
  const budget = options.searchBudget ?? createStateSearchBudget();
  if (diagram.direction === "LR" || diagram.direction === "RL") {
    return finalizeLayout(diagram, createHorizontalLayout(diagram, options), budget);
  }
  const ranks = computeRanks2(diagram);
  const maxRank = Math.max(0, ...ranks.values());
  const byRank = new Map;
  for (const state of diagram.states) {
    const rank = diagram.direction === "BT" ? maxRank - (ranks.get(state.id) ?? 0) : ranks.get(state.id) ?? 0;
    const list = byRank.get(rank) ?? [];
    list.push(state);
    byRank.set(rank, list);
  }
  const rankKeys = [...byRank.keys()].sort((a, b) => a - b);
  const sizes = new Map(diagram.states.map((state) => [state.id, stateSize(state)]));
  const bounds = new Map;
  const outgoingLabelRows = new Map;
  const selfTransitionCounts = new Map;
  for (const transition of diagram.transitions) {
    const rows = measureStateTransitionLabel(transition.label).height;
    outgoingLabelRows.set(transition.from, Math.max(outgoingLabelRows.get(transition.from) ?? 0, rows));
    if (transition.from === transition.to) {
      selfTransitionCounts.set(transition.from, (selfTransitionCounts.get(transition.from) ?? 0) + 1);
    }
  }
  const singleColumnCenter = Math.max(0, ...rankKeys.flatMap((rank) => {
    const states = byRank.get(rank);
    return states.length === 1 ? [Math.floor(sizes.get(states[0].id).width / 2)] : [];
  }));
  let y = 0;
  for (const rank of rankKeys) {
    const states = byRank.get(rank);
    const rowHeight = Math.max(...states.map((state) => sizes.get(state.id).height));
    let x = 0;
    for (const state of states) {
      const size = sizes.get(state.id);
      const top = y + Math.floor((rowHeight - size.height) / 2);
      const left = states.length === 1 ? singleColumnCenter - Math.floor(size.width / 2) : x;
      bounds.set(state.id, {
        id: state.id,
        left,
        top,
        width: size.width,
        height: size.height,
        centerX: left + Math.floor(size.width / 2),
        centerY: top + Math.floor(size.height / 2)
      });
      x += size.width + options.minStateGap + 8;
    }
    const labelRows = states.reduce((rows, state) => Math.max(rows, outgoingLabelRows.get(state.id) ?? 0), 0);
    const selfTransitionRows = states.reduce((rows, state) => Math.max(rows, (selfTransitionCounts.get(state.id) ?? 0) * 3 + 1), 0);
    const pseudoStateApproachClearance = states.some((state) => state.kind === "choice") ? 2 : 0;
    y += rowHeight + Math.max(4, labelRows + 3, selfTransitionRows) + pseudoStateApproachClearance;
  }
  return finalizeLayout(diagram, emptyLayout(bounds, sizes), budget);
}
function createHorizontalLayout(diagram, options) {
  const sizes = new Map(diagram.states.map((state) => [state.id, stateSize(state)]));
  const bounds = new Map;
  const statesById = new Map(diagram.states.map((state) => [state.id, state]));
  const mainPath = computeMainPath(diagram);
  const mainIds = new Set(mainPath);
  const mainPathIndex = new Map(mainPath.map((id, index) => [id, index]));
  const baselineY = Math.max(1, ...diagram.transitions.map((transition) => measureStateTransitionLabel(transition.label).height));
  const defaultGap = options.minStateGap + 8;
  let x = 0;
  for (const [index, id] of mainPath.entries()) {
    const state = statesById.get(id);
    const size = sizes.get(id);
    if (!state || !size)
      continue;
    const top = state.kind === "state" ? baselineY - Math.floor(size.height / 2) : baselineY;
    bounds.set(id, {
      id,
      left: x,
      top,
      width: size.width,
      height: size.height,
      centerX: x + Math.floor(size.width / 2),
      centerY: top + Math.floor(size.height / 2)
    });
    const nextId = mainPath[index + 1];
    const adjacentLabelWidth = diagram.transitions.filter((transition) => transition.from === id && transition.to === nextId).reduce((width, transition) => Math.max(width, measureStateTransitionLabel(transition.label).width), 0);
    const crossesCompositeBoundary = Boolean(nextId && statesById.get(id)?.parentId !== statesById.get(nextId)?.parentId);
    x += size.width + Math.max(defaultGap, adjacentLabelWidth + (crossesCompositeBoundary ? 6 : 2));
  }
  const branchesByParent = new Map;
  for (const transition of diagram.transitions) {
    if (!mainIds.has(transition.from) || mainIds.has(transition.to))
      continue;
    const list = branchesByParent.get(transition.from) ?? [];
    if (!list.includes(transition.to))
      list.push(transition.to);
    branchesByParent.set(transition.from, list);
  }
  for (const [parentId, branchIds] of branchesByParent) {
    const parent = bounds.get(parentId);
    if (!parent)
      continue;
    const branchGap = defaultGap;
    const branchSizes = branchIds.map((id) => sizes.get(id)).filter(Boolean);
    const totalWidth = branchSizes.reduce((sum, size) => sum + size.width, 0) + Math.max(0, branchSizes.length - 1) * branchGap;
    const parentIndex = mainPathIndex.get(parentId);
    const joinIds = branchIds.map((id) => diagram.transitions.find((transition) => transition.from === id && mainIds.has(transition.to) && parentIndex !== undefined && (mainPathIndex.get(transition.to) ?? -1) > parentIndex + 1)?.to);
    const commonJoin = joinIds[0] && joinIds.every((id) => id === joinIds[0]) ? joinIds[0] : undefined;
    const parallelLane = commonJoin && parentIndex !== undefined ? bounds.get(mainPath[parentIndex + 1]) : undefined;
    let left = (parallelLane?.centerX ?? parent.centerX) - Math.floor(totalWidth / 2);
    for (const branchId of branchIds) {
      if (bounds.has(branchId))
        continue;
      const size = sizes.get(branchId);
      if (!size)
        continue;
      const top = availableStateTop([...bounds.values()], left, baselineY + (parallelLane ? 6 : 5), size.width, size.height);
      bounds.set(branchId, {
        id: branchId,
        left,
        top,
        width: size.width,
        height: size.height,
        centerX: left + Math.floor(size.width / 2),
        centerY: top + Math.floor(size.height / 2)
      });
      left += size.width + branchGap;
    }
  }
  const ranks = computeRanks2(diagram);
  const fallbackStates = diagram.states.filter((state) => !bounds.has(state.id)).sort((left, right) => (ranks.get(left.id) ?? 0) - (ranks.get(right.id) ?? 0));
  for (const state of fallbackStates) {
    const size = sizes.get(state.id);
    const top = baselineY + 5;
    const rank = ranks.get(state.id) ?? bounds.size;
    let left = rank * (size.width + defaultGap);
    while (true) {
      const collision = [...bounds.values()].find((bound) => left < bound.left + bound.width + defaultGap && left + size.width + defaultGap > bound.left && top < bound.top + bound.height && top + size.height > bound.top);
      if (!collision)
        break;
      left = collision.left + collision.width + defaultGap;
    }
    bounds.set(state.id, {
      id: state.id,
      left,
      top,
      width: size.width,
      height: size.height,
      centerX: left + Math.floor(size.width / 2),
      centerY: top + Math.floor(size.height / 2)
    });
  }
  const minX = Math.min(0, ...[...bounds.values()].map((bound) => bound.left));
  if (minX < 0) {
    for (const bound of bounds.values()) {
      bound.left -= minX;
      bound.centerX -= minX;
    }
  }
  if (diagram.direction === "RL") {
    const right = Math.max(0, ...[...bounds.values()].map((bound) => bound.left + bound.width));
    for (const bound of bounds.values()) {
      bound.left = right - bound.left - bound.width;
      bound.centerX = bound.left + Math.floor(bound.width / 2);
    }
    const branchLabelGutter = Math.max(0, ...diagram.transitions.flatMap((transition) => {
      const from = bounds.get(transition.from);
      const to = bounds.get(transition.to);
      return from && to && from.centerY !== to.centerY ? [measureStateTransitionLabel(transition.label).width + 2] : [];
    }));
    if (branchLabelGutter > 0) {
      shiftBounds(bounds.values(), branchLabelGutter, 0);
    }
  }
  return emptyLayout(bounds, sizes);
}
function availableStateTop(bounds, left, top, width, height) {
  let available = top;
  while (true) {
    const collision = bounds.find((bound) => intersects(left, available, width, height, bound, 0));
    if (!collision)
      return available;
    available = collision.top + collision.height + 3;
  }
}
function expandCompositeBoundsForFeedback(diagram, bounds, compositeBounds, feedbackLaneY) {
  if (diagram.direction !== "LR" && diagram.direction !== "RL")
    return;
  const statesById = new Map(diagram.states.map((state) => [state.id, state]));
  const compositesById = new Map(diagram.composites.map((composite) => [composite.id, composite]));
  for (const composite of diagram.composites) {
    const compositeBound = compositeBounds.get(composite.id);
    if (!compositeBound)
      continue;
    const hasInternalFeedback = diagram.transitions.some((transition) => {
      if (!belongsToComposite(transition.from, composite.id, statesById, compositesById))
        return false;
      if (!belongsToComposite(transition.to, composite.id, statesById, compositesById))
        return false;
      const from = bounds.get(transition.from);
      const to = bounds.get(transition.to);
      return Boolean(from && to && isStateHorizontalFeedback(diagram, from, to));
    });
    if (!hasInternalFeedback)
      continue;
    const bottom = Math.max(compositeBound.top + compositeBound.height, feedbackLaneY + 2);
    compositeBound.height = bottom - compositeBound.top;
    compositeBound.centerY = compositeBound.top + Math.floor(compositeBound.height / 2);
  }
}
function placeStateDiagramNotesAroundTransitions(diagram, layout, transitionPlans, budget) {
  if (diagram.notes.length === 0)
    return;
  const compositeIds = new Set(diagram.composites.map((composite) => composite.id));
  let noteSpace = SpatialIndex.empty().add(...[...layout.bounds.values()].flatMap((bound) => compositeIds.has(bound.id) ? [] : [spatialRectClaim(`state:${bound.id}`, `state:${bound.id}`, "body", bound)]));
  let reserved = noteSpace.add(...transitionPlans.flatMap((plan, planIndex) => [
    spatialPathClaim(`transition-terminal:${planIndex}:source`, `transition-terminal:${planIndex}:source`, "route", plan.path.slice(0, 2).map(([x, y]) => ({ x, y }))),
    spatialPathClaim(`transition-terminal:${planIndex}:target`, `transition-terminal:${planIndex}:target`, "route", plan.path.slice(-2).map(([x, y]) => ({ x, y })))
  ]));
  let space = reserved.add(...transitionPlans.flatMap((plan, planIndex) => [
    spatialPathClaim(`transition:${planIndex}`, `transition:${planIndex}`, "route", plan.path.map(([x, y]) => ({ x, y }))),
    ...plan.label ? [
      spatialRectClaim(`transition-label:${planIndex}`, `transition-label:${planIndex}`, "label", {
        left: plan.label.x,
        top: plan.label.y,
        width: Math.max(...plan.label.lines.map(diagramTextWidth)),
        height: plan.label.lines.length
      })
    ] : []
  ]));
  const noteBounds = [];
  for (const [index, note] of diagram.notes.entries()) {
    const target = layout.bounds.get(note.target);
    if (!target)
      continue;
    const size = noteSize(note);
    const gap = 4;
    const baseLeft = note.position === "right" ? target.left + target.width + gap : target.left - size.width - gap;
    const baseTop = target.centerY - Math.floor(size.height / 2);
    const candidates = [
      baseTop,
      target.top - size.height - 2,
      target.top + target.height + 2,
      ...Array.from({ length: 12 }, (_, distance) => [baseTop - distance - 1, baseTop + distance + 1]).flat()
    ];
    const candidateBounds = Array.from({ length: 5 }, (_, outward) => candidates.map((top) => createNoteBound(note, index, baseLeft + (note.position === "right" ? 1 : -1) * outward * (size.width + 2), top, size))).flat();
    const findPlacement = (candidateSpace, limit) => {
      const connectorSearch = createStateSearchSpace(candidateSpace, (role) => role === "label" ? 1 : 0);
      for (const bound of candidateBounds.slice(0, limit)) {
        if (bound.left < 0)
          continue;
        const owner = `note:${index}`;
        if (!candidateSpace.isFree(spatialRectClaim(`${owner}:body`, owner, "body", bound), { clearance: 1 }))
          continue;
        const connector = findNoteConnector(connectorSearch, bound, target, budget);
        if (connector)
          return { bound: { ...bound, connector }, connector };
      }
      return;
    };
    const placement = findPlacement(space, 1) ?? findPlacement(noteSpace, 1) ?? findPlacement(space, MAX_STRICT_NOTE_PLACEMENTS) ?? findPlacement(reserved, candidateBounds.length) ?? outsideNotePlacement(noteSpace, note, index, target, size);
    const owner = `note:${index}`;
    const claims = [
      spatialRectClaim(`${owner}:body`, owner, "body", placement.bound),
      spatialPathClaim(`${owner}:connector`, owner, "boundary", placement.connector.points)
    ];
    noteBounds.push(placement.bound);
    noteSpace = noteSpace.add(...claims);
    reserved = reserved.add(...claims);
    space = space.add(...claims);
  }
  layout.noteBounds.splice(0, layout.noteBounds.length, ...noteBounds);
}
function outsideNotePlacement(space, note, index, target, size) {
  const search = createStateSearchSpace(space);
  const top = search.maxY + 4;
  const owner = `note:${index}:outside`;
  for (const position of [note.position, note.position === "left" ? "right" : "left"]) {
    const aligned = createNoteBound({ ...note, position }, index, position === "left" ? search.minX - size.width - 4 : search.maxX + 4, target.centerY - Math.floor(size.height / 2), size);
    const alignedNoteX = position === "left" ? aligned.left + aligned.width : aligned.left - 1;
    const alignedConnectorY = Math.max(aligned.top + 1, Math.min(target.centerY, aligned.top + aligned.height - 2));
    const alignedTargetX = position === "left" ? target.left - 1 : target.left + target.width;
    const alignedConnector = {
      connectorY: alignedConnectorY,
      points: [
        { x: alignedTargetX, y: target.centerY },
        { x: alignedNoteX, y: alignedConnectorY }
      ]
    };
    if (space.isFree(spatialRectClaim(`${owner}:body`, owner, "body", aligned), { clearance: 1 }) && space.isFree(spatialPathClaim(`${owner}:connector`, owner, "boundary", alignedConnector.points)))
      return { bound: { ...aligned, connector: alignedConnector }, connector: alignedConnector };
    const railX = position === "left" ? search.minX - 2 : search.maxX + 2;
    const bound = createNoteBound({ ...note, position }, index, position === "left" ? railX - size.width - 2 : railX + 3, top, size);
    const noteX = position === "left" ? bound.left + bound.width : bound.left - 1;
    const connectorY = bound.top + 1;
    const sideX = position === "left" ? target.left - 1 : target.left + target.width;
    const escapes = [
      ...[target.top, target.centerY, target.top + target.height - 1].map((y) => [
        { x: sideX, y },
        { x: railX, y }
      ]),
      [
        { x: target.centerX, y: target.top - 1 },
        { x: railX, y: target.top - 1 }
      ],
      [
        { x: target.centerX, y: target.top + target.height },
        { x: railX, y: target.top + target.height }
      ]
    ];
    for (const escape of escapes) {
      const connector = {
        connectorY,
        points: [...escape, { x: railX, y: connectorY }, { x: noteX, y: connectorY }]
      };
      if (space.isFree(spatialRectClaim(`${owner}:body`, owner, "body", bound), { clearance: 1 }) && space.isFree(spatialPathClaim(`${owner}:connector`, owner, "boundary", connector.points)))
        return { bound: { ...bound, connector }, connector };
    }
  }
  for (const vertical of ["below", "above"]) {
    const railY = vertical === "below" ? search.maxY + 2 : search.minY - 2;
    const bound = createNoteBound(note, index, note.position === "left" ? search.minX - size.width - 4 : search.maxX + 4, vertical === "below" ? railY + 2 : railY - size.height - 2, size);
    const noteX = note.position === "left" ? bound.left + bound.width : bound.left - 1;
    const connectorY = bound.top + 1;
    const targetY = vertical === "below" ? target.top + target.height : target.top - 1;
    const escapes = [
      ...[target.left, target.centerX, target.left + target.width - 1].map((x) => [
        { x, y: targetY },
        { x, y: railY }
      ]),
      [
        { x: target.left, y: targetY },
        { x: target.left - 1, y: targetY },
        { x: target.left - 1, y: railY }
      ],
      [
        { x: target.left + target.width - 1, y: targetY },
        { x: target.left + target.width, y: targetY },
        { x: target.left + target.width, y: railY }
      ]
    ];
    for (const escape of escapes) {
      const connector = {
        connectorY,
        points: [...escape, { x: noteX, y: railY }, { x: noteX, y: connectorY }]
      };
      if (space.isFree(spatialRectClaim(`${owner}:body`, owner, "body", bound), { clearance: 1 }) && space.isFree(spatialPathClaim(`${owner}:connector`, owner, "boundary", connector.points)))
        return { bound: { ...bound, connector }, connector };
    }
  }
  throw new Error(`State ${note.target} has no exterior note corridor`);
}
function expandCompositeBoundsForInternalTransitions(diagram, compositeBounds, transitionPlans) {
  const statesById = new Map(diagram.states.map((state) => [state.id, state]));
  const compositesById = new Map(diagram.composites.map((composite) => [composite.id, composite]));
  for (const composite of diagram.composites) {
    const bound = compositeBounds.get(composite.id);
    if (!bound)
      continue;
    const internalPlans = transitionPlans.filter((plan) => belongsToComposite(plan.route.transition.from, composite.id, statesById, compositesById) && belongsToComposite(plan.route.transition.to, composite.id, statesById, compositesById));
    const occupied = internalPlans.flatMap((plan) => [
      ...plan.cells.map((cell) => ({ x: cell.x, y: cell.y })),
      ...plan.label ? plan.label.lines.flatMap((line, row) => Array.from({ length: diagramTextWidth(line) }, (_, column) => ({
        x: plan.label.x + column,
        y: plan.label.y + row
      }))) : []
    ]);
    if (occupied.length === 0)
      continue;
    const left = Math.min(bound.left, Math.min(...occupied.map((point) => point.x)) - 1);
    const top = Math.min(bound.top, Math.min(...occupied.map((point) => point.y)) - 1);
    const right = Math.max(bound.left + bound.width, Math.max(...occupied.map((point) => point.x)) + 2);
    const bottom = Math.max(bound.top + bound.height, Math.max(...occupied.map((point) => point.y)) + 2);
    bound.left = left;
    bound.top = top;
    bound.width = right - left;
    bound.height = bottom - top;
    bound.centerX = bound.left + Math.floor(bound.width / 2);
    bound.centerY = bound.top + Math.floor(bound.height / 2);
  }
  enforceCompositeMargins(diagram, compositeBounds);
}

// node_modules/opentui-markdown-render/src/merman/state/options.ts
var DEFAULT_STATE_DIAGRAM_MIN_STATE_GAP = 5;
var DEFAULT_STATE_BORDER_STYLE = "rounded";
var DEFAULT_STATE_ARROW_HEAD_STYLE = "filled";
function normalizeStateMinStateGap(value) {
  if (value === undefined || !Number.isFinite(value))
    return DEFAULT_STATE_DIAGRAM_MIN_STATE_GAP;
  return Math.max(1, Math.trunc(value));
}

// node_modules/opentui-markdown-render/src/merman/state/style.ts
var DEFAULT_THEME_RGB5 = {
  state: [228, 239, 232],
  stateBorder: [228, 239, 232],
  composite: [111, 138, 126],
  compositeLabel: [111, 138, 126],
  transition: [134, 225, 200],
  label: [134, 225, 200],
  noteBorder: [141, 169, 155],
  noteText: [215, 229, 221],
  noteConnector: [141, 169, 155],
  start: [134, 225, 200],
  end: [230, 177, 126],
  choice: [134, 225, 200]
};
var STATE_RAMP_STEPS = [1, 2, 3];
var NOTE_CONNECTOR_RAMP_STYLES = numberedStyleKeys("noteConnectorRamp", STATE_RAMP_STEPS);
var STATE_DEPARTURE_RAMP_STYLES = numberedStyleKeys("stateDepartureRamp", STATE_RAMP_STEPS);
function resolveStateStyleColors(colors = {}) {
  const resolved = {
    state: colors.state ?? rgba(DEFAULT_THEME_RGB5.state),
    stateBorder: colors.stateBorder ?? colors.state ?? rgba(DEFAULT_THEME_RGB5.stateBorder),
    composite: colors.composite ?? rgba(DEFAULT_THEME_RGB5.composite),
    compositeLabel: colors.compositeLabel ?? colors.composite ?? rgba(DEFAULT_THEME_RGB5.compositeLabel),
    transition: colors.transition ?? rgba(DEFAULT_THEME_RGB5.transition),
    label: colors.label ?? rgba(DEFAULT_THEME_RGB5.label),
    noteBorder: colors.noteBorder ?? rgba(DEFAULT_THEME_RGB5.noteBorder),
    noteText: colors.noteText ?? rgba(DEFAULT_THEME_RGB5.noteText),
    noteConnector: colors.noteConnector ?? rgba(DEFAULT_THEME_RGB5.noteConnector),
    start: colors.start ?? rgba(DEFAULT_THEME_RGB5.start),
    end: colors.end ?? rgba(DEFAULT_THEME_RGB5.end),
    choice: colors.choice ?? rgba(DEFAULT_THEME_RGB5.choice)
  };
  return {
    ...resolved,
    ...createColorRampTheme(NOTE_CONNECTOR_RAMP_STYLES, resolved.noteConnector, resolved.noteBorder),
    ...createColorRampTheme(STATE_DEPARTURE_RAMP_STYLES, resolved.stateBorder, resolved.transition)
  };
}

// node_modules/opentui-markdown-render/src/merman/state/drawing.ts
function translateTransitionPlans(plans, dx, dy) {
  return plans.map((plan) => ({
    ...plan,
    cells: plan.cells.map((cell) => ({ ...cell, x: cell.x + dx, y: cell.y + dy })),
    path: plan.path.map(([x, y]) => [x + dx, y + dy]),
    label: plan.label ? { ...plan.label, x: plan.label.x + dx, y: plan.label.y + dy } : undefined
  }));
}
function makeGrid2(width, height) {
  return new DiagramCanvas(width, height, {
    mergeCell: (existing, incoming) => {
      const existingIsTransition = existing.style === "transition" || existing.style?.startsWith("stateDepartureRamp");
      const incomingIsTransition = incoming.style === "transition" || incoming.style?.startsWith("stateDepartureRamp");
      const shouldMerge = incomingIsTransition && existingIsTransition;
      return {
        ...incoming,
        char: shouldMerge ? mergeDiagramLineGlyph(existing.char, incoming.char, "rounded") ?? incoming.char : incoming.char
      };
    }
  });
}
function setCell3(grid, x, y, char, style) {
  grid.setCell(x, y, char, style);
}
function setText3(grid, x, y, text, style) {
  grid.setText(x, y, text, style);
}
function drawBox2(grid, state, bounds, lines, borderStyle) {
  if (isHiddenCompositeMarker(state))
    return;
  if (state.kind === "fork" || state.kind === "join")
    return;
  if (state.kind !== "state") {
    setCell3(grid, bounds.left, bounds.top, state.label, state.kind);
    return;
  }
  fillDiagramFrameInterior(bounds, (x, y) => setCell3(grid, x, y, " ", "state"));
  drawStateFrame(grid, bounds, BorderChars6[borderStyle], "stateBorder");
  lines.forEach((line, index) => {
    setText3(grid, bounds.left + 2, bounds.top + 1 + index, line, "state");
  });
}
function drawStateFrame(grid, bounds, chars, style) {
  drawDiagramFrame(bounds, chars, (x, y, char) => setCell3(grid, x, y, char, style));
}
function drawContainerFrame(grid, bounds, label, chars, style) {
  drawDiagramFrame(bounds, chars, (x, y, char) => setCell3(grid, x, y, char, style));
  drawContainerLabel(grid, bounds, label, style);
}
function drawContainerLabel(grid, bounds, label, style) {
  if (label)
    setText3(grid, bounds.left + 2, bounds.top, ` ${label} `, style);
}
function noteConnectorGlyph(directions) {
  const chars = BorderChars6.double;
  const up = directions.has("up");
  const down = directions.has("down");
  const left = directions.has("left");
  const right = directions.has("right");
  if (up && down && left && right)
    return chars.cross;
  if (up && down && right)
    return chars.leftT;
  if (up && down && left)
    return chars.rightT;
  if (left && right && down)
    return chars.topT;
  if (left && right && up)
    return chars.bottomT;
  if (up && right)
    return chars.bottomLeft;
  if (up && left)
    return chars.bottomRight;
  if (down && right)
    return chars.topLeft;
  if (down && left)
    return chars.topRight;
  if (up || down)
    return chars.vertical;
  return chars.horizontal;
}
function drawNote(grid, bounds, target) {
  const chars = BorderChars6.double;
  const connector = stateDiagramNoteConnector(bounds, target);
  const points = orthogonalPathPoints(connector.points);
  for (const [index, point] of points.entries()) {
    const directions = new Set;
    const previous = points[index - 1];
    const next = points[index + 1];
    if (previous)
      directions.add(directionBetween(point, previous));
    if (next)
      directions.add(directionBetween(point, next));
    const distanceFromNote = points.length - index - 1;
    const style = distanceFromNote < 3 ? NOTE_CONNECTOR_RAMP_STYLES[2 - distanceFromNote] : "noteConnector";
    setCell3(grid, point.x, point.y, noteConnectorGlyph(directions), style);
  }
  drawContainerFrame(grid, bounds, "", chars, "noteBorder");
  setCell3(grid, bounds.note.position === "right" ? bounds.left : bounds.left + bounds.width - 1, connector.connectorY, bounds.note.position === "right" ? chars.rightT : chars.leftT, "noteBorder");
  bounds.lines.forEach((line, index) => setText3(grid, bounds.left + 2, bounds.top + 1 + index, line, "noteText"));
}
function drawTransitionRenderPlan(grid, plan, arrowHeadStyle, rampDeparture) {
  const departure = new Map(rampDeparture ? plan.path.slice(0, 3).map(([x, y], index) => [`${x}:${y}`, STATE_DEPARTURE_RAMP_STYLES[index]]) : []);
  for (const cell of plan.cells) {
    const char = cell.arrowDirection ? diagramArrowHead(cell.arrowDirection, arrowHeadStyle) : cell.char;
    setCell3(grid, cell.x, cell.y, char, departure.get(`${cell.x}:${cell.y}`) ?? "transition");
  }
  if (plan.label) {
    plan.label.lines.forEach((line, index) => {
      const y = plan.label.y + index;
      const leftX = plan.label.x - DIAGRAM_LABEL_PADDING_X;
      if (grid.getCell(leftX, y)?.char === " ")
        setCell3(grid, leftX, y, " ", "label");
      setText3(grid, plan.label.x, y, line, "label");
      const rightX = plan.label.x + diagramTextWidth(line) + DIAGRAM_LABEL_PADDING_X - 1;
      if (grid.getCell(rightX, y)?.char === " ")
        setCell3(grid, rightX, y, " ", "label");
    });
  }
}
function drawTransitionJunctionPlans(grid, diagram, bounds, renderPlans) {
  for (const plan of createStateTransitionJunctionPlans(diagram, bounds, renderPlans)) {
    const parallel = plan.kind === "fork" || plan.kind === "join";
    const style = plan.kind === "choice" ? "choice" : "transition";
    const bar = diagram.direction === "LR" || diagram.direction === "RL" ? "\u2503" : "\u2501";
    const char = plan.kind === "choice" ? "\u25C6" : parallel ? bar : diagramLineGlyph(plan.connections, "rounded");
    setCell3(grid, plan.bounds.left, plan.bounds.top, char, style);
  }
}
function drawStateDiagramGrid(sourceDiagram, options = {}) {
  return createStateDiagramDrawing(sourceDiagram, options).grid;
}
function createStateDiagramDrawing(sourceDiagram, options = {}) {
  const direction = options.direction ?? sourceDiagram.direction;
  if (direction !== "LR" && direction !== "RL") {
    return createStateDiagramDrawingWithDirection(sourceDiagram, options, direction);
  }
  if (options.layoutMaxWidth === undefined || !Number.isFinite(options.layoutMaxWidth)) {
    return createStateDiagramDrawingWithDirection(sourceDiagram, options, direction);
  }
  const fallbackDirection = direction === "RL" ? "BT" : "TB";
  const maxWidth = Math.max(1, Math.trunc(options.layoutMaxWidth));
  const drawing = (() => {
    try {
      return createStateDiagramDrawingWithDirection(sourceDiagram, options, direction);
    } catch (error) {
      if (error instanceof DiagramCanvasSizeError)
        return;
      throw error;
    }
  })();
  if (!drawing)
    return createStateDiagramDrawingWithDirection(sourceDiagram, options, fallbackDirection);
  if (drawing.grid.getTextSize({ trimTop: true, trimBottom: true }).width <= maxWidth) {
    return drawing;
  }
  const fallback = createStateDiagramDrawingWithDirection(sourceDiagram, options, fallbackDirection);
  if (fallback.grid.getTextSize({ trimTop: true, trimBottom: true }).width >= drawing.grid.getTextSize({ trimTop: true, trimBottom: true }).width) {
    return drawing;
  }
  return fallback;
}
function createStateDiagramDrawingWithDirection(sourceDiagram, options, direction) {
  const diagram = prepareVisibleStateDiagram(direction === sourceDiagram.direction ? sourceDiagram : { ...sourceDiagram, direction });
  const borderStyle = options.borderStyle ?? DEFAULT_STATE_BORDER_STYLE;
  const arrowHeadStyle = options.arrowHeadStyle ?? DEFAULT_STATE_ARROW_HEAD_STYLE;
  const minStateGap = normalizeStateMinStateGap(options.minStateGap);
  const searchBudget = createStateSearchBudget();
  const layout = createStateDiagramLayout(diagram, {
    minStateGap,
    searchBudget
  });
  const { bounds, sizes, compositeBounds, noteBounds } = layout;
  let allBounds = [...bounds.values(), ...noteBounds];
  let maxY = Math.max(0, ...allBounds.map((bound) => bound.top + bound.height));
  const feedbackLaneY = maxY + 3;
  const feedbackTopY = Math.min(0, ...allBounds.map((bound) => bound.top)) - 3;
  expandCompositeBoundsForFeedback(diagram, bounds, compositeBounds, feedbackLaneY);
  let transitionPlans = [];
  const separationAttempts = diagram.states.length + diagram.composites.length + 1;
  for (let attempt = 0;attempt < separationAttempts; attempt++) {
    transitionPlans = createStateTransitionRenderPlans(diagram, bounds, feedbackLaneY, {
      feedbackTopY,
      noteBounds,
      searchBudget
    });
    expandCompositeBoundsForInternalTransitions(diagram, compositeBounds, transitionPlans);
    if (!separateExternalBoundsFromComposites(diagram, layout))
      break;
    if (attempt === separationAttempts - 1)
      throw new Error("State composite separation did not converge");
  }
  const connectorPoints = noteBounds.flatMap((bound) => bound.connector?.points ?? []);
  const contentLeft = Math.min(0, ...[...bounds.values(), ...noteBounds].map((bound) => bound.left), ...connectorPoints.map((point) => point.x), ...transitionPlans.flatMap((plan) => [
    ...plan.cells.map((cell) => cell.x),
    ...plan.label ? [plan.label.x - DIAGRAM_LABEL_PADDING_X] : []
  ]));
  const contentTop = Math.min(0, ...[...bounds.values(), ...noteBounds].map((bound) => bound.top), ...connectorPoints.map((point) => point.y), ...transitionPlans.flatMap((plan) => [...plan.cells.map((cell) => cell.y), ...plan.label ? [plan.label.y] : []]));
  if (contentLeft < 0 || contentTop < 0) {
    translateStateDiagramLayout(layout, -contentLeft, -contentTop);
    transitionPlans = translateTransitionPlans(transitionPlans, -contentLeft, -contentTop);
  }
  allBounds = [...bounds.values(), ...noteBounds];
  const translatedConnectorPoints = noteBounds.flatMap((bound) => bound.connector?.points ?? []);
  const maxX = Math.max(0, ...allBounds.map((bound) => bound.left + bound.width), ...translatedConnectorPoints.map((point) => point.x + 1));
  maxY = Math.max(0, ...allBounds.map((bound) => bound.top + bound.height), ...translatedConnectorPoints.map((point) => point.y + 1));
  const transitionLabelSizes = diagram.transitions.map((transition) => measureStateTransitionLabel(transition.label));
  const maxTransitionLabelWidth = Math.max(0, ...transitionLabelSizes.map((size) => size.width));
  const maxTransitionLabelLines = Math.max(0, ...transitionLabelSizes.map((size) => size.height));
  const transitionRight = Math.max(maxX, ...transitionPlans.flatMap((plan) => [
    ...plan.cells.map((cell) => cell.x + 1),
    ...plan.label ? [plan.label.x + measureStateTransitionLabel(plan.route.transition.label).width + DIAGRAM_LABEL_PADDING_X] : []
  ]));
  const transitionBottom = Math.max(maxY, ...transitionPlans.flatMap((plan) => [
    ...plan.cells.map((cell) => cell.y + 1),
    ...plan.label ? [plan.label.y + plan.label.lines.length] : []
  ]));
  const grid = makeGrid2(Math.max(maxX + Math.max(24, maxTransitionLabelWidth + 4), transitionRight + 2), Math.max(maxY + 8 + maxTransitionLabelLines, transitionBottom + 2));
  for (const composite of diagram.composites) {
    const bound = compositeBounds.get(composite.id);
    if (!bound)
      continue;
    drawContainerFrame(grid, bound, composite.label, BorderChars6[borderStyle], "composite");
  }
  for (const state of diagram.states) {
    const bound = bounds.get(state.id);
    const size = sizes.get(state.id);
    if (!bound || !size)
      continue;
    drawBox2(grid, state, bound, size.lines, borderStyle);
  }
  for (const plan of transitionPlans) {
    const source = diagram.states.find((state) => state.id === plan.route.transition.from);
    drawTransitionRenderPlan(grid, plan, arrowHeadStyle, source?.kind === "state");
  }
  drawTransitionJunctionPlans(grid, diagram, bounds, transitionPlans);
  for (const composite of diagram.composites) {
    const bound = compositeBounds.get(composite.id);
    if (bound)
      drawContainerLabel(grid, bound, composite.label, "compositeLabel");
  }
  for (const noteBound of noteBounds) {
    const target = bounds.get(noteBound.note.target);
    if (target)
      drawNote(grid, noteBound, target);
  }
  return { grid, diagram, layout, transitionPlans };
}

// node_modules/opentui-markdown-render/src/merman/state/render-grid.ts
function renderStateGridStyledText(grid, colors, backgrounds) {
  return renderDiagramGridStyledTextByStyle(grid, colors, backgrounds, {
    trimTop: true,
    trimBottom: true
  });
}

// node_modules/opentui-markdown-render/src/merman/timeline/style.ts
var DEFAULT_THEME_RGB6 = {
  title: [228, 239, 232],
  section: [154, 184, 169],
  period: [230, 177, 126],
  spine: [111, 138, 126],
  event: [134, 225, 200]
};
var TIMELINE_SECTION_FADE_STYLES = numberedStyleKeys("sectionFade", [1, 2, 3]);
var TIMELINE_PERIOD_FADE_STYLES = numberedStyleKeys("periodFade", [1, 2, 3]);
function resolveTimelineStyleColors(colors = {}) {
  const section = colors.section ?? rgba(DEFAULT_THEME_RGB6.section);
  const period = colors.period ?? rgba(DEFAULT_THEME_RGB6.period);
  const spine = colors.spine ?? rgba(DEFAULT_THEME_RGB6.spine);
  return {
    title: colors.title ?? rgba(DEFAULT_THEME_RGB6.title),
    section,
    period,
    spine,
    event: colors.event ?? rgba(DEFAULT_THEME_RGB6.event),
    sectionFade1: blendColor(section, spine, 0.5),
    sectionFade2: blendColor(section, spine, 0.67),
    sectionFade3: blendColor(section, spine, 0.83),
    periodFade1: blendColor(period, spine, 0.5),
    periodFade2: blendColor(period, spine, 0.67),
    periodFade3: blendColor(period, spine, 0.83)
  };
}

// node_modules/opentui-markdown-render/src/merman/timeline/drawing.ts
var JOIN_WIDTH = TIMELINE_SECTION_FADE_STYLES.length;
var SPINE_OFFSET = JOIN_WIDTH + 1;
var EVENT_OFFSET = 3;
function drawTimelineDiagramGrid(diagram, _options = {}) {
  const periodLayouts = new Map;
  let leftWidth = 0;
  let rightWidth = 0;
  let bodyHeight = 0;
  for (const entry of diagram.entries) {
    if (entry.type === "section") {
      const lines = splitDiagramLines(entry.section.label);
      bodyHeight += lines.length + 1;
      for (const line of lines)
        leftWidth = Math.max(leftWidth, diagramTextWidth(line));
      continue;
    }
    const periodLines = splitDiagramLines(entry.period.period);
    const eventLines = entry.period.events.map(splitDiagramLines);
    const eventHeight = eventLines.reduce((height, lines) => height + lines.length, 0);
    const height = Math.max(periodLines.length, eventHeight);
    periodLayouts.set(entry.period, { period: entry.period, periodLines, eventLines, height });
    for (const line of periodLines)
      leftWidth = Math.max(leftWidth, diagramTextWidth(line));
    for (const lines of eventLines) {
      for (const line of lines)
        rightWidth = Math.max(rightWidth, diagramTextWidth(line));
    }
    bodyHeight += height + 1;
  }
  const titleLines = diagram.title ? splitDiagramLines(diagram.title) : [];
  const bodyWidth = diagram.entries.length === 0 ? 0 : leftWidth + SPINE_OFFSET + EVENT_OFFSET + rightWidth + 1;
  let titleWidth = 0;
  for (const line of titleLines)
    titleWidth = Math.max(titleWidth, diagramTextWidth(line));
  const width = Math.max(bodyWidth, titleWidth);
  const titleHeight = titleLines.length === 0 ? 0 : titleLines.length + (diagram.entries.length === 0 ? 0 : 1);
  if (width === 0)
    return new DiagramCanvas(0, 0);
  const grid = new DiagramCanvas(width, titleHeight + bodyHeight);
  titleLines.forEach((line, index) => setText4(grid, Math.floor((width - diagramTextWidth(line)) / 2), index, line, "title"));
  if (diagram.entries.length === 0)
    return grid;
  const spineX = leftWidth + SPINE_OFFSET;
  let y = titleHeight;
  let railStarted = false;
  for (const entry of diagram.entries) {
    if (entry.type === "section") {
      const lines = splitDiagramLines(entry.section.label);
      lines.forEach((line, index) => {
        setText4(grid, leftWidth - diagramTextWidth(line), y + index, line, "section");
        if (index > 0)
          setCell4(grid, spineX, y + index, "\u2502", "spine");
      });
      drawJoin(grid, leftWidth, y, TIMELINE_SECTION_FADE_STYLES);
      setCell4(grid, spineX, y, railStarted ? "\u2524" : "\u2510", "spine");
      setCell4(grid, spineX, y + lines.length, "\u2502", "spine");
      railStarted = true;
      y += lines.length + 1;
      continue;
    }
    const layout = periodLayouts.get(entry.period);
    for (let row = 0;row < layout.height + 1; row++)
      setCell4(grid, spineX, y + row, "\u2502", "spine");
    railStarted = true;
    setCell4(grid, spineX, y, "\u25CF", "spine");
    layout.periodLines.forEach((line, index) => {
      const lineWidth = diagramTextWidth(line);
      setText4(grid, leftWidth - lineWidth, y + index, line, "period");
    });
    drawJoin(grid, leftWidth, y, TIMELINE_PERIOD_FADE_STYLES);
    let eventY = y;
    for (const lines of layout.eventLines) {
      lines.forEach((line, index) => setText4(grid, spineX + EVENT_OFFSET, eventY + index, line, "event"));
      eventY += lines.length;
    }
    y += layout.height + 1;
  }
  return grid;
}
function drawJoin(grid, x, y, styles) {
  styles.forEach((style, index) => setCell4(grid, x + index + 1, y, "\u2500", style));
}
function setCell4(grid, x, y, char, style) {
  grid.setCell(x, y, char, style);
}
function setText4(grid, x, y, text, style) {
  grid.setText(x, y, text, style);
}

// node_modules/opentui-markdown-render/src/merman/timeline/render-grid.ts
function renderTimelineGridStyledText(grid, colors) {
  return renderDiagramGridStyledText(grid, (run) => run.style ? colors[run.style] : undefined, undefined, {
    trimBottom: true
  });
}

// node_modules/opentui-markdown-render/src/merman/diagram.ts
function color(value) {
  return value === undefined ? undefined : parseColor3(value);
}
function prepareDiagram(kind, source, options, layoutMaxWidth) {
  const colors = options.colors ?? {};
  const compact = options.compact ?? true;
  switch (kind) {
    case "classDiagram": {
      const grid = drawClassDiagramGrid(parseMermaidClassDiagram(source), { layoutMaxWidth, classLayout: options.classLayout });
      const size = grid.getTextSize({ trimTop: true, trimBottom: true });
      return {
        kind,
        source,
        text: renderClassGridStyledText(grid, resolveClassStyleColors({
          border: color(colors.boxBorder ?? colors.muted),
          title: color(colors.boxText ?? colors.primary),
          stereotype: color(colors.groupText ?? colors.group ?? colors.muted),
          member: color(colors.text),
          edge: color(colors.line ?? colors.secondary),
          label: color(colors.text)
        })),
        height: size.height
      };
    }
    case "flowchart": {
      const grid = drawFlowchartDiagramGrid(parseMermaidFlowchartDiagram(source), {
        compact,
        layoutMaxWidth
      });
      const size = grid.getTextSize({ trimTop: true, trimBottom: true });
      return {
        kind,
        source,
        text: renderGridStyledText(grid, resolveFlowchartStyleColors({
          node: color(colors.boxText ?? colors.primary),
          nodeBorder: color(colors.boxBorder ?? colors.muted),
          database: color(colors.boxText ?? colors.primary),
          databaseBorder: color(colors.boxBorder ?? colors.muted),
          edge: color(colors.line ?? colors.secondary),
          label: color(colors.text),
          group: color(colors.group ?? colors.muted),
          groupLabel: color(colors.groupText ?? colors.group ?? colors.muted)
        }), { label: color(colors.labelBackground) }),
        height: size.height
      };
    }
    case "gitGraph": {
      const grid = drawGitGraphDiagramGrid(parseMermaidGitGraphDiagram(source));
      const size = grid.getTextSize({ trimBottom: true });
      return {
        kind,
        source,
        text: renderGitGraphGridStyledText(grid, resolveGitGraphStyleColors({
          primary: color(colors.primary),
          secondary: color(colors.secondary),
          muted: color(colors.muted),
          warning: color(colors.warning),
          text: color(colors.text)
        })),
        height: size.height
      };
    }
    case "gantt": {
      const grid = drawGanttDiagramGrid(parseMermaidGanttDiagram(source), { ...options.gantt, layoutMaxWidth });
      const size = grid.getTextSize({ trimBottom: true });
      return {
        kind,
        source,
        text: renderGanttGridStyledText(grid, resolveGanttStyleColors({
          title: color(colors.text),
          axis: color(colors.muted),
          background: color(colors.background),
          section: color(colors.secondary),
          task: color(colors.primary),
          active: color(colors.primary),
          critical: color(colors.warning),
          done: color(colors.muted)
        })),
        height: size.height
      };
    }
    case "sequence": {
      const grid = drawSequenceDiagramGrid(parseMermaidSequenceDiagram(source), { compact });
      const size = grid.getTextSize();
      return {
        kind,
        source,
        text: renderSequenceGridStyledText(grid, resolveSequenceStyleColors({
          participant: color(colors.primary),
          lifeline: color(colors.muted),
          group: color(colors.secondary),
          request: color(colors.request ?? colors.primary),
          response: color(colors.response ?? colors.primary),
          fragment: color(colors.secondary),
          fragmentLabelBg: color(colors.background),
          note: color(colors.note ?? colors.warning),
          noteBg: color(colors.noteBackground ?? colors.background)
        })),
        height: size.height
      };
    }
    case "state": {
      const grid = drawStateDiagramGrid(parseMermaidStateDiagram(source), { layoutMaxWidth });
      const size = grid.getTextSize({ trimTop: true, trimBottom: true });
      return {
        kind,
        source,
        text: renderStateGridStyledText(grid, resolveStateStyleColors({
          state: color(colors.boxText ?? colors.primary),
          stateBorder: color(colors.boxBorder ?? colors.primary),
          composite: color(colors.group ?? colors.muted),
          compositeLabel: color(colors.groupText ?? colors.group ?? colors.muted),
          transition: color(colors.line ?? colors.secondary),
          label: color(colors.text),
          noteBorder: color(colors.noteBorder ?? colors.warning),
          noteText: color(colors.noteText ?? colors.warning),
          noteConnector: color(colors.noteConnector ?? colors.muted),
          start: color(colors.marker ?? colors.muted),
          end: color(colors.marker ?? colors.muted),
          choice: color(colors.marker ?? colors.secondary)
        }), { label: color(colors.labelBackground) }),
        height: size.height
      };
    }
    case "timeline": {
      const grid = drawTimelineDiagramGrid(parseMermaidTimelineDiagram(source));
      const size = grid.getTextSize({ trimBottom: true });
      return {
        kind,
        source,
        text: renderTimelineGridStyledText(grid, resolveTimelineStyleColors({
          title: color(colors.text),
          section: color(colors.secondary),
          period: color(colors.warning),
          spine: color(colors.muted),
          event: color(colors.primary)
        })),
        height: size.height
      };
    }
  }
}
function measureMermaidDiagram(source, options = {}) {
  const kind = detectMermaidDiagram(source);
  if (!kind)
    return;
  const configuredMaxWidth = options.layoutMaxWidth === undefined ? 120 : Math.max(1, Math.trunc(options.layoutMaxWidth));
  const prepared = prepareDiagram(kind, source, options, configuredMaxWidth);
  const palette = options.palette;
  if (!palette?.length)
    return prepared;
  const nearest = (color) => {
    const [r, g, b] = color.toInts();
    let closest = palette[0];
    let distance = Number.POSITIVE_INFINITY;
    for (const candidate of palette) {
      const [cr, cg, cb] = candidate.toInts();
      const difference = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
      if (difference < distance) {
        distance = difference;
        closest = candidate;
      }
    }
    return closest;
  };
  return {
    ...prepared,
    text: new StyledText3(prepared.text.chunks.map((chunk) => ({
      ...chunk,
      fg: chunk.fg ? nearest(chunk.fg) : undefined,
      bg: chunk.bg && chunk.bg.a >= 1 ? nearest(chunk.bg) : undefined
    })))
  };
}

// node_modules/opentui-markdown-render/src/merman/palette.ts
import { RGBA as RGBA4 } from "@opentui/core";
function createOpenCodeDiagramPalette(input) {
  const secondary = blendColor(input.text, input.subdued, 0.5);
  const muted = blendColor(input.text, input.subdued, 0.7);
  return {
    text: input.text,
    primary: input.text,
    secondary,
    muted,
    warning: input.info,
    background: input.background,
    request: input.success,
    response: input.warning,
    note: input.text,
    noteBackground: blendColor(input.background, input.subdued, 0.25),
    boxText: input.text,
    boxBorder: muted,
    line: input.subdued,
    labelBackground: RGBA4.fromValues(input.text.r, input.text.g, input.text.b, 0.08),
    group: input.accent.soft,
    groupText: input.accent.soft,
    marker: secondary,
    noteBorder: input.accent.soft,
    noteText: input.accent.clear,
    noteConnector: input.accent.soft
  };
}
function resolveOpenCodeDiagramPalette(theme) {
  return createOpenCodeDiagramPalette({
    text: theme.text.base,
    subdued: theme.text.muted,
    info: theme.text.feedback.info,
    success: theme.text.feedback.success,
    warning: theme.text.feedback.warning,
    background: theme.background.base,
    accent: {
      soft: theme.accent,
      clear: theme.accent
    }
  });
}

// node_modules/opentui-markdown-render/src/view/mermaid.tsx
import { jsxDEV as jsxDEV7 } from "@opentui/solid/jsx-dev-runtime";
function DiagramText(props) {
  let ref;
  let dragX;
  createEffect3(() => {
    if (!ref)
      return;
    const prepared = props.prepared();
    ref.content = prepared.text;
    ref.height = prepared.height;
    ref.width = "100%";
    ref.wrapMode = "none";
    ref.selectable = false;
    ref.marginTop = 1;
  });
  return /* @__PURE__ */ jsxDEV7("text", {
    ref: (renderable) => {
      ref = renderable;
      if (!ref)
        return;
      ref.onMouseDown = (event) => {
        if (event.button !== 0)
          return;
        ref?.ctx.clearSelection();
        dragX = event.x;
        event.preventDefault();
        event.stopPropagation();
      };
      ref.onMouseDrag = (event) => {
        if (dragX === undefined)
          return;
        const dx = event.x - dragX;
        dragX = event.x;
        if (ref && dx)
          ref.scrollX -= dx;
        event.preventDefault();
        event.stopPropagation();
      };
      ref.onMouseDragEnd = () => {
        dragX = undefined;
      };
      ref.onMouseUp = () => {
        dragX = undefined;
      };
      ref.onMouseScroll = (event) => {
        const direction = event.scroll?.direction;
        if (direction !== "left" && direction !== "right")
          return;
        event.preventDefault();
        event.stopPropagation();
      };
    }
  }, undefined, false, undefined, this);
}
function MermaidDiagramView(props) {
  let lastGood;
  const prepared = createMemo4(() => {
    const source = props.source;
    const kind = detectMermaidDiagram(source);
    if (kind && lastGood && lastGood.kind !== kind)
      lastGood = undefined;
    const options = {
      compact: props.mermaidOptions?.compact,
      classLayout: props.mermaidOptions?.classLayout,
      layoutMaxWidth: Math.min(props.mermaidOptions?.layoutMaxWidth ?? 120, Math.max(1, props.columns)),
      colors: resolveOpenCodeDiagramPalette(props.theme),
      palette: props.theme.palette
    };
    const restore = () => {
      if (!lastGood)
        return;
      try {
        return measureMermaidDiagram(lastGood.source, options);
      } catch {
        return;
      }
    };
    try {
      const result = measureMermaidDiagram(source, options);
      if (result && result.height > 0) {
        lastGood = result;
        return result;
      }
      if (lastGood && (!kind || lastGood.kind === kind)) {
        return restore();
      }
    } catch (error) {
      if (error instanceof MermaidSyntaxError && lastGood && lastGood.kind === kind) {
        return restore();
      }
      if (error instanceof MermaidSyntaxError && kind) {
        const lines = source.split(`
`);
        if (error.lineNumber > 2 && !lines.slice(error.lineNumber).some((line) => line.trim())) {
          try {
            const result = measureMermaidDiagram(lines.slice(0, error.lineNumber - 1).join(`
`), options);
            if (result?.height) {
              lastGood = result;
              return result;
            }
          } catch (prefixError) {
            if (!(prefixError instanceof MermaidSyntaxError || prefixError instanceof DiagramCanvasSizeError)) {
              props.onDiagnostic?.({ level: "error", message: prefixError instanceof Error ? prefixError.message : String(prefixError) });
            }
          }
        }
      }
      if (!(error instanceof MermaidSyntaxError || error instanceof DiagramCanvasSizeError)) {
        props.onDiagnostic?.({ level: "error", message: error instanceof Error ? error.message : String(error) });
      }
    }
    return;
  });
  return /* @__PURE__ */ jsxDEV7("box", {
    width: "100%",
    flexDirection: "column",
    flexShrink: 0,
    children: /* @__PURE__ */ jsxDEV7(Show3, {
      when: prepared(),
      fallback: /* @__PURE__ */ jsxDEV7(CodeBlock, {
        content: props.source,
        language: "mermaid",
        theme: props.theme,
        headings: props.headings ?? defaultHeadingStyles,
        syntaxStyle: props.syntaxStyle
      }, undefined, false, undefined, this),
      children: (value) => /* @__PURE__ */ jsxDEV7(DiagramText, {
        prepared: value
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

// node_modules/opentui-markdown-render/src/view/document.tsx
import { jsxDEV as jsxDEV8, Fragment } from "@opentui/solid/jsx-dev-runtime";
function listMarker(list, index, item) {
  const bullet = list.ordered ? `${list.start + index}.` : "-";
  return item.task ? `${bullet} ${item.checked ? "[x]" : "[ ]"}` : bullet;
}
function DocumentView(props) {
  let previous = [];
  const slots = createMemo5(() => {
    previous = reconcileSlots(previous, [...props.document.blocks]);
    return previous;
  });
  function flow(children, columns, quote, prefix, prefixColor, prefixChunks) {
    return /* @__PURE__ */ jsxDEV8(InlineFlow, {
      inlines: children,
      columns,
      theme: props.theme,
      headings: props.headings,
      graphics: props.graphics,
      surface: props.surface,
      quote,
      prefix,
      prefixColor,
      prefixChunks
    }, undefined, false, undefined, this);
  }
  function BlockView(input) {
    if (input.block().type === "mermaid") {
      return /* @__PURE__ */ jsxDEV8(MermaidDiagramView, {
        source: input.block().content,
        theme: props.theme,
        columns: input.columns,
        mermaidOptions: props.mermaidOptions,
        headings: props.headings,
        onDiagnostic: props.onDiagnostic
      }, undefined, false, undefined, this);
    }
    const view = createMemo5(() => {
      const block = input.block();
      const columns = Math.max(1, input.columns);
      switch (block.type) {
        case "paragraph":
          return flow(block.children, columns, input.quote);
        case "heading": {
          const level = headingLevels[block.level - 1];
          const style = props.headings[level];
          const children = style.uppercase ? block.children.map((child) => child.type === "text" ? { ...child, text: child.text.toUpperCase() } : child) : block.children;
          return /* @__PURE__ */ jsxDEV8("box", {
            width: "100%",
            flexDirection: "column",
            flexShrink: 0,
            marginTop: style.marginTop,
            marginBottom: style.marginBottom,
            children: /* @__PURE__ */ jsxDEV8(InlineFlow, {
              inlines: children,
              columns,
              theme: props.theme,
              headings: props.headings,
              graphics: props.graphics,
              surface: props.surface,
              heading: { level },
              prefix: (index) => index === 0 ? `${"#".repeat(level)} ` : " ".repeat(level + 1),
              prefixColor: () => props.theme.text.muted
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this);
        }
        case "rule":
          return /* @__PURE__ */ jsxDEV8("box", {
            height: 1,
            width: "100%",
            border: ["top"],
            borderColor: props.theme.markdown.horizontalRule
          }, undefined, false, undefined, this);
        case "image":
          return /* @__PURE__ */ jsxDEV8(LocalImage, {
            href: block.href,
            alt: block.alt,
            base: props.assetBase,
            columns: () => columns,
            cell: props.graphics.cell,
            background: props.surface,
            labelColor: () => props.theme.markdown.image,
            textColor: () => props.theme.markdown.imageText,
            limits: props.imageLimits
          }, undefined, false, undefined, this);
        case "display-math":
          return /* @__PURE__ */ jsxDEV8(DisplayMath, {
            content: block.content,
            open: block.open,
            close: block.close,
            maxWidth: () => columns,
            theme: () => props.theme,
            graphics: props.graphics,
            surface: props.surface,
            scale: () => props.mathScale ?? 1
          }, undefined, false, undefined, this);
        case "quote":
          return /* @__PURE__ */ jsxDEV8("box", {
            border: columns > 2 ? ["left"] : [],
            borderColor: props.theme.markdown.blockQuote,
            paddingLeft: columns > 2 ? 1 : 0,
            width: "100%",
            flexDirection: "column",
            children: /* @__PURE__ */ jsxDEV8(For2, {
              each: block.blocks,
              children: (child) => /* @__PURE__ */ jsxDEV8(BlockView, {
                block: () => child,
                columns: columns > 2 ? columns - 2 : columns,
                quote: true
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this);
        case "list":
          return /* @__PURE__ */ jsxDEV8(ListBlockView, {
            block: () => block,
            columns,
            quote: input.quote,
            wrapItems: false
          }, undefined, false, undefined, this);
        case "code":
          return /* @__PURE__ */ jsxDEV8(CodeBlock, {
            content: block.content,
            language: block.language,
            theme: props.theme,
            headings: props.headings,
            syntaxStyle: props.syntaxStyle
          }, undefined, false, undefined, this);
        case "mermaid":
          return /* @__PURE__ */ jsxDEV8(MermaidDiagramView, {
            source: block.content,
            theme: props.theme,
            columns,
            mermaidOptions: props.mermaidOptions,
            headings: props.headings,
            syntaxStyle: props.syntaxStyle,
            onDiagnostic: props.onDiagnostic
          }, undefined, false, undefined, this);
        case "table":
          return /* @__PURE__ */ jsxDEV8(TableBlock, {
            block,
            options: props.tableOptions,
            theme: props.theme,
            headings: props.headings,
            hyperlinks: props.graphics.hyperlinks?.() ?? true
          }, undefined, false, undefined, this);
        case "literal":
          return /* @__PURE__ */ jsxDEV8("text", {
            fg: props.theme.markdown.text,
            wrapMode: "word",
            content: block.text
          }, undefined, false, undefined, this);
        default:
          return assertNever(block);
      }
    });
    return /* @__PURE__ */ jsxDEV8("box", {
      width: "100%",
      flexDirection: "column",
      flexShrink: 0,
      children: view()
    }, undefined, false, undefined, this);
  }
  function ListItemView(input) {
    const list = input.block;
    const item = input.item;
    const markerWidth = input.markerWidth;
    const hanging = () => markerWidth() + 1;
    const marker = () => listMarker(list(), input.index(), item());
    const content = /* @__PURE__ */ jsxDEV8("box", {
      flexDirection: "column",
      width: "100%",
      flexShrink: 0,
      marginBottom: list().loose && input.index() < list().items.length - 1 ? 1 : 0,
      children: [
        /* @__PURE__ */ jsxDEV8(For2, {
          each: item().blocks,
          children: (child, childIndex) => childIndex() === 0 && child.type === "paragraph" ? flow(child.children, input.columns, input.quote, (row) => row === 0 ? `${marker().padEnd(markerWidth())} ` : " ".repeat(hanging()), () => list().ordered ? props.theme.markdown.listEnumeration : props.theme.markdown.listItem, item().task ? (row) => row === 0 ? [
            {
              __isChunk: true,
              text: `${list().ordered ? `${list().start + input.index()}.` : "-"} `,
              fg: list().ordered ? props.theme.markdown.listEnumeration : props.theme.markdown.listItem
            },
            {
              __isChunk: true,
              text: `${item().checked ? "[x]" : "[ ]"}${" ".repeat(markerWidth() - stringWidth(marker()) + 1)}`,
              fg: item().checked ? props.theme.text.feedback.success : props.theme.text.muted
            }
          ] : [{ __isChunk: true, text: " ".repeat(hanging()), fg: props.theme.text.muted }] : undefined) : childIndex() === 0 ? /* @__PURE__ */ jsxDEV8("box", {
            flexDirection: "row",
            width: "100%",
            flexShrink: 0,
            children: [
              /* @__PURE__ */ jsxDEV8("text", {
                width: hanging(),
                flexShrink: 0,
                fg: list().ordered ? props.theme.markdown.listEnumeration : props.theme.markdown.listItem,
                children: `${marker().padEnd(markerWidth())} `
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsxDEV8(BlockView, {
                block: () => child,
                columns: Math.max(1, input.columns - hanging()),
                quote: input.quote
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this) : /* @__PURE__ */ jsxDEV8("box", {
            marginLeft: hanging(),
            width: Math.max(1, input.columns - hanging()),
            flexDirection: "column",
            children: /* @__PURE__ */ jsxDEV8(BlockView, {
              block: () => child,
              columns: Math.max(1, input.columns - hanging()),
              quote: input.quote
            }, undefined, false, undefined, this)
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        item().blocks.length === 0 && /* @__PURE__ */ jsxDEV8("text", {
          fg: props.theme.markdown.listItem,
          children: marker()
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
    const info = () => {
      const current = item();
      const source = input.latest().items[input.index()]?.source ?? null;
      return { kind: "list-item", item: current.source === source ? current : { ...current, source }, source };
    };
    return /* @__PURE__ */ jsxDEV8(Fragment, {
      children: input.wrapUnit && props.renderUnit ? props.renderUnit(info, content) : content
    }, undefined, false, undefined, this);
  }
  function ListBlockView(input) {
    const markerWidth = createMemo5(() => {
      const list = input.block();
      return Math.max(1, ...list.items.map((entry, index) => stringWidth(listMarker(list, index, entry))));
    });
    return /* @__PURE__ */ jsxDEV8("box", {
      flexDirection: "column",
      width: "100%",
      flexShrink: 0,
      children: /* @__PURE__ */ jsxDEV8(For2, {
        each: input.block().items,
        children: (item, index) => /* @__PURE__ */ jsxDEV8(ListItemView, {
          block: input.block,
          latest: input.latest ?? input.block,
          markerWidth,
          item: () => input.block().items[index()] ?? item,
          index,
          columns: input.columns,
          quote: input.quote,
          wrapUnit: input.wrapItems
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this);
  }
  function TopLevelSlot(input) {
    const block = input.slot.block;
    if (block().type === "list") {
      return /* @__PURE__ */ jsxDEV8(ListBlockView, {
        block: () => block(),
        latest: () => input.slot.latest(),
        columns: input.columns,
        wrapItems: true
      }, undefined, false, undefined, this);
    }
    const info = () => {
      const current = block();
      if (current.type === "list")
        throw new Error("A top-level list is rendered as list items, not as a block unit");
      const source = input.slot.latest().source ?? null;
      return { kind: "block", block: current.source === source ? current : { ...current, source }, source };
    };
    const content = /* @__PURE__ */ jsxDEV8(BlockView, {
      block,
      columns: input.columns
    }, undefined, false, undefined, this);
    return /* @__PURE__ */ jsxDEV8(Fragment, {
      children: props.renderUnit ? props.renderUnit(info, content) : content
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ jsxDEV8("box", {
    width: "100%",
    flexDirection: "column",
    flexShrink: 0,
    children: /* @__PURE__ */ jsxDEV8(For2, {
      each: slots(),
      children: (slot) => /* @__PURE__ */ jsxDEV8(TopLevelSlot, {
        slot,
        columns: props.columns
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

// node_modules/opentui-markdown-render/src/app.tsx
import { jsxDEV as jsxDEV9 } from "@opentui/solid/jsx-dev-runtime";
function resolveRendererTheme(renderer, options = {}) {
  const host = typeof options.theme === "function" ? options.theme() : options.theme;
  if (host)
    return host;
  const config = options.config ?? loadRendererConfig(options.configPath, options.cwd);
  return resolveConfiguredTheme(config, {
    themeMode: options.themeMode
  });
}
function MarkdownRenderer(props) {
  const renderer = props.renderer;
  const graphics = useCanvasGraphics(renderer);
  const surface = () => rgbaToHex(theme().background.base);
  const [measured, setMeasured] = createSignal5(0);
  const viewportWidth = () => {
    const explicit = props.columns?.();
    if (explicit !== undefined && explicit > 0)
      return Math.max(8, explicit);
    const width = measured();
    return Math.max(8, width > 0 ? width : renderer.terminalWidth);
  };
  const themeModeSetting = () => typeof props.themeMode === "function" ? props.themeMode() : props.themeMode;
  const mathScale = () => {
    const value = typeof props.mathScale === "function" ? props.mathScale() : props.mathScale;
    return value !== undefined && Number.isFinite(value) && value > 0 ? value : 1;
  };
  const config = createMemo6(() => {
    const provided = typeof props.config === "function" ? props.config() : props.config;
    if (provided)
      return provided;
    return loadRendererConfig(props.configPath, props.cwd, {
      discover: props.discoverConfig,
      report: (message) => {
        const handler = props.onDiagnostic;
        if (handler) {
          handler({ level: "warning", message });
          return;
        }
        console.warn(`[opentui-markdown-render] ${message}`);
      }
    });
  });
  const theme = createMemo6(() => resolveRendererTheme(renderer, {
    theme: props.theme,
    config: config(),
    themeMode: themeModeSetting()
  }));
  const frameSetting = createMemo6(() => {
    const explicit = typeof props.frame === "function" ? props.frame() : props.frame;
    return explicit ?? config().frame;
  });
  const tableSetting = createMemo6(() => {
    const explicit = typeof props.tables === "function" ? props.tables() : props.tables;
    return explicit ?? config().tables;
  });
  const layout = createMemo6(() => resolveConfiguredLayout(config(), { viewport: viewportWidth(), frame: frameSetting(), tables: tableSetting() }));
  const frame = () => layout().frame;
  const contentWidth = () => layout().contentWidth;
  const tableOptions = () => layout().tables;
  const document = createMemo6(() => {
    const ready = props.document;
    if (ready)
      return ready();
    const content = props.content;
    if (!content)
      throw new Error("MarkdownRenderer requires either a content or a document accessor");
    return parseDocument(content());
  });
  const headings = createMemo6(() => resolveHeadingStyles(config().headings));
  let currentSyntax;
  const syntaxStyle = createMemo6(() => {
    currentSyntax?.destroy();
    const nativeScene = renderer.nativeScene;
    currentSyntax = generateSyntax(theme(), headings(), theme().markdown.codeBlock, nativeScene);
    return currentSyntax;
  });
  onCleanup4(() => currentSyntax?.destroy());
  return /* @__PURE__ */ jsxDEV9("box", {
    width: "100%",
    flexDirection: "column",
    flexShrink: 0,
    backgroundColor: theme().background.base,
    onSizeChange: function() {
      const width = this.width;
      if (width !== viewportWidth())
        queueMicrotask(() => setMeasured(width));
    },
    children: /* @__PURE__ */ jsxDEV9(MarkdownFrame, {
      frame: frame(),
      theme: theme(),
      children: /* @__PURE__ */ jsxDEV9(DocumentView, {
        document: document(),
        columns: contentWidth(),
        theme: theme(),
        headings: headings(),
        graphics,
        surface,
        assetBase: () => props.assetBase?.(),
        imageLimits: config().images,
        tableOptions: tableOptions(),
        mermaidOptions: config().mermaid,
        mathScale: mathScale(),
        syntaxStyle: syntaxStyle(),
        onDiagnostic: props.onDiagnostic,
        renderUnit: props.renderUnit
      }, undefined, false, undefined, this)
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}
// node_modules/opentui-markdown-render/src/statusline.tsx
import { For as For3, Show as Show4 } from "solid-js";
import { TextAttributes as TextAttributes5 } from "@opentui/core";
var defaultStatusLineFields = statusLineFields.filter((field) => field !== "text");
// src/canvas.tsx
import { createEffect as createEffect4, createMemo as createMemo7, createResource as createResource4, createSignal as createSignal6, For as For4, Match as Match3, Show as Show5, Switch as Switch3 } from "solid-js";
// node_modules/diff/libesm/diff/base.js
class Diff {
  diff(oldStr, newStr, options = {}) {
    let callback;
    if (typeof options === "function") {
      callback = options;
      options = {};
    } else if ("callback" in options) {
      callback = options.callback;
    }
    const oldString = this.castInput(oldStr, options);
    const newString = this.castInput(newStr, options);
    const oldTokens = this.removeEmpty(this.tokenize(oldString, options));
    const newTokens = this.removeEmpty(this.tokenize(newString, options));
    return this.diffWithOptionsObj(oldTokens, newTokens, options, callback);
  }
  diffWithOptionsObj(oldTokens, newTokens, options, callback) {
    var _a;
    const done = (value) => {
      value = this.postProcess(value, options);
      if (callback) {
        setTimeout(function() {
          callback(value);
        }, 0);
        return;
      } else {
        return value;
      }
    };
    const newLen = newTokens.length, oldLen = oldTokens.length;
    let editLength = 1;
    let maxEditLength = newLen + oldLen;
    if (options.maxEditLength != null) {
      maxEditLength = Math.min(maxEditLength, options.maxEditLength);
    }
    const maxExecutionTime = (_a = options.timeout) !== null && _a !== undefined ? _a : Infinity;
    const abortAfterTimestamp = Date.now() + maxExecutionTime;
    const bestPath = [{ oldPos: -1, lastComponent: undefined }];
    let newPos = this.extractCommon(bestPath[0], newTokens, oldTokens, 0, options);
    if (bestPath[0].oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
      return done(this.buildValues(bestPath[0].lastComponent, newTokens, oldTokens));
    }
    let minDiagonalToConsider = -Infinity, maxDiagonalToConsider = Infinity;
    const execEditLength = () => {
      for (let diagonalPath = Math.max(minDiagonalToConsider, -editLength);diagonalPath <= Math.min(maxDiagonalToConsider, editLength); diagonalPath += 2) {
        let basePath;
        const removePath = bestPath[diagonalPath - 1], addPath = bestPath[diagonalPath + 1];
        if (removePath) {
          bestPath[diagonalPath - 1] = undefined;
        }
        let canAdd = false;
        if (addPath) {
          const addPathNewPos = addPath.oldPos - diagonalPath;
          canAdd = addPath && 0 <= addPathNewPos && addPathNewPos < newLen;
        }
        const canRemove = removePath && removePath.oldPos + 1 < oldLen;
        if (!canAdd && !canRemove) {
          bestPath[diagonalPath] = undefined;
          continue;
        }
        if (!canRemove || canAdd && removePath.oldPos < addPath.oldPos) {
          basePath = this.addToPath(addPath, true, false, 0, options);
        } else {
          basePath = this.addToPath(removePath, false, true, 1, options);
        }
        newPos = this.extractCommon(basePath, newTokens, oldTokens, diagonalPath, options);
        if (basePath.oldPos + 1 >= oldLen && newPos + 1 >= newLen) {
          return done(this.buildValues(basePath.lastComponent, newTokens, oldTokens)) || true;
        } else {
          bestPath[diagonalPath] = basePath;
          if (basePath.oldPos + 1 >= oldLen) {
            maxDiagonalToConsider = Math.min(maxDiagonalToConsider, diagonalPath - 1);
          }
          if (newPos + 1 >= newLen) {
            minDiagonalToConsider = Math.max(minDiagonalToConsider, diagonalPath + 1);
          }
        }
      }
      editLength++;
    };
    if (callback) {
      (function exec() {
        setTimeout(function() {
          if (editLength > maxEditLength || Date.now() > abortAfterTimestamp) {
            return callback(undefined);
          }
          if (!execEditLength()) {
            exec();
          }
        }, 0);
      })();
    } else {
      while (editLength <= maxEditLength && Date.now() <= abortAfterTimestamp) {
        const ret = execEditLength();
        if (ret) {
          return ret;
        }
      }
    }
  }
  addToPath(path, added, removed, oldPosInc, options) {
    const last = path.lastComponent;
    if (last && !options.oneChangePerToken && last.added === added && last.removed === removed) {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: { count: last.count + 1, added, removed, previousComponent: last.previousComponent }
      };
    } else {
      return {
        oldPos: path.oldPos + oldPosInc,
        lastComponent: { count: 1, added, removed, previousComponent: last }
      };
    }
  }
  extractCommon(basePath, newTokens, oldTokens, diagonalPath, options) {
    const newLen = newTokens.length, oldLen = oldTokens.length;
    let oldPos = basePath.oldPos, newPos = oldPos - diagonalPath, commonCount = 0;
    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(oldTokens[oldPos + 1], newTokens[newPos + 1], options)) {
      newPos++;
      oldPos++;
      commonCount++;
      if (options.oneChangePerToken) {
        basePath.lastComponent = { count: 1, previousComponent: basePath.lastComponent, added: false, removed: false };
      }
    }
    if (commonCount && !options.oneChangePerToken) {
      basePath.lastComponent = { count: commonCount, previousComponent: basePath.lastComponent, added: false, removed: false };
    }
    basePath.oldPos = oldPos;
    return newPos;
  }
  equals(left, right, options) {
    if (options.comparator) {
      return options.comparator(left, right);
    } else {
      return left === right || !!options.ignoreCase && left.toLowerCase() === right.toLowerCase();
    }
  }
  removeEmpty(array) {
    const ret = [];
    for (let i = 0;i < array.length; i++) {
      if (array[i]) {
        ret.push(array[i]);
      }
    }
    return ret;
  }
  castInput(value, options) {
    return value;
  }
  tokenize(value, options) {
    return Array.from(value);
  }
  join(chars) {
    return chars.join("");
  }
  postProcess(changeObjects, options) {
    return changeObjects;
  }
  get useLongestToken() {
    return false;
  }
  buildValues(lastComponent, newTokens, oldTokens) {
    const components = [];
    let nextComponent;
    while (lastComponent) {
      components.push(lastComponent);
      nextComponent = lastComponent.previousComponent;
      delete lastComponent.previousComponent;
      lastComponent = nextComponent;
    }
    components.reverse();
    const componentLen = components.length;
    let componentPos = 0, newPos = 0, oldPos = 0;
    for (;componentPos < componentLen; componentPos++) {
      const component = components[componentPos];
      if (!component.removed) {
        if (!component.added && this.useLongestToken) {
          let value = newTokens.slice(newPos, newPos + component.count);
          value = value.map(function(value, i) {
            const oldValue = oldTokens[oldPos + i];
            return oldValue.length > value.length ? oldValue : value;
          });
          component.value = this.join(value);
        } else {
          component.value = this.join(newTokens.slice(newPos, newPos + component.count));
        }
        newPos += component.count;
        if (!component.added) {
          oldPos += component.count;
        }
      } else {
        component.value = this.join(oldTokens.slice(oldPos, oldPos + component.count));
        oldPos += component.count;
      }
    }
    return components;
  }
}

// node_modules/diff/libesm/diff/line.js
class LineDiff extends Diff {
  constructor() {
    super(...arguments);
    this.tokenize = tokenize2;
  }
  equals(left, right, options) {
    if (options.ignoreWhitespace) {
      if (!options.newlineIsToken || !left.includes(`
`)) {
        left = left.trim();
      }
      if (!options.newlineIsToken || !right.includes(`
`)) {
        right = right.trim();
      }
    } else if (options.ignoreNewlineAtEof && !options.newlineIsToken) {
      if (left.endsWith(`
`)) {
        left = left.slice(0, -1);
      }
      if (right.endsWith(`
`)) {
        right = right.slice(0, -1);
      }
    }
    return super.equals(left, right, options);
  }
}
var lineDiff = new LineDiff;
function diffLines(oldStr, newStr, options) {
  return lineDiff.diff(oldStr, newStr, options);
}
function tokenize2(value, options) {
  if (options.stripTrailingCr) {
    value = value.replace(/\r\n/g, `
`);
  }
  const retLines = [], linesAndNewlines = value.split(/(\n|\r\n)/);
  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
    linesAndNewlines.pop();
  }
  for (let i = 0;i < linesAndNewlines.length; i++) {
    const line = linesAndNewlines[i];
    if (i % 2 && !options.newlineIsToken) {
      retLines[retLines.length - 1] += line;
    } else {
      retLines.push(line);
    }
  }
  return retLines;
}

// node_modules/diff/libesm/patch/create.js
var INCLUDE_HEADERS = {
  includeIndex: true,
  includeUnderline: true,
  includeFileHeaders: true
};
function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  let optionsObj;
  if (!options) {
    optionsObj = {};
  } else if (typeof options === "function") {
    optionsObj = { callback: options };
  } else {
    optionsObj = options;
  }
  if (typeof optionsObj.context === "undefined") {
    optionsObj.context = 4;
  }
  const context = optionsObj.context;
  if (optionsObj.newlineIsToken) {
    throw new Error("newlineIsToken may not be used with patch-generation functions, only with diffing functions");
  }
  if (!optionsObj.callback) {
    return diffLinesResultToPatch(diffLines(oldStr, newStr, optionsObj));
  } else {
    const { callback } = optionsObj;
    diffLines(oldStr, newStr, Object.assign(Object.assign({}, optionsObj), { callback: (diff) => {
      const patch = diffLinesResultToPatch(diff);
      callback(patch);
    } }));
  }
  function diffLinesResultToPatch(diff) {
    if (!diff) {
      return;
    }
    diff.push({ value: "", lines: [] });
    function contextLines(lines) {
      return lines.map(function(entry) {
        return " " + entry;
      });
    }
    const hunks = [];
    let oldRangeStart = 0, newRangeStart = 0, curRange = [], oldLine = 1, newLine = 1;
    for (let i = 0;i < diff.length; i++) {
      const current = diff[i], lines = current.lines || splitLines(current.value);
      current.lines = lines;
      if (current.added || current.removed) {
        if (!oldRangeStart) {
          const prev = diff[i - 1];
          oldRangeStart = oldLine;
          newRangeStart = newLine;
          if (prev) {
            curRange = context > 0 ? contextLines(prev.lines.slice(-context)) : [];
            oldRangeStart -= curRange.length;
            newRangeStart -= curRange.length;
          }
        }
        for (const line of lines) {
          curRange.push((current.added ? "+" : "-") + line);
        }
        if (current.added) {
          newLine += lines.length;
        } else {
          oldLine += lines.length;
        }
      } else {
        if (oldRangeStart) {
          if (lines.length <= context * 2 && i < diff.length - 2) {
            for (const line of contextLines(lines)) {
              curRange.push(line);
            }
          } else {
            const contextSize = Math.min(lines.length, context);
            for (const line of contextLines(lines.slice(0, contextSize))) {
              curRange.push(line);
            }
            const hunk = {
              oldStart: oldRangeStart,
              oldLines: oldLine - oldRangeStart + contextSize,
              newStart: newRangeStart,
              newLines: newLine - newRangeStart + contextSize,
              lines: curRange
            };
            hunks.push(hunk);
            oldRangeStart = 0;
            newRangeStart = 0;
            curRange = [];
          }
        }
        oldLine += lines.length;
        newLine += lines.length;
      }
    }
    for (const hunk of hunks) {
      for (let i = 0;i < hunk.lines.length; i++) {
        if (hunk.lines[i].endsWith(`
`)) {
          hunk.lines[i] = hunk.lines[i].slice(0, -1);
        } else {
          hunk.lines.splice(i + 1, 0, "\\ No newline at end of file");
          i++;
        }
      }
    }
    return {
      oldFileName,
      newFileName,
      oldHeader,
      newHeader,
      hunks
    };
  }
}
function formatPatch(patch, headerOptions) {
  if (!headerOptions) {
    headerOptions = INCLUDE_HEADERS;
  }
  if (Array.isArray(patch)) {
    if (patch.length > 1 && !headerOptions.includeFileHeaders) {
      throw new Error("Cannot omit file headers on a multi-file patch. " + "(The result would be unparseable; how would a tool trying to apply " + "the patch know which changes are to which file?)");
    }
    return patch.map((p) => formatPatch(p, headerOptions)).join(`
`);
  }
  const ret = [];
  if (headerOptions.includeIndex && patch.oldFileName == patch.newFileName) {
    ret.push("Index: " + patch.oldFileName);
  }
  if (headerOptions.includeUnderline) {
    ret.push("===================================================================");
  }
  if (headerOptions.includeFileHeaders) {
    ret.push("--- " + patch.oldFileName + (typeof patch.oldHeader === "undefined" ? "" : "\t" + patch.oldHeader));
    ret.push("+++ " + patch.newFileName + (typeof patch.newHeader === "undefined" ? "" : "\t" + patch.newHeader));
  }
  for (let i = 0;i < patch.hunks.length; i++) {
    const hunk = patch.hunks[i];
    if (hunk.oldLines === 0) {
      hunk.oldStart -= 1;
    }
    if (hunk.newLines === 0) {
      hunk.newStart -= 1;
    }
    ret.push("@@ -" + hunk.oldStart + "," + hunk.oldLines + " +" + hunk.newStart + "," + hunk.newLines + " @@");
    for (const line of hunk.lines) {
      ret.push(line);
    }
  }
  return ret.join(`
`) + `
`;
}
function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
  if (typeof options === "function") {
    options = { callback: options };
  }
  if (!(options === null || options === undefined ? undefined : options.callback)) {
    const patchObj = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);
    if (!patchObj) {
      return;
    }
    return formatPatch(patchObj, options === null || options === undefined ? undefined : options.headerOptions);
  } else {
    const { callback } = options;
    structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, Object.assign(Object.assign({}, options), { callback: (patchObj) => {
      if (!patchObj) {
        callback(undefined);
      } else {
        callback(formatPatch(patchObj, options.headerOptions));
      }
    } }));
  }
}
function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
  return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
}
function splitLines(text) {
  const hasTrailingNl = text.endsWith(`
`);
  const result = text.split(`
`).map((line) => line + `
`);
  if (hasTrailingNl) {
    result.pop();
  } else {
    result.push(result.pop().slice(0, -1));
  }
  return result;
}
// src/review.ts
function startReview(baseline, current) {
  return { baseline, current, comments: [] };
}
function addReviewComment(snapshot, comment) {
  return { ...snapshot, comments: [...snapshot.comments, comment] };
}
function updateReviewComment(snapshot, id, update) {
  const comment = snapshot.comments.find((item) => item.id === id);
  if (!comment)
    return snapshot;
  return {
    ...snapshot,
    comments: snapshot.comments.map((item) => item.id === id ? { ...item, range: update.range ?? item.range, message: update.message ?? item.message } : item)
  };
}
function deleteReviewComment(snapshot, id) {
  const comments = snapshot.comments.filter((comment) => comment.id !== id);
  if (comments.length === snapshot.comments.length)
    return snapshot;
  return { ...snapshot, comments };
}
function commentOverlapsBlock(comment, block) {
  return comment.range.start < block.end && comment.range.end > block.start;
}
function assignCommentRails(comments, blocks) {
  const spans = comments.flatMap((comment, order) => {
    const covered = blocks.flatMap((block, index) => commentOverlapsBlock(comment, block) ? [index] : []);
    if (!covered.length)
      return [];
    return [{ comment, start: covered[0], end: covered.at(-1), order }];
  });
  const ends = [];
  return spans.toSorted((a, b) => a.start - b.start || a.order - b.order).map((span) => {
    const column = ends.findIndex((end) => end < span.start);
    if (column < 0) {
      ends.push(span.end);
      return { ...span, column: ends.length - 1 };
    }
    ends[column] = span.end;
    return { ...span, column };
  }).toSorted((a, b) => a.order - b.order).map(({ order: _, ...rail }) => rail);
}
function buildUnifiedDiff(snapshot, filename = "artifact.md") {
  return createPatch(filename, snapshot.baseline, snapshot.current, "", "", { context: 3 });
}
function buildGeneralMessageDraft(snapshot, generalMessage, filePath = "artifact.md") {
  const comments = snapshot.comments.length === 0 ? "- No inline comments." : snapshot.comments.map((comment) => {
    const source = snapshot.current.slice(comment.range.start, comment.range.end);
    return [
      `- [${comment.range.atomKind} ${comment.range.start}-${comment.range.end}] ${comment.message}`,
      "```markdown",
      source,
      "```"
    ].join(`
`);
  }).join(`
`);
  return [
    generalMessage.trim() || "Review the following Artifact Canvas update.",
    "",
    "## Artifact",
    `Path: ${filePath}`,
    "",
    "## Comments",
    comments,
    "",
    "## Diff",
    "```diff",
    buildUnifiedDiff(snapshot, filePath).trimEnd(),
    "```"
  ].join(`
`);
}

// src/theme.ts
function rendererTheme(context) {
  const source = context.theme;
  const markdown = source.markdown;
  const syntax = source.syntax;
  const accent = source.text.action.primary.focused;
  const headingLevels = [
    markdown.heading,
    markdown.heading,
    markdown.heading,
    markdown.heading,
    markdown.heading,
    markdown.heading
  ];
  return {
    mode: context.themeMode,
    accent,
    categorical: source.categorical.map((hue) => hue[context.themeMode === "dark" ? 300 : 700]),
    text: {
      base: source.text.base,
      muted: source.text.muted,
      feedback: {
        error: source.text.feedback.error.base,
        warning: source.text.feedback.warning.base,
        success: source.text.feedback.success.base,
        info: source.text.feedback.info.base
      },
      action: { primary: { focused: accent } }
    },
    background: { base: source.background.base },
    border: { base: source.border.base },
    frame: { border: source.border.base, title: source.text.muted },
    markdown: {
      text: markdown.text,
      heading: markdown.heading,
      headingLevels,
      link: markdown.link,
      linkText: markdown.linkText,
      code: markdown.code,
      blockQuote: markdown.blockQuote,
      emphasis: markdown.emphasis,
      strong: markdown.strong,
      horizontalRule: markdown.horizontalRule,
      listItem: markdown.listItem,
      listEnumeration: markdown.listEnumeration,
      image: markdown.image,
      imageText: markdown.imageText,
      codeBlock: markdown.codeBlock
    },
    syntax: {
      comment: syntax.comment,
      keyword: syntax.keyword,
      function: syntax.function,
      variable: syntax.variable,
      string: syntax.string,
      number: syntax.number,
      type: syntax.type,
      operator: syntax.operator,
      punctuation: syntax.punctuation
    },
    diff: {
      text: {
        added: source.diff.text.added,
        removed: source.diff.text.removed,
        context: source.diff.text.context
      },
      background: {
        added: source.diff.background.added,
        removed: source.diff.background.removed,
        context: source.diff.background.context
      }
    }
  };
}

// src/canvas.tsx
function canvasReviewColors(theme) {
  const canvas = theme;
  return canvas.canvas?.review ?? {
    cursor: theme.text.base,
    selection: theme.background.raised.base,
    comment: theme.text.feedback.warning.base,
    commentBackground: theme.background.raised.base
  };
}
function documentReviewUnits(document) {
  const units = [];
  for (const block of document.blocks) {
    if (block.type === "list") {
      for (const item of block.items)
        units.push({
          kind: "list-item",
          item,
          source: item.source
        });
    } else {
      units.push({
        kind: "block",
        block,
        source: block.source
      });
    }
  }
  return units;
}
function unitAtomKind(info) {
  if (info.kind === "block" && info.block.type === "display-math")
    return "formula";
  if (info.kind === "block" && info.block.type === "mermaid")
    return "mermaid";
  return "text";
}
function sameRange2(left, right) {
  return left?.start === right?.start && left?.end === right?.end;
}
function unitIndex(units, info) {
  const identity = units.findIndex((unit) => unit.kind === info.kind && (unit.kind === "block" ? unit.block === (info.kind === "block" && info.block) : unit.item === (info.kind === "list-item" && info.item)));
  if (identity >= 0)
    return identity;
  return units.findIndex((unit) => unit.kind === info.kind && sameRange2(unit.source, info.source));
}
function CanvasPage(props) {
  const theme = props.context.theme;
  const cwd = process.cwd();
  const graphics = useCanvasGraphics(props.context.renderer);
  const renderTheme = createMemo7(() => rendererTheme(props.context));
  const [mode, setMode] = createSignal6("rendered");
  const [phase, setPhase] = createSignal6("edit");
  const [baseline, setBaseline] = createSignal6();
  const [review, setReview] = createSignal6();
  const [cursor, setCursor] = createSignal6(0);
  const [visualStart, setVisualStart] = createSignal6();
  const [width, setWidth] = createSignal6(0);
  const [content, {
    refetch
  }] = createResource4(props.file, async (file) => {
    if (!file)
      return;
    const artifact = Bun.file(file);
    if (!await artifact.exists())
      return {
        file,
        error: `Artifact does not exist: ${file}`
      };
    try {
      return {
        file,
        value: await artifact.text()
      };
    } catch (error) {
      return {
        file,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });
  const loaded = () => {
    const result = content();
    return result?.file === props.file() ? result : undefined;
  };
  const document = createMemo7(() => parseDocument(loaded()?.value ?? ""));
  const units = createMemo7(() => documentReviewUnits(document()));
  const rails = createMemo7(() => assignCommentRails(review()?.comments ?? [], units().map((unit) => unit.source ?? {
    start: -1,
    end: -1
  })));
  const railCount = createMemo7(() => Math.max(0, ...rails().map((rail) => rail.column + 1)));
  const available = () => Math.max(8, width() - 4 - railCount());
  let baselineFile;
  createEffect4(() => {
    const file = props.file();
    const value = loaded()?.value;
    if (!file || value === undefined || baselineFile === file)
      return;
    baselineFile = file;
    setBaseline(value);
    setPhase("edit");
    setReview();
    setCursor(0);
    setVisualStart();
  });
  createEffect4(() => {
    const last = Math.max(0, units().length - 1);
    if (cursor() > last)
      setCursor(last);
  });
  const selectedRange = () => {
    const items = units();
    const start = visualStart();
    if (start === undefined || !items.length)
      return;
    const from = Math.min(start, cursor());
    const to = Math.max(start, cursor());
    const first = items[from];
    const last = items[to];
    if (!first?.source || !last?.source)
      return;
    return {
      start: first.source.start,
      end: last.source.end,
      atomKind: from === to ? unitAtomKind(first) : "text"
    };
  };
  const moveCursor = (delta) => setCursor((value) => Math.max(0, Math.min(Math.max(0, units().length - 1), value + delta)));
  const enterReview = () => {
    const value = loaded()?.value;
    if (value === undefined)
      return;
    setReview(startReview(baseline() ?? value, value));
    setPhase("review");
    setMode("rendered");
    setCursor(0);
    setVisualStart();
  };
  const leaveReview = () => {
    setPhase("edit");
    setReview();
    setVisualStart();
  };
  const showHelp = () => props.context.ui.dialog.alert({
    title: "Artifact Canvas",
    message: phase() === "review" ? ["r  finish review", "j/k or arrows  move between blocks", "v  start a visual block selection", "c  comment selection", "d  delete comment on selection", "shift+s  compose and send review feedback", "q  close canvas", "Esc  cancel selection or close canvas"].join(`
`) : ["r  start review", "s  toggle rendered/source", "e  edit artifact", "+/-  resize display math", "q or Esc  close canvas"].join(`
`)
  });
  const addComment = async () => {
    const range = selectedRange();
    if (!range) {
      props.context.ui.toast.show({
        variant: "warning",
        message: "Select review blocks with exact source ranges first"
      });
      return;
    }
    const message = await props.context.ui.dialog.prompt({
      title: "Review comment",
      placeholder: "What should change?"
    });
    if (!message?.trim() || !review())
      return;
    setReview((value) => value ? addReviewComment(value, {
      id: crypto.randomUUID(),
      range,
      message: message.trim()
    }) : value);
    setVisualStart();
  };
  const sendReview = async () => {
    const current = review();
    const sessionID = props.sessionID?.();
    const file = props.file();
    if (!current)
      return;
    if (!sessionID) {
      props.context.ui.toast.show({
        variant: "warning",
        message: "Open Canvas from a session to send review feedback"
      });
      return;
    }
    const general = await props.context.ui.dialog.prompt({
      title: "Send review feedback",
      placeholder: "Give the model an overall instruction",
      value: "Please address these review notes."
    });
    if (general === undefined)
      return;
    await props.context.client.session.prompt({
      sessionID,
      text: buildGeneralMessageDraft(current, general, file ?? "artifact.md"),
      delivery: "steer"
    }).then(() => props.context.ui.toast.show({
      variant: "success",
      message: "Review feedback sent"
    })).catch((error) => props.context.ui.toast.show({
      variant: "error",
      message: String(error)
    }));
  };
  const editComment = async (id) => {
    const current = review();
    const comment = current?.comments.find((item) => item.id === id);
    if (!current || !comment)
      return;
    const message = await props.context.ui.dialog.prompt({
      title: "Edit review comment",
      value: comment.message,
      placeholder: "What should change?"
    });
    if (message !== undefined)
      setReview(updateReviewComment(current, id, {
        message: message.trim()
      }));
  };
  props.context.keymap.layer(() => ({
    enabled: () => props.active?.() ?? true,
    commands: [{
      bind: "escape",
      title: "back",
      run: () => visualStart() !== undefined ? setVisualStart() : props.onClose()
    }, {
      bind: "s",
      title: mode() === "source" ? "rendered" : "source",
      run: () => setMode(mode() === "source" ? "rendered" : "source")
    }, {
      bind: "e",
      title: "edit artifact",
      run: () => phase() === "review" ? props.context.ui.toast.show({
        variant: "warning",
        message: "Leave review mode before editing the artifact"
      }) : void editArtifact(props.context, props.file(), cwd, refetch)
    }, {
      bind: "r",
      title: phase() === "review" ? "leave review" : "start review",
      run: () => phase() === "review" ? leaveReview() : enterReview()
    }, {
      bind: "q",
      title: "close canvas",
      run: props.onClose
    }, {
      bind: "h",
      title: "canvas help",
      run: () => void showHelp()
    }, {
      bind: "j",
      title: "next block",
      enabled: () => phase() === "review",
      run: () => moveCursor(1)
    }, {
      bind: "down",
      title: "next block",
      enabled: () => phase() === "review",
      run: () => moveCursor(1)
    }, {
      bind: "k",
      title: "previous block",
      enabled: () => phase() === "review",
      run: () => moveCursor(-1)
    }, {
      bind: "up",
      title: "previous block",
      enabled: () => phase() === "review",
      run: () => moveCursor(-1)
    }, {
      bind: "v",
      title: "visual select",
      enabled: () => phase() === "review",
      run: () => setVisualStart((value) => value ?? cursor())
    }, {
      bind: "c",
      title: "comment selection",
      enabled: () => phase() === "review",
      run: () => void addComment()
    }, {
      bind: "d",
      title: "delete selected comment",
      enabled: () => phase() === "review",
      run: () => {
        const range = selectedRange();
        const current = review();
        const comment = range && current?.comments.find((item) => item.range.start === range.start && item.range.end === range.end);
        if (comment && current)
          setReview(deleteReviewComment(current, comment.id));
      }
    }, {
      bind: "shift+s",
      title: "compose review feedback",
      enabled: () => phase() === "review",
      run: () => void sendReview()
    }, {
      bind: "+",
      title: "bigger display math",
      run: () => props.onMathSize(1)
    }, {
      bind: "=",
      title: "bigger display math",
      run: () => props.onMathSize(1)
    }, {
      bind: "-",
      title: "smaller display math",
      run: () => props.onMathSize(-1)
    }, {
      bind: "_",
      title: "smaller display math",
      run: () => props.onMathSize(-1)
    }]
  }));
  const label = () => {
    const file = props.file();
    return file ? path5.relative(cwd, file) || file : "No artifact selected";
  };
  const header = createMemo7(() => {
    const columns = width();
    if (columns < 50)
      return {
        image: "",
        status: `${props.mathSize().toFixed(1)}x`
      };
    if (columns < 78)
      return {
        image: `img:${graphics.protocol()}`,
        status: `${props.mathSize().toFixed(1)}x +/- r s e q`
      };
    if (columns < 120) {
      return {
        image: `img:${graphics.protocol()}`,
        status: `${props.presentation} ${columns}c ${mode()} ${phase()} ${props.mathSize().toFixed(1)}x h r s e q`
      };
    }
    return {
      image: `img:${graphics.protocol()} ${graphics.cell() ? `px:${graphics.cell().width}x${graphics.cell().height}` : "px:?"}`,
      status: `${props.presentation} ${columns}c ${mode()} ${phase()} display ${props.mathSize().toFixed(1)}x h help - r review - s source - e edit - q close`
    };
  });
  const renderUnit = (info, rendered) => _$createComponent(CanvasReviewUnit, {
    info,
    rendered,
    units,
    rails,
    railCount,
    review,
    phase,
    cursor,
    visualStart,
    theme,
    onDelete: (id) => setReview((value) => value ? deleteReviewComment(value, id) : value),
    onEdit: editComment
  });
  return (() => {
    var _el$ = _$createElement("box"), _el$2 = _$createElement("box"), _el$3 = _$createElement("text"), _el$6 = _$createElement("text"), _el$7 = _$createElement("text"), _el$8 = _$createElement("scrollbox");
    _$insertNode(_el$, _el$2);
    _$insertNode(_el$, _el$8);
    _$setProp(_el$, "width", "100%");
    _$setProp(_el$, "height", "100%");
    _$setProp(_el$, "flexDirection", "column");
    _$setProp(_el$, "onSizeChange", function() {
      setWidth(this.width);
    });
    _$insertNode(_el$2, _el$3);
    _$insertNode(_el$2, _el$6);
    _$insertNode(_el$2, _el$7);
    _$setProp(_el$2, "flexShrink", 0);
    _$setProp(_el$2, "flexDirection", "row");
    _$setProp(_el$2, "gap", 1);
    _$setProp(_el$2, "paddingLeft", 1);
    _$setProp(_el$2, "paddingRight", 1);
    _$setProp(_el$2, "border", ["bottom"]);
    _$insertNode(_el$3, _$createTextNode(`canvas`));
    _$setProp(_el$3, "flexShrink", 0);
    _$insert(_el$2, _$createComponent(Show5, {
      get when() {
        return header().image;
      },
      get children() {
        var _el$5 = _$createElement("text");
        _$setProp(_el$5, "flexShrink", 0);
        _$insert(_el$5, () => header().image);
        _$effect((_$p) => _$setProp(_el$5, "fg", theme.text.muted, _$p));
        return _el$5;
      }
    }), _el$6);
    _$setProp(_el$6, "flexGrow", 1);
    _$setProp(_el$6, "minWidth", 0);
    _$setProp(_el$6, "wrapMode", "none");
    _$setProp(_el$6, "truncate", true);
    _$insert(_el$6, label);
    _$setProp(_el$7, "flexShrink", 0);
    _$insert(_el$7, () => header().status);
    _$setProp(_el$8, "flexGrow", 1);
    _$setProp(_el$8, "contentOptions", {
      minHeight: "100%",
      paddingLeft: 2,
      paddingRight: 2,
      paddingTop: 1,
      paddingBottom: 1
    });
    _$insert(_el$8, _$createComponent(Switch3, {
      get children() {
        return [_$createComponent(Match3, {
          get when() {
            return !props.file();
          },
          get children() {
            var _el$9 = _$createElement("box"), _el$0 = _$createElement("text"), _el$10 = _$createElement("text");
            _$insertNode(_el$9, _el$0);
            _$insertNode(_el$9, _el$10);
            _$setProp(_el$9, "flexDirection", "column");
            _$setProp(_el$9, "gap", 1);
            _$insertNode(_el$0, _$createTextNode(`Open a Markdown artifact with /canvas path/to/file.md`));
            _$insertNode(_el$10, _$createTextNode(`Rendered mode supports Markdown, math, Mermaid, tables, and local images.`));
            _$effect((_p$) => {
              var _v$ = theme.text.base, _v$2 = TextAttributes6.BOLD, _v$3 = theme.text.muted;
              _v$ !== _p$.e && (_p$.e = _$setProp(_el$0, "fg", _v$, _p$.e));
              _v$2 !== _p$.t && (_p$.t = _$setProp(_el$0, "attributes", _v$2, _p$.t));
              _v$3 !== _p$.a && (_p$.a = _$setProp(_el$10, "fg", _v$3, _p$.a));
              return _p$;
            }, {
              e: undefined,
              t: undefined,
              a: undefined
            });
            return _el$9;
          }
        }), _$createComponent(Match3, {
          get when() {
            return loaded()?.error;
          },
          get children() {
            var _el$12 = _$createElement("box"), _el$13 = _$createElement("text"), _el$15 = _$createElement("text");
            _$insertNode(_el$12, _el$13);
            _$insertNode(_el$12, _el$15);
            _$setProp(_el$12, "flexDirection", "column");
            _$setProp(_el$12, "gap", 1);
            _$insertNode(_el$13, _$createTextNode(`Could not load artifact`));
            _$insert(_el$15, () => loaded().error);
            _$effect((_p$) => {
              var _v$4 = theme.text.feedback.error.base, _v$5 = theme.text.muted;
              _v$4 !== _p$.e && (_p$.e = _$setProp(_el$13, "fg", _v$4, _p$.e));
              _v$5 !== _p$.t && (_p$.t = _$setProp(_el$15, "fg", _v$5, _p$.t));
              return _p$;
            }, {
              e: undefined,
              t: undefined
            });
            return _el$12;
          }
        }), _$createComponent(Match3, {
          get when() {
            return content.loading;
          },
          get children() {
            var _el$16 = _$createElement("text");
            _$insertNode(_el$16, _$createTextNode(`Loading artifact...`));
            _$effect((_$p) => _$setProp(_el$16, "fg", theme.text.muted, _$p));
            return _el$16;
          }
        }), _$createComponent(Match3, {
          get when() {
            return loaded()?.value !== undefined;
          },
          get children() {
            return _$createComponent(Show5, {
              get when() {
                return mode() === "rendered";
              },
              get fallback() {
                return (() => {
                  var _el$18 = _$createElement("text");
                  _$setProp(_el$18, "wrapMode", "word");
                  _$insert(_el$18, () => loaded().value);
                  _$effect((_$p) => _$setProp(_el$18, "fg", theme.text.base, _$p));
                  return _el$18;
                })();
              },
              get children() {
                return _$createComponent(MarkdownRenderer, {
                  document,
                  get renderer() {
                    return props.context.renderer;
                  },
                  columns: available,
                  assetBase: () => props.file() ? path5.dirname(props.file()) : undefined,
                  theme: renderTheme,
                  get mathScale() {
                    return props.mathSize;
                  },
                  frame: {
                    enabled: false
                  },
                  config: {
                    images: {
                      maxRows: 24
                    }
                  },
                  discoverConfig: false,
                  renderUnit,
                  onDiagnostic: ({
                    message
                  }) => props.context.ui.toast.show({
                    variant: "warning",
                    message
                  })
                });
              }
            });
          }
        })];
      }
    }));
    _$effect((_p$) => {
      var _v$6 = theme.background.base, _v$7 = props.presentation === "panel" ? ["left"] : false, _v$8 = theme.border.base, _v$9 = theme.decrease(theme.background.base), _v$0 = theme.text.base, _v$1 = TextAttributes6.BOLD, _v$10 = theme.text.muted, _v$11 = theme.text.muted;
      _v$6 !== _p$.e && (_p$.e = _$setProp(_el$, "backgroundColor", _v$6, _p$.e));
      _v$7 !== _p$.t && (_p$.t = _$setProp(_el$, "border", _v$7, _p$.t));
      _v$8 !== _p$.a && (_p$.a = _$setProp(_el$, "borderColor", _v$8, _p$.a));
      _v$9 !== _p$.o && (_p$.o = _$setProp(_el$2, "borderColor", _v$9, _p$.o));
      _v$0 !== _p$.i && (_p$.i = _$setProp(_el$3, "fg", _v$0, _p$.i));
      _v$1 !== _p$.n && (_p$.n = _$setProp(_el$3, "attributes", _v$1, _p$.n));
      _v$10 !== _p$.s && (_p$.s = _$setProp(_el$6, "fg", _v$10, _p$.s));
      _v$11 !== _p$.h && (_p$.h = _$setProp(_el$7, "fg", _v$11, _p$.h));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined,
      n: undefined,
      s: undefined,
      h: undefined
    });
    return _el$;
  })();
}
function CanvasReviewUnit(props) {
  const index = () => unitIndex(props.units(), props.info());
  const colors = () => canvasReviewColors(props.theme);
  const activeRails = () => props.rails().filter((rail) => rail.start <= index() && rail.end >= index());
  const endingRails = () => props.rails().filter((rail) => rail.end === index());
  const selected = () => {
    const start = props.visualStart();
    return start !== undefined && props.phase() === "review" && index() >= Math.min(start, props.cursor()) && index() <= Math.max(start, props.cursor());
  };
  const active = () => props.phase() === "review" && index() === props.cursor();
  const commented = () => activeRails().length > 0;
  return [(() => {
    var _el$19 = _$createElement("box"), _el$20 = _$createElement("box");
    _$insertNode(_el$19, _el$20);
    _$setProp(_el$19, "width", "100%");
    _$setProp(_el$19, "flexDirection", "row");
    _$setProp(_el$20, "flexGrow", 1);
    _$setProp(_el$20, "minWidth", 0);
    _$setProp(_el$20, "flexDirection", "column");
    _$insert(_el$20, _$createComponent(Show5, {
      get when() {
        return activeRails().some((rail) => rail.start === index());
      },
      get children() {
        var _el$21 = _$createElement("box"), _el$22 = _$createElement("text"), _el$23 = _$createTextNode(`comment `);
        _$insertNode(_el$21, _el$22);
        _$setProp(_el$21, "width", "100%");
        _$setProp(_el$21, "flexDirection", "row");
        _$setProp(_el$21, "justifyContent", "flex-end");
        _$insertNode(_el$22, _el$23);
        _$insert(_el$22, () => activeRails().filter((rail) => rail.start === index()).map((rail) => `#${(props.review()?.comments.indexOf(rail.comment) ?? -1) + 1}`).join(", "), null);
        _$effect((_p$) => {
          var _v$12 = colors().comment, _v$13 = TextAttributes6.BOLD;
          _v$12 !== _p$.e && (_p$.e = _$setProp(_el$22, "fg", _v$12, _p$.e));
          _v$13 !== _p$.t && (_p$.t = _$setProp(_el$22, "attributes", _v$13, _p$.t));
          return _p$;
        }, {
          e: undefined,
          t: undefined
        });
        return _el$21;
      }
    }), null);
    _$insert(_el$20, () => props.rendered, null);
    _$insert(_el$20, _$createComponent(Show5, {
      get when() {
        return active();
      },
      get children() {
        var _el$24 = _$createElement("box"), _el$25 = _$createElement("text");
        _$insertNode(_el$24, _el$25);
        _$setProp(_el$24, "paddingLeft", 1);
        _$setProp(_el$24, "paddingRight", 1);
        _$setProp(_el$24, "flexDirection", "row");
        _$setProp(_el$24, "justifyContent", "flex-end");
        _$insertNode(_el$25, _$createTextNode(`review cursor`));
        _$effect((_p$) => {
          var _v$14 = colors().comment, _v$15 = TextAttributes6.BOLD;
          _v$14 !== _p$.e && (_p$.e = _$setProp(_el$25, "fg", _v$14, _p$.e));
          _v$15 !== _p$.t && (_p$.t = _$setProp(_el$25, "attributes", _v$15, _p$.t));
          return _p$;
        }, {
          e: undefined,
          t: undefined
        });
        return _el$24;
      }
    }), null);
    _$insert(_el$19, _$createComponent(CanvasCommentRails, {
      get theme() {
        return props.theme;
      },
      get columns() {
        return props.railCount;
      },
      rails: activeRails
    }), null);
    _$effect((_p$) => {
      var _v$16 = selected() ? colors().selection : commented() ? colors().commentBackground : undefined, _v$17 = active() ? ["top", "right", "bottom", "left"] : undefined, _v$18 = active() ? colors().cursor : undefined;
      _v$16 !== _p$.e && (_p$.e = _$setProp(_el$20, "backgroundColor", _v$16, _p$.e));
      _v$17 !== _p$.t && (_p$.t = _$setProp(_el$20, "border", _v$17, _p$.t));
      _v$18 !== _p$.a && (_p$.a = _$setProp(_el$20, "borderColor", _v$18, _p$.a));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined
    });
    return _el$19;
  })(), _$createComponent(For4, {
    get each() {
      return endingRails();
    },
    children: (rail) => (() => {
      var _el$27 = _$createElement("box"), _el$28 = _$createElement("box");
      _$insertNode(_el$27, _el$28);
      _$setProp(_el$27, "width", "100%");
      _$setProp(_el$27, "flexDirection", "row");
      _$setProp(_el$28, "flexGrow", 1);
      _$setProp(_el$28, "minWidth", 0);
      _$insert(_el$28, _$createComponent(CanvasCommentCard, {
        get theme() {
          return props.theme;
        },
        get comment() {
          return rail.comment;
        },
        get number() {
          return props.review()?.comments.indexOf(rail.comment) ?? -1;
        },
        get onDelete() {
          return props.onDelete;
        },
        get onEdit() {
          return props.onEdit;
        }
      }));
      _$insert(_el$27, _$createComponent(CanvasCommentRails, {
        get theme() {
          return props.theme;
        },
        get columns() {
          return props.railCount;
        },
        rails: activeRails,
        connector: () => rail.column
      }), null);
      return _el$27;
    })()
  })];
}
function CanvasCommentRails(props) {
  const colors = () => canvasReviewColors(props.theme);
  return (() => {
    var _el$29 = _$createElement("box");
    _$setProp(_el$29, "flexShrink", 0);
    _$setProp(_el$29, "flexDirection", "row");
    _$insert(_el$29, _$createComponent(For4, {
      get each() {
        return Array.from({
          length: props.columns()
        }, (_, column) => column);
      },
      children: (column) => _$createComponent(Show5, {
        get when() {
          return props.connector?.() === column;
        },
        get fallback() {
          return _$createComponent(Show5, {
            get when() {
              return props.rails().some((rail) => rail.column === column);
            },
            get fallback() {
              return (() => {
                var _el$35 = _$createElement("box");
                _$setProp(_el$35, "width", 1);
                return _el$35;
              })();
            },
            get children() {
              var _el$34 = _$createElement("box");
              _$setProp(_el$34, "width", 1);
              _$setProp(_el$34, "height", "100%");
              _$setProp(_el$34, "border", ["left"]);
              _$effect((_$p) => _$setProp(_el$34, "borderColor", colors().comment, _$p));
              return _el$34;
            }
          });
        },
        get children() {
          var _el$30 = _$createElement("box"), _el$31 = _$createElement("text"), _el$33 = _$createElement("box");
          _$insertNode(_el$30, _el$31);
          _$insertNode(_el$30, _el$33);
          _$setProp(_el$30, "width", 1);
          _$setProp(_el$30, "height", "100%");
          _$setProp(_el$30, "flexDirection", "column");
          _$insertNode(_el$31, _$createTextNode(`\u2524`));
          _$setProp(_el$33, "flexGrow", 1);
          _$setProp(_el$33, "minHeight", 0);
          _$setProp(_el$33, "border", ["left"]);
          _$effect((_p$) => {
            var _v$19 = colors().comment, _v$20 = colors().comment;
            _v$19 !== _p$.e && (_p$.e = _$setProp(_el$31, "fg", _v$19, _p$.e));
            _v$20 !== _p$.t && (_p$.t = _$setProp(_el$33, "borderColor", _v$20, _p$.t));
            return _p$;
          }, {
            e: undefined,
            t: undefined
          });
          return _el$30;
        }
      })
    }));
    _$effect((_$p) => _$setProp(_el$29, "width", props.columns(), _$p));
    return _el$29;
  })();
}
function CanvasCommentCard(props) {
  const colors = () => canvasReviewColors(props.theme);
  return (() => {
    var _el$36 = _$createElement("box"), _el$37 = _$createElement("box"), _el$38 = _$createElement("box"), _el$39 = _$createElement("text"), _el$40 = _$createTextNode(`#`), _el$41 = _$createTextNode(` `), _el$42 = _$createElement("text"), _el$44 = _$createElement("box"), _el$45 = _$createElement("text"), _el$47 = _$createElement("text");
    _$insertNode(_el$36, _el$37);
    _$insertNode(_el$36, _el$44);
    _$setProp(_el$36, "paddingLeft", 1);
    _$setProp(_el$36, "flexDirection", "column");
    _$insertNode(_el$37, _el$38);
    _$insertNode(_el$37, _el$42);
    _$setProp(_el$37, "width", "100%");
    _$setProp(_el$37, "flexDirection", "row");
    _$insertNode(_el$38, _el$39);
    _$setProp(_el$38, "flexGrow", 1);
    _$setProp(_el$38, "minWidth", 0);
    _$setProp(_el$38, "paddingLeft", 1);
    _$setProp(_el$38, "paddingRight", 1);
    _$setProp(_el$38, "flexDirection", "row");
    _$setProp(_el$38, "justifyContent", "flex-end");
    _$setProp(_el$38, "border", ["top", "right", "bottom", "left"]);
    _$insertNode(_el$39, _el$40);
    _$insertNode(_el$39, _el$41);
    _$setProp(_el$39, "wrapMode", "word");
    _$setProp(_el$39, "flexShrink", 1);
    _$insert(_el$39, () => props.number + 1, _el$41);
    _$insert(_el$39, () => props.comment.message, null);
    _$insertNode(_el$42, _$createTextNode(`\u2500\u2500\u2500`));
    _$setProp(_el$42, "width", 3);
    _$insertNode(_el$44, _el$45);
    _$insertNode(_el$44, _el$47);
    _$setProp(_el$44, "paddingTop", 1);
    _$setProp(_el$44, "paddingRight", 1);
    _$setProp(_el$44, "gap", 1);
    _$setProp(_el$44, "flexDirection", "row");
    _$setProp(_el$44, "justifyContent", "flex-end");
    _$insertNode(_el$45, _$createTextNode(`edit`));
    _$setProp(_el$45, "flexShrink", 0);
    _$setProp(_el$45, "onMouseUp", () => props.onEdit(props.comment.id));
    _$insertNode(_el$47, _$createTextNode(`delete`));
    _$setProp(_el$47, "flexShrink", 0);
    _$setProp(_el$47, "onMouseUp", () => props.onDelete(props.comment.id));
    _$effect((_p$) => {
      var _v$21 = colors().commentBackground, _v$22 = colors().comment, _v$23 = props.theme.text.base, _v$24 = TextAttributes6.BOLD, _v$25 = colors().comment, _v$26 = props.theme.text.muted, _v$27 = props.theme.text.muted;
      _v$21 !== _p$.e && (_p$.e = _$setProp(_el$36, "backgroundColor", _v$21, _p$.e));
      _v$22 !== _p$.t && (_p$.t = _$setProp(_el$38, "borderColor", _v$22, _p$.t));
      _v$23 !== _p$.a && (_p$.a = _$setProp(_el$39, "fg", _v$23, _p$.a));
      _v$24 !== _p$.o && (_p$.o = _$setProp(_el$39, "attributes", _v$24, _p$.o));
      _v$25 !== _p$.i && (_p$.i = _$setProp(_el$42, "fg", _v$25, _p$.i));
      _v$26 !== _p$.n && (_p$.n = _$setProp(_el$45, "fg", _v$26, _p$.n));
      _v$27 !== _p$.s && (_p$.s = _$setProp(_el$47, "fg", _v$27, _p$.s));
      return _p$;
    }, {
      e: undefined,
      t: undefined,
      a: undefined,
      o: undefined,
      i: undefined,
      n: undefined,
      s: undefined
    });
    return _el$36;
  })();
}
async function editArtifact(context, file, cwd, refetch) {
  if (!file)
    return;
  const editor = process.env.VISUAL || process.env.EDITOR;
  if (!editor) {
    context.ui.toast.show({
      variant: "warning",
      message: "Set VISUAL or EDITOR to edit the artifact"
    });
    return;
  }
  context.renderer.suspend();
  context.renderer.currentRenderBuffer.clear();
  try {
    await new Promise((resolve, reject) => {
      const parts = editor.split(" ");
      const child = spawn(parts[0], [...parts.slice(1), file], {
        cwd,
        stdio: "inherit",
        shell: process.platform === "win32"
      });
      child.on("error", reject);
      child.on("exit", (code, signal) => code === 0 ? resolve() : reject(new Error(`Editor exited with ${signal ? `signal ${signal}` : `code ${code}`}`)));
    });
    refetch();
  } catch (error) {
    context.ui.toast.show({
      variant: "error",
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    context.renderer.currentRenderBuffer.clear();
    context.renderer.resume();
    context.renderer.requestRender();
  }
}
var canvas_default = {
  id: "opencode.artifact-canvas",
  setup(context) {
    if (process.env.OPENCODE_ARTIFACT_CANVAS_LINKAGE_DEBUG) {
      console.error("[artifact-canvas] host OpenTUI identity:", context.renderer.root instanceof BaseRenderable);
    }
    const [file, setFile] = createSignal6();
    const [previous, setPrevious] = createSignal6({
      ...context.ui.router.current()
    });
    const [settings, updateSettings] = context.storage.store("canvas", {
      initial: {
        mathScale: 1
      }
    });
    const mathSize = () => Math.min(2, Math.max(0.5, Math.round((settings.mathScale ?? 1) * 10) / 10));
    const resizeMath = (delta) => void updateSettings((draft) => {
      draft.mathScale = Math.min(2, Math.max(0.5, Math.round((mathSize() + delta * 0.1) * 10) / 10));
    });
    context.ui.router.register({
      name: "artifact-canvas",
      render: () => _$createComponent(CanvasPage, {
        context,
        file,
        onClose: () => context.ui.router.navigate(previous()),
        presentation: "fullscreen",
        sessionID: () => {
          const route = previous();
          return route.type === "session" ? route.sessionID : undefined;
        },
        mathSize,
        onMathSize: resizeMath
      })
    });
    context.ui.slot({
      append: "session.panel",
      render(input) {
        if (input.name !== "artifact-canvas")
          return null;
        return _$createComponent(CanvasPage, {
          context,
          file,
          get onClose() {
            return input.close;
          },
          active: () => input.focused,
          get presentation() {
            return input.presentation;
          },
          sessionID: () => input.sessionID,
          mathSize,
          onMathSize: resizeMath
        });
      }
    });
    context.ui.slot({
      append: "app",
      render() {
        context.keymap.layer(() => ({
          mode: "global",
          commands: [{
            id: "canvas.open",
            title: "Open artifact canvas",
            description: "Render and review a Markdown artifact",
            group: "System",
            palette: true,
            slash: {
              name: "canvas",
              arguments: true
            },
            run(input) {
              const current = context.ui.router.current();
              setFile(input?.trim() ? path5.resolve(process.cwd(), input.trim()) : undefined);
              context.ui.dialog.clear();
              if (context.ui.panel.open("artifact-canvas", {
                presentation: "panel"
              }))
                return;
              if (current.type === "session")
                context.ui.toast.show({
                  variant: "warning",
                  message: "Canvas panel could not open; falling back to fullscreen"
                });
              if (current.type !== "plugin" || current.name !== "artifact-canvas")
                setPrevious({
                  ...current
                });
              context.ui.router.navigate({
                type: "plugin",
                name: "artifact-canvas"
              });
            }
          }]
        }));
        return null;
      }
    });
  }
};
export {
  canvas_default as default
};
