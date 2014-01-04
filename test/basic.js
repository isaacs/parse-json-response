var test = require('tap').test
var parse = require('../parse.js')
var http = require('http')
var server

var reqs = []

test('setup', function(t) {
  server = http.createServer(function(req, res) {
    var s = req.method + ' ' + req.url
    reqs.push(s)
    res.setHeader('connection', 'close')

    switch (s) {
      case 'GET /ok':
        res.statusCode = 200
        res.end(JSON.stringify({ ok: true }))
        break

      case 'PUT /ok':
        res.statusCode = 201
        req.resume()
        req.on('end', function() {
          res.end(JSON.stringify({ created: true }))
        })
        break

      case 'GET /404':
        res.statusCode = 404
        res.end(JSON.stringify({ error: 'missing' }))
        break

      case 'PUT /403':
        res.statusCode = 403
        req.resume()
        req.on('end', function() {
          res.end(JSON.stringify({ error: 'forbidden' }))
        })
        break

      case 'GET /stream':
        res.statusCode = 200
        var body = JSON.stringify({ ok: 'stream' }).split('')
        setTimeout(function T() {
          var b = body.shift()
          if (b) {
            res.write(b, 'ascii')
            setTimeout(T)
          } else
            res.end()
        })
        break

      case 'GET /not-json':
        res.statusCode = 200
        res.end('this is not json')
        break

      default:
        throw new Error('unexpect')
    }
  }).listen(1337, function() {
    t.pass('listening')
    t.end()
  })
})

test('GET /ok', function(t) {
  var n = 2
  http.get('http://localhost:1337/ok', parse(cb))
  http.get('http://localhost:1337/ok', function(res) {
    parse(res, cb)
  })

  function cb(er, data, res) {
    t.same(data, { ok: true })
    t.equal(res.statusCode, 200)
    t.equal(er, null)

    if (--n === 0)
      t.end()
  }
})

test('GET /404', function(t) {
  var n = 2
  http.get('http://localhost:1337/404', parse(cb))
  http.get('http://localhost:1337/404', function(res) {
    parse(res, cb)
  })

  function cb(er, data, res) {
    t.same(data, { error: 'missing' })
    t.equal(res.statusCode, 404)
    t.notEqual(er, null)

    if (--n === 0)
      t.end()
  }
})

test('PUT /ok', function(t) {
  http.request({
    method: 'PUT',
    port: 1337,
    path: '/ok'
  }, parse(function(er, data, res) {
    t.same(data, { created: true })
    t.equal(res.statusCode, 201)
    t.equal(er, null)
    t.end()
  })).end('blerg')
})

test('PUT /403', function(t) {
  http.request({
    method: 'PUT',
    port: 1337,
    path: '/403'
  }, parse(function(er, data, res) {
    t.equal(res.statusCode, 403)
    t.equal(er.statusCode, 403)
    t.same(data, { error: 'forbidden' })
    t.end()
  })).end('blerg')
})

test('GET /stream', function(t) {
  http.request({
    port: 1337,
    path: '/stream'
  }, parse(function(er, data, res) {
    t.equal(res.statusCode, 200)
    t.equal(er, null)
    t.same(data, { ok: 'stream' })
    t.end()
  })).end()
})

test('GET /not-json', function(t) {
  http.get('http://localhost:1337/not-json', function(res) {
    parse(res, function(er, data, res2) {
      t.equal(res, res2)
      t.equal(data, null)
      t.equal(er.body, 'this is not json')
      t.end()
    })
  })
})


test('done', function(t) {
  server.close(function() {
    t.same(reqs, [
      'GET /ok',
      'GET /ok',
      'GET /404',
      'GET /404',
      'PUT /ok',
      'PUT /403',
      'GET /stream',
      'GET /not-json'
    ])
    t.end()
  })
})
