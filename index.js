var BigQuery = require('@google-cloud/bigquery');
var uuid     = require('uuid');
var cookie   = require('cookie');

module.exports = function (appId, isValidRequest, opts) {

  opts = opts || {};

  // input validation
  if (!appId || typeof appId !== 'string')
    throw new Error('first arg is required must be a valid app ID string')

  if (!isValidRequest || typeof isValidRequest !== 'function')
    throw new Error('second arg is required and must be a function')

  var projectId = opts.projectId || 'ionic-stats-storage';
  if (typeof projectId !== 'string')
    throw new Error('projectId must be a valid project id string')

  var datasetId = opts.dataset || 'Ionic_Websites';
  if (typeof datasetId !== 'string')
    throw new Error('dataset must be a valid dataset name string')

  var batchSize = opts.batchSize || 1;
  if (typeof batchSize !== 'number' || Math.floor(batchSize) !== batchSize
      || batchSize > 500 || batchSize < 1) {
        throw new Error('batchSize must be an integer between 1 and 500');
      }

  var errorHandler = opts.errorHandler || console.log.bind(null, 'BigQuery error: ');
  if (typeof errorHandler !== 'function') {
    throw new Error('errorHandler must be a function')
  }

  // set up BigQuery
  var project = BigQuery({
    projectId: projectId,
    credentials: {
      client_email: process.env.BIGQUERY_CLIENT_EMAIL,
      private_key: process.env.BIGQUERY_PRIVATE_KEY
    }
  });
  var dataset = project.dataset(datasetId);
  var table = dataset.table(appId);

  // set up buffer
  var buffer = [];

  function formatEntry (req) {
    var entry = {};

    // set fields
    entry.id = uuid.v4();
    entry.event_timestamp = Math.floor(Date.now() / 1000);
    entry.page_url = req.protocol + '://' + req.get('host') + req.url;

    if (req.session && req.session.user && req.session.user.id) {
      entry.user_id = req.session.user.id.toString();
    } else {
      entry.user_id = null;
    }

    // gather headers
    var headers = {
      ip: req.ip || null,
      userAgent: req.get('User-Agent') || null,
      referer: req.get('Referer') || null,
      cacheControl: req.get('Cache-Control') || null,
      language: req.get('Accept-Language') || null,
      encoding: req.get('Accept-Encoding') || null,
      googleAnalytics:  cookie.parse(req.get('Cookie'))._ga || null
    };

    entry.data = JSON.stringify(headers);

    return entry;
  }

  function drainBuffer () {
    table.insert(buffer, function (err, errObj) {
      if (err) {
        errorHandler(err);
      }
    });
    buffer = [];
  }

  return function (req, res, next) {
    if (isValidRequest(req)) {
      buffer.push(formatEntry(req));
      if (buffer.length >= batchSize) {
        drainBuffer();
      }
    }
    next();
  };
};
