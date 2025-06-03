const functions = require('firebase-functions');
const { https } = require('firebase-functions');
const next = require('next');
const express = require('express');

const app = express();
const nextjsApp = next({
  dev: false,
  conf: {
    distDir: '.next',
  },
});
const handle = nextjsApp.getRequestHandler();

app.all('*', (req, res) => {
  return handle(req, res);
});

exports.nextServer = https.onRequest(async (req, res) => {
  await nextjsApp.prepare();
  return app(req, res);
}); 