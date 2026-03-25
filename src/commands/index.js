'use strict';

const { runPublicIp } = require('./public-ip');
const { runDns, printJson } = require('./dns');
const { runTcp } = require('./tcp');
const { runHttp } = require('./http');
const { runListening } = require('./listening');
const { runDoctor } = require('./doctor');

module.exports = {
  runPublicIp,
  runDns,
  runTcp,
  runHttp,
  runListening,
  runDoctor,
  printJson
};
