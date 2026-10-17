"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/postgres-array/index.js
var require_postgres_array = __commonJS({
  "node_modules/postgres-array/index.js"(exports2) {
    "use strict";
    exports2.parse = function(source, transform) {
      return new ArrayParser(source, transform).parse();
    };
    var ArrayParser = class _ArrayParser {
      constructor(source, transform) {
        this.source = source, this.transform = transform || identity, this.position = 0, this.entries = [], this.recorded = [], this.dimension = 0;
      }
      isEof() {
        return this.position >= this.source.length;
      }
      nextCharacter() {
        var character = this.source[this.position++];
        return character === "\\" ? {
          value: this.source[this.position++],
          escaped: !0
        } : {
          value: character,
          escaped: !1
        };
      }
      record(character) {
        this.recorded.push(character);
      }
      newEntry(includeEmpty) {
        var entry;
        (this.recorded.length > 0 || includeEmpty) && (entry = this.recorded.join(""), entry === "NULL" && !includeEmpty && (entry = null), entry !== null && (entry = this.transform(entry)), this.entries.push(entry), this.recorded = []);
      }
      consumeDimensions() {
        if (this.source[0] === "[")
          for (; !this.isEof(); ) {
            var char = this.nextCharacter();
            if (char.value === "=") break;
          }
      }
      parse(nested) {
        var character, parser, quote;
        for (this.consumeDimensions(); !this.isEof(); )
          if (character = this.nextCharacter(), character.value === "{" && !quote)
            this.dimension++, this.dimension > 1 && (parser = new _ArrayParser(this.source.substr(this.position - 1), this.transform), this.entries.push(parser.parse(!0)), this.position += parser.position - 2);
          else if (character.value === "}" && !quote) {
            if (this.dimension--, !this.dimension && (this.newEntry(), nested))
              return this.entries;
          } else character.value === '"' && !character.escaped ? (quote && this.newEntry(!0), quote = !quote) : character.value === "," && !quote ? this.newEntry() : this.record(character.value);
        if (this.dimension !== 0)
          throw new Error("array dimension not balanced");
        return this.entries;
      }
    };
    function identity(value) {
      return value;
    }
  }
});

// node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = __commonJS({
  "node_modules/pg-types/lib/arrayParser.js"(exports2, module2) {
    var array = require_postgres_array();
    module2.exports = {
      create: function(source, transform) {
        return {
          parse: function() {
            return array.parse(source, transform);
          }
        };
      }
    };
  }
});

// node_modules/postgres-date/index.js
var require_postgres_date = __commonJS({
  "node_modules/postgres-date/index.js"(exports2, module2) {
    "use strict";
    var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/, DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/, TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/, INFINITY = /^-?infinity$/;
    module2.exports = function(isoDate) {
      if (INFINITY.test(isoDate))
        return Number(isoDate.replace("i", "I"));
      var matches = DATE_TIME.exec(isoDate);
      if (!matches)
        return getDate(isoDate) || null;
      var isBC = !!matches[8], year = parseInt(matches[1], 10);
      isBC && (year = bcYearToNegativeYear(year));
      var month = parseInt(matches[2], 10) - 1, day = matches[3], hour = parseInt(matches[4], 10), minute = parseInt(matches[5], 10), second = parseInt(matches[6], 10), ms = matches[7];
      ms = ms ? 1e3 * parseFloat(ms) : 0;
      var date, offset = timeZoneOffset(isoDate);
      return offset != null ? (date = new Date(Date.UTC(year, month, day, hour, minute, second, ms)), is0To99(year) && date.setUTCFullYear(year), offset !== 0 && date.setTime(date.getTime() - offset)) : (date = new Date(year, month, day, hour, minute, second, ms), is0To99(year) && date.setFullYear(year)), date;
    };
    function getDate(isoDate) {
      var matches = DATE.exec(isoDate);
      if (matches) {
        var year = parseInt(matches[1], 10), isBC = !!matches[4];
        isBC && (year = bcYearToNegativeYear(year));
        var month = parseInt(matches[2], 10) - 1, day = matches[3], date = new Date(year, month, day);
        return is0To99(year) && date.setFullYear(year), date;
      }
    }
    function timeZoneOffset(isoDate) {
      if (isoDate.endsWith("+00"))
        return 0;
      var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
      if (zone) {
        var type = zone[1];
        if (type === "Z")
          return 0;
        var sign = type === "-" ? -1 : 1, offset = parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10);
        return offset * sign * 1e3;
      }
    }
    function bcYearToNegativeYear(year) {
      return -(year - 1);
    }
    function is0To99(num) {
      return num >= 0 && num < 100;
    }
  }
});

// node_modules/xtend/mutable.js
var require_mutable = __commonJS({
  "node_modules/xtend/mutable.js"(exports2, module2) {
    module2.exports = extend;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    function extend(target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source)
          hasOwnProperty.call(source, key) && (target[key] = source[key]);
      }
      return target;
    }
  }
});

// node_modules/postgres-interval/index.js
var require_postgres_interval = __commonJS({
  "node_modules/postgres-interval/index.js"(exports2, module2) {
    "use strict";
    var extend = require_mutable();
    module2.exports = PostgresInterval;
    function PostgresInterval(raw) {
      if (!(this instanceof PostgresInterval))
        return new PostgresInterval(raw);
      extend(this, parse(raw));
    }
    var properties = ["seconds", "minutes", "hours", "days", "months", "years"];
    PostgresInterval.prototype.toPostgres = function() {
      var filtered = properties.filter(this.hasOwnProperty, this);
      return this.milliseconds && filtered.indexOf("seconds") < 0 && filtered.push("seconds"), filtered.length === 0 ? "0" : filtered.map(function(property) {
        var value = this[property] || 0;
        return property === "seconds" && this.milliseconds && (value = (value + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "")), value + " " + property;
      }, this).join(" ");
    };
    var propertiesISOEquivalent = {
      years: "Y",
      months: "M",
      days: "D",
      hours: "H",
      minutes: "M",
      seconds: "S"
    }, dateProperties = ["years", "months", "days"], timeProperties = ["hours", "minutes", "seconds"];
    PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
      var datePart = dateProperties.map(buildProperty, this).join(""), timePart = timeProperties.map(buildProperty, this).join("");
      return "P" + datePart + "T" + timePart;
      function buildProperty(property) {
        var value = this[property] || 0;
        return property === "seconds" && this.milliseconds && (value = (value + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "")), value + propertiesISOEquivalent[property];
      }
    };
    var NUMBER = "([+-]?\\d+)", YEAR = NUMBER + "\\s+years?", MONTH = NUMBER + "\\s+mons?", DAY = NUMBER + "\\s+days?", TIME = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?", INTERVAL = new RegExp([YEAR, MONTH, DAY, TIME].map(function(regexString) {
      return "(" + regexString + ")?";
    }).join("\\s*")), positions = {
      years: 2,
      months: 4,
      days: 6,
      hours: 9,
      minutes: 10,
      seconds: 11,
      milliseconds: 12
    }, negatives = ["hours", "minutes", "seconds", "milliseconds"];
    function parseMilliseconds(fraction) {
      var microseconds = fraction + "000000".slice(fraction.length);
      return parseInt(microseconds, 10) / 1e3;
    }
    function parse(interval) {
      if (!interval) return {};
      var matches = INTERVAL.exec(interval), isNegative = matches[8] === "-";
      return Object.keys(positions).reduce(function(parsed, property) {
        var position = positions[property], value = matches[position];
        return !value || (value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10), !value) || (isNegative && ~negatives.indexOf(property) && (value *= -1), parsed[property] = value), parsed;
      }, {});
    }
  }
});

// node_modules/postgres-bytea/index.js
var require_postgres_bytea = __commonJS({
  "node_modules/postgres-bytea/index.js"(exports2, module2) {
    "use strict";
    var bufferFrom = Buffer.from || Buffer;
    module2.exports = function(input) {
      if (/^\\x/.test(input))
        return bufferFrom(input.substr(2), "hex");
      for (var output = "", i = 0; i < input.length; )
        if (input[i] !== "\\")
          output += input[i], ++i;
        else if (/[0-7]{3}/.test(input.substr(i + 1, 3)))
          output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8)), i += 4;
        else {
          for (var backslashes = 1; i + backslashes < input.length && input[i + backslashes] === "\\"; )
            backslashes++;
          for (var k = 0; k < Math.floor(backslashes / 2); ++k)
            output += "\\";
          i += Math.floor(backslashes / 2) * 2;
        }
      return bufferFrom(output, "binary");
    };
  }
});

// node_modules/pg-types/lib/textParsers.js
var require_textParsers = __commonJS({
  "node_modules/pg-types/lib/textParsers.js"(exports2, module2) {
    var array = require_postgres_array(), arrayParser = require_arrayParser(), parseDate = require_postgres_date(), parseInterval = require_postgres_interval(), parseByteA = require_postgres_bytea();
    function allowNull(fn) {
      return function(value) {
        return value === null ? value : fn(value);
      };
    }
    function parseBool(value) {
      return value === null ? value : value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
    }
    function parseBoolArray(value) {
      return value ? array.parse(value, parseBool) : null;
    }
    function parseBaseTenInt(string) {
      return parseInt(string, 10);
    }
    function parseIntegerArray(value) {
      return value ? array.parse(value, allowNull(parseBaseTenInt)) : null;
    }
    function parseBigIntegerArray(value) {
      return value ? array.parse(value, allowNull(function(entry) {
        return parseBigInteger(entry).trim();
      })) : null;
    }
    var parsePointArray = function(value) {
      if (!value)
        return null;
      var p = arrayParser.create(value, function(entry) {
        return entry !== null && (entry = parsePoint(entry)), entry;
      });
      return p.parse();
    }, parseFloatArray = function(value) {
      if (!value)
        return null;
      var p = arrayParser.create(value, function(entry) {
        return entry !== null && (entry = parseFloat(entry)), entry;
      });
      return p.parse();
    }, parseStringArray = function(value) {
      if (!value)
        return null;
      var p = arrayParser.create(value);
      return p.parse();
    }, parseDateArray = function(value) {
      if (!value)
        return null;
      var p = arrayParser.create(value, function(entry) {
        return entry !== null && (entry = parseDate(entry)), entry;
      });
      return p.parse();
    }, parseIntervalArray = function(value) {
      if (!value)
        return null;
      var p = arrayParser.create(value, function(entry) {
        return entry !== null && (entry = parseInterval(entry)), entry;
      });
      return p.parse();
    }, parseByteAArray = function(value) {
      return value ? array.parse(value, allowNull(parseByteA)) : null;
    }, parseInteger = function(value) {
      return parseInt(value, 10);
    }, parseBigInteger = function(value) {
      var valStr = String(value);
      return /^\d+$/.test(valStr) ? valStr : value;
    }, parseJsonArray = function(value) {
      return value ? array.parse(value, allowNull(JSON.parse)) : null;
    }, parsePoint = function(value) {
      return value[0] !== "(" ? null : (value = value.substring(1, value.length - 1).split(","), {
        x: parseFloat(value[0]),
        y: parseFloat(value[1])
      });
    }, parseCircle = function(value) {
      if (value[0] !== "<" && value[1] !== "(")
        return null;
      for (var point = "(", radius = "", pointParsed = !1, i = 2; i < value.length - 1; i++) {
        if (pointParsed || (point += value[i]), value[i] === ")") {
          pointParsed = !0;
          continue;
        } else if (!pointParsed)
          continue;
        value[i] !== "," && (radius += value[i]);
      }
      var result = parsePoint(point);
      return result.radius = parseFloat(radius), result;
    }, init = function(register) {
      register(20, parseBigInteger), register(21, parseInteger), register(23, parseInteger), register(26, parseInteger), register(700, parseFloat), register(701, parseFloat), register(16, parseBool), register(1082, parseDate), register(1114, parseDate), register(1184, parseDate), register(600, parsePoint), register(651, parseStringArray), register(718, parseCircle), register(1e3, parseBoolArray), register(1001, parseByteAArray), register(1005, parseIntegerArray), register(1007, parseIntegerArray), register(1028, parseIntegerArray), register(1016, parseBigIntegerArray), register(1017, parsePointArray), register(1021, parseFloatArray), register(1022, parseFloatArray), register(1231, parseFloatArray), register(1014, parseStringArray), register(1015, parseStringArray), register(1008, parseStringArray), register(1009, parseStringArray), register(1040, parseStringArray), register(1041, parseStringArray), register(1115, parseDateArray), register(1182, parseDateArray), register(1185, parseDateArray), register(1186, parseInterval), register(1187, parseIntervalArray), register(17, parseByteA), register(114, JSON.parse.bind(JSON)), register(3802, JSON.parse.bind(JSON)), register(199, parseJsonArray), register(3807, parseJsonArray), register(3907, parseStringArray), register(2951, parseStringArray), register(791, parseStringArray), register(1183, parseStringArray), register(1270, parseStringArray);
    };
    module2.exports = {
      init
    };
  }
});

// node_modules/pg-int8/index.js
var require_pg_int8 = __commonJS({
  "node_modules/pg-int8/index.js"(exports2, module2) {
    "use strict";
    var BASE = 1e6;
    function readInt8(buffer) {
      var high = buffer.readInt32BE(0), low = buffer.readUInt32BE(4), sign = "";
      high < 0 && (high = ~high + (low === 0), low = ~low + 1 >>> 0, sign = "-");
      var result = "", carry, t, digits, pad, l, i;
      {
        if (carry = high % BASE, high = high / BASE >>> 0, t = 4294967296 * carry + low, low = t / BASE >>> 0, digits = "" + (t - BASE * low), low === 0 && high === 0)
          return sign + digits + result;
        for (pad = "", l = 6 - digits.length, i = 0; i < l; i++)
          pad += "0";
        result = pad + digits + result;
      }
      {
        if (carry = high % BASE, high = high / BASE >>> 0, t = 4294967296 * carry + low, low = t / BASE >>> 0, digits = "" + (t - BASE * low), low === 0 && high === 0)
          return sign + digits + result;
        for (pad = "", l = 6 - digits.length, i = 0; i < l; i++)
          pad += "0";
        result = pad + digits + result;
      }
      {
        if (carry = high % BASE, high = high / BASE >>> 0, t = 4294967296 * carry + low, low = t / BASE >>> 0, digits = "" + (t - BASE * low), low === 0 && high === 0)
          return sign + digits + result;
        for (pad = "", l = 6 - digits.length, i = 0; i < l; i++)
          pad += "0";
        result = pad + digits + result;
      }
      return carry = high % BASE, t = 4294967296 * carry + low, digits = "" + t % BASE, sign + digits + result;
    }
    module2.exports = readInt8;
  }
});

// node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = __commonJS({
  "node_modules/pg-types/lib/binaryParsers.js"(exports2, module2) {
    var parseInt64 = require_pg_int8(), parseBits = function(data, bits, offset, invert, callback) {
      offset = offset || 0, invert = invert || !1, callback = callback || function(lastValue, newValue, bits2) {
        return lastValue * Math.pow(2, bits2) + newValue;
      };
      var offsetBytes = offset >> 3, inv = function(value) {
        return invert ? ~value & 255 : value;
      }, mask = 255, firstBits = 8 - offset % 8;
      bits < firstBits && (mask = 255 << 8 - bits & 255, firstBits = bits), offset && (mask = mask >> offset % 8);
      var result = 0;
      offset % 8 + bits >= 8 && (result = callback(0, inv(data[offsetBytes]) & mask, firstBits));
      for (var bytes = bits + offset >> 3, i = offsetBytes + 1; i < bytes; i++)
        result = callback(result, inv(data[i]), 8);
      var lastBits = (bits + offset) % 8;
      return lastBits > 0 && (result = callback(result, inv(data[bytes]) >> 8 - lastBits, lastBits)), result;
    }, parseFloatFromBits = function(data, precisionBits, exponentBits) {
      var bias = Math.pow(2, exponentBits - 1) - 1, sign = parseBits(data, 1), exponent = parseBits(data, exponentBits, 1);
      if (exponent === 0)
        return 0;
      var precisionBitsCounter = 1, parsePrecisionBits = function(lastValue, newValue, bits) {
        lastValue === 0 && (lastValue = 1);
        for (var i = 1; i <= bits; i++)
          precisionBitsCounter /= 2, (newValue & 1 << bits - i) > 0 && (lastValue += precisionBitsCounter);
        return lastValue;
      }, mantissa = parseBits(data, precisionBits, exponentBits + 1, !1, parsePrecisionBits);
      return exponent == Math.pow(2, exponentBits + 1) - 1 ? mantissa === 0 ? sign === 0 ? 1 / 0 : -1 / 0 : NaN : (sign === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
    }, parseInt16 = function(value) {
      return parseBits(value, 1) == 1 ? -1 * (parseBits(value, 15, 1, !0) + 1) : parseBits(value, 15, 1);
    }, parseInt32 = function(value) {
      return parseBits(value, 1) == 1 ? -1 * (parseBits(value, 31, 1, !0) + 1) : parseBits(value, 31, 1);
    }, parseFloat32 = function(value) {
      return parseFloatFromBits(value, 23, 8);
    }, parseFloat64 = function(value) {
      return parseFloatFromBits(value, 52, 11);
    }, parseNumeric = function(value) {
      var sign = parseBits(value, 16, 32);
      if (sign == 49152)
        return NaN;
      for (var weight = Math.pow(1e4, parseBits(value, 16, 16)), result = 0, digits = [], ndigits = parseBits(value, 16), i = 0; i < ndigits; i++)
        result += parseBits(value, 16, 64 + 16 * i) * weight, weight /= 1e4;
      var scale = Math.pow(10, parseBits(value, 16, 48));
      return (sign === 0 ? 1 : -1) * Math.round(result * scale) / scale;
    }, parseDate = function(isUTC, value) {
      var sign = parseBits(value, 1), rawValue = parseBits(value, 63, 1), result = new Date((sign === 0 ? 1 : -1) * rawValue / 1e3 + 9466848e5);
      return isUTC || result.setTime(result.getTime() + result.getTimezoneOffset() * 6e4), result.usec = rawValue % 1e3, result.getMicroSeconds = function() {
        return this.usec;
      }, result.setMicroSeconds = function(value2) {
        this.usec = value2;
      }, result.getUTCMicroSeconds = function() {
        return this.usec;
      }, result;
    }, parseArray = function(value) {
      for (var dim = parseBits(value, 32), flags = parseBits(value, 32, 32), elementType = parseBits(value, 32, 64), offset = 96, dims = [], i = 0; i < dim; i++)
        dims[i] = parseBits(value, 32, offset), offset += 32, offset += 32;
      var parseElement = function(elementType2) {
        var length = parseBits(value, 32, offset);
        if (offset += 32, length == 4294967295)
          return null;
        var result;
        if (elementType2 == 23 || elementType2 == 20)
          return result = parseBits(value, length * 8, offset), offset += length * 8, result;
        if (elementType2 == 25)
          return result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3), result;
        console.log("ERROR: ElementType not implemented: " + elementType2);
      }, parse = function(dimension, elementType2) {
        var array = [], i2;
        if (dimension.length > 1) {
          var count = dimension.shift();
          for (i2 = 0; i2 < count; i2++)
            array[i2] = parse(dimension, elementType2);
          dimension.unshift(count);
        } else
          for (i2 = 0; i2 < dimension[0]; i2++)
            array[i2] = parseElement(elementType2);
        return array;
      };
      return parse(dims, elementType);
    }, parseText = function(value) {
      return value.toString("utf8");
    }, parseBool = function(value) {
      return value === null ? null : parseBits(value, 8) > 0;
    }, init = function(register) {
      register(20, parseInt64), register(21, parseInt16), register(23, parseInt32), register(26, parseInt32), register(1700, parseNumeric), register(700, parseFloat32), register(701, parseFloat64), register(16, parseBool), register(1114, parseDate.bind(null, !1)), register(1184, parseDate.bind(null, !0)), register(1e3, parseArray), register(1007, parseArray), register(1016, parseArray), register(1008, parseArray), register(1009, parseArray), register(25, parseText);
    };
    module2.exports = {
      init
    };
  }
});

// node_modules/pg-types/lib/builtins.js
var require_builtins = __commonJS({
  "node_modules/pg-types/lib/builtins.js"(exports2, module2) {
    module2.exports = {
      BOOL: 16,
      BYTEA: 17,
      CHAR: 18,
      INT8: 20,
      INT2: 21,
      INT4: 23,
      REGPROC: 24,
      TEXT: 25,
      OID: 26,
      TID: 27,
      XID: 28,
      CID: 29,
      JSON: 114,
      XML: 142,
      PG_NODE_TREE: 194,
      SMGR: 210,
      PATH: 602,
      POLYGON: 604,
      CIDR: 650,
      FLOAT4: 700,
      FLOAT8: 701,
      ABSTIME: 702,
      RELTIME: 703,
      TINTERVAL: 704,
      CIRCLE: 718,
      MACADDR8: 774,
      MONEY: 790,
      MACADDR: 829,
      INET: 869,
      ACLITEM: 1033,
      BPCHAR: 1042,
      VARCHAR: 1043,
      DATE: 1082,
      TIME: 1083,
      TIMESTAMP: 1114,
      TIMESTAMPTZ: 1184,
      INTERVAL: 1186,
      TIMETZ: 1266,
      BIT: 1560,
      VARBIT: 1562,
      NUMERIC: 1700,
      REFCURSOR: 1790,
      REGPROCEDURE: 2202,
      REGOPER: 2203,
      REGOPERATOR: 2204,
      REGCLASS: 2205,
      REGTYPE: 2206,
      UUID: 2950,
      TXID_SNAPSHOT: 2970,
      PG_LSN: 3220,
      PG_NDISTINCT: 3361,
      PG_DEPENDENCIES: 3402,
      TSVECTOR: 3614,
      TSQUERY: 3615,
      GTSVECTOR: 3642,
      REGCONFIG: 3734,
      REGDICTIONARY: 3769,
      JSONB: 3802,
      REGNAMESPACE: 4089,
      REGROLE: 4096
    };
  }
});

// node_modules/pg-types/index.js
var require_pg_types = __commonJS({
  "node_modules/pg-types/index.js"(exports2) {
    var textParsers = require_textParsers(), binaryParsers = require_binaryParsers(), arrayParser = require_arrayParser(), builtinTypes = require_builtins();
    exports2.getTypeParser = getTypeParser;
    exports2.setTypeParser = setTypeParser;
    exports2.arrayParser = arrayParser;
    exports2.builtins = builtinTypes;
    var typeParsers = {
      text: {},
      binary: {}
    };
    function noParse(val) {
      return String(val);
    }
    function getTypeParser(oid, format) {
      return format = format || "text", typeParsers[format] && typeParsers[format][oid] || noParse;
    }
    function setTypeParser(oid, format, parseFn) {
      typeof format == "function" && (parseFn = format, format = "text"), typeParsers[format][oid] = parseFn;
    }
    textParsers.init(function(oid, converter) {
      typeParsers.text[oid] = converter;
    });
    binaryParsers.init(function(oid, converter) {
      typeParsers.binary[oid] = converter;
    });
  }
});

// node_modules/pg/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/pg/lib/defaults.js"(exports2, module2) {
    "use strict";
    var user;
    try {
      user = process.platform === "win32" ? process.env.USERNAME : process.env.USER;
    } catch {
    }
    module2.exports = {
      // database host. defaults to localhost
      host: "localhost",
      // database user's name
      user,
      // name of database to connect
      database: void 0,
      // database user's password
      password: null,
      // a Postgres connection string to be used instead of setting individual connection items
      // NOTE:  Setting this value will cause it to override any other value (such as database or user) defined
      // in the defaults object.
      connectionString: void 0,
      // database port
      port: 5432,
      // number of rows to return at a time from a prepared statement's
      // portal. 0 will return all rows at once
      rows: 0,
      // binary result mode
      binary: !1,
      // Connection pool options - see https://github.com/brianc/node-pg-pool
      // number of connections to use in connection pool
      // 0 will disable connection pooling
      max: 10,
      // max milliseconds a client can go unused before it is removed
      // from the pool and destroyed
      idleTimeoutMillis: 3e4,
      client_encoding: "",
      ssl: !1,
      // SSL negotiation style: 'postgres' (traditional SSLRequest) or 'direct'
      sslnegotiation: void 0,
      application_name: void 0,
      fallback_application_name: void 0,
      options: void 0,
      parseInputDatesAsUTC: !1,
      // max milliseconds any query using this connection will execute for before timing out in error.
      // false=unlimited
      statement_timeout: !1,
      // Abort any statement that waits longer than the specified duration in milliseconds while attempting to acquire a lock.
      // false=unlimited
      lock_timeout: !1,
      // Terminate any session with an open transaction that has been idle for longer than the specified duration in milliseconds
      // false=unlimited
      idle_in_transaction_session_timeout: !1,
      // max milliseconds to wait for query to complete (client side)
      query_timeout: !1,
      connect_timeout: 0,
      keepalives: 1,
      keepalives_idle: 0
    };
    var pgTypes = require_pg_types(), parseBigInteger = pgTypes.getTypeParser(20, "text"), parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
    module2.exports.__defineSetter__("parseInt8", function(val) {
      pgTypes.setTypeParser(20, "text", val ? pgTypes.getTypeParser(23, "text") : parseBigInteger), pgTypes.setTypeParser(1016, "text", val ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
    });
  }
});

// node_modules/pg/lib/utils.js
var require_utils = __commonJS({
  "node_modules/pg/lib/utils.js"(exports2, module2) {
    "use strict";
    var defaults = require_defaults(), nodeUtils = require("util"), { isDate } = require("util/types"), invalidDateDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Sending an invalid date to Postgres is deprecated and will throw an error in the next major version of pg. Ensure any Date object passed as a query parameter is valid.",
      "PG_INVALID_DATE"
    );
    function escapeElement(elementRepresentation) {
      return '"' + elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    }
    function arrayString(val) {
      let result = "{";
      for (let i = 0; i < val.length; i++) {
        i > 0 && (result += ",");
        let item = val[i];
        item == null ? result += "NULL" : Array.isArray(item) ? result += arrayString(item) : ArrayBuffer.isView(item) ? (item instanceof Buffer || (item = Buffer.from(item.buffer, item.byteOffset, item.byteLength)), result += "\\\\x" + item.toString("hex")) : result += escapeElement(prepareValue(item));
      }
      return result += "}", result;
    }
    var prepareValue = function(val, seen) {
      return val == null ? null : typeof val == "object" ? val instanceof Buffer ? val : ArrayBuffer.isView(val) ? Buffer.from(val.buffer, val.byteOffset, val.byteLength) : isDate(val) ? (isNaN(val.getTime()) && invalidDateDeprecationNotice(), defaults.parseInputDatesAsUTC ? dateToStringUTC(val) : dateToString(val)) : Array.isArray(val) ? arrayString(val) : prepareObject(val, seen) : val.toString();
    };
    function prepareObject(val, seen) {
      if (val && typeof val.toPostgres == "function") {
        if (seen = seen || [], seen.indexOf(val) !== -1)
          throw new Error('circular reference detected while preparing "' + val + '" for query');
        return seen.push(val), prepareValue(val.toPostgres(prepareValue), seen);
      }
      return JSON.stringify(val);
    }
    function dateToString(date) {
      let offset = -date.getTimezoneOffset(), year = date.getFullYear(), isBCYear = year < 1;
      isBCYear && (year = Math.abs(year) + 1);
      let ret = String(year).padStart(4, "0") + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") + "T" + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0") + "." + String(date.getMilliseconds()).padStart(3, "0");
      return offset < 0 ? (ret += "-", offset *= -1) : ret += "+", ret += String(Math.floor(offset / 60)).padStart(2, "0") + ":" + String(offset % 60).padStart(2, "0"), isBCYear && (ret += " BC"), ret;
    }
    function dateToStringUTC(date) {
      let year = date.getUTCFullYear(), isBCYear = year < 1;
      isBCYear && (year = Math.abs(year) + 1);
      let ret = String(year).padStart(4, "0") + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0") + "T" + String(date.getUTCHours()).padStart(2, "0") + ":" + String(date.getUTCMinutes()).padStart(2, "0") + ":" + String(date.getUTCSeconds()).padStart(2, "0") + "." + String(date.getUTCMilliseconds()).padStart(3, "0");
      return ret += "+00:00", isBCYear && (ret += " BC"), ret;
    }
    function normalizeQueryConfig(config, values, callback) {
      return config = typeof config == "string" ? { text: config } : cloneQueryConfig(config), values && (typeof values == "function" ? config.callback = values : config.values = values), callback && (config.callback = callback), config;
    }
    function cloneQueryConfig(config) {
      return config == null ? config : Object.defineProperties(Object.create(Object.getPrototypeOf(config)), Object.getOwnPropertyDescriptors(config));
    }
    var escapeIdentifier = function(str) {
      return '"' + str.replace(/"/g, '""') + '"';
    }, escapeLiteral = function(str) {
      let hasBackslash = !1, escaped = "'";
      if (str == null || typeof str != "string")
        return "''";
      for (let i = 0; i < str.length; i++) {
        let c = str[i];
        c === "'" ? escaped += c + c : c === "\\" ? (escaped += c + c, hasBackslash = !0) : escaped += c;
      }
      return escaped += "'", hasBackslash === !0 && (escaped = " E" + escaped), escaped;
    };
    module2.exports = {
      prepareValue: function(value) {
        return prepareValue(value);
      },
      normalizeQueryConfig,
      escapeIdentifier,
      escapeLiteral
    };
  }
});

// node_modules/pg/lib/crypto/utils.js
var require_utils2 = __commonJS({
  "node_modules/pg/lib/crypto/utils.js"(exports2, module2) {
    var nodeCrypto = require("crypto");
    module2.exports = {
      postgresMd5PasswordHash,
      randomBytes,
      deriveKey,
      sha256: sha2562,
      hashByName,
      hmacSha256,
      md5
    };
    var webCrypto = nodeCrypto.webcrypto || globalThis.crypto, subtleCrypto = webCrypto.subtle, textEncoder = new TextEncoder();
    function randomBytes(length) {
      return webCrypto.getRandomValues(Buffer.alloc(length));
    }
    async function md5(string) {
      try {
        return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
      } catch {
        let data = typeof string == "string" ? textEncoder.encode(string) : string, hash = await subtleCrypto.digest("MD5", data);
        return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    }
    async function postgresMd5PasswordHash(user, password, salt) {
      let inner = await md5(password + user);
      return "md5" + await md5(Buffer.concat([Buffer.from(inner), salt]));
    }
    async function sha2562(text) {
      return await subtleCrypto.digest("SHA-256", text);
    }
    async function hashByName(hashName, text) {
      return await subtleCrypto.digest(hashName, text);
    }
    async function hmacSha256(keyBuffer, msg) {
      let key = await subtleCrypto.importKey("raw", keyBuffer, { name: "HMAC", hash: "SHA-256" }, !1, ["sign"]);
      return await subtleCrypto.sign("HMAC", key, textEncoder.encode(msg));
    }
    async function deriveKey(password, salt, iterations) {
      let key = await subtleCrypto.importKey("raw", textEncoder.encode(password), "PBKDF2", !1, ["deriveBits"]), params = { name: "PBKDF2", hash: "SHA-256", salt, iterations };
      return await subtleCrypto.deriveBits(params, key, 32 * 8, ["deriveBits"]);
    }
  }
});

// node_modules/pg/lib/crypto/cert-signatures.js
var require_cert_signatures = __commonJS({
  "node_modules/pg/lib/crypto/cert-signatures.js"(exports2, module2) {
    function x509Error(msg, cert) {
      return new Error("SASL channel binding: " + msg + " when parsing public certificate " + cert.toString("base64"));
    }
    function readASN1Length(data, index) {
      let length = data[index++];
      if (length < 128) return { length, index };
      let lengthBytes = length & 127;
      if (lengthBytes > 4) throw x509Error("bad length", data);
      length = 0;
      for (let i = 0; i < lengthBytes; i++)
        length = length << 8 | data[index++];
      return { length, index };
    }
    function readASN1OID(data, index) {
      if (data[index++] !== 6) throw x509Error("non-OID data", data);
      let { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index);
      index = indexAfterOIDLength;
      let lastIndex = index + OIDLength, byte1 = data[index++], oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
      for (; index < lastIndex; ) {
        let value = 0;
        for (; index < lastIndex; ) {
          let nextByte = data[index++];
          if (value = value << 7 | nextByte & 127, nextByte < 128) break;
        }
        oid += "." + value;
      }
      return { oid, index };
    }
    function expectASN1Seq(data, index) {
      if (data[index++] !== 48) throw x509Error("non-sequence data", data);
      return readASN1Length(data, index);
    }
    function signatureAlgorithmHashFromCertificate(data, index) {
      index === void 0 && (index = 0), index = expectASN1Seq(data, index).index;
      let { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index);
      index = indexAfterCertInfoLength + certInfoLength, index = expectASN1Seq(data, index).index;
      let { oid, index: indexAfterOID } = readASN1OID(data, index);
      switch (oid) {
        // RSA
        case "1.2.840.113549.1.1.4":
          return "MD5";
        case "1.2.840.113549.1.1.5":
          return "SHA-1";
        case "1.2.840.113549.1.1.11":
          return "SHA-256";
        case "1.2.840.113549.1.1.12":
          return "SHA-384";
        case "1.2.840.113549.1.1.13":
          return "SHA-512";
        case "1.2.840.113549.1.1.14":
          return "SHA-224";
        case "1.2.840.113549.1.1.15":
          return "SHA512-224";
        case "1.2.840.113549.1.1.16":
          return "SHA512-256";
        // ECDSA
        case "1.2.840.10045.4.1":
          return "SHA-1";
        case "1.2.840.10045.4.3.1":
          return "SHA-224";
        case "1.2.840.10045.4.3.2":
          return "SHA-256";
        case "1.2.840.10045.4.3.3":
          return "SHA-384";
        case "1.2.840.10045.4.3.4":
          return "SHA-512";
        // RSASSA-PSS: hash is indicated separately
        case "1.2.840.113549.1.1.10": {
          if (index = indexAfterOID, index = expectASN1Seq(data, index).index, data[index++] !== 160) throw x509Error("non-tag data", data);
          index = readASN1Length(data, index).index, index = expectASN1Seq(data, index).index;
          let { oid: hashOID } = readASN1OID(data, index);
          switch (hashOID) {
            // standalone hash OIDs
            case "1.2.840.113549.2.5":
              return "MD5";
            case "1.3.14.3.2.26":
              return "SHA-1";
            case "2.16.840.1.101.3.4.2.1":
              return "SHA-256";
            case "2.16.840.1.101.3.4.2.2":
              return "SHA-384";
            case "2.16.840.1.101.3.4.2.3":
              return "SHA-512";
          }
          throw x509Error("unknown hash OID " + hashOID, data);
        }
        // Ed25519 -- see https://github.com/openssl/openssl/issues/15477
        case "1.3.101.110":
        case "1.3.101.112":
          return "SHA-512";
        // Ed448 -- still not in pg 17.2 (if supported, digest would be SHAKE256 x 64 bytes)
        case "1.3.101.111":
        case "1.3.101.113":
          throw x509Error("Ed448 certificate channel binding is not currently supported by Postgres");
      }
      throw x509Error("unknown OID " + oid, data);
    }
    module2.exports = { signatureAlgorithmHashFromCertificate };
  }
});

// node_modules/pg/lib/crypto/sasl.js
var require_sasl = __commonJS({
  "node_modules/pg/lib/crypto/sasl.js"(exports2, module2) {
    "use strict";
    var crypto2 = require_utils2(), { signatureAlgorithmHashFromCertificate } = require_cert_signatures();
    function saslprep(password) {
      let nonAsciiSpace = /[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, mappedToNothing = /[\u00AD\u034F\u1806\u180B\u180C\u180D\u200C\u200D\u2060\uFE00-\uFE0F\uFEFF]/g;
      return password.replace(nonAsciiSpace, " ").replace(mappedToNothing, "").normalize("NFKC");
    }
    var DEFAULT_MAX_SCRAM_ITERATIONS = 1e5;
    function startSession(mechanisms, stream, scramMaxIterations = DEFAULT_MAX_SCRAM_ITERATIONS) {
      let candidates = ["SCRAM-SHA-256"];
      stream && candidates.unshift("SCRAM-SHA-256-PLUS");
      let mechanism = candidates.find((candidate) => mechanisms.includes(candidate));
      if (!mechanism)
        throw new Error("SASL: Only mechanism(s) " + candidates.join(" and ") + " are supported");
      if (mechanism === "SCRAM-SHA-256-PLUS" && typeof stream.getPeerCertificate != "function")
        throw new Error("SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate");
      let clientNonce = crypto2.randomBytes(18).toString("base64");
      return {
        mechanism,
        clientNonce,
        response: (mechanism === "SCRAM-SHA-256-PLUS" ? "p=tls-server-end-point" : stream ? "y" : "n") + ",,n=*,r=" + clientNonce,
        message: "SASLInitialResponse",
        scramMaxIterations
      };
    }
    async function continueSession(session, password, serverData, stream) {
      if (session.message !== "SASLInitialResponse")
        throw new Error("SASL: Last message was not SASLInitialResponse");
      if (typeof password != "string")
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
      if (password === "")
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
      if (typeof serverData != "string")
        throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
      let sv = parseServerFirstMessage(serverData);
      if (sv.nonce.startsWith(session.clientNonce)) {
        if (sv.nonce.length === session.clientNonce.length)
          throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
      } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
      let scramMaxIterations = typeof session.scramMaxIterations == "number" ? session.scramMaxIterations : DEFAULT_MAX_SCRAM_ITERATIONS;
      if (scramMaxIterations !== 0 && sv.iteration > scramMaxIterations)
        throw new Error(
          "SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration count " + sv.iteration + " exceeds scramMaxIterations of " + scramMaxIterations
        );
      let clientFirstMessageBare = "n=*,r=" + session.clientNonce, serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration, channelBinding = stream ? "eSws" : "biws";
      if (session.mechanism === "SCRAM-SHA-256-PLUS") {
        let peerCert = stream.getPeerCertificate().raw, hashName = signatureAlgorithmHashFromCertificate(peerCert);
        (hashName === "MD5" || hashName === "SHA-1") && (hashName = "SHA-256");
        let certHash = await crypto2.hashByName(hashName, peerCert);
        channelBinding = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), Buffer.from(certHash)]).toString("base64");
      }
      let clientFinalMessageWithoutProof = "c=" + channelBinding + ",r=" + sv.nonce, authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof, saltBytes = Buffer.from(sv.salt, "base64"), saltedPassword = await crypto2.deriveKey(saslprep(password), saltBytes, sv.iteration), clientKey = await crypto2.hmacSha256(saltedPassword, "Client Key"), storedKey = await crypto2.sha256(clientKey), clientSignature = await crypto2.hmacSha256(storedKey, authMessage), clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64"), serverKey = await crypto2.hmacSha256(saltedPassword, "Server Key"), serverSignatureBytes = await crypto2.hmacSha256(serverKey, authMessage);
      session.message = "SASLResponse", session.serverSignature = Buffer.from(serverSignatureBytes).toString("base64"), session.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
    }
    function finalizeSession(session, serverData) {
      if (session.message !== "SASLResponse")
        throw new Error("SASL: Last message was not SASLResponse");
      if (typeof serverData != "string")
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
      let { serverSignature } = parseServerFinalMessage(serverData);
      if (serverSignature !== session.serverSignature)
        throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
    }
    function isPrintableChars(text) {
      if (typeof text != "string")
        throw new TypeError("SASL: text must be a string");
      return text.split("").map((_, i) => text.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
    }
    function isBase64(text) {
      return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text);
    }
    function parseAttributePairs(text) {
      if (typeof text != "string")
        throw new TypeError("SASL: attribute pairs text must be a string");
      return new Map(
        text.split(",").map((attrValue) => {
          if (!/^.=/.test(attrValue))
            throw new Error("SASL: Invalid attribute pair entry");
          let name = attrValue[0], value = attrValue.substring(2);
          return [name, value];
        })
      );
    }
    function parseServerFirstMessage(data) {
      let attrPairs = parseAttributePairs(data), nonce = attrPairs.get("r");
      if (nonce) {
        if (!isPrintableChars(nonce))
          throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
      } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
      let salt = attrPairs.get("s");
      if (salt) {
        if (!isBase64(salt))
          throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
      } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
      let iterationText = attrPairs.get("i");
      if (iterationText) {
        if (!/^[1-9][0-9]*$/.test(iterationText))
          throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
      } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
      let iteration = parseInt(iterationText, 10);
      return {
        nonce,
        salt,
        iteration
      };
    }
    function parseServerFinalMessage(serverData) {
      let attrPairs = parseAttributePairs(serverData), error = attrPairs.get("e"), serverSignature = attrPairs.get("v");
      if (error)
        throw new Error(`SASL: SCRAM-SERVER-FINAL-MESSAGE: server returned error: "${error}"`);
      if (serverSignature) {
        if (!isBase64(serverSignature))
          throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
      } else throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
      return {
        serverSignature
      };
    }
    function xorBuffers(a, b) {
      if (!Buffer.isBuffer(a))
        throw new TypeError("first argument must be a Buffer");
      if (!Buffer.isBuffer(b))
        throw new TypeError("second argument must be a Buffer");
      if (a.length !== b.length)
        throw new Error("Buffer lengths must match");
      if (a.length === 0)
        throw new Error("Buffers cannot be empty");
      return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
    }
    module2.exports = {
      startSession,
      continueSession,
      finalizeSession,
      DEFAULT_MAX_SCRAM_ITERATIONS
    };
  }
});

// node_modules/pg/lib/type-overrides.js
var require_type_overrides = __commonJS({
  "node_modules/pg/lib/type-overrides.js"(exports2, module2) {
    "use strict";
    var types2 = require_pg_types();
    function TypeOverrides(userTypes) {
      this._types = userTypes || types2, this.text = {}, this.binary = {};
    }
    TypeOverrides.prototype.getOverrides = function(format) {
      switch (format) {
        case "text":
          return this.text;
        case "binary":
          return this.binary;
        default:
          return {};
      }
    };
    TypeOverrides.prototype.setTypeParser = function(oid, format, parseFn) {
      typeof format == "function" && (parseFn = format, format = "text"), this.getOverrides(format)[oid] = parseFn;
    };
    TypeOverrides.prototype.getTypeParser = function(oid, format) {
      return format = format || "text", this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
    };
    module2.exports = TypeOverrides;
  }
});

// node_modules/pg-connection-string/index.js
var require_pg_connection_string = __commonJS({
  "node_modules/pg-connection-string/index.js"(exports2, module2) {
    "use strict";
    function parse(str, options = {}) {
      if (str.charAt(0) === "/") {
        let config2 = str.split(" ");
        return { host: config2[0], database: config2[1] };
      }
      let config = /* @__PURE__ */ Object.create(null), result, dummyHost = !1;
      / |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str) && (str = encodeURI(str).replace(/%25(\d\d)/g, "%$1"));
      try {
        try {
          result = new URL(str, "postgres://base");
        } catch {
          result = new URL(str.replace("@/", "@___DUMMY___/"), "postgres://base"), dummyHost = !0;
        }
      } catch (err) {
        throw err.input && (err.input = "*****REDACTED*****"), err;
      }
      for (let entry of result.searchParams.entries())
        config[entry[0]] = entry[1];
      if (config.user = config.user || decodeURIComponent(result.username), config.password = config.password || decodeURIComponent(result.password), result.protocol == "socket:")
        return config.host = decodeURI(result.pathname), config.database = result.searchParams.get("db"), config.client_encoding = result.searchParams.get("encoding"), config;
      let hostname = (dummyHost ? "" : result.hostname).replace(/^\[(.+)\]$/, "$1");
      config.host ? hostname && /^%2f/i.test(hostname) && (result.pathname = hostname + result.pathname) : config.host = decodeURIComponent(hostname), config.port || (config.port = result.port);
      let pathname = result.pathname.slice(1) || null;
      config.database = pathname ? decodeURI(pathname) : null, (config.ssl === "true" || config.ssl === "1") && (config.ssl = !0), config.ssl === "0" && (config.ssl = !1), (config.sslcert || config.sslkey || config.sslrootcert || config.sslmode) && (config.ssl = {}), config.sslnegotiation === "direct" && config.ssl === void 0 && (config.ssl = !0);
      let fs = config.sslcert || config.sslkey || config.sslrootcert ? require("fs") : null;
      if (config.sslcert && (config.ssl.cert = fs.readFileSync(config.sslcert).toString()), config.sslkey && (config.ssl.key = fs.readFileSync(config.sslkey).toString()), config.sslrootcert && (config.ssl.ca = fs.readFileSync(config.sslrootcert).toString()), options.useLibpqCompat && config.uselibpqcompat)
        throw new Error("Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.");
      if (config.uselibpqcompat === "true" || options.useLibpqCompat)
        switch (config.sslmode) {
          case "disable": {
            config.ssl = !1;
            break;
          }
          case "prefer": {
            config.ssl.rejectUnauthorized = !1;
            break;
          }
          case "require": {
            config.sslrootcert ? config.ssl.checkServerIdentity = function() {
            } : config.ssl.rejectUnauthorized = !1;
            break;
          }
          case "verify-ca": {
            if (!config.ssl.ca)
              throw new Error(
                "SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security."
              );
            config.ssl.checkServerIdentity = function() {
            };
            break;
          }
          case "verify-full":
            break;
        }
      else
        switch (config.sslmode) {
          case "disable": {
            config.ssl = !1;
            break;
          }
          case "prefer":
          case "require":
          case "verify-ca":
          case "verify-full": {
            config.sslmode !== "verify-full" && deprecatedSslModeWarning(config.sslmode);
            break;
          }
          case "no-verify": {
            config.ssl.rejectUnauthorized = !1;
            break;
          }
        }
      return config;
    }
    function toConnectionOptions(sslConfig) {
      return Object.entries(sslConfig).reduce((c, [key, value]) => (value != null && (c[key] = value), c), /* @__PURE__ */ Object.create(null));
    }
    function toClientConfig(config) {
      return Object.entries(config).reduce((c, [key, value]) => {
        if (key === "ssl") {
          let sslConfig = value;
          typeof sslConfig == "boolean" && (c[key] = sslConfig), typeof sslConfig == "object" && (c[key] = toConnectionOptions(sslConfig));
        } else if (value != null)
          if (key === "port") {
            if (value !== "") {
              let v = parseInt(value, 10);
              if (isNaN(v))
                throw new Error(`Invalid ${key}: ${value}`);
              c[key] = v;
            }
          } else
            c[key] = value;
        return c;
      }, /* @__PURE__ */ Object.create(null));
    }
    function parseIntoClientConfig(str) {
      return toClientConfig(parse(str));
    }
    function deprecatedSslModeWarning(sslmode) {
      !deprecatedSslModeWarning.warned && typeof process < "u" && process.emitWarning && (deprecatedSslModeWarning.warned = !0, process.emitWarning(`SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=${sslmode}'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.`));
    }
    module2.exports = parse;
    parse.parse = parse;
    parse.toClientConfig = toClientConfig;
    parse.parseIntoClientConfig = parseIntoClientConfig;
  }
});

// node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = __commonJS({
  "node_modules/pg/lib/connection-parameters.js"(exports2, module2) {
    "use strict";
    var dns = require("dns"), defaults = require_defaults(), parse = require_pg_connection_string().parse, val = function(key, config, envVar) {
      return config[key] ? config[key] : (envVar === void 0 ? envVar = process.env["PG" + key.toUpperCase()] : envVar === !1 || (envVar = process.env[envVar]), envVar || defaults[key]);
    }, readSSLConfigFromEnvironment = function() {
      switch (process.env.PGSSLMODE) {
        case "disable":
          return !1;
        case "prefer":
        case "require":
        case "verify-ca":
        case "verify-full":
          return !0;
        case "no-verify":
          return { rejectUnauthorized: !1 };
      }
      return defaults.ssl;
    }, quoteParamValue = function(value) {
      return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
    }, add = function(params, config, paramName) {
      let value = config[paramName];
      value != null && params.push(paramName + "=" + quoteParamValue(value));
    }, ConnectionParameters = class {
      constructor(config) {
        if (config = typeof config == "string" ? parse(config) : config || {}, config.connectionString && (config = Object.assign({}, config, parse(config.connectionString))), this.user = val("user", config), this.database = val("database", config), this.database === void 0 && (this.database = this.user), this.port = parseInt(val("port", config), 10), this.host = val("host", config), Object.defineProperty(this, "password", {
          configurable: !0,
          enumerable: !1,
          writable: !0,
          value: val("password", config)
        }), this.binary = val("binary", config), this.options = val("options", config), this.ssl = typeof config.ssl > "u" ? readSSLConfigFromEnvironment() : config.ssl, typeof this.ssl == "string" && this.ssl === "true" && (this.ssl = !0), this.ssl === "no-verify" && (this.ssl = { rejectUnauthorized: !1 }), this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", {
          enumerable: !1
        }), this.sslnegotiation = val("sslnegotiation", config, "PGSSLNEGOTIATION"), this.sslnegotiation !== void 0 && this.sslnegotiation !== "postgres" && this.sslnegotiation !== "direct")
          throw new Error(
            `Invalid sslnegotiation value: "${this.sslnegotiation}". Valid values are "postgres" and "direct".`
          );
        if (this.sslnegotiation === "direct" && !this.ssl)
          throw new Error("sslnegotiation=direct requires SSL to be enabled");
        this.client_encoding = val("client_encoding", config), this.replication = val("replication", config), this.isDomainSocket = !(this.host || "").indexOf("/"), this.application_name = val("application_name", config, "PGAPPNAME"), this.fallback_application_name = val("fallback_application_name", config, !1), this.statement_timeout = val("statement_timeout", config, !1), this.lock_timeout = val("lock_timeout", config, !1), this.idle_in_transaction_session_timeout = val("idle_in_transaction_session_timeout", config, !1), this.query_timeout = val("query_timeout", config, !1), config.connectionTimeoutMillis === void 0 ? this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0 : this.connect_timeout = Math.floor(config.connectionTimeoutMillis / 1e3), config.keepAlive === !1 ? this.keepalives = 0 : config.keepAlive === !0 && (this.keepalives = 1), typeof config.keepAliveInitialDelayMillis == "number" && (this.keepalives_idle = Math.floor(config.keepAliveInitialDelayMillis / 1e3));
      }
      getLibpqConnectionString(cb) {
        let params = [];
        add(params, this, "user"), add(params, this, "password"), add(params, this, "port"), add(params, this, "application_name"), add(params, this, "fallback_application_name"), add(params, this, "connect_timeout"), add(params, this, "options");
        let ssl = typeof this.ssl == "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
        if (add(params, ssl, "sslmode"), add(params, ssl, "sslca"), add(params, ssl, "sslkey"), add(params, ssl, "sslcert"), add(params, ssl, "sslrootcert"), add(params, this, "sslnegotiation"), this.database && params.push("dbname=" + quoteParamValue(this.database)), this.replication && params.push("replication=" + quoteParamValue(this.replication)), this.host && params.push("host=" + quoteParamValue(this.host)), this.isDomainSocket)
          return cb(null, params.join(" "));
        this.client_encoding && params.push("client_encoding=" + quoteParamValue(this.client_encoding)), dns.lookup(this.host, function(err, address) {
          return err ? cb(err, null) : (params.push("hostaddr=" + quoteParamValue(address)), cb(null, params.join(" ")));
        });
      }
    };
    module2.exports = ConnectionParameters;
  }
});

// node_modules/pg/lib/result.js
var require_result = __commonJS({
  "node_modules/pg/lib/result.js"(exports2, module2) {
    "use strict";
    var types2 = require_pg_types(), matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/, Result = class {
      constructor(rowMode, types3) {
        this.command = null, this.rowCount = null, this.oid = null, this.rows = [], this.fields = [], this._parsers = void 0, this._types = types3, this.RowCtor = null, this.rowAsArray = rowMode === "array", this.rowAsArray && (this.parseRow = this._parseRowAsArray), this._prebuiltEmptyResultObject = null;
      }
      // adds a command complete message
      addCommandComplete(msg) {
        let match;
        msg.text ? match = matchRegexp.exec(msg.text) : match = matchRegexp.exec(msg.command), match && (this.command = match[1], match[3] ? (this.oid = parseInt(match[2], 10), this.rowCount = parseInt(match[3], 10)) : match[2] && (this.rowCount = parseInt(match[2], 10)));
      }
      _parseRowAsArray(rowData) {
        let row = new Array(rowData.length);
        for (let i = 0, len = rowData.length; i < len; i++) {
          let rawValue = rowData[i];
          rawValue !== null ? row[i] = this._parsers[i](rawValue) : row[i] = null;
        }
        return row;
      }
      parseRow(rowData) {
        let row = { ...this._prebuiltEmptyResultObject };
        for (let i = 0, len = rowData.length; i < len; i++) {
          let rawValue = rowData[i], field = this.fields[i].name;
          if (rawValue !== null) {
            let v = this.fields[i].format === "binary" ? Buffer.from(rawValue) : rawValue;
            row[field] = this._parsers[i](v);
          } else
            row[field] = null;
        }
        return row;
      }
      addRow(row) {
        this.rows.push(row);
      }
      addFields(fieldDescriptions) {
        this.fields = fieldDescriptions, this.fields.length && (this._parsers = new Array(fieldDescriptions.length));
        let row = /* @__PURE__ */ Object.create(null);
        for (let i = 0; i < fieldDescriptions.length; i++) {
          let desc = fieldDescriptions[i];
          row[desc.name] = null, this._types ? this._parsers[i] = this._types.getTypeParser(desc.dataTypeID, desc.format || "text") : this._parsers[i] = types2.getTypeParser(desc.dataTypeID, desc.format || "text");
        }
        this._prebuiltEmptyResultObject = { ...row };
      }
    };
    module2.exports = Result;
  }
});

// node_modules/pg/lib/query.js
var require_query = __commonJS({
  "node_modules/pg/lib/query.js"(exports2, module2) {
    "use strict";
    var { EventEmitter } = require("events"), Result = require_result(), utils = require_utils(), Query = class extends EventEmitter {
      constructor(config, values, callback) {
        super(), config = utils.normalizeQueryConfig(config, values, callback), this.text = config.text, this.values = config.values, this.rows = config.rows, this.types = config.types, this.name = config.name, this.queryMode = config.queryMode, this.binary = config.binary, this.portal = config.portal || "", this.callback = config.callback, this._rowMode = config.rowMode, process.domain && config.callback && (this.callback = process.domain.bind(config.callback)), this._result = new Result(this._rowMode, this.types), this._results = this._result, this._canceledDueToError = !1;
      }
      requiresPreparation() {
        return this.queryMode === "extended" || this.name || this.rows ? !0 : !this.text || !this.values ? !1 : this.values.length > 0;
      }
      _checkForMultirow() {
        this._result.command && (Array.isArray(this._results) || (this._results = [this._result]), this._result = new Result(this._rowMode, this._result._types), this._results.push(this._result));
      }
      // associates row metadata from the supplied
      // message with this query object
      // metadata used when parsing row results
      handleRowDescription(msg) {
        this._checkForMultirow(), this._result.addFields(msg.fields), this._accumulateRows = this.callback || !this.listeners("row").length;
      }
      handleDataRow(msg) {
        let row;
        if (!this._canceledDueToError) {
          try {
            row = this._result.parseRow(msg.fields);
          } catch (err) {
            this._canceledDueToError = err;
            return;
          }
          this.emit("row", row, this._result), this._accumulateRows && this._result.addRow(row);
        }
      }
      handleCommandComplete(msg, connection) {
        this._checkForMultirow(), this._result.addCommandComplete(msg), this.rows && connection.sync();
      }
      // if a named prepared statement is created with empty query text
      // the backend will send an emptyQuery message but *not* a command complete message
      // since we pipeline sync immediately after execute we don't need to do anything here
      // unless we have rows specified, in which case we did not pipeline the initial sync call
      handleEmptyQuery(connection) {
        this.rows && connection.sync();
      }
      handleError(err, connection) {
        if (this._canceledDueToError && (err = this._canceledDueToError, this._canceledDueToError = !1), this.callback)
          return this.callback(err);
        this.emit("error", err);
      }
      handleReadyForQuery(con) {
        if (this._canceledDueToError)
          return this.handleError(this._canceledDueToError, con);
        if (this.callback)
          try {
            this.callback(null, this._results);
          } catch (err) {
            process.nextTick(() => {
              throw err;
            });
          }
        this.emit("end", this._results);
      }
      submit(connection) {
        if (typeof this.text != "string" && typeof this.name != "string")
          return new Error("A query must have either text or a name. Supplying neither is unsupported.");
        let previous = connection.parsedStatements[this.name] || connection.submittedNamedStatements[this.name];
        if (this.text && previous && this.text !== previous)
          return new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
        if (this.values && !Array.isArray(this.values))
          return new Error("Query values must be an array");
        if (this.requiresPreparation()) {
          connection.stream.cork && connection.stream.cork();
          try {
            this.prepare(connection);
          } finally {
            connection.stream.uncork && connection.stream.uncork();
          }
        } else
          connection.query(this.text);
        return null;
      }
      hasBeenParsed(connection) {
        return this.name && (connection.parsedStatements[this.name] !== void 0 || connection.submittedNamedStatements[this.name] !== void 0);
      }
      handlePortalSuspended(connection) {
        this._getRows(connection, this.rows);
      }
      _getRows(connection, rows) {
        connection.execute({
          portal: this.portal,
          rows
        }), rows ? connection.flush() : connection.sync();
      }
      // http://developer.postgresql.org/pgdocs/postgres/protocol-flow.html#PROTOCOL-FLOW-EXT-QUERY
      prepare(connection) {
        this.hasBeenParsed(connection) || (connection.parse({
          text: this.text,
          name: this.name,
          types: this.types
        }), this.name && (connection.submittedNamedStatements[this.name] = this.text));
        try {
          connection.bind({
            portal: this.portal,
            statement: this.name,
            values: this.values,
            binary: this.binary,
            valueMapper: utils.prepareValue
          });
        } catch (err) {
          connection.close({ type: "S", name: this.name }), connection.sync(), this.handleError(err, connection);
          return;
        }
        connection.describe({
          type: "P",
          name: this.portal || ""
        }), this._getRows(connection, this.rows);
      }
      handleCopyInResponse(connection) {
        connection.sendCopyFail("No source stream defined");
      }
      handleCopyData(msg, connection) {
      }
    };
    module2.exports = Query;
  }
});

// node_modules/pg-protocol/dist/messages.js
var require_messages = __commonJS({
  "node_modules/pg-protocol/dist/messages.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: !0 });
    exports2.NoticeMessage = exports2.DataRowMessage = exports2.CommandCompleteMessage = exports2.ReadyForQueryMessage = exports2.NotificationResponseMessage = exports2.BackendKeyDataMessage = exports2.AuthenticationMD5Password = exports2.ParameterStatusMessage = exports2.ParameterDescriptionMessage = exports2.RowDescriptionMessage = exports2.Field = exports2.CopyResponse = exports2.CopyDataMessage = exports2.DatabaseError = exports2.copyDone = exports2.emptyQuery = exports2.replicationStart = exports2.portalSuspended = exports2.noData = exports2.closeComplete = exports2.bindComplete = exports2.parseComplete = void 0;
    exports2.parseComplete = {
      name: "parseComplete",
      length: 5
    };
    exports2.bindComplete = {
      name: "bindComplete",
      length: 5
    };
    exports2.closeComplete = {
      name: "closeComplete",
      length: 5
    };
    exports2.noData = {
      name: "noData",
      length: 5
    };
    exports2.portalSuspended = {
      name: "portalSuspended",
      length: 5
    };
    exports2.replicationStart = {
      name: "replicationStart",
      length: 4
    };
    exports2.emptyQuery = {
      name: "emptyQuery",
      length: 4
    };
    exports2.copyDone = {
      name: "copyDone",
      length: 4
    };
    var DatabaseError = class extends Error {
      constructor(message, length, name) {
        super(message), this.length = length, this.name = name;
      }
    };
    exports2.DatabaseError = DatabaseError;
    var CopyDataMessage = class {
      constructor(length, chunk) {
        this.length = length, this.chunk = chunk, this.name = "copyData";
      }
    };
    exports2.CopyDataMessage = CopyDataMessage;
    var CopyResponse = class {
      constructor(length, name, binary, columnCount) {
        this.length = length, this.name = name, this.binary = binary, this.columnTypes = new Array(columnCount);
      }
    };
    exports2.CopyResponse = CopyResponse;
    var Field = class {
      constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
        this.name = name, this.tableID = tableID, this.columnID = columnID, this.dataTypeID = dataTypeID, this.dataTypeSize = dataTypeSize, this.dataTypeModifier = dataTypeModifier, this.format = format;
      }
    };
    exports2.Field = Field;
    var RowDescriptionMessage = class {
      constructor(length, fieldCount) {
        this.length = length, this.fieldCount = fieldCount, this.name = "rowDescription", this.fields = new Array(this.fieldCount);
      }
    };
    exports2.RowDescriptionMessage = RowDescriptionMessage;
    var ParameterDescriptionMessage = class {
      constructor(length, parameterCount) {
        this.length = length, this.parameterCount = parameterCount, this.name = "parameterDescription", this.dataTypeIDs = new Array(this.parameterCount);
      }
    };
    exports2.ParameterDescriptionMessage = ParameterDescriptionMessage;
    var ParameterStatusMessage = class {
      constructor(length, parameterName, parameterValue) {
        this.length = length, this.parameterName = parameterName, this.parameterValue = parameterValue, this.name = "parameterStatus";
      }
    };
    exports2.ParameterStatusMessage = ParameterStatusMessage;
    var AuthenticationMD5Password = class {
      constructor(length, salt) {
        this.length = length, this.salt = salt, this.name = "authenticationMD5Password";
      }
    };
    exports2.AuthenticationMD5Password = AuthenticationMD5Password;
    var BackendKeyDataMessage = class {
      constructor(length, processID, secretKey) {
        this.length = length, this.processID = processID, this.secretKey = secretKey, this.name = "backendKeyData";
      }
    };
    exports2.BackendKeyDataMessage = BackendKeyDataMessage;
    var NotificationResponseMessage = class {
      constructor(length, processId, channel, payload) {
        this.length = length, this.processId = processId, this.channel = channel, this.payload = payload, this.name = "notification";
      }
    };
    exports2.NotificationResponseMessage = NotificationResponseMessage;
    var ReadyForQueryMessage = class {
      constructor(length, status) {
        this.length = length, this.status = status, this.name = "readyForQuery";
      }
    };
    exports2.ReadyForQueryMessage = ReadyForQueryMessage;
    var CommandCompleteMessage = class {
      constructor(length, text) {
        this.length = length, this.text = text, this.name = "commandComplete";
      }
    };
    exports2.CommandCompleteMessage = CommandCompleteMessage;
    var DataRowMessage = class {
      constructor(length, fields) {
        this.length = length, this.fields = fields, this.name = "dataRow", this.fieldCount = fields.length;
      }
    };
    exports2.DataRowMessage = DataRowMessage;
    var NoticeMessage = class {
      constructor(length, message) {
        this.length = length, this.message = message, this.name = "notice";
      }
    };
    exports2.NoticeMessage = NoticeMessage;
  }
});

// node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = __commonJS({
  "node_modules/pg-protocol/dist/buffer-writer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: !0 });
    exports2.Writer = void 0;
    var Writer = class {
      constructor(size = 256) {
        this.size = size, this.offset = 5, this.headerPosition = 0, this.buffer = Buffer.allocUnsafe(size);
      }
      ensure(size) {
        if (this.buffer.length - this.offset < size) {
          let oldBuffer = this.buffer, newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
          this.buffer = Buffer.allocUnsafe(newSize), oldBuffer.copy(this.buffer, 0, 0, this.offset);
        }
      }
      addInt32(num) {
        return this.ensure(4), this.buffer[this.offset++] = num >>> 24 & 255, this.buffer[this.offset++] = num >>> 16 & 255, this.buffer[this.offset++] = num >>> 8 & 255, this.buffer[this.offset++] = num >>> 0 & 255, this;
      }
      addInt16(num) {
        return this.ensure(2), this.buffer[this.offset++] = num >>> 8 & 255, this.buffer[this.offset++] = num >>> 0 & 255, this;
      }
      addCString(string) {
        if (!string)
          this.ensure(1);
        else {
          let len = Buffer.byteLength(string);
          this.ensure(len + 1), this.buffer.write(string, this.offset, "utf-8"), this.offset += len;
        }
        return this.buffer[this.offset++] = 0, this;
      }
      addString(string = "") {
        let len = Buffer.byteLength(string);
        return this.ensure(len), this.buffer.write(string, this.offset), this.offset += len, this;
      }
      // Write an Int32 byte-length prefix immediately followed by the string's UTF-8
      // bytes. Postgres' Bind wire format prefixes every parameter with its length,
      // and doing it in one method computes Buffer.byteLength ONCE — the previous
      // `addInt32(Buffer.byteLength(s)).addString(s)` pairing scanned the string
      // three times (byteLength for the prefix, byteLength again inside addString,
      // then the encode), which is costly for large text parameters.
      addInt32PrefixedString(string) {
        let len = Buffer.byteLength(string);
        this.ensure(4 + len);
        let buffer = this.buffer, offset = this.offset;
        return buffer[offset++] = len >>> 24 & 255, buffer[offset++] = len >>> 16 & 255, buffer[offset++] = len >>> 8 & 255, buffer[offset++] = len >>> 0 & 255, buffer.write(string, offset, "utf-8"), this.offset = offset + len, this;
      }
      add(otherBuffer) {
        return this.ensure(otherBuffer.length), otherBuffer.copy(this.buffer, this.offset), this.offset += otherBuffer.length, this;
      }
      /**
       * Appends an uninitialized block of {@link size} bytes to the buffer and returns its offset.
       */
      reserveUnsafe(size) {
        let offset = this.offset;
        return this.ensure(size), this.offset += size, offset;
      }
      join(code) {
        if (code) {
          this.buffer[this.headerPosition] = code;
          let length = this.offset - (this.headerPosition + 1);
          this.buffer.writeInt32BE(length, this.headerPosition + 1);
        }
        return this.buffer.slice(code ? 0 : 5, this.offset);
      }
      flush(code) {
        let result = this.join(code);
        return this.offset = 5, this.headerPosition = 0, this.buffer = Buffer.allocUnsafe(this.size), result;
      }
      clear() {
        this.offset = 5, this.headerPosition = 0;
      }
    };
    exports2.Writer = Writer;
  }
});

// node_modules/pg-protocol/dist/serializer.js
var require_serializer = __commonJS({
  "node_modules/pg-protocol/dist/serializer.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: !0 });
    exports2.serialize = void 0;
    var buffer_writer_1 = require_buffer_writer(), writer = new buffer_writer_1.Writer(), startup = (opts) => {
      writer.addInt16(3).addInt16(0);
      for (let key of Object.keys(opts))
        writer.addCString(key).addCString(opts[key]);
      writer.addCString("client_encoding").addCString("UTF8");
      let bodyBuffer = writer.addCString("").flush(), length = bodyBuffer.length + 4;
      return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
    }, requestSsl = () => {
      let response = Buffer.allocUnsafe(8);
      return response.writeInt32BE(8, 0), response.writeInt32BE(80877103, 4), response;
    }, password = (password2) => writer.addCString(password2).flush(
      112
      /* code.startup */
    ), sendSASLInitialResponseMessage = function(mechanism, initialResponse) {
      return writer.addCString(mechanism).addInt32PrefixedString(initialResponse), writer.flush(
        112
        /* code.startup */
      );
    }, sendSCRAMClientFinalMessage = function(additionalData) {
      return writer.addString(additionalData).flush(
        112
        /* code.startup */
      );
    }, query = (text) => writer.addCString(text).flush(
      81
      /* code.query */
    ), emptyArray = [], parse = (query2) => {
      let name = query2.name || "";
      name.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error("You supplied %s (%s)", name, name.length), console.error("This can cause conflicts and silent errors executing queries"));
      let types2 = query2.types || emptyArray, len = types2.length, buffer = writer.addCString(name).addCString(query2.text).addInt16(len);
      for (let i = 0; i < len; i++)
        buffer.addInt32(types2[i]);
      return writer.flush(
        80
        /* code.parse */
      );
    }, writeValues = function(values, valueMapper, formatsOffset) {
      let len = values.length;
      for (let i = 0; i < len; i++) {
        let mappedVal = valueMapper ? valueMapper(values[i], i) : values[i], formatByte = 0;
        mappedVal == null ? writer.addInt32(-1) : mappedVal instanceof Buffer ? (formatByte = 1, writer.addInt32(mappedVal.length), writer.add(mappedVal)) : writer.addInt32PrefixedString(mappedVal);
        let buf = writer.buffer;
        buf[formatsOffset++] = 0, buf[formatsOffset++] = formatByte;
      }
    }, bind = (config = {}) => {
      let portal = config.portal || "", statement = config.statement || "", binary = config.binary || !1, values = config.values || emptyArray, len = values.length;
      writer.addCString(portal).addCString(statement), writer.addInt16(len);
      let formatsOffset = writer.reserveUnsafe(len * 2);
      writer.addInt16(len);
      try {
        writeValues(values, config.valueMapper, formatsOffset);
      } catch (err) {
        throw writer.clear(), err;
      }
      return writer.addInt16(1), writer.addInt16(
        binary ? 1 : 0
        /* ParamType.STRING */
      ), writer.flush(
        66
        /* code.bind */
      );
    }, emptyExecute = Buffer.from([69, 0, 0, 0, 9, 0, 0, 0, 0, 0]), execute = (config) => {
      if (!config || !config.portal && !config.rows)
        return emptyExecute;
      let portal = config.portal || "", rows = config.rows || 0, portalLength = Buffer.byteLength(portal), len = 4 + portalLength + 1 + 4, buff = Buffer.allocUnsafe(1 + len);
      return buff[0] = 69, buff.writeInt32BE(len, 1), buff.write(portal, 5, "utf-8"), buff[portalLength + 5] = 0, buff.writeUInt32BE(rows, buff.length - 4), buff;
    }, cancel = (processID, secretKey) => {
      let buffer = Buffer.allocUnsafe(16);
      return buffer.writeInt32BE(16, 0), buffer.writeInt16BE(1234, 4), buffer.writeInt16BE(5678, 6), buffer.writeInt32BE(processID, 8), buffer.writeInt32BE(secretKey, 12), buffer;
    }, cstringMessage = (code, string) => {
      let len = 4 + Buffer.byteLength(string) + 1, buffer = Buffer.allocUnsafe(1 + len);
      return buffer[0] = code, buffer.writeInt32BE(len, 1), buffer.write(string, 5, "utf-8"), buffer[len] = 0, buffer;
    }, emptyDescribePortal = writer.addCString("P").flush(
      68
      /* code.describe */
    ), emptyDescribeStatement = writer.addCString("S").flush(
      68
      /* code.describe */
    ), describe = (msg) => msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement, close = (msg) => {
      let text = `${msg.type}${msg.name || ""}`;
      return cstringMessage(67, text);
    }, copyData = (chunk) => writer.add(chunk).flush(
      100
      /* code.copyFromChunk */
    ), copyFail = (message) => cstringMessage(102, message), codeOnlyBuffer = (code) => Buffer.from([code, 0, 0, 0, 4]), flushBuffer = codeOnlyBuffer(
      72
      /* code.flush */
    ), syncBuffer = codeOnlyBuffer(
      83
      /* code.sync */
    ), endBuffer = codeOnlyBuffer(
      88
      /* code.end */
    ), copyDoneBuffer = codeOnlyBuffer(
      99
      /* code.copyDone */
    ), serialize = {
      startup,
      password,
      requestSsl,
      sendSASLInitialResponseMessage,
      sendSCRAMClientFinalMessage,
      query,
      parse,
      bind,
      execute,
      describe,
      close,
      flush: () => flushBuffer,
      sync: () => syncBuffer,
      end: () => endBuffer,
      copyData,
      copyDone: () => copyDoneBuffer,
      copyFail,
      cancel
    };
    exports2.serialize = serialize;
  }
});

// node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = __commonJS({
  "node_modules/pg-protocol/dist/buffer-reader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: !0 });
    exports2.BufferReader = void 0;
    var BufferReader = class {
      constructor(offset = 0) {
        this.offset = offset, this.buffer = Buffer.allocUnsafe(0), this.encoding = "utf-8";
      }
      setBuffer(offset, buffer) {
        this.offset = offset, this.buffer = buffer;
      }
      int16() {
        let result = this.buffer.readInt16BE(this.offset);
        return this.offset += 2, result;
      }
      byte() {
        let result = this.buffer[this.offset];
        return this.offset++, result;
      }
      int32() {
        let result = this.buffer.readInt32BE(this.offset);
        return this.offset += 4, result;
      }
      uint32() {
        let result = this.buffer.readUInt32BE(this.offset);
        return this.offset += 4, result;
      }
      string(length) {
        let result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
        return this.offset += length, result;
      }
      cstring() {
        let start = this.offset, end = start;
        for (; this.buffer[end++]; )
          ;
        return this.offset = end, this.buffer.toString(this.encoding, start, end - 1);
      }
      bytes(length) {
        let result = this.buffer.slice(this.offset, this.offset + length);
        return this.offset += length, result;
      }
    };
    exports2.BufferReader = BufferReader;
  }
});

// node_modules/pg-protocol/dist/parser.js
var require_parser = __commonJS({
  "node_modules/pg-protocol/dist/parser.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: !0 });
    exports2.Parser = void 0;
    var messages_1 = require_messages(), buffer_reader_1 = require_buffer_reader(), CODE_LENGTH = 1, LEN_LENGTH = 4, HEADER_LENGTH = CODE_LENGTH + LEN_LENGTH, LATEINIT_LENGTH = -1, emptyBuffer = Buffer.allocUnsafe(0), Parser = class {
      constructor(opts) {
        if (this.buffer = emptyBuffer, this.bufferLength = 0, this.bufferOffset = 0, this.reader = new buffer_reader_1.BufferReader(), opts?.mode === "binary")
          throw new Error("Binary mode not supported yet");
        this.mode = opts?.mode || "text";
      }
      parse(buffer, callback) {
        this.mergeBuffer(buffer);
        let bufferFullLength = this.bufferOffset + this.bufferLength, offset = this.bufferOffset;
        for (; offset + HEADER_LENGTH <= bufferFullLength; ) {
          let code = this.buffer[offset], length = this.buffer.readUInt32BE(offset + CODE_LENGTH), fullMessageLength = CODE_LENGTH + length;
          if (fullMessageLength + offset <= bufferFullLength) {
            let message = this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer);
            callback(message), offset += fullMessageLength;
          } else
            break;
        }
        offset === bufferFullLength ? (this.buffer = emptyBuffer, this.bufferLength = 0, this.bufferOffset = 0) : (this.bufferLength = bufferFullLength - offset, this.bufferOffset = offset);
      }
      mergeBuffer(buffer) {
        if (this.bufferLength > 0) {
          let newLength = this.bufferLength + buffer.byteLength;
          if (newLength + this.bufferOffset > this.buffer.byteLength) {
            let newBuffer;
            if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength)
              newBuffer = this.buffer;
            else {
              let newBufferLength = this.buffer.byteLength * 2;
              for (; newLength >= newBufferLength; )
                newBufferLength *= 2;
              newBuffer = Buffer.allocUnsafe(newBufferLength);
            }
            this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength), this.buffer = newBuffer, this.bufferOffset = 0;
          }
          buffer.copy(this.buffer, this.bufferOffset + this.bufferLength), this.bufferLength = newLength;
        } else
          this.buffer = buffer, this.bufferOffset = 0, this.bufferLength = buffer.byteLength;
      }
      handlePacket(offset, code, length, bytes) {
        let { reader } = this;
        reader.setBuffer(offset, bytes);
        let message;
        switch (code) {
          case 50:
            message = messages_1.bindComplete;
            break;
          case 49:
            message = messages_1.parseComplete;
            break;
          case 51:
            message = messages_1.closeComplete;
            break;
          case 110:
            message = messages_1.noData;
            break;
          case 115:
            message = messages_1.portalSuspended;
            break;
          case 99:
            message = messages_1.copyDone;
            break;
          case 87:
            message = messages_1.replicationStart;
            break;
          case 73:
            message = messages_1.emptyQuery;
            break;
          case 68:
            message = parseDataRowMessage(reader);
            break;
          case 67:
            message = parseCommandCompleteMessage(reader);
            break;
          case 90:
            message = parseReadyForQueryMessage(reader);
            break;
          case 65:
            message = parseNotificationMessage(reader);
            break;
          case 82:
            message = parseAuthenticationResponse(reader, length);
            break;
          case 83:
            message = parseParameterStatusMessage(reader);
            break;
          case 75:
            message = parseBackendKeyData(reader);
            break;
          case 69:
            message = parseErrorMessage(reader, "error");
            break;
          case 78:
            message = parseErrorMessage(reader, "notice");
            break;
          case 84:
            message = parseRowDescriptionMessage(reader);
            break;
          case 116:
            message = parseParameterDescriptionMessage(reader);
            break;
          case 71:
            message = parseCopyInMessage(reader);
            break;
          case 72:
            message = parseCopyOutMessage(reader);
            break;
          case 100:
            message = parseCopyData(reader, length);
            break;
          default:
            return new messages_1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
        }
        return reader.setBuffer(0, emptyBuffer), message.length = length, message;
      }
    };
    exports2.Parser = Parser;
    var parseReadyForQueryMessage = (reader) => {
      let status = reader.string(1);
      return new messages_1.ReadyForQueryMessage(LATEINIT_LENGTH, status);
    }, parseCommandCompleteMessage = (reader) => {
      let text = reader.cstring();
      return new messages_1.CommandCompleteMessage(LATEINIT_LENGTH, text);
    }, parseCopyData = (reader, length) => {
      let chunk = reader.bytes(length - 4);
      return new messages_1.CopyDataMessage(LATEINIT_LENGTH, chunk);
    }, parseCopyInMessage = (reader) => parseCopyMessage(reader, "copyInResponse"), parseCopyOutMessage = (reader) => parseCopyMessage(reader, "copyOutResponse"), parseCopyMessage = (reader, messageName) => {
      let isBinary = reader.byte() !== 0, columnCount = reader.int16(), message = new messages_1.CopyResponse(LATEINIT_LENGTH, messageName, isBinary, columnCount);
      for (let i = 0; i < columnCount; i++)
        message.columnTypes[i] = reader.int16();
      return message;
    }, parseNotificationMessage = (reader) => {
      let processId = reader.int32(), channel = reader.cstring(), payload = reader.cstring();
      return new messages_1.NotificationResponseMessage(LATEINIT_LENGTH, processId, channel, payload);
    }, parseRowDescriptionMessage = (reader) => {
      let fieldCount = reader.int16(), message = new messages_1.RowDescriptionMessage(LATEINIT_LENGTH, fieldCount);
      for (let i = 0; i < fieldCount; i++)
        message.fields[i] = parseField(reader);
      return message;
    }, parseField = (reader) => {
      let name = reader.cstring(), tableID = reader.uint32(), columnID = reader.int16(), dataTypeID = reader.uint32(), dataTypeSize = reader.int16(), dataTypeModifier = reader.int32(), mode = reader.int16() === 0 ? "text" : "binary";
      return new messages_1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
    }, parseParameterDescriptionMessage = (reader) => {
      let parameterCount = reader.int16(), message = new messages_1.ParameterDescriptionMessage(LATEINIT_LENGTH, parameterCount);
      for (let i = 0; i < parameterCount; i++)
        message.dataTypeIDs[i] = reader.uint32();
      return message;
    }, parseDataRowMessage = (reader) => {
      let fieldCount = reader.int16(), fields = new Array(fieldCount);
      for (let i = 0; i < fieldCount; i++) {
        let len = reader.int32();
        fields[i] = len === -1 ? null : reader.string(len);
      }
      return new messages_1.DataRowMessage(LATEINIT_LENGTH, fields);
    }, parseParameterStatusMessage = (reader) => {
      let name = reader.cstring(), value = reader.cstring();
      return new messages_1.ParameterStatusMessage(LATEINIT_LENGTH, name, value);
    }, parseBackendKeyData = (reader) => {
      let processID = reader.int32(), secretKey = reader.int32();
      return new messages_1.BackendKeyDataMessage(LATEINIT_LENGTH, processID, secretKey);
    }, parseAuthenticationResponse = (reader, length) => {
      let code = reader.int32(), message = {
        name: "authenticationOk",
        length
      };
      switch (code) {
        case 0:
          break;
        case 3:
          message.length === 8 && (message.name = "authenticationCleartextPassword");
          break;
        case 5:
          if (message.length === 12) {
            message.name = "authenticationMD5Password";
            let salt = reader.bytes(4);
            return new messages_1.AuthenticationMD5Password(LATEINIT_LENGTH, salt);
          }
          break;
        case 10:
          {
            message.name = "authenticationSASL", message.mechanisms = [];
            let mechanism;
            do
              mechanism = reader.cstring(), mechanism && message.mechanisms.push(mechanism);
            while (mechanism);
          }
          break;
        case 11:
          message.name = "authenticationSASLContinue", message.data = reader.string(length - 8);
          break;
        case 12:
          message.name = "authenticationSASLFinal", message.data = reader.string(length - 8);
          break;
        default:
          throw new Error("Unknown authenticationOk message type " + code);
      }
      return message;
    }, parseErrorMessage = (reader, name) => {
      let fields = {}, fieldType = reader.string(1);
      for (; fieldType !== "\0"; )
        fields[fieldType] = reader.cstring(), fieldType = reader.string(1);
      let messageValue = fields.M, message = name === "notice" ? new messages_1.NoticeMessage(LATEINIT_LENGTH, messageValue) : new messages_1.DatabaseError(messageValue, LATEINIT_LENGTH, name);
      return message.severity = fields.S, message.code = fields.C, message.detail = fields.D, message.hint = fields.H, message.position = fields.P, message.internalPosition = fields.p, message.internalQuery = fields.q, message.where = fields.W, message.schema = fields.s, message.table = fields.t, message.column = fields.c, message.dataType = fields.d, message.constraint = fields.n, message.file = fields.F, message.line = fields.L, message.routine = fields.R, message;
    };
  }
});

// node_modules/pg-protocol/dist/index.js
var require_dist = __commonJS({
  "node_modules/pg-protocol/dist/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: !0 });
    exports2.DatabaseError = exports2.serialize = void 0;
    exports2.parse = parse;
    var messages_1 = require_messages();
    Object.defineProperty(exports2, "DatabaseError", { enumerable: !0, get: function() {
      return messages_1.DatabaseError;
    } });
    var serializer_1 = require_serializer();
    Object.defineProperty(exports2, "serialize", { enumerable: !0, get: function() {
      return serializer_1.serialize;
    } });
    var parser_1 = require_parser();
    function parse(stream, callback) {
      let parser = new parser_1.Parser();
      return stream.on("data", (buffer) => parser.parse(buffer, callback)), new Promise((resolve) => stream.on("end", () => resolve()));
    }
  }
});

// node_modules/pg-cloudflare/dist/empty.js
var require_empty = __commonJS({
  "node_modules/pg-cloudflare/dist/empty.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: !0 });
    exports2.default = {};
  }
});

// node_modules/pg/lib/stream.js
var require_stream = __commonJS({
  "node_modules/pg/lib/stream.js"(exports2, module2) {
    var { getStream, getSecureStream } = getStreamFuncs();
    module2.exports = {
      /**
       * Get a socket stream compatible with the current runtime environment.
       * @returns {Duplex}
       */
      getStream,
      /**
       * Get a TLS secured socket, compatible with the current environment,
       * using the socket and other settings given in `options`.
       * @returns {Duplex}
       */
      getSecureStream
    };
    function getNodejsStreamFuncs() {
      function getStream2(ssl) {
        let net = require("net");
        return new net.Socket();
      }
      function getSecureStream2(options) {
        return require("tls").connect(options);
      }
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    function getCloudflareStreamFuncs() {
      function getStream2(ssl) {
        let { CloudflareSocket } = require_empty();
        return new CloudflareSocket(ssl);
      }
      function getSecureStream2(options) {
        return options.socket.startTls(options), options.socket;
      }
      return {
        getStream: getStream2,
        getSecureStream: getSecureStream2
      };
    }
    function isCloudflareRuntime() {
      if (typeof navigator == "object" && navigator !== null && typeof navigator.userAgent == "string")
        return navigator.userAgent === "Cloudflare-Workers";
      if (typeof Response == "function") {
        let resp = new Response(null, { cf: { thing: !0 } });
        if (typeof resp.cf == "object" && resp.cf !== null && resp.cf.thing)
          return !0;
      }
      return !1;
    }
    function getStreamFuncs() {
      return isCloudflareRuntime() ? getCloudflareStreamFuncs() : getNodejsStreamFuncs();
    }
  }
});

// node_modules/pg/lib/connection.js
var require_connection = __commonJS({
  "node_modules/pg/lib/connection.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events").EventEmitter, { parse, serialize } = require_dist(), stream = require_stream(), { getStream } = stream, flushBuffer = serialize.flush(), syncBuffer = serialize.sync(), endBuffer = serialize.end(), Connection = class extends EventEmitter {
      constructor(config) {
        super(), config = config || {}, this.stream = config.stream || getStream(config.ssl), typeof this.stream == "function" && (this.stream = this.stream(config)), this._keepAlive = config.keepAlive, this._keepAliveInitialDelayMillis = config.keepAliveInitialDelayMillis, this.parsedStatements = {}, this.submittedNamedStatements = {}, this.ssl = config.ssl || !1, this.sslNegotiation = config.sslNegotiation || "postgres", this._ending = !1, this._emitMessage = !1;
        let self2 = this;
        this.on("newListener", function(eventName) {
          eventName === "message" && (self2._emitMessage = !0);
        });
      }
      connect(port, host) {
        let self2 = this;
        this._connecting = !0, this.stream.setNoDelay(!0), this.stream.connect(port, host), this.stream.once("connect", function() {
          self2._keepAlive && self2.stream.setKeepAlive(!0, self2._keepAliveInitialDelayMillis), self2.emit("connect");
        });
        let reportStreamError = function(error) {
          self2._ending && (error.code === "ECONNRESET" || error.code === "EPIPE") || self2.emit("error", error);
        };
        if (this.stream.on("error", reportStreamError), this.stream.on("close", function() {
          self2.emit("end");
        }), !this.ssl)
          return this.attachListeners(this.stream);
        if (this.sslNegotiation === "direct")
          return this.stream.once("connect", function() {
            self2.upgradeToSSL(host, reportStreamError);
          });
        this.stream.once("data", function(buffer) {
          switch (buffer.toString("utf8")) {
            case "S":
              break;
            case "N":
              return self2.stream.end(), self2.emit("error", new Error("The server does not support SSL connections"));
            default:
              return self2.stream.end(), self2.emit("error", new Error("There was an error establishing an SSL connection"));
          }
          self2.upgradeToSSL(host, reportStreamError);
        });
      }
      upgradeToSSL(host, reportStreamError) {
        let self2 = this, options = {
          socket: self2.stream,
          // tls.connect checks the server identity against `servername`, falling
          // back to `host` and then to 'localhost'. `servername` must stay unset
          // for IP addresses (see below), so `host` is needed to keep certificate
          // validation working when connecting to an IP address.
          host
        };
        self2.ssl !== !0 && (Object.assign(options, self2.ssl), "key" in self2.ssl && (options.key = self2.ssl.key)), self2.sslNegotiation === "direct" && (options.ALPNProtocols = ["postgresql"]);
        let net = require("net");
        net.isIP && net.isIP(host) === 0 && (options.servername = host);
        try {
          self2.stream = stream.getSecureStream(options);
        } catch (err) {
          return self2.emit("error", err);
        }
        self2.attachListeners(self2.stream), self2.stream.on("error", reportStreamError), self2.emit("sslconnect");
      }
      attachListeners(stream2) {
        parse(stream2, (msg) => {
          let eventName = msg.name === "error" ? "errorMessage" : msg.name;
          this._emitMessage && this.emit("message", msg), this.emit(eventName, msg);
        });
      }
      requestSsl() {
        this.stream.write(serialize.requestSsl());
      }
      startup(config) {
        this.stream.write(serialize.startup(config));
      }
      cancel(processID, secretKey) {
        this._send(serialize.cancel(processID, secretKey));
      }
      password(password) {
        this._send(serialize.password(password));
      }
      sendSASLInitialResponseMessage(mechanism, initialResponse) {
        this._send(serialize.sendSASLInitialResponseMessage(mechanism, initialResponse));
      }
      sendSCRAMClientFinalMessage(additionalData) {
        this._send(serialize.sendSCRAMClientFinalMessage(additionalData));
      }
      _send(buffer) {
        return this.stream.writable ? this.stream.write(buffer) : !1;
      }
      query(text) {
        this._send(serialize.query(text));
      }
      // send parse message
      parse(query) {
        this._send(serialize.parse(query));
      }
      // send bind message
      bind(config) {
        this._send(serialize.bind(config));
      }
      // send execute message
      execute(config) {
        this._send(serialize.execute(config));
      }
      flush() {
        this.stream.writable && this.stream.write(flushBuffer);
      }
      sync() {
        this._send(syncBuffer);
      }
      ref() {
        this.stream.ref();
      }
      unref() {
        this.stream.unref();
      }
      end() {
        if (this._ending = !0, !this._connecting || !this.stream.writable) {
          this.stream.end();
          return;
        }
        return this.stream.write(endBuffer, () => {
          this.stream.end();
        });
      }
      close(msg) {
        this._send(serialize.close(msg));
      }
      describe(msg) {
        this._send(serialize.describe(msg));
      }
      sendCopyFromChunk(chunk) {
        this._send(serialize.copyData(chunk));
      }
      endCopyFrom() {
        this._send(serialize.copyDone());
      }
      sendCopyFail(msg) {
        this._send(serialize.copyFail(msg));
      }
    };
    module2.exports = Connection;
  }
});

// node_modules/split2/index.js
var require_split2 = __commonJS({
  "node_modules/split2/index.js"(exports2, module2) {
    "use strict";
    var { Transform } = require("stream"), { StringDecoder } = require("string_decoder"), kLast = Symbol("last"), kDecoder = Symbol("decoder");
    function transform(chunk, enc, cb) {
      let list;
      if (this.overflow) {
        if (list = this[kDecoder].write(chunk).split(this.matcher), list.length === 1) return cb();
        list.shift(), this.overflow = !1;
      } else
        this[kLast] += this[kDecoder].write(chunk), list = this[kLast].split(this.matcher);
      this[kLast] = list.pop();
      for (let i = 0; i < list.length; i++)
        try {
          push(this, this.mapper(list[i]));
        } catch (error) {
          return cb(error);
        }
      if (this.overflow = this[kLast].length > this.maxLength, this.overflow && !this.skipOverflow) {
        cb(new Error("maximum buffer reached"));
        return;
      }
      cb();
    }
    function flush(cb) {
      if (this[kLast] += this[kDecoder].end(), this[kLast])
        try {
          push(this, this.mapper(this[kLast]));
        } catch (error) {
          return cb(error);
        }
      cb();
    }
    function push(self2, val) {
      val !== void 0 && self2.push(val);
    }
    function noop(incoming) {
      return incoming;
    }
    function split(matcher, mapper, options) {
      switch (matcher = matcher || /\r?\n/, mapper = mapper || noop, options = options || {}, arguments.length) {
        case 1:
          typeof matcher == "function" ? (mapper = matcher, matcher = /\r?\n/) : typeof matcher == "object" && !(matcher instanceof RegExp) && !matcher[Symbol.split] && (options = matcher, matcher = /\r?\n/);
          break;
        case 2:
          typeof matcher == "function" ? (options = mapper, mapper = matcher, matcher = /\r?\n/) : typeof mapper == "object" && (options = mapper, mapper = noop);
      }
      options = Object.assign({}, options), options.autoDestroy = !0, options.transform = transform, options.flush = flush, options.readableObjectMode = !0;
      let stream = new Transform(options);
      return stream[kLast] = "", stream[kDecoder] = new StringDecoder("utf8"), stream.matcher = matcher, stream.mapper = mapper, stream.maxLength = options.maxLength, stream.skipOverflow = options.skipOverflow || !1, stream.overflow = !1, stream._destroy = function(err, cb) {
        this._writableState.errorEmitted = !1, cb(err);
      }, stream;
    }
    module2.exports = split;
  }
});

// node_modules/pgpass/lib/helper.js
var require_helper = __commonJS({
  "node_modules/pgpass/lib/helper.js"(exports2, module2) {
    "use strict";
    var path = require("path"), Stream = require("stream").Stream, split = require_split2(), util = require("util"), defaultPort = 5432, isWin = process.platform === "win32", warnStream = process.stderr, S_IRWXG = 56, S_IRWXO = 7, S_IFMT = 61440, S_IFREG = 32768;
    function isRegFile(mode) {
      return (mode & S_IFMT) == S_IFREG;
    }
    var fieldNames = ["host", "port", "database", "user", "password"], nrOfFields = fieldNames.length, passKey = fieldNames[nrOfFields - 1];
    function warn() {
      var isWritable = warnStream instanceof Stream && warnStream.writable === !0;
      if (isWritable) {
        var args = Array.prototype.slice.call(arguments).concat(`
`);
        warnStream.write(util.format.apply(util, args));
      }
    }
    Object.defineProperty(module2.exports, "isWin", {
      get: function() {
        return isWin;
      },
      set: function(val) {
        isWin = val;
      }
    });
    module2.exports.warnTo = function(stream) {
      var old = warnStream;
      return warnStream = stream, old;
    };
    module2.exports.getFileName = function(rawEnv) {
      var env = rawEnv || process.env, file = env.PGPASSFILE || (isWin ? path.join(env.APPDATA || "./", "postgresql", "pgpass.conf") : path.join(env.HOME || "./", ".pgpass"));
      return file;
    };
    module2.exports.usePgPass = function(stats, fname) {
      return Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD") ? !1 : isWin ? !0 : (fname = fname || "<unkn>", isRegFile(stats.mode) ? stats.mode & (S_IRWXG | S_IRWXO) ? (warn('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', fname), !1) : !0 : (warn('WARNING: password file "%s" is not a plain file', fname), !1));
    };
    var matcher = module2.exports.match = function(connInfo, entry) {
      return fieldNames.slice(0, -1).reduce(function(prev, field, idx) {
        return idx == 1 && Number(connInfo[field] || defaultPort) === Number(entry[field]) ? prev && !0 : prev && (entry[field] === "*" || entry[field] === connInfo[field]);
      }, !0);
    };
    module2.exports.getPassword = function(connInfo, stream, cb) {
      var pass, lineStream = stream.pipe(split());
      function onLine(line) {
        var entry = parseLine(line);
        entry && isValidEntry(entry) && matcher(connInfo, entry) && (pass = entry[passKey], lineStream.end());
      }
      var onEnd = function() {
        stream.destroy(), cb(pass);
      }, onErr = function(err) {
        stream.destroy(), warn("WARNING: error on reading file: %s", err), cb(void 0);
      };
      stream.on("error", onErr), lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
    };
    var parseLine = module2.exports.parseLine = function(line) {
      if (line.length < 11 || line.match(/^\s+#/))
        return null;
      for (var curChar = "", prevChar = "", fieldIdx = 0, startIdx = 0, endIdx = 0, obj = {}, isLastField = !1, addToObj = function(idx, i0, i1) {
        var field = line.substring(i0, i1);
        Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE") || (field = field.replace(/\\([:\\])/g, "$1")), obj[fieldNames[idx]] = field;
      }, i = 0; i < line.length - 1; i += 1) {
        if (curChar = line.charAt(i + 1), prevChar = line.charAt(i), isLastField = fieldIdx == nrOfFields - 1, isLastField) {
          addToObj(fieldIdx, startIdx);
          break;
        }
        i >= 0 && curChar == ":" && prevChar !== "\\" && (addToObj(fieldIdx, startIdx, i + 1), startIdx = i + 2, fieldIdx += 1);
      }
      return obj = Object.keys(obj).length === nrOfFields ? obj : null, obj;
    }, isValidEntry = module2.exports.isValidEntry = function(entry) {
      for (var rules = {
        // host
        0: function(x) {
          return x.length > 0;
        },
        // port
        1: function(x) {
          return x === "*" ? !0 : (x = Number(x), isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x);
        },
        // database
        2: function(x) {
          return x.length > 0;
        },
        // username
        3: function(x) {
          return x.length > 0;
        },
        // password
        4: function(x) {
          return x.length > 0;
        }
      }, idx = 0; idx < fieldNames.length; idx += 1) {
        var rule = rules[idx], value = entry[fieldNames[idx]] || "", res = rule(value);
        if (!res)
          return !1;
      }
      return !0;
    };
  }
});

// node_modules/pgpass/lib/index.js
var require_lib = __commonJS({
  "node_modules/pgpass/lib/index.js"(exports2, module2) {
    "use strict";
    var path = require("path"), fs = require("fs"), helper = require_helper();
    module2.exports = function(connInfo, cb) {
      var file = helper.getFileName();
      fs.stat(file, function(err, stat) {
        if (err || !helper.usePgPass(stat, file))
          return cb(void 0);
        var st = fs.createReadStream(file);
        helper.getPassword(connInfo, st, cb);
      });
    };
    module2.exports.warnTo = helper.warnTo;
  }
});

// node_modules/pg/lib/client.js
var require_client = __commonJS({
  "node_modules/pg/lib/client.js"(exports2, module2) {
    var EventEmitter = require("events").EventEmitter, utils = require_utils(), nodeUtils = require("util"), sasl = require_sasl(), TypeOverrides = require_type_overrides(), ConnectionParameters = require_connection_parameters(), Query = require_query(), defaults = require_defaults(), Connection = require_connection(), crypto2 = require_utils2(), activeQueryDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Client.activeQuery is deprecated and will be removed in pg@9.0"
    ), queryQueueDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Client.queryQueue is deprecated and will be removed in pg@9.0."
    ), pgPassDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "pgpass support is deprecated and will be removed in pg@9.0. You can provide an async function as the password property to the Client/Pool constructor that returns a password instead. Within this function you can call the pgpass module in your own code."
    ), byoPromiseDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Passing a custom Promise implementation to the Client/Pool constructor is deprecated and will be removed in pg@9.0."
    ), queryQueueLengthDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead."
    );
    function coerceNumberOrDefault(value, defaultValue) {
      if (typeof value == "number")
        return Number.isFinite(value) ? value : defaultValue;
      if (typeof value == "string" && value.trim() !== "") {
        let n = Number(value);
        return Number.isFinite(n) ? n : defaultValue;
      }
      return defaultValue;
    }
    var Client2 = class extends EventEmitter {
      constructor(config) {
        super(), this.connectionParameters = new ConnectionParameters(config), this.user = this.connectionParameters.user, this.database = this.connectionParameters.database, this.port = this.connectionParameters.port, this.host = this.connectionParameters.host, Object.defineProperty(this, "password", {
          configurable: !0,
          enumerable: !1,
          writable: !0,
          value: this.connectionParameters.password
        }), this.replication = this.connectionParameters.replication;
        let c = config || {};
        c.Promise && byoPromiseDeprecationNotice(), this._Promise = c.Promise || global.Promise, this._types = new TypeOverrides(c.types), this._ending = !1, this._ended = !1, this._connecting = !1, this._connected = !1, this._connectionError = !1, this._queryable = !0, this._activeQuery = null, this._txStatus = null, this.enableChannelBinding = !!c.enableChannelBinding, this.scramMaxIterations = coerceNumberOrDefault(c.scramMaxIterations, sasl.DEFAULT_MAX_SCRAM_ITERATIONS), this.connection = c.connection || new Connection({
          stream: c.stream,
          ssl: this.connectionParameters.ssl,
          sslNegotiation: this.connectionParameters.sslnegotiation,
          keepAlive: c.keepAlive || !1,
          keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
          encoding: this.connectionParameters.client_encoding || "utf8"
        }), this._queryQueue = [], this._sentQueryQueue = [], this.pipeline = !!c.pipeline, this.binary = c.binary || defaults.binary, this.processID = null, this.secretKey = null, this.ssl = this.connectionParameters.ssl || !1, this.sslNegotiation = this.connectionParameters.sslnegotiation || "postgres", this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", {
          enumerable: !1
        }), this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
      }
      get activeQuery() {
        return activeQueryDeprecationNotice(), this._activeQuery;
      }
      set activeQuery(val) {
        activeQueryDeprecationNotice(), this._activeQuery = val;
      }
      _getActiveQuery() {
        return this._activeQuery;
      }
      _errorAllQueries(err) {
        let enqueueError = (query) => {
          process.nextTick(() => {
            query.handleError(err, this.connection);
          });
        }, activeQuery = this._getActiveQuery();
        activeQuery && (enqueueError(activeQuery), this._activeQuery = null), this._sentQueryQueue.forEach(enqueueError), this._sentQueryQueue.length = 0, this._queryQueue.forEach(enqueueError), this._queryQueue.length = 0;
      }
      _connect(callback) {
        let self2 = this, con = this.connection;
        if (this._connectionCallback = callback, this._connecting || this._connected) {
          let err = new Error("Client has already been connected. You cannot reuse a client.");
          process.nextTick(() => {
            callback(err);
          });
          return;
        }
        this._connecting = !0, this._connectionTimeoutMillis > 0 && (this.connectionTimeoutHandle = setTimeout(() => {
          con._ending = !0, con.stream.destroy(new Error("timeout expired"));
        }, this._connectionTimeoutMillis), this.connectionTimeoutHandle.unref && this.connectionTimeoutHandle.unref()), this.host && this.host.indexOf("/") === 0 ? con.connect(this.host + "/.s.PGSQL." + this.port) : con.connect(this.port, this.host), con.on("connect", function() {
          self2.ssl ? self2.sslNegotiation !== "direct" && con.requestSsl() : con.startup(self2.getStartupConf());
        }), con.on("sslconnect", function() {
          con.startup(self2.getStartupConf());
        }), this._attachListeners(con), con.once("end", () => {
          let error = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
          clearTimeout(this.connectionTimeoutHandle), this._errorAllQueries(error), this._ended = !0, this._ending || (this._connecting && !this._connectionError ? this._connectionCallback ? this._connectionCallback(error) : this._handleErrorEvent(error) : this._connectionError || this._handleErrorEvent(error)), process.nextTick(() => {
            this.emit("end");
          });
        });
      }
      connect(callback) {
        if (callback) {
          this._connect(callback);
          return;
        }
        return new this._Promise((resolve, reject) => {
          this._connect((error) => {
            error ? reject(error) : resolve(this);
          });
        });
      }
      _attachListeners(con) {
        con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this)), con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this)), con.on("authenticationSASL", this._handleAuthSASL.bind(this)), con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this)), con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this)), con.on("backendKeyData", this._handleBackendKeyData.bind(this)), con.on("error", this._handleErrorEvent.bind(this)), con.on("errorMessage", this._handleErrorMessage.bind(this)), con.on("readyForQuery", this._handleReadyForQuery.bind(this)), con.on("notice", this._handleNotice.bind(this)), con.on("rowDescription", this._handleRowDescription.bind(this)), con.on("dataRow", this._handleDataRow.bind(this)), con.on("portalSuspended", this._handlePortalSuspended.bind(this)), con.on("emptyQuery", this._handleEmptyQuery.bind(this)), con.on("commandComplete", this._handleCommandComplete.bind(this)), con.on("parseComplete", this._handleParseComplete.bind(this)), con.on("copyInResponse", this._handleCopyInResponse.bind(this)), con.on("copyData", this._handleCopyData.bind(this)), con.on("notification", this._handleNotification.bind(this));
      }
      _getPassword(cb) {
        let con = this.connection;
        if (typeof this.password == "function")
          this._Promise.resolve().then(() => this.password(this.connectionParameters)).then((pass) => {
            if (pass !== void 0) {
              if (typeof pass != "string") {
                con.emit("error", new TypeError("Password must be a string"));
                return;
              }
              this.connectionParameters.password = this.password = pass;
            } else
              this.connectionParameters.password = this.password = null;
            cb();
          }).catch((err) => {
            con.emit("error", err);
          });
        else if (this.password !== null)
          cb();
        else
          try {
            require_lib()(this.connectionParameters, (pass) => {
              pass !== void 0 && (pgPassDeprecationNotice(), this.connectionParameters.password = this.password = pass), cb();
            });
          } catch (e) {
            this.emit("error", e);
          }
      }
      _handleAuthCleartextPassword(msg) {
        this._getPassword(() => {
          this.connection.password(this.password);
        });
      }
      _handleAuthMD5Password(msg) {
        this._getPassword(async () => {
          try {
            let hashedPassword = await crypto2.postgresMd5PasswordHash(this.user, this.password, msg.salt);
            this.connection.password(hashedPassword);
          } catch (e) {
            this.emit("error", e);
          }
        });
      }
      _handleAuthSASL(msg) {
        this._getPassword(() => {
          try {
            this.saslSession = sasl.startSession(
              msg.mechanisms,
              this.enableChannelBinding && this.connection.stream,
              this.scramMaxIterations
            ), this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
          } catch (err) {
            this.connection.emit("error", err);
          }
        });
      }
      async _handleAuthSASLContinue(msg) {
        try {
          await sasl.continueSession(
            this.saslSession,
            this.password,
            msg.data,
            this.enableChannelBinding && this.connection.stream
          ), this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleAuthSASLFinal(msg) {
        try {
          sasl.finalizeSession(this.saslSession, msg.data), this.saslSession = null;
        } catch (err) {
          this.connection.emit("error", err);
        }
      }
      _handleBackendKeyData(msg) {
        this.processID = msg.processID, this.secretKey = msg.secretKey;
      }
      _handleReadyForQuery(msg) {
        this._connecting && (this._connecting = !1, this._connected = !0, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback && (this._connectionCallback(null, this), this._connectionCallback = null), this.emit("connect"));
        let activeQuery = this._getActiveQuery();
        this._activeQuery = null, this._txStatus = msg?.status ?? null, this.readyForQuery = !0, activeQuery && activeQuery.handleReadyForQuery(this.connection), this._pulseQueryQueue();
      }
      // if we receive an error event or error message
      // during the connection process we handle it here
      _handleErrorWhileConnecting(err) {
        if (!this._connectionError) {
          if (this._connectionError = !0, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback)
            return this._connectionCallback(err);
          this.emit("error", err);
        }
      }
      // if we're connected and we receive an error event from the connection
      // this means the socket is dead - do a hard abort of all queries and emit
      // the socket error on the client as well
      _handleErrorEvent(err) {
        if (this._connecting)
          return this._handleErrorWhileConnecting(err);
        this._queryable = !1, this._errorAllQueries(err), this.emit("error", err);
      }
      // handle error messages from the postgres backend
      _handleErrorMessage(msg) {
        if (this._connecting)
          return this._handleErrorWhileConnecting(msg);
        let activeQuery = this._getActiveQuery();
        if (!activeQuery) {
          this._handleErrorEvent(msg);
          return;
        }
        this._activeQuery = null, activeQuery.name && delete this.connection.submittedNamedStatements[activeQuery.name], activeQuery.handleError(msg, this.connection);
      }
      _handleRowDescription(msg) {
        let activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          let error = new Error("Received unexpected rowDescription message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleRowDescription(msg);
      }
      _handleDataRow(msg) {
        let activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          let error = new Error("Received unexpected dataRow message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleDataRow(msg);
      }
      _handlePortalSuspended(msg) {
        let activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          let error = new Error("Received unexpected portalSuspended message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handlePortalSuspended(this.connection);
      }
      _handleEmptyQuery(msg) {
        let activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          let error = new Error("Received unexpected emptyQuery message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleEmptyQuery(this.connection);
      }
      _handleCommandComplete(msg) {
        let activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          let error = new Error("Received unexpected commandComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCommandComplete(msg, this.connection);
      }
      _handleParseComplete() {
        let activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          let error = new Error("Received unexpected parseComplete message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.name && (this.connection.parsedStatements[activeQuery.name] = activeQuery.text, delete this.connection.submittedNamedStatements[activeQuery.name]);
      }
      _handleCopyInResponse(msg) {
        let activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          let error = new Error("Received unexpected copyInResponse message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCopyInResponse(this.connection);
      }
      _handleCopyData(msg) {
        let activeQuery = this._getActiveQuery();
        if (activeQuery == null) {
          let error = new Error("Received unexpected copyData message from backend.");
          this._handleErrorEvent(error);
          return;
        }
        activeQuery.handleCopyData(msg, this.connection);
      }
      _handleNotification(msg) {
        this.emit("notification", msg);
      }
      _handleNotice(msg) {
        this.emit("notice", msg);
      }
      getStartupConf() {
        let params = this.connectionParameters, data = {
          user: params.user,
          database: params.database
        }, appName = params.application_name || params.fallback_application_name;
        return appName && (data.application_name = appName), params.replication && (data.replication = "" + params.replication), params.statement_timeout && (data.statement_timeout = String(parseInt(params.statement_timeout, 10))), params.lock_timeout && (data.lock_timeout = String(parseInt(params.lock_timeout, 10))), params.idle_in_transaction_session_timeout && (data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10))), params.options && (data.options = params.options), data;
      }
      cancel(client, query) {
        if (client.activeQuery === query) {
          let con = this.connection;
          this.host && this.host.indexOf("/") === 0 ? con.connect(this.host + "/.s.PGSQL." + this.port) : con.connect(this.port, this.host), con.on("connect", function() {
            con.cancel(client.processID, client.secretKey);
          });
        } else client._queryQueue.indexOf(query) !== -1 ? client._queryQueue.splice(client._queryQueue.indexOf(query), 1) : client._sentQueryQueue.indexOf(query) !== -1 && (query.callback = () => {
        });
      }
      setTypeParser(oid, format, parseFn) {
        return this._types.setTypeParser(oid, format, parseFn);
      }
      getTypeParser(oid, format) {
        return this._types.getTypeParser(oid, format);
      }
      // escapeIdentifier and escapeLiteral moved to utility functions & exported
      // on PG
      // re-exported here for backwards compatibility
      escapeIdentifier(str) {
        return utils.escapeIdentifier(str);
      }
      escapeLiteral(str) {
        return utils.escapeLiteral(str);
      }
      _pulseQueryQueue() {
        if (this.pipeline) {
          this._pulsePipelinedQueryQueue();
          return;
        }
        if (this.readyForQuery === !0) {
          this._activeQuery = this._queryQueue.shift();
          let activeQuery = this._getActiveQuery();
          if (activeQuery) {
            this.readyForQuery = !1, this.hasExecuted = !0;
            let queryError = activeQuery.submit(this.connection);
            queryError && process.nextTick(() => {
              activeQuery.handleError(queryError, this.connection), this.readyForQuery = !0, this._pulseQueryQueue();
            });
          } else this.hasExecuted && (this._activeQuery = null, this.emit("drain"));
        }
      }
      _pulsePipelinedQueryQueue() {
        if (!(!this._connected || !this._queryable)) {
          for (; this._queryQueue.length > 0; ) {
            let query = this._queryQueue.shift();
            this.hasExecuted = !0;
            let queryError = query.submit(this.connection);
            if (queryError) {
              process.nextTick(() => {
                query.handleError(queryError, this.connection);
              });
              continue;
            }
            this._sentQueryQueue.push(query);
          }
          this.readyForQuery && !this._activeQuery && this._sentQueryQueue.length > 0 && (this._activeQuery = this._sentQueryQueue.shift(), this.readyForQuery = !1), !this._activeQuery && this._sentQueryQueue.length === 0 && this._queryQueue.length === 0 && this.hasExecuted && this.emit("drain");
        }
      }
      query(config, values, callback) {
        let query, result;
        if (config == null)
          throw new TypeError("Client was passed a null or undefined query");
        if (typeof config.submit == "function")
          result = query = config, query.callback || (typeof values == "function" ? query.callback = values : callback && (query.callback = callback));
        else if (query = new Query(config, values, callback), !query.callback)
          result = new this._Promise((resolve, reject) => {
            query.callback = (err, res) => err ? reject(err) : resolve(res);
          }).catch((err) => {
            throw Error.captureStackTrace(err), err;
          });
        else if (typeof query.callback != "function")
          throw new TypeError("callback is not a function");
        let readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
        if (readTimeout) {
          let queryCallback = query.callback || (() => {
          }), readTimeoutTimer = setTimeout(() => {
            let error = new Error("Query read timeout");
            process.nextTick(() => {
              query.handleError(error, this.connection);
            }), queryCallback(error), query.callback = () => {
            };
            let index = this._queryQueue.indexOf(query);
            if (index > -1)
              this._queryQueue.splice(index, 1);
            else if (this.pipeline) {
              this.connection.stream.destroy();
              return;
            }
            this._pulseQueryQueue();
          }, readTimeout);
          query.callback = (err, res) => {
            clearTimeout(readTimeoutTimer), queryCallback(err, res);
          };
        }
        if (this.binary && !query.binary && (query.binary = !0), query._result && !query._result._types && (query._result._types = this._types), this.pipeline) {
          let portalQuery = typeof config.submit == "function" && !(query instanceof Query) ? "Custom query classes such as pg-cursor and pg-query-stream are" : query.rows ? "The `rows` option is" : null;
          if (portalQuery)
            return process.nextTick(() => {
              query.handleError(new Error(`${portalQuery} not supported in pipeline mode`), this.connection);
            }), result;
        }
        return this._queryable ? this._ending ? (process.nextTick(() => {
          query.handleError(new Error("Client was closed and is not queryable"), this.connection);
        }), result) : (this._queryQueue.length > 0 && !this.pipeline && queryQueueLengthDeprecationNotice(), this._queryQueue.push(query), this._pulseQueryQueue(), result) : (process.nextTick(() => {
          query.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
        }), result);
      }
      ref() {
        this.connection.ref();
      }
      unref() {
        this.connection.unref();
      }
      getTransactionStatus() {
        return this._txStatus;
      }
      end(cb) {
        if (this._ending = !0, !this.connection._connecting || this._ended)
          if (cb) {
            cb();
            return;
          } else
            return this._Promise.resolve();
        if (this._queryable ? this.pipeline && (this._getActiveQuery() || this._sentQueryQueue.length > 0 || this._queryQueue.length > 0) ? this.once("drain", () => this.connection.end()) : this._getActiveQuery() ? this.connection.stream.destroy() : this.connection.end() : this.connection.stream.destroy(), cb)
          this.connection.once("end", cb);
        else
          return new this._Promise((resolve) => {
            this.connection.once("end", resolve);
          });
      }
      get queryQueue() {
        return queryQueueDeprecationNotice(), this._queryQueue;
      }
    };
    Client2.Query = Query;
    module2.exports = Client2;
  }
});

// node_modules/pg-pool/index.js
var require_pg_pool = __commonJS({
  "node_modules/pg-pool/index.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events").EventEmitter, NOOP = function() {
    }, removeWhere = (list, predicate) => {
      let i = list.findIndex(predicate);
      return i === -1 ? void 0 : list.splice(i, 1)[0];
    }, IdleItem = class {
      constructor(client, idleListener, timeoutId) {
        this.client = client, this.idleListener = idleListener, this.timeoutId = timeoutId;
      }
    }, PendingItem = class {
      constructor(callback) {
        this.callback = callback;
      }
    };
    function throwOnDoubleRelease() {
      throw new Error("Release called on client which has already been released to the pool.");
    }
    function promisify(Promise2, callback) {
      if (callback)
        return { callback, result: void 0 };
      let rej, res, cb = function(err, client) {
        err ? rej(err) : res(client);
      }, result = new Promise2(function(resolve, reject) {
        res = resolve, rej = reject;
      }).catch((err) => {
        throw Error.captureStackTrace(err), err;
      });
      return { callback: cb, result };
    }
    function makeIdleListener(pool, client) {
      return function idleListener(err) {
        err.client = client, client.removeListener("error", idleListener), client.on("error", () => {
          pool.log("additional client error after disconnection due to error", err);
        }), pool._remove(client), pool.emit("error", err, client);
      };
    }
    var Pool2 = class extends EventEmitter {
      constructor(options, Client2) {
        super(), this.options = Object.assign({}, options), options != null && "password" in options && Object.defineProperty(this.options, "password", {
          configurable: !0,
          enumerable: !1,
          writable: !0,
          value: options.password
        }), options != null && options.ssl && options.ssl.key && Object.defineProperty(this.options.ssl, "key", {
          enumerable: !1
        }), this.options.max = this.options.max || this.options.poolSize || 10, this.options.min = this.options.min || 0, this.options.maxUses = this.options.maxUses || 1 / 0, this.options.allowExitOnIdle = this.options.allowExitOnIdle || !1, this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0, this.log = this.options.log || function() {
        }, this.Client = this.options.Client || Client2 || require_lib2().Client, this.Promise = this.options.Promise || global.Promise, typeof this.options.idleTimeoutMillis > "u" && (this.options.idleTimeoutMillis = 1e4), this._clients = [], this._idle = [], this._expired = /* @__PURE__ */ new WeakSet(), this._pendingQueue = [], this._endCallback = void 0, this.ending = !1, this.ended = !1;
      }
      _promiseTry(f) {
        let Promise2 = this.Promise;
        return typeof Promise2.try == "function" ? Promise2.try(f) : new Promise2((resolve) => resolve(f()));
      }
      _isFull() {
        return this._clients.length >= this.options.max;
      }
      _isAboveMin() {
        return this._clients.length > this.options.min;
      }
      _pulseQueue() {
        if (this.log("pulse queue"), this.ended) {
          this.log("pulse queue ended");
          return;
        }
        if (this.ending) {
          this.log("pulse queue on ending"), this._idle.length && this._idle.slice().map((item) => {
            this._remove(item.client);
          }), this._clients.length || (this.ended = !0, this._endCallback());
          return;
        }
        if (!this._pendingQueue.length) {
          this.log("no queued requests");
          return;
        }
        if (!this._idle.length && this._isFull())
          return;
        let pendingItem = this._pendingQueue.shift();
        if (this._idle.length) {
          let idleItem = this._idle.pop();
          clearTimeout(idleItem.timeoutId);
          let client = idleItem.client;
          client.ref && client.ref();
          let idleListener = idleItem.idleListener;
          return this._acquireClient(client, pendingItem, idleListener, !1);
        }
        if (!this._isFull())
          return this.newClient(pendingItem);
        throw new Error("unexpected condition");
      }
      _remove(client, callback) {
        let removed = removeWhere(this._idle, (item) => item.client === client);
        removed !== void 0 && clearTimeout(removed.timeoutId), this._clients = this._clients.filter((c) => c !== client);
        let context = this;
        client.end(() => {
          context.emit("remove", client), typeof callback == "function" && callback();
        });
      }
      connect(cb) {
        if (this.ending) {
          let err = new Error("Cannot use a pool after calling end on the pool");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        let response = promisify(this.Promise, cb), result = response.result;
        if (this._isFull() || this._idle.length) {
          if (this._idle.length && process.nextTick(() => this._pulseQueue()), !this.options.connectionTimeoutMillis)
            return this._pendingQueue.push(new PendingItem(response.callback)), result;
          let queueCallback = (err, res, done) => {
            clearTimeout(tid), response.callback(err, res, done);
          }, pendingItem = new PendingItem(queueCallback), tid = setTimeout(() => {
            removeWhere(this._pendingQueue, (i) => i.callback === queueCallback), pendingItem.timedOut = !0, response.callback(new Error("timeout exceeded when trying to connect"));
          }, this.options.connectionTimeoutMillis);
          return tid.unref && tid.unref(), this._pendingQueue.push(pendingItem), result;
        }
        return this.newClient(new PendingItem(response.callback)), result;
      }
      newClient(pendingItem) {
        let client = new this.Client(this.options);
        this._clients.push(client);
        let idleListener = makeIdleListener(this, client);
        this.log("checking client timeout");
        let tid, timeoutHit = !1;
        this.options.connectionTimeoutMillis && (tid = setTimeout(() => {
          client.connection ? (this.log("ending client due to timeout"), timeoutHit = !0, client.connection.stream.destroy()) : client.isConnected() || (this.log("ending client due to timeout"), timeoutHit = !0, client.end());
        }, this.options.connectionTimeoutMillis)), this.log("connecting new client"), client.connect((err) => {
          if (tid && clearTimeout(tid), client.on("error", idleListener), err)
            this.log("client failed to connect", err), this._clients = this._clients.filter((c) => c !== client), timeoutHit && (err = new Error("Connection terminated due to connection timeout", { cause: err })), this._pulseQueue(), pendingItem.timedOut || pendingItem.callback(err, void 0, NOOP);
          else {
            if (this.log("new client connected"), this.options.onConnect) {
              this._promiseTry(() => this.options.onConnect(client)).then(
                () => {
                  this._afterConnect(client, pendingItem, idleListener);
                },
                (hookErr) => {
                  this._clients = this._clients.filter((c) => c !== client), client.end(() => {
                    this._pulseQueue(), pendingItem.timedOut || pendingItem.callback(hookErr, void 0, NOOP);
                  });
                }
              );
              return;
            }
            return this._afterConnect(client, pendingItem, idleListener);
          }
        });
      }
      _afterConnect(client, pendingItem, idleListener) {
        if (this.options.maxLifetimeSeconds !== 0) {
          let maxLifetimeTimeout = setTimeout(() => {
            this.log("ending client due to expired lifetime"), this._expired.add(client), this._idle.findIndex((idleItem) => idleItem.client === client) !== -1 && this._acquireClient(
              client,
              new PendingItem((err, client2, clientRelease) => clientRelease()),
              idleListener,
              !1
            );
          }, this.options.maxLifetimeSeconds * 1e3);
          maxLifetimeTimeout.unref(), client.once("end", () => clearTimeout(maxLifetimeTimeout));
        }
        return this._acquireClient(client, pendingItem, idleListener, !0);
      }
      // acquire a client for a pending work item
      _acquireClient(client, pendingItem, idleListener, isNew) {
        isNew && this.emit("connect", client), this.emit("acquire", client), client.release = this._releaseOnce(client, idleListener), client.removeListener("error", idleListener), pendingItem.timedOut ? isNew && this.options.verify ? this.options.verify(client, client.release) : client.release() : isNew && this.options.verify ? this.options.verify(client, (err) => {
          if (err)
            return client.release(err), pendingItem.callback(err, void 0, NOOP);
          pendingItem.callback(void 0, client, client.release);
        }) : pendingItem.callback(void 0, client, client.release);
      }
      // returns a function that wraps _release and throws if called more than once
      _releaseOnce(client, idleListener) {
        let released = !1;
        return (err) => {
          released && throwOnDoubleRelease(), released = !0, this._release(client, idleListener, err);
        };
      }
      // release a client back to the poll, include an error
      // to remove it from the pool
      _release(client, idleListener, err) {
        if (client.on("error", idleListener), client._poolUseCount = (client._poolUseCount || 0) + 1, this.emit("release", err, client), err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses)
          return client._poolUseCount >= this.options.maxUses && this.log("remove expended client"), this._remove(client, this._pulseQueue.bind(this));
        if (this._expired.has(client))
          return this.log("remove expired client"), this._expired.delete(client), this._remove(client, this._pulseQueue.bind(this));
        let tid;
        this.options.idleTimeoutMillis && this._isAboveMin() && (tid = setTimeout(() => {
          this._isAboveMin() && (this.log("remove idle client"), this._remove(client, this._pulseQueue.bind(this)));
        }, this.options.idleTimeoutMillis), this.options.allowExitOnIdle && tid.unref()), this.options.allowExitOnIdle && client.unref(), this._idle.push(new IdleItem(client, idleListener, tid)), this._pulseQueue();
      }
      query(text, values, cb) {
        if (typeof text == "function") {
          let response2 = promisify(this.Promise, text);
          return setImmediate(function() {
            return response2.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
          }), response2.result;
        }
        typeof values == "function" && (cb = values, values = void 0);
        let response = promisify(this.Promise, cb);
        return cb = response.callback, this.connect((err, client) => {
          if (err)
            return cb(err);
          let clientReleased = !1, onError = (err2) => {
            clientReleased || (clientReleased = !0, client.release(err2), cb(err2));
          };
          client.once("error", onError), this.log("dispatching query");
          try {
            client.query(text, values, (err2, res) => {
              if (this.log("query dispatched"), client.removeListener("error", onError), !clientReleased)
                return clientReleased = !0, client.release(err2), err2 ? cb(err2) : cb(void 0, res);
            });
          } catch (err2) {
            return client.release(err2), cb(err2);
          }
        }), response.result;
      }
      end(cb) {
        if (this.log("ending"), this.ending) {
          let err = new Error("Called end on pool more than once");
          return cb ? cb(err) : this.Promise.reject(err);
        }
        this.ending = !0;
        let promised = promisify(this.Promise, cb);
        return this._endCallback = promised.callback, this._pulseQueue(), promised.result;
      }
      get waitingCount() {
        return this._pendingQueue.length;
      }
      get idleCount() {
        return this._idle.length;
      }
      get expiredCount() {
        return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
      }
      get totalCount() {
        return this._clients.length;
      }
    };
    module2.exports = Pool2;
  }
});

// node_modules/pg/lib/native/query.js
var require_query2 = __commonJS({
  "node_modules/pg/lib/native/query.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events").EventEmitter, util = require("util"), utils = require_utils(), NativeQuery = module2.exports = function(config, values, callback) {
      EventEmitter.call(this), config = utils.normalizeQueryConfig(config, values, callback), this.text = config.text, this.values = config.values, this.name = config.name, this.queryMode = config.queryMode, this.callback = config.callback, this.state = "new", this._arrayMode = config.rowMode === "array", this._emitRowEvents = !1, this.on(
        "newListener",
        function(event) {
          event === "row" && (this._emitRowEvents = !0);
        }.bind(this)
      );
    };
    util.inherits(NativeQuery, EventEmitter);
    var errorFieldMap = {
      sqlState: "code",
      statementPosition: "position",
      messagePrimary: "message",
      messageDetail: "detail",
      messageHint: "hint",
      context: "where",
      schemaName: "schema",
      tableName: "table",
      columnName: "column",
      dataTypeName: "dataType",
      constraintName: "constraint",
      sourceFile: "file",
      sourceLine: "line",
      sourceFunction: "routine"
    };
    NativeQuery.prototype.handleError = function(err) {
      let fields = this.native && this.native.pq.resultErrorFields();
      if (fields)
        for (let key in fields) {
          let normalizedFieldName = errorFieldMap[key] || key;
          err[normalizedFieldName] = fields[key];
        }
      this.callback ? this.callback(err) : this.emit("error", err), this.state = "error";
    };
    NativeQuery.prototype.then = function(onSuccess, onFailure) {
      return this._getPromise().then(onSuccess, onFailure);
    };
    NativeQuery.prototype.catch = function(callback) {
      return this._getPromise().catch(callback);
    };
    NativeQuery.prototype._getPromise = function() {
      return this._promise ? this._promise : (this._promise = new Promise(
        function(resolve, reject) {
          this._once("end", resolve), this._once("error", reject);
        }.bind(this)
      ), this._promise);
    };
    NativeQuery.prototype.submit = function(client) {
      this.state = "running";
      let self2 = this;
      this.native = client.native, client.native.arrayMode = this._arrayMode;
      let after = function(err, rows, results) {
        if (client.native.arrayMode = !1, setImmediate(function() {
          self2.emit("_done");
        }), err)
          return self2.handleError(err);
        self2._emitRowEvents && (results.length > 1 ? rows.forEach((rowOfRows, i) => {
          rowOfRows.forEach((row) => {
            self2.emit("row", row, results[i]);
          });
        }) : rows.forEach(function(row) {
          self2.emit("row", row, results);
        })), self2.state = "end", self2.emit("end", results), self2.callback && self2.callback(null, results);
      };
      if (process.domain && (after = process.domain.bind(after)), this.name) {
        this.name.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error("You supplied %s (%s)", this.name, this.name.length), console.error("This can cause conflicts and silent errors executing queries"));
        let values = (this.values || []).map(utils.prepareValue);
        if (client.namedQueries[this.name] !== void 0) {
          if (this.text && client.namedQueries[this.name] !== this.text) {
            let err = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
            return after(err);
          }
          return client.native.execute(this.name, values, after);
        }
        return client.native.prepare(this.name, this.text, values.length, function(err) {
          return err ? after(err) : (client.namedQueries[self2.name] = self2.text, self2.native.execute(self2.name, values, after));
        });
      } else if (this.values) {
        if (!Array.isArray(this.values)) {
          let err = new Error("Query values must be an array");
          return after(err);
        }
        let vals = this.values.map(utils.prepareValue);
        client.native.query(this.text, vals, after);
      } else this.queryMode === "extended" ? client.native.query(this.text, [], after) : client.native.query(this.text, after);
    };
  }
});

// node_modules/pg/lib/native/client.js
var require_client2 = __commonJS({
  "node_modules/pg/lib/native/client.js"(exports2, module2) {
    var nodeUtils = require("util"), Native;
    try {
      Native = require("pg-native");
    } catch (e) {
      throw e;
    }
    var TypeOverrides = require_type_overrides(), EventEmitter = require("events").EventEmitter, util = require("util"), ConnectionParameters = require_connection_parameters(), NativeQuery = require_query2(), queryQueueLengthDeprecationNotice = nodeUtils.deprecate(
      () => {
      },
      "Calling client.query() when the client is already executing a query is deprecated and will be removed in pg@9.0. Use async/await or an external async flow control mechanism instead."
    ), Client2 = module2.exports = function(config) {
      EventEmitter.call(this), config = config || {}, this._Promise = config.Promise || global.Promise, this._types = new TypeOverrides(config.types), this.native = new Native({
        types: this._types
      }), this._queryQueue = [], this._ending = !1, this._connecting = !1, this._connected = !1, this._queryable = !0, this.pipeline = !!config.pipeline, this._pipelineInFlight = !1;
      let cp = this.connectionParameters = new ConnectionParameters(config);
      config.nativeConnectionString && (cp.nativeConnectionString = config.nativeConnectionString), this.user = cp.user, Object.defineProperty(this, "password", {
        configurable: !0,
        enumerable: !1,
        writable: !0,
        value: cp.password
      }), this.database = cp.database, this.host = cp.host, this.port = cp.port, this.namedQueries = {};
    };
    Client2.Query = NativeQuery;
    util.inherits(Client2, EventEmitter);
    Client2.prototype._errorAllQueries = function(err) {
      let enqueueError = (query) => {
        process.nextTick(() => {
          query.native = this.native, query.handleError(err);
        });
      };
      this._hasActiveQuery() && (enqueueError(this._activeQuery), this._activeQuery = null), this._queryQueue.forEach(enqueueError), this._queryQueue.length = 0;
    };
    Client2.prototype._connect = function(cb) {
      let self2 = this;
      if (this._connecting) {
        process.nextTick(() => cb(new Error("Client has already been connected. You cannot reuse a client.")));
        return;
      }
      this._connecting = !0, this.connectionParameters.getLibpqConnectionString(function(err, conString) {
        if (self2.connectionParameters.nativeConnectionString && (conString = self2.connectionParameters.nativeConnectionString), err) return cb(err);
        self2.native.connect(conString, function(err2) {
          if (err2)
            return self2.native.end(), cb(err2);
          self2._connected = !0, self2.native.on("error", function(err3) {
            self2._queryable = !1, self2._errorAllQueries(err3), self2.emit("error", err3);
          }), self2.native.on("notification", function(msg) {
            self2.emit("notification", {
              channel: msg.relname,
              payload: msg.extra
            });
          }), self2.emit("connect"), self2._pulseQueryQueue(!0), cb(null, this);
        });
      });
    };
    Client2.prototype.connect = function(callback) {
      if (callback) {
        this._connect(callback);
        return;
      }
      return new this._Promise((resolve, reject) => {
        this._connect((error) => {
          error ? reject(error) : resolve(this);
        });
      });
    };
    Client2.prototype.query = function(config, values, callback) {
      let query, result, readTimeout, readTimeoutTimer, queryCallback;
      if (config == null)
        throw new TypeError("Client was passed a null or undefined query");
      if (typeof config.submit == "function")
        readTimeout = config.query_timeout || this.connectionParameters.query_timeout, result = query = config, typeof values == "function" && (config.callback = values);
      else if (readTimeout = config.query_timeout || this.connectionParameters.query_timeout, query = new NativeQuery(config, values, callback), !query.callback) {
        let resolveOut, rejectOut;
        result = new this._Promise((resolve, reject) => {
          resolveOut = resolve, rejectOut = reject;
        }).catch((err) => {
          throw Error.captureStackTrace(err), err;
        }), query.callback = (err, res) => err ? rejectOut(err) : resolveOut(res);
      }
      return readTimeout && (queryCallback = query.callback || (() => {
      }), readTimeoutTimer = setTimeout(() => {
        let error = new Error("Query read timeout");
        process.nextTick(() => {
          query.handleError(error, this.connection);
        }), queryCallback(error), query.callback = () => {
        };
        let index = this._queryQueue.indexOf(query);
        index > -1 && this._queryQueue.splice(index, 1), this._pulseQueryQueue();
      }, readTimeout), query.callback = (err, res) => {
        clearTimeout(readTimeoutTimer), queryCallback(err, res);
      }), this._queryable ? this._ending ? (query.native = this.native, process.nextTick(() => {
        query.handleError(new Error("Client was closed and is not queryable"));
      }), result) : (this._queryQueue.length > 0 && !this.pipeline && queryQueueLengthDeprecationNotice(), this._queryQueue.push(query), this._pulseQueryQueue(), result) : (query.native = this.native, process.nextTick(() => {
        query.handleError(new Error("Client has encountered a connection error and is not queryable"));
      }), result);
    };
    Client2.prototype.end = function(cb) {
      let self2 = this;
      this._ending = !0, this._connecting && !this._connected && this.once("connect", () => {
        this.end(() => {
        });
      });
      let result;
      cb || (result = new this._Promise(function(resolve, reject) {
        cb = (err) => err ? reject(err) : resolve();
      }));
      let doEnd = function() {
        self2.native.end(function() {
          self2._connected = !1, self2._errorAllQueries(new Error("Connection terminated")), process.nextTick(() => {
            self2.emit("end"), cb && cb();
          });
        });
      };
      return this.pipeline && (this._pipelineInFlight || this._queryQueue.length > 0) ? this.once("drain", doEnd) : doEnd(), result;
    };
    Client2.prototype._hasActiveQuery = function() {
      return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
    };
    Client2.prototype._pulseQueryQueue = function(initialConnection) {
      if (!this._connected)
        return;
      if (this.pipeline && !initialConnection)
        return this._pulsePipelinedQueryQueue();
      if (this._hasActiveQuery())
        return;
      let query = this._queryQueue.shift();
      if (!query) {
        initialConnection || this.emit("drain");
        return;
      }
      this._activeQuery = query, query.submit(this);
      let self2 = this;
      query.once("_done", function() {
        self2._pulseQueryQueue();
      });
    };
    Client2.prototype._pulsePipelinedQueryQueue = function() {
      if (!this._connected || this._pipelineInFlight)
        return;
      if (this._queryQueue.length === 0) {
        this.hasExecuted && this.emit("drain");
        return;
      }
      this._pipelineInFlight = !0;
      let self2 = this, queries = [], nativeQueries = [], utils = require_utils();
      for (; this._queryQueue.length > 0; ) {
        let query = this._queryQueue.shift();
        this.hasExecuted = !0, nativeQueries.push(query);
        let values = query.values ? query.values.map(utils.prepareValue) : null, pipelineEntry = { text: query.text, name: query.name, arrayMode: query._arrayMode };
        values && (pipelineEntry.values = values), query.name && this.namedQueries[query.name] && (pipelineEntry._alreadyPrepared = !0), queries.push(pipelineEntry);
      }
      this.native.pipeline(queries, function(err, results) {
        if (self2._pipelineInFlight = !1, err) {
          self2._connected = !1, self2._queryable = !1;
          for (let i = 0; i < nativeQueries.length; i++) {
            let q = nativeQueries[i];
            q.native = self2.native, q.handleError(err);
          }
          self2._errorAllQueries(err), self2.emit("error", err), self2.emit("end");
          return;
        }
        for (let i = 0; i < nativeQueries.length; i++) {
          let q = nativeQueries[i], r = results[i];
          q.native = self2.native, r.err ? q.handleError(r.err) : (q.name && (self2.namedQueries[q.name] = q.text), q.state = "end", q.emit("end", r.result), q.callback && q.callback(null, r.result)), setImmediate(function() {
            q.emit("_done");
          });
        }
        self2._pulsePipelinedQueryQueue();
      });
    };
    Client2.prototype.cancel = function(query) {
      this._activeQuery === query ? this.native.cancel(function() {
      }) : this._queryQueue.indexOf(query) !== -1 && this._queryQueue.splice(this._queryQueue.indexOf(query), 1);
    };
    Client2.prototype.ref = function() {
    };
    Client2.prototype.unref = function() {
    };
    Client2.prototype.setTypeParser = function(oid, format, parseFn) {
      return this._types.setTypeParser(oid, format, parseFn);
    };
    Client2.prototype.getTypeParser = function(oid, format) {
      return this._types.getTypeParser(oid, format);
    };
    Client2.prototype.isConnected = function() {
      return this._connected;
    };
    Client2.prototype.getTransactionStatus = function() {
      return this.native.getTransactionStatus();
    };
  }
});

// node_modules/pg/lib/native/index.js
var require_native = __commonJS({
  "node_modules/pg/lib/native/index.js"(exports2, module2) {
    "use strict";
    module2.exports = require_client2();
  }
});

// node_modules/pg/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/pg/lib/index.js"(exports2, module2) {
    "use strict";
    var Client2 = require_client(), defaults = require_defaults(), Connection = require_connection(), Result = require_result(), utils = require_utils(), Pool2 = require_pg_pool(), TypeOverrides = require_type_overrides(), { DatabaseError } = require_dist(), { escapeIdentifier, escapeLiteral } = require_utils(), poolFactory = (Client3) => class extends Pool2 {
      constructor(options) {
        super(options, Client3);
      }
    }, PG = function(clientConstructor2) {
      this.defaults = defaults, this.Client = clientConstructor2, this.Query = this.Client.Query, this.Pool = poolFactory(this.Client), this._pools = [], this.Connection = Connection, this.types = require_pg_types(), this.DatabaseError = DatabaseError, this.TypeOverrides = TypeOverrides, this.escapeIdentifier = escapeIdentifier, this.escapeLiteral = escapeLiteral, this.Result = Result, this.utils = utils;
    }, clientConstructor = Client2, forceNative = !1;
    try {
      forceNative = !!process.env.NODE_PG_FORCE_NATIVE;
    } catch {
    }
    forceNative && (clientConstructor = require_native());
    module2.exports = new PG(clientConstructor);
    Object.defineProperty(module2.exports, "native", {
      configurable: !0,
      enumerable: !1,
      get() {
        let native = null;
        try {
          native = new PG(require_native());
        } catch (err) {
          if (err.code !== "MODULE_NOT_FOUND")
            throw err;
        }
        return Object.defineProperty(module2.exports, "native", {
          value: native
        }), native;
      }
    });
  }
});

// node_modules/bcryptjs/dist/bcrypt.js
var require_bcrypt = __commonJS({
  "node_modules/bcryptjs/dist/bcrypt.js"(exports2, module2) {
    (function(global2, factory) {
      typeof define == "function" && define.amd ? define([], factory) : typeof require == "function" && typeof module2 == "object" && module2 && module2.exports ? module2.exports = factory() : (global2.dcodeIO = global2.dcodeIO || {}).bcrypt = factory();
    })(exports2, function() {
      "use strict";
      var bcrypt2 = {}, randomFallback = null;
      function random(len) {
        if (typeof module2 < "u" && module2 && module2.exports)
          try {
            return require("crypto").randomBytes(len);
          } catch {
          }
        try {
          var a;
          return (self.crypto || self.msCrypto).getRandomValues(a = new Uint32Array(len)), Array.prototype.slice.call(a);
        } catch {
        }
        if (!randomFallback)
          throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
        return randomFallback(len);
      }
      var randomAvailable = !1;
      try {
        random(1), randomAvailable = !0;
      } catch {
      }
      randomFallback = null, bcrypt2.setRandomFallback = function(random2) {
        randomFallback = random2;
      }, bcrypt2.genSaltSync = function(rounds, seed_length) {
        if (rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS, typeof rounds != "number")
          throw Error("Illegal arguments: " + typeof rounds + ", " + typeof seed_length);
        rounds < 4 ? rounds = 4 : rounds > 31 && (rounds = 31);
        var salt = [];
        return salt.push("$2a$"), rounds < 10 && salt.push("0"), salt.push(rounds.toString()), salt.push("$"), salt.push(base64_encode(random(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN)), salt.join("");
      }, bcrypt2.genSalt = function(rounds, seed_length, callback) {
        if (typeof seed_length == "function" && (callback = seed_length, seed_length = void 0), typeof rounds == "function" && (callback = rounds, rounds = void 0), typeof rounds > "u")
          rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
        else if (typeof rounds != "number")
          throw Error("illegal arguments: " + typeof rounds);
        function _async(callback2) {
          nextTick(function() {
            try {
              callback2(null, bcrypt2.genSaltSync(rounds));
            } catch (err) {
              callback2(err);
            }
          });
        }
        if (callback) {
          if (typeof callback != "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      }, bcrypt2.hashSync = function(s, salt) {
        if (typeof salt > "u" && (salt = GENSALT_DEFAULT_LOG2_ROUNDS), typeof salt == "number" && (salt = bcrypt2.genSaltSync(salt)), typeof s != "string" || typeof salt != "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof salt);
        return _hash(s, salt);
      }, bcrypt2.hash = function(s, salt, callback, progressCallback) {
        function _async(callback2) {
          typeof s == "string" && typeof salt == "number" ? bcrypt2.genSalt(salt, function(err, salt2) {
            _hash(s, salt2, callback2, progressCallback);
          }) : typeof s == "string" && typeof salt == "string" ? _hash(s, salt, callback2, progressCallback) : nextTick(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof salt)));
        }
        if (callback) {
          if (typeof callback != "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      };
      function safeStringCompare(known, unknown) {
        for (var right = 0, wrong = 0, i = 0, k = known.length; i < k; ++i)
          known.charCodeAt(i) === unknown.charCodeAt(i) ? ++right : ++wrong;
        return right < 0 ? !1 : wrong === 0;
      }
      bcrypt2.compareSync = function(s, hash) {
        if (typeof s != "string" || typeof hash != "string")
          throw Error("Illegal arguments: " + typeof s + ", " + typeof hash);
        return hash.length !== 60 ? !1 : safeStringCompare(bcrypt2.hashSync(s, hash.substr(0, hash.length - 31)), hash);
      }, bcrypt2.compare = function(s, hash, callback, progressCallback) {
        function _async(callback2) {
          if (typeof s != "string" || typeof hash != "string") {
            nextTick(callback2.bind(this, Error("Illegal arguments: " + typeof s + ", " + typeof hash)));
            return;
          }
          if (hash.length !== 60) {
            nextTick(callback2.bind(this, null, !1));
            return;
          }
          bcrypt2.hash(s, hash.substr(0, 29), function(err, comp) {
            err ? callback2(err) : callback2(null, safeStringCompare(comp, hash));
          }, progressCallback);
        }
        if (callback) {
          if (typeof callback != "function")
            throw Error("Illegal callback: " + typeof callback);
          _async(callback);
        } else
          return new Promise(function(resolve, reject) {
            _async(function(err, res) {
              if (err) {
                reject(err);
                return;
              }
              resolve(res);
            });
          });
      }, bcrypt2.getRounds = function(hash) {
        if (typeof hash != "string")
          throw Error("Illegal arguments: " + typeof hash);
        return parseInt(hash.split("$")[2], 10);
      }, bcrypt2.getSalt = function(hash) {
        if (typeof hash != "string")
          throw Error("Illegal arguments: " + typeof hash);
        if (hash.length !== 60)
          throw Error("Illegal hash length: " + hash.length + " != 60");
        return hash.substring(0, 29);
      };
      var nextTick = typeof process < "u" && process && typeof process.nextTick == "function" ? typeof setImmediate == "function" ? setImmediate : process.nextTick : setTimeout;
      function stringToBytes(str) {
        var out = [], i = 0;
        return utfx.encodeUTF16toUTF8(function() {
          return i >= str.length ? null : str.charCodeAt(i++);
        }, function(b) {
          out.push(b);
        }), out;
      }
      var BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split(""), BASE64_INDEX = [
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        0,
        1,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        -1,
        -1,
        -1,
        -1,
        -1,
        -1,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        -1,
        -1,
        -1,
        -1,
        -1
      ], stringFromCharCode = String.fromCharCode;
      function base64_encode(b, len) {
        var off = 0, rs = [], c1, c2;
        if (len <= 0 || len > b.length)
          throw Error("Illegal len: " + len);
        for (; off < len; ) {
          if (c1 = b[off++] & 255, rs.push(BASE64_CODE[c1 >> 2 & 63]), c1 = (c1 & 3) << 4, off >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          if (c2 = b[off++] & 255, c1 |= c2 >> 4 & 15, rs.push(BASE64_CODE[c1 & 63]), c1 = (c2 & 15) << 2, off >= len) {
            rs.push(BASE64_CODE[c1 & 63]);
            break;
          }
          c2 = b[off++] & 255, c1 |= c2 >> 6 & 3, rs.push(BASE64_CODE[c1 & 63]), rs.push(BASE64_CODE[c2 & 63]);
        }
        return rs.join("");
      }
      function base64_decode(s, len) {
        var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
        if (len <= 0)
          throw Error("Illegal len: " + len);
        for (; off < slen - 1 && olen < len && (code = s.charCodeAt(off++), c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1, code = s.charCodeAt(off++), c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1, !(c1 == -1 || c2 == -1 || (o = c1 << 2 >>> 0, o |= (c2 & 48) >> 4, rs.push(stringFromCharCode(o)), ++olen >= len || off >= slen) || (code = s.charCodeAt(off++), c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1, c3 == -1) || (o = (c2 & 15) << 4 >>> 0, o |= (c3 & 60) >> 2, rs.push(stringFromCharCode(o)), ++olen >= len || off >= slen))); )
          code = s.charCodeAt(off++), c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1, o = (c3 & 3) << 6 >>> 0, o |= c4, rs.push(stringFromCharCode(o)), ++olen;
        var res = [];
        for (off = 0; off < olen; off++)
          res.push(rs[off].charCodeAt(0));
        return res;
      }
      var utfx = function() {
        "use strict";
        var utfx2 = {};
        return utfx2.MAX_CODEPOINT = 1114111, utfx2.encodeUTF8 = function(src, dst) {
          var cp = null;
          for (typeof src == "number" && (cp = src, src = function() {
            return null;
          }); cp !== null || (cp = src()) !== null; )
            cp < 128 ? dst(cp & 127) : cp < 2048 ? (dst(cp >> 6 & 31 | 192), dst(cp & 63 | 128)) : cp < 65536 ? (dst(cp >> 12 & 15 | 224), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128)) : (dst(cp >> 18 & 7 | 240), dst(cp >> 12 & 63 | 128), dst(cp >> 6 & 63 | 128), dst(cp & 63 | 128)), cp = null;
        }, utfx2.decodeUTF8 = function(src, dst) {
          for (var a, b, c, d, fail = function(b2) {
            b2 = b2.slice(0, b2.indexOf(null));
            var err = Error(b2.toString());
            throw err.name = "TruncatedError", err.bytes = b2, err;
          }; (a = src()) !== null; )
            if (!(a & 128))
              dst(a);
            else if ((a & 224) === 192)
              (b = src()) === null && fail([a, b]), dst((a & 31) << 6 | b & 63);
            else if ((a & 240) === 224)
              ((b = src()) === null || (c = src()) === null) && fail([a, b, c]), dst((a & 15) << 12 | (b & 63) << 6 | c & 63);
            else if ((a & 248) === 240)
              ((b = src()) === null || (c = src()) === null || (d = src()) === null) && fail([a, b, c, d]), dst((a & 7) << 18 | (b & 63) << 12 | (c & 63) << 6 | d & 63);
            else throw RangeError("Illegal starting byte: " + a);
        }, utfx2.UTF16toUTF8 = function(src, dst) {
          for (var c1, c2 = null; (c1 = c2 !== null ? c2 : src()) !== null; ) {
            if (c1 >= 55296 && c1 <= 57343 && (c2 = src()) !== null && c2 >= 56320 && c2 <= 57343) {
              dst((c1 - 55296) * 1024 + c2 - 56320 + 65536), c2 = null;
              continue;
            }
            dst(c1);
          }
          c2 !== null && dst(c2);
        }, utfx2.UTF8toUTF16 = function(src, dst) {
          var cp = null;
          for (typeof src == "number" && (cp = src, src = function() {
            return null;
          }); cp !== null || (cp = src()) !== null; )
            cp <= 65535 ? dst(cp) : (cp -= 65536, dst((cp >> 10) + 55296), dst(cp % 1024 + 56320)), cp = null;
        }, utfx2.encodeUTF16toUTF8 = function(src, dst) {
          utfx2.UTF16toUTF8(src, function(cp) {
            utfx2.encodeUTF8(cp, dst);
          });
        }, utfx2.decodeUTF8toUTF16 = function(src, dst) {
          utfx2.decodeUTF8(src, function(cp) {
            utfx2.UTF8toUTF16(cp, dst);
          });
        }, utfx2.calculateCodePoint = function(cp) {
          return cp < 128 ? 1 : cp < 2048 ? 2 : cp < 65536 ? 3 : 4;
        }, utfx2.calculateUTF8 = function(src) {
          for (var cp, l = 0; (cp = src()) !== null; )
            l += utfx2.calculateCodePoint(cp);
          return l;
        }, utfx2.calculateUTF16asUTF8 = function(src) {
          var n = 0, l = 0;
          return utfx2.UTF16toUTF8(src, function(cp) {
            ++n, l += utfx2.calculateCodePoint(cp);
          }), [n, l];
        }, utfx2;
      }();
      Date.now = Date.now || function() {
        return +/* @__PURE__ */ new Date();
      };
      var BCRYPT_SALT_LEN = 16, GENSALT_DEFAULT_LOG2_ROUNDS = 10, BLOWFISH_NUM_ROUNDS = 16, MAX_EXECUTION_TIME = 100, P_ORIG = [
        608135816,
        2242054355,
        320440878,
        57701188,
        2752067618,
        698298832,
        137296536,
        3964562569,
        1160258022,
        953160567,
        3193202383,
        887688300,
        3232508343,
        3380367581,
        1065670069,
        3041331479,
        2450970073,
        2306472731
      ], S_ORIG = [
        3509652390,
        2564797868,
        805139163,
        3491422135,
        3101798381,
        1780907670,
        3128725573,
        4046225305,
        614570311,
        3012652279,
        134345442,
        2240740374,
        1667834072,
        1901547113,
        2757295779,
        4103290238,
        227898511,
        1921955416,
        1904987480,
        2182433518,
        2069144605,
        3260701109,
        2620446009,
        720527379,
        3318853667,
        677414384,
        3393288472,
        3101374703,
        2390351024,
        1614419982,
        1822297739,
        2954791486,
        3608508353,
        3174124327,
        2024746970,
        1432378464,
        3864339955,
        2857741204,
        1464375394,
        1676153920,
        1439316330,
        715854006,
        3033291828,
        289532110,
        2706671279,
        2087905683,
        3018724369,
        1668267050,
        732546397,
        1947742710,
        3462151702,
        2609353502,
        2950085171,
        1814351708,
        2050118529,
        680887927,
        999245976,
        1800124847,
        3300911131,
        1713906067,
        1641548236,
        4213287313,
        1216130144,
        1575780402,
        4018429277,
        3917837745,
        3693486850,
        3949271944,
        596196993,
        3549867205,
        258830323,
        2213823033,
        772490370,
        2760122372,
        1774776394,
        2652871518,
        566650946,
        4142492826,
        1728879713,
        2882767088,
        1783734482,
        3629395816,
        2517608232,
        2874225571,
        1861159788,
        326777828,
        3124490320,
        2130389656,
        2716951837,
        967770486,
        1724537150,
        2185432712,
        2364442137,
        1164943284,
        2105845187,
        998989502,
        3765401048,
        2244026483,
        1075463327,
        1455516326,
        1322494562,
        910128902,
        469688178,
        1117454909,
        936433444,
        3490320968,
        3675253459,
        1240580251,
        122909385,
        2157517691,
        634681816,
        4142456567,
        3825094682,
        3061402683,
        2540495037,
        79693498,
        3249098678,
        1084186820,
        1583128258,
        426386531,
        1761308591,
        1047286709,
        322548459,
        995290223,
        1845252383,
        2603652396,
        3431023940,
        2942221577,
        3202600964,
        3727903485,
        1712269319,
        422464435,
        3234572375,
        1170764815,
        3523960633,
        3117677531,
        1434042557,
        442511882,
        3600875718,
        1076654713,
        1738483198,
        4213154764,
        2393238008,
        3677496056,
        1014306527,
        4251020053,
        793779912,
        2902807211,
        842905082,
        4246964064,
        1395751752,
        1040244610,
        2656851899,
        3396308128,
        445077038,
        3742853595,
        3577915638,
        679411651,
        2892444358,
        2354009459,
        1767581616,
        3150600392,
        3791627101,
        3102740896,
        284835224,
        4246832056,
        1258075500,
        768725851,
        2589189241,
        3069724005,
        3532540348,
        1274779536,
        3789419226,
        2764799539,
        1660621633,
        3471099624,
        4011903706,
        913787905,
        3497959166,
        737222580,
        2514213453,
        2928710040,
        3937242737,
        1804850592,
        3499020752,
        2949064160,
        2386320175,
        2390070455,
        2415321851,
        4061277028,
        2290661394,
        2416832540,
        1336762016,
        1754252060,
        3520065937,
        3014181293,
        791618072,
        3188594551,
        3933548030,
        2332172193,
        3852520463,
        3043980520,
        413987798,
        3465142937,
        3030929376,
        4245938359,
        2093235073,
        3534596313,
        375366246,
        2157278981,
        2479649556,
        555357303,
        3870105701,
        2008414854,
        3344188149,
        4221384143,
        3956125452,
        2067696032,
        3594591187,
        2921233993,
        2428461,
        544322398,
        577241275,
        1471733935,
        610547355,
        4027169054,
        1432588573,
        1507829418,
        2025931657,
        3646575487,
        545086370,
        48609733,
        2200306550,
        1653985193,
        298326376,
        1316178497,
        3007786442,
        2064951626,
        458293330,
        2589141269,
        3591329599,
        3164325604,
        727753846,
        2179363840,
        146436021,
        1461446943,
        4069977195,
        705550613,
        3059967265,
        3887724982,
        4281599278,
        3313849956,
        1404054877,
        2845806497,
        146425753,
        1854211946,
        1266315497,
        3048417604,
        3681880366,
        3289982499,
        290971e4,
        1235738493,
        2632868024,
        2414719590,
        3970600049,
        1771706367,
        1449415276,
        3266420449,
        422970021,
        1963543593,
        2690192192,
        3826793022,
        1062508698,
        1531092325,
        1804592342,
        2583117782,
        2714934279,
        4024971509,
        1294809318,
        4028980673,
        1289560198,
        2221992742,
        1669523910,
        35572830,
        157838143,
        1052438473,
        1016535060,
        1802137761,
        1753167236,
        1386275462,
        3080475397,
        2857371447,
        1040679964,
        2145300060,
        2390574316,
        1461121720,
        2956646967,
        4031777805,
        4028374788,
        33600511,
        2920084762,
        1018524850,
        629373528,
        3691585981,
        3515945977,
        2091462646,
        2486323059,
        586499841,
        988145025,
        935516892,
        3367335476,
        2599673255,
        2839830854,
        265290510,
        3972581182,
        2759138881,
        3795373465,
        1005194799,
        847297441,
        406762289,
        1314163512,
        1332590856,
        1866599683,
        4127851711,
        750260880,
        613907577,
        1450815602,
        3165620655,
        3734664991,
        3650291728,
        3012275730,
        3704569646,
        1427272223,
        778793252,
        1343938022,
        2676280711,
        2052605720,
        1946737175,
        3164576444,
        3914038668,
        3967478842,
        3682934266,
        1661551462,
        3294938066,
        4011595847,
        840292616,
        3712170807,
        616741398,
        312560963,
        711312465,
        1351876610,
        322626781,
        1910503582,
        271666773,
        2175563734,
        1594956187,
        70604529,
        3617834859,
        1007753275,
        1495573769,
        4069517037,
        2549218298,
        2663038764,
        504708206,
        2263041392,
        3941167025,
        2249088522,
        1514023603,
        1998579484,
        1312622330,
        694541497,
        2582060303,
        2151582166,
        1382467621,
        776784248,
        2618340202,
        3323268794,
        2497899128,
        2784771155,
        503983604,
        4076293799,
        907881277,
        423175695,
        432175456,
        1378068232,
        4145222326,
        3954048622,
        3938656102,
        3820766613,
        2793130115,
        2977904593,
        26017576,
        3274890735,
        3194772133,
        1700274565,
        1756076034,
        4006520079,
        3677328699,
        720338349,
        1533947780,
        354530856,
        688349552,
        3973924725,
        1637815568,
        332179504,
        3949051286,
        53804574,
        2852348879,
        3044236432,
        1282449977,
        3583942155,
        3416972820,
        4006381244,
        1617046695,
        2628476075,
        3002303598,
        1686838959,
        431878346,
        2686675385,
        1700445008,
        1080580658,
        1009431731,
        832498133,
        3223435511,
        2605976345,
        2271191193,
        2516031870,
        1648197032,
        4164389018,
        2548247927,
        300782431,
        375919233,
        238389289,
        3353747414,
        2531188641,
        2019080857,
        1475708069,
        455242339,
        2609103871,
        448939670,
        3451063019,
        1395535956,
        2413381860,
        1841049896,
        1491858159,
        885456874,
        4264095073,
        4001119347,
        1565136089,
        3898914787,
        1108368660,
        540939232,
        1173283510,
        2745871338,
        3681308437,
        4207628240,
        3343053890,
        4016749493,
        1699691293,
        1103962373,
        3625875870,
        2256883143,
        3830138730,
        1031889488,
        3479347698,
        1535977030,
        4236805024,
        3251091107,
        2132092099,
        1774941330,
        1199868427,
        1452454533,
        157007616,
        2904115357,
        342012276,
        595725824,
        1480756522,
        206960106,
        497939518,
        591360097,
        863170706,
        2375253569,
        3596610801,
        1814182875,
        2094937945,
        3421402208,
        1082520231,
        3463918190,
        2785509508,
        435703966,
        3908032597,
        1641649973,
        2842273706,
        3305899714,
        1510255612,
        2148256476,
        2655287854,
        3276092548,
        4258621189,
        236887753,
        3681803219,
        274041037,
        1734335097,
        3815195456,
        3317970021,
        1899903192,
        1026095262,
        4050517792,
        356393447,
        2410691914,
        3873677099,
        3682840055,
        3913112168,
        2491498743,
        4132185628,
        2489919796,
        1091903735,
        1979897079,
        3170134830,
        3567386728,
        3557303409,
        857797738,
        1136121015,
        1342202287,
        507115054,
        2535736646,
        337727348,
        3213592640,
        1301675037,
        2528481711,
        1895095763,
        1721773893,
        3216771564,
        62756741,
        2142006736,
        835421444,
        2531993523,
        1442658625,
        3659876326,
        2882144922,
        676362277,
        1392781812,
        170690266,
        3921047035,
        1759253602,
        3611846912,
        1745797284,
        664899054,
        1329594018,
        3901205900,
        3045908486,
        2062866102,
        2865634940,
        3543621612,
        3464012697,
        1080764994,
        553557557,
        3656615353,
        3996768171,
        991055499,
        499776247,
        1265440854,
        648242737,
        3940784050,
        980351604,
        3713745714,
        1749149687,
        3396870395,
        4211799374,
        3640570775,
        1161844396,
        3125318951,
        1431517754,
        545492359,
        4268468663,
        3499529547,
        1437099964,
        2702547544,
        3433638243,
        2581715763,
        2787789398,
        1060185593,
        1593081372,
        2418618748,
        4260947970,
        69676912,
        2159744348,
        86519011,
        2512459080,
        3838209314,
        1220612927,
        3339683548,
        133810670,
        1090789135,
        1078426020,
        1569222167,
        845107691,
        3583754449,
        4072456591,
        1091646820,
        628848692,
        1613405280,
        3757631651,
        526609435,
        236106946,
        48312990,
        2942717905,
        3402727701,
        1797494240,
        859738849,
        992217954,
        4005476642,
        2243076622,
        3870952857,
        3732016268,
        765654824,
        3490871365,
        2511836413,
        1685915746,
        3888969200,
        1414112111,
        2273134842,
        3281911079,
        4080962846,
        172450625,
        2569994100,
        980381355,
        4109958455,
        2819808352,
        2716589560,
        2568741196,
        3681446669,
        3329971472,
        1835478071,
        660984891,
        3704678404,
        4045999559,
        3422617507,
        3040415634,
        1762651403,
        1719377915,
        3470491036,
        2693910283,
        3642056355,
        3138596744,
        1364962596,
        2073328063,
        1983633131,
        926494387,
        3423689081,
        2150032023,
        4096667949,
        1749200295,
        3328846651,
        309677260,
        2016342300,
        1779581495,
        3079819751,
        111262694,
        1274766160,
        443224088,
        298511866,
        1025883608,
        3806446537,
        1145181785,
        168956806,
        3641502830,
        3584813610,
        1689216846,
        3666258015,
        3200248200,
        1692713982,
        2646376535,
        4042768518,
        1618508792,
        1610833997,
        3523052358,
        4130873264,
        2001055236,
        3610705100,
        2202168115,
        4028541809,
        2961195399,
        1006657119,
        2006996926,
        3186142756,
        1430667929,
        3210227297,
        1314452623,
        4074634658,
        4101304120,
        2273951170,
        1399257539,
        3367210612,
        3027628629,
        1190975929,
        2062231137,
        2333990788,
        2221543033,
        2438960610,
        1181637006,
        548689776,
        2362791313,
        3372408396,
        3104550113,
        3145860560,
        296247880,
        1970579870,
        3078560182,
        3769228297,
        1714227617,
        3291629107,
        3898220290,
        166772364,
        1251581989,
        493813264,
        448347421,
        195405023,
        2709975567,
        677966185,
        3703036547,
        1463355134,
        2715995803,
        1338867538,
        1343315457,
        2802222074,
        2684532164,
        233230375,
        2599980071,
        2000651841,
        3277868038,
        1638401717,
        4028070440,
        3237316320,
        6314154,
        819756386,
        300326615,
        590932579,
        1405279636,
        3267499572,
        3150704214,
        2428286686,
        3959192993,
        3461946742,
        1862657033,
        1266418056,
        963775037,
        2089974820,
        2263052895,
        1917689273,
        448879540,
        3550394620,
        3981727096,
        150775221,
        3627908307,
        1303187396,
        508620638,
        2975983352,
        2726630617,
        1817252668,
        1876281319,
        1457606340,
        908771278,
        3720792119,
        3617206836,
        2455994898,
        1729034894,
        1080033504,
        976866871,
        3556439503,
        2881648439,
        1522871579,
        1555064734,
        1336096578,
        3548522304,
        2579274686,
        3574697629,
        3205460757,
        3593280638,
        3338716283,
        3079412587,
        564236357,
        2993598910,
        1781952180,
        1464380207,
        3163844217,
        3332601554,
        1699332808,
        1393555694,
        1183702653,
        3581086237,
        1288719814,
        691649499,
        2847557200,
        2895455976,
        3193889540,
        2717570544,
        1781354906,
        1676643554,
        2592534050,
        3230253752,
        1126444790,
        2770207658,
        2633158820,
        2210423226,
        2615765581,
        2414155088,
        3127139286,
        673620729,
        2805611233,
        1269405062,
        4015350505,
        3341807571,
        4149409754,
        1057255273,
        2012875353,
        2162469141,
        2276492801,
        2601117357,
        993977747,
        3918593370,
        2654263191,
        753973209,
        36408145,
        2530585658,
        25011837,
        3520020182,
        2088578344,
        530523599,
        2918365339,
        1524020338,
        1518925132,
        3760827505,
        3759777254,
        1202760957,
        3985898139,
        3906192525,
        674977740,
        4174734889,
        2031300136,
        2019492241,
        3983892565,
        4153806404,
        3822280332,
        352677332,
        2297720250,
        60907813,
        90501309,
        3286998549,
        1016092578,
        2535922412,
        2839152426,
        457141659,
        509813237,
        4120667899,
        652014361,
        1966332200,
        2975202805,
        55981186,
        2327461051,
        676427537,
        3255491064,
        2882294119,
        3433927263,
        1307055953,
        942726286,
        933058658,
        2468411793,
        3933900994,
        4215176142,
        1361170020,
        2001714738,
        2830558078,
        3274259782,
        1222529897,
        1679025792,
        2729314320,
        3714953764,
        1770335741,
        151462246,
        3013232138,
        1682292957,
        1483529935,
        471910574,
        1539241949,
        458788160,
        3436315007,
        1807016891,
        3718408830,
        978976581,
        1043663428,
        3165965781,
        1927990952,
        4200891579,
        2372276910,
        3208408903,
        3533431907,
        1412390302,
        2931980059,
        4132332400,
        1947078029,
        3881505623,
        4168226417,
        2941484381,
        1077988104,
        1320477388,
        886195818,
        18198404,
        3786409e3,
        2509781533,
        112762804,
        3463356488,
        1866414978,
        891333506,
        18488651,
        661792760,
        1628790961,
        3885187036,
        3141171499,
        876946877,
        2693282273,
        1372485963,
        791857591,
        2686433993,
        3759982718,
        3167212022,
        3472953795,
        2716379847,
        445679433,
        3561995674,
        3504004811,
        3574258232,
        54117162,
        3331405415,
        2381918588,
        3769707343,
        4154350007,
        1140177722,
        4074052095,
        668550556,
        3214352940,
        367459370,
        261225585,
        2610173221,
        4209349473,
        3468074219,
        3265815641,
        314222801,
        3066103646,
        3808782860,
        282218597,
        3406013506,
        3773591054,
        379116347,
        1285071038,
        846784868,
        2669647154,
        3771962079,
        3550491691,
        2305946142,
        453669953,
        1268987020,
        3317592352,
        3279303384,
        3744833421,
        2610507566,
        3859509063,
        266596637,
        3847019092,
        517658769,
        3462560207,
        3443424879,
        370717030,
        4247526661,
        2224018117,
        4143653529,
        4112773975,
        2788324899,
        2477274417,
        1456262402,
        2901442914,
        1517677493,
        1846949527,
        2295493580,
        3734397586,
        2176403920,
        1280348187,
        1908823572,
        3871786941,
        846861322,
        1172426758,
        3287448474,
        3383383037,
        1655181056,
        3139813346,
        901632758,
        1897031941,
        2986607138,
        3066810236,
        3447102507,
        1393639104,
        373351379,
        950779232,
        625454576,
        3124240540,
        4148612726,
        2007998917,
        544563296,
        2244738638,
        2330496472,
        2058025392,
        1291430526,
        424198748,
        50039436,
        29584100,
        3605783033,
        2429876329,
        2791104160,
        1057563949,
        3255363231,
        3075367218,
        3463963227,
        1469046755,
        985887462
      ], C_ORIG = [
        1332899944,
        1700884034,
        1701343084,
        1684370003,
        1668446532,
        1869963892
      ];
      function _encipher(lr, off, P, S) {
        var n, l = lr[off], r = lr[off + 1];
        return l ^= P[0], n = S[l >>> 24], n += S[256 | l >> 16 & 255], n ^= S[512 | l >> 8 & 255], n += S[768 | l & 255], r ^= n ^ P[1], n = S[r >>> 24], n += S[256 | r >> 16 & 255], n ^= S[512 | r >> 8 & 255], n += S[768 | r & 255], l ^= n ^ P[2], n = S[l >>> 24], n += S[256 | l >> 16 & 255], n ^= S[512 | l >> 8 & 255], n += S[768 | l & 255], r ^= n ^ P[3], n = S[r >>> 24], n += S[256 | r >> 16 & 255], n ^= S[512 | r >> 8 & 255], n += S[768 | r & 255], l ^= n ^ P[4], n = S[l >>> 24], n += S[256 | l >> 16 & 255], n ^= S[512 | l >> 8 & 255], n += S[768 | l & 255], r ^= n ^ P[5], n = S[r >>> 24], n += S[256 | r >> 16 & 255], n ^= S[512 | r >> 8 & 255], n += S[768 | r & 255], l ^= n ^ P[6], n = S[l >>> 24], n += S[256 | l >> 16 & 255], n ^= S[512 | l >> 8 & 255], n += S[768 | l & 255], r ^= n ^ P[7], n = S[r >>> 24], n += S[256 | r >> 16 & 255], n ^= S[512 | r >> 8 & 255], n += S[768 | r & 255], l ^= n ^ P[8], n = S[l >>> 24], n += S[256 | l >> 16 & 255], n ^= S[512 | l >> 8 & 255], n += S[768 | l & 255], r ^= n ^ P[9], n = S[r >>> 24], n += S[256 | r >> 16 & 255], n ^= S[512 | r >> 8 & 255], n += S[768 | r & 255], l ^= n ^ P[10], n = S[l >>> 24], n += S[256 | l >> 16 & 255], n ^= S[512 | l >> 8 & 255], n += S[768 | l & 255], r ^= n ^ P[11], n = S[r >>> 24], n += S[256 | r >> 16 & 255], n ^= S[512 | r >> 8 & 255], n += S[768 | r & 255], l ^= n ^ P[12], n = S[l >>> 24], n += S[256 | l >> 16 & 255], n ^= S[512 | l >> 8 & 255], n += S[768 | l & 255], r ^= n ^ P[13], n = S[r >>> 24], n += S[256 | r >> 16 & 255], n ^= S[512 | r >> 8 & 255], n += S[768 | r & 255], l ^= n ^ P[14], n = S[l >>> 24], n += S[256 | l >> 16 & 255], n ^= S[512 | l >> 8 & 255], n += S[768 | l & 255], r ^= n ^ P[15], n = S[r >>> 24], n += S[256 | r >> 16 & 255], n ^= S[512 | r >> 8 & 255], n += S[768 | r & 255], l ^= n ^ P[16], lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1], lr[off + 1] = l, lr;
      }
      function _streamtoword(data, offp) {
        for (var i = 0, word = 0; i < 4; ++i)
          word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
        return { key: word, offp };
      }
      function _key(key, P, S) {
        for (var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw, i = 0; i < plen; i++)
          sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
        for (i = 0; i < plen; i += 2)
          lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      function _ekskey(data, key, P, S) {
        for (var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw, i = 0; i < plen; i++)
          sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
        for (offp = 0, i = 0; i < plen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
        for (i = 0; i < slen; i += 2)
          sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
      }
      function _crypt(b, salt, rounds, callback, progressCallback) {
        var cdata = C_ORIG.slice(), clen = cdata.length, err;
        if (rounds < 4 || rounds > 31)
          if (err = Error("Illegal number of rounds (4-31): " + rounds), callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        if (salt.length !== BCRYPT_SALT_LEN)
          if (err = Error("Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN), callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        rounds = 1 << rounds >>> 0;
        var P, S, i = 0, j;
        Int32Array ? (P = new Int32Array(P_ORIG), S = new Int32Array(S_ORIG)) : (P = P_ORIG.slice(), S = S_ORIG.slice()), _ekskey(salt, b, P, S);
        function next() {
          if (progressCallback && progressCallback(i / rounds), i < rounds)
            for (var start = Date.now(); i < rounds && (i = i + 1, _key(b, P, S), _key(salt, P, S), !(Date.now() - start > MAX_EXECUTION_TIME)); )
              ;
          else {
            for (i = 0; i < 64; i++)
              for (j = 0; j < clen >> 1; j++)
                _encipher(cdata, j << 1, P, S);
            var ret = [];
            for (i = 0; i < clen; i++)
              ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
            if (callback) {
              callback(null, ret);
              return;
            } else
              return ret;
          }
          callback && nextTick(next);
        }
        if (typeof callback < "u")
          next();
        else
          for (var res; ; )
            if (typeof (res = next()) < "u")
              return res || [];
      }
      function _hash(s, salt, callback, progressCallback) {
        var err;
        if (typeof s != "string" || typeof salt != "string")
          if (err = Error("Invalid string / salt: Not a string"), callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        var minor, offset;
        if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2")
          if (err = Error("Invalid salt version: " + salt.substring(0, 2)), callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        if (salt.charAt(2) === "$")
          minor = "\0", offset = 3;
        else {
          if (minor = salt.charAt(2), minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$")
            if (err = Error("Invalid salt revision: " + salt.substring(2, 4)), callback) {
              nextTick(callback.bind(this, err));
              return;
            } else
              throw err;
          offset = 4;
        }
        if (salt.charAt(offset + 2) > "$")
          if (err = Error("Missing salt rounds"), callback) {
            nextTick(callback.bind(this, err));
            return;
          } else
            throw err;
        var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
        s += minor >= "a" ? "\0" : "";
        var passwordb = stringToBytes(s), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
        function finish(bytes) {
          var res = [];
          return res.push("$2"), minor >= "a" && res.push(minor), res.push("$"), rounds < 10 && res.push("0"), res.push(rounds.toString()), res.push("$"), res.push(base64_encode(saltb, saltb.length)), res.push(base64_encode(bytes, C_ORIG.length * 4 - 1)), res.join("");
        }
        if (typeof callback > "u")
          return finish(_crypt(passwordb, saltb, rounds));
        _crypt(passwordb, saltb, rounds, function(err2, bytes) {
          err2 ? callback(err2, null) : callback(null, finish(bytes));
        }, progressCallback);
      }
      return bcrypt2.encodeBase64 = base64_encode, bcrypt2.decodeBase64 = base64_decode, bcrypt2;
    });
  }
});

// node_modules/bcryptjs/index.js
var require_bcryptjs = __commonJS({
  "node_modules/bcryptjs/index.js"(exports2, module2) {
    module2.exports = require_bcrypt();
  }
});

// node_modules/nodemailer/lib/fetch/cookies.js
var require_cookies = __commonJS({
  "node_modules/nodemailer/lib/fetch/cookies.js"(exports2, module2) {
    "use strict";
    var urllib = require("url"), SESSION_TIMEOUT = 1800, Cookies = class {
      constructor(options) {
        this.options = options || {}, this.cookies = [];
      }
      /**
       * Stores a cookie string to the cookie storage
       *
       * @param {String} cookieStr Value from the 'Set-Cookie:' header
       * @param {String} url Current URL
       */
      set(cookieStr, url) {
        let urlparts = urllib.parse(url || ""), cookie = this.parse(cookieStr), domain;
        return cookie.domain ? (domain = cookie.domain.replace(/^\./, ""), // can't be valid if the requested domain is shorter than current hostname
        (urlparts.hostname.length < domain.length || // prefix domains with dot to be sure that partial matches are not used
        ("." + urlparts.hostname).substr(-domain.length + 1) !== "." + domain) && (cookie.domain = urlparts.hostname)) : cookie.domain = urlparts.hostname, cookie.path || (cookie.path = this.getPath(urlparts.pathname)), cookie.expires || (cookie.expires = new Date(Date.now() + (Number(this.options.sessionTimeout || SESSION_TIMEOUT) || SESSION_TIMEOUT) * 1e3)), this.add(cookie);
      }
      /**
       * Returns cookie string for the 'Cookie:' header.
       *
       * @param {String} url URL to check for
       * @returns {String} Cookie header or empty string if no matches were found
       */
      get(url) {
        return this.list(url).map((cookie) => cookie.name + "=" + cookie.value).join("; ");
      }
      /**
       * Lists all valied cookie objects for the specified URL
       *
       * @param {String} url URL to check for
       * @returns {Array} An array of cookie objects
       */
      list(url) {
        let result = [], i, cookie;
        for (i = this.cookies.length - 1; i >= 0; i--) {
          if (cookie = this.cookies[i], this.isExpired(cookie)) {
            this.cookies.splice(i, i);
            continue;
          }
          this.match(cookie, url) && result.unshift(cookie);
        }
        return result;
      }
      /**
       * Parses cookie string from the 'Set-Cookie:' header
       *
       * @param {String} cookieStr String from the 'Set-Cookie:' header
       * @returns {Object} Cookie object
       */
      parse(cookieStr) {
        let cookie = {};
        return (cookieStr || "").toString().split(";").forEach((cookiePart) => {
          let valueParts = cookiePart.split("="), key = valueParts.shift().trim().toLowerCase(), value = valueParts.join("=").trim(), domain;
          if (key)
            switch (key) {
              case "expires":
                value = new Date(value), value.toString() !== "Invalid Date" && (cookie.expires = value);
                break;
              case "path":
                cookie.path = value;
                break;
              case "domain":
                domain = value.toLowerCase(), domain.length && domain.charAt(0) !== "." && (domain = "." + domain), cookie.domain = domain;
                break;
              case "max-age":
                cookie.expires = new Date(Date.now() + (Number(value) || 0) * 1e3);
                break;
              case "secure":
                cookie.secure = !0;
                break;
              case "httponly":
                cookie.httponly = !0;
                break;
              default:
                cookie.name || (cookie.name = key, cookie.value = value);
            }
        }), cookie;
      }
      /**
       * Checks if a cookie object is valid for a specified URL
       *
       * @param {Object} cookie Cookie object
       * @param {String} url URL to check for
       * @returns {Boolean} true if cookie is valid for specifiec URL
       */
      match(cookie, url) {
        let urlparts = urllib.parse(url || "");
        return !(urlparts.hostname !== cookie.domain && (cookie.domain.charAt(0) !== "." || ("." + urlparts.hostname).substr(-cookie.domain.length) !== cookie.domain) || this.getPath(urlparts.pathname).substr(0, cookie.path.length) !== cookie.path || cookie.secure && urlparts.protocol !== "https:");
      }
      /**
       * Adds (or updates/removes if needed) a cookie object to the cookie storage
       *
       * @param {Object} cookie Cookie value to be stored
       */
      add(cookie) {
        let i, len;
        if (!cookie || !cookie.name)
          return !1;
        for (i = 0, len = this.cookies.length; i < len; i++)
          if (this.compare(this.cookies[i], cookie))
            return this.isExpired(cookie) ? (this.cookies.splice(i, 1), !1) : (this.cookies[i] = cookie, !0);
        return this.isExpired(cookie) || this.cookies.push(cookie), !0;
      }
      /**
       * Checks if two cookie objects are the same
       *
       * @param {Object} a Cookie to check against
       * @param {Object} b Cookie to check against
       * @returns {Boolean} True, if the cookies are the same
       */
      compare(a, b) {
        return a.name === b.name && a.path === b.path && a.domain === b.domain && a.secure === b.secure && a.httponly === a.httponly;
      }
      /**
       * Checks if a cookie is expired
       *
       * @param {Object} cookie Cookie object to check against
       * @returns {Boolean} True, if the cookie is expired
       */
      isExpired(cookie) {
        return cookie.expires && cookie.expires < /* @__PURE__ */ new Date() || !cookie.value;
      }
      /**
       * Returns normalized cookie path for an URL path argument
       *
       * @param {String} pathname
       * @returns {String} Normalized path
       */
      getPath(pathname) {
        let path = (pathname || "/").split("/");
        return path.pop(), path = path.join("/").trim(), path.charAt(0) !== "/" && (path = "/" + path), path.substr(-1) !== "/" && (path += "/"), path;
      }
    };
    module2.exports = Cookies;
  }
});

// node_modules/nodemailer/package.json
var require_package = __commonJS({
  "node_modules/nodemailer/package.json"(exports2, module2) {
    module2.exports = {
      name: "nodemailer",
      version: "6.10.1",
      description: "Easy as cake e-mail sending from your Node.js applications",
      main: "lib/nodemailer.js",
      scripts: {
        test: "node --test --test-concurrency=1 test/**/*.test.js test/**/*-test.js",
        "test:coverage": "c8 node --test --test-concurrency=1 test/**/*.test.js test/**/*-test.js",
        lint: "eslint .",
        update: "rm -rf node_modules/ package-lock.json && ncu -u && npm install"
      },
      repository: {
        type: "git",
        url: "https://github.com/nodemailer/nodemailer.git"
      },
      keywords: [
        "Nodemailer"
      ],
      author: "Andris Reinman",
      license: "MIT-0",
      bugs: {
        url: "https://github.com/nodemailer/nodemailer/issues"
      },
      homepage: "https://nodemailer.com/",
      devDependencies: {
        "@aws-sdk/client-ses": "3.731.1",
        bunyan: "1.8.15",
        c8: "10.1.3",
        eslint: "8.57.0",
        "eslint-config-nodemailer": "1.2.0",
        "eslint-config-prettier": "9.1.0",
        libbase64: "1.3.0",
        libmime: "5.3.6",
        libqp: "2.1.1",
        "nodemailer-ntlm-auth": "1.0.4",
        proxy: "1.0.2",
        "proxy-test-server": "1.0.0",
        "smtp-server": "3.13.6"
      },
      engines: {
        node: ">=6.0.0"
      }
    };
  }
});

// node_modules/nodemailer/lib/fetch/index.js
var require_fetch = __commonJS({
  "node_modules/nodemailer/lib/fetch/index.js"(exports2, module2) {
    "use strict";
    var http2 = require("http"), https = require("https"), urllib = require("url"), zlib = require("zlib"), PassThrough = require("stream").PassThrough, Cookies = require_cookies(), packageData = require_package(), net = require("net"), MAX_REDIRECTS = 5;
    module2.exports = function(url, options) {
      return nmfetch(url, options);
    };
    module2.exports.Cookies = Cookies;
    function nmfetch(url, options) {
      options = options || {}, options.fetchRes = options.fetchRes || new PassThrough(), options.cookies = options.cookies || new Cookies(), options.redirects = options.redirects || 0, options.maxRedirects = isNaN(options.maxRedirects) ? MAX_REDIRECTS : options.maxRedirects, options.cookie && ([].concat(options.cookie || []).forEach((cookie) => {
        options.cookies.set(cookie, url);
      }), options.cookie = !1);
      let fetchRes = options.fetchRes, parsed = urllib.parse(url), method = (options.method || "").toString().trim().toUpperCase() || "GET", finished = !1, cookies, body, handler = parsed.protocol === "https:" ? https : http2, headers = {
        "accept-encoding": "gzip,deflate",
        "user-agent": "nodemailer/" + packageData.version
      };
      if (Object.keys(options.headers || {}).forEach((key) => {
        headers[key.toLowerCase().trim()] = options.headers[key];
      }), options.userAgent && (headers["user-agent"] = options.userAgent), parsed.auth && (headers.Authorization = "Basic " + Buffer.from(parsed.auth).toString("base64")), (cookies = options.cookies.get(url)) && (headers.cookie = cookies), options.body) {
        if (options.contentType !== !1 && (headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded"), typeof options.body.pipe == "function")
          headers["Transfer-Encoding"] = "chunked", body = options.body, body.on("error", (err) => {
            finished || (finished = !0, err.type = "FETCH", err.sourceUrl = url, fetchRes.emit("error", err));
          });
        else {
          if (options.body instanceof Buffer)
            body = options.body;
          else if (typeof options.body == "object")
            try {
              body = Buffer.from(
                Object.keys(options.body).map((key) => {
                  let value = options.body[key].toString().trim();
                  return encodeURIComponent(key) + "=" + encodeURIComponent(value);
                }).join("&")
              );
            } catch (E) {
              if (finished)
                return;
              finished = !0, E.type = "FETCH", E.sourceUrl = url, fetchRes.emit("error", E);
              return;
            }
          else
            body = Buffer.from(options.body.toString().trim());
          headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded", headers["Content-Length"] = body.length;
        }
        method = (options.method || "").toString().trim().toUpperCase() || "POST";
      }
      let req, reqOptions = {
        method,
        host: parsed.hostname,
        path: parsed.path,
        port: parsed.port ? parsed.port : parsed.protocol === "https:" ? 443 : 80,
        headers,
        rejectUnauthorized: !1,
        agent: !1
      };
      options.tls && Object.keys(options.tls).forEach((key) => {
        reqOptions[key] = options.tls[key];
      }), parsed.protocol === "https:" && parsed.hostname && parsed.hostname !== reqOptions.host && !net.isIP(parsed.hostname) && !reqOptions.servername && (reqOptions.servername = parsed.hostname);
      try {
        req = handler.request(reqOptions);
      } catch (E) {
        return finished = !0, setImmediate(() => {
          E.type = "FETCH", E.sourceUrl = url, fetchRes.emit("error", E);
        }), fetchRes;
      }
      return options.timeout && req.setTimeout(options.timeout, () => {
        if (finished)
          return;
        finished = !0, req.abort();
        let err = new Error("Request Timeout");
        err.type = "FETCH", err.sourceUrl = url, fetchRes.emit("error", err);
      }), req.on("error", (err) => {
        finished || (finished = !0, err.type = "FETCH", err.sourceUrl = url, fetchRes.emit("error", err));
      }), req.on("response", (res) => {
        let inflate;
        if (!finished) {
          switch (res.headers["content-encoding"]) {
            case "gzip":
            case "deflate":
              inflate = zlib.createUnzip();
              break;
          }
          if (res.headers["set-cookie"] && [].concat(res.headers["set-cookie"] || []).forEach((cookie) => {
            options.cookies.set(cookie, url);
          }), [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
            if (options.redirects++, options.redirects > options.maxRedirects) {
              finished = !0;
              let err = new Error("Maximum redirect count exceeded");
              err.type = "FETCH", err.sourceUrl = url, fetchRes.emit("error", err), req.abort();
              return;
            }
            return options.method = "GET", options.body = !1, nmfetch(urllib.resolve(url, res.headers.location), options);
          }
          if (fetchRes.statusCode = res.statusCode, fetchRes.headers = res.headers, res.statusCode >= 300 && !options.allowErrorResponse) {
            finished = !0;
            let err = new Error("Invalid status code " + res.statusCode);
            err.type = "FETCH", err.sourceUrl = url, fetchRes.emit("error", err), req.abort();
            return;
          }
          res.on("error", (err) => {
            finished || (finished = !0, err.type = "FETCH", err.sourceUrl = url, fetchRes.emit("error", err), req.abort());
          }), inflate ? (res.pipe(inflate).pipe(fetchRes), inflate.on("error", (err) => {
            finished || (finished = !0, err.type = "FETCH", err.sourceUrl = url, fetchRes.emit("error", err), req.abort());
          })) : res.pipe(fetchRes);
        }
      }), setImmediate(() => {
        if (body)
          try {
            if (typeof body.pipe == "function")
              return body.pipe(req);
            req.write(body);
          } catch (err) {
            finished = !0, err.type = "FETCH", err.sourceUrl = url, fetchRes.emit("error", err);
            return;
          }
        req.end();
      }), fetchRes;
    }
  }
});

// node_modules/nodemailer/lib/shared/index.js
var require_shared = __commonJS({
  "node_modules/nodemailer/lib/shared/index.js"(exports2, module2) {
    "use strict";
    var urllib = require("url"), util = require("util"), fs = require("fs"), nmfetch = require_fetch(), dns = require("dns"), net = require("net"), os = require("os"), DNS_TTL = 5 * 60 * 1e3, networkInterfaces;
    try {
      networkInterfaces = os.networkInterfaces();
    } catch {
    }
    module2.exports.networkInterfaces = networkInterfaces;
    var isFamilySupported = (family, allowInternal) => {
      let networkInterfaces2 = module2.exports.networkInterfaces;
      return networkInterfaces2 ? (
        // crux that replaces Object.values(networkInterfaces) as Object.values is not supported in nodejs v6
        Object.keys(networkInterfaces2).map((key) => networkInterfaces2[key]).reduce((acc, val) => acc.concat(val), []).filter((i) => !i.internal || allowInternal).filter((i) => i.family === "IPv" + family || i.family === family).length > 0
      ) : !0;
    }, resolver = (family, hostname, options, callback) => {
      if (options = options || {}, !isFamilySupported(family, options.allowInternalNetworkInterfaces))
        return callback(null, []);
      (dns.Resolver ? new dns.Resolver(options) : dns)["resolve" + family](hostname, (err, addresses) => {
        if (err) {
          switch (err.code) {
            case dns.NODATA:
            case dns.NOTFOUND:
            case dns.NOTIMP:
            case dns.SERVFAIL:
            case dns.CONNREFUSED:
            case dns.REFUSED:
            case "EAI_AGAIN":
              return callback(null, []);
          }
          return callback(err);
        }
        return callback(null, Array.isArray(addresses) ? addresses : [].concat(addresses || []));
      });
    }, dnsCache = module2.exports.dnsCache = /* @__PURE__ */ new Map(), formatDNSValue = (value, extra) => value ? Object.assign(
      {
        servername: value.servername,
        host: !value.addresses || !value.addresses.length ? null : value.addresses.length === 1 ? value.addresses[0] : value.addresses[Math.floor(Math.random() * value.addresses.length)]
      },
      extra || {}
    ) : Object.assign({}, extra || {});
    module2.exports.resolveHostname = (options, callback) => {
      if (options = options || {}, !options.host && options.servername && (options.host = options.servername), !options.host || net.isIP(options.host)) {
        let value = {
          addresses: [options.host],
          servername: options.servername || !1
        };
        return callback(
          null,
          formatDNSValue(value, {
            cached: !1
          })
        );
      }
      let cached;
      if (dnsCache.has(options.host) && (cached = dnsCache.get(options.host), !cached.expires || cached.expires >= Date.now()))
        return callback(
          null,
          formatDNSValue(cached.value, {
            cached: !0
          })
        );
      resolver(4, options.host, options, (err, addresses) => {
        if (err)
          return cached ? callback(
            null,
            formatDNSValue(cached.value, {
              cached: !0,
              error: err
            })
          ) : callback(err);
        if (addresses && addresses.length) {
          let value = {
            addresses,
            servername: options.servername || options.host
          };
          return dnsCache.set(options.host, {
            value,
            expires: Date.now() + (options.dnsTtl || DNS_TTL)
          }), callback(
            null,
            formatDNSValue(value, {
              cached: !1
            })
          );
        }
        resolver(6, options.host, options, (err2, addresses2) => {
          if (err2)
            return cached ? callback(
              null,
              formatDNSValue(cached.value, {
                cached: !0,
                error: err2
              })
            ) : callback(err2);
          if (addresses2 && addresses2.length) {
            let value = {
              addresses: addresses2,
              servername: options.servername || options.host
            };
            return dnsCache.set(options.host, {
              value,
              expires: Date.now() + (options.dnsTtl || DNS_TTL)
            }), callback(
              null,
              formatDNSValue(value, {
                cached: !1
              })
            );
          }
          try {
            dns.lookup(options.host, { all: !0 }, (err3, addresses3) => {
              if (err3)
                return cached ? callback(
                  null,
                  formatDNSValue(cached.value, {
                    cached: !0,
                    error: err3
                  })
                ) : callback(err3);
              let address = addresses3 ? addresses3.filter((addr) => isFamilySupported(addr.family)).map((addr) => addr.address).shift() : !1;
              if (addresses3 && addresses3.length && !address && console.warn(`Failed to resolve IPv${addresses3[0].family} addresses with current network`), !address && cached)
                return callback(
                  null,
                  formatDNSValue(cached.value, {
                    cached: !0
                  })
                );
              let value = {
                addresses: address ? [address] : [options.host],
                servername: options.servername || options.host
              };
              return dnsCache.set(options.host, {
                value,
                expires: Date.now() + (options.dnsTtl || DNS_TTL)
              }), callback(
                null,
                formatDNSValue(value, {
                  cached: !1
                })
              );
            });
          } catch (err3) {
            return cached ? callback(
              null,
              formatDNSValue(cached.value, {
                cached: !0,
                error: err3
              })
            ) : callback(err3);
          }
        });
      });
    };
    module2.exports.parseConnectionUrl = (str) => {
      str = str || "";
      let options = {};
      return [urllib.parse(str, !0)].forEach((url) => {
        let auth;
        switch (url.protocol) {
          case "smtp:":
            options.secure = !1;
            break;
          case "smtps:":
            options.secure = !0;
            break;
          case "direct:":
            options.direct = !0;
            break;
        }
        !isNaN(url.port) && Number(url.port) && (options.port = Number(url.port)), url.hostname && (options.host = url.hostname), url.auth && (auth = url.auth.split(":"), options.auth || (options.auth = {}), options.auth.user = auth.shift(), options.auth.pass = auth.join(":")), Object.keys(url.query || {}).forEach((key) => {
          let obj = options, lKey = key, value = url.query[key];
          switch (isNaN(value) || (value = Number(value)), value) {
            case "true":
              value = !0;
              break;
            case "false":
              value = !1;
              break;
          }
          if (key.indexOf("tls.") === 0)
            lKey = key.substr(4), options.tls || (options.tls = {}), obj = options.tls;
          else if (key.indexOf(".") >= 0)
            return;
          lKey in obj || (obj[lKey] = value);
        });
      }), options;
    };
    module2.exports._logFunc = (logger, level, defaults, data, message, ...args) => {
      let entry = {};
      Object.keys(defaults || {}).forEach((key) => {
        key !== "level" && (entry[key] = defaults[key]);
      }), Object.keys(data || {}).forEach((key) => {
        key !== "level" && (entry[key] = data[key]);
      }), logger[level](entry, message, ...args);
    };
    module2.exports.getLogger = (options, defaults) => {
      options = options || {};
      let response = {}, levels = ["trace", "debug", "info", "warn", "error", "fatal"];
      if (!options.logger)
        return levels.forEach((level) => {
          response[level] = () => !1;
        }), response;
      let logger = options.logger;
      return options.logger === !0 && (logger = createDefaultLogger(levels)), levels.forEach((level) => {
        response[level] = (data, message, ...args) => {
          module2.exports._logFunc(logger, level, defaults, data, message, ...args);
        };
      }), response;
    };
    module2.exports.callbackPromise = (resolve, reject) => function() {
      let args = Array.from(arguments), err = args.shift();
      err ? reject(err) : resolve(...args);
    };
    module2.exports.parseDataURI = (uri) => {
      let input = uri, commaPos = input.indexOf(",");
      if (!commaPos)
        return uri;
      let data = input.substring(commaPos + 1), metaStr = input.substring(5, commaPos), encoding, metaEntries = metaStr.split(";"), lastMetaEntry = metaEntries.length > 1 ? metaEntries[metaEntries.length - 1] : !1;
      lastMetaEntry && lastMetaEntry.indexOf("=") < 0 && (encoding = lastMetaEntry.toLowerCase(), metaEntries.pop());
      let contentType = metaEntries.shift() || "application/octet-stream", params = {};
      for (let entry of metaEntries) {
        let sep = entry.indexOf("=");
        if (sep >= 0) {
          let key = entry.substring(0, sep), value = entry.substring(sep + 1);
          params[key] = value;
        }
      }
      switch (encoding) {
        case "base64":
          data = Buffer.from(data, "base64");
          break;
        case "utf8":
          data = Buffer.from(data);
          break;
        default:
          try {
            data = Buffer.from(decodeURIComponent(data));
          } catch {
            data = Buffer.from(data);
          }
          data = Buffer.from(data);
      }
      return { data, encoding, contentType, params };
    };
    module2.exports.resolveContent = (data, key, callback) => {
      let promise;
      callback || (promise = new Promise((resolve, reject) => {
        callback = module2.exports.callbackPromise(resolve, reject);
      }));
      let content = data && data[key] && data[key].content || data[key], contentStream, encoding = (typeof data[key] == "object" && data[key].encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
      if (!content)
        return callback(null, content);
      if (typeof content == "object") {
        if (typeof content.pipe == "function")
          return resolveStream(content, (err, value) => {
            if (err)
              return callback(err);
            data[key].content ? data[key].content = value : data[key] = value, callback(null, value);
          });
        if (/^https?:\/\//i.test(content.path || content.href))
          return contentStream = nmfetch(content.path || content.href), resolveStream(contentStream, callback);
        if (/^data:/i.test(content.path || content.href)) {
          let parsedDataUri = module2.exports.parseDataURI(content.path || content.href);
          return !parsedDataUri || !parsedDataUri.data ? callback(null, Buffer.from(0)) : callback(null, parsedDataUri.data);
        } else if (content.path)
          return resolveStream(fs.createReadStream(content.path), callback);
      }
      return typeof data[key].content == "string" && !["utf8", "usascii", "ascii"].includes(encoding) && (content = Buffer.from(data[key].content, encoding)), setImmediate(() => callback(null, content)), promise;
    };
    module2.exports.assign = function() {
      let args = Array.from(arguments), target = args.shift() || {};
      return args.forEach((source) => {
        Object.keys(source || {}).forEach((key) => {
          ["tls", "auth"].includes(key) && source[key] && typeof source[key] == "object" ? (target[key] || (target[key] = {}), Object.keys(source[key]).forEach((subKey) => {
            target[key][subKey] = source[key][subKey];
          })) : target[key] = source[key];
        });
      }), target;
    };
    module2.exports.encodeXText = (str) => {
      if (!/[^\x21-\x2A\x2C-\x3C\x3E-\x7E]/.test(str))
        return str;
      let buf = Buffer.from(str), result = "";
      for (let i = 0, len = buf.length; i < len; i++) {
        let c = buf[i];
        c < 33 || c > 126 || c === 43 || c === 61 ? result += "+" + (c < 16 ? "0" : "") + c.toString(16).toUpperCase() : result += String.fromCharCode(c);
      }
      return result;
    };
    function resolveStream(stream, callback) {
      let responded = !1, chunks = [], chunklen = 0;
      stream.on("error", (err) => {
        responded || (responded = !0, callback(err));
      }), stream.on("readable", () => {
        let chunk;
        for (; (chunk = stream.read()) !== null; )
          chunks.push(chunk), chunklen += chunk.length;
      }), stream.on("end", () => {
        if (responded)
          return;
        responded = !0;
        let value;
        try {
          value = Buffer.concat(chunks, chunklen);
        } catch (E) {
          return callback(E);
        }
        callback(null, value);
      });
    }
    function createDefaultLogger(levels) {
      let levelMaxLen = 0, levelNames = /* @__PURE__ */ new Map();
      levels.forEach((level) => {
        level.length > levelMaxLen && (levelMaxLen = level.length);
      }), levels.forEach((level) => {
        let levelName = level.toUpperCase();
        levelName.length < levelMaxLen && (levelName += " ".repeat(levelMaxLen - levelName.length)), levelNames.set(level, levelName);
      });
      let print = (level, entry, message, ...args) => {
        let prefix = "";
        entry && (entry.tnx === "server" ? prefix = "S: " : entry.tnx === "client" && (prefix = "C: "), entry.sid && (prefix = "[" + entry.sid + "] " + prefix), entry.cid && (prefix = "[#" + entry.cid + "] " + prefix)), message = util.format(message, ...args), message.split(/\r?\n/).forEach((line) => {
          console.log("[%s] %s %s", (/* @__PURE__ */ new Date()).toISOString().substr(0, 19).replace(/T/, " "), levelNames.get(level), prefix + line);
        });
      }, logger = {};
      return levels.forEach((level) => {
        logger[level] = print.bind(null, level);
      }), logger;
    }
  }
});

// node_modules/nodemailer/lib/mime-funcs/mime-types.js
var require_mime_types = __commonJS({
  "node_modules/nodemailer/lib/mime-funcs/mime-types.js"(exports2, module2) {
    "use strict";
    var path = require("path"), defaultMimeType = "application/octet-stream", defaultExtension = "bin", mimeTypes = /* @__PURE__ */ new Map([
      ["application/acad", "dwg"],
      ["application/applixware", "aw"],
      ["application/arj", "arj"],
      ["application/atom+xml", "xml"],
      ["application/atomcat+xml", "atomcat"],
      ["application/atomsvc+xml", "atomsvc"],
      ["application/base64", ["mm", "mme"]],
      ["application/binhex", "hqx"],
      ["application/binhex4", "hqx"],
      ["application/book", ["book", "boo"]],
      ["application/ccxml+xml,", "ccxml"],
      ["application/cdf", "cdf"],
      ["application/cdmi-capability", "cdmia"],
      ["application/cdmi-container", "cdmic"],
      ["application/cdmi-domain", "cdmid"],
      ["application/cdmi-object", "cdmio"],
      ["application/cdmi-queue", "cdmiq"],
      ["application/clariscad", "ccad"],
      ["application/commonground", "dp"],
      ["application/cu-seeme", "cu"],
      ["application/davmount+xml", "davmount"],
      ["application/drafting", "drw"],
      ["application/dsptype", "tsp"],
      ["application/dssc+der", "dssc"],
      ["application/dssc+xml", "xdssc"],
      ["application/dxf", "dxf"],
      ["application/ecmascript", ["js", "es"]],
      ["application/emma+xml", "emma"],
      ["application/envoy", "evy"],
      ["application/epub+zip", "epub"],
      ["application/excel", ["xls", "xl", "xla", "xlb", "xlc", "xld", "xlk", "xll", "xlm", "xlt", "xlv", "xlw"]],
      ["application/exi", "exi"],
      ["application/font-tdpfr", "pfr"],
      ["application/fractals", "fif"],
      ["application/freeloader", "frl"],
      ["application/futuresplash", "spl"],
      ["application/geo+json", "geojson"],
      ["application/gnutar", "tgz"],
      ["application/groupwise", "vew"],
      ["application/hlp", "hlp"],
      ["application/hta", "hta"],
      ["application/hyperstudio", "stk"],
      ["application/i-deas", "unv"],
      ["application/iges", ["iges", "igs"]],
      ["application/inf", "inf"],
      ["application/internet-property-stream", "acx"],
      ["application/ipfix", "ipfix"],
      ["application/java", "class"],
      ["application/java-archive", "jar"],
      ["application/java-byte-code", "class"],
      ["application/java-serialized-object", "ser"],
      ["application/java-vm", "class"],
      ["application/javascript", "js"],
      ["application/json", "json"],
      ["application/lha", "lha"],
      ["application/lzx", "lzx"],
      ["application/mac-binary", "bin"],
      ["application/mac-binhex", "hqx"],
      ["application/mac-binhex40", "hqx"],
      ["application/mac-compactpro", "cpt"],
      ["application/macbinary", "bin"],
      ["application/mads+xml", "mads"],
      ["application/marc", "mrc"],
      ["application/marcxml+xml", "mrcx"],
      ["application/mathematica", "ma"],
      ["application/mathml+xml", "mathml"],
      ["application/mbedlet", "mbd"],
      ["application/mbox", "mbox"],
      ["application/mcad", "mcd"],
      ["application/mediaservercontrol+xml", "mscml"],
      ["application/metalink4+xml", "meta4"],
      ["application/mets+xml", "mets"],
      ["application/mime", "aps"],
      ["application/mods+xml", "mods"],
      ["application/mp21", "m21"],
      ["application/mp4", "mp4"],
      ["application/mspowerpoint", ["ppt", "pot", "pps", "ppz"]],
      ["application/msword", ["doc", "dot", "w6w", "wiz", "word"]],
      ["application/mswrite", "wri"],
      ["application/mxf", "mxf"],
      ["application/netmc", "mcp"],
      ["application/octet-stream", ["*"]],
      ["application/oda", "oda"],
      ["application/oebps-package+xml", "opf"],
      ["application/ogg", "ogx"],
      ["application/olescript", "axs"],
      ["application/onenote", "onetoc"],
      ["application/patch-ops-error+xml", "xer"],
      ["application/pdf", "pdf"],
      ["application/pgp-encrypted", "asc"],
      ["application/pgp-signature", "pgp"],
      ["application/pics-rules", "prf"],
      ["application/pkcs-12", "p12"],
      ["application/pkcs-crl", "crl"],
      ["application/pkcs10", "p10"],
      ["application/pkcs7-mime", ["p7c", "p7m"]],
      ["application/pkcs7-signature", "p7s"],
      ["application/pkcs8", "p8"],
      ["application/pkix-attr-cert", "ac"],
      ["application/pkix-cert", ["cer", "crt"]],
      ["application/pkix-crl", "crl"],
      ["application/pkix-pkipath", "pkipath"],
      ["application/pkixcmp", "pki"],
      ["application/plain", "text"],
      ["application/pls+xml", "pls"],
      ["application/postscript", ["ps", "ai", "eps"]],
      ["application/powerpoint", "ppt"],
      ["application/pro_eng", ["part", "prt"]],
      ["application/prs.cww", "cww"],
      ["application/pskc+xml", "pskcxml"],
      ["application/rdf+xml", "rdf"],
      ["application/reginfo+xml", "rif"],
      ["application/relax-ng-compact-syntax", "rnc"],
      ["application/resource-lists+xml", "rl"],
      ["application/resource-lists-diff+xml", "rld"],
      ["application/ringing-tones", "rng"],
      ["application/rls-services+xml", "rs"],
      ["application/rsd+xml", "rsd"],
      ["application/rss+xml", "xml"],
      ["application/rtf", ["rtf", "rtx"]],
      ["application/sbml+xml", "sbml"],
      ["application/scvp-cv-request", "scq"],
      ["application/scvp-cv-response", "scs"],
      ["application/scvp-vp-request", "spq"],
      ["application/scvp-vp-response", "spp"],
      ["application/sdp", "sdp"],
      ["application/sea", "sea"],
      ["application/set", "set"],
      ["application/set-payment-initiation", "setpay"],
      ["application/set-registration-initiation", "setreg"],
      ["application/shf+xml", "shf"],
      ["application/sla", "stl"],
      ["application/smil", ["smi", "smil"]],
      ["application/smil+xml", "smi"],
      ["application/solids", "sol"],
      ["application/sounder", "sdr"],
      ["application/sparql-query", "rq"],
      ["application/sparql-results+xml", "srx"],
      ["application/srgs", "gram"],
      ["application/srgs+xml", "grxml"],
      ["application/sru+xml", "sru"],
      ["application/ssml+xml", "ssml"],
      ["application/step", ["step", "stp"]],
      ["application/streamingmedia", "ssm"],
      ["application/tei+xml", "tei"],
      ["application/thraud+xml", "tfi"],
      ["application/timestamped-data", "tsd"],
      ["application/toolbook", "tbk"],
      ["application/vda", "vda"],
      ["application/vnd.3gpp.pic-bw-large", "plb"],
      ["application/vnd.3gpp.pic-bw-small", "psb"],
      ["application/vnd.3gpp.pic-bw-var", "pvb"],
      ["application/vnd.3gpp2.tcap", "tcap"],
      ["application/vnd.3m.post-it-notes", "pwn"],
      ["application/vnd.accpac.simply.aso", "aso"],
      ["application/vnd.accpac.simply.imp", "imp"],
      ["application/vnd.acucobol", "acu"],
      ["application/vnd.acucorp", "atc"],
      ["application/vnd.adobe.air-application-installer-package+zip", "air"],
      ["application/vnd.adobe.fxp", "fxp"],
      ["application/vnd.adobe.xdp+xml", "xdp"],
      ["application/vnd.adobe.xfdf", "xfdf"],
      ["application/vnd.ahead.space", "ahead"],
      ["application/vnd.airzip.filesecure.azf", "azf"],
      ["application/vnd.airzip.filesecure.azs", "azs"],
      ["application/vnd.amazon.ebook", "azw"],
      ["application/vnd.americandynamics.acc", "acc"],
      ["application/vnd.amiga.ami", "ami"],
      ["application/vnd.android.package-archive", "apk"],
      ["application/vnd.anser-web-certificate-issue-initiation", "cii"],
      ["application/vnd.anser-web-funds-transfer-initiation", "fti"],
      ["application/vnd.antix.game-component", "atx"],
      ["application/vnd.apple.installer+xml", "mpkg"],
      ["application/vnd.apple.mpegurl", "m3u8"],
      ["application/vnd.aristanetworks.swi", "swi"],
      ["application/vnd.audiograph", "aep"],
      ["application/vnd.blueice.multipass", "mpm"],
      ["application/vnd.bmi", "bmi"],
      ["application/vnd.businessobjects", "rep"],
      ["application/vnd.chemdraw+xml", "cdxml"],
      ["application/vnd.chipnuts.karaoke-mmd", "mmd"],
      ["application/vnd.cinderella", "cdy"],
      ["application/vnd.claymore", "cla"],
      ["application/vnd.cloanto.rp9", "rp9"],
      ["application/vnd.clonk.c4group", "c4g"],
      ["application/vnd.cluetrust.cartomobile-config", "c11amc"],
      ["application/vnd.cluetrust.cartomobile-config-pkg", "c11amz"],
      ["application/vnd.commonspace", "csp"],
      ["application/vnd.contact.cmsg", "cdbcmsg"],
      ["application/vnd.cosmocaller", "cmc"],
      ["application/vnd.crick.clicker", "clkx"],
      ["application/vnd.crick.clicker.keyboard", "clkk"],
      ["application/vnd.crick.clicker.palette", "clkp"],
      ["application/vnd.crick.clicker.template", "clkt"],
      ["application/vnd.crick.clicker.wordbank", "clkw"],
      ["application/vnd.criticaltools.wbs+xml", "wbs"],
      ["application/vnd.ctc-posml", "pml"],
      ["application/vnd.cups-ppd", "ppd"],
      ["application/vnd.curl.car", "car"],
      ["application/vnd.curl.pcurl", "pcurl"],
      ["application/vnd.data-vision.rdz", "rdz"],
      ["application/vnd.denovo.fcselayout-link", "fe_launch"],
      ["application/vnd.dna", "dna"],
      ["application/vnd.dolby.mlp", "mlp"],
      ["application/vnd.dpgraph", "dpg"],
      ["application/vnd.dreamfactory", "dfac"],
      ["application/vnd.dvb.ait", "ait"],
      ["application/vnd.dvb.service", "svc"],
      ["application/vnd.dynageo", "geo"],
      ["application/vnd.ecowin.chart", "mag"],
      ["application/vnd.enliven", "nml"],
      ["application/vnd.epson.esf", "esf"],
      ["application/vnd.epson.msf", "msf"],
      ["application/vnd.epson.quickanime", "qam"],
      ["application/vnd.epson.salt", "slt"],
      ["application/vnd.epson.ssf", "ssf"],
      ["application/vnd.eszigno3+xml", "es3"],
      ["application/vnd.ezpix-album", "ez2"],
      ["application/vnd.ezpix-package", "ez3"],
      ["application/vnd.fdf", "fdf"],
      ["application/vnd.fdsn.seed", "seed"],
      ["application/vnd.flographit", "gph"],
      ["application/vnd.fluxtime.clip", "ftc"],
      ["application/vnd.framemaker", "fm"],
      ["application/vnd.frogans.fnc", "fnc"],
      ["application/vnd.frogans.ltf", "ltf"],
      ["application/vnd.fsc.weblaunch", "fsc"],
      ["application/vnd.fujitsu.oasys", "oas"],
      ["application/vnd.fujitsu.oasys2", "oa2"],
      ["application/vnd.fujitsu.oasys3", "oa3"],
      ["application/vnd.fujitsu.oasysgp", "fg5"],
      ["application/vnd.fujitsu.oasysprs", "bh2"],
      ["application/vnd.fujixerox.ddd", "ddd"],
      ["application/vnd.fujixerox.docuworks", "xdw"],
      ["application/vnd.fujixerox.docuworks.binder", "xbd"],
      ["application/vnd.fuzzysheet", "fzs"],
      ["application/vnd.genomatix.tuxedo", "txd"],
      ["application/vnd.geogebra.file", "ggb"],
      ["application/vnd.geogebra.tool", "ggt"],
      ["application/vnd.geometry-explorer", "gex"],
      ["application/vnd.geonext", "gxt"],
      ["application/vnd.geoplan", "g2w"],
      ["application/vnd.geospace", "g3w"],
      ["application/vnd.gmx", "gmx"],
      ["application/vnd.google-earth.kml+xml", "kml"],
      ["application/vnd.google-earth.kmz", "kmz"],
      ["application/vnd.grafeq", "gqf"],
      ["application/vnd.groove-account", "gac"],
      ["application/vnd.groove-help", "ghf"],
      ["application/vnd.groove-identity-message", "gim"],
      ["application/vnd.groove-injector", "grv"],
      ["application/vnd.groove-tool-message", "gtm"],
      ["application/vnd.groove-tool-template", "tpl"],
      ["application/vnd.groove-vcard", "vcg"],
      ["application/vnd.hal+xml", "hal"],
      ["application/vnd.handheld-entertainment+xml", "zmm"],
      ["application/vnd.hbci", "hbci"],
      ["application/vnd.hhe.lesson-player", "les"],
      ["application/vnd.hp-hpgl", ["hgl", "hpg", "hpgl"]],
      ["application/vnd.hp-hpid", "hpid"],
      ["application/vnd.hp-hps", "hps"],
      ["application/vnd.hp-jlyt", "jlt"],
      ["application/vnd.hp-pcl", "pcl"],
      ["application/vnd.hp-pclxl", "pclxl"],
      ["application/vnd.hydrostatix.sof-data", "sfd-hdstx"],
      ["application/vnd.hzn-3d-crossword", "x3d"],
      ["application/vnd.ibm.minipay", "mpy"],
      ["application/vnd.ibm.modcap", "afp"],
      ["application/vnd.ibm.rights-management", "irm"],
      ["application/vnd.ibm.secure-container", "sc"],
      ["application/vnd.iccprofile", "icc"],
      ["application/vnd.igloader", "igl"],
      ["application/vnd.immervision-ivp", "ivp"],
      ["application/vnd.immervision-ivu", "ivu"],
      ["application/vnd.insors.igm", "igm"],
      ["application/vnd.intercon.formnet", "xpw"],
      ["application/vnd.intergeo", "i2g"],
      ["application/vnd.intu.qbo", "qbo"],
      ["application/vnd.intu.qfx", "qfx"],
      ["application/vnd.ipunplugged.rcprofile", "rcprofile"],
      ["application/vnd.irepository.package+xml", "irp"],
      ["application/vnd.is-xpr", "xpr"],
      ["application/vnd.isac.fcs", "fcs"],
      ["application/vnd.jam", "jam"],
      ["application/vnd.jcp.javame.midlet-rms", "rms"],
      ["application/vnd.jisp", "jisp"],
      ["application/vnd.joost.joda-archive", "joda"],
      ["application/vnd.kahootz", "ktz"],
      ["application/vnd.kde.karbon", "karbon"],
      ["application/vnd.kde.kchart", "chrt"],
      ["application/vnd.kde.kformula", "kfo"],
      ["application/vnd.kde.kivio", "flw"],
      ["application/vnd.kde.kontour", "kon"],
      ["application/vnd.kde.kpresenter", "kpr"],
      ["application/vnd.kde.kspread", "ksp"],
      ["application/vnd.kde.kword", "kwd"],
      ["application/vnd.kenameaapp", "htke"],
      ["application/vnd.kidspiration", "kia"],
      ["application/vnd.kinar", "kne"],
      ["application/vnd.koan", "skp"],
      ["application/vnd.kodak-descriptor", "sse"],
      ["application/vnd.las.las+xml", "lasxml"],
      ["application/vnd.llamagraphics.life-balance.desktop", "lbd"],
      ["application/vnd.llamagraphics.life-balance.exchange+xml", "lbe"],
      ["application/vnd.lotus-1-2-3", "123"],
      ["application/vnd.lotus-approach", "apr"],
      ["application/vnd.lotus-freelance", "pre"],
      ["application/vnd.lotus-notes", "nsf"],
      ["application/vnd.lotus-organizer", "org"],
      ["application/vnd.lotus-screencam", "scm"],
      ["application/vnd.lotus-wordpro", "lwp"],
      ["application/vnd.macports.portpkg", "portpkg"],
      ["application/vnd.mcd", "mcd"],
      ["application/vnd.medcalcdata", "mc1"],
      ["application/vnd.mediastation.cdkey", "cdkey"],
      ["application/vnd.mfer", "mwf"],
      ["application/vnd.mfmp", "mfm"],
      ["application/vnd.micrografx.flo", "flo"],
      ["application/vnd.micrografx.igx", "igx"],
      ["application/vnd.mif", "mif"],
      ["application/vnd.mobius.daf", "daf"],
      ["application/vnd.mobius.dis", "dis"],
      ["application/vnd.mobius.mbk", "mbk"],
      ["application/vnd.mobius.mqy", "mqy"],
      ["application/vnd.mobius.msl", "msl"],
      ["application/vnd.mobius.plc", "plc"],
      ["application/vnd.mobius.txf", "txf"],
      ["application/vnd.mophun.application", "mpn"],
      ["application/vnd.mophun.certificate", "mpc"],
      ["application/vnd.mozilla.xul+xml", "xul"],
      ["application/vnd.ms-artgalry", "cil"],
      ["application/vnd.ms-cab-compressed", "cab"],
      ["application/vnd.ms-excel", ["xls", "xla", "xlc", "xlm", "xlt", "xlw", "xlb", "xll"]],
      ["application/vnd.ms-excel.addin.macroenabled.12", "xlam"],
      ["application/vnd.ms-excel.sheet.binary.macroenabled.12", "xlsb"],
      ["application/vnd.ms-excel.sheet.macroenabled.12", "xlsm"],
      ["application/vnd.ms-excel.template.macroenabled.12", "xltm"],
      ["application/vnd.ms-fontobject", "eot"],
      ["application/vnd.ms-htmlhelp", "chm"],
      ["application/vnd.ms-ims", "ims"],
      ["application/vnd.ms-lrm", "lrm"],
      ["application/vnd.ms-officetheme", "thmx"],
      ["application/vnd.ms-outlook", "msg"],
      ["application/vnd.ms-pki.certstore", "sst"],
      ["application/vnd.ms-pki.pko", "pko"],
      ["application/vnd.ms-pki.seccat", "cat"],
      ["application/vnd.ms-pki.stl", "stl"],
      ["application/vnd.ms-pkicertstore", "sst"],
      ["application/vnd.ms-pkiseccat", "cat"],
      ["application/vnd.ms-pkistl", "stl"],
      ["application/vnd.ms-powerpoint", ["ppt", "pot", "pps", "ppa", "pwz"]],
      ["application/vnd.ms-powerpoint.addin.macroenabled.12", "ppam"],
      ["application/vnd.ms-powerpoint.presentation.macroenabled.12", "pptm"],
      ["application/vnd.ms-powerpoint.slide.macroenabled.12", "sldm"],
      ["application/vnd.ms-powerpoint.slideshow.macroenabled.12", "ppsm"],
      ["application/vnd.ms-powerpoint.template.macroenabled.12", "potm"],
      ["application/vnd.ms-project", "mpp"],
      ["application/vnd.ms-word.document.macroenabled.12", "docm"],
      ["application/vnd.ms-word.template.macroenabled.12", "dotm"],
      ["application/vnd.ms-works", ["wks", "wcm", "wdb", "wps"]],
      ["application/vnd.ms-wpl", "wpl"],
      ["application/vnd.ms-xpsdocument", "xps"],
      ["application/vnd.mseq", "mseq"],
      ["application/vnd.musician", "mus"],
      ["application/vnd.muvee.style", "msty"],
      ["application/vnd.neurolanguage.nlu", "nlu"],
      ["application/vnd.noblenet-directory", "nnd"],
      ["application/vnd.noblenet-sealer", "nns"],
      ["application/vnd.noblenet-web", "nnw"],
      ["application/vnd.nokia.configuration-message", "ncm"],
      ["application/vnd.nokia.n-gage.data", "ngdat"],
      ["application/vnd.nokia.n-gage.symbian.install", "n-gage"],
      ["application/vnd.nokia.radio-preset", "rpst"],
      ["application/vnd.nokia.radio-presets", "rpss"],
      ["application/vnd.nokia.ringing-tone", "rng"],
      ["application/vnd.novadigm.edm", "edm"],
      ["application/vnd.novadigm.edx", "edx"],
      ["application/vnd.novadigm.ext", "ext"],
      ["application/vnd.oasis.opendocument.chart", "odc"],
      ["application/vnd.oasis.opendocument.chart-template", "otc"],
      ["application/vnd.oasis.opendocument.database", "odb"],
      ["application/vnd.oasis.opendocument.formula", "odf"],
      ["application/vnd.oasis.opendocument.formula-template", "odft"],
      ["application/vnd.oasis.opendocument.graphics", "odg"],
      ["application/vnd.oasis.opendocument.graphics-template", "otg"],
      ["application/vnd.oasis.opendocument.image", "odi"],
      ["application/vnd.oasis.opendocument.image-template", "oti"],
      ["application/vnd.oasis.opendocument.presentation", "odp"],
      ["application/vnd.oasis.opendocument.presentation-template", "otp"],
      ["application/vnd.oasis.opendocument.spreadsheet", "ods"],
      ["application/vnd.oasis.opendocument.spreadsheet-template", "ots"],
      ["application/vnd.oasis.opendocument.text", "odt"],
      ["application/vnd.oasis.opendocument.text-master", "odm"],
      ["application/vnd.oasis.opendocument.text-template", "ott"],
      ["application/vnd.oasis.opendocument.text-web", "oth"],
      ["application/vnd.olpc-sugar", "xo"],
      ["application/vnd.oma.dd2+xml", "dd2"],
      ["application/vnd.openofficeorg.extension", "oxt"],
      ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
      ["application/vnd.openxmlformats-officedocument.presentationml.slide", "sldx"],
      ["application/vnd.openxmlformats-officedocument.presentationml.slideshow", "ppsx"],
      ["application/vnd.openxmlformats-officedocument.presentationml.template", "potx"],
      ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
      ["application/vnd.openxmlformats-officedocument.spreadsheetml.template", "xltx"],
      ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
      ["application/vnd.openxmlformats-officedocument.wordprocessingml.template", "dotx"],
      ["application/vnd.osgeo.mapguide.package", "mgp"],
      ["application/vnd.osgi.dp", "dp"],
      ["application/vnd.palm", "pdb"],
      ["application/vnd.pawaafile", "paw"],
      ["application/vnd.pg.format", "str"],
      ["application/vnd.pg.osasli", "ei6"],
      ["application/vnd.picsel", "efif"],
      ["application/vnd.pmi.widget", "wg"],
      ["application/vnd.pocketlearn", "plf"],
      ["application/vnd.powerbuilder6", "pbd"],
      ["application/vnd.previewsystems.box", "box"],
      ["application/vnd.proteus.magazine", "mgz"],
      ["application/vnd.publishare-delta-tree", "qps"],
      ["application/vnd.pvi.ptid1", "ptid"],
      ["application/vnd.quark.quarkxpress", "qxd"],
      ["application/vnd.realvnc.bed", "bed"],
      ["application/vnd.recordare.musicxml", "mxl"],
      ["application/vnd.recordare.musicxml+xml", "musicxml"],
      ["application/vnd.rig.cryptonote", "cryptonote"],
      ["application/vnd.rim.cod", "cod"],
      ["application/vnd.rn-realmedia", "rm"],
      ["application/vnd.rn-realplayer", "rnx"],
      ["application/vnd.route66.link66+xml", "link66"],
      ["application/vnd.sailingtracker.track", "st"],
      ["application/vnd.seemail", "see"],
      ["application/vnd.sema", "sema"],
      ["application/vnd.semd", "semd"],
      ["application/vnd.semf", "semf"],
      ["application/vnd.shana.informed.formdata", "ifm"],
      ["application/vnd.shana.informed.formtemplate", "itp"],
      ["application/vnd.shana.informed.interchange", "iif"],
      ["application/vnd.shana.informed.package", "ipk"],
      ["application/vnd.simtech-mindmapper", "twd"],
      ["application/vnd.smaf", "mmf"],
      ["application/vnd.smart.teacher", "teacher"],
      ["application/vnd.solent.sdkm+xml", "sdkm"],
      ["application/vnd.spotfire.dxp", "dxp"],
      ["application/vnd.spotfire.sfs", "sfs"],
      ["application/vnd.stardivision.calc", "sdc"],
      ["application/vnd.stardivision.draw", "sda"],
      ["application/vnd.stardivision.impress", "sdd"],
      ["application/vnd.stardivision.math", "smf"],
      ["application/vnd.stardivision.writer", "sdw"],
      ["application/vnd.stardivision.writer-global", "sgl"],
      ["application/vnd.stepmania.stepchart", "sm"],
      ["application/vnd.sun.xml.calc", "sxc"],
      ["application/vnd.sun.xml.calc.template", "stc"],
      ["application/vnd.sun.xml.draw", "sxd"],
      ["application/vnd.sun.xml.draw.template", "std"],
      ["application/vnd.sun.xml.impress", "sxi"],
      ["application/vnd.sun.xml.impress.template", "sti"],
      ["application/vnd.sun.xml.math", "sxm"],
      ["application/vnd.sun.xml.writer", "sxw"],
      ["application/vnd.sun.xml.writer.global", "sxg"],
      ["application/vnd.sun.xml.writer.template", "stw"],
      ["application/vnd.sus-calendar", "sus"],
      ["application/vnd.svd", "svd"],
      ["application/vnd.symbian.install", "sis"],
      ["application/vnd.syncml+xml", "xsm"],
      ["application/vnd.syncml.dm+wbxml", "bdm"],
      ["application/vnd.syncml.dm+xml", "xdm"],
      ["application/vnd.tao.intent-module-archive", "tao"],
      ["application/vnd.tmobile-livetv", "tmo"],
      ["application/vnd.trid.tpt", "tpt"],
      ["application/vnd.triscape.mxs", "mxs"],
      ["application/vnd.trueapp", "tra"],
      ["application/vnd.ufdl", "ufd"],
      ["application/vnd.uiq.theme", "utz"],
      ["application/vnd.umajin", "umj"],
      ["application/vnd.unity", "unityweb"],
      ["application/vnd.uoml+xml", "uoml"],
      ["application/vnd.vcx", "vcx"],
      ["application/vnd.visio", "vsd"],
      ["application/vnd.visionary", "vis"],
      ["application/vnd.vsf", "vsf"],
      ["application/vnd.wap.wbxml", "wbxml"],
      ["application/vnd.wap.wmlc", "wmlc"],
      ["application/vnd.wap.wmlscriptc", "wmlsc"],
      ["application/vnd.webturbo", "wtb"],
      ["application/vnd.wolfram.player", "nbp"],
      ["application/vnd.wordperfect", "wpd"],
      ["application/vnd.wqd", "wqd"],
      ["application/vnd.wt.stf", "stf"],
      ["application/vnd.xara", ["web", "xar"]],
      ["application/vnd.xfdl", "xfdl"],
      ["application/vnd.yamaha.hv-dic", "hvd"],
      ["application/vnd.yamaha.hv-script", "hvs"],
      ["application/vnd.yamaha.hv-voice", "hvp"],
      ["application/vnd.yamaha.openscoreformat", "osf"],
      ["application/vnd.yamaha.openscoreformat.osfpvg+xml", "osfpvg"],
      ["application/vnd.yamaha.smaf-audio", "saf"],
      ["application/vnd.yamaha.smaf-phrase", "spf"],
      ["application/vnd.yellowriver-custom-menu", "cmp"],
      ["application/vnd.zul", "zir"],
      ["application/vnd.zzazz.deck+xml", "zaz"],
      ["application/vocaltec-media-desc", "vmd"],
      ["application/vocaltec-media-file", "vmf"],
      ["application/voicexml+xml", "vxml"],
      ["application/widget", "wgt"],
      ["application/winhlp", "hlp"],
      ["application/wordperfect", ["wp", "wp5", "wp6", "wpd"]],
      ["application/wordperfect6.0", ["w60", "wp5"]],
      ["application/wordperfect6.1", "w61"],
      ["application/wsdl+xml", "wsdl"],
      ["application/wspolicy+xml", "wspolicy"],
      ["application/x-123", "wk1"],
      ["application/x-7z-compressed", "7z"],
      ["application/x-abiword", "abw"],
      ["application/x-ace-compressed", "ace"],
      ["application/x-aim", "aim"],
      ["application/x-authorware-bin", "aab"],
      ["application/x-authorware-map", "aam"],
      ["application/x-authorware-seg", "aas"],
      ["application/x-bcpio", "bcpio"],
      ["application/x-binary", "bin"],
      ["application/x-binhex40", "hqx"],
      ["application/x-bittorrent", "torrent"],
      ["application/x-bsh", ["bsh", "sh", "shar"]],
      ["application/x-bytecode.elisp", "elc"],
      ["application/x-bytecode.python", "pyc"],
      ["application/x-bzip", "bz"],
      ["application/x-bzip2", ["boz", "bz2"]],
      ["application/x-cdf", "cdf"],
      ["application/x-cdlink", "vcd"],
      ["application/x-chat", ["cha", "chat"]],
      ["application/x-chess-pgn", "pgn"],
      ["application/x-cmu-raster", "ras"],
      ["application/x-cocoa", "cco"],
      ["application/x-compactpro", "cpt"],
      ["application/x-compress", "z"],
      ["application/x-compressed", ["tgz", "gz", "z", "zip"]],
      ["application/x-conference", "nsc"],
      ["application/x-cpio", "cpio"],
      ["application/x-cpt", "cpt"],
      ["application/x-csh", "csh"],
      ["application/x-debian-package", "deb"],
      ["application/x-deepv", "deepv"],
      ["application/x-director", ["dir", "dcr", "dxr"]],
      ["application/x-doom", "wad"],
      ["application/x-dtbncx+xml", "ncx"],
      ["application/x-dtbook+xml", "dtb"],
      ["application/x-dtbresource+xml", "res"],
      ["application/x-dvi", "dvi"],
      ["application/x-elc", "elc"],
      ["application/x-envoy", ["env", "evy"]],
      ["application/x-esrehber", "es"],
      ["application/x-excel", ["xls", "xla", "xlb", "xlc", "xld", "xlk", "xll", "xlm", "xlt", "xlv", "xlw"]],
      ["application/x-font-bdf", "bdf"],
      ["application/x-font-ghostscript", "gsf"],
      ["application/x-font-linux-psf", "psf"],
      ["application/x-font-otf", "otf"],
      ["application/x-font-pcf", "pcf"],
      ["application/x-font-snf", "snf"],
      ["application/x-font-ttf", "ttf"],
      ["application/x-font-type1", "pfa"],
      ["application/x-font-woff", "woff"],
      ["application/x-frame", "mif"],
      ["application/x-freelance", "pre"],
      ["application/x-futuresplash", "spl"],
      ["application/x-gnumeric", "gnumeric"],
      ["application/x-gsp", "gsp"],
      ["application/x-gss", "gss"],
      ["application/x-gtar", "gtar"],
      ["application/x-gzip", ["gz", "gzip"]],
      ["application/x-hdf", "hdf"],
      ["application/x-helpfile", ["help", "hlp"]],
      ["application/x-httpd-imap", "imap"],
      ["application/x-ima", "ima"],
      ["application/x-internet-signup", ["ins", "isp"]],
      ["application/x-internett-signup", "ins"],
      ["application/x-inventor", "iv"],
      ["application/x-ip2", "ip"],
      ["application/x-iphone", "iii"],
      ["application/x-java-class", "class"],
      ["application/x-java-commerce", "jcm"],
      ["application/x-java-jnlp-file", "jnlp"],
      ["application/x-javascript", "js"],
      ["application/x-koan", ["skd", "skm", "skp", "skt"]],
      ["application/x-ksh", "ksh"],
      ["application/x-latex", ["latex", "ltx"]],
      ["application/x-lha", "lha"],
      ["application/x-lisp", "lsp"],
      ["application/x-livescreen", "ivy"],
      ["application/x-lotus", "wq1"],
      ["application/x-lotusscreencam", "scm"],
      ["application/x-lzh", "lzh"],
      ["application/x-lzx", "lzx"],
      ["application/x-mac-binhex40", "hqx"],
      ["application/x-macbinary", "bin"],
      ["application/x-magic-cap-package-1.0", "mc$"],
      ["application/x-mathcad", "mcd"],
      ["application/x-meme", "mm"],
      ["application/x-midi", ["mid", "midi"]],
      ["application/x-mif", "mif"],
      ["application/x-mix-transfer", "nix"],
      ["application/x-mobipocket-ebook", "prc"],
      ["application/x-mplayer2", "asx"],
      ["application/x-ms-application", "application"],
      ["application/x-ms-wmd", "wmd"],
      ["application/x-ms-wmz", "wmz"],
      ["application/x-ms-xbap", "xbap"],
      ["application/x-msaccess", "mdb"],
      ["application/x-msbinder", "obd"],
      ["application/x-mscardfile", "crd"],
      ["application/x-msclip", "clp"],
      ["application/x-msdownload", ["exe", "dll"]],
      ["application/x-msexcel", ["xls", "xla", "xlw"]],
      ["application/x-msmediaview", ["mvb", "m13", "m14"]],
      ["application/x-msmetafile", "wmf"],
      ["application/x-msmoney", "mny"],
      ["application/x-mspowerpoint", "ppt"],
      ["application/x-mspublisher", "pub"],
      ["application/x-msschedule", "scd"],
      ["application/x-msterminal", "trm"],
      ["application/x-mswrite", "wri"],
      ["application/x-navi-animation", "ani"],
      ["application/x-navidoc", "nvd"],
      ["application/x-navimap", "map"],
      ["application/x-navistyle", "stl"],
      ["application/x-netcdf", ["cdf", "nc"]],
      ["application/x-newton-compatible-pkg", "pkg"],
      ["application/x-nokia-9000-communicator-add-on-software", "aos"],
      ["application/x-omc", "omc"],
      ["application/x-omcdatamaker", "omcd"],
      ["application/x-omcregerator", "omcr"],
      ["application/x-pagemaker", ["pm4", "pm5"]],
      ["application/x-pcl", "pcl"],
      ["application/x-perfmon", ["pma", "pmc", "pml", "pmr", "pmw"]],
      ["application/x-pixclscript", "plx"],
      ["application/x-pkcs10", "p10"],
      ["application/x-pkcs12", ["p12", "pfx"]],
      ["application/x-pkcs7-certificates", ["p7b", "spc"]],
      ["application/x-pkcs7-certreqresp", "p7r"],
      ["application/x-pkcs7-mime", ["p7m", "p7c"]],
      ["application/x-pkcs7-signature", ["p7s", "p7a"]],
      ["application/x-pointplus", "css"],
      ["application/x-portable-anymap", "pnm"],
      ["application/x-project", ["mpc", "mpt", "mpv", "mpx"]],
      ["application/x-qpro", "wb1"],
      ["application/x-rar-compressed", "rar"],
      ["application/x-rtf", "rtf"],
      ["application/x-sdp", "sdp"],
      ["application/x-sea", "sea"],
      ["application/x-seelogo", "sl"],
      ["application/x-sh", "sh"],
      ["application/x-shar", ["shar", "sh"]],
      ["application/x-shockwave-flash", "swf"],
      ["application/x-silverlight-app", "xap"],
      ["application/x-sit", "sit"],
      ["application/x-sprite", ["spr", "sprite"]],
      ["application/x-stuffit", "sit"],
      ["application/x-stuffitx", "sitx"],
      ["application/x-sv4cpio", "sv4cpio"],
      ["application/x-sv4crc", "sv4crc"],
      ["application/x-tar", "tar"],
      ["application/x-tbook", ["sbk", "tbk"]],
      ["application/x-tcl", "tcl"],
      ["application/x-tex", "tex"],
      ["application/x-tex-tfm", "tfm"],
      ["application/x-texinfo", ["texi", "texinfo"]],
      ["application/x-troff", ["roff", "t", "tr"]],
      ["application/x-troff-man", "man"],
      ["application/x-troff-me", "me"],
      ["application/x-troff-ms", "ms"],
      ["application/x-troff-msvideo", "avi"],
      ["application/x-ustar", "ustar"],
      ["application/x-visio", ["vsd", "vst", "vsw"]],
      ["application/x-vnd.audioexplosion.mzz", "mzz"],
      ["application/x-vnd.ls-xpix", "xpix"],
      ["application/x-vrml", "vrml"],
      ["application/x-wais-source", ["src", "wsrc"]],
      ["application/x-winhelp", "hlp"],
      ["application/x-wintalk", "wtk"],
      ["application/x-world", ["wrl", "svr"]],
      ["application/x-wpwin", "wpd"],
      ["application/x-wri", "wri"],
      ["application/x-x509-ca-cert", ["cer", "crt", "der"]],
      ["application/x-x509-user-cert", "crt"],
      ["application/x-xfig", "fig"],
      ["application/x-xpinstall", "xpi"],
      ["application/x-zip-compressed", "zip"],
      ["application/xcap-diff+xml", "xdf"],
      ["application/xenc+xml", "xenc"],
      ["application/xhtml+xml", "xhtml"],
      ["application/xml", "xml"],
      ["application/xml-dtd", "dtd"],
      ["application/xop+xml", "xop"],
      ["application/xslt+xml", "xslt"],
      ["application/xspf+xml", "xspf"],
      ["application/xv+xml", "mxml"],
      ["application/yang", "yang"],
      ["application/yin+xml", "yin"],
      ["application/ynd.ms-pkipko", "pko"],
      ["application/zip", "zip"],
      ["audio/adpcm", "adp"],
      ["audio/aiff", ["aiff", "aif", "aifc"]],
      ["audio/basic", ["snd", "au"]],
      ["audio/it", "it"],
      ["audio/make", ["funk", "my", "pfunk"]],
      ["audio/make.my.funk", "pfunk"],
      ["audio/mid", ["mid", "rmi"]],
      ["audio/midi", ["midi", "kar", "mid"]],
      ["audio/mod", "mod"],
      ["audio/mp4", "mp4a"],
      ["audio/mpeg", ["mpga", "mp3", "m2a", "mp2", "mpa", "mpg"]],
      ["audio/mpeg3", "mp3"],
      ["audio/nspaudio", ["la", "lma"]],
      ["audio/ogg", "oga"],
      ["audio/s3m", "s3m"],
      ["audio/tsp-audio", "tsi"],
      ["audio/tsplayer", "tsp"],
      ["audio/vnd.dece.audio", "uva"],
      ["audio/vnd.digital-winds", "eol"],
      ["audio/vnd.dra", "dra"],
      ["audio/vnd.dts", "dts"],
      ["audio/vnd.dts.hd", "dtshd"],
      ["audio/vnd.lucent.voice", "lvp"],
      ["audio/vnd.ms-playready.media.pya", "pya"],
      ["audio/vnd.nuera.ecelp4800", "ecelp4800"],
      ["audio/vnd.nuera.ecelp7470", "ecelp7470"],
      ["audio/vnd.nuera.ecelp9600", "ecelp9600"],
      ["audio/vnd.qcelp", "qcp"],
      ["audio/vnd.rip", "rip"],
      ["audio/voc", "voc"],
      ["audio/voxware", "vox"],
      ["audio/wav", "wav"],
      ["audio/webm", "weba"],
      ["audio/x-aac", "aac"],
      ["audio/x-adpcm", "snd"],
      ["audio/x-aiff", ["aiff", "aif", "aifc"]],
      ["audio/x-au", "au"],
      ["audio/x-gsm", ["gsd", "gsm"]],
      ["audio/x-jam", "jam"],
      ["audio/x-liveaudio", "lam"],
      ["audio/x-mid", ["mid", "midi"]],
      ["audio/x-midi", ["midi", "mid"]],
      ["audio/x-mod", "mod"],
      ["audio/x-mpeg", "mp2"],
      ["audio/x-mpeg-3", "mp3"],
      ["audio/x-mpegurl", "m3u"],
      ["audio/x-mpequrl", "m3u"],
      ["audio/x-ms-wax", "wax"],
      ["audio/x-ms-wma", "wma"],
      ["audio/x-nspaudio", ["la", "lma"]],
      ["audio/x-pn-realaudio", ["ra", "ram", "rm", "rmm", "rmp"]],
      ["audio/x-pn-realaudio-plugin", ["ra", "rmp", "rpm"]],
      ["audio/x-psid", "sid"],
      ["audio/x-realaudio", "ra"],
      ["audio/x-twinvq", "vqf"],
      ["audio/x-twinvq-plugin", ["vqe", "vql"]],
      ["audio/x-vnd.audioexplosion.mjuicemediafile", "mjf"],
      ["audio/x-voc", "voc"],
      ["audio/x-wav", "wav"],
      ["audio/xm", "xm"],
      ["chemical/x-cdx", "cdx"],
      ["chemical/x-cif", "cif"],
      ["chemical/x-cmdf", "cmdf"],
      ["chemical/x-cml", "cml"],
      ["chemical/x-csml", "csml"],
      ["chemical/x-pdb", ["pdb", "xyz"]],
      ["chemical/x-xyz", "xyz"],
      ["drawing/x-dwf", "dwf"],
      ["i-world/i-vrml", "ivr"],
      ["image/bmp", ["bmp", "bm"]],
      ["image/cgm", "cgm"],
      ["image/cis-cod", "cod"],
      ["image/cmu-raster", ["ras", "rast"]],
      ["image/fif", "fif"],
      ["image/florian", ["flo", "turbot"]],
      ["image/g3fax", "g3"],
      ["image/gif", "gif"],
      ["image/ief", ["ief", "iefs"]],
      ["image/jpeg", ["jpeg", "jpe", "jpg", "jfif", "jfif-tbnl"]],
      ["image/jutvision", "jut"],
      ["image/ktx", "ktx"],
      ["image/naplps", ["nap", "naplps"]],
      ["image/pict", ["pic", "pict"]],
      ["image/pipeg", "jfif"],
      ["image/pjpeg", ["jfif", "jpe", "jpeg", "jpg"]],
      ["image/png", ["png", "x-png"]],
      ["image/prs.btif", "btif"],
      ["image/svg+xml", "svg"],
      ["image/tiff", ["tif", "tiff"]],
      ["image/vasa", "mcf"],
      ["image/vnd.adobe.photoshop", "psd"],
      ["image/vnd.dece.graphic", "uvi"],
      ["image/vnd.djvu", "djvu"],
      ["image/vnd.dvb.subtitle", "sub"],
      ["image/vnd.dwg", ["dwg", "dxf", "svf"]],
      ["image/vnd.dxf", "dxf"],
      ["image/vnd.fastbidsheet", "fbs"],
      ["image/vnd.fpx", "fpx"],
      ["image/vnd.fst", "fst"],
      ["image/vnd.fujixerox.edmics-mmr", "mmr"],
      ["image/vnd.fujixerox.edmics-rlc", "rlc"],
      ["image/vnd.ms-modi", "mdi"],
      ["image/vnd.net-fpx", ["fpx", "npx"]],
      ["image/vnd.rn-realflash", "rf"],
      ["image/vnd.rn-realpix", "rp"],
      ["image/vnd.wap.wbmp", "wbmp"],
      ["image/vnd.xiff", "xif"],
      ["image/webp", "webp"],
      ["image/x-cmu-raster", "ras"],
      ["image/x-cmx", "cmx"],
      ["image/x-dwg", ["dwg", "dxf", "svf"]],
      ["image/x-freehand", "fh"],
      ["image/x-icon", "ico"],
      ["image/x-jg", "art"],
      ["image/x-jps", "jps"],
      ["image/x-niff", ["niff", "nif"]],
      ["image/x-pcx", "pcx"],
      ["image/x-pict", ["pct", "pic"]],
      ["image/x-portable-anymap", "pnm"],
      ["image/x-portable-bitmap", "pbm"],
      ["image/x-portable-graymap", "pgm"],
      ["image/x-portable-greymap", "pgm"],
      ["image/x-portable-pixmap", "ppm"],
      ["image/x-quicktime", ["qif", "qti", "qtif"]],
      ["image/x-rgb", "rgb"],
      ["image/x-tiff", ["tif", "tiff"]],
      ["image/x-windows-bmp", "bmp"],
      ["image/x-xbitmap", "xbm"],
      ["image/x-xbm", "xbm"],
      ["image/x-xpixmap", ["xpm", "pm"]],
      ["image/x-xwd", "xwd"],
      ["image/x-xwindowdump", "xwd"],
      ["image/xbm", "xbm"],
      ["image/xpm", "xpm"],
      ["message/rfc822", ["eml", "mht", "mhtml", "nws", "mime"]],
      ["model/iges", ["iges", "igs"]],
      ["model/mesh", "msh"],
      ["model/vnd.collada+xml", "dae"],
      ["model/vnd.dwf", "dwf"],
      ["model/vnd.gdl", "gdl"],
      ["model/vnd.gtw", "gtw"],
      ["model/vnd.mts", "mts"],
      ["model/vnd.vtu", "vtu"],
      ["model/vrml", ["vrml", "wrl", "wrz"]],
      ["model/x-pov", "pov"],
      ["multipart/x-gzip", "gzip"],
      ["multipart/x-ustar", "ustar"],
      ["multipart/x-zip", "zip"],
      ["music/crescendo", ["mid", "midi"]],
      ["music/x-karaoke", "kar"],
      ["paleovu/x-pv", "pvu"],
      ["text/asp", "asp"],
      ["text/calendar", "ics"],
      ["text/css", "css"],
      ["text/csv", "csv"],
      ["text/ecmascript", "js"],
      ["text/h323", "323"],
      ["text/html", ["html", "htm", "stm", "acgi", "htmls", "htx", "shtml"]],
      ["text/iuls", "uls"],
      ["text/javascript", "js"],
      ["text/mcf", "mcf"],
      ["text/n3", "n3"],
      ["text/pascal", "pas"],
      [
        "text/plain",
        [
          "txt",
          "bas",
          "c",
          "h",
          "c++",
          "cc",
          "com",
          "conf",
          "cxx",
          "def",
          "f",
          "f90",
          "for",
          "g",
          "hh",
          "idc",
          "jav",
          "java",
          "list",
          "log",
          "lst",
          "m",
          "mar",
          "pl",
          "sdml",
          "text"
        ]
      ],
      ["text/plain-bas", "par"],
      ["text/prs.lines.tag", "dsc"],
      ["text/richtext", ["rtx", "rt", "rtf"]],
      ["text/scriplet", "wsc"],
      ["text/scriptlet", "sct"],
      ["text/sgml", ["sgm", "sgml"]],
      ["text/tab-separated-values", "tsv"],
      ["text/troff", "t"],
      ["text/turtle", "ttl"],
      ["text/uri-list", ["uni", "unis", "uri", "uris"]],
      ["text/vnd.abc", "abc"],
      ["text/vnd.curl", "curl"],
      ["text/vnd.curl.dcurl", "dcurl"],
      ["text/vnd.curl.mcurl", "mcurl"],
      ["text/vnd.curl.scurl", "scurl"],
      ["text/vnd.fly", "fly"],
      ["text/vnd.fmi.flexstor", "flx"],
      ["text/vnd.graphviz", "gv"],
      ["text/vnd.in3d.3dml", "3dml"],
      ["text/vnd.in3d.spot", "spot"],
      ["text/vnd.rn-realtext", "rt"],
      ["text/vnd.sun.j2me.app-descriptor", "jad"],
      ["text/vnd.wap.wml", "wml"],
      ["text/vnd.wap.wmlscript", "wmls"],
      ["text/webviewhtml", "htt"],
      ["text/x-asm", ["asm", "s"]],
      ["text/x-audiosoft-intra", "aip"],
      ["text/x-c", ["c", "cc", "cpp"]],
      ["text/x-component", "htc"],
      ["text/x-fortran", ["for", "f", "f77", "f90"]],
      ["text/x-h", ["h", "hh"]],
      ["text/x-java-source", ["java", "jav"]],
      ["text/x-java-source,java", "java"],
      ["text/x-la-asf", "lsx"],
      ["text/x-m", "m"],
      ["text/x-pascal", "p"],
      ["text/x-script", "hlb"],
      ["text/x-script.csh", "csh"],
      ["text/x-script.elisp", "el"],
      ["text/x-script.guile", "scm"],
      ["text/x-script.ksh", "ksh"],
      ["text/x-script.lisp", "lsp"],
      ["text/x-script.perl", "pl"],
      ["text/x-script.perl-module", "pm"],
      ["text/x-script.phyton", "py"],
      ["text/x-script.rexx", "rexx"],
      ["text/x-script.scheme", "scm"],
      ["text/x-script.sh", "sh"],
      ["text/x-script.tcl", "tcl"],
      ["text/x-script.tcsh", "tcsh"],
      ["text/x-script.zsh", "zsh"],
      ["text/x-server-parsed-html", ["shtml", "ssi"]],
      ["text/x-setext", "etx"],
      ["text/x-sgml", ["sgm", "sgml"]],
      ["text/x-speech", ["spc", "talk"]],
      ["text/x-uil", "uil"],
      ["text/x-uuencode", ["uu", "uue"]],
      ["text/x-vcalendar", "vcs"],
      ["text/x-vcard", "vcf"],
      ["text/xml", "xml"],
      ["video/3gpp", "3gp"],
      ["video/3gpp2", "3g2"],
      ["video/animaflex", "afl"],
      ["video/avi", "avi"],
      ["video/avs-video", "avs"],
      ["video/dl", "dl"],
      ["video/fli", "fli"],
      ["video/gl", "gl"],
      ["video/h261", "h261"],
      ["video/h263", "h263"],
      ["video/h264", "h264"],
      ["video/jpeg", "jpgv"],
      ["video/jpm", "jpm"],
      ["video/mj2", "mj2"],
      ["video/mp4", "mp4"],
      ["video/mpeg", ["mpeg", "mp2", "mpa", "mpe", "mpg", "mpv2", "m1v", "m2v", "mp3"]],
      ["video/msvideo", "avi"],
      ["video/ogg", "ogv"],
      ["video/quicktime", ["mov", "qt", "moov"]],
      ["video/vdo", "vdo"],
      ["video/vivo", ["viv", "vivo"]],
      ["video/vnd.dece.hd", "uvh"],
      ["video/vnd.dece.mobile", "uvm"],
      ["video/vnd.dece.pd", "uvp"],
      ["video/vnd.dece.sd", "uvs"],
      ["video/vnd.dece.video", "uvv"],
      ["video/vnd.fvt", "fvt"],
      ["video/vnd.mpegurl", "mxu"],
      ["video/vnd.ms-playready.media.pyv", "pyv"],
      ["video/vnd.rn-realvideo", "rv"],
      ["video/vnd.uvvu.mp4", "uvu"],
      ["video/vnd.vivo", ["viv", "vivo"]],
      ["video/vosaic", "vos"],
      ["video/webm", "webm"],
      ["video/x-amt-demorun", "xdr"],
      ["video/x-amt-showrun", "xsr"],
      ["video/x-atomic3d-feature", "fmf"],
      ["video/x-dl", "dl"],
      ["video/x-dv", ["dif", "dv"]],
      ["video/x-f4v", "f4v"],
      ["video/x-fli", "fli"],
      ["video/x-flv", "flv"],
      ["video/x-gl", "gl"],
      ["video/x-isvideo", "isu"],
      ["video/x-la-asf", ["lsf", "lsx"]],
      ["video/x-m4v", "m4v"],
      ["video/x-motion-jpeg", "mjpg"],
      ["video/x-mpeg", ["mp3", "mp2"]],
      ["video/x-mpeq2a", "mp2"],
      ["video/x-ms-asf", ["asf", "asr", "asx"]],
      ["video/x-ms-asf-plugin", "asx"],
      ["video/x-ms-wm", "wm"],
      ["video/x-ms-wmv", "wmv"],
      ["video/x-ms-wmx", "wmx"],
      ["video/x-ms-wvx", "wvx"],
      ["video/x-msvideo", "avi"],
      ["video/x-qtc", "qtc"],
      ["video/x-scm", "scm"],
      ["video/x-sgi-movie", ["movie", "mv"]],
      ["windows/metafile", "wmf"],
      ["www/mime", "mime"],
      ["x-conference/x-cooltalk", "ice"],
      ["x-music/x-midi", ["mid", "midi"]],
      ["x-world/x-3dmf", ["3dm", "3dmf", "qd3", "qd3d"]],
      ["x-world/x-svr", "svr"],
      ["x-world/x-vrml", ["flr", "vrml", "wrl", "wrz", "xaf", "xof"]],
      ["x-world/x-vrt", "vrt"],
      ["xgl/drawing", "xgz"],
      ["xgl/movie", "xmz"]
    ]), extensions = /* @__PURE__ */ new Map([
      ["123", "application/vnd.lotus-1-2-3"],
      ["323", "text/h323"],
      ["*", "application/octet-stream"],
      ["3dm", "x-world/x-3dmf"],
      ["3dmf", "x-world/x-3dmf"],
      ["3dml", "text/vnd.in3d.3dml"],
      ["3g2", "video/3gpp2"],
      ["3gp", "video/3gpp"],
      ["7z", "application/x-7z-compressed"],
      ["a", "application/octet-stream"],
      ["aab", "application/x-authorware-bin"],
      ["aac", "audio/x-aac"],
      ["aam", "application/x-authorware-map"],
      ["aas", "application/x-authorware-seg"],
      ["abc", "text/vnd.abc"],
      ["abw", "application/x-abiword"],
      ["ac", "application/pkix-attr-cert"],
      ["acc", "application/vnd.americandynamics.acc"],
      ["ace", "application/x-ace-compressed"],
      ["acgi", "text/html"],
      ["acu", "application/vnd.acucobol"],
      ["acx", "application/internet-property-stream"],
      ["adp", "audio/adpcm"],
      ["aep", "application/vnd.audiograph"],
      ["afl", "video/animaflex"],
      ["afp", "application/vnd.ibm.modcap"],
      ["ahead", "application/vnd.ahead.space"],
      ["ai", "application/postscript"],
      ["aif", ["audio/aiff", "audio/x-aiff"]],
      ["aifc", ["audio/aiff", "audio/x-aiff"]],
      ["aiff", ["audio/aiff", "audio/x-aiff"]],
      ["aim", "application/x-aim"],
      ["aip", "text/x-audiosoft-intra"],
      ["air", "application/vnd.adobe.air-application-installer-package+zip"],
      ["ait", "application/vnd.dvb.ait"],
      ["ami", "application/vnd.amiga.ami"],
      ["ani", "application/x-navi-animation"],
      ["aos", "application/x-nokia-9000-communicator-add-on-software"],
      ["apk", "application/vnd.android.package-archive"],
      ["application", "application/x-ms-application"],
      ["apr", "application/vnd.lotus-approach"],
      ["aps", "application/mime"],
      ["arc", "application/octet-stream"],
      ["arj", ["application/arj", "application/octet-stream"]],
      ["art", "image/x-jg"],
      ["asf", "video/x-ms-asf"],
      ["asm", "text/x-asm"],
      ["aso", "application/vnd.accpac.simply.aso"],
      ["asp", "text/asp"],
      ["asr", "video/x-ms-asf"],
      ["asx", ["video/x-ms-asf", "application/x-mplayer2", "video/x-ms-asf-plugin"]],
      ["atc", "application/vnd.acucorp"],
      ["atomcat", "application/atomcat+xml"],
      ["atomsvc", "application/atomsvc+xml"],
      ["atx", "application/vnd.antix.game-component"],
      ["au", ["audio/basic", "audio/x-au"]],
      ["avi", ["video/avi", "video/msvideo", "application/x-troff-msvideo", "video/x-msvideo"]],
      ["avs", "video/avs-video"],
      ["aw", "application/applixware"],
      ["axs", "application/olescript"],
      ["azf", "application/vnd.airzip.filesecure.azf"],
      ["azs", "application/vnd.airzip.filesecure.azs"],
      ["azw", "application/vnd.amazon.ebook"],
      ["bas", "text/plain"],
      ["bcpio", "application/x-bcpio"],
      ["bdf", "application/x-font-bdf"],
      ["bdm", "application/vnd.syncml.dm+wbxml"],
      ["bed", "application/vnd.realvnc.bed"],
      ["bh2", "application/vnd.fujitsu.oasysprs"],
      ["bin", ["application/octet-stream", "application/mac-binary", "application/macbinary", "application/x-macbinary", "application/x-binary"]],
      ["bm", "image/bmp"],
      ["bmi", "application/vnd.bmi"],
      ["bmp", ["image/bmp", "image/x-windows-bmp"]],
      ["boo", "application/book"],
      ["book", "application/book"],
      ["box", "application/vnd.previewsystems.box"],
      ["boz", "application/x-bzip2"],
      ["bsh", "application/x-bsh"],
      ["btif", "image/prs.btif"],
      ["bz", "application/x-bzip"],
      ["bz2", "application/x-bzip2"],
      ["c", ["text/plain", "text/x-c"]],
      ["c++", "text/plain"],
      ["c11amc", "application/vnd.cluetrust.cartomobile-config"],
      ["c11amz", "application/vnd.cluetrust.cartomobile-config-pkg"],
      ["c4g", "application/vnd.clonk.c4group"],
      ["cab", "application/vnd.ms-cab-compressed"],
      ["car", "application/vnd.curl.car"],
      ["cat", ["application/vnd.ms-pkiseccat", "application/vnd.ms-pki.seccat"]],
      ["cc", ["text/plain", "text/x-c"]],
      ["ccad", "application/clariscad"],
      ["cco", "application/x-cocoa"],
      ["ccxml", "application/ccxml+xml,"],
      ["cdbcmsg", "application/vnd.contact.cmsg"],
      ["cdf", ["application/cdf", "application/x-cdf", "application/x-netcdf"]],
      ["cdkey", "application/vnd.mediastation.cdkey"],
      ["cdmia", "application/cdmi-capability"],
      ["cdmic", "application/cdmi-container"],
      ["cdmid", "application/cdmi-domain"],
      ["cdmio", "application/cdmi-object"],
      ["cdmiq", "application/cdmi-queue"],
      ["cdx", "chemical/x-cdx"],
      ["cdxml", "application/vnd.chemdraw+xml"],
      ["cdy", "application/vnd.cinderella"],
      ["cer", ["application/pkix-cert", "application/x-x509-ca-cert"]],
      ["cgm", "image/cgm"],
      ["cha", "application/x-chat"],
      ["chat", "application/x-chat"],
      ["chm", "application/vnd.ms-htmlhelp"],
      ["chrt", "application/vnd.kde.kchart"],
      ["cif", "chemical/x-cif"],
      ["cii", "application/vnd.anser-web-certificate-issue-initiation"],
      ["cil", "application/vnd.ms-artgalry"],
      ["cla", "application/vnd.claymore"],
      ["class", ["application/octet-stream", "application/java", "application/java-byte-code", "application/java-vm", "application/x-java-class"]],
      ["clkk", "application/vnd.crick.clicker.keyboard"],
      ["clkp", "application/vnd.crick.clicker.palette"],
      ["clkt", "application/vnd.crick.clicker.template"],
      ["clkw", "application/vnd.crick.clicker.wordbank"],
      ["clkx", "application/vnd.crick.clicker"],
      ["clp", "application/x-msclip"],
      ["cmc", "application/vnd.cosmocaller"],
      ["cmdf", "chemical/x-cmdf"],
      ["cml", "chemical/x-cml"],
      ["cmp", "application/vnd.yellowriver-custom-menu"],
      ["cmx", "image/x-cmx"],
      ["cod", ["image/cis-cod", "application/vnd.rim.cod"]],
      ["com", ["application/octet-stream", "text/plain"]],
      ["conf", "text/plain"],
      ["cpio", "application/x-cpio"],
      ["cpp", "text/x-c"],
      ["cpt", ["application/mac-compactpro", "application/x-compactpro", "application/x-cpt"]],
      ["crd", "application/x-mscardfile"],
      ["crl", ["application/pkix-crl", "application/pkcs-crl"]],
      ["crt", ["application/pkix-cert", "application/x-x509-user-cert", "application/x-x509-ca-cert"]],
      ["cryptonote", "application/vnd.rig.cryptonote"],
      ["csh", ["text/x-script.csh", "application/x-csh"]],
      ["csml", "chemical/x-csml"],
      ["csp", "application/vnd.commonspace"],
      ["css", ["text/css", "application/x-pointplus"]],
      ["csv", "text/csv"],
      ["cu", "application/cu-seeme"],
      ["curl", "text/vnd.curl"],
      ["cww", "application/prs.cww"],
      ["cxx", "text/plain"],
      ["dae", "model/vnd.collada+xml"],
      ["daf", "application/vnd.mobius.daf"],
      ["davmount", "application/davmount+xml"],
      ["dcr", "application/x-director"],
      ["dcurl", "text/vnd.curl.dcurl"],
      ["dd2", "application/vnd.oma.dd2+xml"],
      ["ddd", "application/vnd.fujixerox.ddd"],
      ["deb", "application/x-debian-package"],
      ["deepv", "application/x-deepv"],
      ["def", "text/plain"],
      ["der", "application/x-x509-ca-cert"],
      ["dfac", "application/vnd.dreamfactory"],
      ["dif", "video/x-dv"],
      ["dir", "application/x-director"],
      ["dis", "application/vnd.mobius.dis"],
      ["djvu", "image/vnd.djvu"],
      ["dl", ["video/dl", "video/x-dl"]],
      ["dll", "application/x-msdownload"],
      ["dms", "application/octet-stream"],
      ["dna", "application/vnd.dna"],
      ["doc", "application/msword"],
      ["docm", "application/vnd.ms-word.document.macroenabled.12"],
      ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      ["dot", "application/msword"],
      ["dotm", "application/vnd.ms-word.template.macroenabled.12"],
      ["dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template"],
      ["dp", ["application/commonground", "application/vnd.osgi.dp"]],
      ["dpg", "application/vnd.dpgraph"],
      ["dra", "audio/vnd.dra"],
      ["drw", "application/drafting"],
      ["dsc", "text/prs.lines.tag"],
      ["dssc", "application/dssc+der"],
      ["dtb", "application/x-dtbook+xml"],
      ["dtd", "application/xml-dtd"],
      ["dts", "audio/vnd.dts"],
      ["dtshd", "audio/vnd.dts.hd"],
      ["dump", "application/octet-stream"],
      ["dv", "video/x-dv"],
      ["dvi", "application/x-dvi"],
      ["dwf", ["model/vnd.dwf", "drawing/x-dwf"]],
      ["dwg", ["application/acad", "image/vnd.dwg", "image/x-dwg"]],
      ["dxf", ["application/dxf", "image/vnd.dwg", "image/vnd.dxf", "image/x-dwg"]],
      ["dxp", "application/vnd.spotfire.dxp"],
      ["dxr", "application/x-director"],
      ["ecelp4800", "audio/vnd.nuera.ecelp4800"],
      ["ecelp7470", "audio/vnd.nuera.ecelp7470"],
      ["ecelp9600", "audio/vnd.nuera.ecelp9600"],
      ["edm", "application/vnd.novadigm.edm"],
      ["edx", "application/vnd.novadigm.edx"],
      ["efif", "application/vnd.picsel"],
      ["ei6", "application/vnd.pg.osasli"],
      ["el", "text/x-script.elisp"],
      ["elc", ["application/x-elc", "application/x-bytecode.elisp"]],
      ["eml", "message/rfc822"],
      ["emma", "application/emma+xml"],
      ["env", "application/x-envoy"],
      ["eol", "audio/vnd.digital-winds"],
      ["eot", "application/vnd.ms-fontobject"],
      ["eps", "application/postscript"],
      ["epub", "application/epub+zip"],
      ["es", ["application/ecmascript", "application/x-esrehber"]],
      ["es3", "application/vnd.eszigno3+xml"],
      ["esf", "application/vnd.epson.esf"],
      ["etx", "text/x-setext"],
      ["evy", ["application/envoy", "application/x-envoy"]],
      ["exe", ["application/octet-stream", "application/x-msdownload"]],
      ["exi", "application/exi"],
      ["ext", "application/vnd.novadigm.ext"],
      ["ez2", "application/vnd.ezpix-album"],
      ["ez3", "application/vnd.ezpix-package"],
      ["f", ["text/plain", "text/x-fortran"]],
      ["f4v", "video/x-f4v"],
      ["f77", "text/x-fortran"],
      ["f90", ["text/plain", "text/x-fortran"]],
      ["fbs", "image/vnd.fastbidsheet"],
      ["fcs", "application/vnd.isac.fcs"],
      ["fdf", "application/vnd.fdf"],
      ["fe_launch", "application/vnd.denovo.fcselayout-link"],
      ["fg5", "application/vnd.fujitsu.oasysgp"],
      ["fh", "image/x-freehand"],
      ["fif", ["application/fractals", "image/fif"]],
      ["fig", "application/x-xfig"],
      ["fli", ["video/fli", "video/x-fli"]],
      ["flo", ["image/florian", "application/vnd.micrografx.flo"]],
      ["flr", "x-world/x-vrml"],
      ["flv", "video/x-flv"],
      ["flw", "application/vnd.kde.kivio"],
      ["flx", "text/vnd.fmi.flexstor"],
      ["fly", "text/vnd.fly"],
      ["fm", "application/vnd.framemaker"],
      ["fmf", "video/x-atomic3d-feature"],
      ["fnc", "application/vnd.frogans.fnc"],
      ["for", ["text/plain", "text/x-fortran"]],
      ["fpx", ["image/vnd.fpx", "image/vnd.net-fpx"]],
      ["frl", "application/freeloader"],
      ["fsc", "application/vnd.fsc.weblaunch"],
      ["fst", "image/vnd.fst"],
      ["ftc", "application/vnd.fluxtime.clip"],
      ["fti", "application/vnd.anser-web-funds-transfer-initiation"],
      ["funk", "audio/make"],
      ["fvt", "video/vnd.fvt"],
      ["fxp", "application/vnd.adobe.fxp"],
      ["fzs", "application/vnd.fuzzysheet"],
      ["g", "text/plain"],
      ["g2w", "application/vnd.geoplan"],
      ["g3", "image/g3fax"],
      ["g3w", "application/vnd.geospace"],
      ["gac", "application/vnd.groove-account"],
      ["gdl", "model/vnd.gdl"],
      ["geo", "application/vnd.dynageo"],
      ["geojson", "application/geo+json"],
      ["gex", "application/vnd.geometry-explorer"],
      ["ggb", "application/vnd.geogebra.file"],
      ["ggt", "application/vnd.geogebra.tool"],
      ["ghf", "application/vnd.groove-help"],
      ["gif", "image/gif"],
      ["gim", "application/vnd.groove-identity-message"],
      ["gl", ["video/gl", "video/x-gl"]],
      ["gmx", "application/vnd.gmx"],
      ["gnumeric", "application/x-gnumeric"],
      ["gph", "application/vnd.flographit"],
      ["gqf", "application/vnd.grafeq"],
      ["gram", "application/srgs"],
      ["grv", "application/vnd.groove-injector"],
      ["grxml", "application/srgs+xml"],
      ["gsd", "audio/x-gsm"],
      ["gsf", "application/x-font-ghostscript"],
      ["gsm", "audio/x-gsm"],
      ["gsp", "application/x-gsp"],
      ["gss", "application/x-gss"],
      ["gtar", "application/x-gtar"],
      ["gtm", "application/vnd.groove-tool-message"],
      ["gtw", "model/vnd.gtw"],
      ["gv", "text/vnd.graphviz"],
      ["gxt", "application/vnd.geonext"],
      ["gz", ["application/x-gzip", "application/x-compressed"]],
      ["gzip", ["multipart/x-gzip", "application/x-gzip"]],
      ["h", ["text/plain", "text/x-h"]],
      ["h261", "video/h261"],
      ["h263", "video/h263"],
      ["h264", "video/h264"],
      ["hal", "application/vnd.hal+xml"],
      ["hbci", "application/vnd.hbci"],
      ["hdf", "application/x-hdf"],
      ["help", "application/x-helpfile"],
      ["hgl", "application/vnd.hp-hpgl"],
      ["hh", ["text/plain", "text/x-h"]],
      ["hlb", "text/x-script"],
      ["hlp", ["application/winhlp", "application/hlp", "application/x-helpfile", "application/x-winhelp"]],
      ["hpg", "application/vnd.hp-hpgl"],
      ["hpgl", "application/vnd.hp-hpgl"],
      ["hpid", "application/vnd.hp-hpid"],
      ["hps", "application/vnd.hp-hps"],
      [
        "hqx",
        [
          "application/mac-binhex40",
          "application/binhex",
          "application/binhex4",
          "application/mac-binhex",
          "application/x-binhex40",
          "application/x-mac-binhex40"
        ]
      ],
      ["hta", "application/hta"],
      ["htc", "text/x-component"],
      ["htke", "application/vnd.kenameaapp"],
      ["htm", "text/html"],
      ["html", "text/html"],
      ["htmls", "text/html"],
      ["htt", "text/webviewhtml"],
      ["htx", "text/html"],
      ["hvd", "application/vnd.yamaha.hv-dic"],
      ["hvp", "application/vnd.yamaha.hv-voice"],
      ["hvs", "application/vnd.yamaha.hv-script"],
      ["i2g", "application/vnd.intergeo"],
      ["icc", "application/vnd.iccprofile"],
      ["ice", "x-conference/x-cooltalk"],
      ["ico", "image/x-icon"],
      ["ics", "text/calendar"],
      ["idc", "text/plain"],
      ["ief", "image/ief"],
      ["iefs", "image/ief"],
      ["ifm", "application/vnd.shana.informed.formdata"],
      ["iges", ["application/iges", "model/iges"]],
      ["igl", "application/vnd.igloader"],
      ["igm", "application/vnd.insors.igm"],
      ["igs", ["application/iges", "model/iges"]],
      ["igx", "application/vnd.micrografx.igx"],
      ["iif", "application/vnd.shana.informed.interchange"],
      ["iii", "application/x-iphone"],
      ["ima", "application/x-ima"],
      ["imap", "application/x-httpd-imap"],
      ["imp", "application/vnd.accpac.simply.imp"],
      ["ims", "application/vnd.ms-ims"],
      ["inf", "application/inf"],
      ["ins", ["application/x-internet-signup", "application/x-internett-signup"]],
      ["ip", "application/x-ip2"],
      ["ipfix", "application/ipfix"],
      ["ipk", "application/vnd.shana.informed.package"],
      ["irm", "application/vnd.ibm.rights-management"],
      ["irp", "application/vnd.irepository.package+xml"],
      ["isp", "application/x-internet-signup"],
      ["isu", "video/x-isvideo"],
      ["it", "audio/it"],
      ["itp", "application/vnd.shana.informed.formtemplate"],
      ["iv", "application/x-inventor"],
      ["ivp", "application/vnd.immervision-ivp"],
      ["ivr", "i-world/i-vrml"],
      ["ivu", "application/vnd.immervision-ivu"],
      ["ivy", "application/x-livescreen"],
      ["jad", "text/vnd.sun.j2me.app-descriptor"],
      ["jam", ["application/vnd.jam", "audio/x-jam"]],
      ["jar", "application/java-archive"],
      ["jav", ["text/plain", "text/x-java-source"]],
      ["java", ["text/plain", "text/x-java-source,java", "text/x-java-source"]],
      ["jcm", "application/x-java-commerce"],
      ["jfif", ["image/pipeg", "image/jpeg", "image/pjpeg"]],
      ["jfif-tbnl", "image/jpeg"],
      ["jisp", "application/vnd.jisp"],
      ["jlt", "application/vnd.hp-jlyt"],
      ["jnlp", "application/x-java-jnlp-file"],
      ["joda", "application/vnd.joost.joda-archive"],
      ["jpe", ["image/jpeg", "image/pjpeg"]],
      ["jpeg", ["image/jpeg", "image/pjpeg"]],
      ["jpg", ["image/jpeg", "image/pjpeg"]],
      ["jpgv", "video/jpeg"],
      ["jpm", "video/jpm"],
      ["jps", "image/x-jps"],
      ["js", ["application/javascript", "application/ecmascript", "text/javascript", "text/ecmascript", "application/x-javascript"]],
      ["json", "application/json"],
      ["jut", "image/jutvision"],
      ["kar", ["audio/midi", "music/x-karaoke"]],
      ["karbon", "application/vnd.kde.karbon"],
      ["kfo", "application/vnd.kde.kformula"],
      ["kia", "application/vnd.kidspiration"],
      ["kml", "application/vnd.google-earth.kml+xml"],
      ["kmz", "application/vnd.google-earth.kmz"],
      ["kne", "application/vnd.kinar"],
      ["kon", "application/vnd.kde.kontour"],
      ["kpr", "application/vnd.kde.kpresenter"],
      ["ksh", ["application/x-ksh", "text/x-script.ksh"]],
      ["ksp", "application/vnd.kde.kspread"],
      ["ktx", "image/ktx"],
      ["ktz", "application/vnd.kahootz"],
      ["kwd", "application/vnd.kde.kword"],
      ["la", ["audio/nspaudio", "audio/x-nspaudio"]],
      ["lam", "audio/x-liveaudio"],
      ["lasxml", "application/vnd.las.las+xml"],
      ["latex", "application/x-latex"],
      ["lbd", "application/vnd.llamagraphics.life-balance.desktop"],
      ["lbe", "application/vnd.llamagraphics.life-balance.exchange+xml"],
      ["les", "application/vnd.hhe.lesson-player"],
      ["lha", ["application/octet-stream", "application/lha", "application/x-lha"]],
      ["lhx", "application/octet-stream"],
      ["link66", "application/vnd.route66.link66+xml"],
      ["list", "text/plain"],
      ["lma", ["audio/nspaudio", "audio/x-nspaudio"]],
      ["log", "text/plain"],
      ["lrm", "application/vnd.ms-lrm"],
      ["lsf", "video/x-la-asf"],
      ["lsp", ["application/x-lisp", "text/x-script.lisp"]],
      ["lst", "text/plain"],
      ["lsx", ["video/x-la-asf", "text/x-la-asf"]],
      ["ltf", "application/vnd.frogans.ltf"],
      ["ltx", "application/x-latex"],
      ["lvp", "audio/vnd.lucent.voice"],
      ["lwp", "application/vnd.lotus-wordpro"],
      ["lzh", ["application/octet-stream", "application/x-lzh"]],
      ["lzx", ["application/lzx", "application/octet-stream", "application/x-lzx"]],
      ["m", ["text/plain", "text/x-m"]],
      ["m13", "application/x-msmediaview"],
      ["m14", "application/x-msmediaview"],
      ["m1v", "video/mpeg"],
      ["m21", "application/mp21"],
      ["m2a", "audio/mpeg"],
      ["m2v", "video/mpeg"],
      ["m3u", ["audio/x-mpegurl", "audio/x-mpequrl"]],
      ["m3u8", "application/vnd.apple.mpegurl"],
      ["m4v", "video/x-m4v"],
      ["ma", "application/mathematica"],
      ["mads", "application/mads+xml"],
      ["mag", "application/vnd.ecowin.chart"],
      ["man", "application/x-troff-man"],
      ["map", "application/x-navimap"],
      ["mar", "text/plain"],
      ["mathml", "application/mathml+xml"],
      ["mbd", "application/mbedlet"],
      ["mbk", "application/vnd.mobius.mbk"],
      ["mbox", "application/mbox"],
      ["mc$", "application/x-magic-cap-package-1.0"],
      ["mc1", "application/vnd.medcalcdata"],
      ["mcd", ["application/mcad", "application/vnd.mcd", "application/x-mathcad"]],
      ["mcf", ["image/vasa", "text/mcf"]],
      ["mcp", "application/netmc"],
      ["mcurl", "text/vnd.curl.mcurl"],
      ["mdb", "application/x-msaccess"],
      ["mdi", "image/vnd.ms-modi"],
      ["me", "application/x-troff-me"],
      ["meta4", "application/metalink4+xml"],
      ["mets", "application/mets+xml"],
      ["mfm", "application/vnd.mfmp"],
      ["mgp", "application/vnd.osgeo.mapguide.package"],
      ["mgz", "application/vnd.proteus.magazine"],
      ["mht", "message/rfc822"],
      ["mhtml", "message/rfc822"],
      ["mid", ["audio/mid", "audio/midi", "music/crescendo", "x-music/x-midi", "audio/x-midi", "application/x-midi", "audio/x-mid"]],
      ["midi", ["audio/midi", "music/crescendo", "x-music/x-midi", "audio/x-midi", "application/x-midi", "audio/x-mid"]],
      ["mif", ["application/vnd.mif", "application/x-mif", "application/x-frame"]],
      ["mime", ["message/rfc822", "www/mime"]],
      ["mj2", "video/mj2"],
      ["mjf", "audio/x-vnd.audioexplosion.mjuicemediafile"],
      ["mjpg", "video/x-motion-jpeg"],
      ["mlp", "application/vnd.dolby.mlp"],
      ["mm", ["application/base64", "application/x-meme"]],
      ["mmd", "application/vnd.chipnuts.karaoke-mmd"],
      ["mme", "application/base64"],
      ["mmf", "application/vnd.smaf"],
      ["mmr", "image/vnd.fujixerox.edmics-mmr"],
      ["mny", "application/x-msmoney"],
      ["mod", ["audio/mod", "audio/x-mod"]],
      ["mods", "application/mods+xml"],
      ["moov", "video/quicktime"],
      ["mov", "video/quicktime"],
      ["movie", "video/x-sgi-movie"],
      ["mp2", ["video/mpeg", "audio/mpeg", "video/x-mpeg", "audio/x-mpeg", "video/x-mpeq2a"]],
      ["mp3", ["audio/mpeg", "audio/mpeg3", "video/mpeg", "audio/x-mpeg-3", "video/x-mpeg"]],
      ["mp4", ["video/mp4", "application/mp4"]],
      ["mp4a", "audio/mp4"],
      ["mpa", ["video/mpeg", "audio/mpeg"]],
      ["mpc", ["application/vnd.mophun.certificate", "application/x-project"]],
      ["mpe", "video/mpeg"],
      ["mpeg", "video/mpeg"],
      ["mpg", ["video/mpeg", "audio/mpeg"]],
      ["mpga", "audio/mpeg"],
      ["mpkg", "application/vnd.apple.installer+xml"],
      ["mpm", "application/vnd.blueice.multipass"],
      ["mpn", "application/vnd.mophun.application"],
      ["mpp", "application/vnd.ms-project"],
      ["mpt", "application/x-project"],
      ["mpv", "application/x-project"],
      ["mpv2", "video/mpeg"],
      ["mpx", "application/x-project"],
      ["mpy", "application/vnd.ibm.minipay"],
      ["mqy", "application/vnd.mobius.mqy"],
      ["mrc", "application/marc"],
      ["mrcx", "application/marcxml+xml"],
      ["ms", "application/x-troff-ms"],
      ["mscml", "application/mediaservercontrol+xml"],
      ["mseq", "application/vnd.mseq"],
      ["msf", "application/vnd.epson.msf"],
      ["msg", "application/vnd.ms-outlook"],
      ["msh", "model/mesh"],
      ["msl", "application/vnd.mobius.msl"],
      ["msty", "application/vnd.muvee.style"],
      ["mts", "model/vnd.mts"],
      ["mus", "application/vnd.musician"],
      ["musicxml", "application/vnd.recordare.musicxml+xml"],
      ["mv", "video/x-sgi-movie"],
      ["mvb", "application/x-msmediaview"],
      ["mwf", "application/vnd.mfer"],
      ["mxf", "application/mxf"],
      ["mxl", "application/vnd.recordare.musicxml"],
      ["mxml", "application/xv+xml"],
      ["mxs", "application/vnd.triscape.mxs"],
      ["mxu", "video/vnd.mpegurl"],
      ["my", "audio/make"],
      ["mzz", "application/x-vnd.audioexplosion.mzz"],
      ["n-gage", "application/vnd.nokia.n-gage.symbian.install"],
      ["n3", "text/n3"],
      ["nap", "image/naplps"],
      ["naplps", "image/naplps"],
      ["nbp", "application/vnd.wolfram.player"],
      ["nc", "application/x-netcdf"],
      ["ncm", "application/vnd.nokia.configuration-message"],
      ["ncx", "application/x-dtbncx+xml"],
      ["ngdat", "application/vnd.nokia.n-gage.data"],
      ["nif", "image/x-niff"],
      ["niff", "image/x-niff"],
      ["nix", "application/x-mix-transfer"],
      ["nlu", "application/vnd.neurolanguage.nlu"],
      ["nml", "application/vnd.enliven"],
      ["nnd", "application/vnd.noblenet-directory"],
      ["nns", "application/vnd.noblenet-sealer"],
      ["nnw", "application/vnd.noblenet-web"],
      ["npx", "image/vnd.net-fpx"],
      ["nsc", "application/x-conference"],
      ["nsf", "application/vnd.lotus-notes"],
      ["nvd", "application/x-navidoc"],
      ["nws", "message/rfc822"],
      ["o", "application/octet-stream"],
      ["oa2", "application/vnd.fujitsu.oasys2"],
      ["oa3", "application/vnd.fujitsu.oasys3"],
      ["oas", "application/vnd.fujitsu.oasys"],
      ["obd", "application/x-msbinder"],
      ["oda", "application/oda"],
      ["odb", "application/vnd.oasis.opendocument.database"],
      ["odc", "application/vnd.oasis.opendocument.chart"],
      ["odf", "application/vnd.oasis.opendocument.formula"],
      ["odft", "application/vnd.oasis.opendocument.formula-template"],
      ["odg", "application/vnd.oasis.opendocument.graphics"],
      ["odi", "application/vnd.oasis.opendocument.image"],
      ["odm", "application/vnd.oasis.opendocument.text-master"],
      ["odp", "application/vnd.oasis.opendocument.presentation"],
      ["ods", "application/vnd.oasis.opendocument.spreadsheet"],
      ["odt", "application/vnd.oasis.opendocument.text"],
      ["oga", "audio/ogg"],
      ["ogv", "video/ogg"],
      ["ogx", "application/ogg"],
      ["omc", "application/x-omc"],
      ["omcd", "application/x-omcdatamaker"],
      ["omcr", "application/x-omcregerator"],
      ["onetoc", "application/onenote"],
      ["opf", "application/oebps-package+xml"],
      ["org", "application/vnd.lotus-organizer"],
      ["osf", "application/vnd.yamaha.openscoreformat"],
      ["osfpvg", "application/vnd.yamaha.openscoreformat.osfpvg+xml"],
      ["otc", "application/vnd.oasis.opendocument.chart-template"],
      ["otf", "application/x-font-otf"],
      ["otg", "application/vnd.oasis.opendocument.graphics-template"],
      ["oth", "application/vnd.oasis.opendocument.text-web"],
      ["oti", "application/vnd.oasis.opendocument.image-template"],
      ["otp", "application/vnd.oasis.opendocument.presentation-template"],
      ["ots", "application/vnd.oasis.opendocument.spreadsheet-template"],
      ["ott", "application/vnd.oasis.opendocument.text-template"],
      ["oxt", "application/vnd.openofficeorg.extension"],
      ["p", "text/x-pascal"],
      ["p10", ["application/pkcs10", "application/x-pkcs10"]],
      ["p12", ["application/pkcs-12", "application/x-pkcs12"]],
      ["p7a", "application/x-pkcs7-signature"],
      ["p7b", "application/x-pkcs7-certificates"],
      ["p7c", ["application/pkcs7-mime", "application/x-pkcs7-mime"]],
      ["p7m", ["application/pkcs7-mime", "application/x-pkcs7-mime"]],
      ["p7r", "application/x-pkcs7-certreqresp"],
      ["p7s", ["application/pkcs7-signature", "application/x-pkcs7-signature"]],
      ["p8", "application/pkcs8"],
      ["par", "text/plain-bas"],
      ["part", "application/pro_eng"],
      ["pas", "text/pascal"],
      ["paw", "application/vnd.pawaafile"],
      ["pbd", "application/vnd.powerbuilder6"],
      ["pbm", "image/x-portable-bitmap"],
      ["pcf", "application/x-font-pcf"],
      ["pcl", ["application/vnd.hp-pcl", "application/x-pcl"]],
      ["pclxl", "application/vnd.hp-pclxl"],
      ["pct", "image/x-pict"],
      ["pcurl", "application/vnd.curl.pcurl"],
      ["pcx", "image/x-pcx"],
      ["pdb", ["application/vnd.palm", "chemical/x-pdb"]],
      ["pdf", "application/pdf"],
      ["pfa", "application/x-font-type1"],
      ["pfr", "application/font-tdpfr"],
      ["pfunk", ["audio/make", "audio/make.my.funk"]],
      ["pfx", "application/x-pkcs12"],
      ["pgm", ["image/x-portable-graymap", "image/x-portable-greymap"]],
      ["pgn", "application/x-chess-pgn"],
      ["pgp", "application/pgp-signature"],
      ["pic", ["image/pict", "image/x-pict"]],
      ["pict", "image/pict"],
      ["pkg", "application/x-newton-compatible-pkg"],
      ["pki", "application/pkixcmp"],
      ["pkipath", "application/pkix-pkipath"],
      ["pko", ["application/ynd.ms-pkipko", "application/vnd.ms-pki.pko"]],
      ["pl", ["text/plain", "text/x-script.perl"]],
      ["plb", "application/vnd.3gpp.pic-bw-large"],
      ["plc", "application/vnd.mobius.plc"],
      ["plf", "application/vnd.pocketlearn"],
      ["pls", "application/pls+xml"],
      ["plx", "application/x-pixclscript"],
      ["pm", ["text/x-script.perl-module", "image/x-xpixmap"]],
      ["pm4", "application/x-pagemaker"],
      ["pm5", "application/x-pagemaker"],
      ["pma", "application/x-perfmon"],
      ["pmc", "application/x-perfmon"],
      ["pml", ["application/vnd.ctc-posml", "application/x-perfmon"]],
      ["pmr", "application/x-perfmon"],
      ["pmw", "application/x-perfmon"],
      ["png", "image/png"],
      ["pnm", ["application/x-portable-anymap", "image/x-portable-anymap"]],
      ["portpkg", "application/vnd.macports.portpkg"],
      ["pot", ["application/vnd.ms-powerpoint", "application/mspowerpoint"]],
      ["potm", "application/vnd.ms-powerpoint.template.macroenabled.12"],
      ["potx", "application/vnd.openxmlformats-officedocument.presentationml.template"],
      ["pov", "model/x-pov"],
      ["ppa", "application/vnd.ms-powerpoint"],
      ["ppam", "application/vnd.ms-powerpoint.addin.macroenabled.12"],
      ["ppd", "application/vnd.cups-ppd"],
      ["ppm", "image/x-portable-pixmap"],
      ["pps", ["application/vnd.ms-powerpoint", "application/mspowerpoint"]],
      ["ppsm", "application/vnd.ms-powerpoint.slideshow.macroenabled.12"],
      ["ppsx", "application/vnd.openxmlformats-officedocument.presentationml.slideshow"],
      ["ppt", ["application/vnd.ms-powerpoint", "application/mspowerpoint", "application/powerpoint", "application/x-mspowerpoint"]],
      ["pptm", "application/vnd.ms-powerpoint.presentation.macroenabled.12"],
      ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
      ["ppz", "application/mspowerpoint"],
      ["prc", "application/x-mobipocket-ebook"],
      ["pre", ["application/vnd.lotus-freelance", "application/x-freelance"]],
      ["prf", "application/pics-rules"],
      ["prt", "application/pro_eng"],
      ["ps", "application/postscript"],
      ["psb", "application/vnd.3gpp.pic-bw-small"],
      ["psd", ["application/octet-stream", "image/vnd.adobe.photoshop"]],
      ["psf", "application/x-font-linux-psf"],
      ["pskcxml", "application/pskc+xml"],
      ["ptid", "application/vnd.pvi.ptid1"],
      ["pub", "application/x-mspublisher"],
      ["pvb", "application/vnd.3gpp.pic-bw-var"],
      ["pvu", "paleovu/x-pv"],
      ["pwn", "application/vnd.3m.post-it-notes"],
      ["pwz", "application/vnd.ms-powerpoint"],
      ["py", "text/x-script.phyton"],
      ["pya", "audio/vnd.ms-playready.media.pya"],
      ["pyc", "application/x-bytecode.python"],
      ["pyv", "video/vnd.ms-playready.media.pyv"],
      ["qam", "application/vnd.epson.quickanime"],
      ["qbo", "application/vnd.intu.qbo"],
      ["qcp", "audio/vnd.qcelp"],
      ["qd3", "x-world/x-3dmf"],
      ["qd3d", "x-world/x-3dmf"],
      ["qfx", "application/vnd.intu.qfx"],
      ["qif", "image/x-quicktime"],
      ["qps", "application/vnd.publishare-delta-tree"],
      ["qt", "video/quicktime"],
      ["qtc", "video/x-qtc"],
      ["qti", "image/x-quicktime"],
      ["qtif", "image/x-quicktime"],
      ["qxd", "application/vnd.quark.quarkxpress"],
      ["ra", ["audio/x-realaudio", "audio/x-pn-realaudio", "audio/x-pn-realaudio-plugin"]],
      ["ram", "audio/x-pn-realaudio"],
      ["rar", "application/x-rar-compressed"],
      ["ras", ["image/cmu-raster", "application/x-cmu-raster", "image/x-cmu-raster"]],
      ["rast", "image/cmu-raster"],
      ["rcprofile", "application/vnd.ipunplugged.rcprofile"],
      ["rdf", "application/rdf+xml"],
      ["rdz", "application/vnd.data-vision.rdz"],
      ["rep", "application/vnd.businessobjects"],
      ["res", "application/x-dtbresource+xml"],
      ["rexx", "text/x-script.rexx"],
      ["rf", "image/vnd.rn-realflash"],
      ["rgb", "image/x-rgb"],
      ["rif", "application/reginfo+xml"],
      ["rip", "audio/vnd.rip"],
      ["rl", "application/resource-lists+xml"],
      ["rlc", "image/vnd.fujixerox.edmics-rlc"],
      ["rld", "application/resource-lists-diff+xml"],
      ["rm", ["application/vnd.rn-realmedia", "audio/x-pn-realaudio"]],
      ["rmi", "audio/mid"],
      ["rmm", "audio/x-pn-realaudio"],
      ["rmp", ["audio/x-pn-realaudio-plugin", "audio/x-pn-realaudio"]],
      ["rms", "application/vnd.jcp.javame.midlet-rms"],
      ["rnc", "application/relax-ng-compact-syntax"],
      ["rng", ["application/ringing-tones", "application/vnd.nokia.ringing-tone"]],
      ["rnx", "application/vnd.rn-realplayer"],
      ["roff", "application/x-troff"],
      ["rp", "image/vnd.rn-realpix"],
      ["rp9", "application/vnd.cloanto.rp9"],
      ["rpm", "audio/x-pn-realaudio-plugin"],
      ["rpss", "application/vnd.nokia.radio-presets"],
      ["rpst", "application/vnd.nokia.radio-preset"],
      ["rq", "application/sparql-query"],
      ["rs", "application/rls-services+xml"],
      ["rsd", "application/rsd+xml"],
      ["rt", ["text/richtext", "text/vnd.rn-realtext"]],
      ["rtf", ["application/rtf", "text/richtext", "application/x-rtf"]],
      ["rtx", ["text/richtext", "application/rtf"]],
      ["rv", "video/vnd.rn-realvideo"],
      ["s", "text/x-asm"],
      ["s3m", "audio/s3m"],
      ["saf", "application/vnd.yamaha.smaf-audio"],
      ["saveme", "application/octet-stream"],
      ["sbk", "application/x-tbook"],
      ["sbml", "application/sbml+xml"],
      ["sc", "application/vnd.ibm.secure-container"],
      ["scd", "application/x-msschedule"],
      ["scm", ["application/vnd.lotus-screencam", "video/x-scm", "text/x-script.guile", "application/x-lotusscreencam", "text/x-script.scheme"]],
      ["scq", "application/scvp-cv-request"],
      ["scs", "application/scvp-cv-response"],
      ["sct", "text/scriptlet"],
      ["scurl", "text/vnd.curl.scurl"],
      ["sda", "application/vnd.stardivision.draw"],
      ["sdc", "application/vnd.stardivision.calc"],
      ["sdd", "application/vnd.stardivision.impress"],
      ["sdkm", "application/vnd.solent.sdkm+xml"],
      ["sdml", "text/plain"],
      ["sdp", ["application/sdp", "application/x-sdp"]],
      ["sdr", "application/sounder"],
      ["sdw", "application/vnd.stardivision.writer"],
      ["sea", ["application/sea", "application/x-sea"]],
      ["see", "application/vnd.seemail"],
      ["seed", "application/vnd.fdsn.seed"],
      ["sema", "application/vnd.sema"],
      ["semd", "application/vnd.semd"],
      ["semf", "application/vnd.semf"],
      ["ser", "application/java-serialized-object"],
      ["set", "application/set"],
      ["setpay", "application/set-payment-initiation"],
      ["setreg", "application/set-registration-initiation"],
      ["sfd-hdstx", "application/vnd.hydrostatix.sof-data"],
      ["sfs", "application/vnd.spotfire.sfs"],
      ["sgl", "application/vnd.stardivision.writer-global"],
      ["sgm", ["text/sgml", "text/x-sgml"]],
      ["sgml", ["text/sgml", "text/x-sgml"]],
      ["sh", ["application/x-shar", "application/x-bsh", "application/x-sh", "text/x-script.sh"]],
      ["shar", ["application/x-bsh", "application/x-shar"]],
      ["shf", "application/shf+xml"],
      ["shtml", ["text/html", "text/x-server-parsed-html"]],
      ["sid", "audio/x-psid"],
      ["sis", "application/vnd.symbian.install"],
      ["sit", ["application/x-stuffit", "application/x-sit"]],
      ["sitx", "application/x-stuffitx"],
      ["skd", "application/x-koan"],
      ["skm", "application/x-koan"],
      ["skp", ["application/vnd.koan", "application/x-koan"]],
      ["skt", "application/x-koan"],
      ["sl", "application/x-seelogo"],
      ["sldm", "application/vnd.ms-powerpoint.slide.macroenabled.12"],
      ["sldx", "application/vnd.openxmlformats-officedocument.presentationml.slide"],
      ["slt", "application/vnd.epson.salt"],
      ["sm", "application/vnd.stepmania.stepchart"],
      ["smf", "application/vnd.stardivision.math"],
      ["smi", ["application/smil", "application/smil+xml"]],
      ["smil", "application/smil"],
      ["snd", ["audio/basic", "audio/x-adpcm"]],
      ["snf", "application/x-font-snf"],
      ["sol", "application/solids"],
      ["spc", ["text/x-speech", "application/x-pkcs7-certificates"]],
      ["spf", "application/vnd.yamaha.smaf-phrase"],
      ["spl", ["application/futuresplash", "application/x-futuresplash"]],
      ["spot", "text/vnd.in3d.spot"],
      ["spp", "application/scvp-vp-response"],
      ["spq", "application/scvp-vp-request"],
      ["spr", "application/x-sprite"],
      ["sprite", "application/x-sprite"],
      ["src", "application/x-wais-source"],
      ["sru", "application/sru+xml"],
      ["srx", "application/sparql-results+xml"],
      ["sse", "application/vnd.kodak-descriptor"],
      ["ssf", "application/vnd.epson.ssf"],
      ["ssi", "text/x-server-parsed-html"],
      ["ssm", "application/streamingmedia"],
      ["ssml", "application/ssml+xml"],
      ["sst", ["application/vnd.ms-pkicertstore", "application/vnd.ms-pki.certstore"]],
      ["st", "application/vnd.sailingtracker.track"],
      ["stc", "application/vnd.sun.xml.calc.template"],
      ["std", "application/vnd.sun.xml.draw.template"],
      ["step", "application/step"],
      ["stf", "application/vnd.wt.stf"],
      ["sti", "application/vnd.sun.xml.impress.template"],
      ["stk", "application/hyperstudio"],
      ["stl", ["application/vnd.ms-pkistl", "application/sla", "application/vnd.ms-pki.stl", "application/x-navistyle"]],
      ["stm", "text/html"],
      ["stp", "application/step"],
      ["str", "application/vnd.pg.format"],
      ["stw", "application/vnd.sun.xml.writer.template"],
      ["sub", "image/vnd.dvb.subtitle"],
      ["sus", "application/vnd.sus-calendar"],
      ["sv4cpio", "application/x-sv4cpio"],
      ["sv4crc", "application/x-sv4crc"],
      ["svc", "application/vnd.dvb.service"],
      ["svd", "application/vnd.svd"],
      ["svf", ["image/vnd.dwg", "image/x-dwg"]],
      ["svg", "image/svg+xml"],
      ["svr", ["x-world/x-svr", "application/x-world"]],
      ["swf", "application/x-shockwave-flash"],
      ["swi", "application/vnd.aristanetworks.swi"],
      ["sxc", "application/vnd.sun.xml.calc"],
      ["sxd", "application/vnd.sun.xml.draw"],
      ["sxg", "application/vnd.sun.xml.writer.global"],
      ["sxi", "application/vnd.sun.xml.impress"],
      ["sxm", "application/vnd.sun.xml.math"],
      ["sxw", "application/vnd.sun.xml.writer"],
      ["t", ["text/troff", "application/x-troff"]],
      ["talk", "text/x-speech"],
      ["tao", "application/vnd.tao.intent-module-archive"],
      ["tar", "application/x-tar"],
      ["tbk", ["application/toolbook", "application/x-tbook"]],
      ["tcap", "application/vnd.3gpp2.tcap"],
      ["tcl", ["text/x-script.tcl", "application/x-tcl"]],
      ["tcsh", "text/x-script.tcsh"],
      ["teacher", "application/vnd.smart.teacher"],
      ["tei", "application/tei+xml"],
      ["tex", "application/x-tex"],
      ["texi", "application/x-texinfo"],
      ["texinfo", "application/x-texinfo"],
      ["text", ["application/plain", "text/plain"]],
      ["tfi", "application/thraud+xml"],
      ["tfm", "application/x-tex-tfm"],
      ["tgz", ["application/gnutar", "application/x-compressed"]],
      ["thmx", "application/vnd.ms-officetheme"],
      ["tif", ["image/tiff", "image/x-tiff"]],
      ["tiff", ["image/tiff", "image/x-tiff"]],
      ["tmo", "application/vnd.tmobile-livetv"],
      ["torrent", "application/x-bittorrent"],
      ["tpl", "application/vnd.groove-tool-template"],
      ["tpt", "application/vnd.trid.tpt"],
      ["tr", "application/x-troff"],
      ["tra", "application/vnd.trueapp"],
      ["trm", "application/x-msterminal"],
      ["tsd", "application/timestamped-data"],
      ["tsi", "audio/tsp-audio"],
      ["tsp", ["application/dsptype", "audio/tsplayer"]],
      ["tsv", "text/tab-separated-values"],
      ["ttf", "application/x-font-ttf"],
      ["ttl", "text/turtle"],
      ["turbot", "image/florian"],
      ["twd", "application/vnd.simtech-mindmapper"],
      ["txd", "application/vnd.genomatix.tuxedo"],
      ["txf", "application/vnd.mobius.txf"],
      ["txt", "text/plain"],
      ["ufd", "application/vnd.ufdl"],
      ["uil", "text/x-uil"],
      ["uls", "text/iuls"],
      ["umj", "application/vnd.umajin"],
      ["uni", "text/uri-list"],
      ["unis", "text/uri-list"],
      ["unityweb", "application/vnd.unity"],
      ["unv", "application/i-deas"],
      ["uoml", "application/vnd.uoml+xml"],
      ["uri", "text/uri-list"],
      ["uris", "text/uri-list"],
      ["ustar", ["application/x-ustar", "multipart/x-ustar"]],
      ["utz", "application/vnd.uiq.theme"],
      ["uu", ["application/octet-stream", "text/x-uuencode"]],
      ["uue", "text/x-uuencode"],
      ["uva", "audio/vnd.dece.audio"],
      ["uvh", "video/vnd.dece.hd"],
      ["uvi", "image/vnd.dece.graphic"],
      ["uvm", "video/vnd.dece.mobile"],
      ["uvp", "video/vnd.dece.pd"],
      ["uvs", "video/vnd.dece.sd"],
      ["uvu", "video/vnd.uvvu.mp4"],
      ["uvv", "video/vnd.dece.video"],
      ["vcd", "application/x-cdlink"],
      ["vcf", "text/x-vcard"],
      ["vcg", "application/vnd.groove-vcard"],
      ["vcs", "text/x-vcalendar"],
      ["vcx", "application/vnd.vcx"],
      ["vda", "application/vda"],
      ["vdo", "video/vdo"],
      ["vew", "application/groupwise"],
      ["vis", "application/vnd.visionary"],
      ["viv", ["video/vivo", "video/vnd.vivo"]],
      ["vivo", ["video/vivo", "video/vnd.vivo"]],
      ["vmd", "application/vocaltec-media-desc"],
      ["vmf", "application/vocaltec-media-file"],
      ["voc", ["audio/voc", "audio/x-voc"]],
      ["vos", "video/vosaic"],
      ["vox", "audio/voxware"],
      ["vqe", "audio/x-twinvq-plugin"],
      ["vqf", "audio/x-twinvq"],
      ["vql", "audio/x-twinvq-plugin"],
      ["vrml", ["model/vrml", "x-world/x-vrml", "application/x-vrml"]],
      ["vrt", "x-world/x-vrt"],
      ["vsd", ["application/vnd.visio", "application/x-visio"]],
      ["vsf", "application/vnd.vsf"],
      ["vst", "application/x-visio"],
      ["vsw", "application/x-visio"],
      ["vtu", "model/vnd.vtu"],
      ["vxml", "application/voicexml+xml"],
      ["w60", "application/wordperfect6.0"],
      ["w61", "application/wordperfect6.1"],
      ["w6w", "application/msword"],
      ["wad", "application/x-doom"],
      ["wav", ["audio/wav", "audio/x-wav"]],
      ["wax", "audio/x-ms-wax"],
      ["wb1", "application/x-qpro"],
      ["wbmp", "image/vnd.wap.wbmp"],
      ["wbs", "application/vnd.criticaltools.wbs+xml"],
      ["wbxml", "application/vnd.wap.wbxml"],
      ["wcm", "application/vnd.ms-works"],
      ["wdb", "application/vnd.ms-works"],
      ["web", "application/vnd.xara"],
      ["weba", "audio/webm"],
      ["webm", "video/webm"],
      ["webp", "image/webp"],
      ["wg", "application/vnd.pmi.widget"],
      ["wgt", "application/widget"],
      ["wiz", "application/msword"],
      ["wk1", "application/x-123"],
      ["wks", "application/vnd.ms-works"],
      ["wm", "video/x-ms-wm"],
      ["wma", "audio/x-ms-wma"],
      ["wmd", "application/x-ms-wmd"],
      ["wmf", ["windows/metafile", "application/x-msmetafile"]],
      ["wml", "text/vnd.wap.wml"],
      ["wmlc", "application/vnd.wap.wmlc"],
      ["wmls", "text/vnd.wap.wmlscript"],
      ["wmlsc", "application/vnd.wap.wmlscriptc"],
      ["wmv", "video/x-ms-wmv"],
      ["wmx", "video/x-ms-wmx"],
      ["wmz", "application/x-ms-wmz"],
      ["woff", "application/x-font-woff"],
      ["word", "application/msword"],
      ["wp", "application/wordperfect"],
      ["wp5", ["application/wordperfect", "application/wordperfect6.0"]],
      ["wp6", "application/wordperfect"],
      ["wpd", ["application/wordperfect", "application/vnd.wordperfect", "application/x-wpwin"]],
      ["wpl", "application/vnd.ms-wpl"],
      ["wps", "application/vnd.ms-works"],
      ["wq1", "application/x-lotus"],
      ["wqd", "application/vnd.wqd"],
      ["wri", ["application/mswrite", "application/x-wri", "application/x-mswrite"]],
      ["wrl", ["model/vrml", "x-world/x-vrml", "application/x-world"]],
      ["wrz", ["model/vrml", "x-world/x-vrml"]],
      ["wsc", "text/scriplet"],
      ["wsdl", "application/wsdl+xml"],
      ["wspolicy", "application/wspolicy+xml"],
      ["wsrc", "application/x-wais-source"],
      ["wtb", "application/vnd.webturbo"],
      ["wtk", "application/x-wintalk"],
      ["wvx", "video/x-ms-wvx"],
      ["x-png", "image/png"],
      ["x3d", "application/vnd.hzn-3d-crossword"],
      ["xaf", "x-world/x-vrml"],
      ["xap", "application/x-silverlight-app"],
      ["xar", "application/vnd.xara"],
      ["xbap", "application/x-ms-xbap"],
      ["xbd", "application/vnd.fujixerox.docuworks.binder"],
      ["xbm", ["image/xbm", "image/x-xbm", "image/x-xbitmap"]],
      ["xdf", "application/xcap-diff+xml"],
      ["xdm", "application/vnd.syncml.dm+xml"],
      ["xdp", "application/vnd.adobe.xdp+xml"],
      ["xdr", "video/x-amt-demorun"],
      ["xdssc", "application/dssc+xml"],
      ["xdw", "application/vnd.fujixerox.docuworks"],
      ["xenc", "application/xenc+xml"],
      ["xer", "application/patch-ops-error+xml"],
      ["xfdf", "application/vnd.adobe.xfdf"],
      ["xfdl", "application/vnd.xfdl"],
      ["xgz", "xgl/drawing"],
      ["xhtml", "application/xhtml+xml"],
      ["xif", "image/vnd.xiff"],
      ["xl", "application/excel"],
      ["xla", ["application/vnd.ms-excel", "application/excel", "application/x-msexcel", "application/x-excel"]],
      ["xlam", "application/vnd.ms-excel.addin.macroenabled.12"],
      ["xlb", ["application/excel", "application/vnd.ms-excel", "application/x-excel"]],
      ["xlc", ["application/vnd.ms-excel", "application/excel", "application/x-excel"]],
      ["xld", ["application/excel", "application/x-excel"]],
      ["xlk", ["application/excel", "application/x-excel"]],
      ["xll", ["application/excel", "application/vnd.ms-excel", "application/x-excel"]],
      ["xlm", ["application/vnd.ms-excel", "application/excel", "application/x-excel"]],
      ["xls", ["application/vnd.ms-excel", "application/excel", "application/x-msexcel", "application/x-excel"]],
      ["xlsb", "application/vnd.ms-excel.sheet.binary.macroenabled.12"],
      ["xlsm", "application/vnd.ms-excel.sheet.macroenabled.12"],
      ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
      ["xlt", ["application/vnd.ms-excel", "application/excel", "application/x-excel"]],
      ["xltm", "application/vnd.ms-excel.template.macroenabled.12"],
      ["xltx", "application/vnd.openxmlformats-officedocument.spreadsheetml.template"],
      ["xlv", ["application/excel", "application/x-excel"]],
      ["xlw", ["application/vnd.ms-excel", "application/excel", "application/x-msexcel", "application/x-excel"]],
      ["xm", "audio/xm"],
      ["xml", ["application/xml", "text/xml", "application/atom+xml", "application/rss+xml"]],
      ["xmz", "xgl/movie"],
      ["xo", "application/vnd.olpc-sugar"],
      ["xof", "x-world/x-vrml"],
      ["xop", "application/xop+xml"],
      ["xpi", "application/x-xpinstall"],
      ["xpix", "application/x-vnd.ls-xpix"],
      ["xpm", ["image/xpm", "image/x-xpixmap"]],
      ["xpr", "application/vnd.is-xpr"],
      ["xps", "application/vnd.ms-xpsdocument"],
      ["xpw", "application/vnd.intercon.formnet"],
      ["xslt", "application/xslt+xml"],
      ["xsm", "application/vnd.syncml+xml"],
      ["xspf", "application/xspf+xml"],
      ["xsr", "video/x-amt-showrun"],
      ["xul", "application/vnd.mozilla.xul+xml"],
      ["xwd", ["image/x-xwd", "image/x-xwindowdump"]],
      ["xyz", ["chemical/x-xyz", "chemical/x-pdb"]],
      ["yang", "application/yang"],
      ["yin", "application/yin+xml"],
      ["z", ["application/x-compressed", "application/x-compress"]],
      ["zaz", "application/vnd.zzazz.deck+xml"],
      ["zip", ["application/zip", "multipart/x-zip", "application/x-zip-compressed", "application/x-compressed"]],
      ["zir", "application/vnd.zul"],
      ["zmm", "application/vnd.handheld-entertainment+xml"],
      ["zoo", "application/octet-stream"],
      ["zsh", "text/x-script.zsh"]
    ]);
    module2.exports = {
      detectMimeType(filename) {
        if (!filename)
          return defaultMimeType;
        let parsed = path.parse(filename), extension = (parsed.ext.substr(1) || parsed.name || "").split("?").shift().trim().toLowerCase(), value = defaultMimeType;
        return extensions.has(extension) && (value = extensions.get(extension)), Array.isArray(value) ? value[0] : value;
      },
      detectExtension(mimeType) {
        if (!mimeType)
          return defaultExtension;
        let parts = (mimeType || "").toLowerCase().trim().split("/"), rootType = parts.shift().trim(), subType = parts.join("/").trim();
        if (mimeTypes.has(rootType + "/" + subType)) {
          let value = mimeTypes.get(rootType + "/" + subType);
          return Array.isArray(value) ? value[0] : value;
        }
        switch (rootType) {
          case "text":
            return "txt";
          default:
            return "bin";
        }
      }
    };
  }
});

// node_modules/nodemailer/lib/punycode/index.js
var require_punycode = __commonJS({
  "node_modules/nodemailer/lib/punycode/index.js"(exports2, module2) {
    "use strict";
    var delimiter = "-", regexPunycode = /^xn--/, regexNonASCII = /[^\0-\x7F]/, regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, errors = {
      overflow: "Overflow: input needs wider integers to process",
      "not-basic": "Illegal input >= 0x80 (not a basic code point)",
      "invalid-input": "Invalid input"
    }, baseMinusTMin = 35, floor = Math.floor, stringFromCharCode = String.fromCharCode;
    function error(type) {
      throw new RangeError(errors[type]);
    }
    function map(array, callback) {
      let result = [], length = array.length;
      for (; length--; )
        result[length] = callback(array[length]);
      return result;
    }
    function mapDomain(domain, callback) {
      let parts = domain.split("@"), result = "";
      parts.length > 1 && (result = parts[0] + "@", domain = parts[1]), domain = domain.replace(regexSeparators, ".");
      let labels = domain.split("."), encoded = map(labels, callback).join(".");
      return result + encoded;
    }
    function ucs2decode(string) {
      let output = [], counter = 0, length = string.length;
      for (; counter < length; ) {
        let value = string.charCodeAt(counter++);
        if (value >= 55296 && value <= 56319 && counter < length) {
          let extra = string.charCodeAt(counter++);
          (extra & 64512) == 56320 ? output.push(((value & 1023) << 10) + (extra & 1023) + 65536) : (output.push(value), counter--);
        } else
          output.push(value);
      }
      return output;
    }
    var ucs2encode = (codePoints) => String.fromCodePoint(...codePoints), basicToDigit = function(codePoint) {
      return codePoint >= 48 && codePoint < 58 ? 26 + (codePoint - 48) : codePoint >= 65 && codePoint < 91 ? codePoint - 65 : codePoint >= 97 && codePoint < 123 ? codePoint - 97 : 36;
    }, digitToBasic = function(digit, flag) {
      return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
    }, adapt = function(delta, numPoints, firstTime) {
      let k = 0;
      for (
        delta = firstTime ? floor(delta / 700) : delta >> 1, delta += floor(delta / numPoints);
        /* no initialization */
        delta > baseMinusTMin * 26 >> 1;
        k += 36
      )
        delta = floor(delta / baseMinusTMin);
      return floor(k + (baseMinusTMin + 1) * delta / (delta + 38));
    }, decode = function(input) {
      let output = [], inputLength = input.length, i = 0, n = 128, bias = 72, basic = input.lastIndexOf(delimiter);
      basic < 0 && (basic = 0);
      for (let j = 0; j < basic; ++j)
        input.charCodeAt(j) >= 128 && error("not-basic"), output.push(input.charCodeAt(j));
      for (let index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
        let oldi = i;
        for (let w = 1, k = 36; ; k += 36) {
          index >= inputLength && error("invalid-input");
          let digit = basicToDigit(input.charCodeAt(index++));
          digit >= 36 && error("invalid-input"), digit > floor((2147483647 - i) / w) && error("overflow"), i += digit * w;
          let t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
          if (digit < t)
            break;
          let baseMinusT = 36 - t;
          w > floor(2147483647 / baseMinusT) && error("overflow"), w *= baseMinusT;
        }
        let out = output.length + 1;
        bias = adapt(i - oldi, out, oldi == 0), floor(i / out) > 2147483647 - n && error("overflow"), n += floor(i / out), i %= out, output.splice(i++, 0, n);
      }
      return String.fromCodePoint(...output);
    }, encode = function(input) {
      let output = [];
      input = ucs2decode(input);
      let inputLength = input.length, n = 128, delta = 0, bias = 72;
      for (let currentValue of input)
        currentValue < 128 && output.push(stringFromCharCode(currentValue));
      let basicLength = output.length, handledCPCount = basicLength;
      for (basicLength && output.push(delimiter); handledCPCount < inputLength; ) {
        let m = 2147483647;
        for (let currentValue of input)
          currentValue >= n && currentValue < m && (m = currentValue);
        let handledCPCountPlusOne = handledCPCount + 1;
        m - n > floor((2147483647 - delta) / handledCPCountPlusOne) && error("overflow"), delta += (m - n) * handledCPCountPlusOne, n = m;
        for (let currentValue of input)
          if (currentValue < n && ++delta > 2147483647 && error("overflow"), currentValue === n) {
            let q = delta;
            for (let k = 36; ; k += 36) {
              let t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
              if (q < t)
                break;
              let qMinusT = q - t, baseMinusT = 36 - t;
              output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))), q = floor(qMinusT / baseMinusT);
            }
            output.push(stringFromCharCode(digitToBasic(q, 0))), bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength), delta = 0, ++handledCPCount;
          }
        ++delta, ++n;
      }
      return output.join("");
    }, toUnicode = function(input) {
      return mapDomain(input, function(string) {
        return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
      });
    }, toASCII = function(input) {
      return mapDomain(input, function(string) {
        return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
      });
    }, punycode = {
      /**
       * A string representing the current Punycode.js version number.
       * @memberOf punycode
       * @type String
       */
      version: "2.3.1",
      /**
       * An object of methods to convert from JavaScript's internal character
       * representation (UCS-2) to Unicode code points, and back.
       * @see <https://mathiasbynens.be/notes/javascript-encoding>
       * @memberOf punycode
       * @type Object
       */
      ucs2: {
        decode: ucs2decode,
        encode: ucs2encode
      },
      decode,
      encode,
      toASCII,
      toUnicode
    };
    module2.exports = punycode;
  }
});

// node_modules/nodemailer/lib/base64/index.js
var require_base64 = __commonJS({
  "node_modules/nodemailer/lib/base64/index.js"(exports2, module2) {
    "use strict";
    var Transform = require("stream").Transform;
    function encode(buffer) {
      return typeof buffer == "string" && (buffer = Buffer.from(buffer, "utf-8")), buffer.toString("base64");
    }
    function wrap(str, lineLength) {
      if (str = (str || "").toString(), lineLength = lineLength || 76, str.length <= lineLength)
        return str;
      let result = [], pos = 0, chunkLength = lineLength * 1024;
      for (; pos < str.length; ) {
        let wrappedLines = str.substr(pos, chunkLength).replace(new RegExp(".{" + lineLength + "}", "g"), `$&\r
`).trim();
        result.push(wrappedLines), pos += chunkLength;
      }
      return result.join(`\r
`).trim();
    }
    var Encoder = class extends Transform {
      constructor(options) {
        super(), this.options = options || {}, this.options.lineLength !== !1 && (this.options.lineLength = this.options.lineLength || 76), this._curLine = "", this._remainingBytes = !1, this.inputBytes = 0, this.outputBytes = 0;
      }
      _transform(chunk, encoding, done) {
        if (encoding !== "buffer" && (chunk = Buffer.from(chunk, encoding)), !chunk || !chunk.length)
          return setImmediate(done);
        this.inputBytes += chunk.length, this._remainingBytes && this._remainingBytes.length && (chunk = Buffer.concat([this._remainingBytes, chunk], this._remainingBytes.length + chunk.length), this._remainingBytes = !1), chunk.length % 3 ? (this._remainingBytes = chunk.slice(chunk.length - chunk.length % 3), chunk = chunk.slice(0, chunk.length - chunk.length % 3)) : this._remainingBytes = !1;
        let b64 = this._curLine + encode(chunk);
        if (this.options.lineLength) {
          b64 = wrap(b64, this.options.lineLength);
          let lastLF = b64.lastIndexOf(`
`);
          lastLF < 0 ? (this._curLine = b64, b64 = "") : lastLF === b64.length - 1 ? this._curLine = "" : (this._curLine = b64.substr(lastLF + 1), b64 = b64.substr(0, lastLF + 1));
        }
        b64 && (this.outputBytes += b64.length, this.push(Buffer.from(b64, "ascii"))), setImmediate(done);
      }
      _flush(done) {
        this._remainingBytes && this._remainingBytes.length && (this._curLine += encode(this._remainingBytes)), this._curLine && (this._curLine = wrap(this._curLine, this.options.lineLength), this.outputBytes += this._curLine.length, this.push(this._curLine, "ascii"), this._curLine = ""), done();
      }
    };
    module2.exports = {
      encode,
      wrap,
      Encoder
    };
  }
});

// node_modules/nodemailer/lib/qp/index.js
var require_qp = __commonJS({
  "node_modules/nodemailer/lib/qp/index.js"(exports2, module2) {
    "use strict";
    var Transform = require("stream").Transform;
    function encode(buffer) {
      typeof buffer == "string" && (buffer = Buffer.from(buffer, "utf-8"));
      let ranges = [
        // https://tools.ietf.org/html/rfc2045#section-6.7
        [9],
        // <TAB>
        [10],
        // <LF>
        [13],
        // <CR>
        [32, 60],
        // <SP>!"#$%&'()*+,-./0123456789:;
        [62, 126]
        // >?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}
      ], result = "", ord;
      for (let i = 0, len = buffer.length; i < len; i++) {
        if (ord = buffer[i], checkRanges(ord, ranges) && !((ord === 32 || ord === 9) && (i === len - 1 || buffer[i + 1] === 10 || buffer[i + 1] === 13))) {
          result += String.fromCharCode(ord);
          continue;
        }
        result += "=" + (ord < 16 ? "0" : "") + ord.toString(16).toUpperCase();
      }
      return result;
    }
    function wrap(str, lineLength) {
      if (str = (str || "").toString(), lineLength = lineLength || 76, str.length <= lineLength)
        return str;
      let pos = 0, len = str.length, match, code, line, lineMargin = Math.floor(lineLength / 3), result = "";
      for (; pos < len; ) {
        if (line = str.substr(pos, lineLength), match = line.match(/\r\n/)) {
          line = line.substr(0, match.index + match[0].length), result += line, pos += line.length;
          continue;
        }
        if (line.substr(-1) === `
`) {
          result += line, pos += line.length;
          continue;
        } else if (match = line.substr(-lineMargin).match(/\n.*?$/)) {
          line = line.substr(0, line.length - (match[0].length - 1)), result += line, pos += line.length;
          continue;
        } else if (line.length > lineLength - lineMargin && (match = line.substr(-lineMargin).match(/[ \t.,!?][^ \t.,!?]*$/)))
          line = line.substr(0, line.length - (match[0].length - 1));
        else if (line.match(/[=][\da-f]{0,2}$/i))
          for ((match = line.match(/[=][\da-f]{0,1}$/i)) && (line = line.substr(0, line.length - match[0].length)); line.length > 3 && line.length < len - pos && !line.match(/^(?:=[\da-f]{2}){1,4}$/i) && (match = line.match(/[=][\da-f]{2}$/gi)) && (code = parseInt(match[0].substr(1, 2), 16), !(code < 128 || (line = line.substr(0, line.length - 3), code >= 192))); )
            ;
        pos + line.length < len && line.substr(-1) !== `
` ? (line.length === lineLength && line.match(/[=][\da-f]{2}$/i) ? line = line.substr(0, line.length - 3) : line.length === lineLength && (line = line.substr(0, line.length - 1)), pos += line.length, line += `=\r
`) : pos += line.length, result += line;
      }
      return result;
    }
    function checkRanges(nr, ranges) {
      for (let i = ranges.length - 1; i >= 0; i--)
        if (ranges[i].length && (ranges[i].length === 1 && nr === ranges[i][0] || ranges[i].length === 2 && nr >= ranges[i][0] && nr <= ranges[i][1]))
          return !0;
      return !1;
    }
    var Encoder = class extends Transform {
      constructor(options) {
        super(), this.options = options || {}, this.options.lineLength !== !1 && (this.options.lineLength = this.options.lineLength || 76), this._curLine = "", this.inputBytes = 0, this.outputBytes = 0;
      }
      _transform(chunk, encoding, done) {
        let qp;
        if (encoding !== "buffer" && (chunk = Buffer.from(chunk, encoding)), !chunk || !chunk.length)
          return done();
        this.inputBytes += chunk.length, this.options.lineLength ? (qp = this._curLine + encode(chunk), qp = wrap(qp, this.options.lineLength), qp = qp.replace(/(^|\n)([^\n]*)$/, (match, lineBreak, lastLine) => (this._curLine = lastLine, lineBreak)), qp && (this.outputBytes += qp.length, this.push(qp))) : (qp = encode(chunk), this.outputBytes += qp.length, this.push(qp, "ascii")), done();
      }
      _flush(done) {
        this._curLine && (this.outputBytes += this._curLine.length, this.push(this._curLine, "ascii")), done();
      }
    };
    module2.exports = {
      encode,
      wrap,
      Encoder
    };
  }
});

// node_modules/nodemailer/lib/mime-funcs/index.js
var require_mime_funcs = __commonJS({
  "node_modules/nodemailer/lib/mime-funcs/index.js"(exports2, module2) {
    "use strict";
    var base64 = require_base64(), qp = require_qp(), mimeTypes = require_mime_types();
    module2.exports = {
      /**
       * Checks if a value is plaintext string (uses only printable 7bit chars)
       *
       * @param {String} value String to be tested
       * @returns {Boolean} true if it is a plaintext string
       */
      isPlainText(value, isParam) {
        return !(typeof value != "string" || (isParam ? /[\x00-\x08\x0b\x0c\x0e-\x1f"\u0080-\uFFFF]/ : /[\x00-\x08\x0b\x0c\x0e-\x1f\u0080-\uFFFF]/).test(value));
      },
      /**
       * Checks if a multi line string containes lines longer than the selected value.
       *
       * Useful when detecting if a mail message needs any processing at all –
       * if only plaintext characters are used and lines are short, then there is
       * no need to encode the values in any way. If the value is plaintext but has
       * longer lines then allowed, then use format=flowed
       *
       * @param {Number} lineLength Max line length to check for
       * @returns {Boolean} Returns true if there is at least one line longer than lineLength chars
       */
      hasLongerLines(str, lineLength) {
        return str.length > 128 * 1024 ? !0 : new RegExp("^.{" + (lineLength + 1) + ",}", "m").test(str);
      },
      /**
       * Encodes a string or an Buffer to an UTF-8 MIME Word (rfc2047)
       *
       * @param {String|Buffer} data String to be encoded
       * @param {String} mimeWordEncoding='Q' Encoding for the mime word, either Q or B
       * @param {Number} [maxLength=0] If set, split mime words into several chunks if needed
       * @return {String} Single or several mime words joined together
       */
      encodeWord(data, mimeWordEncoding, maxLength) {
        mimeWordEncoding = (mimeWordEncoding || "Q").toString().toUpperCase().trim().charAt(0), maxLength = maxLength || 0;
        let encodedStr, toCharset = "UTF-8";
        if (maxLength && maxLength > 7 + toCharset.length && (maxLength -= 7 + toCharset.length), mimeWordEncoding === "Q" ? encodedStr = qp.encode(data).replace(/[^a-z0-9!*+\-/=]/gi, (chr) => {
          let ord = chr.charCodeAt(0).toString(16).toUpperCase();
          return chr === " " ? "_" : "=" + (ord.length === 1 ? "0" + ord : ord);
        }) : mimeWordEncoding === "B" && (encodedStr = typeof data == "string" ? data : base64.encode(data), maxLength = maxLength ? Math.max(3, (maxLength - maxLength % 4) / 4 * 3) : 0), maxLength && (mimeWordEncoding !== "B" ? encodedStr : base64.encode(data)).length > maxLength)
          if (mimeWordEncoding === "Q")
            encodedStr = this.splitMimeEncodedString(encodedStr, maxLength).join("?= =?" + toCharset + "?" + mimeWordEncoding + "?");
          else {
            let parts = [], lpart = "";
            for (let i = 0, len = encodedStr.length; i < len; i++) {
              let chr = encodedStr.charAt(i);
              /[\ud83c\ud83d\ud83e]/.test(chr) && i < len - 1 && (chr += encodedStr.charAt(++i)), Buffer.byteLength(lpart + chr) <= maxLength || i === 0 ? lpart += chr : (parts.push(base64.encode(lpart)), lpart = chr);
            }
            lpart && parts.push(base64.encode(lpart)), parts.length > 1 ? encodedStr = parts.join("?= =?" + toCharset + "?" + mimeWordEncoding + "?") : encodedStr = parts.join("");
          }
        else mimeWordEncoding === "B" && (encodedStr = base64.encode(data));
        return "=?" + toCharset + "?" + mimeWordEncoding + "?" + encodedStr + (encodedStr.substr(-2) === "?=" ? "" : "?=");
      },
      /**
       * Finds word sequences with non ascii text and converts these to mime words
       *
       * @param {String} value String to be encoded
       * @param {String} mimeWordEncoding='Q' Encoding for the mime word, either Q or B
       * @param {Number} [maxLength=0] If set, split mime words into several chunks if needed
       * @param {Boolean} [encodeAll=false] If true and the value needs encoding then encodes entire string, not just the smallest match
       * @return {String} String with possible mime words
       */
      encodeWords(value, mimeWordEncoding, maxLength, encodeAll) {
        maxLength = maxLength || 0;
        let encodedValue, firstMatch = value.match(/(?:^|\s)([^\s]*["\u0080-\uFFFF])/);
        if (!firstMatch)
          return value;
        if (encodeAll)
          return this.encodeWord(value, mimeWordEncoding, maxLength);
        let lastMatch = value.match(/(["\u0080-\uFFFF][^\s]*)[^"\u0080-\uFFFF]*$/);
        if (!lastMatch)
          return value;
        let startIndex = firstMatch.index + (firstMatch[0].match(/[^\s]/) || {
          index: 0
        }).index, endIndex = lastMatch.index + (lastMatch[1] || "").length;
        return encodedValue = (startIndex ? value.substr(0, startIndex) : "") + this.encodeWord(value.substring(startIndex, endIndex), mimeWordEncoding || "Q", maxLength) + (endIndex < value.length ? value.substr(endIndex) : ""), encodedValue;
      },
      /**
       * Joins parsed header value together as 'value; param1=value1; param2=value2'
       * PS: We are following RFC 822 for the list of special characters that we need to keep in quotes.
       *      Refer: https://www.w3.org/Protocols/rfc1341/4_Content-Type.html
       * @param {Object} structured Parsed header value
       * @return {String} joined header value
       */
      buildHeaderValue(structured) {
        let paramsArray = [];
        return Object.keys(structured.params || {}).forEach((param) => {
          let value = structured.params[param];
          !this.isPlainText(value, !0) || value.length >= 75 ? this.buildHeaderParam(param, value, 50).forEach((encodedParam) => {
            !/[\s"\\;:/=(),<>@[\]?]|^[-']|'$/.test(encodedParam.value) || encodedParam.key.substr(-1) === "*" ? paramsArray.push(encodedParam.key + "=" + encodedParam.value) : paramsArray.push(encodedParam.key + "=" + JSON.stringify(encodedParam.value));
          }) : /[\s'"\\;:/=(),<>@[\]?]|^-/.test(value) ? paramsArray.push(param + "=" + JSON.stringify(value)) : paramsArray.push(param + "=" + value);
        }), structured.value + (paramsArray.length ? "; " + paramsArray.join("; ") : "");
      },
      /**
       * Encodes a string or an Buffer to an UTF-8 Parameter Value Continuation encoding (rfc2231)
       * Useful for splitting long parameter values.
       *
       * For example
       *      title="unicode string"
       * becomes
       *     title*0*=utf-8''unicode
       *     title*1*=%20string
       *
       * @param {String|Buffer} data String to be encoded
       * @param {Number} [maxLength=50] Max length for generated chunks
       * @param {String} [fromCharset='UTF-8'] Source sharacter set
       * @return {Array} A list of encoded keys and headers
       */
      buildHeaderParam(key, data, maxLength) {
        let list = [], encodedStr = typeof data == "string" ? data : (data || "").toString(), encodedStrArr, chr, ord, line, startPos = 0, i, len;
        if (maxLength = maxLength || 50, this.isPlainText(data, !0)) {
          if (encodedStr.length <= maxLength)
            return [
              {
                key,
                value: encodedStr
              }
            ];
          encodedStr = encodedStr.replace(new RegExp(".{" + maxLength + "}", "g"), (str) => (list.push({
            line: str
          }), "")), encodedStr && list.push({
            line: encodedStr
          });
        } else {
          if (/[\uD800-\uDBFF]/.test(encodedStr)) {
            for (encodedStrArr = [], i = 0, len = encodedStr.length; i < len; i++)
              chr = encodedStr.charAt(i), ord = chr.charCodeAt(0), ord >= 55296 && ord <= 56319 && i < len - 1 ? (chr += encodedStr.charAt(i + 1), encodedStrArr.push(chr), i++) : encodedStrArr.push(chr);
            encodedStr = encodedStrArr;
          }
          line = "utf-8''";
          let encoded = !0;
          for (startPos = 0, i = 0, len = encodedStr.length; i < len; i++) {
            if (chr = encodedStr[i], encoded)
              chr = this.safeEncodeURIComponent(chr);
            else if (chr = chr === " " ? chr : this.safeEncodeURIComponent(chr), chr !== encodedStr[i])
              if ((this.safeEncodeURIComponent(line) + chr).length >= maxLength)
                list.push({
                  line,
                  encoded
                }), line = "", startPos = i - 1;
              else {
                encoded = !0, i = startPos, line = "";
                continue;
              }
            (line + chr).length >= maxLength ? (list.push({
              line,
              encoded
            }), line = chr = encodedStr[i] === " " ? " " : this.safeEncodeURIComponent(encodedStr[i]), chr === encodedStr[i] ? (encoded = !1, startPos = i - 1) : encoded = !0) : line += chr;
          }
          line && list.push({
            line,
            encoded
          });
        }
        return list.map((item, i2) => ({
          // encoded lines: {name}*{part}*
          // unencoded lines: {name}*{part}
          // if any line needs to be encoded then the first line (part==0) is always encoded
          key: key + "*" + i2 + (item.encoded ? "*" : ""),
          value: item.line
        }));
      },
      /**
       * Parses a header value with key=value arguments into a structured
       * object.
       *
       *   parseHeaderValue('content-type: text/plain; CHARSET='UTF-8'') ->
       *   {
       *     'value': 'text/plain',
       *     'params': {
       *       'charset': 'UTF-8'
       *     }
       *   }
       *
       * @param {String} str Header value
       * @return {Object} Header value as a parsed structure
       */
      parseHeaderValue(str) {
        let response = {
          value: !1,
          params: {}
        }, key = !1, value = "", type = "value", quote = !1, escaped = !1, chr;
        for (let i = 0, len = str.length; i < len; i++)
          if (chr = str.charAt(i), type === "key") {
            if (chr === "=") {
              key = value.trim().toLowerCase(), type = "value", value = "";
              continue;
            }
            value += chr;
          } else {
            if (escaped)
              value += chr;
            else if (chr === "\\") {
              escaped = !0;
              continue;
            } else quote && chr === quote ? quote = !1 : !quote && chr === '"' ? quote = chr : !quote && chr === ";" ? (key === !1 ? response.value = value.trim() : response.params[key] = value.trim(), type = "key", value = "") : value += chr;
            escaped = !1;
          }
        return type === "value" ? key === !1 ? response.value = value.trim() : response.params[key] = value.trim() : value.trim() && (response.params[value.trim().toLowerCase()] = ""), Object.keys(response.params).forEach((key2) => {
          let actualKey, nr, match, value2;
          (match = key2.match(/(\*(\d+)|\*(\d+)\*|\*)$/)) && (actualKey = key2.substr(0, match.index), nr = Number(match[2] || match[3]) || 0, (!response.params[actualKey] || typeof response.params[actualKey] != "object") && (response.params[actualKey] = {
            charset: !1,
            values: []
          }), value2 = response.params[key2], nr === 0 && match[0].substr(-1) === "*" && (match = value2.match(/^([^']*)'[^']*'(.*)$/)) && (response.params[actualKey].charset = match[1] || "iso-8859-1", value2 = match[2]), response.params[actualKey].values[nr] = value2, delete response.params[key2]);
        }), Object.keys(response.params).forEach((key2) => {
          let value2;
          response.params[key2] && Array.isArray(response.params[key2].values) && (value2 = response.params[key2].values.map((val) => val || "").join(""), response.params[key2].charset ? response.params[key2] = "=?" + response.params[key2].charset + "?Q?" + value2.replace(/[=?_\s]/g, (s) => {
            let c = s.charCodeAt(0).toString(16);
            return s === " " ? "_" : "%" + (c.length < 2 ? "0" : "") + c;
          }).replace(/%/g, "=") + "?=" : response.params[key2] = value2);
        }), response;
      },
      /**
       * Returns file extension for a content type string. If no suitable extensions
       * are found, 'bin' is used as the default extension
       *
       * @param {String} mimeType Content type to be checked for
       * @return {String} File extension
       */
      detectExtension: (mimeType) => mimeTypes.detectExtension(mimeType),
      /**
       * Returns content type for a file extension. If no suitable content types
       * are found, 'application/octet-stream' is used as the default content type
       *
       * @param {String} extension Extension to be checked for
       * @return {String} File extension
       */
      detectMimeType: (extension) => mimeTypes.detectMimeType(extension),
      /**
       * Folds long lines, useful for folding header lines (afterSpace=false) and
       * flowed text (afterSpace=true)
       *
       * @param {String} str String to be folded
       * @param {Number} [lineLength=76] Maximum length of a line
       * @param {Boolean} afterSpace If true, leave a space in th end of a line
       * @return {String} String with folded lines
       */
      foldLines(str, lineLength, afterSpace) {
        str = (str || "").toString(), lineLength = lineLength || 76;
        let pos = 0, len = str.length, result = "", line, match;
        for (; pos < len; ) {
          if (line = str.substr(pos, lineLength), line.length < lineLength) {
            result += line;
            break;
          }
          if (match = line.match(/^[^\n\r]*(\r?\n|\r)/)) {
            line = match[0], result += line, pos += line.length;
            continue;
          } else (match = line.match(/(\s+)[^\s]*$/)) && match[0].length - (afterSpace ? (match[1] || "").length : 0) < line.length ? line = line.substr(0, line.length - (match[0].length - (afterSpace ? (match[1] || "").length : 0))) : (match = str.substr(pos + line.length).match(/^[^\s]+(\s*)/)) && (line = line + match[0].substr(0, match[0].length - (afterSpace ? 0 : (match[1] || "").length)));
          result += line, pos += line.length, pos < len && (result += `\r
`);
        }
        return result;
      },
      /**
       * Splits a mime encoded string. Needed for dividing mime words into smaller chunks
       *
       * @param {String} str Mime encoded string to be split up
       * @param {Number} maxlen Maximum length of characters for one part (minimum 12)
       * @return {Array} Split string
       */
      splitMimeEncodedString: (str, maxlen) => {
        let curLine, match, chr, done, lines = [];
        for (maxlen = Math.max(maxlen || 0, 12); str.length; ) {
          for (curLine = str.substr(0, maxlen), (match = curLine.match(/[=][0-9A-F]?$/i)) && (curLine = curLine.substr(0, match.index)), done = !1; !done; )
            done = !0, (match = str.substr(curLine.length).match(/^[=]([0-9A-F]{2})/i)) && (chr = parseInt(match[1], 16), chr < 194 && chr > 127 && (curLine = curLine.substr(0, curLine.length - 3), done = !1));
          curLine.length && lines.push(curLine), str = str.substr(curLine.length);
        }
        return lines;
      },
      encodeURICharComponent: (chr) => {
        let res = "", ord = chr.charCodeAt(0).toString(16).toUpperCase();
        if (ord.length % 2 && (ord = "0" + ord), ord.length > 2)
          for (let i = 0, len = ord.length / 2; i < len; i++)
            res += "%" + ord.substr(i, 2);
        else
          res += "%" + ord;
        return res;
      },
      safeEncodeURIComponent(str) {
        str = (str || "").toString();
        try {
          str = encodeURIComponent(str);
        } catch {
          return str.replace(/[^\x00-\x1F *'()<>@,;:\\"[\]?=\u007F-\uFFFF]+/g, "");
        }
        return str.replace(/[\x00-\x1F *'()<>@,;:\\"[\]?=\u007F-\uFFFF]/g, (chr) => this.encodeURICharComponent(chr));
      }
    };
  }
});

// node_modules/nodemailer/lib/addressparser/index.js
var require_addressparser = __commonJS({
  "node_modules/nodemailer/lib/addressparser/index.js"(exports2, module2) {
    "use strict";
    function _handleAddress(tokens) {
      let isGroup = !1, state = "text", address, addresses = [], data = {
        address: [],
        comment: [],
        group: [],
        text: []
      }, i, len;
      for (i = 0, len = tokens.length; i < len; i++) {
        let token = tokens[i], prevToken = i ? tokens[i - 1] : null;
        if (token.type === "operator")
          switch (token.value) {
            case "<":
              state = "address";
              break;
            case "(":
              state = "comment";
              break;
            case ":":
              state = "group", isGroup = !0;
              break;
            default:
              state = "text";
              break;
          }
        else token.value && (state === "address" && (token.value = token.value.replace(/^[^<]*<\s*/, "")), prevToken && prevToken.noBreak && data[state].length ? data[state][data[state].length - 1] += token.value : data[state].push(token.value));
      }
      if (!data.text.length && data.comment.length && (data.text = data.comment, data.comment = []), isGroup)
        data.text = data.text.join(" "), addresses.push({
          name: data.text || address && address.name,
          group: data.group.length ? addressparser(data.group.join(",")) : []
        });
      else {
        if (!data.address.length && data.text.length) {
          for (i = data.text.length - 1; i >= 0; i--)
            if (data.text[i].match(/^[^@\s]+@[^@\s]+$/)) {
              data.address = data.text.splice(i, 1);
              break;
            }
          let _regexHandler = function(address2) {
            return data.address.length ? address2 : (data.address = [address2.trim()], " ");
          };
          if (!data.address.length)
            for (i = data.text.length - 1; i >= 0 && (data.text[i] = data.text[i].replace(/\s*\b[^@\s]+@[^\s]+\b\s*/, _regexHandler).trim(), !data.address.length); i--)
              ;
        }
        if (!data.text.length && data.comment.length && (data.text = data.comment, data.comment = []), data.address.length > 1 && (data.text = data.text.concat(data.address.splice(1))), data.text = data.text.join(" "), data.address = data.address.join(" "), !data.address && isGroup)
          return [];
        address = {
          address: data.address || data.text || "",
          name: data.text || data.address || ""
        }, address.address === address.name && ((address.address || "").match(/@/) ? address.name = "" : address.address = ""), addresses.push(address);
      }
      return addresses;
    }
    var Tokenizer = class {
      constructor(str) {
        this.str = (str || "").toString(), this.operatorCurrent = "", this.operatorExpecting = "", this.node = null, this.escaped = !1, this.list = [], this.operators = {
          '"': '"',
          "(": ")",
          "<": ">",
          ",": "",
          ":": ";",
          // Semicolons are not a legal delimiter per the RFC2822 grammar other
          // than for terminating a group, but they are also not valid for any
          // other use in this context.  Given that some mail clients have
          // historically allowed the semicolon as a delimiter equivalent to the
          // comma in their UI, it makes sense to treat them the same as a comma
          // when used outside of a group.
          ";": ""
        };
      }
      /**
       * Tokenizes the original input string
       *
       * @return {Array} An array of operator|text tokens
       */
      tokenize() {
        let list = [];
        for (let i = 0, len = this.str.length; i < len; i++) {
          let chr = this.str.charAt(i), nextChr = i < len - 1 ? this.str.charAt(i + 1) : null;
          this.checkChar(chr, nextChr);
        }
        return this.list.forEach((node) => {
          node.value = (node.value || "").toString().trim(), node.value && list.push(node);
        }), list;
      }
      /**
       * Checks if a character is an operator or text and acts accordingly
       *
       * @param {String} chr Character from the address field
       */
      checkChar(chr, nextChr) {
        if (!this.escaped) {
          if (chr === this.operatorExpecting) {
            this.node = {
              type: "operator",
              value: chr
            }, nextChr && ![" ", "	", "\r", `
`, ",", ";"].includes(nextChr) && (this.node.noBreak = !0), this.list.push(this.node), this.node = null, this.operatorExpecting = "", this.escaped = !1;
            return;
          } else if (!this.operatorExpecting && chr in this.operators) {
            this.node = {
              type: "operator",
              value: chr
            }, this.list.push(this.node), this.node = null, this.operatorExpecting = this.operators[chr], this.escaped = !1;
            return;
          } else if (['"', "'"].includes(this.operatorExpecting) && chr === "\\") {
            this.escaped = !0;
            return;
          }
        }
        this.node || (this.node = {
          type: "text",
          value: ""
        }, this.list.push(this.node)), chr === `
` && (chr = " "), (chr.charCodeAt(0) >= 33 || [" ", "	"].includes(chr)) && (this.node.value += chr), this.escaped = !1;
      }
    };
    function addressparser(str, options) {
      options = options || {};
      let tokens = new Tokenizer(str).tokenize(), addresses = [], address = [], parsedAddresses = [];
      if (tokens.forEach((token) => {
        token.type === "operator" && (token.value === "," || token.value === ";") ? (address.length && addresses.push(address), address = []) : address.push(token);
      }), address.length && addresses.push(address), addresses.forEach((address2) => {
        address2 = _handleAddress(address2), address2.length && (parsedAddresses = parsedAddresses.concat(address2));
      }), options.flatten) {
        let addresses2 = [], walkAddressList = (list) => {
          list.forEach((address2) => {
            if (address2.group)
              return walkAddressList(address2.group);
            addresses2.push(address2);
          });
        };
        return walkAddressList(parsedAddresses), addresses2;
      }
      return parsedAddresses;
    }
    module2.exports = addressparser;
  }
});

// node_modules/nodemailer/lib/mime-node/last-newline.js
var require_last_newline = __commonJS({
  "node_modules/nodemailer/lib/mime-node/last-newline.js"(exports2, module2) {
    "use strict";
    var Transform = require("stream").Transform, LastNewline = class extends Transform {
      constructor() {
        super(), this.lastByte = !1;
      }
      _transform(chunk, encoding, done) {
        chunk.length && (this.lastByte = chunk[chunk.length - 1]), this.push(chunk), done();
      }
      _flush(done) {
        return this.lastByte === 10 ? done() : this.lastByte === 13 ? (this.push(Buffer.from(`
`)), done()) : (this.push(Buffer.from(`\r
`)), done());
      }
    };
    module2.exports = LastNewline;
  }
});

// node_modules/nodemailer/lib/mime-node/le-windows.js
var require_le_windows = __commonJS({
  "node_modules/nodemailer/lib/mime-node/le-windows.js"(exports2, module2) {
    "use strict";
    var stream = require("stream"), Transform = stream.Transform, LeWindows = class extends Transform {
      constructor(options) {
        super(options), this.options = options || {}, this.lastByte = !1;
      }
      /**
       * Escapes dots
       */
      _transform(chunk, encoding, done) {
        let buf, lastPos = 0;
        for (let i = 0, len = chunk.length; i < len; i++)
          chunk[i] === 10 && (i && chunk[i - 1] !== 13 || !i && this.lastByte !== 13) && (i > lastPos && (buf = chunk.slice(lastPos, i), this.push(buf)), this.push(Buffer.from(`\r
`)), lastPos = i + 1);
        lastPos && lastPos < chunk.length ? (buf = chunk.slice(lastPos), this.push(buf)) : lastPos || this.push(chunk), this.lastByte = chunk[chunk.length - 1], done();
      }
    };
    module2.exports = LeWindows;
  }
});

// node_modules/nodemailer/lib/mime-node/le-unix.js
var require_le_unix = __commonJS({
  "node_modules/nodemailer/lib/mime-node/le-unix.js"(exports2, module2) {
    "use strict";
    var stream = require("stream"), Transform = stream.Transform, LeWindows = class extends Transform {
      constructor(options) {
        super(options), this.options = options || {};
      }
      /**
       * Escapes dots
       */
      _transform(chunk, encoding, done) {
        let buf, lastPos = 0;
        for (let i = 0, len = chunk.length; i < len; i++)
          chunk[i] === 13 && (buf = chunk.slice(lastPos, i), lastPos = i + 1, this.push(buf));
        lastPos && lastPos < chunk.length ? (buf = chunk.slice(lastPos), this.push(buf)) : lastPos || this.push(chunk), done();
      }
    };
    module2.exports = LeWindows;
  }
});

// node_modules/nodemailer/lib/mime-node/index.js
var require_mime_node = __commonJS({
  "node_modules/nodemailer/lib/mime-node/index.js"(exports2, module2) {
    "use strict";
    var crypto2 = require("crypto"), fs = require("fs"), punycode = require_punycode(), PassThrough = require("stream").PassThrough, shared = require_shared(), mimeFuncs = require_mime_funcs(), qp = require_qp(), base64 = require_base64(), addressparser = require_addressparser(), nmfetch = require_fetch(), LastNewline = require_last_newline(), LeWindows = require_le_windows(), LeUnix = require_le_unix(), MimeNode = class _MimeNode {
      constructor(contentType, options) {
        this.nodeCounter = 0, options = options || {}, this.baseBoundary = options.baseBoundary || crypto2.randomBytes(8).toString("hex"), this.boundaryPrefix = options.boundaryPrefix || "--_NmP", this.disableFileAccess = !!options.disableFileAccess, this.disableUrlAccess = !!options.disableUrlAccess, this.normalizeHeaderKey = options.normalizeHeaderKey, this.date = /* @__PURE__ */ new Date(), this.rootNode = options.rootNode || this, this.keepBcc = !!options.keepBcc, options.filename && (this.filename = options.filename, contentType || (contentType = mimeFuncs.detectMimeType(this.filename.split(".").pop()))), this.textEncoding = (options.textEncoding || "").toString().trim().charAt(0).toUpperCase(), this.parentNode = options.parentNode, this.hostname = options.hostname, this.newline = options.newline, this.childNodes = [], this._nodeId = ++this.rootNode.nodeCounter, this._headers = [], this._isPlainText = !1, this._hasLongLines = !1, this._envelope = !1, this._raw = !1, this._transforms = [], this._processFuncs = [], contentType && this.setHeader("Content-Type", contentType);
      }
      /////// PUBLIC METHODS
      /**
       * Creates and appends a child node.Arguments provided are passed to MimeNode constructor
       *
       * @param {String} [contentType] Optional content type
       * @param {Object} [options] Optional options object
       * @return {Object} Created node object
       */
      createChild(contentType, options) {
        !options && typeof contentType == "object" && (options = contentType, contentType = void 0);
        let node = new _MimeNode(contentType, options);
        return this.appendChild(node), node;
      }
      /**
       * Appends an existing node to the mime tree. Removes the node from an existing
       * tree if needed
       *
       * @param {Object} childNode node to be appended
       * @return {Object} Appended node object
       */
      appendChild(childNode) {
        return childNode.rootNode !== this.rootNode && (childNode.rootNode = this.rootNode, childNode._nodeId = ++this.rootNode.nodeCounter), childNode.parentNode = this, this.childNodes.push(childNode), childNode;
      }
      /**
       * Replaces current node with another node
       *
       * @param {Object} node Replacement node
       * @return {Object} Replacement node
       */
      replace(node) {
        return node === this ? this : (this.parentNode.childNodes.forEach((childNode, i) => {
          childNode === this && (node.rootNode = this.rootNode, node.parentNode = this.parentNode, node._nodeId = this._nodeId, this.rootNode = this, this.parentNode = void 0, node.parentNode.childNodes[i] = node);
        }), node);
      }
      /**
       * Removes current node from the mime tree
       *
       * @return {Object} removed node
       */
      remove() {
        if (!this.parentNode)
          return this;
        for (let i = this.parentNode.childNodes.length - 1; i >= 0; i--)
          if (this.parentNode.childNodes[i] === this)
            return this.parentNode.childNodes.splice(i, 1), this.parentNode = void 0, this.rootNode = this, this;
      }
      /**
       * Sets a header value. If the value for selected key exists, it is overwritten.
       * You can set multiple values as well by using [{key:'', value:''}] or
       * {key: 'value'} as the first argument.
       *
       * @param {String|Array|Object} key Header key or a list of key value pairs
       * @param {String} value Header value
       * @return {Object} current node
       */
      setHeader(key, value) {
        let added = !1, headerValue;
        if (!value && key && typeof key == "object")
          return key.key && "value" in key ? this.setHeader(key.key, key.value) : Array.isArray(key) ? key.forEach((i) => {
            this.setHeader(i.key, i.value);
          }) : Object.keys(key).forEach((i) => {
            this.setHeader(i, key[i]);
          }), this;
        key = this._normalizeHeaderKey(key), headerValue = {
          key,
          value
        };
        for (let i = 0, len = this._headers.length; i < len; i++)
          this._headers[i].key === key && (added ? (this._headers.splice(i, 1), i--, len--) : (this._headers[i] = headerValue, added = !0));
        return added || this._headers.push(headerValue), this;
      }
      /**
       * Adds a header value. If the value for selected key exists, the value is appended
       * as a new field and old one is not touched.
       * You can set multiple values as well by using [{key:'', value:''}] or
       * {key: 'value'} as the first argument.
       *
       * @param {String|Array|Object} key Header key or a list of key value pairs
       * @param {String} value Header value
       * @return {Object} current node
       */
      addHeader(key, value) {
        return !value && key && typeof key == "object" ? (key.key && key.value ? this.addHeader(key.key, key.value) : Array.isArray(key) ? key.forEach((i) => {
          this.addHeader(i.key, i.value);
        }) : Object.keys(key).forEach((i) => {
          this.addHeader(i, key[i]);
        }), this) : Array.isArray(value) ? (value.forEach((val) => {
          this.addHeader(key, val);
        }), this) : (this._headers.push({
          key: this._normalizeHeaderKey(key),
          value
        }), this);
      }
      /**
       * Retrieves the first mathcing value of a selected key
       *
       * @param {String} key Key to search for
       * @retun {String} Value for the key
       */
      getHeader(key) {
        key = this._normalizeHeaderKey(key);
        for (let i = 0, len = this._headers.length; i < len; i++)
          if (this._headers[i].key === key)
            return this._headers[i].value;
      }
      /**
       * Sets body content for current node. If the value is a string, charset is added automatically
       * to Content-Type (if it is text/*). If the value is a Buffer, you need to specify
       * the charset yourself
       *
       * @param (String|Buffer) content Body content
       * @return {Object} current node
       */
      setContent(content) {
        return this.content = content, typeof this.content.pipe == "function" ? (this._contentErrorHandler = (err) => {
          this.content.removeListener("error", this._contentErrorHandler), this.content = err;
        }, this.content.once("error", this._contentErrorHandler)) : typeof this.content == "string" && (this._isPlainText = mimeFuncs.isPlainText(this.content), this._isPlainText && mimeFuncs.hasLongerLines(this.content, 76) && (this._hasLongLines = !0)), this;
      }
      build(callback) {
        let promise;
        callback || (promise = new Promise((resolve, reject) => {
          callback = shared.callbackPromise(resolve, reject);
        }));
        let stream = this.createReadStream(), buf = [], buflen = 0, returned = !1;
        return stream.on("readable", () => {
          let chunk;
          for (; (chunk = stream.read()) !== null; )
            buf.push(chunk), buflen += chunk.length;
        }), stream.once("error", (err) => {
          if (!returned)
            return returned = !0, callback(err);
        }), stream.once("end", (chunk) => {
          if (!returned)
            return returned = !0, chunk && chunk.length && (buf.push(chunk), buflen += chunk.length), callback(null, Buffer.concat(buf, buflen));
        }), promise;
      }
      getTransferEncoding() {
        let transferEncoding = !1, contentType = (this.getHeader("Content-Type") || "").toString().toLowerCase().trim();
        return this.content && (transferEncoding = (this.getHeader("Content-Transfer-Encoding") || "").toString().toLowerCase().trim(), (!transferEncoding || !["base64", "quoted-printable"].includes(transferEncoding)) && (/^text\//i.test(contentType) ? this._isPlainText && !this._hasLongLines ? transferEncoding = "7bit" : typeof this.content == "string" || this.content instanceof Buffer ? transferEncoding = this._getTextEncoding(this.content) === "Q" ? "quoted-printable" : "base64" : transferEncoding = this.textEncoding === "B" ? "base64" : "quoted-printable" : /^(multipart|message)\//i.test(contentType) || (transferEncoding = transferEncoding || "base64"))), transferEncoding;
      }
      /**
       * Builds the header block for the mime node. Append \r\n\r\n before writing the content
       *
       * @returns {String} Headers
       */
      buildHeaders() {
        let transferEncoding = this.getTransferEncoding(), headers = [];
        if (transferEncoding && this.setHeader("Content-Transfer-Encoding", transferEncoding), this.filename && !this.getHeader("Content-Disposition") && this.setHeader("Content-Disposition", "attachment"), this.rootNode === this) {
          this.getHeader("Date") || this.setHeader("Date", this.date.toUTCString().replace(/GMT/, "+0000")), this.messageId(), this.getHeader("MIME-Version") || this.setHeader("MIME-Version", "1.0");
          for (let i = this._headers.length - 2; i >= 0; i--) {
            let header = this._headers[i];
            header.key === "Content-Type" && (this._headers.splice(i, 1), this._headers.push(header));
          }
        }
        return this._headers.forEach((header) => {
          let key = header.key, value = header.value, structured, param, options = {};
          if (!(value && typeof value == "object" && !["From", "Sender", "To", "Cc", "Bcc", "Reply-To", "Date", "References"].includes(key) && (Object.keys(value).forEach((key2) => {
            key2 !== "value" && (options[key2] = value[key2]);
          }), value = (value.value || "").toString(), !value.trim()))) {
            if (options.prepared) {
              options.foldLines ? headers.push(mimeFuncs.foldLines(key + ": " + value)) : headers.push(key + ": " + value);
              return;
            }
            switch (header.key) {
              case "Content-Disposition":
                structured = mimeFuncs.parseHeaderValue(value), this.filename && (structured.params.filename = this.filename), value = mimeFuncs.buildHeaderValue(structured);
                break;
              case "Content-Type":
                structured = mimeFuncs.parseHeaderValue(value), this._handleContentType(structured), structured.value.match(/^text\/plain\b/) && typeof this.content == "string" && /[\u0080-\uFFFF]/.test(this.content) && (structured.params.charset = "utf-8"), value = mimeFuncs.buildHeaderValue(structured), this.filename && (param = this._encodeWords(this.filename), (param !== this.filename || /[\s'"\\;:/=(),<>@[\]?]|^-/.test(param)) && (param = '"' + param + '"'), value += "; name=" + param);
                break;
              case "Bcc":
                if (!this.keepBcc)
                  return;
                break;
            }
            if (value = this._encodeHeaderValue(key, value), !!(value || "").toString().trim()) {
              if (typeof this.normalizeHeaderKey == "function") {
                let normalized = this.normalizeHeaderKey(key, value);
                normalized && typeof normalized == "string" && normalized.length && (key = normalized);
              }
              headers.push(mimeFuncs.foldLines(key + ": " + value, 76));
            }
          }
        }), headers.join(`\r
`);
      }
      /**
       * Streams the rfc2822 message from the current node. If this is a root node,
       * mandatory header fields are set if missing (Date, Message-Id, MIME-Version)
       *
       * @return {String} Compiled message
       */
      createReadStream(options) {
        options = options || {};
        let stream = new PassThrough(options), outputStream = stream, transform;
        this.stream(stream, options, (err) => {
          if (err) {
            outputStream.emit("error", err);
            return;
          }
          stream.end();
        });
        for (let i = 0, len = this._transforms.length; i < len; i++)
          transform = typeof this._transforms[i] == "function" ? this._transforms[i]() : this._transforms[i], outputStream.once("error", (err) => {
            transform.emit("error", err);
          }), outputStream = outputStream.pipe(transform);
        transform = new LastNewline(), outputStream.once("error", (err) => {
          transform.emit("error", err);
        }), outputStream = outputStream.pipe(transform);
        for (let i = 0, len = this._processFuncs.length; i < len; i++)
          transform = this._processFuncs[i], outputStream = transform(outputStream);
        if (this.newline) {
          let newlineTransform = ["win", "windows", "dos", `\r
`].includes(this.newline.toString().toLowerCase()) ? new LeWindows() : new LeUnix(), stream2 = outputStream.pipe(newlineTransform);
          return outputStream.on("error", (err) => stream2.emit("error", err)), stream2;
        }
        return outputStream;
      }
      /**
       * Appends a transform stream object to the transforms list. Final output
       * is passed through this stream before exposing
       *
       * @param {Object} transform Read-Write stream
       */
      transform(transform) {
        this._transforms.push(transform);
      }
      /**
       * Appends a post process function. The functon is run after transforms and
       * uses the following syntax
       *
       *   processFunc(input) -> outputStream
       *
       * @param {Object} processFunc Read-Write stream
       */
      processFunc(processFunc) {
        this._processFuncs.push(processFunc);
      }
      stream(outputStream, options, done) {
        let transferEncoding = this.getTransferEncoding(), contentStream, localStream, returned = !1, callback = (err) => {
          returned || (returned = !0, done(err));
        }, finalize = () => {
          let childId = 0, processChildNode = () => {
            if (childId >= this.childNodes.length)
              return outputStream.write(`\r
--` + this.boundary + `--\r
`), callback();
            let child = this.childNodes[childId++];
            outputStream.write((childId > 1 ? `\r
` : "") + "--" + this.boundary + `\r
`), child.stream(outputStream, options, (err) => {
              if (err)
                return callback(err);
              setImmediate(processChildNode);
            });
          };
          if (this.multipart)
            setImmediate(processChildNode);
          else
            return callback();
        }, sendContent = () => {
          if (this.content) {
            if (Object.prototype.toString.call(this.content) === "[object Error]")
              return callback(this.content);
            typeof this.content.pipe == "function" && (this.content.removeListener("error", this._contentErrorHandler), this._contentErrorHandler = (err) => callback(err), this.content.once("error", this._contentErrorHandler));
            let createStream = () => {
              ["quoted-printable", "base64"].includes(transferEncoding) ? (contentStream = new (transferEncoding === "base64" ? base64 : qp).Encoder(options), contentStream.pipe(outputStream, {
                end: !1
              }), contentStream.once("end", finalize), contentStream.once("error", (err) => callback(err)), localStream = this._getStream(this.content), localStream.pipe(contentStream)) : (localStream = this._getStream(this.content), localStream.pipe(outputStream, {
                end: !1
              }), localStream.once("end", finalize)), localStream.once("error", (err) => callback(err));
            };
            if (this.content._resolve) {
              let chunks = [], chunklen = 0, returned2 = !1, sourceStream = this._getStream(this.content);
              sourceStream.on("error", (err) => {
                returned2 || (returned2 = !0, callback(err));
              }), sourceStream.on("readable", () => {
                let chunk;
                for (; (chunk = sourceStream.read()) !== null; )
                  chunks.push(chunk), chunklen += chunk.length;
              }), sourceStream.on("end", () => {
                returned2 || (returned2 = !0, this.content._resolve = !1, this.content._resolvedValue = Buffer.concat(chunks, chunklen), setImmediate(createStream));
              });
            } else
              setImmediate(createStream);
            return;
          } else
            return setImmediate(finalize);
        };
        this._raw ? setImmediate(() => {
          if (Object.prototype.toString.call(this._raw) === "[object Error]")
            return callback(this._raw);
          typeof this._raw.pipe == "function" && this._raw.removeListener("error", this._contentErrorHandler);
          let raw = this._getStream(this._raw);
          raw.pipe(outputStream, {
            end: !1
          }), raw.on("error", (err) => outputStream.emit("error", err)), raw.on("end", finalize);
        }) : (outputStream.write(this.buildHeaders() + `\r
\r
`), setImmediate(sendContent));
      }
      /**
       * Sets envelope to be used instead of the generated one
       *
       * @return {Object} SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
       */
      setEnvelope(envelope) {
        let list;
        this._envelope = {
          from: !1,
          to: []
        }, envelope.from && (list = [], this._convertAddresses(this._parseAddresses(envelope.from), list), list = list.filter((address) => address && address.address), list.length && list[0] && (this._envelope.from = list[0].address)), ["to", "cc", "bcc"].forEach((key) => {
          envelope[key] && this._convertAddresses(this._parseAddresses(envelope[key]), this._envelope.to);
        }), this._envelope.to = this._envelope.to.map((to) => to.address).filter((address) => address);
        let standardFields = ["to", "cc", "bcc", "from"];
        return Object.keys(envelope).forEach((key) => {
          standardFields.includes(key) || (this._envelope[key] = envelope[key]);
        }), this;
      }
      /**
       * Generates and returns an object with parsed address fields
       *
       * @return {Object} Address object
       */
      getAddresses() {
        let addresses = {};
        return this._headers.forEach((header) => {
          let key = header.key.toLowerCase();
          ["from", "sender", "reply-to", "to", "cc", "bcc"].includes(key) && (Array.isArray(addresses[key]) || (addresses[key] = []), this._convertAddresses(this._parseAddresses(header.value), addresses[key]));
        }), addresses;
      }
      /**
       * Generates and returns SMTP envelope with the sender address and a list of recipients addresses
       *
       * @return {Object} SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
       */
      getEnvelope() {
        if (this._envelope)
          return this._envelope;
        let envelope = {
          from: !1,
          to: []
        };
        return this._headers.forEach((header) => {
          let list = [];
          header.key === "From" || !envelope.from && ["Reply-To", "Sender"].includes(header.key) ? (this._convertAddresses(this._parseAddresses(header.value), list), list.length && list[0] && (envelope.from = list[0].address)) : ["To", "Cc", "Bcc"].includes(header.key) && this._convertAddresses(this._parseAddresses(header.value), envelope.to);
        }), envelope.to = envelope.to.map((to) => to.address), envelope;
      }
      /**
       * Returns Message-Id value. If it does not exist, then creates one
       *
       * @return {String} Message-Id value
       */
      messageId() {
        let messageId = this.getHeader("Message-ID");
        return messageId || (messageId = this._generateMessageId(), this.setHeader("Message-ID", messageId)), messageId;
      }
      /**
       * Sets pregenerated content that will be used as the output of this node
       *
       * @param {String|Buffer|Stream} Raw MIME contents
       */
      setRaw(raw) {
        return this._raw = raw, this._raw && typeof this._raw.pipe == "function" && (this._contentErrorHandler = (err) => {
          this._raw.removeListener("error", this._contentErrorHandler), this._raw = err;
        }, this._raw.once("error", this._contentErrorHandler)), this;
      }
      /////// PRIVATE METHODS
      /**
       * Detects and returns handle to a stream related with the content.
       *
       * @param {Mixed} content Node content
       * @returns {Object} Stream object
       */
      _getStream(content) {
        let contentStream;
        return content._resolvedValue ? (contentStream = new PassThrough(), setImmediate(() => {
          try {
            contentStream.end(content._resolvedValue);
          } catch (err) {
            contentStream.emit("error", err);
          }
        }), contentStream) : typeof content.pipe == "function" ? content : content && typeof content.path == "string" && !content.href ? this.disableFileAccess ? (contentStream = new PassThrough(), setImmediate(() => contentStream.emit("error", new Error("File access rejected for " + content.path))), contentStream) : fs.createReadStream(content.path) : content && typeof content.href == "string" ? this.disableUrlAccess ? (contentStream = new PassThrough(), setImmediate(() => contentStream.emit("error", new Error("Url access rejected for " + content.href))), contentStream) : nmfetch(content.href, { headers: content.httpHeaders }) : (contentStream = new PassThrough(), setImmediate(() => {
          try {
            contentStream.end(content || "");
          } catch (err) {
            contentStream.emit("error", err);
          }
        }), contentStream);
      }
      /**
       * Parses addresses. Takes in a single address or an array or an
       * array of address arrays (eg. To: [[first group], [second group],...])
       *
       * @param {Mixed} addresses Addresses to be parsed
       * @return {Array} An array of address objects
       */
      _parseAddresses(addresses) {
        return [].concat.apply(
          [],
          [].concat(addresses).map((address) => address && address.address ? (address.address = this._normalizeAddress(address.address), address.name = address.name || "", [address]) : addressparser(address))
        );
      }
      /**
       * Normalizes a header key, uses Camel-Case form, except for uppercase MIME-
       *
       * @param {String} key Key to be normalized
       * @return {String} key in Camel-Case form
       */
      _normalizeHeaderKey(key) {
        return key = (key || "").toString().replace(/\r?\n|\r/g, " ").trim().toLowerCase().replace(/^X-SMTPAPI$|^(MIME|DKIM|ARC|BIMI)\b|^[a-z]|-(SPF|FBL|ID|MD5)$|-[a-z]/gi, (c) => c.toUpperCase()).replace(/^Content-Features$/i, "Content-features"), key;
      }
      /**
       * Checks if the content type is multipart and defines boundary if needed.
       * Doesn't return anything, modifies object argument instead.
       *
       * @param {Object} structured Parsed header value for 'Content-Type' key
       */
      _handleContentType(structured) {
        this.contentType = structured.value.trim().toLowerCase(), this.multipart = /^multipart\//i.test(this.contentType) ? this.contentType.substr(this.contentType.indexOf("/") + 1) : !1, this.multipart ? this.boundary = structured.params.boundary = structured.params.boundary || this.boundary || this._generateBoundary() : this.boundary = !1;
      }
      /**
       * Generates a multipart boundary value
       *
       * @return {String} boundary value
       */
      _generateBoundary() {
        return this.rootNode.boundaryPrefix + "-" + this.rootNode.baseBoundary + "-Part_" + this._nodeId;
      }
      /**
       * Encodes a header value for use in the generated rfc2822 email.
       *
       * @param {String} key Header key
       * @param {String} value Header value
       */
      _encodeHeaderValue(key, value) {
        switch (key = this._normalizeHeaderKey(key), key) {
          // Structured headers
          case "From":
          case "Sender":
          case "To":
          case "Cc":
          case "Bcc":
          case "Reply-To":
            return this._convertAddresses(this._parseAddresses(value));
          // values enclosed in <>
          case "Message-ID":
          case "In-Reply-To":
          case "Content-Id":
            return value = (value || "").toString().replace(/\r?\n|\r/g, " "), value.charAt(0) !== "<" && (value = "<" + value), value.charAt(value.length - 1) !== ">" && (value = value + ">"), value;
          // space separated list of values enclosed in <>
          case "References":
            return value = [].concat.apply(
              [],
              [].concat(value || "").map((elm) => (elm = (elm || "").toString().replace(/\r?\n|\r/g, " ").trim(), elm.replace(/<[^>]*>/g, (str) => str.replace(/\s/g, "")).split(/\s+/)))
            ).map((elm) => (elm.charAt(0) !== "<" && (elm = "<" + elm), elm.charAt(elm.length - 1) !== ">" && (elm = elm + ">"), elm)), value.join(" ").trim();
          case "Date":
            return Object.prototype.toString.call(value) === "[object Date]" ? value.toUTCString().replace(/GMT/, "+0000") : (value = (value || "").toString().replace(/\r?\n|\r/g, " "), this._encodeWords(value));
          case "Content-Type":
          case "Content-Disposition":
            return (value || "").toString().replace(/\r?\n|\r/g, " ");
          default:
            return value = (value || "").toString().replace(/\r?\n|\r/g, " "), this._encodeWords(value);
        }
      }
      /**
       * Rebuilds address object using punycode and other adjustments
       *
       * @param {Array} addresses An array of address objects
       * @param {Array} [uniqueList] An array to be populated with addresses
       * @return {String} address string
       */
      _convertAddresses(addresses, uniqueList) {
        let values = [];
        return uniqueList = uniqueList || [], [].concat(addresses || []).forEach((address) => {
          if (address.address)
            address.address = this._normalizeAddress(address.address), address.name ? address.name && values.push(`${this._encodeAddressName(address.name)} <${address.address}>`) : values.push(address.address.indexOf(" ") >= 0 ? `<${address.address}>` : `${address.address}`), address.address && (uniqueList.filter((a) => a.address === address.address).length || uniqueList.push(address));
          else if (address.group) {
            let groupListAddresses = (address.group.length ? this._convertAddresses(address.group, uniqueList) : "").trim();
            values.push(`${this._encodeAddressName(address.name)}:${groupListAddresses};`);
          }
        }), values.join(", ");
      }
      /**
       * Normalizes an email address
       *
       * @param {Array} address An array of address objects
       * @return {String} address string
       */
      _normalizeAddress(address) {
        address = (address || "").toString().replace(/[\x00-\x1F<>]+/g, " ").trim();
        let lastAt = address.lastIndexOf("@");
        if (lastAt < 0)
          return address;
        let user = address.substr(0, lastAt), domain = address.substr(lastAt + 1), encodedDomain;
        try {
          encodedDomain = punycode.toASCII(domain.toLowerCase());
        } catch {
        }
        return user.indexOf(" ") >= 0 && (user.charAt(0) !== '"' && (user = '"' + user), user.substr(-1) !== '"' && (user = user + '"')), `${user}@${encodedDomain}`;
      }
      /**
       * If needed, mime encodes the name part
       *
       * @param {String} name Name part of an address
       * @returns {String} Mime word encoded string if needed
       */
      _encodeAddressName(name) {
        return /^[\w ]*$/.test(name) ? name : /^[\x20-\x7e]*$/.test(name) ? '"' + name.replace(/([\\"])/g, "\\$1") + '"' : mimeFuncs.encodeWord(name, this._getTextEncoding(name), 52);
      }
      /**
       * If needed, mime encodes the name part
       *
       * @param {String} name Name part of an address
       * @returns {String} Mime word encoded string if needed
       */
      _encodeWords(value) {
        return mimeFuncs.encodeWords(value, this._getTextEncoding(value), 52, !0);
      }
      /**
       * Detects best mime encoding for a text value
       *
       * @param {String} value Value to check for
       * @return {String} either 'Q' or 'B'
       */
      _getTextEncoding(value) {
        value = (value || "").toString();
        let encoding = this.textEncoding, latinLen, nonLatinLen;
        return encoding || (nonLatinLen = (value.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\u0080-\uFFFF]/g) || []).length, latinLen = (value.match(/[a-z]/gi) || []).length, encoding = nonLatinLen < latinLen ? "Q" : "B"), encoding;
      }
      /**
       * Generates a message id
       *
       * @return {String} Random Message-ID value
       */
      _generateMessageId() {
        return "<" + [2, 2, 2, 6].reduce(
          // crux to generate UUID-like random strings
          (prev, len) => prev + "-" + crypto2.randomBytes(len).toString("hex"),
          crypto2.randomBytes(4).toString("hex")
        ) + "@" + // try to use the domain of the FROM address or fallback to server hostname
        (this.getEnvelope().from || this.hostname || "localhost").split("@").pop() + ">";
      }
    };
    module2.exports = MimeNode;
  }
});

// node_modules/nodemailer/lib/mail-composer/index.js
var require_mail_composer = __commonJS({
  "node_modules/nodemailer/lib/mail-composer/index.js"(exports2, module2) {
    "use strict";
    var MimeNode = require_mime_node(), mimeFuncs = require_mime_funcs(), parseDataURI = require_shared().parseDataURI, MailComposer = class {
      constructor(mail) {
        this.mail = mail || {}, this.message = !1;
      }
      /**
       * Builds MimeNode instance
       */
      compile() {
        return this._alternatives = this.getAlternatives(), this._htmlNode = this._alternatives.filter((alternative) => /^text\/html\b/i.test(alternative.contentType)).pop(), this._attachments = this.getAttachments(!!this._htmlNode), this._useRelated = !!(this._htmlNode && this._attachments.related.length), this._useAlternative = this._alternatives.length > 1, this._useMixed = this._attachments.attached.length > 1 || this._alternatives.length && this._attachments.attached.length === 1, this.mail.raw ? this.message = new MimeNode("message/rfc822", { newline: this.mail.newline }).setRaw(this.mail.raw) : this._useMixed ? this.message = this._createMixed() : this._useAlternative ? this.message = this._createAlternative() : this._useRelated ? this.message = this._createRelated() : this.message = this._createContentNode(
          !1,
          [].concat(this._alternatives || []).concat(this._attachments.attached || []).shift() || {
            contentType: "text/plain",
            content: ""
          }
        ), this.mail.headers && this.message.addHeader(this.mail.headers), ["from", "sender", "to", "cc", "bcc", "reply-to", "in-reply-to", "references", "subject", "message-id", "date"].forEach((header) => {
          let key = header.replace(/-(\w)/g, (o, c) => c.toUpperCase());
          this.mail[key] && this.message.setHeader(header, this.mail[key]);
        }), this.mail.envelope && this.message.setEnvelope(this.mail.envelope), this.message.messageId(), this.message;
      }
      /**
       * List all attachments. Resulting attachment objects can be used as input for MimeNode nodes
       *
       * @param {Boolean} findRelated If true separate related attachments from attached ones
       * @returns {Object} An object of arrays (`related` and `attached`)
       */
      getAttachments(findRelated) {
        let icalEvent, eventObject, attachments = [].concat(this.mail.attachments || []).map((attachment, i) => {
          let data, isMessageNode = /^message\//i.test(attachment.contentType);
          /^data:/i.test(attachment.path || attachment.href) && (attachment = this._processDataUrl(attachment));
          let contentType = attachment.contentType || mimeFuncs.detectMimeType(attachment.filename || attachment.path || attachment.href || "bin"), isImage = /^image\//i.test(contentType), contentDisposition = attachment.contentDisposition || (isMessageNode || isImage && attachment.cid ? "inline" : "attachment");
          return data = {
            contentType,
            contentDisposition,
            contentTransferEncoding: "contentTransferEncoding" in attachment ? attachment.contentTransferEncoding : "base64"
          }, attachment.filename ? data.filename = attachment.filename : !isMessageNode && attachment.filename !== !1 && (data.filename = (attachment.path || attachment.href || "").split("/").pop().split("?").shift() || "attachment-" + (i + 1), data.filename.indexOf(".") < 0 && (data.filename += "." + mimeFuncs.detectExtension(data.contentType))), /^https?:\/\//i.test(attachment.path) && (attachment.href = attachment.path, attachment.path = void 0), attachment.cid && (data.cid = attachment.cid), attachment.raw ? data.raw = attachment.raw : attachment.path ? data.content = {
            path: attachment.path
          } : attachment.href ? data.content = {
            href: attachment.href,
            httpHeaders: attachment.httpHeaders
          } : data.content = attachment.content || "", attachment.encoding && (data.encoding = attachment.encoding), attachment.headers && (data.headers = attachment.headers), data;
        });
        return this.mail.icalEvent && (typeof this.mail.icalEvent == "object" && (this.mail.icalEvent.content || this.mail.icalEvent.path || this.mail.icalEvent.href || this.mail.icalEvent.raw) ? icalEvent = this.mail.icalEvent : icalEvent = {
          content: this.mail.icalEvent
        }, eventObject = {}, Object.keys(icalEvent).forEach((key) => {
          eventObject[key] = icalEvent[key];
        }), eventObject.contentType = "application/ics", eventObject.headers || (eventObject.headers = {}), eventObject.filename = eventObject.filename || "invite.ics", eventObject.headers["Content-Disposition"] = "attachment", eventObject.headers["Content-Transfer-Encoding"] = "base64"), findRelated ? {
          attached: attachments.filter((attachment) => !attachment.cid).concat(eventObject || []),
          related: attachments.filter((attachment) => !!attachment.cid)
        } : {
          attached: attachments.concat(eventObject || []),
          related: []
        };
      }
      /**
       * List alternatives. Resulting objects can be used as input for MimeNode nodes
       *
       * @returns {Array} An array of alternative elements. Includes the `text` and `html` values as well
       */
      getAlternatives() {
        let alternatives = [], text, html, watchHtml, amp, icalEvent, eventObject;
        return this.mail.text && (typeof this.mail.text == "object" && (this.mail.text.content || this.mail.text.path || this.mail.text.href || this.mail.text.raw) ? text = this.mail.text : text = {
          content: this.mail.text
        }, text.contentType = "text/plain; charset=utf-8"), this.mail.watchHtml && (typeof this.mail.watchHtml == "object" && (this.mail.watchHtml.content || this.mail.watchHtml.path || this.mail.watchHtml.href || this.mail.watchHtml.raw) ? watchHtml = this.mail.watchHtml : watchHtml = {
          content: this.mail.watchHtml
        }, watchHtml.contentType = "text/watch-html; charset=utf-8"), this.mail.amp && (typeof this.mail.amp == "object" && (this.mail.amp.content || this.mail.amp.path || this.mail.amp.href || this.mail.amp.raw) ? amp = this.mail.amp : amp = {
          content: this.mail.amp
        }, amp.contentType = "text/x-amp-html; charset=utf-8"), this.mail.icalEvent && (typeof this.mail.icalEvent == "object" && (this.mail.icalEvent.content || this.mail.icalEvent.path || this.mail.icalEvent.href || this.mail.icalEvent.raw) ? icalEvent = this.mail.icalEvent : icalEvent = {
          content: this.mail.icalEvent
        }, eventObject = {}, Object.keys(icalEvent).forEach((key) => {
          eventObject[key] = icalEvent[key];
        }), eventObject.content && typeof eventObject.content == "object" && (eventObject.content._resolve = !0), eventObject.filename = !1, eventObject.contentType = "text/calendar; charset=utf-8; method=" + (eventObject.method || "PUBLISH").toString().trim().toUpperCase(), eventObject.headers || (eventObject.headers = {})), this.mail.html && (typeof this.mail.html == "object" && (this.mail.html.content || this.mail.html.path || this.mail.html.href || this.mail.html.raw) ? html = this.mail.html : html = {
          content: this.mail.html
        }, html.contentType = "text/html; charset=utf-8"), [].concat(text || []).concat(watchHtml || []).concat(amp || []).concat(html || []).concat(eventObject || []).concat(this.mail.alternatives || []).forEach((alternative) => {
          let data;
          /^data:/i.test(alternative.path || alternative.href) && (alternative = this._processDataUrl(alternative)), data = {
            contentType: alternative.contentType || mimeFuncs.detectMimeType(alternative.filename || alternative.path || alternative.href || "txt"),
            contentTransferEncoding: alternative.contentTransferEncoding
          }, alternative.filename && (data.filename = alternative.filename), /^https?:\/\//i.test(alternative.path) && (alternative.href = alternative.path, alternative.path = void 0), alternative.raw ? data.raw = alternative.raw : alternative.path ? data.content = {
            path: alternative.path
          } : alternative.href ? data.content = {
            href: alternative.href
          } : data.content = alternative.content || "", alternative.encoding && (data.encoding = alternative.encoding), alternative.headers && (data.headers = alternative.headers), alternatives.push(data);
        }), alternatives;
      }
      /**
       * Builds multipart/mixed node. It should always contain different type of elements on the same level
       * eg. text + attachments
       *
       * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
       * @returns {Object} MimeNode node element
       */
      _createMixed(parentNode) {
        let node;
        return parentNode ? node = parentNode.createChild("multipart/mixed", {
          disableUrlAccess: this.mail.disableUrlAccess,
          disableFileAccess: this.mail.disableFileAccess,
          normalizeHeaderKey: this.mail.normalizeHeaderKey,
          newline: this.mail.newline
        }) : node = new MimeNode("multipart/mixed", {
          baseBoundary: this.mail.baseBoundary,
          textEncoding: this.mail.textEncoding,
          boundaryPrefix: this.mail.boundaryPrefix,
          disableUrlAccess: this.mail.disableUrlAccess,
          disableFileAccess: this.mail.disableFileAccess,
          normalizeHeaderKey: this.mail.normalizeHeaderKey,
          newline: this.mail.newline
        }), this._useAlternative ? this._createAlternative(node) : this._useRelated && this._createRelated(node), [].concat(!this._useAlternative && this._alternatives || []).concat(this._attachments.attached || []).forEach((element) => {
          (!this._useRelated || element !== this._htmlNode) && this._createContentNode(node, element);
        }), node;
      }
      /**
       * Builds multipart/alternative node. It should always contain same type of elements on the same level
       * eg. text + html view of the same data
       *
       * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
       * @returns {Object} MimeNode node element
       */
      _createAlternative(parentNode) {
        let node;
        return parentNode ? node = parentNode.createChild("multipart/alternative", {
          disableUrlAccess: this.mail.disableUrlAccess,
          disableFileAccess: this.mail.disableFileAccess,
          normalizeHeaderKey: this.mail.normalizeHeaderKey,
          newline: this.mail.newline
        }) : node = new MimeNode("multipart/alternative", {
          baseBoundary: this.mail.baseBoundary,
          textEncoding: this.mail.textEncoding,
          boundaryPrefix: this.mail.boundaryPrefix,
          disableUrlAccess: this.mail.disableUrlAccess,
          disableFileAccess: this.mail.disableFileAccess,
          normalizeHeaderKey: this.mail.normalizeHeaderKey,
          newline: this.mail.newline
        }), this._alternatives.forEach((alternative) => {
          this._useRelated && this._htmlNode === alternative ? this._createRelated(node) : this._createContentNode(node, alternative);
        }), node;
      }
      /**
       * Builds multipart/related node. It should always contain html node with related attachments
       *
       * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
       * @returns {Object} MimeNode node element
       */
      _createRelated(parentNode) {
        let node;
        return parentNode ? node = parentNode.createChild('multipart/related; type="text/html"', {
          disableUrlAccess: this.mail.disableUrlAccess,
          disableFileAccess: this.mail.disableFileAccess,
          normalizeHeaderKey: this.mail.normalizeHeaderKey,
          newline: this.mail.newline
        }) : node = new MimeNode('multipart/related; type="text/html"', {
          baseBoundary: this.mail.baseBoundary,
          textEncoding: this.mail.textEncoding,
          boundaryPrefix: this.mail.boundaryPrefix,
          disableUrlAccess: this.mail.disableUrlAccess,
          disableFileAccess: this.mail.disableFileAccess,
          normalizeHeaderKey: this.mail.normalizeHeaderKey,
          newline: this.mail.newline
        }), this._createContentNode(node, this._htmlNode), this._attachments.related.forEach((alternative) => this._createContentNode(node, alternative)), node;
      }
      /**
       * Creates a regular node with contents
       *
       * @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
       * @param {Object} element Node data
       * @returns {Object} MimeNode node element
       */
      _createContentNode(parentNode, element) {
        element = element || {}, element.content = element.content || "";
        let node, encoding = (element.encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
        return parentNode ? node = parentNode.createChild(element.contentType, {
          filename: element.filename,
          textEncoding: this.mail.textEncoding,
          disableUrlAccess: this.mail.disableUrlAccess,
          disableFileAccess: this.mail.disableFileAccess,
          normalizeHeaderKey: this.mail.normalizeHeaderKey,
          newline: this.mail.newline
        }) : node = new MimeNode(element.contentType, {
          filename: element.filename,
          baseBoundary: this.mail.baseBoundary,
          textEncoding: this.mail.textEncoding,
          boundaryPrefix: this.mail.boundaryPrefix,
          disableUrlAccess: this.mail.disableUrlAccess,
          disableFileAccess: this.mail.disableFileAccess,
          normalizeHeaderKey: this.mail.normalizeHeaderKey,
          newline: this.mail.newline
        }), element.headers && node.addHeader(element.headers), element.cid && node.setHeader("Content-Id", "<" + element.cid.replace(/[<>]/g, "") + ">"), element.contentTransferEncoding ? node.setHeader("Content-Transfer-Encoding", element.contentTransferEncoding) : this.mail.encoding && /^text\//i.test(element.contentType) && node.setHeader("Content-Transfer-Encoding", this.mail.encoding), (!/^text\//i.test(element.contentType) || element.contentDisposition) && node.setHeader(
          "Content-Disposition",
          element.contentDisposition || (element.cid && /^image\//i.test(element.contentType) ? "inline" : "attachment")
        ), typeof element.content == "string" && !["utf8", "usascii", "ascii"].includes(encoding) && (element.content = Buffer.from(element.content, encoding)), element.raw ? node.setRaw(element.raw) : node.setContent(element.content), node;
      }
      /**
       * Parses data uri and converts it to a Buffer
       *
       * @param {Object} element Content element
       * @return {Object} Parsed element
       */
      _processDataUrl(element) {
        let parsedDataUri;
        return (element.path || element.href).match(/^data:/) && (parsedDataUri = parseDataURI(element.path || element.href)), parsedDataUri && (element.content = parsedDataUri.data, element.contentType = element.contentType || parsedDataUri.contentType, "path" in element && (element.path = !1), "href" in element && (element.href = !1)), element;
      }
    };
    module2.exports = MailComposer;
  }
});

// node_modules/nodemailer/lib/dkim/message-parser.js
var require_message_parser = __commonJS({
  "node_modules/nodemailer/lib/dkim/message-parser.js"(exports2, module2) {
    "use strict";
    var Transform = require("stream").Transform, MessageParser = class extends Transform {
      constructor(options) {
        super(options), this.lastBytes = Buffer.alloc(4), this.headersParsed = !1, this.headerBytes = 0, this.headerChunks = [], this.rawHeaders = !1, this.bodySize = 0;
      }
      /**
       * Keeps count of the last 4 bytes in order to detect line breaks on chunk boundaries
       *
       * @param {Buffer} data Next data chunk from the stream
       */
      updateLastBytes(data) {
        let lblen = this.lastBytes.length, nblen = Math.min(data.length, lblen);
        for (let i = 0, len = lblen - nblen; i < len; i++)
          this.lastBytes[i] = this.lastBytes[i + nblen];
        for (let i = 1; i <= nblen; i++)
          this.lastBytes[lblen - i] = data[data.length - i];
      }
      /**
       * Finds and removes message headers from the remaining body. We want to keep
       * headers separated until final delivery to be able to modify these
       *
       * @param {Buffer} data Next chunk of data
       * @return {Boolean} Returns true if headers are already found or false otherwise
       */
      checkHeaders(data) {
        if (this.headersParsed)
          return !0;
        let lblen = this.lastBytes.length, headerPos = 0;
        this.curLinePos = 0;
        for (let i = 0, len = this.lastBytes.length + data.length; i < len; i++) {
          let chr;
          if (i < lblen ? chr = this.lastBytes[i] : chr = data[i - lblen], chr === 10 && i) {
            let pr1 = i - 1 < lblen ? this.lastBytes[i - 1] : data[i - 1 - lblen], pr2 = i > 1 ? i - 2 < lblen ? this.lastBytes[i - 2] : data[i - 2 - lblen] : !1;
            if (pr1 === 10) {
              this.headersParsed = !0, headerPos = i - lblen + 1, this.headerBytes += headerPos;
              break;
            } else if (pr1 === 13 && pr2 === 10) {
              this.headersParsed = !0, headerPos = i - lblen + 1, this.headerBytes += headerPos;
              break;
            }
          }
        }
        if (this.headersParsed) {
          if (this.headerChunks.push(data.slice(0, headerPos)), this.rawHeaders = Buffer.concat(this.headerChunks, this.headerBytes), this.headerChunks = null, this.emit("headers", this.parseHeaders()), data.length - 1 > headerPos) {
            let chunk = data.slice(headerPos);
            this.bodySize += chunk.length, setImmediate(() => this.push(chunk));
          }
          return !1;
        } else
          this.headerBytes += data.length, this.headerChunks.push(data);
        return this.updateLastBytes(data), !1;
      }
      _transform(chunk, encoding, callback) {
        if (!chunk || !chunk.length)
          return callback();
        typeof chunk == "string" && (chunk = Buffer.from(chunk, encoding));
        let headersFound;
        try {
          headersFound = this.checkHeaders(chunk);
        } catch (E) {
          return callback(E);
        }
        headersFound && (this.bodySize += chunk.length, this.push(chunk)), setImmediate(callback);
      }
      _flush(callback) {
        if (this.headerChunks) {
          let chunk = Buffer.concat(this.headerChunks, this.headerBytes);
          this.bodySize += chunk.length, this.push(chunk), this.headerChunks = null;
        }
        callback();
      }
      parseHeaders() {
        let lines = (this.rawHeaders || "").toString().split(/\r?\n/);
        for (let i = lines.length - 1; i > 0; i--)
          /^\s/.test(lines[i]) && (lines[i - 1] += `
` + lines[i], lines.splice(i, 1));
        return lines.filter((line) => line.trim()).map((line) => ({
          key: line.substr(0, line.indexOf(":")).trim().toLowerCase(),
          line
        }));
      }
    };
    module2.exports = MessageParser;
  }
});

// node_modules/nodemailer/lib/dkim/relaxed-body.js
var require_relaxed_body = __commonJS({
  "node_modules/nodemailer/lib/dkim/relaxed-body.js"(exports2, module2) {
    "use strict";
    var Transform = require("stream").Transform, crypto2 = require("crypto"), RelaxedBody = class extends Transform {
      constructor(options) {
        super(), options = options || {}, this.chunkBuffer = [], this.chunkBufferLen = 0, this.bodyHash = crypto2.createHash(options.hashAlgo || "sha1"), this.remainder = "", this.byteLength = 0, this.debug = options.debug, this._debugBody = options.debug ? [] : !1;
      }
      updateHash(chunk) {
        let bodyStr, nextRemainder = "", state = "file";
        for (let i = chunk.length - 1; i >= 0; i--) {
          let c = chunk[i];
          if (!(state === "file" && (c === 10 || c === 13))) {
            if (state === "file" && (c === 9 || c === 32))
              state = "line";
            else if (!(state === "line" && (c === 9 || c === 32))) {
              if ((state === "file" || state === "line") && (state = "body", i === chunk.length - 1))
                break;
            }
          }
          if (i === 0) {
            if (state === "file" && (!this.remainder || /[\r\n]$/.test(this.remainder)) || state === "line" && (!this.remainder || /[ \t]$/.test(this.remainder))) {
              this.remainder += chunk.toString("binary");
              return;
            } else if (state === "line" || state === "file") {
              nextRemainder = chunk.toString("binary"), chunk = !1;
              break;
            }
          }
          if (state === "body") {
            nextRemainder = chunk.slice(i + 1).toString("binary"), chunk = chunk.slice(0, i + 1);
            break;
          }
        }
        let needsFixing = !!this.remainder;
        if (chunk && !needsFixing) {
          for (let i = 0, len = chunk.length; i < len; i++)
            if (i && chunk[i] === 10 && chunk[i - 1] !== 13) {
              needsFixing = !0;
              break;
            } else if (i && chunk[i] === 13 && chunk[i - 1] === 32) {
              needsFixing = !0;
              break;
            } else if (i && chunk[i] === 32 && chunk[i - 1] === 32) {
              needsFixing = !0;
              break;
            } else if (chunk[i] === 9) {
              needsFixing = !0;
              break;
            }
        }
        needsFixing ? (bodyStr = this.remainder + (chunk ? chunk.toString("binary") : ""), this.remainder = nextRemainder, bodyStr = bodyStr.replace(/\r?\n/g, `
`).replace(/[ \t]*$/gm, "").replace(/[ \t]+/gm, " ").replace(/\n/g, `\r
`), chunk = Buffer.from(bodyStr, "binary")) : nextRemainder && (this.remainder = nextRemainder), this.debug && this._debugBody.push(chunk), this.bodyHash.update(chunk);
      }
      _transform(chunk, encoding, callback) {
        if (!chunk || !chunk.length)
          return callback();
        typeof chunk == "string" && (chunk = Buffer.from(chunk, encoding)), this.updateHash(chunk), this.byteLength += chunk.length, this.push(chunk), callback();
      }
      _flush(callback) {
        /[\r\n]$/.test(this.remainder) && this.byteLength > 2 && this.bodyHash.update(Buffer.from(`\r
`)), this.byteLength || this.push(Buffer.from(`\r
`)), this.emit("hash", this.bodyHash.digest("base64"), this.debug ? Buffer.concat(this._debugBody) : !1), callback();
      }
    };
    module2.exports = RelaxedBody;
  }
});

// node_modules/nodemailer/lib/dkim/sign.js
var require_sign = __commonJS({
  "node_modules/nodemailer/lib/dkim/sign.js"(exports2, module2) {
    "use strict";
    var punycode = require_punycode(), mimeFuncs = require_mime_funcs(), crypto2 = require("crypto");
    module2.exports = (headers, hashAlgo, bodyHash, options) => {
      options = options || {};
      let fieldNames = options.headerFieldNames || "From:Sender:Reply-To:Subject:Date:Message-ID:To:Cc:MIME-Version:Content-Type:Content-Transfer-Encoding:Content-ID:Content-Description:Resent-Date:Resent-From:Resent-Sender:Resent-To:Resent-Cc:Resent-Message-ID:In-Reply-To:References:List-Id:List-Help:List-Unsubscribe:List-Subscribe:List-Post:List-Owner:List-Archive", canonicalizedHeaderData = relaxedHeaders(headers, fieldNames, options.skipFields), dkimHeader = generateDKIMHeader(options.domainName, options.keySelector, canonicalizedHeaderData.fieldNames, hashAlgo, bodyHash), signer, signature;
      canonicalizedHeaderData.headers += "dkim-signature:" + relaxedHeaderLine(dkimHeader), signer = crypto2.createSign(("rsa-" + hashAlgo).toUpperCase()), signer.update(canonicalizedHeaderData.headers);
      try {
        signature = signer.sign(options.privateKey, "base64");
      } catch {
        return !1;
      }
      return dkimHeader + signature.replace(/(^.{73}|.{75}(?!\r?\n|\r))/g, `$&\r
 `).trim();
    };
    module2.exports.relaxedHeaders = relaxedHeaders;
    function generateDKIMHeader(domainName, keySelector, fieldNames, hashAlgo, bodyHash) {
      let dkim = [
        "v=1",
        "a=rsa-" + hashAlgo,
        "c=relaxed/relaxed",
        "d=" + punycode.toASCII(domainName),
        "q=dns/txt",
        "s=" + keySelector,
        "bh=" + bodyHash,
        "h=" + fieldNames
      ].join("; ");
      return mimeFuncs.foldLines("DKIM-Signature: " + dkim, 76) + `;\r
 b=`;
    }
    function relaxedHeaders(headers, fieldNames, skipFields) {
      let includedFields = /* @__PURE__ */ new Set(), skip = /* @__PURE__ */ new Set(), headerFields = /* @__PURE__ */ new Map();
      (skipFields || "").toLowerCase().split(":").forEach((field) => {
        skip.add(field.trim());
      }), (fieldNames || "").toLowerCase().split(":").filter((field) => !skip.has(field.trim())).forEach((field) => {
        includedFields.add(field.trim());
      });
      for (let i = headers.length - 1; i >= 0; i--) {
        let line = headers[i];
        includedFields.has(line.key) && !headerFields.has(line.key) && headerFields.set(line.key, relaxedHeaderLine(line.line));
      }
      let headersList = [], fields = [];
      return includedFields.forEach((field) => {
        headerFields.has(field) && (fields.push(field), headersList.push(field + ":" + headerFields.get(field)));
      }), {
        headers: headersList.join(`\r
`) + `\r
`,
        fieldNames: fields.join(":")
      };
    }
    function relaxedHeaderLine(line) {
      return line.substr(line.indexOf(":") + 1).replace(/\r?\n/g, "").replace(/\s+/g, " ").trim();
    }
  }
});

// node_modules/nodemailer/lib/dkim/index.js
var require_dkim = __commonJS({
  "node_modules/nodemailer/lib/dkim/index.js"(exports2, module2) {
    "use strict";
    var MessageParser = require_message_parser(), RelaxedBody = require_relaxed_body(), sign = require_sign(), PassThrough = require("stream").PassThrough, fs = require("fs"), path = require("path"), crypto2 = require("crypto"), DKIM_ALGO = "sha256", MAX_MESSAGE_SIZE = 128 * 1024, DKIMSigner = class {
      constructor(options, keys, input, output) {
        this.options = options || {}, this.keys = keys, this.cacheTreshold = Number(this.options.cacheTreshold) || MAX_MESSAGE_SIZE, this.hashAlgo = this.options.hashAlgo || DKIM_ALGO, this.cacheDir = this.options.cacheDir || !1, this.chunks = [], this.chunklen = 0, this.readPos = 0, this.cachePath = this.cacheDir ? path.join(this.cacheDir, "message." + Date.now() + "-" + crypto2.randomBytes(14).toString("hex")) : !1, this.cache = !1, this.headers = !1, this.bodyHash = !1, this.parser = !1, this.relaxedBody = !1, this.input = input, this.output = output, this.output.usingCache = !1, this.hasErrored = !1, this.input.on("error", (err) => {
          this.hasErrored = !0, this.cleanup(), output.emit("error", err);
        });
      }
      cleanup() {
        !this.cache || !this.cachePath || fs.unlink(this.cachePath, () => !1);
      }
      createReadCache() {
        this.cache = fs.createReadStream(this.cachePath), this.cache.once("error", (err) => {
          this.cleanup(), this.output.emit("error", err);
        }), this.cache.once("close", () => {
          this.cleanup();
        }), this.cache.pipe(this.output);
      }
      sendNextChunk() {
        if (this.hasErrored)
          return;
        if (this.readPos >= this.chunks.length)
          return this.cache ? this.createReadCache() : this.output.end();
        let chunk = this.chunks[this.readPos++];
        if (this.output.write(chunk) === !1)
          return this.output.once("drain", () => {
            this.sendNextChunk();
          });
        setImmediate(() => this.sendNextChunk());
      }
      sendSignedOutput() {
        let keyPos = 0, signNextKey = () => {
          if (keyPos >= this.keys.length)
            return this.output.write(this.parser.rawHeaders), setImmediate(() => this.sendNextChunk());
          let key = this.keys[keyPos++], dkimField = sign(this.headers, this.hashAlgo, this.bodyHash, {
            domainName: key.domainName,
            keySelector: key.keySelector,
            privateKey: key.privateKey,
            headerFieldNames: this.options.headerFieldNames,
            skipFields: this.options.skipFields
          });
          return dkimField && this.output.write(Buffer.from(dkimField + `\r
`)), setImmediate(signNextKey);
        };
        if (this.bodyHash && this.headers)
          return signNextKey();
        this.output.write(this.parser.rawHeaders), this.sendNextChunk();
      }
      createWriteCache() {
        this.output.usingCache = !0, this.cache = fs.createWriteStream(this.cachePath), this.cache.once("error", (err) => {
          this.cleanup(), this.relaxedBody.unpipe(this.cache), this.relaxedBody.on("readable", () => {
            for (; this.relaxedBody.read() !== null; )
              ;
          }), this.hasErrored = !0, this.output.emit("error", err);
        }), this.cache.once("close", () => {
          this.sendSignedOutput();
        }), this.relaxedBody.removeAllListeners("readable"), this.relaxedBody.pipe(this.cache);
      }
      signStream() {
        this.parser = new MessageParser(), this.relaxedBody = new RelaxedBody({
          hashAlgo: this.hashAlgo
        }), this.parser.on("headers", (value) => {
          this.headers = value;
        }), this.relaxedBody.on("hash", (value) => {
          this.bodyHash = value;
        }), this.relaxedBody.on("readable", () => {
          let chunk;
          if (!this.cache) {
            for (; (chunk = this.relaxedBody.read()) !== null; )
              if (this.chunks.push(chunk), this.chunklen += chunk.length, this.chunklen >= this.cacheTreshold && this.cachePath)
                return this.createWriteCache();
          }
        }), this.relaxedBody.on("end", () => {
          this.cache || this.sendSignedOutput();
        }), this.parser.pipe(this.relaxedBody), setImmediate(() => this.input.pipe(this.parser));
      }
    }, DKIM = class {
      constructor(options) {
        this.options = options || {}, this.keys = [].concat(
          this.options.keys || {
            domainName: options.domainName,
            keySelector: options.keySelector,
            privateKey: options.privateKey
          }
        );
      }
      sign(input, extraOptions) {
        let output = new PassThrough(), inputStream = input, writeValue = !1;
        Buffer.isBuffer(input) ? (writeValue = input, inputStream = new PassThrough()) : typeof input == "string" && (writeValue = Buffer.from(input), inputStream = new PassThrough());
        let options = this.options;
        extraOptions && Object.keys(extraOptions).length && (options = {}, Object.keys(this.options || {}).forEach((key) => {
          options[key] = this.options[key];
        }), Object.keys(extraOptions || {}).forEach((key) => {
          key in options || (options[key] = extraOptions[key]);
        }));
        let signer = new DKIMSigner(options, this.keys, inputStream, output);
        return setImmediate(() => {
          signer.signStream(), writeValue && setImmediate(() => {
            inputStream.end(writeValue);
          });
        }), output;
      }
    };
    module2.exports = DKIM;
  }
});

// node_modules/nodemailer/lib/smtp-connection/http-proxy-client.js
var require_http_proxy_client = __commonJS({
  "node_modules/nodemailer/lib/smtp-connection/http-proxy-client.js"(exports2, module2) {
    "use strict";
    var net = require("net"), tls = require("tls"), urllib = require("url");
    function httpProxyClient(proxyUrl, destinationPort, destinationHost, callback) {
      let proxy = urllib.parse(proxyUrl), options, connect, socket;
      options = {
        host: proxy.hostname,
        port: Number(proxy.port) ? Number(proxy.port) : proxy.protocol === "https:" ? 443 : 80
      }, proxy.protocol === "https:" ? (options.rejectUnauthorized = !1, connect = tls.connect.bind(tls)) : connect = net.connect.bind(net);
      let finished = !1, tempSocketErr = (err) => {
        if (!finished) {
          finished = !0;
          try {
            socket.destroy();
          } catch {
          }
          callback(err);
        }
      }, timeoutErr = () => {
        let err = new Error("Proxy socket timed out");
        err.code = "ETIMEDOUT", tempSocketErr(err);
      };
      socket = connect(options, () => {
        if (finished)
          return;
        let reqHeaders = {
          Host: destinationHost + ":" + destinationPort,
          Connection: "close"
        };
        proxy.auth && (reqHeaders["Proxy-Authorization"] = "Basic " + Buffer.from(proxy.auth).toString("base64")), socket.write(
          // HTTP method
          "CONNECT " + destinationHost + ":" + destinationPort + ` HTTP/1.1\r
` + // HTTP request headers
          Object.keys(reqHeaders).map((key) => key + ": " + reqHeaders[key]).join(`\r
`) + // End request
          `\r
\r
`
        );
        let headers = "", onSocketData = (chunk) => {
          let match, remainder;
          if (!finished && (headers += chunk.toString("binary"), match = headers.match(/\r\n\r\n/))) {
            if (socket.removeListener("data", onSocketData), remainder = headers.substr(match.index + match[0].length), headers = headers.substr(0, match.index), remainder && socket.unshift(Buffer.from(remainder, "binary")), finished = !0, match = headers.match(/^HTTP\/\d+\.\d+ (\d+)/i), !match || (match[1] || "").charAt(0) !== "2") {
              try {
                socket.destroy();
              } catch {
              }
              return callback(new Error("Invalid response from proxy" + (match && ": " + match[1] || "")));
            }
            return socket.removeListener("error", tempSocketErr), socket.removeListener("timeout", timeoutErr), socket.setTimeout(0), callback(null, socket);
          }
        };
        socket.on("data", onSocketData);
      }), socket.setTimeout(httpProxyClient.timeout || 30 * 1e3), socket.on("timeout", timeoutErr), socket.once("error", tempSocketErr);
    }
    module2.exports = httpProxyClient;
  }
});

// node_modules/nodemailer/lib/mailer/mail-message.js
var require_mail_message = __commonJS({
  "node_modules/nodemailer/lib/mailer/mail-message.js"(exports2, module2) {
    "use strict";
    var shared = require_shared(), MimeNode = require_mime_node(), mimeFuncs = require_mime_funcs(), MailMessage = class {
      constructor(mailer, data) {
        this.mailer = mailer, this.data = {}, this.message = null, data = data || {};
        let options = mailer.options || {}, defaults = mailer._defaults || {};
        Object.keys(data).forEach((key) => {
          this.data[key] = data[key];
        }), this.data.headers = this.data.headers || {}, Object.keys(defaults).forEach((key) => {
          key in this.data ? key === "headers" && Object.keys(defaults.headers).forEach((key2) => {
            key2 in this.data.headers || (this.data.headers[key2] = defaults.headers[key2]);
          }) : this.data[key] = defaults[key];
        }), ["disableFileAccess", "disableUrlAccess", "normalizeHeaderKey"].forEach((key) => {
          key in options && (this.data[key] = options[key]);
        });
      }
      resolveContent(...args) {
        return shared.resolveContent(...args);
      }
      resolveAll(callback) {
        let keys = [
          [this.data, "html"],
          [this.data, "text"],
          [this.data, "watchHtml"],
          [this.data, "amp"],
          [this.data, "icalEvent"]
        ];
        this.data.alternatives && this.data.alternatives.length && this.data.alternatives.forEach((alternative, i) => {
          keys.push([this.data.alternatives, i]);
        }), this.data.attachments && this.data.attachments.length && this.data.attachments.forEach((attachment, i) => {
          attachment.filename || (attachment.filename = (attachment.path || attachment.href || "").split("/").pop().split("?").shift() || "attachment-" + (i + 1), attachment.filename.indexOf(".") < 0 && (attachment.filename += "." + mimeFuncs.detectExtension(attachment.contentType))), attachment.contentType || (attachment.contentType = mimeFuncs.detectMimeType(attachment.filename || attachment.path || attachment.href || "bin")), keys.push([this.data.attachments, i]);
        });
        let mimeNode = new MimeNode();
        ["from", "to", "cc", "bcc", "sender", "replyTo"].forEach((address) => {
          let value;
          this.message ? value = [].concat(mimeNode._parseAddresses(this.message.getHeader(address === "replyTo" ? "reply-to" : address)) || []) : this.data[address] && (value = [].concat(mimeNode._parseAddresses(this.data[address]) || [])), value && value.length ? this.data[address] = value : address in this.data && (this.data[address] = null);
        }), ["from", "sender"].forEach((address) => {
          this.data[address] && (this.data[address] = this.data[address].shift());
        });
        let pos = 0, resolveNext = () => {
          if (pos >= keys.length)
            return callback(null, this.data);
          let args = keys[pos++];
          if (!args[0] || !args[0][args[1]])
            return resolveNext();
          shared.resolveContent(...args, (err, value) => {
            if (err)
              return callback(err);
            let node = {
              content: value
            };
            args[0][args[1]] && typeof args[0][args[1]] == "object" && !Buffer.isBuffer(args[0][args[1]]) && Object.keys(args[0][args[1]]).forEach((key) => {
              !(key in node) && !["content", "path", "href", "raw"].includes(key) && (node[key] = args[0][args[1]][key]);
            }), args[0][args[1]] = node, resolveNext();
          });
        };
        setImmediate(() => resolveNext());
      }
      normalize(callback) {
        let envelope = this.data.envelope || this.message.getEnvelope(), messageId = this.message.messageId();
        this.resolveAll((err, data) => err ? callback(err) : (data.envelope = envelope, data.messageId = messageId, ["html", "text", "watchHtml", "amp"].forEach((key) => {
          data[key] && data[key].content && (typeof data[key].content == "string" ? data[key] = data[key].content : Buffer.isBuffer(data[key].content) && (data[key] = data[key].content.toString()));
        }), data.icalEvent && Buffer.isBuffer(data.icalEvent.content) && (data.icalEvent.content = data.icalEvent.content.toString("base64"), data.icalEvent.encoding = "base64"), data.alternatives && data.alternatives.length && data.alternatives.forEach((alternative) => {
          alternative && alternative.content && Buffer.isBuffer(alternative.content) && (alternative.content = alternative.content.toString("base64"), alternative.encoding = "base64");
        }), data.attachments && data.attachments.length && data.attachments.forEach((attachment) => {
          attachment && attachment.content && Buffer.isBuffer(attachment.content) && (attachment.content = attachment.content.toString("base64"), attachment.encoding = "base64");
        }), data.normalizedHeaders = {}, Object.keys(data.headers || {}).forEach((key) => {
          let value = [].concat(data.headers[key] || []).shift();
          value = value && value.value || value, value && (["references", "in-reply-to", "message-id", "content-id"].includes(key) && (value = this.message._encodeHeaderValue(key, value)), data.normalizedHeaders[key] = value);
        }), data.list && typeof data.list == "object" && this._getListHeaders(data.list).forEach((entry) => {
          data.normalizedHeaders[entry.key] = entry.value.map((val) => val && val.value || val).join(", ");
        }), data.references && (data.normalizedHeaders.references = this.message._encodeHeaderValue("references", data.references)), data.inReplyTo && (data.normalizedHeaders["in-reply-to"] = this.message._encodeHeaderValue("in-reply-to", data.inReplyTo)), callback(null, data)));
      }
      setMailerHeader() {
        !this.message || !this.data.xMailer || this.message.setHeader("X-Mailer", this.data.xMailer);
      }
      setPriorityHeaders() {
        if (!(!this.message || !this.data.priority))
          switch ((this.data.priority || "").toString().toLowerCase()) {
            case "high":
              this.message.setHeader("X-Priority", "1 (Highest)"), this.message.setHeader("X-MSMail-Priority", "High"), this.message.setHeader("Importance", "High");
              break;
            case "low":
              this.message.setHeader("X-Priority", "5 (Lowest)"), this.message.setHeader("X-MSMail-Priority", "Low"), this.message.setHeader("Importance", "Low");
              break;
            default:
          }
      }
      setListHeaders() {
        !this.message || !this.data.list || typeof this.data.list != "object" || this.data.list && typeof this.data.list == "object" && this._getListHeaders(this.data.list).forEach((listHeader) => {
          listHeader.value.forEach((value) => {
            this.message.addHeader(listHeader.key, value);
          });
        });
      }
      _getListHeaders(listData) {
        return Object.keys(listData).map((key) => ({
          key: "list-" + key.toLowerCase().trim(),
          value: [].concat(listData[key] || []).map((value) => ({
            prepared: !0,
            foldLines: !0,
            value: [].concat(value || []).map((value2) => {
              if (typeof value2 == "string" && (value2 = {
                url: value2
              }), value2 && value2.url) {
                if (key.toLowerCase().trim() === "id") {
                  let comment2 = value2.comment || "";
                  return mimeFuncs.isPlainText(comment2) ? comment2 = '"' + comment2 + '"' : comment2 = mimeFuncs.encodeWord(comment2), (value2.comment ? comment2 + " " : "") + this._formatListUrl(value2.url).replace(/^<[^:]+\/{,2}/, "");
                }
                let comment = value2.comment || "";
                return mimeFuncs.isPlainText(comment) || (comment = mimeFuncs.encodeWord(comment)), this._formatListUrl(value2.url) + (value2.comment ? " (" + comment + ")" : "");
              }
              return "";
            }).filter((value2) => value2).join(", ")
          }))
        }));
      }
      _formatListUrl(url) {
        return url = url.replace(/[\s<]+|[\s>]+/g, ""), /^(https?|mailto|ftp):/.test(url) ? "<" + url + ">" : /^[^@]+@[^@]+$/.test(url) ? "<mailto:" + url + ">" : "<http://" + url + ">";
      }
    };
    module2.exports = MailMessage;
  }
});

// node_modules/nodemailer/lib/mailer/index.js
var require_mailer = __commonJS({
  "node_modules/nodemailer/lib/mailer/index.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events"), shared = require_shared(), mimeTypes = require_mime_types(), MailComposer = require_mail_composer(), DKIM = require_dkim(), httpProxyClient = require_http_proxy_client(), util = require("util"), urllib = require("url"), packageData = require_package(), MailMessage = require_mail_message(), net = require("net"), dns = require("dns"), crypto2 = require("crypto"), Mail = class extends EventEmitter {
      constructor(transporter, options, defaults) {
        super(), this.options = options || {}, this._defaults = defaults || {}, this._defaultPlugins = {
          compile: [(...args) => this._convertDataImages(...args)],
          stream: []
        }, this._userPlugins = {
          compile: [],
          stream: []
        }, this.meta = /* @__PURE__ */ new Map(), this.dkim = this.options.dkim ? new DKIM(this.options.dkim) : !1, this.transporter = transporter, this.transporter.mailer = this, this.logger = shared.getLogger(this.options, {
          component: this.options.component || "mail"
        }), this.logger.debug(
          {
            tnx: "create"
          },
          "Creating transport: %s",
          this.getVersionString()
        ), typeof this.transporter.on == "function" && (this.transporter.on("log", (log) => {
          this.logger.debug(
            {
              tnx: "transport"
            },
            "%s: %s",
            log.type,
            log.message
          );
        }), this.transporter.on("error", (err) => {
          this.logger.error(
            {
              err,
              tnx: "transport"
            },
            "Transport Error: %s",
            err.message
          ), this.emit("error", err);
        }), this.transporter.on("idle", (...args) => {
          this.emit("idle", ...args);
        })), ["close", "isIdle", "verify"].forEach((method) => {
          this[method] = (...args) => typeof this.transporter[method] == "function" ? (method === "verify" && typeof this.getSocket == "function" && (this.transporter.getSocket = this.getSocket, this.getSocket = !1), this.transporter[method](...args)) : (this.logger.warn(
            {
              tnx: "transport",
              methodName: method
            },
            "Non existing method %s called for transport",
            method
          ), !1);
        }), this.options.proxy && typeof this.options.proxy == "string" && this.setupProxy(this.options.proxy);
      }
      use(step, plugin) {
        return step = (step || "").toString(), this._userPlugins.hasOwnProperty(step) ? this._userPlugins[step].push(plugin) : this._userPlugins[step] = [plugin], this;
      }
      /**
       * Sends an email using the preselected transport object
       *
       * @param {Object} data E-data description
       * @param {Function?} callback Callback to run once the sending succeeded or failed
       */
      sendMail(data, callback = null) {
        let promise;
        callback || (promise = new Promise((resolve, reject) => {
          callback = shared.callbackPromise(resolve, reject);
        })), typeof this.getSocket == "function" && (this.transporter.getSocket = this.getSocket, this.getSocket = !1);
        let mail = new MailMessage(this, data);
        return this.logger.debug(
          {
            tnx: "transport",
            name: this.transporter.name,
            version: this.transporter.version,
            action: "send"
          },
          "Sending mail using %s/%s",
          this.transporter.name,
          this.transporter.version
        ), this._processPlugins("compile", mail, (err) => {
          if (err)
            return this.logger.error(
              {
                err,
                tnx: "plugin",
                action: "compile"
              },
              "PluginCompile Error: %s",
              err.message
            ), callback(err);
          mail.message = new MailComposer(mail.data).compile(), mail.setMailerHeader(), mail.setPriorityHeaders(), mail.setListHeaders(), this._processPlugins("stream", mail, (err2) => {
            if (err2)
              return this.logger.error(
                {
                  err: err2,
                  tnx: "plugin",
                  action: "stream"
                },
                "PluginStream Error: %s",
                err2.message
              ), callback(err2);
            (mail.data.dkim || this.dkim) && mail.message.processFunc((input) => {
              let dkim = mail.data.dkim ? new DKIM(mail.data.dkim) : this.dkim;
              return this.logger.debug(
                {
                  tnx: "DKIM",
                  messageId: mail.message.messageId(),
                  dkimDomains: dkim.keys.map((key) => key.keySelector + "." + key.domainName).join(", ")
                },
                "Signing outgoing message with %s keys",
                dkim.keys.length
              ), dkim.sign(input, mail.data._dkim);
            }), this.transporter.send(mail, (...args) => {
              args[0] && this.logger.error(
                {
                  err: args[0],
                  tnx: "transport",
                  action: "send"
                },
                "Send Error: %s",
                args[0].message
              ), callback(...args);
            });
          });
        }), promise;
      }
      getVersionString() {
        return util.format("%s (%s; +%s; %s/%s)", packageData.name, packageData.version, packageData.homepage, this.transporter.name, this.transporter.version);
      }
      _processPlugins(step, mail, callback) {
        if (step = (step || "").toString(), !this._userPlugins.hasOwnProperty(step))
          return callback();
        let userPlugins = this._userPlugins[step] || [], defaultPlugins = this._defaultPlugins[step] || [];
        if (userPlugins.length && this.logger.debug(
          {
            tnx: "transaction",
            pluginCount: userPlugins.length,
            step
          },
          "Using %s plugins for %s",
          userPlugins.length,
          step
        ), userPlugins.length + defaultPlugins.length === 0)
          return callback();
        let pos = 0, block = "default", processPlugins = () => {
          let curplugins = block === "default" ? defaultPlugins : userPlugins;
          if (pos >= curplugins.length)
            if (block === "default" && userPlugins.length)
              block = "user", pos = 0, curplugins = userPlugins;
            else
              return callback();
          let plugin = curplugins[pos++];
          plugin(mail, (err) => {
            if (err)
              return callback(err);
            processPlugins();
          });
        };
        processPlugins();
      }
      /**
       * Sets up proxy handler for a Nodemailer object
       *
       * @param {String} proxyUrl Proxy configuration url
       */
      setupProxy(proxyUrl) {
        let proxy = urllib.parse(proxyUrl);
        this.getSocket = (options, callback) => {
          let protocol = proxy.protocol.replace(/:$/, "").toLowerCase();
          if (this.meta.has("proxy_handler_" + protocol))
            return this.meta.get("proxy_handler_" + protocol)(proxy, options, callback);
          switch (protocol) {
            // Connect using a HTTP CONNECT method
            case "http":
            case "https":
              httpProxyClient(proxy.href, options.port, options.host, (err, socket) => err ? callback(err) : callback(null, {
                connection: socket
              }));
              return;
            case "socks":
            case "socks5":
            case "socks4":
            case "socks4a": {
              if (!this.meta.has("proxy_socks_module"))
                return callback(new Error("Socks module not loaded"));
              let connect = (ipaddress) => {
                let proxyV2 = !!this.meta.get("proxy_socks_module").SocksClient, socksClient = proxyV2 ? this.meta.get("proxy_socks_module").SocksClient : this.meta.get("proxy_socks_module"), proxyType = Number(proxy.protocol.replace(/\D/g, "")) || 5, connectionOpts = {
                  proxy: {
                    ipaddress,
                    port: Number(proxy.port),
                    type: proxyType
                  },
                  [proxyV2 ? "destination" : "target"]: {
                    host: options.host,
                    port: options.port
                  },
                  command: "connect"
                };
                if (proxy.auth) {
                  let username = decodeURIComponent(proxy.auth.split(":").shift()), password = decodeURIComponent(proxy.auth.split(":").pop());
                  proxyV2 ? (connectionOpts.proxy.userId = username, connectionOpts.proxy.password = password) : proxyType === 4 ? connectionOpts.userid = username : connectionOpts.authentication = {
                    username,
                    password
                  };
                }
                socksClient.createConnection(connectionOpts, (err, info) => err ? callback(err) : callback(null, {
                  connection: info.socket || info
                }));
              };
              return net.isIP(proxy.hostname) ? connect(proxy.hostname) : dns.resolve(proxy.hostname, (err, address) => {
                if (err)
                  return callback(err);
                connect(Array.isArray(address) ? address[0] : address);
              });
            }
          }
          callback(new Error("Unknown proxy configuration"));
        };
      }
      _convertDataImages(mail, callback) {
        if (!this.options.attachDataUrls && !mail.data.attachDataUrls || !mail.data.html)
          return callback();
        mail.resolveContent(mail.data, "html", (err, html) => {
          if (err)
            return callback(err);
          let cidCounter = 0;
          html = (html || "").toString().replace(/(<img\b[^<>]{0,1024} src\s{0,20}=[\s"']{0,20})(data:([^;]+);[^"'>\s]+)/gi, (match, prefix, dataUri, mimeType) => {
            let cid = crypto2.randomBytes(10).toString("hex") + "@localhost";
            return mail.data.attachments || (mail.data.attachments = []), Array.isArray(mail.data.attachments) || (mail.data.attachments = [].concat(mail.data.attachments || [])), mail.data.attachments.push({
              path: dataUri,
              cid,
              filename: "image-" + ++cidCounter + "." + mimeTypes.detectExtension(mimeType)
            }), prefix + "cid:" + cid;
          }), mail.data.html = html, callback();
        });
      }
      set(key, value) {
        return this.meta.set(key, value);
      }
      get(key) {
        return this.meta.get(key);
      }
    };
    module2.exports = Mail;
  }
});

// node_modules/nodemailer/lib/smtp-connection/data-stream.js
var require_data_stream = __commonJS({
  "node_modules/nodemailer/lib/smtp-connection/data-stream.js"(exports2, module2) {
    "use strict";
    var stream = require("stream"), Transform = stream.Transform, DataStream = class extends Transform {
      constructor(options) {
        super(options), this.options = options || {}, this._curLine = "", this.inByteCount = 0, this.outByteCount = 0, this.lastByte = !1;
      }
      /**
       * Escapes dots
       */
      _transform(chunk, encoding, done) {
        let chunks = [], chunklen = 0, i, len, lastPos = 0, buf;
        if (!chunk || !chunk.length)
          return done();
        for (typeof chunk == "string" && (chunk = Buffer.from(chunk)), this.inByteCount += chunk.length, i = 0, len = chunk.length; i < len; i++)
          chunk[i] === 46 ? (i && chunk[i - 1] === 10 || !i && (!this.lastByte || this.lastByte === 10)) && (buf = chunk.slice(lastPos, i + 1), chunks.push(buf), chunks.push(Buffer.from(".")), chunklen += buf.length + 1, lastPos = i + 1) : chunk[i] === 10 && (i && chunk[i - 1] !== 13 || !i && this.lastByte !== 13) && (i > lastPos ? (buf = chunk.slice(lastPos, i), chunks.push(buf), chunklen += buf.length + 2) : chunklen += 2, chunks.push(Buffer.from(`\r
`)), lastPos = i + 1);
        chunklen ? (lastPos < chunk.length && (buf = chunk.slice(lastPos), chunks.push(buf), chunklen += buf.length), this.outByteCount += chunklen, this.push(Buffer.concat(chunks, chunklen))) : (this.outByteCount += chunk.length, this.push(chunk)), this.lastByte = chunk[chunk.length - 1], done();
      }
      /**
       * Finalizes the stream with a dot on a single line
       */
      _flush(done) {
        let buf;
        this.lastByte === 10 ? buf = Buffer.from(`.\r
`) : this.lastByte === 13 ? buf = Buffer.from(`
.\r
`) : buf = Buffer.from(`\r
.\r
`), this.outByteCount += buf.length, this.push(buf), done();
      }
    };
    module2.exports = DataStream;
  }
});

// node_modules/nodemailer/lib/smtp-connection/index.js
var require_smtp_connection = __commonJS({
  "node_modules/nodemailer/lib/smtp-connection/index.js"(exports2, module2) {
    "use strict";
    var packageInfo = require_package(), EventEmitter = require("events").EventEmitter, net = require("net"), tls = require("tls"), os = require("os"), crypto2 = require("crypto"), DataStream = require_data_stream(), PassThrough = require("stream").PassThrough, shared = require_shared(), CONNECTION_TIMEOUT = 2 * 60 * 1e3, SOCKET_TIMEOUT = 10 * 60 * 1e3, GREETING_TIMEOUT = 30 * 1e3, DNS_TIMEOUT = 30 * 1e3, SMTPConnection = class extends EventEmitter {
      constructor(options) {
        super(options), this.id = crypto2.randomBytes(8).toString("base64").replace(/\W/g, ""), this.stage = "init", this.options = options || {}, this.secureConnection = !!this.options.secure, this.alreadySecured = !!this.options.secured, this.port = Number(this.options.port) || (this.secureConnection ? 465 : 587), this.host = this.options.host || "localhost", this.servername = this.options.servername ? this.options.servername : net.isIP(this.host) ? !1 : this.host, this.allowInternalNetworkInterfaces = this.options.allowInternalNetworkInterfaces || !1, typeof this.options.secure > "u" && this.port === 465 && (this.secureConnection = !0), this.name = this.options.name || this._getHostname(), this.logger = shared.getLogger(this.options, {
          component: this.options.component || "smtp-connection",
          sid: this.id
        }), this.customAuth = /* @__PURE__ */ new Map(), Object.keys(this.options.customAuth || {}).forEach((key) => {
          let mapKey = (key || "").toString().trim().toUpperCase();
          mapKey && this.customAuth.set(mapKey, this.options.customAuth[key]);
        }), this.version = packageInfo.version, this.authenticated = !1, this.destroyed = !1, this.secure = !!this.secureConnection, this._remainder = "", this._responseQueue = [], this.lastServerResponse = !1, this._socket = !1, this._supportedAuth = [], this.allowsAuth = !1, this._envelope = !1, this._supportedExtensions = [], this._maxAllowedSize = 0, this._responseActions = [], this._recipientQueue = [], this._greetingTimeout = !1, this._connectionTimeout = !1, this._destroyed = !1, this._closing = !1, this._onSocketData = (chunk) => this._onData(chunk), this._onSocketError = (error) => this._onError(error, "ESOCKET", !1, "CONN"), this._onSocketClose = () => this._onClose(), this._onSocketEnd = () => this._onEnd(), this._onSocketTimeout = () => this._onTimeout();
      }
      /**
       * Creates a connection to a SMTP server and sets up connection
       * listener
       */
      connect(connectCallback) {
        if (typeof connectCallback == "function") {
          this.once("connect", () => {
            this.logger.debug(
              {
                tnx: "smtp"
              },
              "SMTP handshake finished"
            ), connectCallback();
          });
          let isDestroyedMessage = this._isDestroyedMessage("connect");
          if (isDestroyedMessage)
            return connectCallback(this._formatError(isDestroyedMessage, "ECONNECTION", !1, "CONN"));
        }
        let opts = {
          port: this.port,
          host: this.host,
          allowInternalNetworkInterfaces: this.allowInternalNetworkInterfaces,
          timeout: this.options.dnsTimeout || DNS_TIMEOUT
        };
        this.options.localAddress && (opts.localAddress = this.options.localAddress);
        let setupConnectionHandlers = () => {
          this._connectionTimeout = setTimeout(() => {
            this._onError("Connection timeout", "ETIMEDOUT", !1, "CONN");
          }, this.options.connectionTimeout || CONNECTION_TIMEOUT), this._socket.on("error", this._onSocketError);
        };
        if (this.options.connection) {
          this._socket = this.options.connection, setupConnectionHandlers(), this.secureConnection && !this.alreadySecured ? setImmediate(
            () => this._upgradeConnection((err) => {
              if (err) {
                this._onError(new Error("Error initiating TLS - " + (err.message || err)), "ETLS", !1, "CONN");
                return;
              }
              this._onConnect();
            })
          ) : setImmediate(() => this._onConnect());
          return;
        } else return this.options.socket ? (this._socket = this.options.socket, shared.resolveHostname(opts, (err, resolved) => {
          if (err)
            return setImmediate(() => this._onError(err, "EDNS", !1, "CONN"));
          this.logger.debug(
            {
              tnx: "dns",
              source: opts.host,
              resolved: resolved.host,
              cached: !!resolved.cached
            },
            "Resolved %s as %s [cache %s]",
            opts.host,
            resolved.host,
            resolved.cached ? "hit" : "miss"
          ), Object.keys(resolved).forEach((key) => {
            key.charAt(0) !== "_" && resolved[key] && (opts[key] = resolved[key]);
          });
          try {
            this._socket.connect(this.port, this.host, () => {
              this._socket.setKeepAlive(!0), this._onConnect();
            }), setupConnectionHandlers();
          } catch (E) {
            return setImmediate(() => this._onError(E, "ECONNECTION", !1, "CONN"));
          }
        })) : this.secureConnection ? (this.options.tls && Object.keys(this.options.tls).forEach((key) => {
          opts[key] = this.options.tls[key];
        }), this.servername && !opts.servername && (opts.servername = this.servername), shared.resolveHostname(opts, (err, resolved) => {
          if (err)
            return setImmediate(() => this._onError(err, "EDNS", !1, "CONN"));
          this.logger.debug(
            {
              tnx: "dns",
              source: opts.host,
              resolved: resolved.host,
              cached: !!resolved.cached
            },
            "Resolved %s as %s [cache %s]",
            opts.host,
            resolved.host,
            resolved.cached ? "hit" : "miss"
          ), Object.keys(resolved).forEach((key) => {
            key.charAt(0) !== "_" && resolved[key] && (opts[key] = resolved[key]);
          });
          try {
            this._socket = tls.connect(opts, () => {
              this._socket.setKeepAlive(!0), this._onConnect();
            }), setupConnectionHandlers();
          } catch (E) {
            return setImmediate(() => this._onError(E, "ECONNECTION", !1, "CONN"));
          }
        })) : shared.resolveHostname(opts, (err, resolved) => {
          if (err)
            return setImmediate(() => this._onError(err, "EDNS", !1, "CONN"));
          this.logger.debug(
            {
              tnx: "dns",
              source: opts.host,
              resolved: resolved.host,
              cached: !!resolved.cached
            },
            "Resolved %s as %s [cache %s]",
            opts.host,
            resolved.host,
            resolved.cached ? "hit" : "miss"
          ), Object.keys(resolved).forEach((key) => {
            key.charAt(0) !== "_" && resolved[key] && (opts[key] = resolved[key]);
          });
          try {
            this._socket = net.connect(opts, () => {
              this._socket.setKeepAlive(!0), this._onConnect();
            }), setupConnectionHandlers();
          } catch (E) {
            return setImmediate(() => this._onError(E, "ECONNECTION", !1, "CONN"));
          }
        });
      }
      /**
       * Sends QUIT
       */
      quit() {
        this._sendCommand("QUIT"), this._responseActions.push(this.close);
      }
      /**
       * Closes the connection to the server
       */
      close() {
        if (clearTimeout(this._connectionTimeout), clearTimeout(this._greetingTimeout), this._responseActions = [], this._closing)
          return;
        this._closing = !0;
        let closeMethod = "end";
        this.stage === "init" && (closeMethod = "destroy"), this.logger.debug(
          {
            tnx: "smtp"
          },
          'Closing connection to the server using "%s"',
          closeMethod
        );
        let socket = this._socket && this._socket.socket || this._socket;
        if (socket && !socket.destroyed)
          try {
            socket[closeMethod]();
          } catch {
          }
        this._destroy();
      }
      /**
       * Authenticate user
       */
      login(authData, callback) {
        let isDestroyedMessage = this._isDestroyedMessage("login");
        if (isDestroyedMessage)
          return callback(this._formatError(isDestroyedMessage, "ECONNECTION", !1, "API"));
        if (this._auth = authData || {}, this._authMethod = (this._auth.method || "").toString().trim().toUpperCase() || !1, !this._authMethod && this._auth.oauth2 && !this._auth.credentials ? this._authMethod = "XOAUTH2" : (!this._authMethod || this._authMethod === "XOAUTH2" && !this._auth.oauth2) && (this._authMethod = (this._supportedAuth[0] || "PLAIN").toUpperCase().trim()), this._authMethod !== "XOAUTH2" && (!this._auth.credentials || !this._auth.credentials.user || !this._auth.credentials.pass))
          if (this._auth.user && this._auth.pass || this.customAuth.has(this._authMethod))
            this._auth.credentials = {
              user: this._auth.user,
              pass: this._auth.pass,
              options: this._auth.options
            };
          else
            return callback(this._formatError('Missing credentials for "' + this._authMethod + '"', "EAUTH", !1, "API"));
        if (this.customAuth.has(this._authMethod)) {
          let handler = this.customAuth.get(this._authMethod), lastResponse, returned = !1, resolve = () => {
            returned || (returned = !0, this.logger.info(
              {
                tnx: "smtp",
                username: this._auth.user,
                action: "authenticated",
                method: this._authMethod
              },
              "User %s authenticated",
              JSON.stringify(this._auth.user)
            ), this.authenticated = !0, callback(null, !0));
          }, reject = (err) => {
            returned || (returned = !0, callback(this._formatError(err, "EAUTH", lastResponse, "AUTH " + this._authMethod)));
          }, handlerResponse = handler({
            auth: this._auth,
            method: this._authMethod,
            extensions: [].concat(this._supportedExtensions),
            authMethods: [].concat(this._supportedAuth),
            maxAllowedSize: this._maxAllowedSize || !1,
            sendCommand: (cmd, done) => {
              let promise;
              return done || (promise = new Promise((resolve2, reject2) => {
                done = shared.callbackPromise(resolve2, reject2);
              })), this._responseActions.push((str) => {
                lastResponse = str;
                let codes = str.match(/^(\d+)(?:\s(\d+\.\d+\.\d+))?\s/), data = {
                  command: cmd,
                  response: str
                };
                codes ? (data.status = Number(codes[1]) || 0, codes[2] && (data.code = codes[2]), data.text = str.substr(codes[0].length)) : (data.text = str, data.status = 0), done(null, data);
              }), setImmediate(() => this._sendCommand(cmd)), promise;
            },
            resolve,
            reject
          });
          handlerResponse && typeof handlerResponse.catch == "function" && handlerResponse.then(resolve).catch(reject);
          return;
        }
        switch (this._authMethod) {
          case "XOAUTH2":
            this._handleXOauth2Token(!1, callback);
            return;
          case "LOGIN":
            this._responseActions.push((str) => {
              this._actionAUTH_LOGIN_USER(str, callback);
            }), this._sendCommand("AUTH LOGIN");
            return;
          case "PLAIN":
            this._responseActions.push((str) => {
              this._actionAUTHComplete(str, callback);
            }), this._sendCommand(
              "AUTH PLAIN " + Buffer.from(
                //this._auth.user+'\u0000'+
                "\0" + // skip authorization identity as it causes problems with some servers
                this._auth.credentials.user + "\0" + this._auth.credentials.pass,
                "utf-8"
              ).toString("base64"),
              // log entry without passwords
              "AUTH PLAIN " + Buffer.from(
                //this._auth.user+'\u0000'+
                "\0" + // skip authorization identity as it causes problems with some servers
                this._auth.credentials.user + "\0/* secret */",
                "utf-8"
              ).toString("base64")
            );
            return;
          case "CRAM-MD5":
            this._responseActions.push((str) => {
              this._actionAUTH_CRAM_MD5(str, callback);
            }), this._sendCommand("AUTH CRAM-MD5");
            return;
        }
        return callback(this._formatError('Unknown authentication method "' + this._authMethod + '"', "EAUTH", !1, "API"));
      }
      /**
       * Sends a message
       *
       * @param {Object} envelope Envelope object, {from: addr, to: [addr]}
       * @param {Object} message String, Buffer or a Stream
       * @param {Function} callback Callback to return once sending is completed
       */
      send(envelope, message, done) {
        if (!message)
          return done(this._formatError("Empty message", "EMESSAGE", !1, "API"));
        let isDestroyedMessage = this._isDestroyedMessage("send message");
        if (isDestroyedMessage)
          return done(this._formatError(isDestroyedMessage, "ECONNECTION", !1, "API"));
        if (this._maxAllowedSize && envelope.size > this._maxAllowedSize)
          return setImmediate(() => {
            done(this._formatError("Message size larger than allowed " + this._maxAllowedSize, "EMESSAGE", !1, "MAIL FROM"));
          });
        let returned = !1, callback = function() {
          returned || (returned = !0, done(...arguments));
        };
        typeof message.on == "function" && message.on("error", (err) => callback(this._formatError(err, "ESTREAM", !1, "API")));
        let startTime = Date.now();
        this._setEnvelope(envelope, (err, info) => {
          if (err) {
            let stream2 = new PassThrough();
            return typeof message.pipe == "function" ? message.pipe(stream2) : (stream2.write(message), stream2.end()), callback(err);
          }
          let envelopeTime = Date.now(), stream = this._createSendStream((err2, str) => err2 ? callback(err2) : (info.envelopeTime = envelopeTime - startTime, info.messageTime = Date.now() - envelopeTime, info.messageSize = stream.outByteCount, info.response = str, callback(null, info)));
          typeof message.pipe == "function" ? message.pipe(stream) : (stream.write(message), stream.end());
        });
      }
      /**
       * Resets connection state
       *
       * @param {Function} callback Callback to return once connection is reset
       */
      reset(callback) {
        this._sendCommand("RSET"), this._responseActions.push((str) => str.charAt(0) !== "2" ? callback(this._formatError("Could not reset session state. response=" + str, "EPROTOCOL", str, "RSET")) : (this._envelope = !1, callback(null, !0)));
      }
      /**
       * Connection listener that is run when the connection to
       * the server is opened
       *
       * @event
       */
      _onConnect() {
        if (clearTimeout(this._connectionTimeout), this.logger.info(
          {
            tnx: "network",
            localAddress: this._socket.localAddress,
            localPort: this._socket.localPort,
            remoteAddress: this._socket.remoteAddress,
            remotePort: this._socket.remotePort
          },
          "%s established to %s:%s",
          this.secure ? "Secure connection" : "Connection",
          this._socket.remoteAddress,
          this._socket.remotePort
        ), this._destroyed) {
          this.close();
          return;
        }
        this.stage = "connected", this._socket.removeListener("data", this._onSocketData), this._socket.removeListener("timeout", this._onSocketTimeout), this._socket.removeListener("close", this._onSocketClose), this._socket.removeListener("end", this._onSocketEnd), this._socket.on("data", this._onSocketData), this._socket.once("close", this._onSocketClose), this._socket.once("end", this._onSocketEnd), this._socket.setTimeout(this.options.socketTimeout || SOCKET_TIMEOUT), this._socket.on("timeout", this._onSocketTimeout), this._greetingTimeout = setTimeout(() => {
          this._socket && !this._destroyed && this._responseActions[0] === this._actionGreeting && this._onError("Greeting never received", "ETIMEDOUT", !1, "CONN");
        }, this.options.greetingTimeout || GREETING_TIMEOUT), this._responseActions.push(this._actionGreeting), this._socket.resume();
      }
      /**
       * 'data' listener for data coming from the server
       *
       * @event
       * @param {Buffer} chunk Data chunk coming from the server
       */
      _onData(chunk) {
        if (this._destroyed || !chunk || !chunk.length)
          return;
        let data = (chunk || "").toString("binary"), lines = (this._remainder + data).split(/\r?\n/), lastline;
        this._remainder = lines.pop();
        for (let i = 0, len = lines.length; i < len; i++) {
          if (this._responseQueue.length && (lastline = this._responseQueue[this._responseQueue.length - 1], /^\d+-/.test(lastline.split(`
`).pop()))) {
            this._responseQueue[this._responseQueue.length - 1] += `
` + lines[i];
            continue;
          }
          this._responseQueue.push(lines[i]);
        }
        this._responseQueue.length && (lastline = this._responseQueue[this._responseQueue.length - 1], /^\d+-/.test(lastline.split(`
`).pop())) || this._processResponse();
      }
      /**
       * 'error' listener for the socket
       *
       * @event
       * @param {Error} err Error object
       * @param {String} type Error name
       */
      _onError(err, type, data, command) {
        clearTimeout(this._connectionTimeout), clearTimeout(this._greetingTimeout), !this._destroyed && (err = this._formatError(err, type, data, command), this.logger.error(data, err.message), this.emit("error", err), this.close());
      }
      _formatError(message, type, response, command) {
        let err;
        /Error\]$/i.test(Object.prototype.toString.call(message)) ? err = message : err = new Error(message), type && type !== "Error" && (err.code = type), response && (err.response = response, err.message += ": " + response);
        let responseCode = typeof response == "string" && Number((response.match(/^\d+/) || [])[0]) || !1;
        return responseCode && (err.responseCode = responseCode), command && (err.command = command), err;
      }
      /**
       * 'close' listener for the socket
       *
       * @event
       */
      _onClose() {
        let serverResponse = !1;
        if (this._remainder && this._remainder.trim() && ((this.options.debug || this.options.transactionLog) && this.logger.debug(
          {
            tnx: "server"
          },
          this._remainder.replace(/\r?\n$/, "")
        ), this.lastServerResponse = serverResponse = this._remainder.trim()), this.logger.info(
          {
            tnx: "network"
          },
          "Connection closed"
        ), this.upgrading && !this._destroyed)
          return this._onError(new Error("Connection closed unexpectedly"), "ETLS", serverResponse, "CONN");
        if (![this._actionGreeting, this.close].includes(this._responseActions[0]) && !this._destroyed)
          return this._onError(new Error("Connection closed unexpectedly"), "ECONNECTION", serverResponse, "CONN");
        if (/^[45]\d{2}\b/.test(serverResponse))
          return this._onError(new Error("Connection closed unexpectedly"), "ECONNECTION", serverResponse, "CONN");
        this._destroy();
      }
      /**
       * 'end' listener for the socket
       *
       * @event
       */
      _onEnd() {
        this._socket && !this._socket.destroyed && this._socket.destroy();
      }
      /**
       * 'timeout' listener for the socket
       *
       * @event
       */
      _onTimeout() {
        return this._onError(new Error("Timeout"), "ETIMEDOUT", !1, "CONN");
      }
      /**
       * Destroys the client, emits 'end'
       */
      _destroy() {
        this._destroyed || (this._destroyed = !0, this.emit("end"));
      }
      /**
       * Upgrades the connection to TLS
       *
       * @param {Function} callback Callback function to run when the connection
       *        has been secured
       */
      _upgradeConnection(callback) {
        this._socket.removeListener("data", this._onSocketData), this._socket.removeListener("timeout", this._onSocketTimeout);
        let socketPlain = this._socket, opts = {
          socket: this._socket,
          host: this.host
        };
        Object.keys(this.options.tls || {}).forEach((key) => {
          opts[key] = this.options.tls[key];
        }), this.servername && !opts.servername && (opts.servername = this.servername), this.upgrading = !0;
        try {
          this._socket = tls.connect(opts, () => (this.secure = !0, this.upgrading = !1, this._socket.on("data", this._onSocketData), socketPlain.removeListener("close", this._onSocketClose), socketPlain.removeListener("end", this._onSocketEnd), callback(null, !0)));
        } catch (err) {
          return callback(err);
        }
        this._socket.on("error", this._onSocketError), this._socket.once("close", this._onSocketClose), this._socket.once("end", this._onSocketEnd), this._socket.setTimeout(this.options.socketTimeout || SOCKET_TIMEOUT), this._socket.on("timeout", this._onSocketTimeout), socketPlain.resume();
      }
      /**
       * Processes queued responses from the server
       *
       * @param {Boolean} force If true, ignores _processing flag
       */
      _processResponse() {
        if (!this._responseQueue.length)
          return !1;
        let str = this.lastServerResponse = (this._responseQueue.shift() || "").toString();
        if (/^\d+-/.test(str.split(`
`).pop()))
          return;
        (this.options.debug || this.options.transactionLog) && this.logger.debug(
          {
            tnx: "server"
          },
          str.replace(/\r?\n$/, "")
        ), str.trim() || setImmediate(() => this._processResponse());
        let action = this._responseActions.shift();
        if (typeof action == "function")
          action.call(this, str), setImmediate(() => this._processResponse());
        else
          return this._onError(new Error("Unexpected Response"), "EPROTOCOL", str, "CONN");
      }
      /**
       * Send a command to the server, append \r\n
       *
       * @param {String} str String to be sent to the server
       * @param {String} logStr Optional string to be used for logging instead of the actual string
       */
      _sendCommand(str, logStr) {
        if (!this._destroyed) {
          if (this._socket.destroyed)
            return this.close();
          (this.options.debug || this.options.transactionLog) && this.logger.debug(
            {
              tnx: "client"
            },
            (logStr || str || "").toString().replace(/\r?\n$/, "")
          ), this._socket.write(Buffer.from(str + `\r
`, "utf-8"));
        }
      }
      /**
       * Initiates a new message by submitting envelope data, starting with
       * MAIL FROM: command
       *
       * @param {Object} envelope Envelope object in the form of
       *        {from:'...', to:['...']}
       *        or
       *        {from:{address:'...',name:'...'}, to:[address:'...',name:'...']}
       */
      _setEnvelope(envelope, callback) {
        let args = [], useSmtpUtf8 = !1;
        if (this._envelope = envelope || {}, this._envelope.from = (this._envelope.from && this._envelope.from.address || this._envelope.from || "").toString().trim(), this._envelope.to = [].concat(this._envelope.to || []).map((to) => (to && to.address || to || "").toString().trim()), !this._envelope.to.length)
          return callback(this._formatError("No recipients defined", "EENVELOPE", !1, "API"));
        if (this._envelope.from && /[\r\n<>]/.test(this._envelope.from))
          return callback(this._formatError("Invalid sender " + JSON.stringify(this._envelope.from), "EENVELOPE", !1, "API"));
        /[\x80-\uFFFF]/.test(this._envelope.from) && (useSmtpUtf8 = !0);
        for (let i = 0, len = this._envelope.to.length; i < len; i++) {
          if (!this._envelope.to[i] || /[\r\n<>]/.test(this._envelope.to[i]))
            return callback(this._formatError("Invalid recipient " + JSON.stringify(this._envelope.to[i]), "EENVELOPE", !1, "API"));
          /[\x80-\uFFFF]/.test(this._envelope.to[i]) && (useSmtpUtf8 = !0);
        }
        if (this._envelope.rcptQueue = JSON.parse(JSON.stringify(this._envelope.to || [])), this._envelope.rejected = [], this._envelope.rejectedErrors = [], this._envelope.accepted = [], this._envelope.dsn)
          try {
            this._envelope.dsn = this._setDsnEnvelope(this._envelope.dsn);
          } catch (err) {
            return callback(this._formatError("Invalid DSN " + err.message, "EENVELOPE", !1, "API"));
          }
        this._responseActions.push((str) => {
          this._actionMAIL(str, callback);
        }), useSmtpUtf8 && this._supportedExtensions.includes("SMTPUTF8") && (args.push("SMTPUTF8"), this._usingSmtpUtf8 = !0), this._envelope.use8BitMime && this._supportedExtensions.includes("8BITMIME") && (args.push("BODY=8BITMIME"), this._using8BitMime = !0), this._envelope.size && this._supportedExtensions.includes("SIZE") && args.push("SIZE=" + this._envelope.size), this._envelope.dsn && this._supportedExtensions.includes("DSN") && (this._envelope.dsn.ret && args.push("RET=" + shared.encodeXText(this._envelope.dsn.ret)), this._envelope.dsn.envid && args.push("ENVID=" + shared.encodeXText(this._envelope.dsn.envid))), this._sendCommand("MAIL FROM:<" + this._envelope.from + ">" + (args.length ? " " + args.join(" ") : ""));
      }
      _setDsnEnvelope(params) {
        let ret = (params.ret || params.return || "").toString().toUpperCase() || null;
        if (ret)
          switch (ret) {
            case "HDRS":
            case "HEADERS":
              ret = "HDRS";
              break;
            case "FULL":
            case "BODY":
              ret = "FULL";
              break;
          }
        if (ret && !["FULL", "HDRS"].includes(ret))
          throw new Error("ret: " + JSON.stringify(ret));
        let envid = (params.envid || params.id || "").toString() || null, notify = params.notify || null;
        if (notify) {
          typeof notify == "string" && (notify = notify.split(",")), notify = notify.map((n) => n.trim().toUpperCase());
          let validNotify = ["NEVER", "SUCCESS", "FAILURE", "DELAY"];
          if (notify.filter((n) => !validNotify.includes(n)).length || notify.length > 1 && notify.includes("NEVER"))
            throw new Error("notify: " + JSON.stringify(notify.join(",")));
          notify = notify.join(",");
        }
        let orcpt = (params.recipient || params.orcpt || "").toString() || null;
        return orcpt && orcpt.indexOf(";") < 0 && (orcpt = "rfc822;" + orcpt), {
          ret,
          envid,
          notify,
          orcpt
        };
      }
      _getDsnRcptToArgs() {
        let args = [];
        return this._envelope.dsn && this._supportedExtensions.includes("DSN") && (this._envelope.dsn.notify && args.push("NOTIFY=" + shared.encodeXText(this._envelope.dsn.notify)), this._envelope.dsn.orcpt && args.push("ORCPT=" + shared.encodeXText(this._envelope.dsn.orcpt))), args.length ? " " + args.join(" ") : "";
      }
      _createSendStream(callback) {
        let dataStream = new DataStream(), logStream;
        return this.options.lmtp ? this._envelope.accepted.forEach((recipient, i) => {
          let final = i === this._envelope.accepted.length - 1;
          this._responseActions.push((str) => {
            this._actionLMTPStream(recipient, final, str, callback);
          });
        }) : this._responseActions.push((str) => {
          this._actionSMTPStream(str, callback);
        }), dataStream.pipe(this._socket, {
          end: !1
        }), this.options.debug && (logStream = new PassThrough(), logStream.on("readable", () => {
          let chunk;
          for (; chunk = logStream.read(); )
            this.logger.debug(
              {
                tnx: "message"
              },
              chunk.toString("binary").replace(/\r?\n$/, "")
            );
        }), dataStream.pipe(logStream)), dataStream.once("end", () => {
          this.logger.info(
            {
              tnx: "message",
              inByteCount: dataStream.inByteCount,
              outByteCount: dataStream.outByteCount
            },
            "<%s bytes encoded mime message (source size %s bytes)>",
            dataStream.outByteCount,
            dataStream.inByteCount
          );
        }), dataStream;
      }
      /** ACTIONS **/
      /**
       * Will be run after the connection is created and the server sends
       * a greeting. If the incoming message starts with 220 initiate
       * SMTP session by sending EHLO command
       *
       * @param {String} str Message from the server
       */
      _actionGreeting(str) {
        if (clearTimeout(this._greetingTimeout), str.substr(0, 3) !== "220") {
          this._onError(new Error("Invalid greeting. response=" + str), "EPROTOCOL", str, "CONN");
          return;
        }
        this.options.lmtp ? (this._responseActions.push(this._actionLHLO), this._sendCommand("LHLO " + this.name)) : (this._responseActions.push(this._actionEHLO), this._sendCommand("EHLO " + this.name));
      }
      /**
       * Handles server response for LHLO command. If it yielded in
       * error, emit 'error', otherwise treat this as an EHLO response
       *
       * @param {String} str Message from the server
       */
      _actionLHLO(str) {
        if (str.charAt(0) !== "2") {
          this._onError(new Error("Invalid LHLO. response=" + str), "EPROTOCOL", str, "LHLO");
          return;
        }
        this._actionEHLO(str);
      }
      /**
       * Handles server response for EHLO command. If it yielded in
       * error, try HELO instead, otherwise initiate TLS negotiation
       * if STARTTLS is supported by the server or move into the
       * authentication phase.
       *
       * @param {String} str Message from the server
       */
      _actionEHLO(str) {
        let match;
        if (str.substr(0, 3) === "421") {
          this._onError(new Error("Server terminates connection. response=" + str), "ECONNECTION", str, "EHLO");
          return;
        }
        if (str.charAt(0) !== "2") {
          if (this.options.requireTLS) {
            this._onError(new Error("EHLO failed but HELO does not support required STARTTLS. response=" + str), "ECONNECTION", str, "EHLO");
            return;
          }
          this._responseActions.push(this._actionHELO), this._sendCommand("HELO " + this.name);
          return;
        }
        if (this._ehloLines = str.split(/\r?\n/).map((line) => line.replace(/^\d+[ -]/, "").trim()).filter((line) => line).slice(1), !this.secure && !this.options.ignoreTLS && (/[ -]STARTTLS\b/im.test(str) || this.options.requireTLS)) {
          this._sendCommand("STARTTLS"), this._responseActions.push(this._actionSTARTTLS);
          return;
        }
        /[ -]SMTPUTF8\b/im.test(str) && this._supportedExtensions.push("SMTPUTF8"), /[ -]DSN\b/im.test(str) && this._supportedExtensions.push("DSN"), /[ -]8BITMIME\b/im.test(str) && this._supportedExtensions.push("8BITMIME"), /[ -]PIPELINING\b/im.test(str) && this._supportedExtensions.push("PIPELINING"), /[ -]AUTH\b/i.test(str) && (this.allowsAuth = !0), /[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)PLAIN/i.test(str) && this._supportedAuth.push("PLAIN"), /[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)LOGIN/i.test(str) && this._supportedAuth.push("LOGIN"), /[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)CRAM-MD5/i.test(str) && this._supportedAuth.push("CRAM-MD5"), /[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)XOAUTH2/i.test(str) && this._supportedAuth.push("XOAUTH2"), (match = str.match(/[ -]SIZE(?:[ \t]+(\d+))?/im)) && (this._supportedExtensions.push("SIZE"), this._maxAllowedSize = Number(match[1]) || 0), this.emit("connect");
      }
      /**
       * Handles server response for HELO command. If it yielded in
       * error, emit 'error', otherwise move into the authentication phase.
       *
       * @param {String} str Message from the server
       */
      _actionHELO(str) {
        if (str.charAt(0) !== "2") {
          this._onError(new Error("Invalid HELO. response=" + str), "EPROTOCOL", str, "HELO");
          return;
        }
        this.allowsAuth = !0, this.emit("connect");
      }
      /**
       * Handles server response for STARTTLS command. If there's an error
       * try HELO instead, otherwise initiate TLS upgrade. If the upgrade
       * succeedes restart the EHLO
       *
       * @param {String} str Message from the server
       */
      _actionSTARTTLS(str) {
        if (str.charAt(0) !== "2") {
          if (this.options.opportunisticTLS)
            return this.logger.info(
              {
                tnx: "smtp"
              },
              "Failed STARTTLS upgrade, continuing unencrypted"
            ), this.emit("connect");
          this._onError(new Error("Error upgrading connection with STARTTLS"), "ETLS", str, "STARTTLS");
          return;
        }
        this._upgradeConnection((err, secured) => {
          if (err) {
            this._onError(new Error("Error initiating TLS - " + (err.message || err)), "ETLS", !1, "STARTTLS");
            return;
          }
          this.logger.info(
            {
              tnx: "smtp"
            },
            "Connection upgraded with STARTTLS"
          ), secured ? this.options.lmtp ? (this._responseActions.push(this._actionLHLO), this._sendCommand("LHLO " + this.name)) : (this._responseActions.push(this._actionEHLO), this._sendCommand("EHLO " + this.name)) : this.emit("connect");
        });
      }
      /**
       * Handle the response for AUTH LOGIN command. We are expecting
       * '334 VXNlcm5hbWU6' (base64 for 'Username:'). Data to be sent as
       * response needs to be base64 encoded username. We do not need
       * exact match but settle with 334 response in general as some
       * hosts invalidly use a longer message than VXNlcm5hbWU6
       *
       * @param {String} str Message from the server
       */
      _actionAUTH_LOGIN_USER(str, callback) {
        if (!/^334[ -]/.test(str)) {
          callback(this._formatError('Invalid login sequence while waiting for "334 VXNlcm5hbWU6"', "EAUTH", str, "AUTH LOGIN"));
          return;
        }
        this._responseActions.push((str2) => {
          this._actionAUTH_LOGIN_PASS(str2, callback);
        }), this._sendCommand(Buffer.from(this._auth.credentials.user + "", "utf-8").toString("base64"));
      }
      /**
       * Handle the response for AUTH CRAM-MD5 command. We are expecting
       * '334 <challenge string>'. Data to be sent as response needs to be
       * base64 decoded challenge string, MD5 hashed using the password as
       * a HMAC key, prefixed by the username and a space, and finally all
       * base64 encoded again.
       *
       * @param {String} str Message from the server
       */
      _actionAUTH_CRAM_MD5(str, callback) {
        let challengeMatch = str.match(/^334\s+(.+)$/), challengeString = "";
        if (challengeMatch)
          challengeString = challengeMatch[1];
        else
          return callback(this._formatError("Invalid login sequence while waiting for server challenge string", "EAUTH", str, "AUTH CRAM-MD5"));
        let base64decoded = Buffer.from(challengeString, "base64").toString("ascii"), hmacMD5 = crypto2.createHmac("md5", this._auth.credentials.pass);
        hmacMD5.update(base64decoded);
        let prepended = this._auth.credentials.user + " " + hmacMD5.digest("hex");
        this._responseActions.push((str2) => {
          this._actionAUTH_CRAM_MD5_PASS(str2, callback);
        }), this._sendCommand(
          Buffer.from(prepended).toString("base64"),
          // hidden hash for logs
          Buffer.from(this._auth.credentials.user + " /* secret */").toString("base64")
        );
      }
      /**
       * Handles the response to CRAM-MD5 authentication, if there's no error,
       * the user can be considered logged in. Start waiting for a message to send
       *
       * @param {String} str Message from the server
       */
      _actionAUTH_CRAM_MD5_PASS(str, callback) {
        if (!str.match(/^235\s+/))
          return callback(this._formatError('Invalid login sequence while waiting for "235"', "EAUTH", str, "AUTH CRAM-MD5"));
        this.logger.info(
          {
            tnx: "smtp",
            username: this._auth.user,
            action: "authenticated",
            method: this._authMethod
          },
          "User %s authenticated",
          JSON.stringify(this._auth.user)
        ), this.authenticated = !0, callback(null, !0);
      }
      /**
       * Handle the response for AUTH LOGIN command. We are expecting
       * '334 UGFzc3dvcmQ6' (base64 for 'Password:'). Data to be sent as
       * response needs to be base64 encoded password.
       *
       * @param {String} str Message from the server
       */
      _actionAUTH_LOGIN_PASS(str, callback) {
        if (!/^334[ -]/.test(str))
          return callback(this._formatError('Invalid login sequence while waiting for "334 UGFzc3dvcmQ6"', "EAUTH", str, "AUTH LOGIN"));
        this._responseActions.push((str2) => {
          this._actionAUTHComplete(str2, callback);
        }), this._sendCommand(
          Buffer.from((this._auth.credentials.pass || "").toString(), "utf-8").toString("base64"),
          // Hidden pass for logs
          Buffer.from("/* secret */", "utf-8").toString("base64")
        );
      }
      /**
       * Handles the response for authentication, if there's no error,
       * the user can be considered logged in. Start waiting for a message to send
       *
       * @param {String} str Message from the server
       */
      _actionAUTHComplete(str, isRetry, callback) {
        if (!callback && typeof isRetry == "function" && (callback = isRetry, isRetry = !1), str.substr(0, 3) === "334") {
          this._responseActions.push((str2) => {
            isRetry || this._authMethod !== "XOAUTH2" ? this._actionAUTHComplete(str2, !0, callback) : setImmediate(() => this._handleXOauth2Token(!0, callback));
          }), this._sendCommand("");
          return;
        }
        if (str.charAt(0) !== "2")
          return this.logger.info(
            {
              tnx: "smtp",
              username: this._auth.user,
              action: "authfail",
              method: this._authMethod
            },
            "User %s failed to authenticate",
            JSON.stringify(this._auth.user)
          ), callback(this._formatError("Invalid login", "EAUTH", str, "AUTH " + this._authMethod));
        this.logger.info(
          {
            tnx: "smtp",
            username: this._auth.user,
            action: "authenticated",
            method: this._authMethod
          },
          "User %s authenticated",
          JSON.stringify(this._auth.user)
        ), this.authenticated = !0, callback(null, !0);
      }
      /**
       * Handle response for a MAIL FROM: command
       *
       * @param {String} str Message from the server
       */
      _actionMAIL(str, callback) {
        let message, curRecipient;
        if (Number(str.charAt(0)) !== 2)
          return this._usingSmtpUtf8 && /^550 /.test(str) && /[\x80-\uFFFF]/.test(this._envelope.from) ? message = "Internationalized mailbox name not allowed" : message = "Mail command failed", callback(this._formatError(message, "EENVELOPE", str, "MAIL FROM"));
        if (this._envelope.rcptQueue.length)
          if (this._recipientQueue = [], this._supportedExtensions.includes("PIPELINING"))
            for (; this._envelope.rcptQueue.length; )
              curRecipient = this._envelope.rcptQueue.shift(), this._recipientQueue.push(curRecipient), this._responseActions.push((str2) => {
                this._actionRCPT(str2, callback);
              }), this._sendCommand("RCPT TO:<" + curRecipient + ">" + this._getDsnRcptToArgs());
          else
            curRecipient = this._envelope.rcptQueue.shift(), this._recipientQueue.push(curRecipient), this._responseActions.push((str2) => {
              this._actionRCPT(str2, callback);
            }), this._sendCommand("RCPT TO:<" + curRecipient + ">" + this._getDsnRcptToArgs());
        else
          return callback(this._formatError("Can't send mail - no recipients defined", "EENVELOPE", !1, "API"));
      }
      /**
       * Handle response for a RCPT TO: command
       *
       * @param {String} str Message from the server
       */
      _actionRCPT(str, callback) {
        let message, err, curRecipient = this._recipientQueue.shift();
        if (Number(str.charAt(0)) !== 2 ? (this._usingSmtpUtf8 && /^553 /.test(str) && /[\x80-\uFFFF]/.test(curRecipient) ? message = "Internationalized mailbox name not allowed" : message = "Recipient command failed", this._envelope.rejected.push(curRecipient), err = this._formatError(message, "EENVELOPE", str, "RCPT TO"), err.recipient = curRecipient, this._envelope.rejectedErrors.push(err)) : this._envelope.accepted.push(curRecipient), !this._envelope.rcptQueue.length && !this._recipientQueue.length)
          if (this._envelope.rejected.length < this._envelope.to.length)
            this._responseActions.push((str2) => {
              this._actionDATA(str2, callback);
            }), this._sendCommand("DATA");
          else
            return err = this._formatError("Can't send mail - all recipients were rejected", "EENVELOPE", str, "RCPT TO"), err.rejected = this._envelope.rejected, err.rejectedErrors = this._envelope.rejectedErrors, callback(err);
        else this._envelope.rcptQueue.length && (curRecipient = this._envelope.rcptQueue.shift(), this._recipientQueue.push(curRecipient), this._responseActions.push((str2) => {
          this._actionRCPT(str2, callback);
        }), this._sendCommand("RCPT TO:<" + curRecipient + ">" + this._getDsnRcptToArgs()));
      }
      /**
       * Handle response for a DATA command
       *
       * @param {String} str Message from the server
       */
      _actionDATA(str, callback) {
        if (!/^[23]/.test(str))
          return callback(this._formatError("Data command failed", "EENVELOPE", str, "DATA"));
        let response = {
          accepted: this._envelope.accepted,
          rejected: this._envelope.rejected
        };
        this._ehloLines && this._ehloLines.length && (response.ehlo = this._ehloLines), this._envelope.rejectedErrors.length && (response.rejectedErrors = this._envelope.rejectedErrors), callback(null, response);
      }
      /**
       * Handle response for a DATA stream when using SMTP
       * We expect a single response that defines if the sending succeeded or failed
       *
       * @param {String} str Message from the server
       */
      _actionSMTPStream(str, callback) {
        return Number(str.charAt(0)) !== 2 ? callback(this._formatError("Message failed", "EMESSAGE", str, "DATA")) : callback(null, str);
      }
      /**
       * Handle response for a DATA stream
       * We expect a separate response for every recipient. All recipients can either
       * succeed or fail separately
       *
       * @param {String} recipient The recipient this response applies to
       * @param {Boolean} final Is this the final recipient?
       * @param {String} str Message from the server
       */
      _actionLMTPStream(recipient, final, str, callback) {
        let err;
        if (Number(str.charAt(0)) !== 2) {
          err = this._formatError("Message failed for recipient " + recipient, "EMESSAGE", str, "DATA"), err.recipient = recipient, this._envelope.rejected.push(recipient), this._envelope.rejectedErrors.push(err);
          for (let i = 0, len = this._envelope.accepted.length; i < len; i++)
            this._envelope.accepted[i] === recipient && this._envelope.accepted.splice(i, 1);
        }
        if (final)
          return callback(null, str);
      }
      _handleXOauth2Token(isRetry, callback) {
        this._auth.oauth2.getToken(isRetry, (err, accessToken2) => {
          if (err)
            return this.logger.info(
              {
                tnx: "smtp",
                username: this._auth.user,
                action: "authfail",
                method: this._authMethod
              },
              "User %s failed to authenticate",
              JSON.stringify(this._auth.user)
            ), callback(this._formatError(err, "EAUTH", !1, "AUTH XOAUTH2"));
          this._responseActions.push((str) => {
            this._actionAUTHComplete(str, isRetry, callback);
          }), this._sendCommand(
            "AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token(accessToken2),
            //  Hidden for logs
            "AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token("/* secret */")
          );
        });
      }
      /**
       *
       * @param {string} command
       * @private
       */
      _isDestroyedMessage(command) {
        if (this._destroyed)
          return "Cannot " + command + " - smtp connection is already destroyed.";
        if (this._socket) {
          if (this._socket.destroyed)
            return "Cannot " + command + " - smtp connection socket is already destroyed.";
          if (!this._socket.writable)
            return "Cannot " + command + " - smtp connection socket is already half-closed.";
        }
      }
      _getHostname() {
        let defaultHostname;
        try {
          defaultHostname = os.hostname() || "";
        } catch {
          defaultHostname = "localhost";
        }
        return (!defaultHostname || defaultHostname.indexOf(".") < 0) && (defaultHostname = "[127.0.0.1]"), defaultHostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) && (defaultHostname = "[" + defaultHostname + "]"), defaultHostname;
      }
    };
    module2.exports = SMTPConnection;
  }
});

// node_modules/nodemailer/lib/xoauth2/index.js
var require_xoauth2 = __commonJS({
  "node_modules/nodemailer/lib/xoauth2/index.js"(exports2, module2) {
    "use strict";
    var Stream = require("stream").Stream, nmfetch = require_fetch(), crypto2 = require("crypto"), shared = require_shared(), XOAuth2 = class extends Stream {
      constructor(options, logger) {
        if (super(), this.options = options || {}, options && options.serviceClient) {
          if (!options.privateKey || !options.user) {
            setImmediate(() => this.emit("error", new Error('Options "privateKey" and "user" are required for service account!')));
            return;
          }
          let serviceRequestTimeout = Math.min(Math.max(Number(this.options.serviceRequestTimeout) || 0, 0), 3600);
          this.options.serviceRequestTimeout = serviceRequestTimeout || 5 * 60;
        }
        if (this.logger = shared.getLogger(
          {
            logger
          },
          {
            component: this.options.component || "OAuth2"
          }
        ), this.provisionCallback = typeof this.options.provisionCallback == "function" ? this.options.provisionCallback : !1, this.options.accessUrl = this.options.accessUrl || "https://accounts.google.com/o/oauth2/token", this.options.customHeaders = this.options.customHeaders || {}, this.options.customParams = this.options.customParams || {}, this.accessToken = this.options.accessToken || !1, this.options.expires && Number(this.options.expires))
          this.expires = this.options.expires;
        else {
          let timeout = Math.max(Number(this.options.timeout) || 0, 0);
          this.expires = timeout && Date.now() + timeout * 1e3 || 0;
        }
      }
      /**
       * Returns or generates (if previous has expired) a XOAuth2 token
       *
       * @param {Boolean} renew If false then use cached access token (if available)
       * @param {Function} callback Callback function with error object and token string
       */
      getToken(renew, callback) {
        if (!renew && this.accessToken && (!this.expires || this.expires > Date.now()))
          return callback(null, this.accessToken);
        let generateCallback = (...args) => {
          args[0] ? this.logger.error(
            {
              err: args[0],
              tnx: "OAUTH2",
              user: this.options.user,
              action: "renew"
            },
            "Failed generating new Access Token for %s",
            this.options.user
          ) : this.logger.info(
            {
              tnx: "OAUTH2",
              user: this.options.user,
              action: "renew"
            },
            "Generated new Access Token for %s",
            this.options.user
          ), callback(...args);
        };
        this.provisionCallback ? this.provisionCallback(this.options.user, !!renew, (err, accessToken2, expires) => {
          !err && accessToken2 && (this.accessToken = accessToken2, this.expires = expires || 0), generateCallback(err, accessToken2);
        }) : this.generateToken(generateCallback);
      }
      /**
       * Updates token values
       *
       * @param {String} accessToken New access token
       * @param {Number} timeout Access token lifetime in seconds
       *
       * Emits 'token': { user: User email-address, accessToken: the new accessToken, timeout: TTL in seconds}
       */
      updateToken(accessToken2, timeout) {
        this.accessToken = accessToken2, timeout = Math.max(Number(timeout) || 0, 0), this.expires = timeout && Date.now() + timeout * 1e3 || 0, this.emit("token", {
          user: this.options.user,
          accessToken: accessToken2 || "",
          expires: this.expires
        });
      }
      /**
       * Generates a new XOAuth2 token with the credentials provided at initialization
       *
       * @param {Function} callback Callback function with error object and token string
       */
      generateToken(callback) {
        let urlOptions, loggedUrlOptions;
        if (this.options.serviceClient) {
          let iat = Math.floor(Date.now() / 1e3), tokenData = {
            iss: this.options.serviceClient,
            scope: this.options.scope || "https://mail.google.com/",
            sub: this.options.user,
            aud: this.options.accessUrl,
            iat,
            exp: iat + this.options.serviceRequestTimeout
          }, token;
          try {
            token = this.jwtSignRS256(tokenData);
          } catch {
            return callback(new Error("Can't generate token. Check your auth options"));
          }
          urlOptions = {
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: token
          }, loggedUrlOptions = {
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: tokenData
          };
        } else {
          if (!this.options.refreshToken)
            return callback(new Error("Can't create new access token for user"));
          urlOptions = {
            client_id: this.options.clientId || "",
            client_secret: this.options.clientSecret || "",
            refresh_token: this.options.refreshToken,
            grant_type: "refresh_token"
          }, loggedUrlOptions = {
            client_id: this.options.clientId || "",
            client_secret: (this.options.clientSecret || "").substr(0, 6) + "...",
            refresh_token: (this.options.refreshToken || "").substr(0, 6) + "...",
            grant_type: "refresh_token"
          };
        }
        Object.keys(this.options.customParams).forEach((key) => {
          urlOptions[key] = this.options.customParams[key], loggedUrlOptions[key] = this.options.customParams[key];
        }), this.logger.debug(
          {
            tnx: "OAUTH2",
            user: this.options.user,
            action: "generate"
          },
          "Requesting token using: %s",
          JSON.stringify(loggedUrlOptions)
        ), this.postRequest(this.options.accessUrl, urlOptions, this.options, (error, body) => {
          let data;
          if (error)
            return callback(error);
          try {
            data = JSON.parse(body.toString());
          } catch (E) {
            return callback(E);
          }
          if (!data || typeof data != "object")
            return this.logger.debug(
              {
                tnx: "OAUTH2",
                user: this.options.user,
                action: "post"
              },
              "Response: %s",
              (body || "").toString()
            ), callback(new Error("Invalid authentication response"));
          let logData = {};
          if (Object.keys(data).forEach((key) => {
            key !== "access_token" ? logData[key] = data[key] : logData[key] = (data[key] || "").toString().substr(0, 6) + "...";
          }), this.logger.debug(
            {
              tnx: "OAUTH2",
              user: this.options.user,
              action: "post"
            },
            "Response: %s",
            JSON.stringify(logData)
          ), data.error) {
            let errorMessage = data.error;
            return data.error_description && (errorMessage += ": " + data.error_description), data.error_uri && (errorMessage += " (" + data.error_uri + ")"), callback(new Error(errorMessage));
          }
          return data.access_token ? (this.updateToken(data.access_token, data.expires_in), callback(null, this.accessToken)) : callback(new Error("No access token"));
        });
      }
      /**
       * Converts an access_token and user id into a base64 encoded XOAuth2 token
       *
       * @param {String} [accessToken] Access token string
       * @return {String} Base64 encoded token for IMAP or SMTP login
       */
      buildXOAuth2Token(accessToken2) {
        let authData = ["user=" + (this.options.user || ""), "auth=Bearer " + (accessToken2 || this.accessToken), "", ""];
        return Buffer.from(authData.join(""), "utf-8").toString("base64");
      }
      /**
       * Custom POST request handler.
       * This is only needed to keep paths short in Windows – usually this module
       * is a dependency of a dependency and if it tries to require something
       * like the request module the paths get way too long to handle for Windows.
       * As we do only a simple POST request we do not actually require complicated
       * logic support (no redirects, no nothing) anyway.
       *
       * @param {String} url Url to POST to
       * @param {String|Buffer} payload Payload to POST
       * @param {Function} callback Callback function with (err, buff)
       */
      postRequest(url, payload, params, callback) {
        let returned = !1, chunks = [], chunklen = 0, req = nmfetch(url, {
          method: "post",
          headers: params.customHeaders,
          body: payload,
          allowErrorResponse: !0
        });
        req.on("readable", () => {
          let chunk;
          for (; (chunk = req.read()) !== null; )
            chunks.push(chunk), chunklen += chunk.length;
        }), req.once("error", (err) => {
          if (!returned)
            return returned = !0, callback(err);
        }), req.once("end", () => {
          if (!returned)
            return returned = !0, callback(null, Buffer.concat(chunks, chunklen));
        });
      }
      /**
       * Encodes a buffer or a string into Base64url format
       *
       * @param {Buffer|String} data The data to convert
       * @return {String} The encoded string
       */
      toBase64URL(data) {
        return typeof data == "string" && (data = Buffer.from(data)), data.toString("base64").replace(/[=]+/g, "").replace(/\+/g, "-").replace(/\//g, "_");
      }
      /**
       * Creates a JSON Web Token signed with RS256 (SHA256 + RSA)
       *
       * @param {Object} payload The payload to include in the generated token
       * @return {String} The generated and signed token
       */
      jwtSignRS256(payload) {
        payload = ['{"alg":"RS256","typ":"JWT"}', JSON.stringify(payload)].map((val) => this.toBase64URL(val)).join(".");
        let signature = crypto2.createSign("RSA-SHA256").update(payload).sign(this.options.privateKey);
        return payload + "." + this.toBase64URL(signature);
      }
    };
    module2.exports = XOAuth2;
  }
});

// node_modules/nodemailer/lib/smtp-pool/pool-resource.js
var require_pool_resource = __commonJS({
  "node_modules/nodemailer/lib/smtp-pool/pool-resource.js"(exports2, module2) {
    "use strict";
    var SMTPConnection = require_smtp_connection(), assign = require_shared().assign, XOAuth2 = require_xoauth2(), EventEmitter = require("events"), PoolResource = class extends EventEmitter {
      constructor(pool) {
        if (super(), this.pool = pool, this.options = pool.options, this.logger = this.pool.logger, this.options.auth)
          switch ((this.options.auth.type || "").toString().toUpperCase()) {
            case "OAUTH2": {
              let oauth2 = new XOAuth2(this.options.auth, this.logger);
              oauth2.provisionCallback = this.pool.mailer && this.pool.mailer.get("oauth2_provision_cb") || oauth2.provisionCallback, this.auth = {
                type: "OAUTH2",
                user: this.options.auth.user,
                oauth2,
                method: "XOAUTH2"
              }, oauth2.on("token", (token) => this.pool.mailer.emit("token", token)), oauth2.on("error", (err) => this.emit("error", err));
              break;
            }
            default:
              if (!this.options.auth.user && !this.options.auth.pass)
                break;
              this.auth = {
                type: (this.options.auth.type || "").toString().toUpperCase() || "LOGIN",
                user: this.options.auth.user,
                credentials: {
                  user: this.options.auth.user || "",
                  pass: this.options.auth.pass,
                  options: this.options.auth.options
                },
                method: (this.options.auth.method || "").trim().toUpperCase() || this.options.authMethod || !1
              };
          }
        this._connection = !1, this._connected = !1, this.messages = 0, this.available = !0;
      }
      /**
       * Initiates a connection to the SMTP server
       *
       * @param {Function} callback Callback function to run once the connection is established or failed
       */
      connect(callback) {
        this.pool.getSocket(this.options, (err, socketOptions) => {
          if (err)
            return callback(err);
          let returned = !1, options = this.options;
          socketOptions && socketOptions.connection && (this.logger.info(
            {
              tnx: "proxy",
              remoteAddress: socketOptions.connection.remoteAddress,
              remotePort: socketOptions.connection.remotePort,
              destHost: options.host || "",
              destPort: options.port || "",
              action: "connected"
            },
            "Using proxied socket from %s:%s to %s:%s",
            socketOptions.connection.remoteAddress,
            socketOptions.connection.remotePort,
            options.host || "",
            options.port || ""
          ), options = assign(!1, options), Object.keys(socketOptions).forEach((key) => {
            options[key] = socketOptions[key];
          })), this.connection = new SMTPConnection(options), this.connection.once("error", (err2) => {
            if (this.emit("error", err2), !returned)
              return returned = !0, callback(err2);
          }), this.connection.once("end", () => {
            if (this.close(), returned)
              return;
            returned = !0;
            let timer = setTimeout(() => {
              if (returned)
                return;
              let err2 = new Error("Unexpected socket close");
              this.connection && this.connection._socket && this.connection._socket.upgrading && (err2.code = "ETLS"), callback(err2);
            }, 1e3);
            try {
              timer.unref();
            } catch {
            }
          }), this.connection.connect(() => {
            if (!returned)
              if (this.auth && (this.connection.allowsAuth || options.forceAuth))
                this.connection.login(this.auth, (err2) => {
                  if (!returned) {
                    if (returned = !0, err2)
                      return this.connection.close(), this.emit("error", err2), callback(err2);
                    this._connected = !0, callback(null, !0);
                  }
                });
              else
                return returned = !0, this._connected = !0, callback(null, !0);
          });
        });
      }
      /**
       * Sends an e-mail to be sent using the selected settings
       *
       * @param {Object} mail Mail object
       * @param {Function} callback Callback function
       */
      send(mail, callback) {
        if (!this._connected)
          return this.connect((err) => err ? callback(err) : this.send(mail, callback));
        let envelope = mail.message.getEnvelope(), messageId = mail.message.messageId(), recipients = [].concat(envelope.to || []);
        recipients.length > 3 && recipients.push("...and " + recipients.splice(2).length + " more"), this.logger.info(
          {
            tnx: "send",
            messageId,
            cid: this.id
          },
          "Sending message %s using #%s to <%s>",
          messageId,
          this.id,
          recipients.join(", ")
        ), mail.data.dsn && (envelope.dsn = mail.data.dsn), this.connection.send(envelope, mail.message.createReadStream(), (err, info) => {
          if (this.messages++, err)
            return this.connection.close(), this.emit("error", err), callback(err);
          info.envelope = {
            from: envelope.from,
            to: envelope.to
          }, info.messageId = messageId, setImmediate(() => {
            let err2;
            this.messages >= this.options.maxMessages ? (err2 = new Error("Resource exhausted"), err2.code = "EMAXLIMIT", this.connection.close(), this.emit("error", err2)) : this.pool._checkRateLimit(() => {
              this.available = !0, this.emit("available");
            });
          }), callback(null, info);
        });
      }
      /**
       * Closes the connection
       */
      close() {
        this._connected = !1, this.auth && this.auth.oauth2 && this.auth.oauth2.removeAllListeners(), this.connection && this.connection.close(), this.emit("close");
      }
    };
    module2.exports = PoolResource;
  }
});

// node_modules/nodemailer/lib/well-known/services.json
var require_services = __commonJS({
  "node_modules/nodemailer/lib/well-known/services.json"(exports2, module2) {
    module2.exports = {
      "1und1": {
        host: "smtp.1und1.de",
        port: 465,
        secure: !0,
        authMethod: "LOGIN"
      },
      Aliyun: {
        domains: ["aliyun.com"],
        host: "smtp.aliyun.com",
        port: 465,
        secure: !0
      },
      AOL: {
        domains: ["aol.com"],
        host: "smtp.aol.com",
        port: 587
      },
      Bluewin: {
        host: "smtpauths.bluewin.ch",
        domains: ["bluewin.ch"],
        port: 465
      },
      DebugMail: {
        host: "debugmail.io",
        port: 25
      },
      DynectEmail: {
        aliases: ["Dynect"],
        host: "smtp.dynect.net",
        port: 25
      },
      Ethereal: {
        aliases: ["ethereal.email"],
        host: "smtp.ethereal.email",
        port: 587
      },
      FastMail: {
        domains: ["fastmail.fm"],
        host: "smtp.fastmail.com",
        port: 465,
        secure: !0
      },
      "Forward Email": {
        aliases: ["FE", "ForwardEmail"],
        domains: ["forwardemail.net"],
        host: "smtp.forwardemail.net",
        port: 465,
        secure: !0
      },
      "Feishu Mail": {
        aliases: ["Feishu", "FeishuMail"],
        domains: ["www.feishu.cn"],
        host: "smtp.feishu.cn",
        port: 465,
        secure: !0
      },
      GandiMail: {
        aliases: ["Gandi", "Gandi Mail"],
        host: "mail.gandi.net",
        port: 587
      },
      Gmail: {
        aliases: ["Google Mail"],
        domains: ["gmail.com", "googlemail.com"],
        host: "smtp.gmail.com",
        port: 465,
        secure: !0
      },
      Godaddy: {
        host: "smtpout.secureserver.net",
        port: 25
      },
      GodaddyAsia: {
        host: "smtp.asia.secureserver.net",
        port: 25
      },
      GodaddyEurope: {
        host: "smtp.europe.secureserver.net",
        port: 25
      },
      "hot.ee": {
        host: "mail.hot.ee"
      },
      Hotmail: {
        aliases: ["Outlook", "Outlook.com", "Hotmail.com"],
        domains: ["hotmail.com", "outlook.com"],
        host: "smtp-mail.outlook.com",
        port: 587
      },
      iCloud: {
        aliases: ["Me", "Mac"],
        domains: ["me.com", "mac.com"],
        host: "smtp.mail.me.com",
        port: 587
      },
      Infomaniak: {
        host: "mail.infomaniak.com",
        domains: ["ik.me", "ikmail.com", "etik.com"],
        port: 587
      },
      Loopia: {
        host: "mailcluster.loopia.se",
        port: 465
      },
      "mail.ee": {
        host: "smtp.mail.ee"
      },
      "Mail.ru": {
        host: "smtp.mail.ru",
        port: 465,
        secure: !0
      },
      "Mailcatch.app": {
        host: "sandbox-smtp.mailcatch.app",
        port: 2525
      },
      Maildev: {
        port: 1025,
        ignoreTLS: !0
      },
      Mailgun: {
        host: "smtp.mailgun.org",
        port: 465,
        secure: !0
      },
      Mailjet: {
        host: "in.mailjet.com",
        port: 587
      },
      Mailosaur: {
        host: "mailosaur.io",
        port: 25
      },
      Mailtrap: {
        host: "live.smtp.mailtrap.io",
        port: 587
      },
      Mandrill: {
        host: "smtp.mandrillapp.com",
        port: 587
      },
      Naver: {
        host: "smtp.naver.com",
        port: 587
      },
      One: {
        host: "send.one.com",
        port: 465,
        secure: !0
      },
      OpenMailBox: {
        aliases: ["OMB", "openmailbox.org"],
        host: "smtp.openmailbox.org",
        port: 465,
        secure: !0
      },
      Outlook365: {
        host: "smtp.office365.com",
        port: 587,
        secure: !1
      },
      OhMySMTP: {
        host: "smtp.ohmysmtp.com",
        port: 587,
        secure: !1
      },
      Postmark: {
        aliases: ["PostmarkApp"],
        host: "smtp.postmarkapp.com",
        port: 2525
      },
      Proton: {
        aliases: ["ProtonMail", "Proton.me", "Protonmail.com", "Protonmail.ch"],
        domains: ["proton.me", "protonmail.com", "pm.me", "protonmail.ch"],
        host: "smtp.protonmail.ch",
        port: 587,
        requireTLS: !0
      },
      "qiye.aliyun": {
        host: "smtp.mxhichina.com",
        port: "465",
        secure: !0
      },
      QQ: {
        domains: ["qq.com"],
        host: "smtp.qq.com",
        port: 465,
        secure: !0
      },
      QQex: {
        aliases: ["QQ Enterprise"],
        domains: ["exmail.qq.com"],
        host: "smtp.exmail.qq.com",
        port: 465,
        secure: !0
      },
      SendCloud: {
        host: "smtp.sendcloud.net",
        port: 2525
      },
      SendGrid: {
        host: "smtp.sendgrid.net",
        port: 587
      },
      SendinBlue: {
        aliases: ["Brevo"],
        host: "smtp-relay.brevo.com",
        port: 587
      },
      SendPulse: {
        host: "smtp-pulse.com",
        port: 465,
        secure: !0
      },
      SES: {
        host: "email-smtp.us-east-1.amazonaws.com",
        port: 465,
        secure: !0
      },
      "SES-US-EAST-1": {
        host: "email-smtp.us-east-1.amazonaws.com",
        port: 465,
        secure: !0
      },
      "SES-US-WEST-2": {
        host: "email-smtp.us-west-2.amazonaws.com",
        port: 465,
        secure: !0
      },
      "SES-EU-WEST-1": {
        host: "email-smtp.eu-west-1.amazonaws.com",
        port: 465,
        secure: !0
      },
      "SES-AP-SOUTH-1": {
        host: "email-smtp.ap-south-1.amazonaws.com",
        port: 465,
        secure: !0
      },
      "SES-AP-NORTHEAST-1": {
        host: "email-smtp.ap-northeast-1.amazonaws.com",
        port: 465,
        secure: !0
      },
      "SES-AP-NORTHEAST-2": {
        host: "email-smtp.ap-northeast-2.amazonaws.com",
        port: 465,
        secure: !0
      },
      "SES-AP-NORTHEAST-3": {
        host: "email-smtp.ap-northeast-3.amazonaws.com",
        port: 465,
        secure: !0
      },
      "SES-AP-SOUTHEAST-1": {
        host: "email-smtp.ap-southeast-1.amazonaws.com",
        port: 465,
        secure: !0
      },
      "SES-AP-SOUTHEAST-2": {
        host: "email-smtp.ap-southeast-2.amazonaws.com",
        port: 465,
        secure: !0
      },
      Seznam: {
        aliases: ["Seznam Email"],
        domains: ["seznam.cz", "email.cz", "post.cz", "spoluzaci.cz"],
        host: "smtp.seznam.cz",
        port: 465,
        secure: !0
      },
      Sparkpost: {
        aliases: ["SparkPost", "SparkPost Mail"],
        domains: ["sparkpost.com"],
        host: "smtp.sparkpostmail.com",
        port: 587,
        secure: !1
      },
      Tipimail: {
        host: "smtp.tipimail.com",
        port: 587
      },
      Yahoo: {
        domains: ["yahoo.com"],
        host: "smtp.mail.yahoo.com",
        port: 465,
        secure: !0
      },
      Yandex: {
        domains: ["yandex.ru"],
        host: "smtp.yandex.ru",
        port: 465,
        secure: !0
      },
      Zoho: {
        host: "smtp.zoho.com",
        port: 465,
        secure: !0,
        authMethod: "LOGIN"
      },
      "126": {
        host: "smtp.126.com",
        port: 465,
        secure: !0
      },
      "163": {
        host: "smtp.163.com",
        port: 465,
        secure: !0
      }
    };
  }
});

// node_modules/nodemailer/lib/well-known/index.js
var require_well_known = __commonJS({
  "node_modules/nodemailer/lib/well-known/index.js"(exports2, module2) {
    "use strict";
    var services = require_services(), normalized = {};
    Object.keys(services).forEach((key) => {
      let service = services[key];
      normalized[normalizeKey(key)] = normalizeService(service), [].concat(service.aliases || []).forEach((alias) => {
        normalized[normalizeKey(alias)] = normalizeService(service);
      }), [].concat(service.domains || []).forEach((domain) => {
        normalized[normalizeKey(domain)] = normalizeService(service);
      });
    });
    function normalizeKey(key) {
      return key.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase();
    }
    function normalizeService(service) {
      let filter = ["domains", "aliases"], response = {};
      return Object.keys(service).forEach((key) => {
        filter.indexOf(key) < 0 && (response[key] = service[key]);
      }), response;
    }
    module2.exports = function(key) {
      return key = normalizeKey(key.split("@").pop()), normalized[key] || !1;
    };
  }
});

// node_modules/nodemailer/lib/smtp-pool/index.js
var require_smtp_pool = __commonJS({
  "node_modules/nodemailer/lib/smtp-pool/index.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events"), PoolResource = require_pool_resource(), SMTPConnection = require_smtp_connection(), wellKnown = require_well_known(), shared = require_shared(), packageData = require_package(), SMTPPool = class extends EventEmitter {
      constructor(options) {
        super(), options = options || {}, typeof options == "string" && (options = {
          url: options
        });
        let urlData, service = options.service;
        typeof options.getSocket == "function" && (this.getSocket = options.getSocket), options.url && (urlData = shared.parseConnectionUrl(options.url), service = service || urlData.service), this.options = shared.assign(
          !1,
          // create new object
          options,
          // regular options
          urlData,
          // url options
          service && wellKnown(service)
          // wellknown options
        ), this.options.maxConnections = this.options.maxConnections || 5, this.options.maxMessages = this.options.maxMessages || 100, this.logger = shared.getLogger(this.options, {
          component: this.options.component || "smtp-pool"
        });
        let connection = new SMTPConnection(this.options);
        this.name = "SMTP (pool)", this.version = packageData.version + "[client:" + connection.version + "]", this._rateLimit = {
          counter: 0,
          timeout: null,
          waiting: [],
          checkpoint: !1,
          delta: Number(this.options.rateDelta) || 1e3,
          limit: Number(this.options.rateLimit) || 0
        }, this._closed = !1, this._queue = [], this._connections = [], this._connectionCounter = 0, this.idling = !0, setImmediate(() => {
          this.idling && this.emit("idle");
        });
      }
      /**
       * Placeholder function for creating proxy sockets. This method immediatelly returns
       * without a socket
       *
       * @param {Object} options Connection options
       * @param {Function} callback Callback function to run with the socket keys
       */
      getSocket(options, callback) {
        return setImmediate(() => callback(null, !1));
      }
      /**
       * Queues an e-mail to be sent using the selected settings
       *
       * @param {Object} mail Mail object
       * @param {Function} callback Callback function
       */
      send(mail, callback) {
        return this._closed ? !1 : (this._queue.push({
          mail,
          requeueAttempts: 0,
          callback
        }), this.idling && this._queue.length >= this.options.maxConnections && (this.idling = !1), setImmediate(() => this._processMessages()), !0);
      }
      /**
       * Closes all connections in the pool. If there is a message being sent, the connection
       * is closed later
       */
      close() {
        let connection, len = this._connections.length;
        if (this._closed = !0, clearTimeout(this._rateLimit.timeout), !len && !this._queue.length)
          return;
        for (let i = len - 1; i >= 0; i--)
          this._connections[i] && this._connections[i].available && (connection = this._connections[i], connection.close(), this.logger.info(
            {
              tnx: "connection",
              cid: connection.id,
              action: "removed"
            },
            "Connection #%s removed",
            connection.id
          ));
        if (len && !this._connections.length && this.logger.debug(
          {
            tnx: "connection"
          },
          "All connections removed"
        ), !this._queue.length)
          return;
        let invokeCallbacks = () => {
          if (!this._queue.length) {
            this.logger.debug(
              {
                tnx: "connection"
              },
              "Pending queue entries cleared"
            );
            return;
          }
          let entry = this._queue.shift();
          if (entry && typeof entry.callback == "function")
            try {
              entry.callback(new Error("Connection pool was closed"));
            } catch (E) {
              this.logger.error(
                {
                  err: E,
                  tnx: "callback",
                  cid: connection.id
                },
                "Callback error for #%s: %s",
                connection.id,
                E.message
              );
            }
          setImmediate(invokeCallbacks);
        };
        setImmediate(invokeCallbacks);
      }
      /**
       * Check the queue and available connections. If there is a message to be sent and there is
       * an available connection, then use this connection to send the mail
       */
      _processMessages() {
        let connection, i, len;
        if (this._closed)
          return;
        if (!this._queue.length) {
          this.idling || (this.idling = !0, this.emit("idle"));
          return;
        }
        for (i = 0, len = this._connections.length; i < len; i++)
          if (this._connections[i].available) {
            connection = this._connections[i];
            break;
          }
        if (!connection && this._connections.length < this.options.maxConnections && (connection = this._createConnection()), !connection) {
          this.idling = !1;
          return;
        }
        !this.idling && this._queue.length < this.options.maxConnections && (this.idling = !0, this.emit("idle"));
        let entry = connection.queueEntry = this._queue.shift();
        entry.messageId = (connection.queueEntry.mail.message.getHeader("message-id") || "").replace(/[<>\s]/g, ""), connection.available = !1, this.logger.debug(
          {
            tnx: "pool",
            cid: connection.id,
            messageId: entry.messageId,
            action: "assign"
          },
          "Assigned message <%s> to #%s (%s)",
          entry.messageId,
          connection.id,
          connection.messages + 1
        ), this._rateLimit.limit && (this._rateLimit.counter++, this._rateLimit.checkpoint || (this._rateLimit.checkpoint = Date.now())), connection.send(entry.mail, (err, info) => {
          if (entry === connection.queueEntry) {
            try {
              entry.callback(err, info);
            } catch (E) {
              this.logger.error(
                {
                  err: E,
                  tnx: "callback",
                  cid: connection.id
                },
                "Callback error for #%s: %s",
                connection.id,
                E.message
              );
            }
            connection.queueEntry = !1;
          }
        });
      }
      /**
       * Creates a new pool resource
       */
      _createConnection() {
        let connection = new PoolResource(this);
        return connection.id = ++this._connectionCounter, this.logger.info(
          {
            tnx: "pool",
            cid: connection.id,
            action: "conection"
          },
          "Created new pool resource #%s",
          connection.id
        ), connection.on("available", () => {
          this.logger.debug(
            {
              tnx: "connection",
              cid: connection.id,
              action: "available"
            },
            "Connection #%s became available",
            connection.id
          ), this._closed ? this.close() : this._processMessages();
        }), connection.once("error", (err) => {
          if (err.code !== "EMAXLIMIT" ? this.logger.error(
            {
              err,
              tnx: "pool",
              cid: connection.id
            },
            "Pool Error for #%s: %s",
            connection.id,
            err.message
          ) : this.logger.debug(
            {
              tnx: "pool",
              cid: connection.id,
              action: "maxlimit"
            },
            "Max messages limit exchausted for #%s",
            connection.id
          ), connection.queueEntry) {
            try {
              connection.queueEntry.callback(err);
            } catch (E) {
              this.logger.error(
                {
                  err: E,
                  tnx: "callback",
                  cid: connection.id
                },
                "Callback error for #%s: %s",
                connection.id,
                E.message
              );
            }
            connection.queueEntry = !1;
          }
          this._removeConnection(connection), this._continueProcessing();
        }), connection.once("close", () => {
          this.logger.info(
            {
              tnx: "connection",
              cid: connection.id,
              action: "closed"
            },
            "Connection #%s was closed",
            connection.id
          ), this._removeConnection(connection), connection.queueEntry ? setTimeout(() => {
            connection.queueEntry && (this._shouldRequeuOnConnectionClose(connection.queueEntry) ? this._requeueEntryOnConnectionClose(connection) : this._failDeliveryOnConnectionClose(connection)), this._continueProcessing();
          }, 50) : this._continueProcessing();
        }), this._connections.push(connection), connection;
      }
      _shouldRequeuOnConnectionClose(queueEntry) {
        return this.options.maxRequeues === void 0 || this.options.maxRequeues < 0 ? !0 : queueEntry.requeueAttempts < this.options.maxRequeues;
      }
      _failDeliveryOnConnectionClose(connection) {
        if (connection.queueEntry && connection.queueEntry.callback) {
          try {
            connection.queueEntry.callback(new Error("Reached maximum number of retries after connection was closed"));
          } catch (E) {
            this.logger.error(
              {
                err: E,
                tnx: "callback",
                messageId: connection.queueEntry.messageId,
                cid: connection.id
              },
              "Callback error for #%s: %s",
              connection.id,
              E.message
            );
          }
          connection.queueEntry = !1;
        }
      }
      _requeueEntryOnConnectionClose(connection) {
        connection.queueEntry.requeueAttempts = connection.queueEntry.requeueAttempts + 1, this.logger.debug(
          {
            tnx: "pool",
            cid: connection.id,
            messageId: connection.queueEntry.messageId,
            action: "requeue"
          },
          "Re-queued message <%s> for #%s. Attempt: #%s",
          connection.queueEntry.messageId,
          connection.id,
          connection.queueEntry.requeueAttempts
        ), this._queue.unshift(connection.queueEntry), connection.queueEntry = !1;
      }
      /**
       * Continue to process message if the pool hasn't closed
       */
      _continueProcessing() {
        this._closed ? this.close() : setTimeout(() => this._processMessages(), 100);
      }
      /**
       * Remove resource from pool
       *
       * @param {Object} connection The PoolResource to remove
       */
      _removeConnection(connection) {
        let index = this._connections.indexOf(connection);
        index !== -1 && this._connections.splice(index, 1);
      }
      /**
       * Checks if connections have hit current rate limit and if so, queues the availability callback
       *
       * @param {Function} callback Callback function to run once rate limiter has been cleared
       */
      _checkRateLimit(callback) {
        if (!this._rateLimit.limit)
          return callback();
        let now = Date.now();
        if (this._rateLimit.counter < this._rateLimit.limit)
          return callback();
        if (this._rateLimit.waiting.push(callback), this._rateLimit.checkpoint <= now - this._rateLimit.delta)
          return this._clearRateLimit();
        this._rateLimit.timeout || (this._rateLimit.timeout = setTimeout(() => this._clearRateLimit(), this._rateLimit.delta - (now - this._rateLimit.checkpoint)), this._rateLimit.checkpoint = now);
      }
      /**
       * Clears current rate limit limitation and runs paused callback
       */
      _clearRateLimit() {
        for (clearTimeout(this._rateLimit.timeout), this._rateLimit.timeout = null, this._rateLimit.counter = 0, this._rateLimit.checkpoint = !1; this._rateLimit.waiting.length; ) {
          let cb = this._rateLimit.waiting.shift();
          setImmediate(cb);
        }
      }
      /**
       * Returns true if there are free slots in the queue
       */
      isIdle() {
        return this.idling;
      }
      /**
       * Verifies SMTP configuration
       *
       * @param {Function} callback Callback function
       */
      verify(callback) {
        let promise;
        callback || (promise = new Promise((resolve, reject) => {
          callback = shared.callbackPromise(resolve, reject);
        }));
        let auth = new PoolResource(this).auth;
        return this.getSocket(this.options, (err, socketOptions) => {
          if (err)
            return callback(err);
          let options = this.options;
          socketOptions && socketOptions.connection && (this.logger.info(
            {
              tnx: "proxy",
              remoteAddress: socketOptions.connection.remoteAddress,
              remotePort: socketOptions.connection.remotePort,
              destHost: options.host || "",
              destPort: options.port || "",
              action: "connected"
            },
            "Using proxied socket from %s:%s to %s:%s",
            socketOptions.connection.remoteAddress,
            socketOptions.connection.remotePort,
            options.host || "",
            options.port || ""
          ), options = shared.assign(!1, options), Object.keys(socketOptions).forEach((key) => {
            options[key] = socketOptions[key];
          }));
          let connection = new SMTPConnection(options), returned = !1;
          connection.once("error", (err2) => {
            if (!returned)
              return returned = !0, connection.close(), callback(err2);
          }), connection.once("end", () => {
            if (!returned)
              return returned = !0, callback(new Error("Connection closed"));
          });
          let finalize = () => {
            if (!returned)
              return returned = !0, connection.quit(), callback(null, !0);
          };
          connection.connect(() => {
            if (!returned)
              if (auth && (connection.allowsAuth || options.forceAuth))
                connection.login(auth, (err2) => {
                  if (!returned) {
                    if (err2)
                      return returned = !0, connection.close(), callback(err2);
                    finalize();
                  }
                });
              else if (!auth && connection.allowsAuth && options.forceAuth) {
                let err2 = new Error("Authentication info was not provided");
                return err2.code = "NoAuth", returned = !0, connection.close(), callback(err2);
              } else
                finalize();
          });
        }), promise;
      }
    };
    module2.exports = SMTPPool;
  }
});

// node_modules/nodemailer/lib/smtp-transport/index.js
var require_smtp_transport = __commonJS({
  "node_modules/nodemailer/lib/smtp-transport/index.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events"), SMTPConnection = require_smtp_connection(), wellKnown = require_well_known(), shared = require_shared(), XOAuth2 = require_xoauth2(), packageData = require_package(), SMTPTransport = class extends EventEmitter {
      constructor(options) {
        super(), options = options || {}, typeof options == "string" && (options = {
          url: options
        });
        let urlData, service = options.service;
        typeof options.getSocket == "function" && (this.getSocket = options.getSocket), options.url && (urlData = shared.parseConnectionUrl(options.url), service = service || urlData.service), this.options = shared.assign(
          !1,
          // create new object
          options,
          // regular options
          urlData,
          // url options
          service && wellKnown(service)
          // wellknown options
        ), this.logger = shared.getLogger(this.options, {
          component: this.options.component || "smtp-transport"
        });
        let connection = new SMTPConnection(this.options);
        this.name = "SMTP", this.version = packageData.version + "[client:" + connection.version + "]", this.options.auth && (this.auth = this.getAuth({}));
      }
      /**
       * Placeholder function for creating proxy sockets. This method immediatelly returns
       * without a socket
       *
       * @param {Object} options Connection options
       * @param {Function} callback Callback function to run with the socket keys
       */
      getSocket(options, callback) {
        return setImmediate(() => callback(null, !1));
      }
      getAuth(authOpts) {
        if (!authOpts)
          return this.auth;
        let hasAuth = !1, authData = {};
        if (this.options.auth && typeof this.options.auth == "object" && Object.keys(this.options.auth).forEach((key) => {
          hasAuth = !0, authData[key] = this.options.auth[key];
        }), authOpts && typeof authOpts == "object" && Object.keys(authOpts).forEach((key) => {
          hasAuth = !0, authData[key] = authOpts[key];
        }), !hasAuth)
          return !1;
        switch ((authData.type || "").toString().toUpperCase()) {
          case "OAUTH2": {
            if (!authData.service && !authData.user)
              return !1;
            let oauth2 = new XOAuth2(authData, this.logger);
            return oauth2.provisionCallback = this.mailer && this.mailer.get("oauth2_provision_cb") || oauth2.provisionCallback, oauth2.on("token", (token) => this.mailer.emit("token", token)), oauth2.on("error", (err) => this.emit("error", err)), {
              type: "OAUTH2",
              user: authData.user,
              oauth2,
              method: "XOAUTH2"
            };
          }
          default:
            return {
              type: (authData.type || "").toString().toUpperCase() || "LOGIN",
              user: authData.user,
              credentials: {
                user: authData.user || "",
                pass: authData.pass,
                options: authData.options
              },
              method: (authData.method || "").trim().toUpperCase() || this.options.authMethod || !1
            };
        }
      }
      /**
       * Sends an e-mail using the selected settings
       *
       * @param {Object} mail Mail object
       * @param {Function} callback Callback function
       */
      send(mail, callback) {
        this.getSocket(this.options, (err, socketOptions) => {
          if (err)
            return callback(err);
          let returned = !1, options = this.options;
          socketOptions && socketOptions.connection && (this.logger.info(
            {
              tnx: "proxy",
              remoteAddress: socketOptions.connection.remoteAddress,
              remotePort: socketOptions.connection.remotePort,
              destHost: options.host || "",
              destPort: options.port || "",
              action: "connected"
            },
            "Using proxied socket from %s:%s to %s:%s",
            socketOptions.connection.remoteAddress,
            socketOptions.connection.remotePort,
            options.host || "",
            options.port || ""
          ), options = shared.assign(!1, options), Object.keys(socketOptions).forEach((key) => {
            options[key] = socketOptions[key];
          }));
          let connection = new SMTPConnection(options);
          connection.once("error", (err2) => {
            if (!returned)
              return returned = !0, connection.close(), callback(err2);
          }), connection.once("end", () => {
            if (returned)
              return;
            let timer = setTimeout(() => {
              if (returned)
                return;
              returned = !0;
              let err2 = new Error("Unexpected socket close");
              connection && connection._socket && connection._socket.upgrading && (err2.code = "ETLS"), callback(err2);
            }, 1e3);
            try {
              timer.unref();
            } catch {
            }
          });
          let sendMessage = () => {
            let envelope = mail.message.getEnvelope(), messageId = mail.message.messageId(), recipients = [].concat(envelope.to || []);
            recipients.length > 3 && recipients.push("...and " + recipients.splice(2).length + " more"), mail.data.dsn && (envelope.dsn = mail.data.dsn), this.logger.info(
              {
                tnx: "send",
                messageId
              },
              "Sending message %s to <%s>",
              messageId,
              recipients.join(", ")
            ), connection.send(envelope, mail.message.createReadStream(), (err2, info) => {
              if (returned = !0, connection.close(), err2)
                return this.logger.error(
                  {
                    err: err2,
                    tnx: "send"
                  },
                  "Send error for %s: %s",
                  messageId,
                  err2.message
                ), callback(err2);
              info.envelope = {
                from: envelope.from,
                to: envelope.to
              }, info.messageId = messageId;
              try {
                return callback(null, info);
              } catch (E) {
                this.logger.error(
                  {
                    err: E,
                    tnx: "callback"
                  },
                  "Callback error for %s: %s",
                  messageId,
                  E.message
                );
              }
            });
          };
          connection.connect(() => {
            if (returned)
              return;
            let auth = this.getAuth(mail.data.auth);
            auth && (connection.allowsAuth || options.forceAuth) ? connection.login(auth, (err2) => {
              if (auth && auth !== this.auth && auth.oauth2 && auth.oauth2.removeAllListeners(), !returned) {
                if (err2)
                  return returned = !0, connection.close(), callback(err2);
                sendMessage();
              }
            }) : sendMessage();
          });
        });
      }
      /**
       * Verifies SMTP configuration
       *
       * @param {Function} callback Callback function
       */
      verify(callback) {
        let promise;
        return callback || (promise = new Promise((resolve, reject) => {
          callback = shared.callbackPromise(resolve, reject);
        })), this.getSocket(this.options, (err, socketOptions) => {
          if (err)
            return callback(err);
          let options = this.options;
          socketOptions && socketOptions.connection && (this.logger.info(
            {
              tnx: "proxy",
              remoteAddress: socketOptions.connection.remoteAddress,
              remotePort: socketOptions.connection.remotePort,
              destHost: options.host || "",
              destPort: options.port || "",
              action: "connected"
            },
            "Using proxied socket from %s:%s to %s:%s",
            socketOptions.connection.remoteAddress,
            socketOptions.connection.remotePort,
            options.host || "",
            options.port || ""
          ), options = shared.assign(!1, options), Object.keys(socketOptions).forEach((key) => {
            options[key] = socketOptions[key];
          }));
          let connection = new SMTPConnection(options), returned = !1;
          connection.once("error", (err2) => {
            if (!returned)
              return returned = !0, connection.close(), callback(err2);
          }), connection.once("end", () => {
            if (!returned)
              return returned = !0, callback(new Error("Connection closed"));
          });
          let finalize = () => {
            if (!returned)
              return returned = !0, connection.quit(), callback(null, !0);
          };
          connection.connect(() => {
            if (returned)
              return;
            let authData = this.getAuth({});
            if (authData && (connection.allowsAuth || options.forceAuth))
              connection.login(authData, (err2) => {
                if (!returned) {
                  if (err2)
                    return returned = !0, connection.close(), callback(err2);
                  finalize();
                }
              });
            else if (!authData && connection.allowsAuth && options.forceAuth) {
              let err2 = new Error("Authentication info was not provided");
              return err2.code = "NoAuth", returned = !0, connection.close(), callback(err2);
            } else
              finalize();
          });
        }), promise;
      }
      /**
       * Releases resources
       */
      close() {
        this.auth && this.auth.oauth2 && this.auth.oauth2.removeAllListeners(), this.emit("close");
      }
    };
    module2.exports = SMTPTransport;
  }
});

// node_modules/nodemailer/lib/sendmail-transport/index.js
var require_sendmail_transport = __commonJS({
  "node_modules/nodemailer/lib/sendmail-transport/index.js"(exports2, module2) {
    "use strict";
    var spawn = require("child_process").spawn, packageData = require_package(), shared = require_shared(), SendmailTransport = class {
      constructor(options) {
        options = options || {}, this._spawn = spawn, this.options = options || {}, this.name = "Sendmail", this.version = packageData.version, this.path = "sendmail", this.args = !1, this.winbreak = !1, this.logger = shared.getLogger(this.options, {
          component: this.options.component || "sendmail"
        }), options && (typeof options == "string" ? this.path = options : typeof options == "object" && (options.path && (this.path = options.path), Array.isArray(options.args) && (this.args = options.args), this.winbreak = ["win", "windows", "dos", `\r
`].includes((options.newline || "").toString().toLowerCase())));
      }
      /**
       * <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
       *
       * @param {Object} emailMessage MailComposer object
       * @param {Function} callback Callback function to run when the sending is completed
       */
      send(mail, done) {
        mail.message.keepBcc = !0;
        let envelope = mail.data.envelope || mail.message.getEnvelope(), messageId = mail.message.messageId(), args, sendmail, returned;
        if ([].concat(envelope.from || []).concat(envelope.to || []).some((addr) => /^-/.test(addr)))
          return done(new Error("Can not send mail. Invalid envelope addresses."));
        this.args ? args = ["-i"].concat(this.args).concat(envelope.to) : args = ["-i"].concat(envelope.from ? ["-f", envelope.from] : []).concat(envelope.to);
        let callback = (err) => {
          if (!returned && (returned = !0, typeof done == "function"))
            return err ? done(err) : done(null, {
              envelope: mail.data.envelope || mail.message.getEnvelope(),
              messageId,
              response: "Messages queued for delivery"
            });
        };
        try {
          sendmail = this._spawn(this.path, args);
        } catch (E) {
          return this.logger.error(
            {
              err: E,
              tnx: "spawn",
              messageId
            },
            "Error occurred while spawning sendmail. %s",
            E.message
          ), callback(E);
        }
        if (sendmail) {
          sendmail.on("error", (err) => {
            this.logger.error(
              {
                err,
                tnx: "spawn",
                messageId
              },
              "Error occurred when sending message %s. %s",
              messageId,
              err.message
            ), callback(err);
          }), sendmail.once("exit", (code) => {
            if (!code)
              return callback();
            let err;
            code === 127 ? err = new Error("Sendmail command not found, process exited with code " + code) : err = new Error("Sendmail exited with code " + code), this.logger.error(
              {
                err,
                tnx: "stdin",
                messageId
              },
              "Error sending message %s to sendmail. %s",
              messageId,
              err.message
            ), callback(err);
          }), sendmail.once("close", callback), sendmail.stdin.on("error", (err) => {
            this.logger.error(
              {
                err,
                tnx: "stdin",
                messageId
              },
              "Error occurred when piping message %s to sendmail. %s",
              messageId,
              err.message
            ), callback(err);
          });
          let recipients = [].concat(envelope.to || []);
          recipients.length > 3 && recipients.push("...and " + recipients.splice(2).length + " more"), this.logger.info(
            {
              tnx: "send",
              messageId
            },
            "Sending message %s to <%s>",
            messageId,
            recipients.join(", ")
          );
          let sourceStream = mail.message.createReadStream();
          sourceStream.once("error", (err) => {
            this.logger.error(
              {
                err,
                tnx: "stdin",
                messageId
              },
              "Error occurred when generating message %s. %s",
              messageId,
              err.message
            ), sendmail.kill("SIGINT"), callback(err);
          }), sourceStream.pipe(sendmail.stdin);
        } else
          return callback(new Error("sendmail was not found"));
      }
    };
    module2.exports = SendmailTransport;
  }
});

// node_modules/nodemailer/lib/stream-transport/index.js
var require_stream_transport = __commonJS({
  "node_modules/nodemailer/lib/stream-transport/index.js"(exports2, module2) {
    "use strict";
    var packageData = require_package(), shared = require_shared(), StreamTransport = class {
      constructor(options) {
        options = options || {}, this.options = options || {}, this.name = "StreamTransport", this.version = packageData.version, this.logger = shared.getLogger(this.options, {
          component: this.options.component || "stream-transport"
        }), this.winbreak = ["win", "windows", "dos", `\r
`].includes((options.newline || "").toString().toLowerCase());
      }
      /**
       * Compiles a mailcomposer message and forwards it to handler that sends it
       *
       * @param {Object} emailMessage MailComposer object
       * @param {Function} callback Callback function to run when the sending is completed
       */
      send(mail, done) {
        mail.message.keepBcc = !0;
        let envelope = mail.data.envelope || mail.message.getEnvelope(), messageId = mail.message.messageId(), recipients = [].concat(envelope.to || []);
        recipients.length > 3 && recipients.push("...and " + recipients.splice(2).length + " more"), this.logger.info(
          {
            tnx: "send",
            messageId
          },
          "Sending message %s to <%s> using %s line breaks",
          messageId,
          recipients.join(", "),
          this.winbreak ? "<CR><LF>" : "<LF>"
        ), setImmediate(() => {
          let stream;
          try {
            stream = mail.message.createReadStream();
          } catch (E) {
            return this.logger.error(
              {
                err: E,
                tnx: "send",
                messageId
              },
              "Creating send stream failed for %s. %s",
              messageId,
              E.message
            ), done(E);
          }
          if (!this.options.buffer)
            return stream.once("error", (err) => {
              this.logger.error(
                {
                  err,
                  tnx: "send",
                  messageId
                },
                "Failed creating message for %s. %s",
                messageId,
                err.message
              );
            }), done(null, {
              envelope: mail.data.envelope || mail.message.getEnvelope(),
              messageId,
              message: stream
            });
          let chunks = [], chunklen = 0;
          stream.on("readable", () => {
            let chunk;
            for (; (chunk = stream.read()) !== null; )
              chunks.push(chunk), chunklen += chunk.length;
          }), stream.once("error", (err) => (this.logger.error(
            {
              err,
              tnx: "send",
              messageId
            },
            "Failed creating message for %s. %s",
            messageId,
            err.message
          ), done(err))), stream.on(
            "end",
            () => done(null, {
              envelope: mail.data.envelope || mail.message.getEnvelope(),
              messageId,
              message: Buffer.concat(chunks, chunklen)
            })
          );
        });
      }
    };
    module2.exports = StreamTransport;
  }
});

// node_modules/nodemailer/lib/json-transport/index.js
var require_json_transport = __commonJS({
  "node_modules/nodemailer/lib/json-transport/index.js"(exports2, module2) {
    "use strict";
    var packageData = require_package(), shared = require_shared(), JSONTransport = class {
      constructor(options) {
        options = options || {}, this.options = options || {}, this.name = "JSONTransport", this.version = packageData.version, this.logger = shared.getLogger(this.options, {
          component: this.options.component || "json-transport"
        });
      }
      /**
       * <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
       *
       * @param {Object} emailMessage MailComposer object
       * @param {Function} callback Callback function to run when the sending is completed
       */
      send(mail, done) {
        mail.message.keepBcc = !0;
        let envelope = mail.data.envelope || mail.message.getEnvelope(), messageId = mail.message.messageId(), recipients = [].concat(envelope.to || []);
        recipients.length > 3 && recipients.push("...and " + recipients.splice(2).length + " more"), this.logger.info(
          {
            tnx: "send",
            messageId
          },
          "Composing JSON structure of %s to <%s>",
          messageId,
          recipients.join(", ")
        ), setImmediate(() => {
          mail.normalize((err, data) => err ? (this.logger.error(
            {
              err,
              tnx: "send",
              messageId
            },
            "Failed building JSON structure for %s. %s",
            messageId,
            err.message
          ), done(err)) : (delete data.envelope, delete data.normalizedHeaders, done(null, {
            envelope,
            messageId,
            message: this.options.skipEncoding ? data : JSON.stringify(data)
          })));
        });
      }
    };
    module2.exports = JSONTransport;
  }
});

// node_modules/nodemailer/lib/ses-transport/index.js
var require_ses_transport = __commonJS({
  "node_modules/nodemailer/lib/ses-transport/index.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events"), packageData = require_package(), shared = require_shared(), LeWindows = require_le_windows(), SESTransport = class extends EventEmitter {
      constructor(options) {
        super(), options = options || {}, this.options = options || {}, this.ses = this.options.SES, this.name = "SESTransport", this.version = packageData.version, this.logger = shared.getLogger(this.options, {
          component: this.options.component || "ses-transport"
        }), this.maxConnections = Number(this.options.maxConnections) || 1 / 0, this.connections = 0, this.sendingRate = Number(this.options.sendingRate) || 1 / 0, this.sendingRateTTL = null, this.rateInterval = 1e3, this.rateMessages = [], this.pending = [], this.idling = !0, setImmediate(() => {
          this.idling && this.emit("idle");
        });
      }
      /**
       * Schedules a sending of a message
       *
       * @param {Object} emailMessage MailComposer object
       * @param {Function} callback Callback function to run when the sending is completed
       */
      send(mail, callback) {
        if (this.connections >= this.maxConnections)
          return this.idling = !1, this.pending.push({
            mail,
            callback
          });
        if (!this._checkSendingRate())
          return this.idling = !1, this.pending.push({
            mail,
            callback
          });
        this._send(mail, (...args) => {
          setImmediate(() => callback(...args)), this._sent();
        });
      }
      _checkRatedQueue() {
        if (this.connections >= this.maxConnections || !this._checkSendingRate())
          return;
        if (!this.pending.length) {
          this.idling || (this.idling = !0, this.emit("idle"));
          return;
        }
        let next = this.pending.shift();
        this._send(next.mail, (...args) => {
          setImmediate(() => next.callback(...args)), this._sent();
        });
      }
      _checkSendingRate() {
        clearTimeout(this.sendingRateTTL);
        let now = Date.now(), oldest = !1;
        for (let i = this.rateMessages.length - 1; i >= 0; i--)
          this.rateMessages[i].ts >= now - this.rateInterval && (!oldest || this.rateMessages[i].ts < oldest) && (oldest = this.rateMessages[i].ts), this.rateMessages[i].ts < now - this.rateInterval && !this.rateMessages[i].pending && this.rateMessages.splice(i, 1);
        if (this.rateMessages.length < this.sendingRate)
          return !0;
        let delay = Math.max(oldest + 1001, now + 20);
        this.sendingRateTTL = setTimeout(() => this._checkRatedQueue(), now - delay);
        try {
          this.sendingRateTTL.unref();
        } catch {
        }
        return !1;
      }
      _sent() {
        this.connections--, this._checkRatedQueue();
      }
      /**
       * Returns true if there are free slots in the queue
       */
      isIdle() {
        return this.idling;
      }
      /**
       * Compiles a mailcomposer message and forwards it to SES
       *
       * @param {Object} emailMessage MailComposer object
       * @param {Function} callback Callback function to run when the sending is completed
       */
      _send(mail, callback) {
        let statObject = {
          ts: Date.now(),
          pending: !0
        };
        this.connections++, this.rateMessages.push(statObject);
        let envelope = mail.data.envelope || mail.message.getEnvelope(), messageId = mail.message.messageId(), recipients = [].concat(envelope.to || []);
        recipients.length > 3 && recipients.push("...and " + recipients.splice(2).length + " more"), this.logger.info(
          {
            tnx: "send",
            messageId
          },
          "Sending message %s to <%s>",
          messageId,
          recipients.join(", ")
        );
        let getRawMessage = (next) => {
          mail.data._dkim || (mail.data._dkim = {}), mail.data._dkim.skipFields && typeof mail.data._dkim.skipFields == "string" ? mail.data._dkim.skipFields += ":date:message-id" : mail.data._dkim.skipFields = "date:message-id";
          let sourceStream = mail.message.createReadStream(), stream = sourceStream.pipe(new LeWindows()), chunks = [], chunklen = 0;
          stream.on("readable", () => {
            let chunk;
            for (; (chunk = stream.read()) !== null; )
              chunks.push(chunk), chunklen += chunk.length;
          }), sourceStream.once("error", (err) => stream.emit("error", err)), stream.once("error", (err) => {
            next(err);
          }), stream.once("end", () => next(null, Buffer.concat(chunks, chunklen)));
        };
        setImmediate(
          () => getRawMessage((err, raw) => {
            if (err)
              return this.logger.error(
                {
                  err,
                  tnx: "send",
                  messageId
                },
                "Failed creating message for %s. %s",
                messageId,
                err.message
              ), statObject.pending = !1, callback(err);
            let sesMessage = {
              RawMessage: {
                // required
                Data: raw
                // required
              },
              Source: envelope.from,
              Destinations: envelope.to
            };
            Object.keys(mail.data.ses || {}).forEach((key) => {
              sesMessage[key] = mail.data.ses[key];
            });
            let ses = (this.ses.aws ? this.ses.ses : this.ses) || {}, aws = this.ses.aws || {};
            ((cb) => ses.config && typeof ses.config.region == "function" ? ses.config.region().then((region) => cb(null, region)).catch((err2) => cb(err2)) : cb(null, ses.config && ses.config.region || "us-east-1"))((err2, region) => {
              (err2 || !region) && (region = "us-east-1");
              let sendPromise;
              typeof ses.send == "function" && aws.SendRawEmailCommand ? sendPromise = ses.send(new aws.SendRawEmailCommand(sesMessage)) : sendPromise = ses.sendRawEmail(sesMessage).promise(), sendPromise.then((data) => {
                region === "us-east-1" && (region = "email"), statObject.pending = !1, callback(null, {
                  envelope: {
                    from: envelope.from,
                    to: envelope.to
                  },
                  messageId: "<" + data.MessageId + (/@/.test(data.MessageId) ? "" : "@" + region + ".amazonses.com") + ">",
                  response: data.MessageId,
                  raw
                });
              }).catch((err3) => {
                this.logger.error(
                  {
                    err: err3,
                    tnx: "send"
                  },
                  "Send error for %s: %s",
                  messageId,
                  err3.message
                ), statObject.pending = !1, callback(err3);
              });
            });
          })
        );
      }
      /**
       * Verifies SES configuration
       *
       * @param {Function} callback Callback function
       */
      verify(callback) {
        let promise, ses = (this.ses.aws ? this.ses.ses : this.ses) || {}, aws = this.ses.aws || {}, sesMessage = {
          RawMessage: {
            // required
            Data: `From: invalid@invalid\r
To: invalid@invalid\r
 Subject: Invalid\r
\r
Invalid`
          },
          Source: "invalid@invalid",
          Destinations: ["invalid@invalid"]
        };
        callback || (promise = new Promise((resolve, reject) => {
          callback = shared.callbackPromise(resolve, reject);
        }));
        let cb = (err) => err && (err.code || err.Code) !== "InvalidParameterValue" ? callback(err) : callback(null, !0);
        return typeof ses.send == "function" && aws.SendRawEmailCommand ? (sesMessage.RawMessage.Data = Buffer.from(sesMessage.RawMessage.Data), ses.send(new aws.SendRawEmailCommand(sesMessage), cb)) : ses.sendRawEmail(sesMessage, cb), promise;
      }
    };
    module2.exports = SESTransport;
  }
});

// node_modules/nodemailer/lib/nodemailer.js
var require_nodemailer = __commonJS({
  "node_modules/nodemailer/lib/nodemailer.js"(exports2, module2) {
    "use strict";
    var Mailer = require_mailer(), shared = require_shared(), SMTPPool = require_smtp_pool(), SMTPTransport = require_smtp_transport(), SendmailTransport = require_sendmail_transport(), StreamTransport = require_stream_transport(), JSONTransport = require_json_transport(), SESTransport = require_ses_transport(), nmfetch = require_fetch(), packageData = require_package(), ETHEREAL_API = (process.env.ETHEREAL_API || "https://api.nodemailer.com").replace(/\/+$/, ""), ETHEREAL_WEB = (process.env.ETHEREAL_WEB || "https://ethereal.email").replace(/\/+$/, ""), ETHEREAL_API_KEY = (process.env.ETHEREAL_API_KEY || "").replace(/\s*/g, "") || null, ETHEREAL_CACHE = ["true", "yes", "y", "1"].includes((process.env.ETHEREAL_CACHE || "yes").toString().trim().toLowerCase()), testAccount = !1;
    module2.exports.createTransport = function(transporter, defaults) {
      let urlConfig, options, mailer;
      return (
        // provided transporter is a configuration object, not transporter plugin
        (typeof transporter == "object" && typeof transporter.send != "function" || // provided transporter looks like a connection url
        typeof transporter == "string" && /^(smtps?|direct):/i.test(transporter)) && ((urlConfig = typeof transporter == "string" ? transporter : transporter.url) ? options = shared.parseConnectionUrl(urlConfig) : options = transporter, options.pool ? transporter = new SMTPPool(options) : options.sendmail ? transporter = new SendmailTransport(options) : options.streamTransport ? transporter = new StreamTransport(options) : options.jsonTransport ? transporter = new JSONTransport(options) : options.SES ? transporter = new SESTransport(options) : transporter = new SMTPTransport(options)), mailer = new Mailer(transporter, options, defaults), mailer
      );
    };
    module2.exports.createTestAccount = function(apiUrl, callback) {
      let promise;
      if (!callback && typeof apiUrl == "function" && (callback = apiUrl, apiUrl = !1), callback || (promise = new Promise((resolve, reject) => {
        callback = shared.callbackPromise(resolve, reject);
      })), ETHEREAL_CACHE && testAccount)
        return setImmediate(() => callback(null, testAccount)), promise;
      apiUrl = apiUrl || ETHEREAL_API;
      let chunks = [], chunklen = 0, requestHeaders = {}, requestBody = {
        requestor: packageData.name,
        version: packageData.version
      };
      ETHEREAL_API_KEY && (requestHeaders.Authorization = "Bearer " + ETHEREAL_API_KEY);
      let req = nmfetch(apiUrl + "/user", {
        contentType: "application/json",
        method: "POST",
        headers: requestHeaders,
        body: Buffer.from(JSON.stringify(requestBody))
      });
      return req.on("readable", () => {
        let chunk;
        for (; (chunk = req.read()) !== null; )
          chunks.push(chunk), chunklen += chunk.length;
      }), req.once("error", (err) => callback(err)), req.once("end", () => {
        let res = Buffer.concat(chunks, chunklen), data, err;
        try {
          data = JSON.parse(res.toString());
        } catch (E) {
          err = E;
        }
        if (err)
          return callback(err);
        if (data.status !== "success" || data.error)
          return callback(new Error(data.error || "Request failed"));
        delete data.status, testAccount = data, callback(null, testAccount);
      }), promise;
    };
    module2.exports.getTestMessageUrl = function(info) {
      if (!info || !info.response)
        return !1;
      let infoProps = /* @__PURE__ */ new Map();
      return info.response.replace(/\[([^\]]+)\]$/, (m, props) => {
        props.replace(/\b([A-Z0-9]+)=([^\s]+)/g, (m2, key, value) => {
          infoProps.set(key, value);
        });
      }), infoProps.has("STATUS") && infoProps.has("MSGID") ? (testAccount.web || ETHEREAL_WEB) + "/message/" + infoProps.get("MSGID") : !1;
    };
  }
});

// node_modules/bn.js/lib/bn.js
var require_bn = __commonJS({
  "node_modules/bn.js/lib/bn.js"(exports2, module2) {
    (function(module3, exports3) {
      "use strict";
      function assert(val, msg) {
        if (!val) throw new Error(msg || "Assertion failed");
      }
      function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {
        };
        TempCtor.prototype = superCtor.prototype, ctor.prototype = new TempCtor(), ctor.prototype.constructor = ctor;
      }
      function BN(number, base, endian) {
        if (BN.isBN(number))
          return number;
        this.negative = 0, this.words = null, this.length = 0, this.red = null, number !== null && ((base === "le" || base === "be") && (endian = base, base = 10), this._init(number || 0, base || 10, endian || "be"));
      }
      typeof module3 == "object" ? module3.exports = BN : exports3.BN = BN, BN.BN = BN, BN.wordSize = 26;
      var Buffer2;
      try {
        typeof window < "u" && typeof window.Buffer < "u" ? Buffer2 = window.Buffer : Buffer2 = require("buffer").Buffer;
      } catch {
      }
      BN.isBN = function(num) {
        return num instanceof BN ? !0 : num !== null && typeof num == "object" && num.constructor.wordSize === BN.wordSize && Array.isArray(num.words);
      }, BN.max = function(left, right) {
        return left.cmp(right) > 0 ? left : right;
      }, BN.min = function(left, right) {
        return left.cmp(right) < 0 ? left : right;
      }, BN.prototype._init = function(number, base, endian) {
        if (typeof number == "number")
          return this._initNumber(number, base, endian);
        if (typeof number == "object")
          return this._initArray(number, base, endian);
        base === "hex" && (base = 16), assert(base === (base | 0) && base >= 2 && base <= 36), number = number.toString().replace(/\s+/g, "");
        var start = 0;
        number[0] === "-" && (start++, this.negative = 1), start < number.length && (base === 16 ? this._parseHex(number, start, endian) : (this._parseBase(number, base, start), endian === "le" && this._initArray(this.toArray(), base, endian)));
      }, BN.prototype._initNumber = function(number, base, endian) {
        number < 0 && (this.negative = 1, number = -number), number < 67108864 ? (this.words = [number & 67108863], this.length = 1) : number < 4503599627370496 ? (this.words = [
          number & 67108863,
          number / 67108864 & 67108863
        ], this.length = 2) : (assert(number < 9007199254740992), this.words = [
          number & 67108863,
          number / 67108864 & 67108863,
          1
        ], this.length = 3), endian === "le" && this._initArray(this.toArray(), base, endian);
      }, BN.prototype._initArray = function(number, base, endian) {
        if (assert(typeof number.length == "number"), number.length <= 0)
          return this.words = [0], this.length = 1, this;
        this.length = Math.ceil(number.length / 3), this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++)
          this.words[i] = 0;
        var j, w, off = 0;
        if (endian === "be")
          for (i = number.length - 1, j = 0; i >= 0; i -= 3)
            w = number[i] | number[i - 1] << 8 | number[i - 2] << 16, this.words[j] |= w << off & 67108863, this.words[j + 1] = w >>> 26 - off & 67108863, off += 24, off >= 26 && (off -= 26, j++);
        else if (endian === "le")
          for (i = 0, j = 0; i < number.length; i += 3)
            w = number[i] | number[i + 1] << 8 | number[i + 2] << 16, this.words[j] |= w << off & 67108863, this.words[j + 1] = w >>> 26 - off & 67108863, off += 24, off >= 26 && (off -= 26, j++);
        return this.strip();
      };
      function parseHex4Bits(string, index) {
        var c = string.charCodeAt(index);
        return c >= 65 && c <= 70 ? c - 55 : c >= 97 && c <= 102 ? c - 87 : c - 48 & 15;
      }
      function parseHexByte(string, lowerBound, index) {
        var r = parseHex4Bits(string, index);
        return index - 1 >= lowerBound && (r |= parseHex4Bits(string, index - 1) << 4), r;
      }
      BN.prototype._parseHex = function(number, start, endian) {
        this.length = Math.ceil((number.length - start) / 6), this.words = new Array(this.length);
        for (var i = 0; i < this.length; i++)
          this.words[i] = 0;
        var off = 0, j = 0, w;
        if (endian === "be")
          for (i = number.length - 1; i >= start; i -= 2)
            w = parseHexByte(number, start, i) << off, this.words[j] |= w & 67108863, off >= 18 ? (off -= 18, j += 1, this.words[j] |= w >>> 26) : off += 8;
        else {
          var parseLength = number.length - start;
          for (i = parseLength % 2 === 0 ? start + 1 : start; i < number.length; i += 2)
            w = parseHexByte(number, start, i) << off, this.words[j] |= w & 67108863, off >= 18 ? (off -= 18, j += 1, this.words[j] |= w >>> 26) : off += 8;
        }
        this.strip();
      };
      function parseBase(str, start, end, mul) {
        for (var r = 0, len = Math.min(str.length, end), i = start; i < len; i++) {
          var c = str.charCodeAt(i) - 48;
          r *= mul, c >= 49 ? r += c - 49 + 10 : c >= 17 ? r += c - 17 + 10 : r += c;
        }
        return r;
      }
      BN.prototype._parseBase = function(number, base, start) {
        this.words = [0], this.length = 1;
        for (var limbLen = 0, limbPow = 1; limbPow <= 67108863; limbPow *= base)
          limbLen++;
        limbLen--, limbPow = limbPow / base | 0;
        for (var total = number.length - start, mod = total % limbLen, end = Math.min(total, total - mod) + start, word = 0, i = start; i < end; i += limbLen)
          word = parseBase(number, i, i + limbLen, base), this.imuln(limbPow), this.words[0] + word < 67108864 ? this.words[0] += word : this._iaddn(word);
        if (mod !== 0) {
          var pow = 1;
          for (word = parseBase(number, i, number.length, base), i = 0; i < mod; i++)
            pow *= base;
          this.imuln(pow), this.words[0] + word < 67108864 ? this.words[0] += word : this._iaddn(word);
        }
        this.strip();
      }, BN.prototype.copy = function(dest) {
        dest.words = new Array(this.length);
        for (var i = 0; i < this.length; i++)
          dest.words[i] = this.words[i];
        dest.length = this.length, dest.negative = this.negative, dest.red = this.red;
      }, BN.prototype.clone = function() {
        var r = new BN(null);
        return this.copy(r), r;
      }, BN.prototype._expand = function(size) {
        for (; this.length < size; )
          this.words[this.length++] = 0;
        return this;
      }, BN.prototype.strip = function() {
        for (; this.length > 1 && this.words[this.length - 1] === 0; )
          this.length--;
        return this._normSign();
      }, BN.prototype._normSign = function() {
        return this.length === 1 && this.words[0] === 0 && (this.negative = 0), this;
      }, BN.prototype.inspect = function() {
        return (this.red ? "<BN-R: " : "<BN: ") + this.toString(16) + ">";
      };
      var zeros = [
        "",
        "0",
        "00",
        "000",
        "0000",
        "00000",
        "000000",
        "0000000",
        "00000000",
        "000000000",
        "0000000000",
        "00000000000",
        "000000000000",
        "0000000000000",
        "00000000000000",
        "000000000000000",
        "0000000000000000",
        "00000000000000000",
        "000000000000000000",
        "0000000000000000000",
        "00000000000000000000",
        "000000000000000000000",
        "0000000000000000000000",
        "00000000000000000000000",
        "000000000000000000000000",
        "0000000000000000000000000"
      ], groupSizes = [
        0,
        0,
        25,
        16,
        12,
        11,
        10,
        9,
        8,
        8,
        7,
        7,
        7,
        7,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5,
        5
      ], groupBases = [
        0,
        0,
        33554432,
        43046721,
        16777216,
        48828125,
        60466176,
        40353607,
        16777216,
        43046721,
        1e7,
        19487171,
        35831808,
        62748517,
        7529536,
        11390625,
        16777216,
        24137569,
        34012224,
        47045881,
        64e6,
        4084101,
        5153632,
        6436343,
        7962624,
        9765625,
        11881376,
        14348907,
        17210368,
        20511149,
        243e5,
        28629151,
        33554432,
        39135393,
        45435424,
        52521875,
        60466176
      ];
      BN.prototype.toString = function(base, padding) {
        base = base || 10, padding = padding | 0 || 1;
        var out;
        if (base === 16 || base === "hex") {
          out = "";
          for (var off = 0, carry = 0, i = 0; i < this.length; i++) {
            var w = this.words[i], word = ((w << off | carry) & 16777215).toString(16);
            carry = w >>> 24 - off & 16777215, off += 2, off >= 26 && (off -= 26, i--), carry !== 0 || i !== this.length - 1 ? out = zeros[6 - word.length] + word + out : out = word + out;
          }
          for (carry !== 0 && (out = carry.toString(16) + out); out.length % padding !== 0; )
            out = "0" + out;
          return this.negative !== 0 && (out = "-" + out), out;
        }
        if (base === (base | 0) && base >= 2 && base <= 36) {
          var groupSize = groupSizes[base], groupBase = groupBases[base];
          out = "";
          var c = this.clone();
          for (c.negative = 0; !c.isZero(); ) {
            var r = c.modn(groupBase).toString(base);
            c = c.idivn(groupBase), c.isZero() ? out = r + out : out = zeros[groupSize - r.length] + r + out;
          }
          for (this.isZero() && (out = "0" + out); out.length % padding !== 0; )
            out = "0" + out;
          return this.negative !== 0 && (out = "-" + out), out;
        }
        assert(!1, "Base should be between 2 and 36");
      }, BN.prototype.toNumber = function() {
        var ret = this.words[0];
        return this.length === 2 ? ret += this.words[1] * 67108864 : this.length === 3 && this.words[2] === 1 ? ret += 4503599627370496 + this.words[1] * 67108864 : this.length > 2 && assert(!1, "Number can only safely store up to 53 bits"), this.negative !== 0 ? -ret : ret;
      }, BN.prototype.toJSON = function() {
        return this.toString(16);
      }, BN.prototype.toBuffer = function(endian, length) {
        return assert(typeof Buffer2 < "u"), this.toArrayLike(Buffer2, endian, length);
      }, BN.prototype.toArray = function(endian, length) {
        return this.toArrayLike(Array, endian, length);
      }, BN.prototype.toArrayLike = function(ArrayType, endian, length) {
        var byteLength = this.byteLength(), reqLength = length || Math.max(1, byteLength);
        assert(byteLength <= reqLength, "byte array longer than desired length"), assert(reqLength > 0, "Requested array length <= 0"), this.strip();
        var littleEndian = endian === "le", res = new ArrayType(reqLength), b, i, q = this.clone();
        if (littleEndian) {
          for (i = 0; !q.isZero(); i++)
            b = q.andln(255), q.iushrn(8), res[i] = b;
          for (; i < reqLength; i++)
            res[i] = 0;
        } else {
          for (i = 0; i < reqLength - byteLength; i++)
            res[i] = 0;
          for (i = 0; !q.isZero(); i++)
            b = q.andln(255), q.iushrn(8), res[reqLength - i - 1] = b;
        }
        return res;
      }, Math.clz32 ? BN.prototype._countBits = function(w) {
        return 32 - Math.clz32(w);
      } : BN.prototype._countBits = function(w) {
        var t = w, r = 0;
        return t >= 4096 && (r += 13, t >>>= 13), t >= 64 && (r += 7, t >>>= 7), t >= 8 && (r += 4, t >>>= 4), t >= 2 && (r += 2, t >>>= 2), r + t;
      }, BN.prototype._zeroBits = function(w) {
        if (w === 0) return 26;
        var t = w, r = 0;
        return t & 8191 || (r += 13, t >>>= 13), t & 127 || (r += 7, t >>>= 7), t & 15 || (r += 4, t >>>= 4), t & 3 || (r += 2, t >>>= 2), t & 1 || r++, r;
      }, BN.prototype.bitLength = function() {
        var w = this.words[this.length - 1], hi = this._countBits(w);
        return (this.length - 1) * 26 + hi;
      };
      function toBitArray(num) {
        for (var w = new Array(num.bitLength()), bit = 0; bit < w.length; bit++) {
          var off = bit / 26 | 0, wbit = bit % 26;
          w[bit] = (num.words[off] & 1 << wbit) >>> wbit;
        }
        return w;
      }
      BN.prototype.zeroBits = function() {
        if (this.isZero()) return 0;
        for (var r = 0, i = 0; i < this.length; i++) {
          var b = this._zeroBits(this.words[i]);
          if (r += b, b !== 26) break;
        }
        return r;
      }, BN.prototype.byteLength = function() {
        return Math.ceil(this.bitLength() / 8);
      }, BN.prototype.toTwos = function(width) {
        return this.negative !== 0 ? this.abs().inotn(width).iaddn(1) : this.clone();
      }, BN.prototype.fromTwos = function(width) {
        return this.testn(width - 1) ? this.notn(width).iaddn(1).ineg() : this.clone();
      }, BN.prototype.isNeg = function() {
        return this.negative !== 0;
      }, BN.prototype.neg = function() {
        return this.clone().ineg();
      }, BN.prototype.ineg = function() {
        return this.isZero() || (this.negative ^= 1), this;
      }, BN.prototype.iuor = function(num) {
        for (; this.length < num.length; )
          this.words[this.length++] = 0;
        for (var i = 0; i < num.length; i++)
          this.words[i] = this.words[i] | num.words[i];
        return this.strip();
      }, BN.prototype.ior = function(num) {
        return assert((this.negative | num.negative) === 0), this.iuor(num);
      }, BN.prototype.or = function(num) {
        return this.length > num.length ? this.clone().ior(num) : num.clone().ior(this);
      }, BN.prototype.uor = function(num) {
        return this.length > num.length ? this.clone().iuor(num) : num.clone().iuor(this);
      }, BN.prototype.iuand = function(num) {
        var b;
        this.length > num.length ? b = num : b = this;
        for (var i = 0; i < b.length; i++)
          this.words[i] = this.words[i] & num.words[i];
        return this.length = b.length, this.strip();
      }, BN.prototype.iand = function(num) {
        return assert((this.negative | num.negative) === 0), this.iuand(num);
      }, BN.prototype.and = function(num) {
        return this.length > num.length ? this.clone().iand(num) : num.clone().iand(this);
      }, BN.prototype.uand = function(num) {
        return this.length > num.length ? this.clone().iuand(num) : num.clone().iuand(this);
      }, BN.prototype.iuxor = function(num) {
        var a, b;
        this.length > num.length ? (a = this, b = num) : (a = num, b = this);
        for (var i = 0; i < b.length; i++)
          this.words[i] = a.words[i] ^ b.words[i];
        if (this !== a)
          for (; i < a.length; i++)
            this.words[i] = a.words[i];
        return this.length = a.length, this.strip();
      }, BN.prototype.ixor = function(num) {
        return assert((this.negative | num.negative) === 0), this.iuxor(num);
      }, BN.prototype.xor = function(num) {
        return this.length > num.length ? this.clone().ixor(num) : num.clone().ixor(this);
      }, BN.prototype.uxor = function(num) {
        return this.length > num.length ? this.clone().iuxor(num) : num.clone().iuxor(this);
      }, BN.prototype.inotn = function(width) {
        assert(typeof width == "number" && width >= 0);
        var bytesNeeded = Math.ceil(width / 26) | 0, bitsLeft = width % 26;
        this._expand(bytesNeeded), bitsLeft > 0 && bytesNeeded--;
        for (var i = 0; i < bytesNeeded; i++)
          this.words[i] = ~this.words[i] & 67108863;
        for (bitsLeft > 0 && (this.words[i] = ~this.words[i] & 67108863 >> 26 - bitsLeft, i++); i < this.length; i++)
          this.words[i] = 0;
        return this.strip();
      }, BN.prototype.notn = function(width) {
        return this.clone().inotn(width);
      }, BN.prototype.setn = function(bit, val) {
        assert(typeof bit == "number" && bit >= 0);
        var off = bit / 26 | 0, wbit = bit % 26;
        return this._expand(off + 1), val ? this.words[off] = this.words[off] | 1 << wbit : this.words[off] = this.words[off] & ~(1 << wbit), this.strip();
      }, BN.prototype.iadd = function(num) {
        var r;
        if (this.negative !== 0 && num.negative === 0)
          return this.negative = 0, r = this.isub(num), this.negative ^= 1, this._normSign();
        if (this.negative === 0 && num.negative !== 0)
          return num.negative = 0, r = this.isub(num), num.negative = 1, r._normSign();
        var a, b;
        this.length > num.length ? (a = this, b = num) : (a = num, b = this);
        for (var carry = 0, i = 0; i < b.length; i++)
          r = (a.words[i] | 0) + (b.words[i] | 0) + carry, this.words[i] = r & 67108863, carry = r >>> 26;
        for (; carry !== 0 && i < a.length; i++)
          r = (a.words[i] | 0) + carry, this.words[i] = r & 67108863, carry = r >>> 26;
        if (this.length = a.length, carry !== 0)
          this.words[this.length] = carry, this.length++;
        else if (a !== this)
          for (; i < a.length; i++)
            this.words[i] = a.words[i];
        return this;
      }, BN.prototype.add = function(num) {
        var res;
        return num.negative !== 0 && this.negative === 0 ? (num.negative = 0, res = this.sub(num), num.negative ^= 1, res) : num.negative === 0 && this.negative !== 0 ? (this.negative = 0, res = num.sub(this), this.negative = 1, res) : this.length > num.length ? this.clone().iadd(num) : num.clone().iadd(this);
      }, BN.prototype.isub = function(num) {
        if (num.negative !== 0) {
          num.negative = 0;
          var r = this.iadd(num);
          return num.negative = 1, r._normSign();
        } else if (this.negative !== 0)
          return this.negative = 0, this.iadd(num), this.negative = 1, this._normSign();
        var cmp = this.cmp(num);
        if (cmp === 0)
          return this.negative = 0, this.length = 1, this.words[0] = 0, this;
        var a, b;
        cmp > 0 ? (a = this, b = num) : (a = num, b = this);
        for (var carry = 0, i = 0; i < b.length; i++)
          r = (a.words[i] | 0) - (b.words[i] | 0) + carry, carry = r >> 26, this.words[i] = r & 67108863;
        for (; carry !== 0 && i < a.length; i++)
          r = (a.words[i] | 0) + carry, carry = r >> 26, this.words[i] = r & 67108863;
        if (carry === 0 && i < a.length && a !== this)
          for (; i < a.length; i++)
            this.words[i] = a.words[i];
        return this.length = Math.max(this.length, i), a !== this && (this.negative = 1), this.strip();
      }, BN.prototype.sub = function(num) {
        return this.clone().isub(num);
      };
      function smallMulTo(self2, num, out) {
        out.negative = num.negative ^ self2.negative;
        var len = self2.length + num.length | 0;
        out.length = len, len = len - 1 | 0;
        var a = self2.words[0] | 0, b = num.words[0] | 0, r = a * b, lo = r & 67108863, carry = r / 67108864 | 0;
        out.words[0] = lo;
        for (var k = 1; k < len; k++) {
          for (var ncarry = carry >>> 26, rword = carry & 67108863, maxJ = Math.min(k, num.length - 1), j = Math.max(0, k - self2.length + 1); j <= maxJ; j++) {
            var i = k - j | 0;
            a = self2.words[i] | 0, b = num.words[j] | 0, r = a * b + rword, ncarry += r / 67108864 | 0, rword = r & 67108863;
          }
          out.words[k] = rword | 0, carry = ncarry | 0;
        }
        return carry !== 0 ? out.words[k] = carry | 0 : out.length--, out.strip();
      }
      var comb10MulTo = function(self2, num, out) {
        var a = self2.words, b = num.words, o = out.words, c = 0, lo, mid, hi, a0 = a[0] | 0, al0 = a0 & 8191, ah0 = a0 >>> 13, a1 = a[1] | 0, al1 = a1 & 8191, ah1 = a1 >>> 13, a2 = a[2] | 0, al2 = a2 & 8191, ah2 = a2 >>> 13, a3 = a[3] | 0, al3 = a3 & 8191, ah3 = a3 >>> 13, a4 = a[4] | 0, al4 = a4 & 8191, ah4 = a4 >>> 13, a5 = a[5] | 0, al5 = a5 & 8191, ah5 = a5 >>> 13, a6 = a[6] | 0, al6 = a6 & 8191, ah6 = a6 >>> 13, a7 = a[7] | 0, al7 = a7 & 8191, ah7 = a7 >>> 13, a8 = a[8] | 0, al8 = a8 & 8191, ah8 = a8 >>> 13, a9 = a[9] | 0, al9 = a9 & 8191, ah9 = a9 >>> 13, b0 = b[0] | 0, bl0 = b0 & 8191, bh0 = b0 >>> 13, b1 = b[1] | 0, bl1 = b1 & 8191, bh1 = b1 >>> 13, b2 = b[2] | 0, bl2 = b2 & 8191, bh2 = b2 >>> 13, b3 = b[3] | 0, bl3 = b3 & 8191, bh3 = b3 >>> 13, b4 = b[4] | 0, bl4 = b4 & 8191, bh4 = b4 >>> 13, b5 = b[5] | 0, bl5 = b5 & 8191, bh5 = b5 >>> 13, b6 = b[6] | 0, bl6 = b6 & 8191, bh6 = b6 >>> 13, b7 = b[7] | 0, bl7 = b7 & 8191, bh7 = b7 >>> 13, b8 = b[8] | 0, bl8 = b8 & 8191, bh8 = b8 >>> 13, b9 = b[9] | 0, bl9 = b9 & 8191, bh9 = b9 >>> 13;
        out.negative = self2.negative ^ num.negative, out.length = 19, lo = Math.imul(al0, bl0), mid = Math.imul(al0, bh0), mid = mid + Math.imul(ah0, bl0) | 0, hi = Math.imul(ah0, bh0);
        var w0 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w0 >>> 26) | 0, w0 &= 67108863, lo = Math.imul(al1, bl0), mid = Math.imul(al1, bh0), mid = mid + Math.imul(ah1, bl0) | 0, hi = Math.imul(ah1, bh0), lo = lo + Math.imul(al0, bl1) | 0, mid = mid + Math.imul(al0, bh1) | 0, mid = mid + Math.imul(ah0, bl1) | 0, hi = hi + Math.imul(ah0, bh1) | 0;
        var w1 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w1 >>> 26) | 0, w1 &= 67108863, lo = Math.imul(al2, bl0), mid = Math.imul(al2, bh0), mid = mid + Math.imul(ah2, bl0) | 0, hi = Math.imul(ah2, bh0), lo = lo + Math.imul(al1, bl1) | 0, mid = mid + Math.imul(al1, bh1) | 0, mid = mid + Math.imul(ah1, bl1) | 0, hi = hi + Math.imul(ah1, bh1) | 0, lo = lo + Math.imul(al0, bl2) | 0, mid = mid + Math.imul(al0, bh2) | 0, mid = mid + Math.imul(ah0, bl2) | 0, hi = hi + Math.imul(ah0, bh2) | 0;
        var w2 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w2 >>> 26) | 0, w2 &= 67108863, lo = Math.imul(al3, bl0), mid = Math.imul(al3, bh0), mid = mid + Math.imul(ah3, bl0) | 0, hi = Math.imul(ah3, bh0), lo = lo + Math.imul(al2, bl1) | 0, mid = mid + Math.imul(al2, bh1) | 0, mid = mid + Math.imul(ah2, bl1) | 0, hi = hi + Math.imul(ah2, bh1) | 0, lo = lo + Math.imul(al1, bl2) | 0, mid = mid + Math.imul(al1, bh2) | 0, mid = mid + Math.imul(ah1, bl2) | 0, hi = hi + Math.imul(ah1, bh2) | 0, lo = lo + Math.imul(al0, bl3) | 0, mid = mid + Math.imul(al0, bh3) | 0, mid = mid + Math.imul(ah0, bl3) | 0, hi = hi + Math.imul(ah0, bh3) | 0;
        var w3 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w3 >>> 26) | 0, w3 &= 67108863, lo = Math.imul(al4, bl0), mid = Math.imul(al4, bh0), mid = mid + Math.imul(ah4, bl0) | 0, hi = Math.imul(ah4, bh0), lo = lo + Math.imul(al3, bl1) | 0, mid = mid + Math.imul(al3, bh1) | 0, mid = mid + Math.imul(ah3, bl1) | 0, hi = hi + Math.imul(ah3, bh1) | 0, lo = lo + Math.imul(al2, bl2) | 0, mid = mid + Math.imul(al2, bh2) | 0, mid = mid + Math.imul(ah2, bl2) | 0, hi = hi + Math.imul(ah2, bh2) | 0, lo = lo + Math.imul(al1, bl3) | 0, mid = mid + Math.imul(al1, bh3) | 0, mid = mid + Math.imul(ah1, bl3) | 0, hi = hi + Math.imul(ah1, bh3) | 0, lo = lo + Math.imul(al0, bl4) | 0, mid = mid + Math.imul(al0, bh4) | 0, mid = mid + Math.imul(ah0, bl4) | 0, hi = hi + Math.imul(ah0, bh4) | 0;
        var w4 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w4 >>> 26) | 0, w4 &= 67108863, lo = Math.imul(al5, bl0), mid = Math.imul(al5, bh0), mid = mid + Math.imul(ah5, bl0) | 0, hi = Math.imul(ah5, bh0), lo = lo + Math.imul(al4, bl1) | 0, mid = mid + Math.imul(al4, bh1) | 0, mid = mid + Math.imul(ah4, bl1) | 0, hi = hi + Math.imul(ah4, bh1) | 0, lo = lo + Math.imul(al3, bl2) | 0, mid = mid + Math.imul(al3, bh2) | 0, mid = mid + Math.imul(ah3, bl2) | 0, hi = hi + Math.imul(ah3, bh2) | 0, lo = lo + Math.imul(al2, bl3) | 0, mid = mid + Math.imul(al2, bh3) | 0, mid = mid + Math.imul(ah2, bl3) | 0, hi = hi + Math.imul(ah2, bh3) | 0, lo = lo + Math.imul(al1, bl4) | 0, mid = mid + Math.imul(al1, bh4) | 0, mid = mid + Math.imul(ah1, bl4) | 0, hi = hi + Math.imul(ah1, bh4) | 0, lo = lo + Math.imul(al0, bl5) | 0, mid = mid + Math.imul(al0, bh5) | 0, mid = mid + Math.imul(ah0, bl5) | 0, hi = hi + Math.imul(ah0, bh5) | 0;
        var w5 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w5 >>> 26) | 0, w5 &= 67108863, lo = Math.imul(al6, bl0), mid = Math.imul(al6, bh0), mid = mid + Math.imul(ah6, bl0) | 0, hi = Math.imul(ah6, bh0), lo = lo + Math.imul(al5, bl1) | 0, mid = mid + Math.imul(al5, bh1) | 0, mid = mid + Math.imul(ah5, bl1) | 0, hi = hi + Math.imul(ah5, bh1) | 0, lo = lo + Math.imul(al4, bl2) | 0, mid = mid + Math.imul(al4, bh2) | 0, mid = mid + Math.imul(ah4, bl2) | 0, hi = hi + Math.imul(ah4, bh2) | 0, lo = lo + Math.imul(al3, bl3) | 0, mid = mid + Math.imul(al3, bh3) | 0, mid = mid + Math.imul(ah3, bl3) | 0, hi = hi + Math.imul(ah3, bh3) | 0, lo = lo + Math.imul(al2, bl4) | 0, mid = mid + Math.imul(al2, bh4) | 0, mid = mid + Math.imul(ah2, bl4) | 0, hi = hi + Math.imul(ah2, bh4) | 0, lo = lo + Math.imul(al1, bl5) | 0, mid = mid + Math.imul(al1, bh5) | 0, mid = mid + Math.imul(ah1, bl5) | 0, hi = hi + Math.imul(ah1, bh5) | 0, lo = lo + Math.imul(al0, bl6) | 0, mid = mid + Math.imul(al0, bh6) | 0, mid = mid + Math.imul(ah0, bl6) | 0, hi = hi + Math.imul(ah0, bh6) | 0;
        var w6 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w6 >>> 26) | 0, w6 &= 67108863, lo = Math.imul(al7, bl0), mid = Math.imul(al7, bh0), mid = mid + Math.imul(ah7, bl0) | 0, hi = Math.imul(ah7, bh0), lo = lo + Math.imul(al6, bl1) | 0, mid = mid + Math.imul(al6, bh1) | 0, mid = mid + Math.imul(ah6, bl1) | 0, hi = hi + Math.imul(ah6, bh1) | 0, lo = lo + Math.imul(al5, bl2) | 0, mid = mid + Math.imul(al5, bh2) | 0, mid = mid + Math.imul(ah5, bl2) | 0, hi = hi + Math.imul(ah5, bh2) | 0, lo = lo + Math.imul(al4, bl3) | 0, mid = mid + Math.imul(al4, bh3) | 0, mid = mid + Math.imul(ah4, bl3) | 0, hi = hi + Math.imul(ah4, bh3) | 0, lo = lo + Math.imul(al3, bl4) | 0, mid = mid + Math.imul(al3, bh4) | 0, mid = mid + Math.imul(ah3, bl4) | 0, hi = hi + Math.imul(ah3, bh4) | 0, lo = lo + Math.imul(al2, bl5) | 0, mid = mid + Math.imul(al2, bh5) | 0, mid = mid + Math.imul(ah2, bl5) | 0, hi = hi + Math.imul(ah2, bh5) | 0, lo = lo + Math.imul(al1, bl6) | 0, mid = mid + Math.imul(al1, bh6) | 0, mid = mid + Math.imul(ah1, bl6) | 0, hi = hi + Math.imul(ah1, bh6) | 0, lo = lo + Math.imul(al0, bl7) | 0, mid = mid + Math.imul(al0, bh7) | 0, mid = mid + Math.imul(ah0, bl7) | 0, hi = hi + Math.imul(ah0, bh7) | 0;
        var w7 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w7 >>> 26) | 0, w7 &= 67108863, lo = Math.imul(al8, bl0), mid = Math.imul(al8, bh0), mid = mid + Math.imul(ah8, bl0) | 0, hi = Math.imul(ah8, bh0), lo = lo + Math.imul(al7, bl1) | 0, mid = mid + Math.imul(al7, bh1) | 0, mid = mid + Math.imul(ah7, bl1) | 0, hi = hi + Math.imul(ah7, bh1) | 0, lo = lo + Math.imul(al6, bl2) | 0, mid = mid + Math.imul(al6, bh2) | 0, mid = mid + Math.imul(ah6, bl2) | 0, hi = hi + Math.imul(ah6, bh2) | 0, lo = lo + Math.imul(al5, bl3) | 0, mid = mid + Math.imul(al5, bh3) | 0, mid = mid + Math.imul(ah5, bl3) | 0, hi = hi + Math.imul(ah5, bh3) | 0, lo = lo + Math.imul(al4, bl4) | 0, mid = mid + Math.imul(al4, bh4) | 0, mid = mid + Math.imul(ah4, bl4) | 0, hi = hi + Math.imul(ah4, bh4) | 0, lo = lo + Math.imul(al3, bl5) | 0, mid = mid + Math.imul(al3, bh5) | 0, mid = mid + Math.imul(ah3, bl5) | 0, hi = hi + Math.imul(ah3, bh5) | 0, lo = lo + Math.imul(al2, bl6) | 0, mid = mid + Math.imul(al2, bh6) | 0, mid = mid + Math.imul(ah2, bl6) | 0, hi = hi + Math.imul(ah2, bh6) | 0, lo = lo + Math.imul(al1, bl7) | 0, mid = mid + Math.imul(al1, bh7) | 0, mid = mid + Math.imul(ah1, bl7) | 0, hi = hi + Math.imul(ah1, bh7) | 0, lo = lo + Math.imul(al0, bl8) | 0, mid = mid + Math.imul(al0, bh8) | 0, mid = mid + Math.imul(ah0, bl8) | 0, hi = hi + Math.imul(ah0, bh8) | 0;
        var w8 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w8 >>> 26) | 0, w8 &= 67108863, lo = Math.imul(al9, bl0), mid = Math.imul(al9, bh0), mid = mid + Math.imul(ah9, bl0) | 0, hi = Math.imul(ah9, bh0), lo = lo + Math.imul(al8, bl1) | 0, mid = mid + Math.imul(al8, bh1) | 0, mid = mid + Math.imul(ah8, bl1) | 0, hi = hi + Math.imul(ah8, bh1) | 0, lo = lo + Math.imul(al7, bl2) | 0, mid = mid + Math.imul(al7, bh2) | 0, mid = mid + Math.imul(ah7, bl2) | 0, hi = hi + Math.imul(ah7, bh2) | 0, lo = lo + Math.imul(al6, bl3) | 0, mid = mid + Math.imul(al6, bh3) | 0, mid = mid + Math.imul(ah6, bl3) | 0, hi = hi + Math.imul(ah6, bh3) | 0, lo = lo + Math.imul(al5, bl4) | 0, mid = mid + Math.imul(al5, bh4) | 0, mid = mid + Math.imul(ah5, bl4) | 0, hi = hi + Math.imul(ah5, bh4) | 0, lo = lo + Math.imul(al4, bl5) | 0, mid = mid + Math.imul(al4, bh5) | 0, mid = mid + Math.imul(ah4, bl5) | 0, hi = hi + Math.imul(ah4, bh5) | 0, lo = lo + Math.imul(al3, bl6) | 0, mid = mid + Math.imul(al3, bh6) | 0, mid = mid + Math.imul(ah3, bl6) | 0, hi = hi + Math.imul(ah3, bh6) | 0, lo = lo + Math.imul(al2, bl7) | 0, mid = mid + Math.imul(al2, bh7) | 0, mid = mid + Math.imul(ah2, bl7) | 0, hi = hi + Math.imul(ah2, bh7) | 0, lo = lo + Math.imul(al1, bl8) | 0, mid = mid + Math.imul(al1, bh8) | 0, mid = mid + Math.imul(ah1, bl8) | 0, hi = hi + Math.imul(ah1, bh8) | 0, lo = lo + Math.imul(al0, bl9) | 0, mid = mid + Math.imul(al0, bh9) | 0, mid = mid + Math.imul(ah0, bl9) | 0, hi = hi + Math.imul(ah0, bh9) | 0;
        var w9 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w9 >>> 26) | 0, w9 &= 67108863, lo = Math.imul(al9, bl1), mid = Math.imul(al9, bh1), mid = mid + Math.imul(ah9, bl1) | 0, hi = Math.imul(ah9, bh1), lo = lo + Math.imul(al8, bl2) | 0, mid = mid + Math.imul(al8, bh2) | 0, mid = mid + Math.imul(ah8, bl2) | 0, hi = hi + Math.imul(ah8, bh2) | 0, lo = lo + Math.imul(al7, bl3) | 0, mid = mid + Math.imul(al7, bh3) | 0, mid = mid + Math.imul(ah7, bl3) | 0, hi = hi + Math.imul(ah7, bh3) | 0, lo = lo + Math.imul(al6, bl4) | 0, mid = mid + Math.imul(al6, bh4) | 0, mid = mid + Math.imul(ah6, bl4) | 0, hi = hi + Math.imul(ah6, bh4) | 0, lo = lo + Math.imul(al5, bl5) | 0, mid = mid + Math.imul(al5, bh5) | 0, mid = mid + Math.imul(ah5, bl5) | 0, hi = hi + Math.imul(ah5, bh5) | 0, lo = lo + Math.imul(al4, bl6) | 0, mid = mid + Math.imul(al4, bh6) | 0, mid = mid + Math.imul(ah4, bl6) | 0, hi = hi + Math.imul(ah4, bh6) | 0, lo = lo + Math.imul(al3, bl7) | 0, mid = mid + Math.imul(al3, bh7) | 0, mid = mid + Math.imul(ah3, bl7) | 0, hi = hi + Math.imul(ah3, bh7) | 0, lo = lo + Math.imul(al2, bl8) | 0, mid = mid + Math.imul(al2, bh8) | 0, mid = mid + Math.imul(ah2, bl8) | 0, hi = hi + Math.imul(ah2, bh8) | 0, lo = lo + Math.imul(al1, bl9) | 0, mid = mid + Math.imul(al1, bh9) | 0, mid = mid + Math.imul(ah1, bl9) | 0, hi = hi + Math.imul(ah1, bh9) | 0;
        var w10 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w10 >>> 26) | 0, w10 &= 67108863, lo = Math.imul(al9, bl2), mid = Math.imul(al9, bh2), mid = mid + Math.imul(ah9, bl2) | 0, hi = Math.imul(ah9, bh2), lo = lo + Math.imul(al8, bl3) | 0, mid = mid + Math.imul(al8, bh3) | 0, mid = mid + Math.imul(ah8, bl3) | 0, hi = hi + Math.imul(ah8, bh3) | 0, lo = lo + Math.imul(al7, bl4) | 0, mid = mid + Math.imul(al7, bh4) | 0, mid = mid + Math.imul(ah7, bl4) | 0, hi = hi + Math.imul(ah7, bh4) | 0, lo = lo + Math.imul(al6, bl5) | 0, mid = mid + Math.imul(al6, bh5) | 0, mid = mid + Math.imul(ah6, bl5) | 0, hi = hi + Math.imul(ah6, bh5) | 0, lo = lo + Math.imul(al5, bl6) | 0, mid = mid + Math.imul(al5, bh6) | 0, mid = mid + Math.imul(ah5, bl6) | 0, hi = hi + Math.imul(ah5, bh6) | 0, lo = lo + Math.imul(al4, bl7) | 0, mid = mid + Math.imul(al4, bh7) | 0, mid = mid + Math.imul(ah4, bl7) | 0, hi = hi + Math.imul(ah4, bh7) | 0, lo = lo + Math.imul(al3, bl8) | 0, mid = mid + Math.imul(al3, bh8) | 0, mid = mid + Math.imul(ah3, bl8) | 0, hi = hi + Math.imul(ah3, bh8) | 0, lo = lo + Math.imul(al2, bl9) | 0, mid = mid + Math.imul(al2, bh9) | 0, mid = mid + Math.imul(ah2, bl9) | 0, hi = hi + Math.imul(ah2, bh9) | 0;
        var w11 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w11 >>> 26) | 0, w11 &= 67108863, lo = Math.imul(al9, bl3), mid = Math.imul(al9, bh3), mid = mid + Math.imul(ah9, bl3) | 0, hi = Math.imul(ah9, bh3), lo = lo + Math.imul(al8, bl4) | 0, mid = mid + Math.imul(al8, bh4) | 0, mid = mid + Math.imul(ah8, bl4) | 0, hi = hi + Math.imul(ah8, bh4) | 0, lo = lo + Math.imul(al7, bl5) | 0, mid = mid + Math.imul(al7, bh5) | 0, mid = mid + Math.imul(ah7, bl5) | 0, hi = hi + Math.imul(ah7, bh5) | 0, lo = lo + Math.imul(al6, bl6) | 0, mid = mid + Math.imul(al6, bh6) | 0, mid = mid + Math.imul(ah6, bl6) | 0, hi = hi + Math.imul(ah6, bh6) | 0, lo = lo + Math.imul(al5, bl7) | 0, mid = mid + Math.imul(al5, bh7) | 0, mid = mid + Math.imul(ah5, bl7) | 0, hi = hi + Math.imul(ah5, bh7) | 0, lo = lo + Math.imul(al4, bl8) | 0, mid = mid + Math.imul(al4, bh8) | 0, mid = mid + Math.imul(ah4, bl8) | 0, hi = hi + Math.imul(ah4, bh8) | 0, lo = lo + Math.imul(al3, bl9) | 0, mid = mid + Math.imul(al3, bh9) | 0, mid = mid + Math.imul(ah3, bl9) | 0, hi = hi + Math.imul(ah3, bh9) | 0;
        var w12 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w12 >>> 26) | 0, w12 &= 67108863, lo = Math.imul(al9, bl4), mid = Math.imul(al9, bh4), mid = mid + Math.imul(ah9, bl4) | 0, hi = Math.imul(ah9, bh4), lo = lo + Math.imul(al8, bl5) | 0, mid = mid + Math.imul(al8, bh5) | 0, mid = mid + Math.imul(ah8, bl5) | 0, hi = hi + Math.imul(ah8, bh5) | 0, lo = lo + Math.imul(al7, bl6) | 0, mid = mid + Math.imul(al7, bh6) | 0, mid = mid + Math.imul(ah7, bl6) | 0, hi = hi + Math.imul(ah7, bh6) | 0, lo = lo + Math.imul(al6, bl7) | 0, mid = mid + Math.imul(al6, bh7) | 0, mid = mid + Math.imul(ah6, bl7) | 0, hi = hi + Math.imul(ah6, bh7) | 0, lo = lo + Math.imul(al5, bl8) | 0, mid = mid + Math.imul(al5, bh8) | 0, mid = mid + Math.imul(ah5, bl8) | 0, hi = hi + Math.imul(ah5, bh8) | 0, lo = lo + Math.imul(al4, bl9) | 0, mid = mid + Math.imul(al4, bh9) | 0, mid = mid + Math.imul(ah4, bl9) | 0, hi = hi + Math.imul(ah4, bh9) | 0;
        var w13 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w13 >>> 26) | 0, w13 &= 67108863, lo = Math.imul(al9, bl5), mid = Math.imul(al9, bh5), mid = mid + Math.imul(ah9, bl5) | 0, hi = Math.imul(ah9, bh5), lo = lo + Math.imul(al8, bl6) | 0, mid = mid + Math.imul(al8, bh6) | 0, mid = mid + Math.imul(ah8, bl6) | 0, hi = hi + Math.imul(ah8, bh6) | 0, lo = lo + Math.imul(al7, bl7) | 0, mid = mid + Math.imul(al7, bh7) | 0, mid = mid + Math.imul(ah7, bl7) | 0, hi = hi + Math.imul(ah7, bh7) | 0, lo = lo + Math.imul(al6, bl8) | 0, mid = mid + Math.imul(al6, bh8) | 0, mid = mid + Math.imul(ah6, bl8) | 0, hi = hi + Math.imul(ah6, bh8) | 0, lo = lo + Math.imul(al5, bl9) | 0, mid = mid + Math.imul(al5, bh9) | 0, mid = mid + Math.imul(ah5, bl9) | 0, hi = hi + Math.imul(ah5, bh9) | 0;
        var w14 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w14 >>> 26) | 0, w14 &= 67108863, lo = Math.imul(al9, bl6), mid = Math.imul(al9, bh6), mid = mid + Math.imul(ah9, bl6) | 0, hi = Math.imul(ah9, bh6), lo = lo + Math.imul(al8, bl7) | 0, mid = mid + Math.imul(al8, bh7) | 0, mid = mid + Math.imul(ah8, bl7) | 0, hi = hi + Math.imul(ah8, bh7) | 0, lo = lo + Math.imul(al7, bl8) | 0, mid = mid + Math.imul(al7, bh8) | 0, mid = mid + Math.imul(ah7, bl8) | 0, hi = hi + Math.imul(ah7, bh8) | 0, lo = lo + Math.imul(al6, bl9) | 0, mid = mid + Math.imul(al6, bh9) | 0, mid = mid + Math.imul(ah6, bl9) | 0, hi = hi + Math.imul(ah6, bh9) | 0;
        var w15 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w15 >>> 26) | 0, w15 &= 67108863, lo = Math.imul(al9, bl7), mid = Math.imul(al9, bh7), mid = mid + Math.imul(ah9, bl7) | 0, hi = Math.imul(ah9, bh7), lo = lo + Math.imul(al8, bl8) | 0, mid = mid + Math.imul(al8, bh8) | 0, mid = mid + Math.imul(ah8, bl8) | 0, hi = hi + Math.imul(ah8, bh8) | 0, lo = lo + Math.imul(al7, bl9) | 0, mid = mid + Math.imul(al7, bh9) | 0, mid = mid + Math.imul(ah7, bl9) | 0, hi = hi + Math.imul(ah7, bh9) | 0;
        var w16 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w16 >>> 26) | 0, w16 &= 67108863, lo = Math.imul(al9, bl8), mid = Math.imul(al9, bh8), mid = mid + Math.imul(ah9, bl8) | 0, hi = Math.imul(ah9, bh8), lo = lo + Math.imul(al8, bl9) | 0, mid = mid + Math.imul(al8, bh9) | 0, mid = mid + Math.imul(ah8, bl9) | 0, hi = hi + Math.imul(ah8, bh9) | 0;
        var w17 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        c = (hi + (mid >>> 13) | 0) + (w17 >>> 26) | 0, w17 &= 67108863, lo = Math.imul(al9, bl9), mid = Math.imul(al9, bh9), mid = mid + Math.imul(ah9, bl9) | 0, hi = Math.imul(ah9, bh9);
        var w18 = (c + lo | 0) + ((mid & 8191) << 13) | 0;
        return c = (hi + (mid >>> 13) | 0) + (w18 >>> 26) | 0, w18 &= 67108863, o[0] = w0, o[1] = w1, o[2] = w2, o[3] = w3, o[4] = w4, o[5] = w5, o[6] = w6, o[7] = w7, o[8] = w8, o[9] = w9, o[10] = w10, o[11] = w11, o[12] = w12, o[13] = w13, o[14] = w14, o[15] = w15, o[16] = w16, o[17] = w17, o[18] = w18, c !== 0 && (o[19] = c, out.length++), out;
      };
      Math.imul || (comb10MulTo = smallMulTo);
      function bigMulTo(self2, num, out) {
        out.negative = num.negative ^ self2.negative, out.length = self2.length + num.length;
        for (var carry = 0, hncarry = 0, k = 0; k < out.length - 1; k++) {
          var ncarry = hncarry;
          hncarry = 0;
          for (var rword = carry & 67108863, maxJ = Math.min(k, num.length - 1), j = Math.max(0, k - self2.length + 1); j <= maxJ; j++) {
            var i = k - j, a = self2.words[i] | 0, b = num.words[j] | 0, r = a * b, lo = r & 67108863;
            ncarry = ncarry + (r / 67108864 | 0) | 0, lo = lo + rword | 0, rword = lo & 67108863, ncarry = ncarry + (lo >>> 26) | 0, hncarry += ncarry >>> 26, ncarry &= 67108863;
          }
          out.words[k] = rword, carry = ncarry, ncarry = hncarry;
        }
        return carry !== 0 ? out.words[k] = carry : out.length--, out.strip();
      }
      function jumboMulTo(self2, num, out) {
        var fftm = new FFTM();
        return fftm.mulp(self2, num, out);
      }
      BN.prototype.mulTo = function(num, out) {
        var res, len = this.length + num.length;
        return this.length === 10 && num.length === 10 ? res = comb10MulTo(this, num, out) : len < 63 ? res = smallMulTo(this, num, out) : len < 1024 ? res = bigMulTo(this, num, out) : res = jumboMulTo(this, num, out), res;
      };
      function FFTM(x, y) {
        this.x = x, this.y = y;
      }
      FFTM.prototype.makeRBT = function(N) {
        for (var t = new Array(N), l = BN.prototype._countBits(N) - 1, i = 0; i < N; i++)
          t[i] = this.revBin(i, l, N);
        return t;
      }, FFTM.prototype.revBin = function(x, l, N) {
        if (x === 0 || x === N - 1) return x;
        for (var rb = 0, i = 0; i < l; i++)
          rb |= (x & 1) << l - i - 1, x >>= 1;
        return rb;
      }, FFTM.prototype.permute = function(rbt, rws, iws, rtws, itws, N) {
        for (var i = 0; i < N; i++)
          rtws[i] = rws[rbt[i]], itws[i] = iws[rbt[i]];
      }, FFTM.prototype.transform = function(rws, iws, rtws, itws, N, rbt) {
        this.permute(rbt, rws, iws, rtws, itws, N);
        for (var s = 1; s < N; s <<= 1)
          for (var l = s << 1, rtwdf = Math.cos(2 * Math.PI / l), itwdf = Math.sin(2 * Math.PI / l), p = 0; p < N; p += l)
            for (var rtwdf_ = rtwdf, itwdf_ = itwdf, j = 0; j < s; j++) {
              var re = rtws[p + j], ie = itws[p + j], ro = rtws[p + j + s], io = itws[p + j + s], rx = rtwdf_ * ro - itwdf_ * io;
              io = rtwdf_ * io + itwdf_ * ro, ro = rx, rtws[p + j] = re + ro, itws[p + j] = ie + io, rtws[p + j + s] = re - ro, itws[p + j + s] = ie - io, j !== l && (rx = rtwdf * rtwdf_ - itwdf * itwdf_, itwdf_ = rtwdf * itwdf_ + itwdf * rtwdf_, rtwdf_ = rx);
            }
      }, FFTM.prototype.guessLen13b = function(n, m) {
        var N = Math.max(m, n) | 1, odd = N & 1, i = 0;
        for (N = N / 2 | 0; N; N = N >>> 1)
          i++;
        return 1 << i + 1 + odd;
      }, FFTM.prototype.conjugate = function(rws, iws, N) {
        if (!(N <= 1))
          for (var i = 0; i < N / 2; i++) {
            var t = rws[i];
            rws[i] = rws[N - i - 1], rws[N - i - 1] = t, t = iws[i], iws[i] = -iws[N - i - 1], iws[N - i - 1] = -t;
          }
      }, FFTM.prototype.normalize13b = function(ws, N) {
        for (var carry = 0, i = 0; i < N / 2; i++) {
          var w = Math.round(ws[2 * i + 1] / N) * 8192 + Math.round(ws[2 * i] / N) + carry;
          ws[i] = w & 67108863, w < 67108864 ? carry = 0 : carry = w / 67108864 | 0;
        }
        return ws;
      }, FFTM.prototype.convert13b = function(ws, len, rws, N) {
        for (var carry = 0, i = 0; i < len; i++)
          carry = carry + (ws[i] | 0), rws[2 * i] = carry & 8191, carry = carry >>> 13, rws[2 * i + 1] = carry & 8191, carry = carry >>> 13;
        for (i = 2 * len; i < N; ++i)
          rws[i] = 0;
        assert(carry === 0), assert((carry & -8192) === 0);
      }, FFTM.prototype.stub = function(N) {
        for (var ph = new Array(N), i = 0; i < N; i++)
          ph[i] = 0;
        return ph;
      }, FFTM.prototype.mulp = function(x, y, out) {
        var N = 2 * this.guessLen13b(x.length, y.length), rbt = this.makeRBT(N), _ = this.stub(N), rws = new Array(N), rwst = new Array(N), iwst = new Array(N), nrws = new Array(N), nrwst = new Array(N), niwst = new Array(N), rmws = out.words;
        rmws.length = N, this.convert13b(x.words, x.length, rws, N), this.convert13b(y.words, y.length, nrws, N), this.transform(rws, _, rwst, iwst, N, rbt), this.transform(nrws, _, nrwst, niwst, N, rbt);
        for (var i = 0; i < N; i++) {
          var rx = rwst[i] * nrwst[i] - iwst[i] * niwst[i];
          iwst[i] = rwst[i] * niwst[i] + iwst[i] * nrwst[i], rwst[i] = rx;
        }
        return this.conjugate(rwst, iwst, N), this.transform(rwst, iwst, rmws, _, N, rbt), this.conjugate(rmws, _, N), this.normalize13b(rmws, N), out.negative = x.negative ^ y.negative, out.length = x.length + y.length, out.strip();
      }, BN.prototype.mul = function(num) {
        var out = new BN(null);
        return out.words = new Array(this.length + num.length), this.mulTo(num, out);
      }, BN.prototype.mulf = function(num) {
        var out = new BN(null);
        return out.words = new Array(this.length + num.length), jumboMulTo(this, num, out);
      }, BN.prototype.imul = function(num) {
        return this.clone().mulTo(num, this);
      }, BN.prototype.imuln = function(num) {
        assert(typeof num == "number"), assert(num < 67108864);
        for (var carry = 0, i = 0; i < this.length; i++) {
          var w = (this.words[i] | 0) * num, lo = (w & 67108863) + (carry & 67108863);
          carry >>= 26, carry += w / 67108864 | 0, carry += lo >>> 26, this.words[i] = lo & 67108863;
        }
        return carry !== 0 && (this.words[i] = carry, this.length++), num === 0 && (this.length = 1, this._normSign()), this;
      }, BN.prototype.muln = function(num) {
        return this.clone().imuln(num);
      }, BN.prototype.sqr = function() {
        return this.mul(this);
      }, BN.prototype.isqr = function() {
        return this.imul(this.clone());
      }, BN.prototype.pow = function(num) {
        var w = toBitArray(num);
        if (w.length === 0) return new BN(1);
        for (var res = this, i = 0; i < w.length && w[i] === 0; i++, res = res.sqr())
          ;
        if (++i < w.length)
          for (var q = res.sqr(); i < w.length; i++, q = q.sqr())
            w[i] !== 0 && (res = res.mul(q));
        return res;
      }, BN.prototype.iushln = function(bits) {
        assert(typeof bits == "number" && bits >= 0);
        var r = bits % 26, s = (bits - r) / 26, carryMask = 67108863 >>> 26 - r << 26 - r, i;
        if (r !== 0) {
          var carry = 0;
          for (i = 0; i < this.length; i++) {
            var newCarry = this.words[i] & carryMask, c = (this.words[i] | 0) - newCarry << r;
            this.words[i] = c | carry, carry = newCarry >>> 26 - r;
          }
          carry && (this.words[i] = carry, this.length++);
        }
        if (s !== 0) {
          for (i = this.length - 1; i >= 0; i--)
            this.words[i + s] = this.words[i];
          for (i = 0; i < s; i++)
            this.words[i] = 0;
          this.length += s;
        }
        return this.strip();
      }, BN.prototype.ishln = function(bits) {
        return assert(this.negative === 0), this.iushln(bits);
      }, BN.prototype.iushrn = function(bits, hint, extended) {
        assert(typeof bits == "number" && bits >= 0);
        var h;
        hint ? h = (hint - hint % 26) / 26 : h = 0;
        var r = bits % 26, s = Math.min((bits - r) / 26, this.length), mask = 67108863 ^ 67108863 >>> r << r, maskedWords = extended;
        if (h -= s, h = Math.max(0, h), maskedWords) {
          for (var i = 0; i < s; i++)
            maskedWords.words[i] = this.words[i];
          maskedWords.length = s;
        }
        if (s !== 0)
          if (this.length > s)
            for (this.length -= s, i = 0; i < this.length; i++)
              this.words[i] = this.words[i + s];
          else
            this.words[0] = 0, this.length = 1;
        var carry = 0;
        for (i = this.length - 1; i >= 0 && (carry !== 0 || i >= h); i--) {
          var word = this.words[i] | 0;
          this.words[i] = carry << 26 - r | word >>> r, carry = word & mask;
        }
        return maskedWords && carry !== 0 && (maskedWords.words[maskedWords.length++] = carry), this.length === 0 && (this.words[0] = 0, this.length = 1), this.strip();
      }, BN.prototype.ishrn = function(bits, hint, extended) {
        return assert(this.negative === 0), this.iushrn(bits, hint, extended);
      }, BN.prototype.shln = function(bits) {
        return this.clone().ishln(bits);
      }, BN.prototype.ushln = function(bits) {
        return this.clone().iushln(bits);
      }, BN.prototype.shrn = function(bits) {
        return this.clone().ishrn(bits);
      }, BN.prototype.ushrn = function(bits) {
        return this.clone().iushrn(bits);
      }, BN.prototype.testn = function(bit) {
        assert(typeof bit == "number" && bit >= 0);
        var r = bit % 26, s = (bit - r) / 26, q = 1 << r;
        if (this.length <= s) return !1;
        var w = this.words[s];
        return !!(w & q);
      }, BN.prototype.imaskn = function(bits) {
        assert(typeof bits == "number" && bits >= 0);
        var r = bits % 26, s = (bits - r) / 26;
        if (assert(this.negative === 0, "imaskn works only with positive numbers"), this.length <= s)
          return this;
        if (r !== 0 && s++, this.length = Math.min(s, this.length), r !== 0) {
          var mask = 67108863 ^ 67108863 >>> r << r;
          this.words[this.length - 1] &= mask;
        }
        return this.length === 0 && (this.words[0] = 0, this.length = 1), this.strip();
      }, BN.prototype.maskn = function(bits) {
        return this.clone().imaskn(bits);
      }, BN.prototype.iaddn = function(num) {
        return assert(typeof num == "number"), assert(num < 67108864), num < 0 ? this.isubn(-num) : this.negative !== 0 ? this.length === 1 && (this.words[0] | 0) < num ? (this.words[0] = num - (this.words[0] | 0), this.negative = 0, this) : (this.negative = 0, this.isubn(num), this.negative = 1, this) : this._iaddn(num);
      }, BN.prototype._iaddn = function(num) {
        this.words[0] += num;
        for (var i = 0; i < this.length && this.words[i] >= 67108864; i++)
          this.words[i] -= 67108864, i === this.length - 1 ? this.words[i + 1] = 1 : this.words[i + 1]++;
        return this.length = Math.max(this.length, i + 1), this;
      }, BN.prototype.isubn = function(num) {
        if (assert(typeof num == "number"), assert(num < 67108864), num < 0) return this.iaddn(-num);
        if (this.negative !== 0)
          return this.negative = 0, this.iaddn(num), this.negative = 1, this;
        if (this.words[0] -= num, this.length === 1 && this.words[0] < 0)
          this.words[0] = -this.words[0], this.negative = 1;
        else
          for (var i = 0; i < this.length && this.words[i] < 0; i++)
            this.words[i] += 67108864, this.words[i + 1] -= 1;
        return this.strip();
      }, BN.prototype.addn = function(num) {
        return this.clone().iaddn(num);
      }, BN.prototype.subn = function(num) {
        return this.clone().isubn(num);
      }, BN.prototype.iabs = function() {
        return this.negative = 0, this;
      }, BN.prototype.abs = function() {
        return this.clone().iabs();
      }, BN.prototype._ishlnsubmul = function(num, mul, shift) {
        var len = num.length + shift, i;
        this._expand(len);
        var w, carry = 0;
        for (i = 0; i < num.length; i++) {
          w = (this.words[i + shift] | 0) + carry;
          var right = (num.words[i] | 0) * mul;
          w -= right & 67108863, carry = (w >> 26) - (right / 67108864 | 0), this.words[i + shift] = w & 67108863;
        }
        for (; i < this.length - shift; i++)
          w = (this.words[i + shift] | 0) + carry, carry = w >> 26, this.words[i + shift] = w & 67108863;
        if (carry === 0) return this.strip();
        for (assert(carry === -1), carry = 0, i = 0; i < this.length; i++)
          w = -(this.words[i] | 0) + carry, carry = w >> 26, this.words[i] = w & 67108863;
        return this.negative = 1, this.strip();
      }, BN.prototype._wordDiv = function(num, mode) {
        var shift = this.length - num.length, a = this.clone(), b = num, bhi = b.words[b.length - 1] | 0, bhiBits = this._countBits(bhi);
        shift = 26 - bhiBits, shift !== 0 && (b = b.ushln(shift), a.iushln(shift), bhi = b.words[b.length - 1] | 0);
        var m = a.length - b.length, q;
        if (mode !== "mod") {
          q = new BN(null), q.length = m + 1, q.words = new Array(q.length);
          for (var i = 0; i < q.length; i++)
            q.words[i] = 0;
        }
        var diff = a.clone()._ishlnsubmul(b, 1, m);
        diff.negative === 0 && (a = diff, q && (q.words[m] = 1));
        for (var j = m - 1; j >= 0; j--) {
          var qj = (a.words[b.length + j] | 0) * 67108864 + (a.words[b.length + j - 1] | 0);
          for (qj = Math.min(qj / bhi | 0, 67108863), a._ishlnsubmul(b, qj, j); a.negative !== 0; )
            qj--, a.negative = 0, a._ishlnsubmul(b, 1, j), a.isZero() || (a.negative ^= 1);
          q && (q.words[j] = qj);
        }
        return q && q.strip(), a.strip(), mode !== "div" && shift !== 0 && a.iushrn(shift), {
          div: q || null,
          mod: a
        };
      }, BN.prototype.divmod = function(num, mode, positive) {
        if (assert(!num.isZero()), this.isZero())
          return {
            div: new BN(0),
            mod: new BN(0)
          };
        var div, mod, res;
        return this.negative !== 0 && num.negative === 0 ? (res = this.neg().divmod(num, mode), mode !== "mod" && (div = res.div.neg()), mode !== "div" && (mod = res.mod.neg(), positive && mod.negative !== 0 && mod.iadd(num)), {
          div,
          mod
        }) : this.negative === 0 && num.negative !== 0 ? (res = this.divmod(num.neg(), mode), mode !== "mod" && (div = res.div.neg()), {
          div,
          mod: res.mod
        }) : this.negative & num.negative ? (res = this.neg().divmod(num.neg(), mode), mode !== "div" && (mod = res.mod.neg(), positive && mod.negative !== 0 && mod.isub(num)), {
          div: res.div,
          mod
        }) : num.length > this.length || this.cmp(num) < 0 ? {
          div: new BN(0),
          mod: this
        } : num.length === 1 ? mode === "div" ? {
          div: this.divn(num.words[0]),
          mod: null
        } : mode === "mod" ? {
          div: null,
          mod: new BN(this.modn(num.words[0]))
        } : {
          div: this.divn(num.words[0]),
          mod: new BN(this.modn(num.words[0]))
        } : this._wordDiv(num, mode);
      }, BN.prototype.div = function(num) {
        return this.divmod(num, "div", !1).div;
      }, BN.prototype.mod = function(num) {
        return this.divmod(num, "mod", !1).mod;
      }, BN.prototype.umod = function(num) {
        return this.divmod(num, "mod", !0).mod;
      }, BN.prototype.divRound = function(num) {
        var dm = this.divmod(num);
        if (dm.mod.isZero()) return dm.div;
        var mod = dm.mod.abs(), half = num.abs().iushrn(1), r2 = num.words[0] & 1, cmp = mod.cmp(half);
        if (cmp < 0 || r2 === 1 && cmp === 0) return dm.div;
        var up = new BN(1);
        return up.negative = this.negative ^ num.negative, dm.div.iadd(up);
      }, BN.prototype.modn = function(num) {
        assert(num <= 67108863);
        for (var p = (1 << 26) % num, acc = 0, i = this.length - 1; i >= 0; i--)
          acc = (p * acc + (this.words[i] | 0)) % num;
        return acc;
      }, BN.prototype.idivn = function(num) {
        assert(num <= 67108863);
        for (var carry = 0, i = this.length - 1; i >= 0; i--) {
          var w = (this.words[i] | 0) + carry * 67108864;
          this.words[i] = w / num | 0, carry = w % num;
        }
        return this.strip();
      }, BN.prototype.divn = function(num) {
        return this.clone().idivn(num);
      }, BN.prototype.egcd = function(p) {
        assert(p.negative === 0), assert(!p.isZero());
        var x = this, y = p.clone();
        x.negative !== 0 ? x = x.umod(p) : x = x.clone();
        for (var A = new BN(1), B = new BN(0), C = new BN(0), D = new BN(1), g = 0; x.isEven() && y.isEven(); )
          x.iushrn(1), y.iushrn(1), ++g;
        for (var yp = y.clone(), xp = x.clone(); !x.isZero(); ) {
          for (var i = 0, im = 1; !(x.words[0] & im) && i < 26; ++i, im <<= 1) ;
          if (i > 0)
            for (x.iushrn(i); i-- > 0; )
              (A.isOdd() || B.isOdd()) && (A.iadd(yp), B.isub(xp)), A.iushrn(1), B.iushrn(1);
          for (var j = 0, jm = 1; !(y.words[0] & jm) && j < 26; ++j, jm <<= 1) ;
          if (j > 0)
            for (y.iushrn(j); j-- > 0; )
              (C.isOdd() || D.isOdd()) && (C.iadd(yp), D.isub(xp)), C.iushrn(1), D.iushrn(1);
          x.cmp(y) >= 0 ? (x.isub(y), A.isub(C), B.isub(D)) : (y.isub(x), C.isub(A), D.isub(B));
        }
        return {
          a: C,
          b: D,
          gcd: y.iushln(g)
        };
      }, BN.prototype._invmp = function(p) {
        assert(p.negative === 0), assert(!p.isZero());
        var a = this, b = p.clone();
        a.negative !== 0 ? a = a.umod(p) : a = a.clone();
        for (var x1 = new BN(1), x2 = new BN(0), delta = b.clone(); a.cmpn(1) > 0 && b.cmpn(1) > 0; ) {
          for (var i = 0, im = 1; !(a.words[0] & im) && i < 26; ++i, im <<= 1) ;
          if (i > 0)
            for (a.iushrn(i); i-- > 0; )
              x1.isOdd() && x1.iadd(delta), x1.iushrn(1);
          for (var j = 0, jm = 1; !(b.words[0] & jm) && j < 26; ++j, jm <<= 1) ;
          if (j > 0)
            for (b.iushrn(j); j-- > 0; )
              x2.isOdd() && x2.iadd(delta), x2.iushrn(1);
          a.cmp(b) >= 0 ? (a.isub(b), x1.isub(x2)) : (b.isub(a), x2.isub(x1));
        }
        var res;
        return a.cmpn(1) === 0 ? res = x1 : res = x2, res.cmpn(0) < 0 && res.iadd(p), res;
      }, BN.prototype.gcd = function(num) {
        if (this.isZero()) return num.abs();
        if (num.isZero()) return this.abs();
        var a = this.clone(), b = num.clone();
        a.negative = 0, b.negative = 0;
        for (var shift = 0; a.isEven() && b.isEven(); shift++)
          a.iushrn(1), b.iushrn(1);
        do {
          for (; a.isEven(); )
            a.iushrn(1);
          for (; b.isEven(); )
            b.iushrn(1);
          var r = a.cmp(b);
          if (r < 0) {
            var t = a;
            a = b, b = t;
          } else if (r === 0 || b.cmpn(1) === 0)
            break;
          a.isub(b);
        } while (!0);
        return b.iushln(shift);
      }, BN.prototype.invm = function(num) {
        return this.egcd(num).a.umod(num);
      }, BN.prototype.isEven = function() {
        return (this.words[0] & 1) === 0;
      }, BN.prototype.isOdd = function() {
        return (this.words[0] & 1) === 1;
      }, BN.prototype.andln = function(num) {
        return this.words[0] & num;
      }, BN.prototype.bincn = function(bit) {
        assert(typeof bit == "number");
        var r = bit % 26, s = (bit - r) / 26, q = 1 << r;
        if (this.length <= s)
          return this._expand(s + 1), this.words[s] |= q, this;
        for (var carry = q, i = s; carry !== 0 && i < this.length; i++) {
          var w = this.words[i] | 0;
          w += carry, carry = w >>> 26, w &= 67108863, this.words[i] = w;
        }
        return carry !== 0 && (this.words[i] = carry, this.length++), this;
      }, BN.prototype.isZero = function() {
        return this.length === 1 && this.words[0] === 0;
      }, BN.prototype.cmpn = function(num) {
        var negative = num < 0;
        if (this.negative !== 0 && !negative) return -1;
        if (this.negative === 0 && negative) return 1;
        this.strip();
        var res;
        if (this.length > 1)
          res = 1;
        else {
          negative && (num = -num), assert(num <= 67108863, "Number is too big");
          var w = this.words[0] | 0;
          res = w === num ? 0 : w < num ? -1 : 1;
        }
        return this.negative !== 0 ? -res | 0 : res;
      }, BN.prototype.cmp = function(num) {
        if (this.negative !== 0 && num.negative === 0) return -1;
        if (this.negative === 0 && num.negative !== 0) return 1;
        var res = this.ucmp(num);
        return this.negative !== 0 ? -res | 0 : res;
      }, BN.prototype.ucmp = function(num) {
        if (this.length > num.length) return 1;
        if (this.length < num.length) return -1;
        for (var res = 0, i = this.length - 1; i >= 0; i--) {
          var a = this.words[i] | 0, b = num.words[i] | 0;
          if (a !== b) {
            a < b ? res = -1 : a > b && (res = 1);
            break;
          }
        }
        return res;
      }, BN.prototype.gtn = function(num) {
        return this.cmpn(num) === 1;
      }, BN.prototype.gt = function(num) {
        return this.cmp(num) === 1;
      }, BN.prototype.gten = function(num) {
        return this.cmpn(num) >= 0;
      }, BN.prototype.gte = function(num) {
        return this.cmp(num) >= 0;
      }, BN.prototype.ltn = function(num) {
        return this.cmpn(num) === -1;
      }, BN.prototype.lt = function(num) {
        return this.cmp(num) === -1;
      }, BN.prototype.lten = function(num) {
        return this.cmpn(num) <= 0;
      }, BN.prototype.lte = function(num) {
        return this.cmp(num) <= 0;
      }, BN.prototype.eqn = function(num) {
        return this.cmpn(num) === 0;
      }, BN.prototype.eq = function(num) {
        return this.cmp(num) === 0;
      }, BN.red = function(num) {
        return new Red(num);
      }, BN.prototype.toRed = function(ctx) {
        return assert(!this.red, "Already a number in reduction context"), assert(this.negative === 0, "red works only with positives"), ctx.convertTo(this)._forceRed(ctx);
      }, BN.prototype.fromRed = function() {
        return assert(this.red, "fromRed works only with numbers in reduction context"), this.red.convertFrom(this);
      }, BN.prototype._forceRed = function(ctx) {
        return this.red = ctx, this;
      }, BN.prototype.forceRed = function(ctx) {
        return assert(!this.red, "Already a number in reduction context"), this._forceRed(ctx);
      }, BN.prototype.redAdd = function(num) {
        return assert(this.red, "redAdd works only with red numbers"), this.red.add(this, num);
      }, BN.prototype.redIAdd = function(num) {
        return assert(this.red, "redIAdd works only with red numbers"), this.red.iadd(this, num);
      }, BN.prototype.redSub = function(num) {
        return assert(this.red, "redSub works only with red numbers"), this.red.sub(this, num);
      }, BN.prototype.redISub = function(num) {
        return assert(this.red, "redISub works only with red numbers"), this.red.isub(this, num);
      }, BN.prototype.redShl = function(num) {
        return assert(this.red, "redShl works only with red numbers"), this.red.shl(this, num);
      }, BN.prototype.redMul = function(num) {
        return assert(this.red, "redMul works only with red numbers"), this.red._verify2(this, num), this.red.mul(this, num);
      }, BN.prototype.redIMul = function(num) {
        return assert(this.red, "redMul works only with red numbers"), this.red._verify2(this, num), this.red.imul(this, num);
      }, BN.prototype.redSqr = function() {
        return assert(this.red, "redSqr works only with red numbers"), this.red._verify1(this), this.red.sqr(this);
      }, BN.prototype.redISqr = function() {
        return assert(this.red, "redISqr works only with red numbers"), this.red._verify1(this), this.red.isqr(this);
      }, BN.prototype.redSqrt = function() {
        return assert(this.red, "redSqrt works only with red numbers"), this.red._verify1(this), this.red.sqrt(this);
      }, BN.prototype.redInvm = function() {
        return assert(this.red, "redInvm works only with red numbers"), this.red._verify1(this), this.red.invm(this);
      }, BN.prototype.redNeg = function() {
        return assert(this.red, "redNeg works only with red numbers"), this.red._verify1(this), this.red.neg(this);
      }, BN.prototype.redPow = function(num) {
        return assert(this.red && !num.red, "redPow(normalNum)"), this.red._verify1(this), this.red.pow(this, num);
      };
      var primes = {
        k256: null,
        p224: null,
        p192: null,
        p25519: null
      };
      function MPrime(name, p) {
        this.name = name, this.p = new BN(p, 16), this.n = this.p.bitLength(), this.k = new BN(1).iushln(this.n).isub(this.p), this.tmp = this._tmp();
      }
      MPrime.prototype._tmp = function() {
        var tmp = new BN(null);
        return tmp.words = new Array(Math.ceil(this.n / 13)), tmp;
      }, MPrime.prototype.ireduce = function(num) {
        var r = num, rlen;
        do
          this.split(r, this.tmp), r = this.imulK(r), r = r.iadd(this.tmp), rlen = r.bitLength();
        while (rlen > this.n);
        var cmp = rlen < this.n ? -1 : r.ucmp(this.p);
        return cmp === 0 ? (r.words[0] = 0, r.length = 1) : cmp > 0 ? r.isub(this.p) : r.strip !== void 0 ? r.strip() : r._strip(), r;
      }, MPrime.prototype.split = function(input, out) {
        input.iushrn(this.n, 0, out);
      }, MPrime.prototype.imulK = function(num) {
        return num.imul(this.k);
      };
      function K256() {
        MPrime.call(
          this,
          "k256",
          "ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff fffffffe fffffc2f"
        );
      }
      inherits(K256, MPrime), K256.prototype.split = function(input, output) {
        for (var mask = 4194303, outLen = Math.min(input.length, 9), i = 0; i < outLen; i++)
          output.words[i] = input.words[i];
        if (output.length = outLen, input.length <= 9) {
          input.words[0] = 0, input.length = 1;
          return;
        }
        var prev = input.words[9];
        for (output.words[output.length++] = prev & mask, i = 10; i < input.length; i++) {
          var next = input.words[i] | 0;
          input.words[i - 10] = (next & mask) << 4 | prev >>> 22, prev = next;
        }
        prev >>>= 22, input.words[i - 10] = prev, prev === 0 && input.length > 10 ? input.length -= 10 : input.length -= 9;
      }, K256.prototype.imulK = function(num) {
        num.words[num.length] = 0, num.words[num.length + 1] = 0, num.length += 2;
        for (var lo = 0, i = 0; i < num.length; i++) {
          var w = num.words[i] | 0;
          lo += w * 977, num.words[i] = lo & 67108863, lo = w * 64 + (lo / 67108864 | 0);
        }
        return num.words[num.length - 1] === 0 && (num.length--, num.words[num.length - 1] === 0 && num.length--), num;
      };
      function P224() {
        MPrime.call(
          this,
          "p224",
          "ffffffff ffffffff ffffffff ffffffff 00000000 00000000 00000001"
        );
      }
      inherits(P224, MPrime);
      function P192() {
        MPrime.call(
          this,
          "p192",
          "ffffffff ffffffff ffffffff fffffffe ffffffff ffffffff"
        );
      }
      inherits(P192, MPrime);
      function P25519() {
        MPrime.call(
          this,
          "25519",
          "7fffffffffffffff ffffffffffffffff ffffffffffffffff ffffffffffffffed"
        );
      }
      inherits(P25519, MPrime), P25519.prototype.imulK = function(num) {
        for (var carry = 0, i = 0; i < num.length; i++) {
          var hi = (num.words[i] | 0) * 19 + carry, lo = hi & 67108863;
          hi >>>= 26, num.words[i] = lo, carry = hi;
        }
        return carry !== 0 && (num.words[num.length++] = carry), num;
      }, BN._prime = function(name) {
        if (primes[name]) return primes[name];
        var prime2;
        if (name === "k256")
          prime2 = new K256();
        else if (name === "p224")
          prime2 = new P224();
        else if (name === "p192")
          prime2 = new P192();
        else if (name === "p25519")
          prime2 = new P25519();
        else
          throw new Error("Unknown prime " + name);
        return primes[name] = prime2, prime2;
      };
      function Red(m) {
        if (typeof m == "string") {
          var prime = BN._prime(m);
          this.m = prime.p, this.prime = prime;
        } else
          assert(m.gtn(1), "modulus must be greater than 1"), this.m = m, this.prime = null;
      }
      Red.prototype._verify1 = function(a) {
        assert(a.negative === 0, "red works only with positives"), assert(a.red, "red works only with red numbers");
      }, Red.prototype._verify2 = function(a, b) {
        assert((a.negative | b.negative) === 0, "red works only with positives"), assert(
          a.red && a.red === b.red,
          "red works only with red numbers"
        );
      }, Red.prototype.imod = function(a) {
        return this.prime ? this.prime.ireduce(a)._forceRed(this) : a.umod(this.m)._forceRed(this);
      }, Red.prototype.neg = function(a) {
        return a.isZero() ? a.clone() : this.m.sub(a)._forceRed(this);
      }, Red.prototype.add = function(a, b) {
        this._verify2(a, b);
        var res = a.add(b);
        return res.cmp(this.m) >= 0 && res.isub(this.m), res._forceRed(this);
      }, Red.prototype.iadd = function(a, b) {
        this._verify2(a, b);
        var res = a.iadd(b);
        return res.cmp(this.m) >= 0 && res.isub(this.m), res;
      }, Red.prototype.sub = function(a, b) {
        this._verify2(a, b);
        var res = a.sub(b);
        return res.cmpn(0) < 0 && res.iadd(this.m), res._forceRed(this);
      }, Red.prototype.isub = function(a, b) {
        this._verify2(a, b);
        var res = a.isub(b);
        return res.cmpn(0) < 0 && res.iadd(this.m), res;
      }, Red.prototype.shl = function(a, num) {
        return this._verify1(a), this.imod(a.ushln(num));
      }, Red.prototype.imul = function(a, b) {
        return this._verify2(a, b), this.imod(a.imul(b));
      }, Red.prototype.mul = function(a, b) {
        return this._verify2(a, b), this.imod(a.mul(b));
      }, Red.prototype.isqr = function(a) {
        return this.imul(a, a.clone());
      }, Red.prototype.sqr = function(a) {
        return this.mul(a, a);
      }, Red.prototype.sqrt = function(a) {
        if (a.isZero()) return a.clone();
        var mod3 = this.m.andln(3);
        if (assert(mod3 % 2 === 1), mod3 === 3) {
          var pow = this.m.add(new BN(1)).iushrn(2);
          return this.pow(a, pow);
        }
        for (var q = this.m.subn(1), s = 0; !q.isZero() && q.andln(1) === 0; )
          s++, q.iushrn(1);
        assert(!q.isZero());
        var one = new BN(1).toRed(this), nOne = one.redNeg(), lpow = this.m.subn(1).iushrn(1), z = this.m.bitLength();
        for (z = new BN(2 * z * z).toRed(this); this.pow(z, lpow).cmp(nOne) !== 0; )
          z.redIAdd(nOne);
        for (var c = this.pow(z, q), r = this.pow(a, q.addn(1).iushrn(1)), t = this.pow(a, q), m = s; t.cmp(one) !== 0; ) {
          for (var tmp = t, i = 0; tmp.cmp(one) !== 0; i++)
            tmp = tmp.redSqr();
          assert(i < m);
          var b = this.pow(c, new BN(1).iushln(m - i - 1));
          r = r.redMul(b), c = b.redSqr(), t = t.redMul(c), m = i;
        }
        return r;
      }, Red.prototype.invm = function(a) {
        var inv = a._invmp(this.m);
        return inv.negative !== 0 ? (inv.negative = 0, this.imod(inv).redNeg()) : this.imod(inv);
      }, Red.prototype.pow = function(a, num) {
        if (num.isZero()) return new BN(1).toRed(this);
        if (num.cmpn(1) === 0) return a.clone();
        var windowSize = 4, wnd = new Array(1 << windowSize);
        wnd[0] = new BN(1).toRed(this), wnd[1] = a;
        for (var i = 2; i < wnd.length; i++)
          wnd[i] = this.mul(wnd[i - 1], a);
        var res = wnd[0], current = 0, currentLen = 0, start = num.bitLength() % 26;
        for (start === 0 && (start = 26), i = num.length - 1; i >= 0; i--) {
          for (var word = num.words[i], j = start - 1; j >= 0; j--) {
            var bit = word >> j & 1;
            if (res !== wnd[0] && (res = this.sqr(res)), bit === 0 && current === 0) {
              currentLen = 0;
              continue;
            }
            current <<= 1, current |= bit, currentLen++, !(currentLen !== windowSize && (i !== 0 || j !== 0)) && (res = this.mul(res, wnd[current]), currentLen = 0, current = 0);
          }
          start = 26;
        }
        return res;
      }, Red.prototype.convertTo = function(num) {
        var r = num.umod(this.m);
        return r === num ? r.clone() : r;
      }, Red.prototype.convertFrom = function(num) {
        var res = num.clone();
        return res.red = null, res;
      }, BN.mont = function(num) {
        return new Mont(num);
      };
      function Mont(m) {
        Red.call(this, m), this.shift = this.m.bitLength(), this.shift % 26 !== 0 && (this.shift += 26 - this.shift % 26), this.r = new BN(1).iushln(this.shift), this.r2 = this.imod(this.r.sqr()), this.rinv = this.r._invmp(this.m), this.minv = this.rinv.mul(this.r).isubn(1).div(this.m), this.minv = this.minv.umod(this.r), this.minv = this.r.sub(this.minv);
      }
      inherits(Mont, Red), Mont.prototype.convertTo = function(num) {
        return this.imod(num.ushln(this.shift));
      }, Mont.prototype.convertFrom = function(num) {
        var r = this.imod(num.mul(this.rinv));
        return r.red = null, r;
      }, Mont.prototype.imul = function(a, b) {
        if (a.isZero() || b.isZero())
          return a.words[0] = 0, a.length = 1, a;
        var t = a.imul(b), c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m), u = t.isub(c).iushrn(this.shift), res = u;
        return u.cmp(this.m) >= 0 ? res = u.isub(this.m) : u.cmpn(0) < 0 && (res = u.iadd(this.m)), res._forceRed(this);
      }, Mont.prototype.mul = function(a, b) {
        if (a.isZero() || b.isZero()) return new BN(0)._forceRed(this);
        var t = a.mul(b), c = t.maskn(this.shift).mul(this.minv).imaskn(this.shift).mul(this.m), u = t.isub(c).iushrn(this.shift), res = u;
        return u.cmp(this.m) >= 0 ? res = u.isub(this.m) : u.cmpn(0) < 0 && (res = u.iadd(this.m)), res._forceRed(this);
      }, Mont.prototype.invm = function(a) {
        var res = this.imod(a._invmp(this.m).mul(this.r2));
        return res._forceRed(this);
      };
    })(typeof module2 > "u" || module2, exports2);
  }
});

// node_modules/inherits/inherits_browser.js
var require_inherits_browser = __commonJS({
  "node_modules/inherits/inherits_browser.js"(exports2, module2) {
    typeof Object.create == "function" ? module2.exports = function(ctor, superCtor) {
      superCtor && (ctor.super_ = superCtor, ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: !1,
          writable: !0,
          configurable: !0
        }
      }));
    } : module2.exports = function(ctor, superCtor) {
      if (superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function() {
        };
        TempCtor.prototype = superCtor.prototype, ctor.prototype = new TempCtor(), ctor.prototype.constructor = ctor;
      }
    };
  }
});

// node_modules/inherits/inherits.js
var require_inherits = __commonJS({
  "node_modules/inherits/inherits.js"(exports2, module2) {
    try {
      if (util = require("util"), typeof util.inherits != "function") throw "";
      module2.exports = util.inherits;
    } catch {
      module2.exports = require_inherits_browser();
    }
    var util;
  }
});

// node_modules/safer-buffer/safer.js
var require_safer = __commonJS({
  "node_modules/safer-buffer/safer.js"(exports2, module2) {
    "use strict";
    var buffer = require("buffer"), Buffer2 = buffer.Buffer, safer = {}, key;
    for (key in buffer)
      buffer.hasOwnProperty(key) && (key === "SlowBuffer" || key === "Buffer" || (safer[key] = buffer[key]));
    var Safer = safer.Buffer = {};
    for (key in Buffer2)
      Buffer2.hasOwnProperty(key) && (key === "allocUnsafe" || key === "allocUnsafeSlow" || (Safer[key] = Buffer2[key]));
    safer.Buffer.prototype = Buffer2.prototype;
    (!Safer.from || Safer.from === Uint8Array.from) && (Safer.from = function(value, encodingOrOffset, length) {
      if (typeof value == "number")
        throw new TypeError('The "value" argument must not be of type number. Received type ' + typeof value);
      if (value && typeof value.length > "u")
        throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
      return Buffer2(value, encodingOrOffset, length);
    });
    Safer.alloc || (Safer.alloc = function(size, fill, encoding) {
      if (typeof size != "number")
        throw new TypeError('The "size" argument must be of type number. Received type ' + typeof size);
      if (size < 0 || size >= 2 * (1 << 30))
        throw new RangeError('The value "' + size + '" is invalid for option "size"');
      var buf = Buffer2(size);
      return !fill || fill.length === 0 ? buf.fill(0) : typeof encoding == "string" ? buf.fill(fill, encoding) : buf.fill(fill), buf;
    });
    if (!safer.kStringMaxLength)
      try {
        safer.kStringMaxLength = process.binding("buffer").kStringMaxLength;
      } catch {
      }
    safer.constants || (safer.constants = {
      MAX_LENGTH: safer.kMaxLength
    }, safer.kStringMaxLength && (safer.constants.MAX_STRING_LENGTH = safer.kStringMaxLength));
    module2.exports = safer;
  }
});

// node_modules/asn1.js/lib/asn1/base/reporter.js
var require_reporter = __commonJS({
  "node_modules/asn1.js/lib/asn1/base/reporter.js"(exports2) {
    "use strict";
    var inherits = require_inherits();
    function Reporter(options) {
      this._reporterState = {
        obj: null,
        path: [],
        options: options || {},
        errors: []
      };
    }
    exports2.Reporter = Reporter;
    Reporter.prototype.isError = function(obj) {
      return obj instanceof ReporterError;
    };
    Reporter.prototype.save = function() {
      let state = this._reporterState;
      return { obj: state.obj, pathLen: state.path.length };
    };
    Reporter.prototype.restore = function(data) {
      let state = this._reporterState;
      state.obj = data.obj, state.path = state.path.slice(0, data.pathLen);
    };
    Reporter.prototype.enterKey = function(key) {
      return this._reporterState.path.push(key);
    };
    Reporter.prototype.exitKey = function(index) {
      let state = this._reporterState;
      state.path = state.path.slice(0, index - 1);
    };
    Reporter.prototype.leaveKey = function(index, key, value) {
      let state = this._reporterState;
      this.exitKey(index), state.obj !== null && (state.obj[key] = value);
    };
    Reporter.prototype.path = function() {
      return this._reporterState.path.join("/");
    };
    Reporter.prototype.enterObject = function() {
      let state = this._reporterState, prev = state.obj;
      return state.obj = {}, prev;
    };
    Reporter.prototype.leaveObject = function(prev) {
      let state = this._reporterState, now = state.obj;
      return state.obj = prev, now;
    };
    Reporter.prototype.error = function(msg) {
      let err, state = this._reporterState, inherited = msg instanceof ReporterError;
      if (inherited ? err = msg : err = new ReporterError(state.path.map(function(elem) {
        return "[" + JSON.stringify(elem) + "]";
      }).join(""), msg.message || msg, msg.stack), !state.options.partial)
        throw err;
      return inherited || state.errors.push(err), err;
    };
    Reporter.prototype.wrapResult = function(result) {
      let state = this._reporterState;
      return state.options.partial ? {
        result: this.isError(result) ? null : result,
        errors: state.errors
      } : result;
    };
    function ReporterError(path, msg) {
      this.path = path, this.rethrow(msg);
    }
    inherits(ReporterError, Error);
    ReporterError.prototype.rethrow = function(msg) {
      if (this.message = msg + " at: " + (this.path || "(shallow)"), Error.captureStackTrace && Error.captureStackTrace(this, ReporterError), !this.stack)
        try {
          throw new Error(this.message);
        } catch (e) {
          this.stack = e.stack;
        }
      return this;
    };
  }
});

// node_modules/asn1.js/lib/asn1/base/buffer.js
var require_buffer = __commonJS({
  "node_modules/asn1.js/lib/asn1/base/buffer.js"(exports2) {
    "use strict";
    var inherits = require_inherits(), Reporter = require_reporter().Reporter, Buffer2 = require_safer().Buffer;
    function DecoderBuffer(base, options) {
      if (Reporter.call(this, options), !Buffer2.isBuffer(base)) {
        this.error("Input not Buffer");
        return;
      }
      this.base = base, this.offset = 0, this.length = base.length;
    }
    inherits(DecoderBuffer, Reporter);
    exports2.DecoderBuffer = DecoderBuffer;
    DecoderBuffer.isDecoderBuffer = function(data) {
      return data instanceof DecoderBuffer ? !0 : typeof data == "object" && Buffer2.isBuffer(data.base) && data.constructor.name === "DecoderBuffer" && typeof data.offset == "number" && typeof data.length == "number" && typeof data.save == "function" && typeof data.restore == "function" && typeof data.isEmpty == "function" && typeof data.readUInt8 == "function" && typeof data.skip == "function" && typeof data.raw == "function";
    };
    DecoderBuffer.prototype.save = function() {
      return { offset: this.offset, reporter: Reporter.prototype.save.call(this) };
    };
    DecoderBuffer.prototype.restore = function(save) {
      let res = new DecoderBuffer(this.base);
      return res.offset = save.offset, res.length = this.offset, this.offset = save.offset, Reporter.prototype.restore.call(this, save.reporter), res;
    };
    DecoderBuffer.prototype.isEmpty = function() {
      return this.offset === this.length;
    };
    DecoderBuffer.prototype.readUInt8 = function(fail) {
      return this.offset + 1 <= this.length ? this.base.readUInt8(this.offset++, !0) : this.error(fail || "DecoderBuffer overrun");
    };
    DecoderBuffer.prototype.skip = function(bytes, fail) {
      if (!(this.offset + bytes <= this.length))
        return this.error(fail || "DecoderBuffer overrun");
      let res = new DecoderBuffer(this.base);
      return res._reporterState = this._reporterState, res.offset = this.offset, res.length = this.offset + bytes, this.offset += bytes, res;
    };
    DecoderBuffer.prototype.raw = function(save) {
      return this.base.slice(save ? save.offset : this.offset, this.length);
    };
    function EncoderBuffer(value, reporter) {
      if (Array.isArray(value))
        this.length = 0, this.value = value.map(function(item) {
          return EncoderBuffer.isEncoderBuffer(item) || (item = new EncoderBuffer(item, reporter)), this.length += item.length, item;
        }, this);
      else if (typeof value == "number") {
        if (!(0 <= value && value <= 255))
          return reporter.error("non-byte EncoderBuffer value");
        this.value = value, this.length = 1;
      } else if (typeof value == "string")
        this.value = value, this.length = Buffer2.byteLength(value);
      else if (Buffer2.isBuffer(value))
        this.value = value, this.length = value.length;
      else
        return reporter.error("Unsupported type: " + typeof value);
    }
    exports2.EncoderBuffer = EncoderBuffer;
    EncoderBuffer.isEncoderBuffer = function(data) {
      return data instanceof EncoderBuffer ? !0 : typeof data == "object" && data.constructor.name === "EncoderBuffer" && typeof data.length == "number" && typeof data.join == "function";
    };
    EncoderBuffer.prototype.join = function(out, offset) {
      return out || (out = Buffer2.alloc(this.length)), offset || (offset = 0), this.length === 0 || (Array.isArray(this.value) ? this.value.forEach(function(item) {
        item.join(out, offset), offset += item.length;
      }) : (typeof this.value == "number" ? out[offset] = this.value : typeof this.value == "string" ? out.write(this.value, offset) : Buffer2.isBuffer(this.value) && this.value.copy(out, offset), offset += this.length)), out;
    };
  }
});

// node_modules/minimalistic-assert/index.js
var require_minimalistic_assert = __commonJS({
  "node_modules/minimalistic-assert/index.js"(exports2, module2) {
    module2.exports = assert;
    function assert(val, msg) {
      if (!val)
        throw new Error(msg || "Assertion failed");
    }
    assert.equal = function(l, r, msg) {
      if (l != r)
        throw new Error(msg || "Assertion failed: " + l + " != " + r);
    };
  }
});

// node_modules/asn1.js/lib/asn1/base/node.js
var require_node = __commonJS({
  "node_modules/asn1.js/lib/asn1/base/node.js"(exports2, module2) {
    "use strict";
    var Reporter = require_reporter().Reporter, EncoderBuffer = require_buffer().EncoderBuffer, DecoderBuffer = require_buffer().DecoderBuffer, assert = require_minimalistic_assert(), tags = [
      "seq",
      "seqof",
      "set",
      "setof",
      "objid",
      "bool",
      "gentime",
      "utctime",
      "null_",
      "enum",
      "int",
      "objDesc",
      "bitstr",
      "bmpstr",
      "charstr",
      "genstr",
      "graphstr",
      "ia5str",
      "iso646str",
      "numstr",
      "octstr",
      "printstr",
      "t61str",
      "unistr",
      "utf8str",
      "videostr"
    ], methods = [
      "key",
      "obj",
      "use",
      "optional",
      "explicit",
      "implicit",
      "def",
      "choice",
      "any",
      "contains"
    ].concat(tags), overrided = [
      "_peekTag",
      "_decodeTag",
      "_use",
      "_decodeStr",
      "_decodeObjid",
      "_decodeTime",
      "_decodeNull",
      "_decodeInt",
      "_decodeBool",
      "_decodeList",
      "_encodeComposite",
      "_encodeStr",
      "_encodeObjid",
      "_encodeTime",
      "_encodeNull",
      "_encodeInt",
      "_encodeBool"
    ];
    function Node(enc, parent, name) {
      let state = {};
      this._baseState = state, state.name = name, state.enc = enc, state.parent = parent || null, state.children = null, state.tag = null, state.args = null, state.reverseArgs = null, state.choice = null, state.optional = !1, state.any = !1, state.obj = !1, state.use = null, state.useDecoder = null, state.key = null, state.default = null, state.explicit = null, state.implicit = null, state.contains = null, state.parent || (state.children = [], this._wrap());
    }
    module2.exports = Node;
    var stateProps = [
      "enc",
      "parent",
      "children",
      "tag",
      "args",
      "reverseArgs",
      "choice",
      "optional",
      "any",
      "obj",
      "use",
      "alteredUse",
      "key",
      "default",
      "explicit",
      "implicit",
      "contains"
    ];
    Node.prototype.clone = function() {
      let state = this._baseState, cstate = {};
      stateProps.forEach(function(prop) {
        cstate[prop] = state[prop];
      });
      let res = new this.constructor(cstate.parent);
      return res._baseState = cstate, res;
    };
    Node.prototype._wrap = function() {
      let state = this._baseState;
      methods.forEach(function(method) {
        this[method] = function() {
          let clone = new this.constructor(this);
          return state.children.push(clone), clone[method].apply(clone, arguments);
        };
      }, this);
    };
    Node.prototype._init = function(body) {
      let state = this._baseState;
      assert(state.parent === null), body.call(this), state.children = state.children.filter(function(child) {
        return child._baseState.parent === this;
      }, this), assert.equal(state.children.length, 1, "Root node can have only one child");
    };
    Node.prototype._useArgs = function(args) {
      let state = this._baseState, children = args.filter(function(arg) {
        return arg instanceof this.constructor;
      }, this);
      args = args.filter(function(arg) {
        return !(arg instanceof this.constructor);
      }, this), children.length !== 0 && (assert(state.children === null), state.children = children, children.forEach(function(child) {
        child._baseState.parent = this;
      }, this)), args.length !== 0 && (assert(state.args === null), state.args = args, state.reverseArgs = args.map(function(arg) {
        if (typeof arg != "object" || arg.constructor !== Object)
          return arg;
        let res = {};
        return Object.keys(arg).forEach(function(key) {
          key == (key | 0) && (key |= 0);
          let value = arg[key];
          res[value] = key;
        }), res;
      }));
    };
    overrided.forEach(function(method) {
      Node.prototype[method] = function() {
        let state = this._baseState;
        throw new Error(method + " not implemented for encoding: " + state.enc);
      };
    });
    tags.forEach(function(tag) {
      Node.prototype[tag] = function() {
        let state = this._baseState, args = Array.prototype.slice.call(arguments);
        return assert(state.tag === null), state.tag = tag, this._useArgs(args), this;
      };
    });
    Node.prototype.use = function(item) {
      assert(item);
      let state = this._baseState;
      return assert(state.use === null), state.use = item, this;
    };
    Node.prototype.optional = function() {
      let state = this._baseState;
      return state.optional = !0, this;
    };
    Node.prototype.def = function(val) {
      let state = this._baseState;
      return assert(state.default === null), state.default = val, state.optional = !0, this;
    };
    Node.prototype.explicit = function(num) {
      let state = this._baseState;
      return assert(state.explicit === null && state.implicit === null), state.explicit = num, this;
    };
    Node.prototype.implicit = function(num) {
      let state = this._baseState;
      return assert(state.explicit === null && state.implicit === null), state.implicit = num, this;
    };
    Node.prototype.obj = function() {
      let state = this._baseState, args = Array.prototype.slice.call(arguments);
      return state.obj = !0, args.length !== 0 && this._useArgs(args), this;
    };
    Node.prototype.key = function(newKey) {
      let state = this._baseState;
      return assert(state.key === null), state.key = newKey, this;
    };
    Node.prototype.any = function() {
      let state = this._baseState;
      return state.any = !0, this;
    };
    Node.prototype.choice = function(obj) {
      let state = this._baseState;
      return assert(state.choice === null), state.choice = obj, this._useArgs(Object.keys(obj).map(function(key) {
        return obj[key];
      })), this;
    };
    Node.prototype.contains = function(item) {
      let state = this._baseState;
      return assert(state.use === null), state.contains = item, this;
    };
    Node.prototype._decode = function(input, options) {
      let state = this._baseState;
      if (state.parent === null)
        return input.wrapResult(state.children[0]._decode(input, options));
      let result = state.default, present = !0, prevKey = null;
      if (state.key !== null && (prevKey = input.enterKey(state.key)), state.optional) {
        let tag = null;
        if (state.explicit !== null ? tag = state.explicit : state.implicit !== null ? tag = state.implicit : state.tag !== null && (tag = state.tag), tag === null && !state.any) {
          let save = input.save();
          try {
            state.choice === null ? this._decodeGeneric(state.tag, input, options) : this._decodeChoice(input, options), present = !0;
          } catch {
            present = !1;
          }
          input.restore(save);
        } else if (present = this._peekTag(input, tag, state.any), input.isError(present))
          return present;
      }
      let prevObj;
      if (state.obj && present && (prevObj = input.enterObject()), present) {
        if (state.explicit !== null) {
          let explicit = this._decodeTag(input, state.explicit);
          if (input.isError(explicit))
            return explicit;
          input = explicit;
        }
        let start = input.offset;
        if (state.use === null && state.choice === null) {
          let save;
          state.any && (save = input.save());
          let body = this._decodeTag(
            input,
            state.implicit !== null ? state.implicit : state.tag,
            state.any
          );
          if (input.isError(body))
            return body;
          state.any ? result = input.raw(save) : input = body;
        }
        if (options && options.track && state.tag !== null && options.track(input.path(), start, input.length, "tagged"), options && options.track && state.tag !== null && options.track(input.path(), input.offset, input.length, "content"), state.any || (state.choice === null ? result = this._decodeGeneric(state.tag, input, options) : result = this._decodeChoice(input, options)), input.isError(result))
          return result;
        if (!state.any && state.choice === null && state.children !== null && state.children.forEach(function(child) {
          child._decode(input, options);
        }), state.contains && (state.tag === "octstr" || state.tag === "bitstr")) {
          let data = new DecoderBuffer(result);
          result = this._getUse(state.contains, input._reporterState.obj)._decode(data, options);
        }
      }
      return state.obj && present && (result = input.leaveObject(prevObj)), state.key !== null && (result !== null || present === !0) ? input.leaveKey(prevKey, state.key, result) : prevKey !== null && input.exitKey(prevKey), result;
    };
    Node.prototype._decodeGeneric = function(tag, input, options) {
      let state = this._baseState;
      return tag === "seq" || tag === "set" ? null : tag === "seqof" || tag === "setof" ? this._decodeList(input, tag, state.args[0], options) : /str$/.test(tag) ? this._decodeStr(input, tag, options) : tag === "objid" && state.args ? this._decodeObjid(input, state.args[0], state.args[1], options) : tag === "objid" ? this._decodeObjid(input, null, null, options) : tag === "gentime" || tag === "utctime" ? this._decodeTime(input, tag, options) : tag === "null_" ? this._decodeNull(input, options) : tag === "bool" ? this._decodeBool(input, options) : tag === "objDesc" ? this._decodeStr(input, tag, options) : tag === "int" || tag === "enum" ? this._decodeInt(input, state.args && state.args[0], options) : state.use !== null ? this._getUse(state.use, input._reporterState.obj)._decode(input, options) : input.error("unknown tag: " + tag);
    };
    Node.prototype._getUse = function(entity, obj) {
      let state = this._baseState;
      return state.useDecoder = this._use(entity, obj), assert(state.useDecoder._baseState.parent === null), state.useDecoder = state.useDecoder._baseState.children[0], state.implicit !== state.useDecoder._baseState.implicit && (state.useDecoder = state.useDecoder.clone(), state.useDecoder._baseState.implicit = state.implicit), state.useDecoder;
    };
    Node.prototype._decodeChoice = function(input, options) {
      let state = this._baseState, result = null, match = !1;
      return Object.keys(state.choice).some(function(key) {
        let save = input.save(), node = state.choice[key];
        try {
          let value = node._decode(input, options);
          if (input.isError(value))
            return !1;
          result = { type: key, value }, match = !0;
        } catch {
          return input.restore(save), !1;
        }
        return !0;
      }, this), match ? result : input.error("Choice not matched");
    };
    Node.prototype._createEncoderBuffer = function(data) {
      return new EncoderBuffer(data, this.reporter);
    };
    Node.prototype._encode = function(data, reporter, parent) {
      let state = this._baseState;
      if (state.default !== null && state.default === data)
        return;
      let result = this._encodeValue(data, reporter, parent);
      if (result !== void 0 && !this._skipDefault(result, reporter, parent))
        return result;
    };
    Node.prototype._encodeValue = function(data, reporter, parent) {
      let state = this._baseState;
      if (state.parent === null)
        return state.children[0]._encode(data, reporter || new Reporter());
      let result = null;
      if (this.reporter = reporter, state.optional && data === void 0)
        if (state.default !== null)
          data = state.default;
        else
          return;
      let content = null, primitive = !1;
      if (state.any)
        result = this._createEncoderBuffer(data);
      else if (state.choice)
        result = this._encodeChoice(data, reporter);
      else if (state.contains)
        content = this._getUse(state.contains, parent)._encode(data, reporter), primitive = !0;
      else if (state.children)
        content = state.children.map(function(child) {
          if (child._baseState.tag === "null_")
            return child._encode(null, reporter, data);
          if (child._baseState.key === null)
            return reporter.error("Child should have a key");
          let prevKey = reporter.enterKey(child._baseState.key);
          if (typeof data != "object")
            return reporter.error("Child expected, but input is not object");
          let res = child._encode(data[child._baseState.key], reporter, data);
          return reporter.leaveKey(prevKey), res;
        }, this).filter(function(child) {
          return child;
        }), content = this._createEncoderBuffer(content);
      else if (state.tag === "seqof" || state.tag === "setof") {
        if (!(state.args && state.args.length === 1))
          return reporter.error("Too many args for : " + state.tag);
        if (!Array.isArray(data))
          return reporter.error("seqof/setof, but data is not Array");
        let child = this.clone();
        child._baseState.implicit = null, content = this._createEncoderBuffer(data.map(function(item) {
          let state2 = this._baseState;
          return this._getUse(state2.args[0], data)._encode(item, reporter);
        }, child));
      } else state.use !== null ? result = this._getUse(state.use, parent)._encode(data, reporter) : (content = this._encodePrimitive(state.tag, data), primitive = !0);
      if (!state.any && state.choice === null) {
        let tag = state.implicit !== null ? state.implicit : state.tag, cls = state.implicit === null ? "universal" : "context";
        tag === null ? state.use === null && reporter.error("Tag could be omitted only for .use()") : state.use === null && (result = this._encodeComposite(tag, primitive, cls, content));
      }
      return state.explicit !== null && (result = this._encodeComposite(state.explicit, !1, "context", result)), result;
    };
    Node.prototype._encodeChoice = function(data, reporter) {
      let state = this._baseState, node = state.choice[data.type];
      return node || assert(
        !1,
        data.type + " not found in " + JSON.stringify(Object.keys(state.choice))
      ), node._encode(data.value, reporter);
    };
    Node.prototype._encodePrimitive = function(tag, data) {
      let state = this._baseState;
      if (/str$/.test(tag))
        return this._encodeStr(data, tag);
      if (tag === "objid" && state.args)
        return this._encodeObjid(data, state.reverseArgs[0], state.args[1]);
      if (tag === "objid")
        return this._encodeObjid(data, null, null);
      if (tag === "gentime" || tag === "utctime")
        return this._encodeTime(data, tag);
      if (tag === "null_")
        return this._encodeNull();
      if (tag === "int" || tag === "enum")
        return this._encodeInt(data, state.args && state.reverseArgs[0]);
      if (tag === "bool")
        return this._encodeBool(data);
      if (tag === "objDesc")
        return this._encodeStr(data, tag);
      throw new Error("Unsupported tag: " + tag);
    };
    Node.prototype._isNumstr = function(str) {
      return /^[0-9 ]*$/.test(str);
    };
    Node.prototype._isPrintstr = function(str) {
      return /^[A-Za-z0-9 '()+,-./:=?]*$/.test(str);
    };
  }
});

// node_modules/asn1.js/lib/asn1/constants/der.js
var require_der = __commonJS({
  "node_modules/asn1.js/lib/asn1/constants/der.js"(exports2) {
    "use strict";
    function reverse(map) {
      let res = {};
      return Object.keys(map).forEach(function(key) {
        (key | 0) == key && (key = key | 0);
        let value = map[key];
        res[value] = key;
      }), res;
    }
    exports2.tagClass = {
      0: "universal",
      1: "application",
      2: "context",
      3: "private"
    };
    exports2.tagClassByName = reverse(exports2.tagClass);
    exports2.tag = {
      0: "end",
      1: "bool",
      2: "int",
      3: "bitstr",
      4: "octstr",
      5: "null_",
      6: "objid",
      7: "objDesc",
      8: "external",
      9: "real",
      10: "enum",
      11: "embed",
      12: "utf8str",
      13: "relativeOid",
      16: "seq",
      17: "set",
      18: "numstr",
      19: "printstr",
      20: "t61str",
      21: "videostr",
      22: "ia5str",
      23: "utctime",
      24: "gentime",
      25: "graphstr",
      26: "iso646str",
      27: "genstr",
      28: "unistr",
      29: "charstr",
      30: "bmpstr"
    };
    exports2.tagByName = reverse(exports2.tag);
  }
});

// node_modules/asn1.js/lib/asn1/encoders/der.js
var require_der2 = __commonJS({
  "node_modules/asn1.js/lib/asn1/encoders/der.js"(exports2, module2) {
    "use strict";
    var inherits = require_inherits(), Buffer2 = require_safer().Buffer, Node = require_node(), der = require_der();
    function DEREncoder(entity) {
      this.enc = "der", this.name = entity.name, this.entity = entity, this.tree = new DERNode(), this.tree._init(entity.body);
    }
    module2.exports = DEREncoder;
    DEREncoder.prototype.encode = function(data, reporter) {
      return this.tree._encode(data, reporter).join();
    };
    function DERNode(parent) {
      Node.call(this, "der", parent);
    }
    inherits(DERNode, Node);
    DERNode.prototype._encodeComposite = function(tag, primitive, cls, content) {
      let encodedTag = encodeTag(tag, primitive, cls, this.reporter);
      if (content.length < 128) {
        let header2 = Buffer2.alloc(2);
        return header2[0] = encodedTag, header2[1] = content.length, this._createEncoderBuffer([header2, content]);
      }
      let lenOctets = 1;
      for (let i = content.length; i >= 256; i >>= 8)
        lenOctets++;
      let header = Buffer2.alloc(2 + lenOctets);
      header[0] = encodedTag, header[1] = 128 | lenOctets;
      for (let i = 1 + lenOctets, j = content.length; j > 0; i--, j >>= 8)
        header[i] = j & 255;
      return this._createEncoderBuffer([header, content]);
    };
    DERNode.prototype._encodeStr = function(str, tag) {
      if (tag === "bitstr")
        return this._createEncoderBuffer([str.unused | 0, str.data]);
      if (tag === "bmpstr") {
        let buf = Buffer2.alloc(str.length * 2);
        for (let i = 0; i < str.length; i++)
          buf.writeUInt16BE(str.charCodeAt(i), i * 2);
        return this._createEncoderBuffer(buf);
      } else return tag === "numstr" ? this._isNumstr(str) ? this._createEncoderBuffer(str) : this.reporter.error("Encoding of string type: numstr supports only digits and space") : tag === "printstr" ? this._isPrintstr(str) ? this._createEncoderBuffer(str) : this.reporter.error("Encoding of string type: printstr supports only latin upper and lower case letters, digits, space, apostrophe, left and rigth parenthesis, plus sign, comma, hyphen, dot, slash, colon, equal sign, question mark") : /str$/.test(tag) ? this._createEncoderBuffer(str) : tag === "objDesc" ? this._createEncoderBuffer(str) : this.reporter.error("Encoding of string type: " + tag + " unsupported");
    };
    DERNode.prototype._encodeObjid = function(id, values, relative) {
      if (typeof id == "string") {
        if (!values)
          return this.reporter.error("string objid given, but no values map found");
        if (!values.hasOwnProperty(id))
          return this.reporter.error("objid not found in values map");
        id = values[id].split(/[\s.]+/g);
        for (let i = 0; i < id.length; i++)
          id[i] |= 0;
      } else if (Array.isArray(id)) {
        id = id.slice();
        for (let i = 0; i < id.length; i++)
          id[i] |= 0;
      }
      if (!Array.isArray(id))
        return this.reporter.error("objid() should be either array or string, got: " + JSON.stringify(id));
      if (!relative) {
        if (id[1] >= 40)
          return this.reporter.error("Second objid identifier OOB");
        id.splice(0, 2, id[0] * 40 + id[1]);
      }
      let size = 0;
      for (let i = 0; i < id.length; i++) {
        let ident = id[i];
        for (size++; ident >= 128; ident >>= 7)
          size++;
      }
      let objid = Buffer2.alloc(size), offset = objid.length - 1;
      for (let i = id.length - 1; i >= 0; i--) {
        let ident = id[i];
        for (objid[offset--] = ident & 127; (ident >>= 7) > 0; )
          objid[offset--] = 128 | ident & 127;
      }
      return this._createEncoderBuffer(objid);
    };
    function two(num) {
      return num < 10 ? "0" + num : num;
    }
    DERNode.prototype._encodeTime = function(time, tag) {
      let str, date = new Date(time);
      return tag === "gentime" ? str = [
        two(date.getUTCFullYear()),
        two(date.getUTCMonth() + 1),
        two(date.getUTCDate()),
        two(date.getUTCHours()),
        two(date.getUTCMinutes()),
        two(date.getUTCSeconds()),
        "Z"
      ].join("") : tag === "utctime" ? str = [
        two(date.getUTCFullYear() % 100),
        two(date.getUTCMonth() + 1),
        two(date.getUTCDate()),
        two(date.getUTCHours()),
        two(date.getUTCMinutes()),
        two(date.getUTCSeconds()),
        "Z"
      ].join("") : this.reporter.error("Encoding " + tag + " time is not supported yet"), this._encodeStr(str, "octstr");
    };
    DERNode.prototype._encodeNull = function() {
      return this._createEncoderBuffer("");
    };
    DERNode.prototype._encodeInt = function(num, values) {
      if (typeof num == "string") {
        if (!values)
          return this.reporter.error("String int or enum given, but no values map");
        if (!values.hasOwnProperty(num))
          return this.reporter.error("Values map doesn't contain: " + JSON.stringify(num));
        num = values[num];
      }
      if (typeof num != "number" && !Buffer2.isBuffer(num)) {
        let numArray = num.toArray();
        !num.sign && numArray[0] & 128 && numArray.unshift(0), num = Buffer2.from(numArray);
      }
      if (Buffer2.isBuffer(num)) {
        let size2 = num.length;
        num.length === 0 && size2++;
        let out2 = Buffer2.alloc(size2);
        return num.copy(out2), num.length === 0 && (out2[0] = 0), this._createEncoderBuffer(out2);
      }
      if (num < 128)
        return this._createEncoderBuffer(num);
      if (num < 256)
        return this._createEncoderBuffer([0, num]);
      let size = 1;
      for (let i = num; i >= 256; i >>= 8)
        size++;
      let out = new Array(size);
      for (let i = out.length - 1; i >= 0; i--)
        out[i] = num & 255, num >>= 8;
      return out[0] & 128 && out.unshift(0), this._createEncoderBuffer(Buffer2.from(out));
    };
    DERNode.prototype._encodeBool = function(value) {
      return this._createEncoderBuffer(value ? 255 : 0);
    };
    DERNode.prototype._use = function(entity, obj) {
      return typeof entity == "function" && (entity = entity(obj)), entity._getEncoder("der").tree;
    };
    DERNode.prototype._skipDefault = function(dataBuffer, reporter, parent) {
      let state = this._baseState, i;
      if (state.default === null)
        return !1;
      let data = dataBuffer.join();
      if (state.defaultBuffer === void 0 && (state.defaultBuffer = this._encodeValue(state.default, reporter, parent).join()), data.length !== state.defaultBuffer.length)
        return !1;
      for (i = 0; i < data.length; i++)
        if (data[i] !== state.defaultBuffer[i])
          return !1;
      return !0;
    };
    function encodeTag(tag, primitive, cls, reporter) {
      let res;
      if (tag === "seqof" ? tag = "seq" : tag === "setof" && (tag = "set"), der.tagByName.hasOwnProperty(tag))
        res = der.tagByName[tag];
      else if (typeof tag == "number" && (tag | 0) === tag)
        res = tag;
      else
        return reporter.error("Unknown tag: " + tag);
      return res >= 31 ? reporter.error("Multi-octet tag encoding unsupported") : (primitive || (res |= 32), res |= der.tagClassByName[cls || "universal"] << 6, res);
    }
  }
});

// node_modules/asn1.js/lib/asn1/encoders/pem.js
var require_pem = __commonJS({
  "node_modules/asn1.js/lib/asn1/encoders/pem.js"(exports2, module2) {
    "use strict";
    var inherits = require_inherits(), DEREncoder = require_der2();
    function PEMEncoder(entity) {
      DEREncoder.call(this, entity), this.enc = "pem";
    }
    inherits(PEMEncoder, DEREncoder);
    module2.exports = PEMEncoder;
    PEMEncoder.prototype.encode = function(data, options) {
      let p = DEREncoder.prototype.encode.call(this, data).toString("base64"), out = ["-----BEGIN " + options.label + "-----"];
      for (let i = 0; i < p.length; i += 64)
        out.push(p.slice(i, i + 64));
      return out.push("-----END " + options.label + "-----"), out.join(`
`);
    };
  }
});

// node_modules/asn1.js/lib/asn1/encoders/index.js
var require_encoders = __commonJS({
  "node_modules/asn1.js/lib/asn1/encoders/index.js"(exports2) {
    "use strict";
    var encoders = exports2;
    encoders.der = require_der2();
    encoders.pem = require_pem();
  }
});

// node_modules/asn1.js/lib/asn1/decoders/der.js
var require_der3 = __commonJS({
  "node_modules/asn1.js/lib/asn1/decoders/der.js"(exports2, module2) {
    "use strict";
    var inherits = require_inherits(), bignum = require_bn(), DecoderBuffer = require_buffer().DecoderBuffer, Node = require_node(), der = require_der();
    function DERDecoder(entity) {
      this.enc = "der", this.name = entity.name, this.entity = entity, this.tree = new DERNode(), this.tree._init(entity.body);
    }
    module2.exports = DERDecoder;
    DERDecoder.prototype.decode = function(data, options) {
      return DecoderBuffer.isDecoderBuffer(data) || (data = new DecoderBuffer(data, options)), this.tree._decode(data, options);
    };
    function DERNode(parent) {
      Node.call(this, "der", parent);
    }
    inherits(DERNode, Node);
    DERNode.prototype._peekTag = function(buffer, tag, any) {
      if (buffer.isEmpty())
        return !1;
      let state = buffer.save(), decodedTag = derDecodeTag(buffer, 'Failed to peek tag: "' + tag + '"');
      return buffer.isError(decodedTag) ? decodedTag : (buffer.restore(state), decodedTag.tag === tag || decodedTag.tagStr === tag || decodedTag.tagStr + "of" === tag || any);
    };
    DERNode.prototype._decodeTag = function(buffer, tag, any) {
      let decodedTag = derDecodeTag(
        buffer,
        'Failed to decode tag of "' + tag + '"'
      );
      if (buffer.isError(decodedTag))
        return decodedTag;
      let len = derDecodeLen(
        buffer,
        decodedTag.primitive,
        'Failed to get length of "' + tag + '"'
      );
      if (buffer.isError(len))
        return len;
      if (!any && decodedTag.tag !== tag && decodedTag.tagStr !== tag && decodedTag.tagStr + "of" !== tag)
        return buffer.error('Failed to match tag: "' + tag + '"');
      if (decodedTag.primitive || len !== null)
        return buffer.skip(len, 'Failed to match body of: "' + tag + '"');
      let state = buffer.save(), res = this._skipUntilEnd(
        buffer,
        'Failed to skip indefinite length body: "' + this.tag + '"'
      );
      return buffer.isError(res) ? res : (len = buffer.offset - state.offset, buffer.restore(state), buffer.skip(len, 'Failed to match body of: "' + tag + '"'));
    };
    DERNode.prototype._skipUntilEnd = function(buffer, fail) {
      for (; ; ) {
        let tag = derDecodeTag(buffer, fail);
        if (buffer.isError(tag))
          return tag;
        let len = derDecodeLen(buffer, tag.primitive, fail);
        if (buffer.isError(len))
          return len;
        let res;
        if (tag.primitive || len !== null ? res = buffer.skip(len) : res = this._skipUntilEnd(buffer, fail), buffer.isError(res))
          return res;
        if (tag.tagStr === "end")
          break;
      }
    };
    DERNode.prototype._decodeList = function(buffer, tag, decoder, options) {
      let result = [];
      for (; !buffer.isEmpty(); ) {
        let possibleEnd = this._peekTag(buffer, "end");
        if (buffer.isError(possibleEnd))
          return possibleEnd;
        let res = decoder.decode(buffer, "der", options);
        if (buffer.isError(res) && possibleEnd)
          break;
        result.push(res);
      }
      return result;
    };
    DERNode.prototype._decodeStr = function(buffer, tag) {
      if (tag === "bitstr") {
        let unused = buffer.readUInt8();
        return buffer.isError(unused) ? unused : { unused, data: buffer.raw() };
      } else if (tag === "bmpstr") {
        let raw = buffer.raw();
        if (raw.length % 2 === 1)
          return buffer.error("Decoding of string type: bmpstr length mismatch");
        let str = "";
        for (let i = 0; i < raw.length / 2; i++)
          str += String.fromCharCode(raw.readUInt16BE(i * 2));
        return str;
      } else if (tag === "numstr") {
        let numstr = buffer.raw().toString("ascii");
        return this._isNumstr(numstr) ? numstr : buffer.error("Decoding of string type: numstr unsupported characters");
      } else {
        if (tag === "octstr")
          return buffer.raw();
        if (tag === "objDesc")
          return buffer.raw();
        if (tag === "printstr") {
          let printstr = buffer.raw().toString("ascii");
          return this._isPrintstr(printstr) ? printstr : buffer.error("Decoding of string type: printstr unsupported characters");
        } else return /str$/.test(tag) ? buffer.raw().toString() : buffer.error("Decoding of string type: " + tag + " unsupported");
      }
    };
    DERNode.prototype._decodeObjid = function(buffer, values, relative) {
      let result, identifiers = [], ident = 0, subident = 0;
      for (; !buffer.isEmpty(); )
        subident = buffer.readUInt8(), ident <<= 7, ident |= subident & 127, subident & 128 || (identifiers.push(ident), ident = 0);
      subident & 128 && identifiers.push(ident);
      let first = identifiers[0] / 40 | 0, second = identifiers[0] % 40;
      if (relative ? result = identifiers : result = [first, second].concat(identifiers.slice(1)), values) {
        let tmp = values[result.join(" ")];
        tmp === void 0 && (tmp = values[result.join(".")]), tmp !== void 0 && (result = tmp);
      }
      return result;
    };
    DERNode.prototype._decodeTime = function(buffer, tag) {
      let str = buffer.raw().toString(), year, mon, day, hour, min, sec;
      if (tag === "gentime")
        year = str.slice(0, 4) | 0, mon = str.slice(4, 6) | 0, day = str.slice(6, 8) | 0, hour = str.slice(8, 10) | 0, min = str.slice(10, 12) | 0, sec = str.slice(12, 14) | 0;
      else if (tag === "utctime")
        year = str.slice(0, 2) | 0, mon = str.slice(2, 4) | 0, day = str.slice(4, 6) | 0, hour = str.slice(6, 8) | 0, min = str.slice(8, 10) | 0, sec = str.slice(10, 12) | 0, year < 70 ? year = 2e3 + year : year = 1900 + year;
      else
        return buffer.error("Decoding " + tag + " time is not supported yet");
      return Date.UTC(year, mon - 1, day, hour, min, sec, 0);
    };
    DERNode.prototype._decodeNull = function() {
      return null;
    };
    DERNode.prototype._decodeBool = function(buffer) {
      let res = buffer.readUInt8();
      return buffer.isError(res) ? res : res !== 0;
    };
    DERNode.prototype._decodeInt = function(buffer, values) {
      let raw = buffer.raw(), res = new bignum(raw);
      return values && (res = values[res.toString(10)] || res), res;
    };
    DERNode.prototype._use = function(entity, obj) {
      return typeof entity == "function" && (entity = entity(obj)), entity._getDecoder("der").tree;
    };
    function derDecodeTag(buf, fail) {
      let tag = buf.readUInt8(fail);
      if (buf.isError(tag))
        return tag;
      let cls = der.tagClass[tag >> 6], primitive = (tag & 32) === 0;
      if ((tag & 31) === 31) {
        let oct = tag;
        for (tag = 0; (oct & 128) === 128; ) {
          if (oct = buf.readUInt8(fail), buf.isError(oct))
            return oct;
          tag <<= 7, tag |= oct & 127;
        }
      } else
        tag &= 31;
      let tagStr = der.tag[tag];
      return {
        cls,
        primitive,
        tag,
        tagStr
      };
    }
    function derDecodeLen(buf, primitive, fail) {
      let len = buf.readUInt8(fail);
      if (buf.isError(len))
        return len;
      if (!primitive && len === 128)
        return null;
      if (!(len & 128))
        return len;
      let num = len & 127;
      if (num > 4)
        return buf.error("length octect is too long");
      len = 0;
      for (let i = 0; i < num; i++) {
        len <<= 8;
        let j = buf.readUInt8(fail);
        if (buf.isError(j))
          return j;
        len |= j;
      }
      return len;
    }
  }
});

// node_modules/asn1.js/lib/asn1/decoders/pem.js
var require_pem2 = __commonJS({
  "node_modules/asn1.js/lib/asn1/decoders/pem.js"(exports2, module2) {
    "use strict";
    var inherits = require_inherits(), Buffer2 = require_safer().Buffer, DERDecoder = require_der3();
    function PEMDecoder(entity) {
      DERDecoder.call(this, entity), this.enc = "pem";
    }
    inherits(PEMDecoder, DERDecoder);
    module2.exports = PEMDecoder;
    PEMDecoder.prototype.decode = function(data, options) {
      let lines = data.toString().split(/[\r\n]+/g), label = options.label.toUpperCase(), re = /^-----(BEGIN|END) ([^-]+)-----$/, start = -1, end = -1;
      for (let i = 0; i < lines.length; i++) {
        let match = lines[i].match(re);
        if (match !== null && match[2] === label)
          if (start === -1) {
            if (match[1] !== "BEGIN")
              break;
            start = i;
          } else {
            if (match[1] !== "END")
              break;
            end = i;
            break;
          }
      }
      if (start === -1 || end === -1)
        throw new Error("PEM section not found for: " + label);
      let base64 = lines.slice(start + 1, end).join("");
      base64.replace(/[^a-z0-9+/=]+/gi, "");
      let input = Buffer2.from(base64, "base64");
      return DERDecoder.prototype.decode.call(this, input, options);
    };
  }
});

// node_modules/asn1.js/lib/asn1/decoders/index.js
var require_decoders = __commonJS({
  "node_modules/asn1.js/lib/asn1/decoders/index.js"(exports2) {
    "use strict";
    var decoders = exports2;
    decoders.der = require_der3();
    decoders.pem = require_pem2();
  }
});

// node_modules/asn1.js/lib/asn1/api.js
var require_api = __commonJS({
  "node_modules/asn1.js/lib/asn1/api.js"(exports2) {
    "use strict";
    var encoders = require_encoders(), decoders = require_decoders(), inherits = require_inherits(), api = exports2;
    api.define = function(name, body) {
      return new Entity(name, body);
    };
    function Entity(name, body) {
      this.name = name, this.body = body, this.decoders = {}, this.encoders = {};
    }
    Entity.prototype._createNamed = function(Base) {
      let name = this.name;
      function Generated(entity) {
        this._initNamed(entity, name);
      }
      return inherits(Generated, Base), Generated.prototype._initNamed = function(entity, name2) {
        Base.call(this, entity, name2);
      }, new Generated(this);
    };
    Entity.prototype._getDecoder = function(enc) {
      return enc = enc || "der", this.decoders.hasOwnProperty(enc) || (this.decoders[enc] = this._createNamed(decoders[enc])), this.decoders[enc];
    };
    Entity.prototype.decode = function(data, enc, options) {
      return this._getDecoder(enc).decode(data, options);
    };
    Entity.prototype._getEncoder = function(enc) {
      return enc = enc || "der", this.encoders.hasOwnProperty(enc) || (this.encoders[enc] = this._createNamed(encoders[enc])), this.encoders[enc];
    };
    Entity.prototype.encode = function(data, enc, reporter) {
      return this._getEncoder(enc).encode(data, reporter);
    };
  }
});

// node_modules/asn1.js/lib/asn1/base/index.js
var require_base = __commonJS({
  "node_modules/asn1.js/lib/asn1/base/index.js"(exports2) {
    "use strict";
    var base = exports2;
    base.Reporter = require_reporter().Reporter;
    base.DecoderBuffer = require_buffer().DecoderBuffer;
    base.EncoderBuffer = require_buffer().EncoderBuffer;
    base.Node = require_node();
  }
});

// node_modules/asn1.js/lib/asn1/constants/index.js
var require_constants = __commonJS({
  "node_modules/asn1.js/lib/asn1/constants/index.js"(exports2) {
    "use strict";
    var constants = exports2;
    constants._reverse = function(map) {
      let res = {};
      return Object.keys(map).forEach(function(key) {
        (key | 0) == key && (key = key | 0);
        let value = map[key];
        res[value] = key;
      }), res;
    };
    constants.der = require_der();
  }
});

// node_modules/asn1.js/lib/asn1.js
var require_asn1 = __commonJS({
  "node_modules/asn1.js/lib/asn1.js"(exports2) {
    "use strict";
    var asn1 = exports2;
    asn1.bignum = require_bn();
    asn1.define = require_api().define;
    asn1.base = require_base();
    asn1.constants = require_constants();
    asn1.decoders = require_decoders();
    asn1.encoders = require_encoders();
  }
});

// node_modules/safe-buffer/index.js
var require_safe_buffer = __commonJS({
  "node_modules/safe-buffer/index.js"(exports2, module2) {
    var buffer = require("buffer"), Buffer2 = buffer.Buffer;
    function copyProps(src, dst) {
      for (var key in src)
        dst[key] = src[key];
    }
    Buffer2.from && Buffer2.alloc && Buffer2.allocUnsafe && Buffer2.allocUnsafeSlow ? module2.exports = buffer : (copyProps(buffer, exports2), exports2.Buffer = SafeBuffer);
    function SafeBuffer(arg, encodingOrOffset, length) {
      return Buffer2(arg, encodingOrOffset, length);
    }
    SafeBuffer.prototype = Object.create(Buffer2.prototype);
    copyProps(Buffer2, SafeBuffer);
    SafeBuffer.from = function(arg, encodingOrOffset, length) {
      if (typeof arg == "number")
        throw new TypeError("Argument must not be a number");
      return Buffer2(arg, encodingOrOffset, length);
    };
    SafeBuffer.alloc = function(size, fill, encoding) {
      if (typeof size != "number")
        throw new TypeError("Argument must be a number");
      var buf = Buffer2(size);
      return fill !== void 0 ? typeof encoding == "string" ? buf.fill(fill, encoding) : buf.fill(fill) : buf.fill(0), buf;
    };
    SafeBuffer.allocUnsafe = function(size) {
      if (typeof size != "number")
        throw new TypeError("Argument must be a number");
      return Buffer2(size);
    };
    SafeBuffer.allocUnsafeSlow = function(size) {
      if (typeof size != "number")
        throw new TypeError("Argument must be a number");
      return buffer.SlowBuffer(size);
    };
  }
});

// node_modules/jws/lib/data-stream.js
var require_data_stream2 = __commonJS({
  "node_modules/jws/lib/data-stream.js"(exports2, module2) {
    var Buffer2 = require_safe_buffer().Buffer, Stream = require("stream"), util = require("util");
    function DataStream(data) {
      if (this.buffer = null, this.writable = !0, this.readable = !0, !data)
        return this.buffer = Buffer2.alloc(0), this;
      if (typeof data.pipe == "function")
        return this.buffer = Buffer2.alloc(0), data.pipe(this), this;
      if (data.length || typeof data == "object")
        return this.buffer = data, this.writable = !1, process.nextTick(function() {
          this.emit("end", data), this.readable = !1, this.emit("close");
        }.bind(this)), this;
      throw new TypeError("Unexpected data type (" + typeof data + ")");
    }
    util.inherits(DataStream, Stream);
    DataStream.prototype.write = function(data) {
      this.buffer = Buffer2.concat([this.buffer, Buffer2.from(data)]), this.emit("data", data);
    };
    DataStream.prototype.end = function(data) {
      data && this.write(data), this.emit("end", data), this.emit("close"), this.writable = !1, this.readable = !1;
    };
    module2.exports = DataStream;
  }
});

// node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js
var require_param_bytes_for_alg = __commonJS({
  "node_modules/ecdsa-sig-formatter/src/param-bytes-for-alg.js"(exports2, module2) {
    "use strict";
    function getParamSize(keySize) {
      var result = (keySize / 8 | 0) + (keySize % 8 === 0 ? 0 : 1);
      return result;
    }
    var paramBytesForAlg = {
      ES256: getParamSize(256),
      ES384: getParamSize(384),
      ES512: getParamSize(521)
    };
    function getParamBytesForAlg(alg) {
      var paramBytes = paramBytesForAlg[alg];
      if (paramBytes)
        return paramBytes;
      throw new Error('Unknown algorithm "' + alg + '"');
    }
    module2.exports = getParamBytesForAlg;
  }
});

// node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js
var require_ecdsa_sig_formatter = __commonJS({
  "node_modules/ecdsa-sig-formatter/src/ecdsa-sig-formatter.js"(exports2, module2) {
    "use strict";
    var Buffer2 = require_safe_buffer().Buffer, getParamBytesForAlg = require_param_bytes_for_alg(), MAX_OCTET = 128, CLASS_UNIVERSAL = 0, PRIMITIVE_BIT = 32, TAG_SEQ = 16, TAG_INT = 2, ENCODED_TAG_SEQ = TAG_SEQ | PRIMITIVE_BIT | CLASS_UNIVERSAL << 6, ENCODED_TAG_INT = TAG_INT | CLASS_UNIVERSAL << 6;
    function base64Url(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function signatureAsBuffer(signature) {
      if (Buffer2.isBuffer(signature))
        return signature;
      if (typeof signature == "string")
        return Buffer2.from(signature, "base64");
      throw new TypeError("ECDSA signature must be a Base64 string or a Buffer");
    }
    function derToJose(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg), maxEncodedParamLength = paramBytes + 1, inputLength = signature.length, offset = 0;
      if (signature[offset++] !== ENCODED_TAG_SEQ)
        throw new Error('Could not find expected "seq"');
      var seqLength = signature[offset++];
      if (seqLength === (MAX_OCTET | 1) && (seqLength = signature[offset++]), inputLength - offset < seqLength)
        throw new Error('"seq" specified length of "' + seqLength + '", only "' + (inputLength - offset) + '" remaining');
      if (signature[offset++] !== ENCODED_TAG_INT)
        throw new Error('Could not find expected "int" for "r"');
      var rLength = signature[offset++];
      if (inputLength - offset - 2 < rLength)
        throw new Error('"r" specified length of "' + rLength + '", only "' + (inputLength - offset - 2) + '" available');
      if (maxEncodedParamLength < rLength)
        throw new Error('"r" specified length of "' + rLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      var rOffset = offset;
      if (offset += rLength, signature[offset++] !== ENCODED_TAG_INT)
        throw new Error('Could not find expected "int" for "s"');
      var sLength = signature[offset++];
      if (inputLength - offset !== sLength)
        throw new Error('"s" specified length of "' + sLength + '", expected "' + (inputLength - offset) + '"');
      if (maxEncodedParamLength < sLength)
        throw new Error('"s" specified length of "' + sLength + '", max of "' + maxEncodedParamLength + '" is acceptable');
      var sOffset = offset;
      if (offset += sLength, offset !== inputLength)
        throw new Error('Expected to consume entire buffer, but "' + (inputLength - offset) + '" bytes remain');
      var rPadding = paramBytes - rLength, sPadding = paramBytes - sLength, dst = Buffer2.allocUnsafe(rPadding + rLength + sPadding + sLength);
      for (offset = 0; offset < rPadding; ++offset)
        dst[offset] = 0;
      signature.copy(dst, offset, rOffset + Math.max(-rPadding, 0), rOffset + rLength), offset = paramBytes;
      for (var o = offset; offset < o + sPadding; ++offset)
        dst[offset] = 0;
      return signature.copy(dst, offset, sOffset + Math.max(-sPadding, 0), sOffset + sLength), dst = dst.toString("base64"), dst = base64Url(dst), dst;
    }
    function countPadding(buf, start, stop2) {
      for (var padding = 0; start + padding < stop2 && buf[start + padding] === 0; )
        ++padding;
      var needsSign = buf[start + padding] >= MAX_OCTET;
      return needsSign && --padding, padding;
    }
    function joseToDer(signature, alg) {
      signature = signatureAsBuffer(signature);
      var paramBytes = getParamBytesForAlg(alg), signatureBytes = signature.length;
      if (signatureBytes !== paramBytes * 2)
        throw new TypeError('"' + alg + '" signatures must be "' + paramBytes * 2 + '" bytes, saw "' + signatureBytes + '"');
      var rPadding = countPadding(signature, 0, paramBytes), sPadding = countPadding(signature, paramBytes, signature.length), rLength = paramBytes - rPadding, sLength = paramBytes - sPadding, rsBytes = 2 + rLength + 1 + 1 + sLength, shortLength = rsBytes < MAX_OCTET, dst = Buffer2.allocUnsafe((shortLength ? 2 : 3) + rsBytes), offset = 0;
      return dst[offset++] = ENCODED_TAG_SEQ, shortLength ? dst[offset++] = rsBytes : (dst[offset++] = MAX_OCTET | 1, dst[offset++] = rsBytes & 255), dst[offset++] = ENCODED_TAG_INT, dst[offset++] = rLength, rPadding < 0 ? (dst[offset++] = 0, offset += signature.copy(dst, offset, 0, paramBytes)) : offset += signature.copy(dst, offset, rPadding, paramBytes), dst[offset++] = ENCODED_TAG_INT, dst[offset++] = sLength, sPadding < 0 ? (dst[offset++] = 0, signature.copy(dst, offset, paramBytes)) : signature.copy(dst, offset, paramBytes + sPadding), dst;
    }
    module2.exports = {
      derToJose,
      joseToDer
    };
  }
});

// node_modules/buffer-equal-constant-time/index.js
var require_buffer_equal_constant_time = __commonJS({
  "node_modules/buffer-equal-constant-time/index.js"(exports2, module2) {
    "use strict";
    var Buffer2 = require("buffer").Buffer, SlowBuffer = require("buffer").SlowBuffer;
    module2.exports = bufferEq;
    function bufferEq(a, b) {
      if (!Buffer2.isBuffer(a) || !Buffer2.isBuffer(b) || a.length !== b.length)
        return !1;
      for (var c = 0, i = 0; i < a.length; i++)
        c |= a[i] ^ b[i];
      return c === 0;
    }
    bufferEq.install = function() {
      Buffer2.prototype.equal = SlowBuffer.prototype.equal = function(that) {
        return bufferEq(this, that);
      };
    };
    var origBufEqual = Buffer2.prototype.equal, origSlowBufEqual = SlowBuffer.prototype.equal;
    bufferEq.restore = function() {
      Buffer2.prototype.equal = origBufEqual, SlowBuffer.prototype.equal = origSlowBufEqual;
    };
  }
});

// node_modules/jwa/index.js
var require_jwa = __commonJS({
  "node_modules/jwa/index.js"(exports2, module2) {
    var Buffer2 = require_safe_buffer().Buffer, crypto2 = require("crypto"), formatEcdsa = require_ecdsa_sig_formatter(), util = require("util"), MSG_INVALID_ALGORITHM = `"%s" is not a valid algorithm.
  Supported algorithms are:
  "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" and "none".`, MSG_INVALID_SECRET = "secret must be a string or buffer", MSG_INVALID_VERIFIER_KEY = "key must be a string or a buffer", MSG_INVALID_SIGNER_KEY = "key must be a string, a buffer or an object", supportsKeyObjects = typeof crypto2.createPublicKey == "function";
    supportsKeyObjects && (MSG_INVALID_VERIFIER_KEY += " or a KeyObject", MSG_INVALID_SECRET += "or a KeyObject");
    function checkIsPublicKey(key) {
      if (!Buffer2.isBuffer(key) && typeof key != "string" && (!supportsKeyObjects || typeof key != "object" || typeof key.type != "string" || typeof key.asymmetricKeyType != "string" || typeof key.export != "function"))
        throw typeError(MSG_INVALID_VERIFIER_KEY);
    }
    function checkIsPrivateKey(key) {
      if (!Buffer2.isBuffer(key) && typeof key != "string" && typeof key != "object")
        throw typeError(MSG_INVALID_SIGNER_KEY);
    }
    function checkIsSecretKey(key) {
      if (!Buffer2.isBuffer(key)) {
        if (typeof key == "string")
          return key;
        if (!supportsKeyObjects || typeof key != "object" || key.type !== "secret" || typeof key.export != "function")
          throw typeError(MSG_INVALID_SECRET);
      }
    }
    function fromBase64(base64) {
      return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function toBase64(base64url) {
      base64url = base64url.toString();
      var padding = 4 - base64url.length % 4;
      if (padding !== 4)
        for (var i = 0; i < padding; ++i)
          base64url += "=";
      return base64url.replace(/\-/g, "+").replace(/_/g, "/");
    }
    function typeError(template) {
      var args = [].slice.call(arguments, 1), errMsg = util.format.bind(util, template).apply(null, args);
      return new TypeError(errMsg);
    }
    function bufferOrString(obj) {
      return Buffer2.isBuffer(obj) || typeof obj == "string";
    }
    function normalizeInput(thing) {
      return bufferOrString(thing) || (thing = JSON.stringify(thing)), thing;
    }
    function createHmacSigner(bits) {
      return function(thing, secret) {
        checkIsSecretKey(secret), thing = normalizeInput(thing);
        var hmac = crypto2.createHmac("sha" + bits, secret), sig = (hmac.update(thing), hmac.digest("base64"));
        return fromBase64(sig);
      };
    }
    var bufferEqual, timingSafeEqual = "timingSafeEqual" in crypto2 ? function(a, b) {
      return a.byteLength !== b.byteLength ? !1 : crypto2.timingSafeEqual(a, b);
    } : function(a, b) {
      return bufferEqual || (bufferEqual = require_buffer_equal_constant_time()), bufferEqual(a, b);
    };
    function createHmacVerifier(bits) {
      return function(thing, signature, secret) {
        var computedSig = createHmacSigner(bits)(thing, secret);
        return timingSafeEqual(Buffer2.from(signature), Buffer2.from(computedSig));
      };
    }
    function createKeySigner(bits) {
      return function(thing, privateKey) {
        checkIsPrivateKey(privateKey), thing = normalizeInput(thing);
        var signer = crypto2.createSign("RSA-SHA" + bits), sig = (signer.update(thing), signer.sign(privateKey, "base64"));
        return fromBase64(sig);
      };
    }
    function createKeyVerifier(bits) {
      return function(thing, signature, publicKey) {
        checkIsPublicKey(publicKey), thing = normalizeInput(thing), signature = toBase64(signature);
        var verifier = crypto2.createVerify("RSA-SHA" + bits);
        return verifier.update(thing), verifier.verify(publicKey, signature, "base64");
      };
    }
    function createPSSKeySigner(bits) {
      return function(thing, privateKey) {
        checkIsPrivateKey(privateKey), thing = normalizeInput(thing);
        var signer = crypto2.createSign("RSA-SHA" + bits), sig = (signer.update(thing), signer.sign({
          key: privateKey,
          padding: crypto2.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto2.constants.RSA_PSS_SALTLEN_DIGEST
        }, "base64"));
        return fromBase64(sig);
      };
    }
    function createPSSKeyVerifier(bits) {
      return function(thing, signature, publicKey) {
        checkIsPublicKey(publicKey), thing = normalizeInput(thing), signature = toBase64(signature);
        var verifier = crypto2.createVerify("RSA-SHA" + bits);
        return verifier.update(thing), verifier.verify({
          key: publicKey,
          padding: crypto2.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto2.constants.RSA_PSS_SALTLEN_DIGEST
        }, signature, "base64");
      };
    }
    function createECDSASigner(bits) {
      var inner = createKeySigner(bits);
      return function() {
        var signature = inner.apply(null, arguments);
        return signature = formatEcdsa.derToJose(signature, "ES" + bits), signature;
      };
    }
    function createECDSAVerifer(bits) {
      var inner = createKeyVerifier(bits);
      return function(thing, signature, publicKey) {
        signature = formatEcdsa.joseToDer(signature, "ES" + bits).toString("base64");
        var result = inner(thing, signature, publicKey);
        return result;
      };
    }
    function createNoneSigner() {
      return function() {
        return "";
      };
    }
    function createNoneVerifier() {
      return function(thing, signature) {
        return signature === "";
      };
    }
    module2.exports = function(algorithm) {
      var signerFactories = {
        hs: createHmacSigner,
        rs: createKeySigner,
        ps: createPSSKeySigner,
        es: createECDSASigner,
        none: createNoneSigner
      }, verifierFactories = {
        hs: createHmacVerifier,
        rs: createKeyVerifier,
        ps: createPSSKeyVerifier,
        es: createECDSAVerifer,
        none: createNoneVerifier
      }, match = algorithm.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/);
      if (!match)
        throw typeError(MSG_INVALID_ALGORITHM, algorithm);
      var algo = (match[1] || match[3]).toLowerCase(), bits = match[2];
      return {
        sign: signerFactories[algo](bits),
        verify: verifierFactories[algo](bits)
      };
    };
  }
});

// node_modules/jws/lib/tostring.js
var require_tostring = __commonJS({
  "node_modules/jws/lib/tostring.js"(exports2, module2) {
    var Buffer2 = require("buffer").Buffer;
    module2.exports = function(obj) {
      return typeof obj == "string" ? obj : typeof obj == "number" || Buffer2.isBuffer(obj) ? obj.toString() : JSON.stringify(obj);
    };
  }
});

// node_modules/jws/lib/sign-stream.js
var require_sign_stream = __commonJS({
  "node_modules/jws/lib/sign-stream.js"(exports2, module2) {
    var Buffer2 = require_safe_buffer().Buffer, DataStream = require_data_stream2(), jwa = require_jwa(), Stream = require("stream"), toString = require_tostring(), util = require("util");
    function base64url(string, encoding) {
      return Buffer2.from(string, encoding).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    }
    function jwsSecuredInput(header, payload, encoding) {
      encoding = encoding || "utf8";
      var encodedHeader = base64url(toString(header), "binary"), encodedPayload = base64url(toString(payload), encoding);
      return util.format("%s.%s", encodedHeader, encodedPayload);
    }
    function jwsSign(opts) {
      var header = opts.header, payload = opts.payload, secretOrKey = opts.secret || opts.privateKey, encoding = opts.encoding, algo = jwa(header.alg), securedInput = jwsSecuredInput(header, payload, encoding), signature = algo.sign(securedInput, secretOrKey);
      return util.format("%s.%s", securedInput, signature);
    }
    function SignStream(opts) {
      var secret = opts.secret;
      if (secret = secret ?? opts.privateKey, secret = secret ?? opts.key, /^hs/i.test(opts.header.alg) === !0 && secret == null)
        throw new TypeError("secret must be a string or buffer or a KeyObject");
      var secretStream = new DataStream(secret);
      this.readable = !0, this.header = opts.header, this.encoding = opts.encoding, this.secret = this.privateKey = this.key = secretStream, this.payload = new DataStream(opts.payload), this.secret.once("close", function() {
        !this.payload.writable && this.readable && this.sign();
      }.bind(this)), this.payload.once("close", function() {
        !this.secret.writable && this.readable && this.sign();
      }.bind(this));
    }
    util.inherits(SignStream, Stream);
    SignStream.prototype.sign = function() {
      try {
        var signature = jwsSign({
          header: this.header,
          payload: this.payload.buffer,
          secret: this.secret.buffer,
          encoding: this.encoding
        });
        return this.emit("done", signature), this.emit("data", signature), this.emit("end"), this.readable = !1, signature;
      } catch (e) {
        this.readable = !1, this.emit("error", e), this.emit("close");
      }
    };
    SignStream.sign = jwsSign;
    module2.exports = SignStream;
  }
});

// node_modules/jws/lib/verify-stream.js
var require_verify_stream = __commonJS({
  "node_modules/jws/lib/verify-stream.js"(exports2, module2) {
    var Buffer2 = require_safe_buffer().Buffer, DataStream = require_data_stream2(), jwa = require_jwa(), Stream = require("stream"), toString = require_tostring(), util = require("util"), JWS_REGEX = /^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;
    function isObject(thing) {
      return Object.prototype.toString.call(thing) === "[object Object]";
    }
    function safeJsonParse(thing) {
      if (isObject(thing))
        return thing;
      try {
        return JSON.parse(thing);
      } catch {
        return;
      }
    }
    function headerFromJWS(jwsSig) {
      var encodedHeader = jwsSig.split(".", 1)[0];
      return safeJsonParse(Buffer2.from(encodedHeader, "base64").toString("binary"));
    }
    function securedInputFromJWS(jwsSig) {
      return jwsSig.split(".", 2).join(".");
    }
    function signatureFromJWS(jwsSig) {
      return jwsSig.split(".")[2];
    }
    function payloadFromJWS(jwsSig, encoding) {
      encoding = encoding || "utf8";
      var payload = jwsSig.split(".")[1];
      return Buffer2.from(payload, "base64").toString(encoding);
    }
    function isValidJws(string) {
      return JWS_REGEX.test(string) && !!headerFromJWS(string);
    }
    function jwsVerify(jwsSig, algorithm, secretOrKey) {
      if (!algorithm) {
        var err = new Error("Missing algorithm parameter for jws.verify");
        throw err.code = "MISSING_ALGORITHM", err;
      }
      jwsSig = toString(jwsSig);
      var signature = signatureFromJWS(jwsSig), securedInput = securedInputFromJWS(jwsSig), algo = jwa(algorithm);
      return algo.verify(securedInput, signature, secretOrKey);
    }
    function jwsDecode(jwsSig, opts) {
      if (opts = opts || {}, jwsSig = toString(jwsSig), !isValidJws(jwsSig))
        return null;
      var header = headerFromJWS(jwsSig);
      if (!header)
        return null;
      var payload = payloadFromJWS(jwsSig);
      return (header.typ === "JWT" || opts.json) && (payload = JSON.parse(payload, opts.encoding)), {
        header,
        payload,
        signature: signatureFromJWS(jwsSig)
      };
    }
    function VerifyStream(opts) {
      opts = opts || {};
      var secretOrKey = opts.secret;
      if (secretOrKey = secretOrKey ?? opts.publicKey, secretOrKey = secretOrKey ?? opts.key, /^hs/i.test(opts.algorithm) === !0 && secretOrKey == null)
        throw new TypeError("secret must be a string or buffer or a KeyObject");
      var secretStream = new DataStream(secretOrKey);
      this.readable = !0, this.algorithm = opts.algorithm, this.encoding = opts.encoding, this.secret = this.publicKey = this.key = secretStream, this.signature = new DataStream(opts.signature), this.secret.once("close", function() {
        !this.signature.writable && this.readable && this.verify();
      }.bind(this)), this.signature.once("close", function() {
        !this.secret.writable && this.readable && this.verify();
      }.bind(this));
    }
    util.inherits(VerifyStream, Stream);
    VerifyStream.prototype.verify = function() {
      try {
        var valid = jwsVerify(this.signature.buffer, this.algorithm, this.key.buffer), obj = jwsDecode(this.signature.buffer, this.encoding);
        return this.emit("done", valid, obj), this.emit("data", valid), this.emit("end"), this.readable = !1, valid;
      } catch (e) {
        this.readable = !1, this.emit("error", e), this.emit("close");
      }
    };
    VerifyStream.decode = jwsDecode;
    VerifyStream.isValid = isValidJws;
    VerifyStream.verify = jwsVerify;
    module2.exports = VerifyStream;
  }
});

// node_modules/jws/index.js
var require_jws = __commonJS({
  "node_modules/jws/index.js"(exports2) {
    var SignStream = require_sign_stream(), VerifyStream = require_verify_stream(), ALGORITHMS = [
      "HS256",
      "HS384",
      "HS512",
      "RS256",
      "RS384",
      "RS512",
      "PS256",
      "PS384",
      "PS512",
      "ES256",
      "ES384",
      "ES512"
    ];
    exports2.ALGORITHMS = ALGORITHMS;
    exports2.sign = SignStream.sign;
    exports2.verify = VerifyStream.verify;
    exports2.decode = VerifyStream.decode;
    exports2.isValid = VerifyStream.isValid;
    exports2.createSign = function(opts) {
      return new SignStream(opts);
    };
    exports2.createVerify = function(opts) {
      return new VerifyStream(opts);
    };
  }
});

// node_modules/web-push/src/web-push-constants.js
var require_web_push_constants = __commonJS({
  "node_modules/web-push/src/web-push-constants.js"(exports2, module2) {
    "use strict";
    var WebPushConstants = {};
    WebPushConstants.supportedContentEncodings = {
      AES_GCM: "aesgcm",
      AES_128_GCM: "aes128gcm"
    };
    WebPushConstants.supportedUrgency = {
      VERY_LOW: "very-low",
      LOW: "low",
      NORMAL: "normal",
      HIGH: "high"
    };
    module2.exports = WebPushConstants;
  }
});

// node_modules/web-push/src/urlsafe-base64-helper.js
var require_urlsafe_base64_helper = __commonJS({
  "node_modules/web-push/src/urlsafe-base64-helper.js"(exports2, module2) {
    "use strict";
    function validate(base64) {
      return /^[A-Za-z0-9\-_]+$/.test(base64);
    }
    module2.exports = {
      validate
    };
  }
});

// node_modules/web-push/src/vapid-helper.js
var require_vapid_helper = __commonJS({
  "node_modules/web-push/src/vapid-helper.js"(exports2, module2) {
    "use strict";
    var crypto2 = require("crypto"), asn1 = require_asn1(), jws = require_jws(), { URL: URL2 } = require("url"), WebPushConstants = require_web_push_constants(), urlBase64Helper = require_urlsafe_base64_helper(), DEFAULT_EXPIRATION_SECONDS = 12 * 60 * 60, MAX_EXPIRATION_SECONDS = 24 * 60 * 60, ECPrivateKeyASN = asn1.define("ECPrivateKey", function() {
      this.seq().obj(
        this.key("version").int(),
        this.key("privateKey").octstr(),
        this.key("parameters").explicit(0).objid().optional(),
        this.key("publicKey").explicit(1).bitstr().optional()
      );
    });
    function toPEM(key) {
      return ECPrivateKeyASN.encode({
        version: 1,
        privateKey: key,
        parameters: [1, 2, 840, 10045, 3, 1, 7]
        // prime256v1
      }, "pem", {
        label: "EC PRIVATE KEY"
      });
    }
    function generateVAPIDKeys() {
      let curve = crypto2.createECDH("prime256v1");
      curve.generateKeys();
      let publicKeyBuffer = curve.getPublicKey(), privateKeyBuffer = curve.getPrivateKey();
      if (privateKeyBuffer.length < 32) {
        let padding = Buffer.alloc(32 - privateKeyBuffer.length);
        padding.fill(0), privateKeyBuffer = Buffer.concat([padding, privateKeyBuffer]);
      }
      if (publicKeyBuffer.length < 65) {
        let padding = Buffer.alloc(65 - publicKeyBuffer.length);
        padding.fill(0), publicKeyBuffer = Buffer.concat([padding, publicKeyBuffer]);
      }
      return {
        publicKey: publicKeyBuffer.toString("base64url"),
        privateKey: privateKeyBuffer.toString("base64url")
      };
    }
    function validateSubject(subject) {
      if (!subject)
        throw new Error("No subject set in vapidDetails.subject.");
      if (typeof subject != "string" || subject.length === 0)
        throw new Error("The subject value must be a string containing an https: URL or mailto: address. " + subject);
      let subjectParseResult = null;
      try {
        subjectParseResult = new URL2(subject);
      } catch {
        throw new Error("Vapid subject is not a valid URL. " + subject);
      }
      if (!["https:", "mailto:"].includes(subjectParseResult.protocol))
        throw new Error("Vapid subject is not an https: or mailto: URL. " + subject);
      subjectParseResult.hostname === "localhost" && console.warn("Vapid subject points to a localhost web URI, which is unsupported by Apple's push notification server and will result in a BadJwtToken error when sending notifications.");
    }
    function validatePublicKey(publicKey) {
      if (!publicKey)
        throw new Error("No key set vapidDetails.publicKey");
      if (typeof publicKey != "string")
        throw new Error("Vapid public key is must be a URL safe Base 64 encoded string.");
      if (!urlBase64Helper.validate(publicKey))
        throw new Error('Vapid public key must be a URL safe Base 64 (without "=")');
      if (publicKey = Buffer.from(publicKey, "base64url"), publicKey.length !== 65)
        throw new Error("Vapid public key should be 65 bytes long when decoded.");
    }
    function validatePrivateKey(privateKey) {
      if (!privateKey)
        throw new Error("No key set in vapidDetails.privateKey");
      if (typeof privateKey != "string")
        throw new Error("Vapid private key must be a URL safe Base 64 encoded string.");
      if (!urlBase64Helper.validate(privateKey))
        throw new Error('Vapid private key must be a URL safe Base 64 (without "=")');
      if (privateKey = Buffer.from(privateKey, "base64url"), privateKey.length !== 32)
        throw new Error("Vapid private key should be 32 bytes long when decoded.");
    }
    function getFutureExpirationTimestamp(numSeconds) {
      let futureExp = /* @__PURE__ */ new Date();
      return futureExp.setSeconds(futureExp.getSeconds() + numSeconds), Math.floor(futureExp.getTime() / 1e3);
    }
    function validateExpiration(expiration) {
      if (!Number.isInteger(expiration))
        throw new Error("`expiration` value must be a number");
      if (expiration < 0)
        throw new Error("`expiration` must be a positive integer");
      let maxExpirationTimestamp = getFutureExpirationTimestamp(MAX_EXPIRATION_SECONDS);
      if (expiration >= maxExpirationTimestamp)
        throw new Error("`expiration` value is greater than maximum of 24 hours");
    }
    function getVapidHeaders(audience, subject, publicKey, privateKey, contentEncoding, expiration) {
      if (!audience)
        throw new Error("No audience could be generated for VAPID.");
      if (typeof audience != "string" || audience.length === 0)
        throw new Error("The audience value must be a string containing the origin of a push service. " + audience);
      try {
        new URL2(audience);
      } catch {
        throw new Error("VAPID audience is not a url. " + audience);
      }
      validateSubject(subject), validatePublicKey(publicKey), validatePrivateKey(privateKey), privateKey = Buffer.from(privateKey, "base64url"), expiration ? validateExpiration(expiration) : expiration = getFutureExpirationTimestamp(DEFAULT_EXPIRATION_SECONDS);
      let header = {
        typ: "JWT",
        alg: "ES256"
      }, jwtPayload = {
        aud: audience,
        exp: expiration,
        sub: subject
      }, jwt = jws.sign({
        header,
        payload: jwtPayload,
        privateKey: toPEM(privateKey)
      });
      if (contentEncoding === WebPushConstants.supportedContentEncodings.AES_128_GCM)
        return {
          Authorization: "vapid t=" + jwt + ", k=" + publicKey
        };
      if (contentEncoding === WebPushConstants.supportedContentEncodings.AES_GCM)
        return {
          Authorization: "WebPush " + jwt,
          "Crypto-Key": "p256ecdsa=" + publicKey
        };
      throw new Error("Unsupported encoding type specified.");
    }
    module2.exports = {
      generateVAPIDKeys,
      getFutureExpirationTimestamp,
      getVapidHeaders,
      validateSubject,
      validatePublicKey,
      validatePrivateKey,
      validateExpiration
    };
  }
});

// node_modules/http_ece/ece.js
var require_ece = __commonJS({
  "node_modules/http_ece/ece.js"(exports2, module2) {
    "use strict";
    var crypto2 = require("crypto"), AES_GCM = "aes-128-gcm", PAD_SIZE = { aes128gcm: 1, aesgcm: 2 }, TAG_LENGTH = 16, KEY_LENGTH = 16, NONCE_LENGTH = 12, SHA_256_LENGTH = 32, MODE_ENCRYPT = "encrypt", MODE_DECRYPT = "decrypt", keylog;
    process.env.ECE_KEYLOG === "1" ? keylog = function(m, k) {
      return console.warn(m + " [" + k.length + "]: " + k.toString("base64url")), k;
    } : keylog = function(m, k) {
      return k;
    };
    function decode(b) {
      return typeof b == "string" ? Buffer.from(b, "base64url") : b;
    }
    function HMAC_hash(key, input) {
      var hmac = crypto2.createHmac("sha256", key);
      return hmac.update(input), hmac.digest();
    }
    function HKDF_extract(salt, ikm) {
      return keylog("salt", salt), keylog("ikm", ikm), keylog("extract", HMAC_hash(salt, ikm));
    }
    function HKDF_expand(prk, info2, l) {
      keylog("prk", prk), keylog("info", info2);
      var output = Buffer.alloc(0), T = Buffer.alloc(0);
      info2 = Buffer.from(info2, "ascii");
      for (var counter = 0, cbuf = Buffer.alloc(1); output.length < l; )
        cbuf.writeUIntBE(++counter, 0, 1), T = HMAC_hash(prk, Buffer.concat([T, info2, cbuf])), output = Buffer.concat([output, T]);
      return keylog("expand", output.slice(0, l));
    }
    function HKDF(salt, ikm, info2, len) {
      return HKDF_expand(HKDF_extract(salt, ikm), info2, len);
    }
    function info(base, context) {
      var result = Buffer.concat([
        Buffer.from("Content-Encoding: " + base + "\0", "ascii"),
        context
      ]);
      return keylog("info " + base, result), result;
    }
    function lengthPrefix(buffer) {
      var b = Buffer.concat([Buffer.alloc(2), buffer]);
      return b.writeUIntBE(buffer.length, 0, 2), b;
    }
    function extractDH(header, mode) {
      var key = header.privateKey, senderPubKey, receiverPubKey;
      if (mode === MODE_ENCRYPT)
        senderPubKey = key.getPublicKey(), receiverPubKey = header.dh;
      else if (mode === MODE_DECRYPT)
        senderPubKey = header.dh, receiverPubKey = key.getPublicKey();
      else
        throw new Error("Unknown mode only " + MODE_ENCRYPT + " and " + MODE_DECRYPT + " supported");
      return {
        secret: key.computeSecret(header.dh),
        context: Buffer.concat([
          Buffer.from(header.keylabel, "ascii"),
          Buffer.from([0]),
          lengthPrefix(receiverPubKey),
          // user agent
          lengthPrefix(senderPubKey)
          // application server
        ])
      };
    }
    function extractSecretAndContext(header, mode) {
      var result = { secret: null, context: Buffer.alloc(0) };
      if (header.key) {
        if (result.secret = header.key, result.secret.length !== KEY_LENGTH)
          throw new Error("An explicit key must be " + KEY_LENGTH + " bytes");
      } else header.dh ? result = extractDH(header, mode) : typeof header.keyid !== void 0 && (result.secret = header.keymap[header.keyid]);
      if (!result.secret)
        throw new Error("Unable to determine key");
      return keylog("secret", result.secret), keylog("context", result.context), header.authSecret && (result.secret = HKDF(
        header.authSecret,
        result.secret,
        info("auth", Buffer.alloc(0)),
        SHA_256_LENGTH
      ), keylog("authsecret", result.secret)), result;
    }
    function webpushSecret(header, mode) {
      if (!header.authSecret)
        throw new Error("No authentication secret for webpush");
      keylog("authsecret", header.authSecret);
      var remotePubKey, senderPubKey, receiverPubKey;
      if (mode === MODE_ENCRYPT)
        senderPubKey = header.privateKey.getPublicKey(), remotePubKey = receiverPubKey = header.dh;
      else if (mode === MODE_DECRYPT)
        remotePubKey = senderPubKey = header.keyid, receiverPubKey = header.privateKey.getPublicKey();
      else
        throw new Error("Unknown mode only " + MODE_ENCRYPT + " and " + MODE_DECRYPT + " supported");
      return keylog("remote pubkey", remotePubKey), keylog("sender pubkey", senderPubKey), keylog("receiver pubkey", receiverPubKey), keylog(
        "secret dh",
        HKDF(
          header.authSecret,
          header.privateKey.computeSecret(remotePubKey),
          Buffer.concat([
            Buffer.from("WebPush: info\0"),
            receiverPubKey,
            senderPubKey
          ]),
          SHA_256_LENGTH
        )
      );
    }
    function extractSecret(header, mode, keyLookupCallback) {
      if (keyLookupCallback && !isFunction(keyLookupCallback))
        throw new Error("Callback is not a function");
      if (header.key) {
        if (header.key.length !== KEY_LENGTH)
          throw new Error("An explicit key must be " + KEY_LENGTH + " bytes");
        return keylog("secret key", header.key);
      }
      if (!header.privateKey) {
        if (keyLookupCallback)
          var key = keyLookupCallback(header.keyid);
        else
          var key = header.keymap && header.keymap[header.keyid];
        if (!key)
          throw new Error('No saved key (keyid: "' + header.keyid + '")');
        return key;
      }
      return webpushSecret(header, mode);
    }
    function deriveKeyAndNonce(header, mode, lookupKeyCallback) {
      if (!header.salt)
        throw new Error("must include a salt parameter for " + header.version);
      var keyInfo, nonceInfo, secret;
      if (header.version === "aesgcm") {
        var s = extractSecretAndContext(header, mode, lookupKeyCallback);
        keyInfo = info("aesgcm", s.context), nonceInfo = info("nonce", s.context), secret = s.secret;
      } else if (header.version === "aes128gcm")
        keyInfo = Buffer.from("Content-Encoding: aes128gcm\0"), nonceInfo = Buffer.from("Content-Encoding: nonce\0"), secret = extractSecret(header, mode, lookupKeyCallback);
      else
        throw new Error("Unable to set context for mode " + header.version);
      var prk = HKDF_extract(header.salt, secret), result = {
        key: HKDF_expand(prk, keyInfo, KEY_LENGTH),
        nonce: HKDF_expand(prk, nonceInfo, NONCE_LENGTH)
      };
      return keylog("key", result.key), keylog("nonce base", result.nonce), result;
    }
    function parseParams(params) {
      var header = {};
      header.version = params.version || "aes128gcm", header.rs = parseInt(params.rs, 10), isNaN(header.rs) && (header.rs = 4096);
      var overhead = PAD_SIZE[header.version];
      if (header.version === "aes128gcm" && (overhead += TAG_LENGTH), header.rs <= overhead)
        throw new Error("The rs parameter has to be greater than " + overhead);
      if (params.salt && (header.salt = decode(params.salt), header.salt.length !== KEY_LENGTH))
        throw new Error("The salt parameter must be " + KEY_LENGTH + " bytes");
      return header.keyid = params.keyid, params.key ? header.key = decode(params.key) : (header.privateKey = params.privateKey, header.privateKey || (header.keymap = params.keymap), header.version !== "aes128gcm" && (header.keylabel = params.keylabel || "P-256"), params.dh && (header.dh = decode(params.dh))), params.authSecret && (header.authSecret = decode(params.authSecret)), header;
    }
    function generateNonce(base, counter) {
      var nonce = Buffer.from(base), m = nonce.readUIntBE(nonce.length - 6, 6), x = ((m ^ counter) & 16777215) + ((m / 16777216 ^ counter / 16777216) & 16777215) * 16777216;
      return nonce.writeUIntBE(x, nonce.length - 6, 6), keylog("nonce" + counter, nonce), nonce;
    }
    function readHeader(buffer, header) {
      var idsz = buffer.readUIntBE(20, 1);
      return header.salt = buffer.slice(0, KEY_LENGTH), header.rs = buffer.readUIntBE(KEY_LENGTH, 4), header.keyid = buffer.slice(21, 21 + idsz), 21 + idsz;
    }
    function unpadLegacy(data, version) {
      var padSize = PAD_SIZE[version], pad = data.readUIntBE(0, padSize);
      if (pad + padSize > data.length)
        throw new Error("padding exceeds block size");
      keylog("padding", data.slice(0, padSize + pad));
      var padCheck = Buffer.alloc(pad);
      if (padCheck.fill(0), padCheck.compare(data.slice(padSize, padSize + pad)) !== 0)
        throw new Error("invalid padding");
      return data.slice(padSize + pad);
    }
    function unpad(data, last) {
      for (var i = data.length - 1; i >= 0; ) {
        if (data[i]) {
          if (last) {
            if (data[i] !== 2)
              throw new Error("last record needs to start padding with a 2");
          } else if (data[i] !== 1)
            throw new Error("last record needs to start padding with a 2");
          return data.slice(0, i);
        }
        --i;
      }
      throw new Error("all zero plaintext");
    }
    function decryptRecord(key, counter, buffer, header, last) {
      keylog("decrypt", buffer);
      var nonce = generateNonce(key.nonce, counter), gcm = crypto2.createDecipheriv(AES_GCM, key.key, nonce);
      gcm.setAuthTag(buffer.slice(buffer.length - TAG_LENGTH));
      var data = gcm.update(buffer.slice(0, buffer.length - TAG_LENGTH));
      return data = Buffer.concat([data, gcm.final()]), keylog("decrypted", data), header.version !== "aes128gcm" ? unpadLegacy(data, header.version) : unpad(data, last);
    }
    function decrypt(buffer, params, keyLookupCallback) {
      var header = parseParams(params);
      if (header.version === "aes128gcm") {
        var headerLength = readHeader(buffer, header);
        buffer = buffer.slice(headerLength);
      }
      var key = deriveKeyAndNonce(header, MODE_DECRYPT, keyLookupCallback), start = 0, result = Buffer.alloc(0), chunkSize = header.rs;
      header.version !== "aes128gcm" && (chunkSize += TAG_LENGTH);
      for (var i = 0; start < buffer.length; ++i) {
        var end = start + chunkSize;
        if (header.version !== "aes128gcm" && end === buffer.length)
          throw new Error("Truncated payload");
        if (end = Math.min(end, buffer.length), end - start <= TAG_LENGTH)
          throw new Error("Invalid block: too small at " + i);
        var block = decryptRecord(
          key,
          i,
          buffer.slice(start, end),
          header,
          end >= buffer.length
        );
        result = Buffer.concat([result, block]), start = end;
      }
      return result;
    }
    function encryptRecord(key, counter, buffer, pad, header, last) {
      keylog("encrypt", buffer), pad = pad || 0;
      var nonce = generateNonce(key.nonce, counter), gcm = crypto2.createCipheriv(AES_GCM, key.key, nonce), ciphertext = [], padSize = PAD_SIZE[header.version], padding = Buffer.alloc(pad + padSize);
      if (padding.fill(0), header.version !== "aes128gcm") {
        if (padding.writeUIntBE(pad, 0, padSize), keylog("padding", padding), ciphertext.push(gcm.update(padding)), ciphertext.push(gcm.update(buffer)), !last && padding.length + buffer.length < header.rs)
          throw new Error("Unable to pad to record size");
      } else
        ciphertext.push(gcm.update(buffer)), padding.writeUIntBE(last ? 2 : 1, 0, 1), keylog("padding", padding), ciphertext.push(gcm.update(padding));
      gcm.final();
      var tag = gcm.getAuthTag();
      if (tag.length !== TAG_LENGTH)
        throw new Error("invalid tag generated");
      return ciphertext.push(tag), keylog("encrypted", Buffer.concat(ciphertext));
    }
    function writeHeader(header) {
      var ints = Buffer.alloc(5), keyid = Buffer.from(header.keyid || []);
      if (keyid.length > 255)
        throw new Error("keyid is too large");
      return ints.writeUIntBE(header.rs, 0, 4), ints.writeUIntBE(keyid.length, 4, 1), Buffer.concat([header.salt, ints, keyid]);
    }
    function encrypt(buffer, params, keyLookupCallback) {
      if (!Buffer.isBuffer(buffer))
        throw new Error("buffer argument must be a Buffer");
      var header = parseParams(params);
      header.salt || (header.salt = crypto2.randomBytes(KEY_LENGTH));
      var result;
      header.version === "aes128gcm" ? (header.privateKey && !header.keyid && (header.keyid = header.privateKey.getPublicKey()), result = writeHeader(header)) : result = Buffer.alloc(0);
      var key = deriveKeyAndNonce(header, MODE_ENCRYPT, keyLookupCallback), start = 0, padSize = PAD_SIZE[header.version], overhead = padSize;
      header.version === "aes128gcm" && (overhead += TAG_LENGTH);
      for (var pad = isNaN(parseInt(params.pad, 10)) ? 0 : parseInt(params.pad, 10), counter = 0, last = !1; !last; ) {
        var recordPad = Math.min(header.rs - overhead - 1, pad);
        header.version !== "aes128gcm" && (recordPad = Math.min((1 << padSize * 8) - 1, recordPad)), pad > 0 && recordPad === 0 && ++recordPad, pad -= recordPad;
        var end = start + header.rs - overhead - recordPad;
        header.version !== "aes128gcm" ? last = end > buffer.length : last = end >= buffer.length, last = last && pad <= 0;
        var block = encryptRecord(
          key,
          counter,
          buffer.slice(start, end),
          recordPad,
          header,
          last
        );
        result = Buffer.concat([result, block]), start = end, ++counter;
      }
      return result;
    }
    function isFunction(object) {
      return typeof object == "function";
    }
    module2.exports = {
      decrypt,
      encrypt
    };
  }
});

// node_modules/web-push/src/encryption-helper.js
var require_encryption_helper = __commonJS({
  "node_modules/web-push/src/encryption-helper.js"(exports2, module2) {
    "use strict";
    var crypto2 = require("crypto"), ece = require_ece(), encrypt = function(userPublicKey, userAuth, payload, contentEncoding) {
      if (!userPublicKey)
        throw new Error("No user public key provided for encryption.");
      if (typeof userPublicKey != "string")
        throw new Error("The subscription p256dh value must be a string.");
      if (Buffer.from(userPublicKey, "base64url").length !== 65)
        throw new Error("The subscription p256dh value should be 65 bytes long.");
      if (!userAuth)
        throw new Error("No user auth provided for encryption.");
      if (typeof userAuth != "string")
        throw new Error("The subscription auth key must be a string.");
      if (Buffer.from(userAuth, "base64url").length < 16)
        throw new Error("The subscription auth key should be at least 16 bytes long");
      if (typeof payload != "string" && !Buffer.isBuffer(payload))
        throw new Error("Payload must be either a string or a Node Buffer.");
      (typeof payload == "string" || payload instanceof String) && (payload = Buffer.from(payload));
      let localCurve = crypto2.createECDH("prime256v1"), localPublicKey = localCurve.generateKeys(), salt = crypto2.randomBytes(16).toString("base64url"), cipherText = ece.encrypt(payload, {
        version: contentEncoding,
        dh: userPublicKey,
        privateKey: localCurve,
        salt,
        authSecret: userAuth
      });
      return {
        localPublicKey,
        salt,
        cipherText
      };
    };
    module2.exports = {
      encrypt
    };
  }
});

// node_modules/web-push/src/web-push-error.js
var require_web_push_error = __commonJS({
  "node_modules/web-push/src/web-push-error.js"(exports2, module2) {
    "use strict";
    function WebPushError(message, statusCode, headers, body, endpoint) {
      Error.captureStackTrace(this, this.constructor), this.name = this.constructor.name, this.message = message, this.statusCode = statusCode, this.headers = headers, this.body = body, this.endpoint = endpoint;
    }
    require("util").inherits(WebPushError, Error);
    module2.exports = WebPushError;
  }
});

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports2, module2) {
    var s = 1e3, m = s * 60, h = m * 60, d = h * 24, w = d * 7, y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0)
        return parse(val);
      if (type === "number" && isFinite(val))
        return options.long ? fmtLong(val) : fmtShort(val);
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      if (str = String(str), !(str.length > 100)) {
        var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
          str
        );
        if (match) {
          var n = parseFloat(match[1]), type = (match[2] || "ms").toLowerCase();
          switch (type) {
            case "years":
            case "year":
            case "yrs":
            case "yr":
            case "y":
              return n * y;
            case "weeks":
            case "week":
            case "w":
              return n * w;
            case "days":
            case "day":
            case "d":
              return n * d;
            case "hours":
            case "hour":
            case "hrs":
            case "hr":
            case "h":
              return n * h;
            case "minutes":
            case "minute":
            case "mins":
            case "min":
            case "m":
              return n * m;
            case "seconds":
            case "second":
            case "secs":
            case "sec":
            case "s":
              return n * s;
            case "milliseconds":
            case "millisecond":
            case "msecs":
            case "msec":
            case "ms":
              return n;
            default:
              return;
          }
        }
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      return msAbs >= d ? Math.round(ms / d) + "d" : msAbs >= h ? Math.round(ms / h) + "h" : msAbs >= m ? Math.round(ms / m) + "m" : msAbs >= s ? Math.round(ms / s) + "s" : ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      return msAbs >= d ? plural(ms, msAbs, d, "day") : msAbs >= h ? plural(ms, msAbs, h, "hour") : msAbs >= m ? plural(ms, msAbs, m, "minute") : msAbs >= s ? plural(ms, msAbs, s, "second") : ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// node_modules/debug/src/common.js
var require_common = __commonJS({
  "node_modules/debug/src/common.js"(exports2, module2) {
    function setup(env) {
      createDebug.debug = createDebug, createDebug.default = createDebug, createDebug.coerce = coerce, createDebug.disable = disable, createDebug.enable = enable, createDebug.enabled = enabled, createDebug.humanize = require_ms(), createDebug.destroy = destroy, Object.keys(env).forEach((key) => {
        createDebug[key] = env[key];
      }), createDebug.names = [], createDebug.skips = [], createDebug.formatters = {};
      function selectColor(namespace) {
        let hash = 0;
        for (let i = 0; i < namespace.length; i++)
          hash = (hash << 5) - hash + namespace.charCodeAt(i), hash |= 0;
        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime, enableOverride = null, namespacesCache, enabledCache;
        function debug(...args) {
          if (!debug.enabled)
            return;
          let self2 = debug, curr = Number(/* @__PURE__ */ new Date()), ms = curr - (prevTime || curr);
          self2.diff = ms, self2.prev = prevTime, self2.curr = curr, prevTime = curr, args[0] = createDebug.coerce(args[0]), typeof args[0] != "string" && args.unshift("%O");
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%")
              return "%";
            index++;
            let formatter = createDebug.formatters[format];
            if (typeof formatter == "function") {
              let val = args[index];
              match = formatter.call(self2, val), args.splice(index, 1), index--;
            }
            return match;
          }), createDebug.formatArgs.call(self2, args), (self2.log || createDebug.log).apply(self2, args);
        }
        return debug.namespace = namespace, debug.useColors = createDebug.useColors(), debug.color = createDebug.selectColor(namespace), debug.extend = extend, debug.destroy = createDebug.destroy, Object.defineProperty(debug, "enabled", {
          enumerable: !0,
          configurable: !1,
          get: () => enableOverride !== null ? enableOverride : (namespacesCache !== createDebug.namespaces && (namespacesCache = createDebug.namespaces, enabledCache = createDebug.enabled(namespace)), enabledCache),
          set: (v) => {
            enableOverride = v;
          }
        }), typeof createDebug.init == "function" && createDebug.init(debug), debug;
      }
      function extend(namespace, delimiter) {
        let newDebug = createDebug(this.namespace + (typeof delimiter > "u" ? ":" : delimiter) + namespace);
        return newDebug.log = this.log, newDebug;
      }
      function enable(namespaces) {
        createDebug.save(namespaces), createDebug.namespaces = namespaces, createDebug.names = [], createDebug.skips = [];
        let split = (typeof namespaces == "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
        for (let ns of split)
          ns[0] === "-" ? createDebug.skips.push(ns.slice(1)) : createDebug.names.push(ns);
      }
      function matchesTemplate(search, template) {
        let searchIndex = 0, templateIndex = 0, starIndex = -1, matchIndex = 0;
        for (; searchIndex < search.length; )
          if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*"))
            template[templateIndex] === "*" ? (starIndex = templateIndex, matchIndex = searchIndex, templateIndex++) : (searchIndex++, templateIndex++);
          else if (starIndex !== -1)
            templateIndex = starIndex + 1, matchIndex++, searchIndex = matchIndex;
          else
            return !1;
        for (; templateIndex < template.length && template[templateIndex] === "*"; )
          templateIndex++;
        return templateIndex === template.length;
      }
      function disable() {
        let namespaces = [
          ...createDebug.names,
          ...createDebug.skips.map((namespace) => "-" + namespace)
        ].join(",");
        return createDebug.enable(""), namespaces;
      }
      function enabled(name) {
        for (let skip of createDebug.skips)
          if (matchesTemplate(name, skip))
            return !1;
        for (let ns of createDebug.names)
          if (matchesTemplate(name, ns))
            return !0;
        return !1;
      }
      function coerce(val) {
        return val instanceof Error ? val.stack || val.message : val;
      }
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      return createDebug.enable(createDebug.load()), createDebug;
    }
    module2.exports = setup;
  }
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/debug/src/browser.js"(exports2, module2) {
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.storage = localstorage();
    exports2.destroy = /* @__PURE__ */ (() => {
      let warned = !1;
      return () => {
        warned || (warned = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })();
    exports2.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let m;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      if (args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module2.exports.humanize(this.diff), !this.useColors)
        return;
      let c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0, lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        match !== "%%" && (index++, match === "%c" && (lastC = index));
      }), args.splice(lastC, 0, c);
    }
    exports2.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        namespaces ? exports2.storage.setItem("debug", namespaces) : exports2.storage.removeItem("debug");
      } catch {
      }
    }
    function load() {
      let r;
      try {
        r = exports2.storage.getItem("debug") || exports2.storage.getItem("DEBUG");
      } catch {
      }
      return !r && typeof process < "u" && "env" in process && (r = process.env.DEBUG), r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch {
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// node_modules/debug/src/node.js
var require_node2 = __commonJS({
  "node_modules/debug/src/node.js"(exports2, module2) {
    var tty = require("tty"), util = require("util");
    exports2.init = init;
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.destroy = util.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports2.colors = [6, 2, 3, 4, 5, 1];
    try {
      let supportsColor = require("supports-color");
      supportsColor && (supportsColor.stderr || supportsColor).level >= 2 && (exports2.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    exports2.inspectOpts = Object.keys(process.env).filter((key) => /^debug_/i.test(key)).reduce((obj, key) => {
      let prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => k.toUpperCase()), val = process.env[key];
      return /^(yes|on|true|enabled)$/i.test(val) ? val = !0 : /^(no|off|false|disabled)$/i.test(val) ? val = !1 : val === "null" ? val = null : val = Number(val), obj[prop] = val, obj;
    }, {});
    function useColors() {
      return "colors" in exports2.inspectOpts ? !!exports2.inspectOpts.colors : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      let { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        let c = this.color, colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c), prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split(`
`).join(`
` + prefix), args.push(colorCode + "m+" + module2.exports.humanize(this.diff) + "\x1B[0m");
      } else
        args[0] = getDate() + name + " " + args[0];
    }
    function getDate() {
      return exports2.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util.formatWithOptions(exports2.inspectOpts, ...args) + `
`);
    }
    function save(namespaces) {
      namespaces ? process.env.DEBUG = namespaces : delete process.env.DEBUG;
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug) {
      debug.inspectOpts = {};
      let keys = Object.keys(exports2.inspectOpts);
      for (let i = 0; i < keys.length; i++)
        debug.inspectOpts[keys[i]] = exports2.inspectOpts[keys[i]];
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.o = function(v) {
      return this.inspectOpts.colors = this.useColors, util.inspect(v, this.inspectOpts).split(`
`).map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      return this.inspectOpts.colors = this.useColors, util.inspect(v, this.inspectOpts);
    };
  }
});

// node_modules/debug/src/index.js
var require_src = __commonJS({
  "node_modules/debug/src/index.js"(exports2, module2) {
    typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? module2.exports = require_browser() : module2.exports = require_node2();
  }
});

// node_modules/agent-base/dist/helpers.js
var require_helpers = __commonJS({
  "node_modules/agent-base/dist/helpers.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      k2 === void 0 && (k2 = k);
      var desc = Object.getOwnPropertyDescriptor(m, k);
      (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) && (desc = { enumerable: !0, get: function() {
        return m[k];
      } }), Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      k2 === void 0 && (k2 = k), o[k2] = m[k];
    }), __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: !0, value: v });
    } : function(o, v) {
      o.default = v;
    }), __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) for (var k in mod) k !== "default" && Object.prototype.hasOwnProperty.call(mod, k) && __createBinding(result, mod, k);
      return __setModuleDefault(result, mod), result;
    };
    Object.defineProperty(exports2, "__esModule", { value: !0 });
    exports2.req = exports2.json = exports2.toBuffer = void 0;
    var http2 = __importStar(require("http")), https = __importStar(require("https"));
    async function toBuffer(stream) {
      let length = 0, chunks = [];
      for await (let chunk of stream)
        length += chunk.length, chunks.push(chunk);
      return Buffer.concat(chunks, length);
    }
    exports2.toBuffer = toBuffer;
    async function json(stream) {
      let str = (await toBuffer(stream)).toString("utf8");
      try {
        return JSON.parse(str);
      } catch (_err) {
        let err = _err;
        throw err.message += ` (input: ${str})`, err;
      }
    }
    exports2.json = json;
    function req(url, opts = {}) {
      let req2 = ((typeof url == "string" ? url : url.href).startsWith("https:") ? https : http2).request(url, opts), promise = new Promise((resolve, reject) => {
        req2.once("response", resolve).once("error", reject).end();
      });
      return req2.then = promise.then.bind(promise), req2;
    }
    exports2.req = req;
  }
});

// node_modules/agent-base/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/agent-base/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      k2 === void 0 && (k2 = k);
      var desc = Object.getOwnPropertyDescriptor(m, k);
      (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) && (desc = { enumerable: !0, get: function() {
        return m[k];
      } }), Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      k2 === void 0 && (k2 = k), o[k2] = m[k];
    }), __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: !0, value: v });
    } : function(o, v) {
      o.default = v;
    }), __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) for (var k in mod) k !== "default" && Object.prototype.hasOwnProperty.call(mod, k) && __createBinding(result, mod, k);
      return __setModuleDefault(result, mod), result;
    }, __exportStar = exports2 && exports2.__exportStar || function(m, exports3) {
      for (var p in m) p !== "default" && !Object.prototype.hasOwnProperty.call(exports3, p) && __createBinding(exports3, m, p);
    };
    Object.defineProperty(exports2, "__esModule", { value: !0 });
    exports2.Agent = void 0;
    var net = __importStar(require("net")), http2 = __importStar(require("http")), https_1 = require("https");
    __exportStar(require_helpers(), exports2);
    var INTERNAL = Symbol("AgentBaseInternalState"), Agent = class extends http2.Agent {
      constructor(opts) {
        super(opts), this[INTERNAL] = {};
      }
      /**
       * Determine whether this is an `http` or `https` request.
       */
      isSecureEndpoint(options) {
        if (options) {
          if (typeof options.secureEndpoint == "boolean")
            return options.secureEndpoint;
          if (typeof options.protocol == "string")
            return options.protocol === "https:";
        }
        let { stack } = new Error();
        return typeof stack != "string" ? !1 : stack.split(`
`).some((l) => l.indexOf("(https.js:") !== -1 || l.indexOf("node:https:") !== -1);
      }
      // In order to support async signatures in `connect()` and Node's native
      // connection pooling in `http.Agent`, the array of sockets for each origin
      // has to be updated synchronously. This is so the length of the array is
      // accurate when `addRequest()` is next called. We achieve this by creating a
      // fake socket and adding it to `sockets[origin]` and incrementing
      // `totalSocketCount`.
      incrementSockets(name) {
        if (this.maxSockets === 1 / 0 && this.maxTotalSockets === 1 / 0)
          return null;
        this.sockets[name] || (this.sockets[name] = []);
        let fakeSocket = new net.Socket({ writable: !1 });
        return this.sockets[name].push(fakeSocket), this.totalSocketCount++, fakeSocket;
      }
      decrementSockets(name, socket) {
        if (!this.sockets[name] || socket === null)
          return;
        let sockets = this.sockets[name], index = sockets.indexOf(socket);
        index !== -1 && (sockets.splice(index, 1), this.totalSocketCount--, sockets.length === 0 && delete this.sockets[name]);
      }
      // In order to properly update the socket pool, we need to call `getName()` on
      // the core `https.Agent` if it is a secureEndpoint.
      getName(options) {
        return this.isSecureEndpoint(options) ? https_1.Agent.prototype.getName.call(this, options) : super.getName(options);
      }
      createSocket(req, options, cb) {
        let connectOpts = {
          ...options,
          secureEndpoint: this.isSecureEndpoint(options)
        }, name = this.getName(connectOpts), fakeSocket = this.incrementSockets(name);
        Promise.resolve().then(() => this.connect(req, connectOpts)).then((socket) => {
          if (this.decrementSockets(name, fakeSocket), socket instanceof http2.Agent)
            try {
              return socket.addRequest(req, connectOpts);
            } catch (err) {
              return cb(err);
            }
          this[INTERNAL].currentSocket = socket, super.createSocket(req, options, cb);
        }, (err) => {
          this.decrementSockets(name, fakeSocket), cb(err);
        });
      }
      createConnection() {
        let socket = this[INTERNAL].currentSocket;
        if (this[INTERNAL].currentSocket = void 0, !socket)
          throw new Error("No socket was returned in the `connect()` function");
        return socket;
      }
      get defaultPort() {
        return this[INTERNAL].defaultPort ?? (this.protocol === "https:" ? 443 : 80);
      }
      set defaultPort(v) {
        this[INTERNAL] && (this[INTERNAL].defaultPort = v);
      }
      get protocol() {
        return this[INTERNAL].protocol ?? (this.isSecureEndpoint() ? "https:" : "http:");
      }
      set protocol(v) {
        this[INTERNAL] && (this[INTERNAL].protocol = v);
      }
    };
    exports2.Agent = Agent;
  }
});

// node_modules/https-proxy-agent/dist/parse-proxy-response.js
var require_parse_proxy_response = __commonJS({
  "node_modules/https-proxy-agent/dist/parse-proxy-response.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { default: mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: !0 });
    exports2.parseProxyResponse = void 0;
    var debug_1 = __importDefault(require_src()), debug = (0, debug_1.default)("https-proxy-agent:parse-proxy-response");
    function parseProxyResponse(socket) {
      return new Promise((resolve, reject) => {
        let buffersLength = 0, buffers = [];
        function read() {
          let b = socket.read();
          b ? ondata(b) : socket.once("readable", read);
        }
        function cleanup2() {
          socket.removeListener("end", onend), socket.removeListener("error", onerror), socket.removeListener("readable", read);
        }
        function onend() {
          cleanup2(), debug("onend"), reject(new Error("Proxy connection ended before receiving CONNECT response"));
        }
        function onerror(err) {
          cleanup2(), debug("onerror %o", err), reject(err);
        }
        function ondata(b) {
          buffers.push(b), buffersLength += b.length;
          let buffered = Buffer.concat(buffers, buffersLength), endOfHeaders = buffered.indexOf(`\r
\r
`);
          if (endOfHeaders === -1) {
            debug("have not received end of HTTP headers yet..."), read();
            return;
          }
          let headerParts = buffered.slice(0, endOfHeaders).toString("ascii").split(`\r
`), firstLine = headerParts.shift();
          if (!firstLine)
            return socket.destroy(), reject(new Error("No header received from proxy CONNECT response"));
          let firstLineParts = firstLine.split(" "), statusCode = +firstLineParts[1], statusText = firstLineParts.slice(2).join(" "), headers = {};
          for (let header of headerParts) {
            if (!header)
              continue;
            let firstColon = header.indexOf(":");
            if (firstColon === -1)
              return socket.destroy(), reject(new Error(`Invalid header from proxy CONNECT response: "${header}"`));
            let key = header.slice(0, firstColon).toLowerCase(), value = header.slice(firstColon + 1).trimStart(), current = headers[key];
            typeof current == "string" ? headers[key] = [current, value] : Array.isArray(current) ? current.push(value) : headers[key] = value;
          }
          debug("got proxy server response: %o %o", firstLine, headers), cleanup2(), resolve({
            connect: {
              statusCode,
              statusText,
              headers
            },
            buffered
          });
        }
        socket.on("error", onerror), socket.on("end", onend), read();
      });
    }
    exports2.parseProxyResponse = parseProxyResponse;
  }
});

// node_modules/https-proxy-agent/dist/index.js
var require_dist3 = __commonJS({
  "node_modules/https-proxy-agent/dist/index.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      k2 === void 0 && (k2 = k);
      var desc = Object.getOwnPropertyDescriptor(m, k);
      (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) && (desc = { enumerable: !0, get: function() {
        return m[k];
      } }), Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      k2 === void 0 && (k2 = k), o[k2] = m[k];
    }), __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: !0, value: v });
    } : function(o, v) {
      o.default = v;
    }), __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) for (var k in mod) k !== "default" && Object.prototype.hasOwnProperty.call(mod, k) && __createBinding(result, mod, k);
      return __setModuleDefault(result, mod), result;
    }, __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { default: mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: !0 });
    exports2.HttpsProxyAgent = void 0;
    var net = __importStar(require("net")), tls = __importStar(require("tls")), assert_1 = __importDefault(require("assert")), debug_1 = __importDefault(require_src()), agent_base_1 = require_dist2(), url_1 = require("url"), parse_proxy_response_1 = require_parse_proxy_response(), debug = (0, debug_1.default)("https-proxy-agent"), setServernameFromNonIpHost = (options) => options.servername === void 0 && options.host && !net.isIP(options.host) ? {
      ...options,
      servername: options.host
    } : options, HttpsProxyAgent = class extends agent_base_1.Agent {
      constructor(proxy, opts) {
        super(opts), this.options = { path: void 0 }, this.proxy = typeof proxy == "string" ? new url_1.URL(proxy) : proxy, this.proxyHeaders = opts?.headers ?? {}, debug("Creating new HttpsProxyAgent instance: %o", this.proxy.href);
        let host = (this.proxy.hostname || this.proxy.host).replace(/^\[|\]$/g, ""), port = this.proxy.port ? parseInt(this.proxy.port, 10) : this.proxy.protocol === "https:" ? 443 : 80;
        this.connectOpts = {
          // Attempt to negotiate http/1.1 for proxy servers that support http/2
          ALPNProtocols: ["http/1.1"],
          ...opts ? omit(opts, "headers") : null,
          host,
          port
        };
      }
      /**
       * Called when the node-core HTTP client library is creating a
       * new HTTP request.
       */
      async connect(req, opts) {
        let { proxy } = this;
        if (!opts.host)
          throw new TypeError('No "host" provided');
        let socket;
        proxy.protocol === "https:" ? (debug("Creating `tls.Socket`: %o", this.connectOpts), socket = tls.connect(setServernameFromNonIpHost(this.connectOpts))) : (debug("Creating `net.Socket`: %o", this.connectOpts), socket = net.connect(this.connectOpts));
        let headers = typeof this.proxyHeaders == "function" ? this.proxyHeaders() : { ...this.proxyHeaders }, host = net.isIPv6(opts.host) ? `[${opts.host}]` : opts.host, payload = `CONNECT ${host}:${opts.port} HTTP/1.1\r
`;
        if (proxy.username || proxy.password) {
          let auth = `${decodeURIComponent(proxy.username)}:${decodeURIComponent(proxy.password)}`;
          headers["Proxy-Authorization"] = `Basic ${Buffer.from(auth).toString("base64")}`;
        }
        headers.Host = `${host}:${opts.port}`, headers["Proxy-Connection"] || (headers["Proxy-Connection"] = this.keepAlive ? "Keep-Alive" : "close");
        for (let name of Object.keys(headers))
          payload += `${name}: ${headers[name]}\r
`;
        let proxyResponsePromise = (0, parse_proxy_response_1.parseProxyResponse)(socket);
        socket.write(`${payload}\r
`);
        let { connect, buffered } = await proxyResponsePromise;
        if (req.emit("proxyConnect", connect), this.emit("proxyConnect", connect, req), connect.statusCode === 200)
          return req.once("socket", resume), opts.secureEndpoint ? (debug("Upgrading socket connection to TLS"), tls.connect({
            ...omit(setServernameFromNonIpHost(opts), "host", "path", "port"),
            socket
          })) : socket;
        socket.destroy();
        let fakeSocket = new net.Socket({ writable: !1 });
        return fakeSocket.readable = !0, req.once("socket", (s) => {
          debug("Replaying proxy buffer for failed request"), (0, assert_1.default)(s.listenerCount("data") > 0), s.push(buffered), s.push(null);
        }), fakeSocket;
      }
    };
    HttpsProxyAgent.protocols = ["http", "https"];
    exports2.HttpsProxyAgent = HttpsProxyAgent;
    function resume(socket) {
      socket.resume();
    }
    function omit(obj, ...keys) {
      let ret = {}, key;
      for (key in obj)
        keys.includes(key) || (ret[key] = obj[key]);
      return ret;
    }
  }
});

// node_modules/web-push/src/web-push-lib.js
var require_web_push_lib = __commonJS({
  "node_modules/web-push/src/web-push-lib.js"(exports2, module2) {
    "use strict";
    var url = require("url"), https = require("https"), WebPushError = require_web_push_error(), vapidHelper = require_vapid_helper(), encryptionHelper = require_encryption_helper(), webPushConstants = require_web_push_constants(), urlBase64Helper = require_urlsafe_base64_helper(), DEFAULT_TTL = 2419200, gcmAPIKey = "", vapidDetails;
    function WebPushLib() {
    }
    WebPushLib.prototype.setGCMAPIKey = function(apiKey) {
      if (apiKey === null) {
        gcmAPIKey = null;
        return;
      }
      if (typeof apiKey > "u" || typeof apiKey != "string" || apiKey.length === 0)
        throw new Error("The GCM API Key should be a non-empty string or null.");
      gcmAPIKey = apiKey;
    };
    WebPushLib.prototype.setVapidDetails = function(subject, publicKey, privateKey) {
      if (arguments.length === 1 && arguments[0] === null) {
        vapidDetails = null;
        return;
      }
      vapidHelper.validateSubject(subject), vapidHelper.validatePublicKey(publicKey), vapidHelper.validatePrivateKey(privateKey), vapidDetails = {
        subject,
        publicKey,
        privateKey
      };
    };
    WebPushLib.prototype.generateRequestDetails = function(subscription, payload, options) {
      if (!subscription || !subscription.endpoint)
        throw new Error("You must pass in a subscription with at least an endpoint.");
      if (typeof subscription.endpoint != "string" || subscription.endpoint.length === 0)
        throw new Error("The subscription endpoint must be a string with a valid URL.");
      if (payload && (typeof subscription != "object" || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth))
        throw new Error("To send a message with a payload, the subscription must have 'auth' and 'p256dh' keys.");
      let currentGCMAPIKey = gcmAPIKey, currentVapidDetails = vapidDetails, timeToLive = DEFAULT_TTL, extraHeaders = {}, contentEncoding = webPushConstants.supportedContentEncodings.AES_128_GCM, urgency = webPushConstants.supportedUrgency.NORMAL, topic, proxy, agent, timeout;
      if (options) {
        let validOptionKeys = [
          "headers",
          "gcmAPIKey",
          "vapidDetails",
          "TTL",
          "contentEncoding",
          "urgency",
          "topic",
          "proxy",
          "agent",
          "timeout"
        ], optionKeys = Object.keys(options);
        for (let i = 0; i < optionKeys.length; i += 1) {
          let optionKey = optionKeys[i];
          if (!validOptionKeys.includes(optionKey))
            throw new Error("'" + optionKey + "' is an invalid option. The valid options are ['" + validOptionKeys.join("', '") + "'].");
        }
        if (options.headers) {
          extraHeaders = options.headers;
          let duplicates = Object.keys(extraHeaders).filter(function(header) {
            return typeof options[header] < "u";
          });
          if (duplicates.length > 0)
            throw new Error("Duplicated headers defined [" + duplicates.join(",") + "]. Please either define the header in thetop level options OR in the 'headers' key.");
        }
        if (options.gcmAPIKey && (currentGCMAPIKey = options.gcmAPIKey), options.vapidDetails !== void 0 && (currentVapidDetails = options.vapidDetails), options.TTL !== void 0 && (timeToLive = Number(options.TTL), timeToLive < 0))
          throw new Error("TTL should be a number and should be at least 0");
        if (options.contentEncoding)
          if (options.contentEncoding === webPushConstants.supportedContentEncodings.AES_128_GCM || options.contentEncoding === webPushConstants.supportedContentEncodings.AES_GCM)
            contentEncoding = options.contentEncoding;
          else
            throw new Error("Unsupported content encoding specified.");
        if (options.urgency)
          if (options.urgency === webPushConstants.supportedUrgency.VERY_LOW || options.urgency === webPushConstants.supportedUrgency.LOW || options.urgency === webPushConstants.supportedUrgency.NORMAL || options.urgency === webPushConstants.supportedUrgency.HIGH)
            urgency = options.urgency;
          else
            throw new Error("Unsupported urgency specified.");
        if (options.topic) {
          if (!urlBase64Helper.validate(options.topic))
            throw new Error("Unsupported characters set use the URL or filename-safe Base64 characters set");
          if (options.topic.length > 32)
            throw new Error("use maximum of 32 characters from the URL or filename-safe Base64 characters set");
          topic = options.topic;
        }
        options.proxy && (typeof options.proxy == "string" || typeof options.proxy.host == "string" ? proxy = options.proxy : console.warn("Attempt to use proxy option, but invalid type it should be a string or proxy options object.")), options.agent && (options.agent instanceof https.Agent ? (proxy && console.warn("Agent option will be ignored because proxy option is defined."), agent = options.agent) : console.warn("Wrong type for the agent option, it should be an instance of https.Agent.")), typeof options.timeout == "number" && (timeout = options.timeout);
      }
      typeof timeToLive > "u" && (timeToLive = DEFAULT_TTL);
      let requestDetails = {
        method: "POST",
        headers: {
          TTL: timeToLive
        }
      };
      Object.keys(extraHeaders).forEach(function(header) {
        requestDetails.headers[header] = extraHeaders[header];
      });
      let requestPayload = null;
      if (payload) {
        let encrypted = encryptionHelper.encrypt(subscription.keys.p256dh, subscription.keys.auth, payload, contentEncoding);
        requestDetails.headers["Content-Length"] = encrypted.cipherText.length, requestDetails.headers["Content-Type"] = "application/octet-stream", contentEncoding === webPushConstants.supportedContentEncodings.AES_128_GCM ? requestDetails.headers["Content-Encoding"] = webPushConstants.supportedContentEncodings.AES_128_GCM : contentEncoding === webPushConstants.supportedContentEncodings.AES_GCM && (requestDetails.headers["Content-Encoding"] = webPushConstants.supportedContentEncodings.AES_GCM, requestDetails.headers.Encryption = "salt=" + encrypted.salt, requestDetails.headers["Crypto-Key"] = "dh=" + encrypted.localPublicKey.toString("base64url")), requestPayload = encrypted.cipherText;
      } else
        requestDetails.headers["Content-Length"] = 0;
      let isGCM = subscription.endpoint.startsWith("https://android.googleapis.com/gcm/send"), isFCM = subscription.endpoint.startsWith("https://fcm.googleapis.com/fcm/send");
      if (isGCM)
        currentGCMAPIKey ? requestDetails.headers.Authorization = "key=" + currentGCMAPIKey : console.warn("Attempt to send push notification to GCM endpoint, but no GCM key is defined. Please use setGCMApiKey() or add 'gcmAPIKey' as an option.");
      else if (currentVapidDetails) {
        let parsedUrl = url.parse(subscription.endpoint), audience = parsedUrl.protocol + "//" + parsedUrl.host, vapidHeaders = vapidHelper.getVapidHeaders(
          audience,
          currentVapidDetails.subject,
          currentVapidDetails.publicKey,
          currentVapidDetails.privateKey,
          contentEncoding
        );
        requestDetails.headers.Authorization = vapidHeaders.Authorization, contentEncoding === webPushConstants.supportedContentEncodings.AES_GCM && (requestDetails.headers["Crypto-Key"] ? requestDetails.headers["Crypto-Key"] += ";" + vapidHeaders["Crypto-Key"] : requestDetails.headers["Crypto-Key"] = vapidHeaders["Crypto-Key"]);
      } else isFCM && currentGCMAPIKey && (requestDetails.headers.Authorization = "key=" + currentGCMAPIKey);
      return requestDetails.headers.Urgency = urgency, topic && (requestDetails.headers.Topic = topic), requestDetails.body = requestPayload, requestDetails.endpoint = subscription.endpoint, proxy && (requestDetails.proxy = proxy), agent && (requestDetails.agent = agent), timeout && (requestDetails.timeout = timeout), requestDetails;
    };
    WebPushLib.prototype.sendNotification = function(subscription, payload, options) {
      let requestDetails;
      try {
        requestDetails = this.generateRequestDetails(subscription, payload, options);
      } catch (err) {
        return Promise.reject(err);
      }
      return new Promise(function(resolve, reject) {
        let httpsOptions = {}, urlParts = url.parse(requestDetails.endpoint);
        if (httpsOptions.hostname = urlParts.hostname, httpsOptions.port = urlParts.port, httpsOptions.path = urlParts.path, httpsOptions.headers = requestDetails.headers, httpsOptions.method = requestDetails.method, requestDetails.timeout && (httpsOptions.timeout = requestDetails.timeout), requestDetails.agent && (httpsOptions.agent = requestDetails.agent), requestDetails.proxy) {
          let { HttpsProxyAgent } = require_dist3();
          httpsOptions.agent = new HttpsProxyAgent(requestDetails.proxy);
        }
        let pushRequest = https.request(httpsOptions, function(pushResponse) {
          let responseText = "";
          pushResponse.on("data", function(chunk) {
            responseText += chunk;
          }), pushResponse.on("end", function() {
            pushResponse.statusCode < 200 || pushResponse.statusCode > 299 ? reject(new WebPushError(
              "Received unexpected response code",
              pushResponse.statusCode,
              pushResponse.headers,
              responseText,
              requestDetails.endpoint
            )) : resolve({
              statusCode: pushResponse.statusCode,
              body: responseText,
              headers: pushResponse.headers
            });
          });
        });
        requestDetails.timeout && pushRequest.on("timeout", function() {
          pushRequest.destroy(new Error("Socket timeout"));
        }), pushRequest.on("error", function(e) {
          reject(e);
        }), requestDetails.body && pushRequest.write(requestDetails.body), pushRequest.end();
      });
    };
    module2.exports = WebPushLib;
  }
});

// node_modules/web-push/src/index.js
var require_src2 = __commonJS({
  "node_modules/web-push/src/index.js"(exports2, module2) {
    "use strict";
    var vapidHelper = require_vapid_helper(), encryptionHelper = require_encryption_helper(), WebPushLib = require_web_push_lib(), WebPushError = require_web_push_error(), WebPushConstants = require_web_push_constants(), webPush = new WebPushLib();
    module2.exports = {
      WebPushError,
      supportedContentEncodings: WebPushConstants.supportedContentEncodings,
      encrypt: encryptionHelper.encrypt,
      getVapidHeaders: vapidHelper.getVapidHeaders,
      generateVAPIDKeys: vapidHelper.generateVAPIDKeys,
      setGCMAPIKey: webPush.setGCMAPIKey,
      setVapidDetails: webPush.setVapidDetails,
      generateRequestDetails: webPush.generateRequestDetails,
      sendNotification: webPush.sendNotification.bind(webPush)
    };
  }
});

// src/server.js
var http = require("http"), crypto = require("crypto"), { Pool, Client, types } = require_lib2(), bcrypt = require_bcryptjs(), nodemailer = null;
try {
  nodemailer = require_nodemailer();
} catch {
  nodemailer = null;
}
var webpush = null;
try {
  webpush = require_src2();
} catch {
  webpush = null;
}
types.setTypeParser(20, (v) => v == null ? null : parseInt(v, 10));
var ENV = process.env, PORT = +ENV.PORT || 8787, HOST = ENV.HOST || "127.0.0.1", SITE_URL = String(ENV.SITE_URL || "http://localhost").replace(/\/+$/, ""), EXTRA_REDIRECTS = String(ENV.EXTRA_REDIRECTS || "").split(",").map((s) => s.trim()).filter(Boolean), JWT_SECRET = ENV.JWT_SECRET || "", JWT_EXP = Math.max(60, +ENV.JWT_EXP || 3600), REFRESH_DAYS = Math.max(1, +ENV.REFRESH_DAYS || 60), REUSE_MS = 1e4, MIN_PASSWORD = 6;
JWT_SECRET.length < 32 && (console.error("JWT_SECRET \u043D\u0435 \u0437\u0430\u0434\u0430\u043D \u0438\u043B\u0438 \u043A\u043E\u0440\u043E\u0447\u0435 32 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432"), process.exit(1));
var authPool = new Pool({ connectionString: ENV.DATABASE_URL_AUTH, max: +ENV.AUTH_POOL || 3, idleTimeoutMillis: 3e4 }), restPool = new Pool({ connectionString: ENV.DATABASE_URL_REST, max: +ENV.REST_POOL || 6, idleTimeoutMillis: 3e4 });
authPool.on("error", (e) => console.error("auth pool:", e.message));
restPool.on("error", (e) => console.error("rest pool:", e.message));
var SMTP = ENV.SMTP_HOST && nodemailer ? nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: +ENV.SMTP_PORT || 465,
  secure: (+ENV.SMTP_PORT || 465) == 465,
  auth: ENV.SMTP_USER ? { user: ENV.SMTP_USER, pass: ENV.SMTP_PASS || "" } : void 0
}) : null, SMTP_FROM = ENV.SMTP_FROM || ENV.SMTP_USER || "", b64u = (buf) => Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), b64dec = (s) => Buffer.from(String(s).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"), sha256 = (s) => crypto.createHash("sha256").update(String(s)).digest("hex"), randomToken = (n) => b64u(crypto.randomBytes(n || 24)), EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/, normEmail = (e) => String(e || "").trim().toLowerCase();
function jwtSign(payload) {
  let h = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" })), p = b64u(JSON.stringify(payload)), s = b64u(crypto.createHmac("sha256", JWT_SECRET).update(h + "." + p).digest());
  return h + "." + p + "." + s;
}
function jwtVerify(tok) {
  let parts = String(tok || "").split(".");
  if (parts.length !== 3) return { bad: !0 };
  let expect = b64u(crypto.createHmac("sha256", JWT_SECRET).update(parts[0] + "." + parts[1]).digest()), a = Buffer.from(parts[2]), b = Buffer.from(expect);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { bad: !0 };
  let header, payload;
  try {
    header = JSON.parse(b64dec(parts[0])), payload = JSON.parse(b64dec(parts[1]));
  } catch {
    return { bad: !0 };
  }
  return !header || header.alg !== "HS256" ? { bad: !0 } : !payload || !payload.exp || payload.exp * 1e3 < Date.now() ? { expired: !0 } : payload.role !== "authenticated" || !payload.sub ? { bad: !0 } : { claims: payload };
}
var RL = /* @__PURE__ */ new Map();
function limited(key, max, windowMs) {
  let now = Date.now(), e = RL.get(key);
  return (!e || e.reset < now) && (e = { n: 0, reset: now + windowMs }, RL.set(key, e)), e.n += 1, e.n > max;
}
setInterval(() => {
  let now = Date.now();
  for (let [k, v] of RL) v.reset < now && RL.delete(k);
}, 6e4).unref();
var HttpError = class extends Error {
  constructor(status, body) {
    super(body && (body.message || body.msg || body.error_description) || "error"), this.status = status, this.body = body;
  }
}, bad = (msg, code) => new HttpError(400, { code: code || "PGRST100", message: msg }), CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, prefer, x-client-info, accept-profile, content-profile, range",
  "Access-Control-Expose-Headers": "content-range, content-location",
  "Access-Control-Max-Age": "86400"
};
function send(res, status, body, extra) {
  let h = Object.assign({}, CORS, extra || {});
  if (body == null || status === 204) {
    res.writeHead(status, h), res.end();
    return;
  }
  h["Content-Type"] = "application/json; charset=utf-8", res.writeHead(status, h), res.end(JSON.stringify(body));
}
function readBody(req, max) {
  return new Promise((resolve, reject) => {
    let size = 0, chunks = [];
    req.on("data", (c) => {
      size += c.length, size > max ? (reject(new HttpError(413, { message: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439 \u0437\u0430\u043F\u0440\u043E\u0441" })), req.destroy()) : chunks.push(c);
    }), req.on("end", () => {
      let raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(null);
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(bad("\u0422\u0435\u043B\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0430 \u2014 \u043D\u0435 JSON"));
      }
    }), req.on("error", reject);
  });
}
function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?";
}
function bearer(req) {
  let m = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization || ""));
  return m ? m[1].trim() : "";
}
var DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);
function userJson(u) {
  return {
    id: u.id,
    aud: "authenticated",
    role: "authenticated",
    email: u.email,
    email_confirmed_at: u.email_confirmed_at,
    confirmed_at: u.email_confirmed_at,
    app_metadata: u.raw_app_meta_data || { provider: "email", providers: ["email"] },
    user_metadata: u.raw_user_meta_data || {},
    created_at: u.created_at,
    updated_at: u.updated_at,
    last_sign_in_at: u.last_sign_in_at
  };
}
function accessToken(u) {
  let now = Math.floor(Date.now() / 1e3);
  return jwtSign({
    aud: "authenticated",
    iss: SITE_URL + "/auth/v1",
    iat: now,
    exp: now + JWT_EXP,
    sub: u.id,
    email: u.email,
    role: "authenticated",
    app_metadata: u.raw_app_meta_data || { provider: "email", providers: ["email"] },
    user_metadata: u.raw_user_meta_data || {},
    aal: "aal1"
  });
}
function sessionJson(u, rt) {
  let now = Math.floor(Date.now() / 1e3);
  return { access_token: accessToken(u), token_type: "bearer", expires_in: JWT_EXP, expires_at: now + JWT_EXP, refresh_token: rt, user: userJson(u) };
}
async function newSession(db, u, parent) {
  let rt = randomToken(24);
  return await db.query("insert into auth.refresh_tokens (token, user_id, parent) values ($1, $2, $3)", [rt, u.id, parent || null]), sessionJson(u, rt);
}
async function userById(db, id) {
  return (await db.query("select * from auth.users where id = $1", [id])).rows[0] || null;
}
function cleanMeta(data) {
  if (data == null) return {};
  if (typeof data != "object" || Array.isArray(data)) throw new HttpError(422, { msg: "data \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u043C" });
  if (JSON.stringify(data).length > 4e3) throw new HttpError(422, { msg: "data \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439" });
  return data;
}
function checkPassword(pw) {
  if (typeof pw != "string" || pw.length < MIN_PASSWORD) throw new HttpError(422, { code: 422, error_code: "weak_password", msg: "Password should be at least " + MIN_PASSWORD + " characters." });
  if (Buffer.byteLength(pw) > 72) throw new HttpError(422, { code: 422, error_code: "weak_password", msg: "\u041F\u0430\u0440\u043E\u043B\u044C \u0434\u043B\u0438\u043D\u043D\u0435\u0435 72 \u0431\u0430\u0439\u0442" });
}
function authUser(req) {
  let t = bearer(req);
  if (!t) throw new HttpError(401, { code: 401, error_code: "no_authorization", msg: "This endpoint requires a Bearer token" });
  let v = jwtVerify(t);
  if (!v.claims) throw new HttpError(401, { code: 401, error_code: "bad_jwt", msg: v.expired ? "JWT expired" : "invalid JWT" });
  return v.claims;
}
function safeRedirect(to) {
  let s = String(to || ""), ok = [SITE_URL].concat(EXTRA_REDIRECTS);
  for (let base of ok) if (s === base || s.startsWith(base + "/") || s.startsWith(base + "?") || s.startsWith(base + "#")) return s.split("#")[0];
  return SITE_URL + "/";
}
async function handleAuth(req, res, url) {
  let path = url.pathname.replace(/^\/auth\/v1/, "") || "/", ip = clientIp(req);
  if (path === "/settings" && req.method === "GET")
    return send(res, 200, { external: { email: !0 }, disable_signup: !1, mailer_autoconfirm: !0, smtp: !!SMTP });
  if (path === "/health") return send(res, 200, { ok: !0 });
  if (path.startsWith("/push/")) return handlePush(req, res, path, ip);
  if (path === "/signup" && req.method === "POST") {
    let b = await readBody(req, 16384) || {}, email = normEmail(b.email);
    if (!EMAIL_RE.test(email) || email.length > 254) throw new HttpError(422, { code: 422, error_code: "validation_failed", msg: "Unable to validate email address: invalid format" });
    if (checkPassword(b.password), limited("signup:" + ip, +ENV.SIGNUP_PER_HOUR || 10, 36e5)) throw new HttpError(429, { code: 429, error_code: "over_request_rate_limit", msg: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0439 \u0441 \u044D\u0442\u043E\u0433\u043E \u0430\u0434\u0440\u0435\u0441\u0430, \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439 \u0447\u0435\u0440\u0435\u0437 \u0447\u0430\u0441" });
    let meta = cleanMeta(b.data), hash = await bcrypt.hash(b.password, 10), u;
    try {
      u = (await authPool.query(
        "insert into auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data) values ($1, $2, now(), $3) returning *",
        [email, hash, JSON.stringify(meta)]
      )).rows[0];
    } catch (e) {
      throw e.code === "23505" ? new HttpError(422, { code: 422, error_code: "user_already_exists", msg: "User already registered" }) : e;
    }
    return await authPool.query("update auth.users set last_sign_in_at = now() where id = $1", [u.id]), send(res, 200, await newSession(authPool, u));
  }
  if (path === "/token" && req.method === "POST") {
    let grant = url.searchParams.get("grant_type"), b = await readBody(req, 16384) || {};
    if (grant === "password") {
      let email = normEmail(b.email);
      if (limited("login-ip:" + ip, +ENV.LOGIN_PER_10MIN || 30, 6e5) || limited("login-mail:" + email, 10, 6e5))
        throw new HttpError(429, { code: 429, error_code: "over_request_rate_limit", msg: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u043F\u043E\u043F\u044B\u0442\u043E\u043A \u0432\u0445\u043E\u0434\u0430, \u043F\u043E\u0434\u043E\u0436\u0434\u0438 10 \u043C\u0438\u043D\u0443\u0442" });
      let u = (await authPool.query("select * from auth.users where lower(email) = $1", [email])).rows[0], ok = await bcrypt.compare(String(b.password || ""), u && u.encrypted_password || DUMMY_HASH);
      if (!u || !u.encrypted_password || !ok) throw new HttpError(400, { error: "invalid_grant", error_description: "Invalid login credentials" });
      return await authPool.query("update auth.users set last_sign_in_at = now() where id = $1", [u.id]), send(res, 200, await newSession(authPool, u));
    }
    if (grant === "refresh_token") {
      let rt = String(b.refresh_token || ""), invalid = () => new HttpError(400, { error: "invalid_grant", error_description: "Invalid Refresh Token: Refresh Token Not Found" });
      if (!rt || rt.length > 200) throw invalid();
      if (limited("refresh-ip:" + ip, 120, 6e5)) throw new HttpError(429, { code: 429, msg: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432" });
      let db = await authPool.connect();
      try {
        await db.query("begin");
        let row = (await db.query("select *, extract(epoch from now() - updated_at) * 1000 as since_ms, created_at < now() - make_interval(days => $2) as old from auth.refresh_tokens where token = $1 for update", [rt, REFRESH_DAYS])).rows[0];
        if (!row || row.old)
          throw await db.query("rollback"), invalid();
        let u = await userById(db, row.user_id);
        if (!u)
          throw await db.query("rollback"), invalid();
        if (row.revoked) {
          let c = row.since_ms < REUSE_MS ? await db.query("select token from auth.refresh_tokens where parent = $1 and not revoked order by created_at desc limit 1", [rt]) : { rows: [] };
          if (await db.query("commit"), !c.rows.length) throw invalid();
          return send(res, 200, sessionJson(u, c.rows[0].token));
        }
        await db.query("update auth.refresh_tokens set revoked = true, updated_at = now() where token = $1", [rt]);
        let s = await newSession(db, u, rt);
        return await db.query("commit"), send(res, 200, s);
      } catch (e) {
        try {
          await db.query("rollback");
        } catch {
        }
        throw e;
      } finally {
        db.release();
      }
    }
    throw new HttpError(400, { error: "unsupported_grant_type", error_description: "unsupported grant_type" });
  }
  if (path === "/user" && req.method === "GET") {
    let c = authUser(req), u = await userById(authPool, c.sub);
    if (!u) throw new HttpError(404, { code: 404, msg: "User not found" });
    return send(res, 200, userJson(u));
  }
  if (path === "/user" && req.method === "PUT") {
    let c = authUser(req), b = await readBody(req, 16384) || {};
    if (b.email !== void 0) throw new HttpError(422, { code: 422, msg: "\u0421\u043C\u0435\u043D\u0430 \u043F\u043E\u0447\u0442\u044B \u043F\u043E\u043A\u0430 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F" });
    if (b.password !== void 0) {
      checkPassword(b.password);
      let hash = await bcrypt.hash(b.password, 10);
      await authPool.query("update auth.users set encrypted_password = $2, updated_at = now() where id = $1", [c.sub, hash]);
    }
    if (b.data !== void 0) {
      let meta = cleanMeta(b.data), r = await authPool.query("select raw_user_meta_data from auth.users where id = $1", [c.sub]);
      if (!r.rows.length) throw new HttpError(404, { code: 404, msg: "User not found" });
      let merged = Object.assign({}, r.rows[0].raw_user_meta_data || {}, meta);
      if (JSON.stringify(merged).length > 8e3) throw new HttpError(422, { msg: "data \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439" });
      await authPool.query("update auth.users set raw_user_meta_data = $2, updated_at = now() where id = $1", [c.sub, JSON.stringify(merged)]);
    }
    let u = await userById(authPool, c.sub);
    if (!u) throw new HttpError(404, { code: 404, msg: "User not found" });
    return send(res, 200, userJson(u));
  }
  if (path === "/logout" && req.method === "POST") {
    let c = authUser(req);
    return await authPool.query("update auth.refresh_tokens set revoked = true, updated_at = now() where user_id = $1 and not revoked", [c.sub]), send(res, 204);
  }
  if (path === "/recover" && req.method === "POST") {
    let b = await readBody(req, 16384) || {};
    if (!SMTP) throw new HttpError(501, { code: 501, msg: "\u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0430\u0440\u043E\u043B\u044F \u043F\u043E \u043F\u043E\u0447\u0442\u0435 \u043F\u043E\u043A\u0430 \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u043E. \u041D\u0430\u043F\u0438\u0448\u0438 \u0430\u0432\u0442\u043E\u0440\u0443 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F \u2014 \u043E\u043D \u043F\u043E\u043C\u043E\u0436\u0435\u0442 \u0432\u043E\u0439\u0442\u0438" });
    let email = normEmail(b.email);
    if (!EMAIL_RE.test(email)) throw new HttpError(422, { code: 422, msg: "Unable to validate email address: invalid format" });
    if (limited("recover-ip:" + ip, 5, 36e5) || limited("recover-mail:" + email, 3, 36e5))
      throw new HttpError(429, { code: 429, msg: "\u041F\u0438\u0441\u044C\u043C\u043E \u0443\u0436\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E, \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0435 \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u044C \u043F\u043E\u0437\u0436\u0435" });
    let r = await authPool.query("select id, email from auth.users where lower(email) = $1", [email]);
    if (r.rows.length) {
      let tok = randomToken(32);
      await authPool.query(
        "insert into auth.recovery (token_hash, user_id, redirect_to, expires_at) values ($1, $2, $3, now() + interval '1 hour')",
        [sha256(tok), r.rows[0].id, safeRedirect(b.redirect_to)]
      );
      let link = SITE_URL + "/auth/v1/verify?type=recovery&token=" + encodeURIComponent(tok);
      await SMTP.sendMail({
        from: SMTP_FROM,
        to: r.rows[0].email,
        subject: "\u041D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u0434\u043B\u044F \xAB\u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043E\u043A\xBB",
        text: `\u0427\u0442\u043E\u0431\u044B \u0437\u0430\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u0432 \xAB\u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430\u0445\xBB, \u043E\u0442\u043A\u0440\u043E\u0439 \u0441\u0441\u044B\u043B\u043A\u0443:
` + link + `

\u0421\u0441\u044B\u043B\u043A\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0447\u0430\u0441. \u0415\u0441\u043B\u0438 \u0442\u044B \u043D\u0435 \u043F\u0440\u043E\u0441\u0438\u043B \u0441\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043F\u0430\u0440\u043E\u043B\u044C, \u043F\u0440\u043E\u0441\u0442\u043E \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0434\u0435\u043B\u0430\u0439.`,
        html: '<p>\u0427\u0442\u043E\u0431\u044B \u0437\u0430\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u0432 \xAB\u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430\u0445\xBB, \u043D\u0430\u0436\u043C\u0438 \u043D\u0430 \u0441\u0441\u044B\u043B\u043A\u0443:</p><p><a href="' + link + '">\u0417\u0430\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C</a></p><p style="color:#586676">\u0421\u0441\u044B\u043B\u043A\u0430 \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0447\u0430\u0441. \u0415\u0441\u043B\u0438 \u0442\u044B \u043D\u0435 \u043F\u0440\u043E\u0441\u0438\u043B \u0441\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043F\u0430\u0440\u043E\u043B\u044C, \u043F\u0440\u043E\u0441\u0442\u043E \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0434\u0435\u043B\u0430\u0439.</p>'
      });
    }
    return send(res, 200, {});
  }
  if (path === "/verify" && req.method === "GET") {
    let tok = url.searchParams.get("token") || "", page = (msg) => {
      res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" }), res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>\u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438</title><p style="font:18px system-ui;margin:40px auto;max-width:480px;padding:0 16px">' + msg + ' <a href="' + SITE_URL + '/">\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435</a></p>');
    };
    if (url.searchParams.get("type") !== "recovery" || !tok) return page("\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0435\u043F\u043E\u043B\u043D\u0430\u044F.");
    let r = await authPool.query("update auth.recovery set used = true where token_hash = $1 and not used and expires_at > now() returning user_id, redirect_to", [sha256(tok)]);
    if (!r.rows.length) return page("\u0421\u0441\u044B\u043B\u043A\u0430 \u0443\u0441\u0442\u0430\u0440\u0435\u043B\u0430 \u0438\u043B\u0438 \u0443\u0436\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0430 \u2014 \u0437\u0430\u043F\u0440\u043E\u0441\u0438 \u043D\u043E\u0432\u043E\u0435 \u043F\u0438\u0441\u044C\u043C\u043E.");
    let u = await userById(authPool, r.rows[0].user_id);
    if (!u) return page("\u0410\u043A\u043A\u0430\u0443\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D.");
    let s = await newSession(authPool, u), to = safeRedirect(r.rows[0].redirect_to) + "#access_token=" + encodeURIComponent(s.access_token) + "&expires_in=" + s.expires_in + "&refresh_token=" + encodeURIComponent(s.refresh_token) + "&token_type=bearer&type=recovery";
    return res.writeHead(303, { Location: to, "Cache-Control": "no-store" }), res.end();
  }
  throw new HttpError(404, { code: 404, msg: "Not found" });
}
var IDENT = /^[a-z_][a-z0-9_]{0,62}$/, TABLES = { progress: ["user_id"], profiles: ["user_id"], friends: ["user_id", "friend_id"], badge_admins: ["user_id"], awards: ["id"], profile_bans: ["user_id"] }, RPCS = { find_people: "rows", my_people: "rows", find_friend: "rows", delete_me: "void", admin_hide: "void", admin_users: "rows", admin_ops: "rows" }, RESERVED = /* @__PURE__ */ new Set(["select", "order", "limit", "offset", "on_conflict", "columns"]), qi = (id) => {
  if (!IDENT.test(id)) throw bad("\u041D\u0435\u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u043E\u0435 \u0438\u043C\u044F: " + String(id).slice(0, 40));
  return '"' + id + '"';
};
function splitTop(s) {
  let out = [], depth = 0, cur = "", quoted = !1;
  for (let i = 0; i < s.length; i++) {
    let ch = s[i];
    if (ch === '"' && s[i - 1] !== "\\" && (quoted = !quoted), !quoted && ch === "(" && depth++, !quoted && ch === ")" && depth--, !quoted && depth === 0 && ch === ",") {
      out.push(cur), cur = "";
      continue;
    }
    cur += ch;
  }
  if (cur !== "" && out.push(cur), depth !== 0 || quoted) throw bad("\u0421\u043A\u043E\u0431\u043A\u0438 \u0438\u043B\u0438 \u043A\u0430\u0432\u044B\u0447\u043A\u0438 \u043D\u0435 \u0437\u0430\u043A\u0440\u044B\u0442\u044B");
  return out;
}
var unq = (v) => /^".*"$/s.test(v) ? v.slice(1, -1).replace(/\\"/g, '"') : v;
function cond(col, expr, vals) {
  let m = /^(not\.)?(eq|neq|gt|gte|lt|lte|in|ilike|like|is)\.([\s\S]*)$/.exec(expr);
  if (!m) throw bad("\u041D\u0435\u043F\u043E\u043D\u044F\u0442\u043D\u044B\u0439 \u0444\u0438\u043B\u044C\u0442\u0440: " + String(expr).slice(0, 40));
  let c = qi(col), op = m[2], v = m[3], sql;
  if (op === "in") {
    let inner = /^\(([\s\S]*)\)$/.exec(v);
    if (!inner) throw bad("in.(\u2026) \u0431\u0435\u0437 \u0441\u043A\u043E\u0431\u043E\u043A");
    let items = inner[1] === "" ? [] : splitTop(inner[1]).map(unq);
    if (items.length > 500) throw bad("\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043B\u0438\u043D\u043D\u044B\u0439 \u0441\u043F\u0438\u0441\u043E\u043A");
    vals.push(items), sql = c + " = any($" + vals.length + ")";
  } else if (op === "is") {
    if (!/^(null|true|false)$/.test(v)) throw bad("is." + v);
    sql = c + " is " + v;
  } else if (op === "ilike" || op === "like")
    vals.push(unq(v).replace(/\*/g, "%")), sql = c + " " + op + " $" + vals.length;
  else {
    let ops = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=" };
    vals.push(unq(v)), sql = c + " " + ops[op] + " $" + vals.length;
  }
  return m[1] ? "not (" + sql + ")" : sql;
}
function logic(kind, body, vals) {
  let inner = /^\(([\s\S]*)\)$/.exec(body);
  if (!inner) throw bad(kind + "=(\u2026) \u0431\u0435\u0437 \u0441\u043A\u043E\u0431\u043E\u043A");
  let parts = splitTop(inner[1]).map((p) => {
    let lm = /^(and|or)(\([\s\S]*\))$/.exec(p);
    if (lm) return logic(lm[1], lm[2], vals);
    let dm = /^([a-z_][a-z0-9_]*)\.([\s\S]+)$/.exec(p);
    if (!dm) throw bad("\u041D\u0435\u043F\u043E\u043D\u044F\u0442\u043D\u043E\u0435 \u0443\u0441\u043B\u043E\u0432\u0438\u0435: " + p.slice(0, 40));
    return cond(dm[1], dm[2], vals);
  });
  if (!parts.length) throw bad("\u041F\u0443\u0441\u0442\u043E\u0435 \u0443\u0441\u043B\u043E\u0432\u0438\u0435");
  return "(" + parts.join(kind === "and" ? " and " : " or ") + ")";
}
function whereOf(params, vals) {
  let parts = [];
  for (let [k, v] of params)
    RESERVED.has(k) || (k === "or" || k === "and" ? parts.push(logic(k, v, vals)) : parts.push(cond(k, v, vals)));
  return parts.length ? " where " + parts.join(" and ") : "";
}
function selectOf(s) {
  return !s || s === "*" ? "*" : s.split(",").map((c) => qi(c.trim())).join(", ");
}
function orderOf(s) {
  return s ? " order by " + s.split(",").map((p) => {
    let m = /^([a-z_][a-z0-9_]*)(?:\.(asc|desc))?(?:\.(nullsfirst|nullslast))?$/.exec(p.trim());
    if (!m) throw bad("order: " + p.slice(0, 40));
    return qi(m[1]) + (m[2] ? " " + m[2] : "") + (m[3] ? m[3] === "nullsfirst" ? " nulls first" : " nulls last" : "");
  }).join(", ") : "";
}
function limitOf(params) {
  let s = "", l = params.get("limit"), o = params.get("offset");
  if (l != null) {
    if (!/^\d{1,4}$/.test(l)) throw bad("limit");
    s += " limit " + Math.min(+l, 1e3);
  }
  if (o != null) {
    if (!/^\d{1,6}$/.test(o)) throw bad("offset");
    s += " offset " + +o;
  }
  return s;
}
var cell = (v) => v !== null && typeof v == "object" ? JSON.stringify(v) : v;
function prefer(req) {
  let p = String(req.headers.prefer || "");
  return { repr: /return=representation/.test(p), merge: /resolution=merge-duplicates/.test(p), ignore: /resolution=ignore-duplicates/.test(p) };
}
async function asRole(claims, fn) {
  let db = await restPool.connect();
  try {
    await db.query("begin"), await db.query(claims ? "set local role authenticated" : "set local role anon"), await db.query("set local statement_timeout = '8s'"), await db.query(
      "select set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claim.role', $2, true), set_config('request.jwt.claim.email', $3, true), set_config('request.jwt.claims', $4, true)",
      [claims ? claims.sub : "", claims ? "authenticated" : "anon", claims && claims.email || "", JSON.stringify(claims || { role: "anon" })]
    );
    let r = await fn(db);
    return await db.query("commit"), r;
  } catch (e) {
    try {
      await db.query("rollback");
    } catch {
    }
    throw e;
  } finally {
    db.release();
  }
}
async function handleRest(req, res, url) {
  let claims = null, t = bearer(req);
  if (t) {
    let v = jwtVerify(t);
    if (!v.claims) throw new HttpError(401, { code: "PGRST301", message: v.expired ? "JWT expired" : "JWT invalid" });
    claims = v.claims;
  }
  let ip = clientIp(req);
  if (limited("rest:" + ip, +ENV.REST_PER_MIN || 600, 6e4)) throw new HttpError(429, { message: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432" });
  let parts = url.pathname.replace(/^\/rest\/v1\/?/, "").split("/"), params = url.searchParams;
  if (parts[0] === "rpc" && parts.length === 2) {
    let fn = parts[1];
    if (!RPCS[fn] || req.method !== "POST") throw new HttpError(404, { code: "PGRST202", message: "Could not find the function public." + fn + " in the schema cache" });
    let b = await readBody(req, 65536) || {};
    if (typeof b != "object" || Array.isArray(b)) throw bad("\u0410\u0440\u0433\u0443\u043C\u0435\u043D\u0442\u044B \u2014 \u043E\u0431\u044A\u0435\u043A\u0442");
    let keys = Object.keys(b), vals = keys.map((k) => cell(b[k])), args = keys.map((k, i) => qi(k) + " => $" + (i + 1)).join(", "), sql = RPCS[fn] === "void" ? "select public." + qi(fn) + "(" + args + ")" : "select * from public." + qi(fn) + "(" + args + ")", r = await asRole(claims, (db) => db.query(sql, vals));
    return RPCS[fn] === "void" ? send(res, 204) : send(res, 200, r.rows);
  }
  let table = parts[0];
  if (parts.length !== 1 || !TABLES[table]) throw new HttpError(404, { code: "42P01", message: 'relation "public.' + String(table).slice(0, 40) + '" does not exist' });
  let T = "public." + qi(table), pf = prefer(req);
  if (req.method === "GET") {
    let vals = [], sql = "select " + selectOf(params.get("select")) + " from " + T + whereOf(params, vals) + orderOf(params.get("order")) + limitOf(params), r = await asRole(claims, (db) => db.query(sql, vals));
    return send(res, 200, r.rows);
  }
  if (req.method === "POST") {
    let b = await readBody(req, 4194304);
    if (b == null) throw bad("\u041F\u0443\u0441\u0442\u043E\u0435 \u0442\u0435\u043B\u043E");
    if (Array.isArray(b) || (b = [b]), !b.length) return send(res, 201, pf.repr ? [] : null);
    if (b.length > 200) throw bad("\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0441\u0442\u0440\u043E\u043A");
    let cols = Array.from(new Set([].concat(...b.map((row) => Object.keys(row || {})))));
    if (!cols.length) throw bad("\u041D\u0435\u0442 \u043F\u043E\u043B\u0435\u0439");
    cols.forEach(qi);
    let vals = [], rows = b.map((row) => "(" + cols.map((c) => (vals.push(row && row[c] !== void 0 ? cell(row[c]) : null), "$" + vals.length)).join(", ") + ")"), pk = TABLES[table], conflict = "";
    if (pf.merge || pf.ignore) {
      let upd = cols.filter((c) => pk.indexOf(c) < 0);
      conflict = " on conflict (" + pk.map(qi).join(", ") + ") " + (pf.merge && upd.length ? "do update set " + upd.map((c) => qi(c) + " = excluded." + qi(c)).join(", ") : "do nothing");
    }
    let sql = "insert into " + T + " (" + cols.map(qi).join(", ") + ") values " + rows.join(", ") + conflict + (pf.repr ? " returning " + selectOf(params.get("select")) : ""), r = await asRole(claims, (db) => db.query(sql, vals));
    return send(res, 201, pf.repr ? r.rows : null);
  }
  if (req.method === "DELETE") {
    let vals = [], where = whereOf(params, vals);
    if (!where) throw bad("\u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0431\u0435\u0437 \u0443\u0441\u043B\u043E\u0432\u0438\u044F \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u043E");
    let sql = "delete from " + T + where + (pf.repr ? " returning " + selectOf(params.get("select")) : ""), r = await asRole(claims, (db) => db.query(sql, vals));
    return pf.repr ? send(res, 200, r.rows) : send(res, 204);
  }
  if (req.method === "PATCH") {
    let b = await readBody(req, 4194304);
    if (!b || typeof b != "object" || Array.isArray(b)) throw bad("\u0422\u0435\u043B\u043E \u2014 \u043E\u0431\u044A\u0435\u043A\u0442");
    let keys = Object.keys(b);
    if (!keys.length) throw bad("\u041D\u0435\u0442 \u043F\u043E\u043B\u0435\u0439");
    let vals = keys.map((k) => cell(b[k])), set = keys.map((k, i) => qi(k) + " = $" + (i + 1)).join(", "), where = whereOf(params, vals);
    if (!where) throw bad("\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0435 \u0431\u0435\u0437 \u0443\u0441\u043B\u043E\u0432\u0438\u044F \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u043E");
    let sql = "update " + T + " set " + set + where + (pf.repr ? " returning " + selectOf(params.get("select")) : ""), r = await asRole(claims, (db) => db.query(sql, vals));
    return pf.repr ? send(res, 200, r.rows) : send(res, 204);
  }
  throw new HttpError(405, { message: "\u041C\u0435\u0442\u043E\u0434 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F" });
}
function pgToHttp(e, claims) {
  let code = e && e.code;
  return code === "42501" ? new HttpError(claims ? 403 : 401, { code, message: e.message }) : code === "42883" ? new HttpError(404, { code: "PGRST202", message: "Could not find the function in the schema cache: " + e.message }) : code === "42P01" ? new HttpError(404, { code, message: e.message }) : code === "23505" || code === "23503" ? new HttpError(409, { code, message: e.message, details: e.detail }) : code === "P0001" || code === "22P02" || code === "42703" || code === "23502" || code === "23514" || code === "22001" ? new HttpError(400, { code, message: e.message }) : code === "57014" ? new HttpError(503, { code, message: "\u0417\u0430\u043F\u0440\u043E\u0441 \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u043B\u0441\u044F \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0434\u043E\u043B\u0433\u043E" }) : null;
}
var PUSH_PUBLIC = ENV.PUSH_PUBLIC || "", PUSH_ON = !!(webpush && PUSH_PUBLIC && ENV.PUSH_PRIVATE);
if (PUSH_ON)
  try {
    webpush.setVapidDetails(ENV.PUSH_SUBJECT || "mailto:admin@example.com", PUSH_PUBLIC, ENV.PUSH_PRIVATE);
  } catch (e) {
    console.error("push: \u043A\u043B\u044E\u0447\u0438 \u043D\u0435 \u043F\u043E\u0434\u043E\u0448\u043B\u0438 \u2014", e.message);
  }
var PUSH_DEF = { fr: !0, cheer: !0, adm: !0, rem: "" };
function validTz(tz) {
  if (typeof tz != "string" || !tz || tz.length > 64) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz }), tz;
  } catch {
    return "";
  }
}
function cleanPrefs(p) {
  p = p && typeof p == "object" ? p : {};
  let out = {};
  ["fr", "cheer", "adm"].forEach((k) => {
    out[k] = p[k] === void 0 ? PUSH_DEF[k] : !!p[k];
  });
  let m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(p.rem || ""));
  return out.rem = m ? ("0" + m[1]).slice(-2) + ":" + m[2] : "", out.tz = validTz(p.tz) || "Europe/Moscow", out;
}
function checkEndpoint(ep) {
  let u;
  try {
    u = new URL(String(ep || ""));
  } catch {
    throw bad("\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0438");
  }
  if (String(ep).length > 2048 || u.protocol !== "https:" || u.username || u.password) throw bad("\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0438");
  if (ENV.PUSH_ALLOW_LOCAL !== "1") {
    let h = u.hostname;
    if (u.port && u.port !== "443" || /^[\d.]+$/.test(h) || h.includes(":") || h === "localhost" || /\.(local|localhost|internal|lan|home)$/i.test(h) || !h.includes(".")) throw bad("\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0438");
  }
  return u.toString();
}
var PUSH_RL = /* @__PURE__ */ new Map();
function pushOnce(key, ms) {
  let now = Date.now(), t = PUSH_RL.get(key);
  if (t && now - t < ms) return !1;
  if (PUSH_RL.set(key, now), PUSH_RL.size > 5e3) for (let [k, v] of PUSH_RL) now - v > 36e5 && PUSH_RL.delete(k);
  return !0;
}
async function pushSend(rows, payload) {
  if (!PUSH_ON || !rows.length) return 0;
  let body = JSON.stringify(payload), n = 0;
  return await Promise.all(rows.map(async (r) => {
    try {
      await webpush.sendNotification(
        { endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth_key } },
        body,
        { TTL: payload.ttl || 12 * 3600, urgency: payload.urgency || "normal", timeout: 15e3 }
      ), n++;
    } catch (e) {
      let sc = e && e.statusCode;
      sc === 404 || sc === 410 || sc === 403 && /unsubscribed|expired/i.test(String(e.body || "")) ? await authPool.query("delete from auth.push_subs where endpoint = $1", [r.endpoint]).catch(() => {
      }) : console.error("push:", sc || "", String(e && (e.body || e.message) || e).slice(0, 200));
    }
  })), n;
}
async function pushToUsers(ids, prefKey, payload) {
  if (ids = (ids || []).filter((x) => /^[0-9a-f-]{36}$/i.test(String(x))), !PUSH_ON || !ids.length) return 0;
  let r = await authPool.query("select endpoint, user_id, p256dh, auth_key, prefs from auth.push_subs where user_id = any($1::uuid[])", [ids]);
  return pushSend(r.rows.filter((x) => cleanPrefs(x.prefs)[prefKey] !== !1), payload);
}
var PUSH_TEXT = {
  fr_req: (m) => ({ t: "\u{1F91D} " + (m.nick || "\u041A\u0442\u043E-\u0442\u043E") + " \u0445\u043E\u0447\u0435\u0442 \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0442\u0435\u0431\u044F \u0432 \u0434\u0440\u0443\u0437\u044C\u044F", b: "\u041E\u0442\u043A\u0440\u043E\u0439 \xAB\u0414\u0440\u0443\u0437\u044C\u044F\xBB, \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u0438\u043D\u044F\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0443.", tag: "fr", go: "reqs" }),
  fr_ok: (m) => ({ t: "\u{1F91D} " + (m.nick || "\u0414\u0440\u0443\u0433") + " \u0442\u0435\u043F\u0435\u0440\u044C \u0432 \u0434\u0440\u0443\u0437\u044C\u044F\u0445", b: "\u0422\u0435\u043F\u0435\u0440\u044C \u0432\u044B \u0432\u0438\u0434\u0438\u0442\u0435 \u0446\u0438\u0444\u0440\u044B \u0434\u0440\u0443\u0433 \u0434\u0440\u0443\u0433\u0430.", tag: "fr", go: "friends" }),
  cheer: (m) => ({ t: (m.e || "\u{1F525}") + " " + (m.nick || "\u0414\u0440\u0443\u0433") + " \u043F\u043E\u0434\u0431\u0430\u0434\u0440\u0438\u0432\u0430\u0435\u0442 \u0442\u0435\u0431\u044F", b: "\u0422\u0430\u043A \u0434\u0435\u0440\u0436\u0430\u0442\u044C!", tag: "cheer-" + m.from, go: "friends" })
};
async function onPushEvent(m) {
  if (!(!m || !m.k)) {
    if (m.k === "fr_req" || m.k === "fr_ok")
      return pushOnce(m.k + ":" + m.from + ":" + m.to, 10 * 6e4) ? pushToUsers([m.to], "fr", PUSH_TEXT[m.k](m)) : void 0;
    if (m.k === "cheer")
      return pushOnce("cheer:" + m.from + ":" + m.to, 2 * 6e4) ? pushToUsers([m.to], "cheer", PUSH_TEXT.cheer(m)) : void 0;
    if (m.k === "newuser" || m.k === "ops") {
      let ids = (await authPool.query("select push_admins as id from auth.push_admins()")).rows.map((x) => x.id).filter((id) => id !== m.id);
      if (m.k === "newuser") return pushToUsers(ids, "adm", { t: "\u{1F44B} \u041D\u043E\u0432\u044B\u0439 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C", b: String(m.email || ""), tag: "adm-new", go: "users" });
      let v = m.v || {};
      if (m.key === "backup" && pushOnce("ops:backup", 6 * 36e5))
        return pushToUsers(ids, "adm", {
          t: "\u26A0\uFE0F \u041A\u043E\u043F\u0438\u044F \u0431\u0430\u0437\u044B \u043D\u0435 \u0441\u0434\u0435\u043B\u0430\u043B\u0430\u0441\u044C",
          go: "users",
          tag: "adm-ops",
          b: v.err === "yadisk" ? "\u041D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0430\u0441\u044C \u043D\u0430 \u042F\u043D\u0434\u0435\u043A\u0441 \u0414\u0438\u0441\u043A. \u041F\u0440\u043E\u0432\u0435\u0440\u044C \u043F\u0430\u0440\u043E\u043B\u044C \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F: \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0438 training-yadisk." : "\u0421\u0431\u043E\u0439 \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435. \u041B\u043E\u0433\u0438: journalctl -t training-backup"
        });
    }
  }
}
var LISTENER = null, LISTEN_STOP = !1;
function pushListen() {
  if (!PUSH_ON || LISTEN_STOP) return;
  let c = new Client({ connectionString: ENV.DATABASE_URL_AUTH }), again = () => {
    LISTENER === c && (LISTENER = null), c.end().catch(() => {
    }), LISTEN_STOP || setTimeout(pushListen, 5e3).unref();
  };
  c.on("error", (e) => {
    console.error("push: \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0441 \u0431\u0430\u0437\u043E\u0439 \u2014", e.message), again();
  }), c.on("end", () => {
    LISTENER === c && again();
  }), c.on("notification", (n) => {
    let m = null;
    try {
      m = JSON.parse(n.payload);
    } catch {
      return;
    }
    onPushEvent(m).catch((e) => console.error("push:", e.message));
  }), c.connect().then(() => c.query("listen trn_push")).then(() => {
    LISTENER = c;
  }).catch((e) => {
    console.error("push: \u043D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u043B\u0441\u044F \u043A \u0431\u0430\u0437\u0435 \u2014", e.message), again();
  });
}
function localParts(ms, tz) {
  let p = {};
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(ms)).forEach((x) => {
    p[x.type] = x.value;
  }), { day: p.year + "-" + p.month + "-" + p.day, min: +p.hour % 24 * 60 + +p.minute };
}
var REM_BUSY = !1;
async function remTick(now) {
  if (!PUSH_ON || REM_BUSY) return 0;
  REM_BUSY = !0;
  let sent = 0;
  try {
    now = now || Date.now();
    let r = await authPool.query("select endpoint, user_id, p256dh, auth_key, prefs, rem_day from auth.push_subs where coalesce(prefs->>'rem', '') <> ''"), due = [];
    for (let row of r.rows) {
      let pr = cleanPrefs(row.prefs);
      if (!pr.rem) continue;
      let L = localParts(now, pr.tz), at = +pr.rem.slice(0, 2) * 60 + +pr.rem.slice(3);
      row.rem_day === L.day || L.min < at || L.min - at > 30 || due.push({ row, tz: pr.tz, day: L.day });
    }
    if (!due.length) return 0;
    let st = await authPool.query("select * from auth.push_stats($1::uuid[])", [Array.from(new Set(due.map((d) => d.row.user_id)))]), last = new Map(st.rows.map((x) => [x.user_id, x.trained_at]));
    for (let d of due) {
      await authPool.query("update auth.push_subs set rem_day = $2 where endpoint = $1", [d.row.endpoint, d.day]);
      let t = last.get(d.row.user_id);
      t && localParts(+t, d.tz).day === d.day || (sent += await pushSend([d.row], { t: "\u{1F4AA} \u041F\u043E\u0440\u0430 \u043F\u043E\u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F", b: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F \u0435\u0449\u0451 \u043D\u0435 \u0431\u044B\u043B\u043E \u043E\u0442\u043C\u0435\u0442\u043E\u043A. \u041F\u0430\u0440\u0430 \u043A\u043E\u0440\u043E\u0442\u043A\u0438\u0445 \u043F\u043E\u0434\u0445\u043E\u0434\u043E\u0432 \u2014 \u0438 \u0441\u0435\u0440\u0438\u044F \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u0441\u044F.", tag: "rem", go: "" }));
    }
  } catch (e) {
    console.error("\u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u044F:", e.message);
  } finally {
    REM_BUSY = !1;
  }
  return sent;
}
async function handlePush(req, res, path, ip) {
  if (path === "/push/key" && req.method === "GET") return send(res, 200, { key: PUSH_ON ? PUSH_PUBLIC : null });
  if (req.method !== "POST") throw new HttpError(404, { message: "Not found" });
  let claims = authUser(req), uid = claims.sub;
  if (limited("push:" + uid, 60, 6e4)) throw new HttpError(429, { message: "\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432" });
  let b = await readBody(req, 16384) || {};
  if (path === "/push/sub") {
    if (!PUSH_ON) throw new HttpError(503, { message: "\u041D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435 \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u044B push-\u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F" });
    let ep = checkEndpoint(b.endpoint), k = b.keys || {};
    if (!/^[A-Za-z0-9_=-]{40,200}$/.test(String(k.p256dh || "")) || !/^[A-Za-z0-9_=-]{8,64}$/.test(String(k.auth || ""))) throw bad("\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u043A\u043B\u044E\u0447\u0438 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0438");
    let prefs = cleanPrefs(b.prefs);
    return await authPool.query(
      `insert into auth.push_subs (endpoint, user_id, p256dh, auth_key, prefs, ua) values ($1, $2, $3, $4, $5, $6)
       on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth_key = excluded.auth_key,
         prefs = excluded.prefs, ua = excluded.ua, updated_at = now(),
         rem_day = case when auth.push_subs.prefs->>'rem' is distinct from excluded.prefs->>'rem' then null else auth.push_subs.rem_day end`,
      [ep, uid, String(k.p256dh), String(k.auth), JSON.stringify(prefs), String(req.headers["user-agent"] || "").slice(0, 200)]
    ), await authPool.query("delete from auth.push_subs where user_id = $1 and endpoint not in (select endpoint from auth.push_subs where user_id = $1 order by updated_at desc limit 20)", [uid]), send(res, 200, { ok: !0, prefs });
  }
  if (path === "/push/unsub")
    return await authPool.query("delete from auth.push_subs where endpoint = $1 and user_id = $2", [String(b.endpoint || ""), uid]), send(res, 200, { ok: !0 });
  if (path === "/push/test") {
    let r = await authPool.query("select endpoint, user_id, p256dh, auth_key, prefs from auth.push_subs where endpoint = $1 and user_id = $2", [String(b.endpoint || ""), uid]);
    if (!r.rows.length) throw new HttpError(404, { message: "\u042D\u0442\u043E \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u043D\u0435 \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u043E" });
    let n = await pushSend(r.rows, { t: "\u{1F514} \u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442", b: "\u0422\u0430\u043A \u0431\u0443\u0434\u0443\u0442 \u043F\u0440\u0438\u0445\u043E\u0434\u0438\u0442\u044C \u0437\u0430\u044F\u0432\u043A\u0438 \u0432 \u0434\u0440\u0443\u0437\u044C\u044F, \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 \u0438 \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u044F.", tag: "test", go: "" });
    return send(res, 200, { ok: n > 0 });
  }
  throw new HttpError(404, { message: "Not found" });
}
var server = http.createServer(async (req, res) => {
  let t0 = Date.now(), url;
  try {
    url = new URL(req.url, "http://local");
  } catch {
    return send(res, 400, { message: "bad url" });
  }
  res.on("finish", () => {
    ENV.LOG_REQUESTS !== "0" && console.log(req.method, url.pathname, res.statusCode, Date.now() - t0 + "ms");
  });
  try {
    if (req.method === "OPTIONS") return send(res, 204);
    if (url.pathname === "/health")
      return await restPool.query("select 1"), send(res, 200, { ok: !0 });
    if (url.pathname.startsWith("/auth/v1/") || url.pathname === "/auth/v1") return await handleAuth(req, res, url);
    if (url.pathname.startsWith("/rest/v1/"))
      try {
        return await handleRest(req, res, url);
      } catch (e) {
        throw (e instanceof HttpError ? null : pgToHttp(e, bearer(req))) || e;
      }
    return send(res, 404, { message: "Not found" });
  } catch (e) {
    if (res.headersSent) {
      res.end();
      return;
    }
    if (e instanceof HttpError) return send(res, e.status, e.body);
    let h = pgToHttp(e, !0);
    return h ? send(res, h.status, h.body) : (console.error("\u043E\u0448\u0438\u0431\u043A\u0430:", req.method, url.pathname, e && e.message), send(res, 500, { message: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0430" }));
  }
});
server.keepAliveTimeout = 65e3;
server.headersTimeout = 66e3;
server.requestTimeout = 3e4;
async function cleanup() {
  try {
    await authPool.query("delete from auth.refresh_tokens where created_at < now() - make_interval(days => $1) or (revoked and updated_at < now() - interval '2 days')", [REFRESH_DAYS + 1]), await authPool.query("delete from auth.recovery where expires_at < now() - interval '1 day'");
  } catch (e) {
    console.error("\u0443\u0431\u043E\u0440\u043A\u0430:", e.message);
  }
}
setInterval(cleanup, 36e5).unref();
PUSH_ON && setInterval(() => {
  remTick();
}, Math.max(1e3, +ENV.PUSH_REM_MS || 6e4)).unref();
server.listen(PORT, HOST, () => {
  console.log("\u0422\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0438 API \u0441\u043B\u0443\u0448\u0430\u0435\u0442 " + HOST + ":" + PORT + (SMTP ? ", \u043F\u043E\u0447\u0442\u0430 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0430" : ", \u043F\u043E\u0447\u0442\u0430 \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0430") + (PUSH_ON ? ", push \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u044B" : ", push \u043D\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u044B")), cleanup(), pushListen();
});
var stop = () => {
  LISTEN_STOP = !0, LISTENER && LISTENER.end().catch(() => {
  }), server.close(() => Promise.all([authPool.end(), restPool.end()]).then(() => process.exit(0))), setTimeout(() => process.exit(0), 5e3).unref();
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
