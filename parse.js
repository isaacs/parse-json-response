module.exports = parseJsonRes

var once = require('once')

function parseJsonRes (res, cb) {
  if (typeof res === 'function') {
    cb = res
    return function onResponse(res) {
      handler(res, cb)
    }
  } else {
    handler(res, cb)
  }
}

function handler(res, cb) {
  cb = once(cb)

  var json = ''
  res.setEncoding('utf8')
  res.on('data', function(c) {
    json += c
  })

  res.on('error', cb)

  res.on('end', function() {
    var er = null
    try {
      var data = JSON.parse(json)
    } catch (er) {
      var e = new Error('Invalid JSON\n' + json + '\n' + er.stack + '\n')
      e.statusCode = res.statusCode
      e.body = json
      return cb(e, null, res)
    }
    if (res.statusCode > 299 || res.statusCode < 200) {
      er = new Error(json)
      er.statusCode = res.statusCode
    }
    cb(er, data, res)
  })
}
