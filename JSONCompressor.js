var isObject = function(A) {
    return (typeof A == "object") && (A !== null) && !Array.isArray(A);
}

var JSONCompressor = {};
JSONCompressor.stringify = function(obj, type, space) {
    return JSON.stringify(obj, JSONCompressor.censor[type || JSONCompressor.compression], space);
};

JSONCompressor.censor = {
    passive: function(key, value) {
        if (Array.isArray(value) && value.length > 2 && isObject(value[0])) {
            var compressedValue = {
                "$p": true,
                c: [],
                v: []
            };
            for (var i = 0; i < value.length; i++) {
                var v = value[i],
                    d = [];
                compressedValue.c = compressedValue.c.concat(Object.keys(v).filter(function(item) {
                    return compressedValue.c.indexOf(item) == -1;
                }));
                for (var j = 0; j < compressedValue.c.length; j++) {
                    d.push(v[compressedValue.c[j]]);
                }
                compressedValue.v.push(d);
            };
            return compressedValue;
        } else return value;
    },
    aggresive: function(key, value) {
        if (Array.isArray(value) && value.length > 2 && isObject(value[0])) {
            var compressedArr = ["$a"],
                columns = [],
                values = [];
            for (var i = 0; i < value.length; i++) {
                var v = value[i],
                    d = [];
                columns = columns.concat(Object.keys(v).filter(function(item) {
                    return columns.indexOf(item) == -1;
                }));
                for (var j = 0; j < columns.length; j++) {
                    d.push(v[columns[j]]);
                }
                values.push(d);
            }
            compressedArr.push(columns);
            values.forEach(function(item) {
                columns.forEach(function(col, i) {
                    compressedArr.push(item[i]);
                });
            });
            return compressedArr;
        } else return value;
    },
    recursive: function(key, value) {
        if (Array.isArray(value) && value.length > 2 && isObject(value[0])) {
            var compressedArr = ["$r"],
                columns = [],
                values = [];
            for (var i = 0; i < value.length; i++) {
                var v = value[i],
                    d = [];
                var newC = Object.keys(v).filter(function(a) {
                    return columns.indexOf(a) === -1 && columns.filter(function(b) {
                        return Array.isArray(b) && b[0] == a;
                    }).length == 0;
                });
                for (var j = 0; j < newC.length; j++) {
                    if (isObject(v[newC[j]])) {
                        columns.push([newC[j]].concat(Object.keys(v[newC[j]])));
                    } else {
                        columns.push(newC[j]);
                    }
                }
                for (var j = 0; j < columns.length; j++) {
                    var col = columns[j];
                    if (Array.isArray(col)) {
                        var name = col[0];
                        var cols = col.slice(1);
                        var val = [];
                        if (v[name]) {
                            if (isObject(v[name])) {
                                var missed;
                                if ((missed = Object.keys(v[name]).filter(function(a) {
                                    return cols.indexOf(a) === -1
                                })).length > 0) {
                                    missed.forEach(function(a) {
                                        cols.push(a);
                                        columns[j].push(a);
                                    });
                                }
                                cols.forEach(function(na) {
                                    val.push(v[name][na]);
                                });
                                d.push(val);
                            } else {
                                d.push(v[name]);
                            }
                        } else {
                            d.push([]);
                        }
                    } else {
                        d.push(v[columns[j]]);
                    }
                }
                values.push(d);
            }
            compressedArr.push(columns);
            values.forEach(function(item) {
                columns.forEach(function(col, i) {
                    compressedArr.push(item[i]);
                });
            });
            return compressedArr;
        } else return value;
    }
};

JSONCompressor.reviver = {
    passive: function(key, value) {
        if (isObject(value) && value.$p) {
            var uncompressedValue = [];
            value.v.forEach(function(item) {
                var obj = {};
                value.c.forEach(function(c, i) {
                    obj[c] = item[i];
                });
                uncompressedValue.push(obj);
            });
            return uncompressedValue;
        } else return value;
    },
    aggresive: function(key, value) {
        if (Array.isArray(value) && value.length > 1 && value[0] == "$a") {
            var columns = value[1],
                objArr = [];
            for (var i = 2; i < value.length; i++) {
                var ri = i - 2;
                if (objArr[Math.floor(ri / columns.length)] == undefined) objArr[Math.floor(ri / columns.length)] = {};
                objArr[Math.floor(ri / columns.length)][columns[ri % columns.length]] = value[i];
            }
            return objArr;
        } else return value;
    },
    recursive: function(key, value) {
        if (Array.isArray(value) && value.length > 1 && value[0] == "$r") {
            var columns = value[1],
                objArr = [];
            for (var i = 2; i < value.length; i++) {
                var ri = i - 2;
                if (objArr[Math.floor(ri / columns.length)] == undefined) objArr[Math.floor(ri / columns.length)] = {};
                var col = columns[ri % columns.length];
                if (Array.isArray(col)) {
                    var val = value[i];
                    if (Array.isArray(val)) {
                        var newVal = {};
                        for (var j = 1; j < col.length; j++) {
                            newVal[col[j]] = val[j - 1];
                        }
                        objArr[Math.floor(ri / columns.length)][col[0]] = newVal;
                    } else {
                        objArr[Math.floor(ri / columns.length)][col[0]] = val;
                    }
                } else {
                    objArr[Math.floor(ri / columns.length)][col] = value[i];
                }
            }
            return objArr;
        } else return value;
    },
    combined: function(key, value) {
        var me = arguments.callee,
            val = value;
        Object.keys(JSONCompressor.reviver).forEach(function(name) {
            if (JSONCompressor.reviver[name] != me) {
                val = JSONCompressor.reviver[name](key, val);
            }
        });
        return val;
    }
};

JSONCompressor.compression = "passive";

JSONCompressor.parse = function(obj, type) {
    return JSON.parse(obj, JSONCompressor.reviver[type || "combined"]);
};

if (window) {
    window.JSONCompressor = JSONCompressor;
} else if (process && module) {
    module.exports = JSONCompressor;
}