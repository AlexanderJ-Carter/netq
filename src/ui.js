'use strict';

const chalk = require('chalk');
const Table = require('cli-table3');

let colorEnabled = !process.env.NO_COLOR;

function setColorEnabled(enabled) {
  colorEnabled = Boolean(enabled);
}

function colorize(fn, text) {
  const s = String(text ?? '');
  return colorEnabled ? fn(s) : s;
}

function brand() {
  return colorize(chalk.bold.cyan, 'netq') + colorize(chalk.gray, ' · ') + colorize(chalk.gray, '交互式网络排查');
}

function title(text) {
  return colorize(chalk.bold.cyan, text);
}

function ok(text) {
  return colorize(chalk.green, text);
}

function warn(text) {
  return colorize(chalk.yellow, text);
}

function err(text) {
  return colorize(chalk.red, text);
}

function dim(text) {
  return colorize(chalk.gray, text);
}

function info(text) {
  return colorize(chalk.cyan, text);
}

function termWidth() {
  const w = Number(process.stdout && process.stdout.columns);
  if (!Number.isFinite(w) || w < 60) return 80;
  return Math.min(140, w);
}

function hr() {
  return dim('—'.repeat(Math.max(40, termWidth() - 2)));
}

function clear() {
  // 在大多数终端里足够好；不强依赖第三方 clear 包
  // eslint-disable-next-line no-console
  console.clear();
}

function kvTable(rows, { head = ['字段', '值'] } = {}) {
  const w = termWidth();
  const left = Math.max(16, Math.min(28, Math.floor(w * 0.28)));
  const right = Math.max(30, w - left - 6);
  const t = new Table({
    head,
    style: { head: ['cyan'] },
    wordWrap: true,
    colWidths: [left, right]
  });
  for (const [k, v] of rows) t.push([k, v]);
  return t.toString();
}

function listTable(head, rows) {
  const t = new Table({
    head,
    style: { head: ['cyan'] },
    wordWrap: true
  });
  for (const r of rows) t.push(r);
  return t.toString();
}

module.exports = {
  setColorEnabled,
  brand,
  title,
  ok,
  warn,
  err,
  info,
  dim,
  hr,
  clear,
  kvTable,
  listTable
};

