# parse-json-response

Gather up a JSON response from a server, and call the cb

## USAGE

```javascript
var parse = require('parse-json-response')

// Handy response-event-handler function returny thing

// parse(cb) -> function(res)
http.get(someApi, parse(function(er, data, res) {
  if (er)
    console.error('it failed', res.headers, er)
  else
    console.error('it worked', res.headers, data)
}))

// or, if you have the response object somehow already

http.get(someApi, function(res) {
  // parse(res, cb) -> null
  parse(res, function(er, data) {
    if (er)
      console.error('it failed', res.headers, er)
    else
      console.error('it worked', res.headers, data)
  })
})
```

If the response statusCode is not in the 2xx range, then it's assumed
to be an error, and will create an error object.  The error object
returned is decorated with `statusCode`.  The `data` arg is always set
if the response body was parseable.
