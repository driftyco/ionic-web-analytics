# ionic-web-analytics

An Express middleware for sending request analytics data to Google BigQuery.

## Usage

Download the package.

```sh
npm install driftyco/ionic-web-analytics
```

Generate the middleware function and use in application.

```js
let WebAnalytics = require('ionic-web-analytics')
let analytics = WebAnalytics(appId, checkRequest, config)

app.use(analytics)
```

For authentication with BigQuery, ensure the `BIGQUERY_CLIENT_EMAIL` and `BIGQUERY_PRIVATE_KEY` environment variables are set. These can be pulled from the JSON keyfile generated on BigQuery for service accounts. If either environment variable is missing, analytics will be disabled and the middleware will simply pass the request along.

## API

### appId

Required. A `string` identifier of the application corresponding to the desired table on BigQuery. 

### checkRequest

Required. A `function` that takes an express `request` object as a parameter and returns a `boolean`. The function should return `true` if analytics should be gathered on said request and `false` otherwise.

### config

Optional. An object containing various configuration options.

#### config.batchSize

Integer between 1 and 500. The number of requests to buffer before sending to BigQuery. Defaults to 1.

#### config.dataset

`string` dataset identifier for BigQuery. Defaults to `Ionic_Websites`.

#### config.errorHandler

A `function` that will be called on error and passed the corresponding BigQuery error object. Logs the error by default.

#### config.projectId

`string` project identifier for BigQuery. Defaults to `ionic-stats-storage`.

