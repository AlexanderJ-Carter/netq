'use strict';

const { printJson } = require('./_output');
const { runPublicIp } = require('./public-ip');
const { runDns } = require('./dns');
const { runTcp } = require('./tcp');
const { runHttp } = require('./http');
const { runListening } = require('./listening');
const { runDoctor } = require('./doctor');
const { runPing } = require('./ping');
const { runTraceroute } = require('./traceroute');
const { runInterfaces } = require('./interfaces');
const {
  runFavoritesList,
  runFavoritesAdd,
  runFavoritesRemove,
  runFavoritesRun
} = require('./favorites');

module.exports = {
  printJson,
  runPublicIp,
  runDns,
  runTcp,
  runHttp,
  runListening,
  runDoctor,
  runPing,
  runTraceroute,
  runInterfaces,
  runFavoritesList,
  runFavoritesAdd,
  runFavoritesRemove,
  runFavoritesRun
};
