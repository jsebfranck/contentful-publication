'use strict';

exports.requireModule = function (path) {
  var modulePath = (process.env.USE_CODE_COVERAGE ? '../lib-cov/' : '../lib/') + path;
  return require(modulePath);
};
