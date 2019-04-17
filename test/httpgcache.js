let HttpGCache = require('../src/index') 
let assert = require('assert')

const SUCCESS = 'SUCCESS'
const FAIL = 'FAIL'

let requestCount = 0 // 全局检测发起了多少次请求


function request(url, params, status = SUCCESS){
  requestCount ++
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (status === SUCCESS) {
        resolve(params)
      } else {
        reject(params)
      } 
    }, 50)
  })
}

describe('httpgcache', function(){
  it('#test1', function(done){
    this.timeout(100)
    requestCount = 0
    let url = 'https://api.xcxzhan.com/site/manager/view',
      params = { sid: 96325, op: 'view' },
      httpGCache = new HttpGCache(),
      resolves = [],
      fn = () => {
        return httpGCache.request({
          url,
          method: 'GET',
          payload: params,
          maxAge: 3
        }, ({url, payload }) => request(url,payload,SUCCESS)).then(res => resolves.push(res))
      }
    Promise.all(Array(6).fill('').map(() => fn())).then(() => {
      assert.ok(resolves.length === 6, '应该resolve 6次')
      assert.ok(resolves[0] == params, 'resolve的结果错误 --0')
      assert.ok(resolves[3] == params, 'resolve的结果错误 --3')
      assert.equal(requestCount, 1, '应该只发次一次真正的请求')
      done()
    })

  })
  it('#test2', function (done) {
    this.timeout(4000)
    requestCount = 0
    let url = 'https://api.xcxzhan.com/site/manager/view',
      params1 = { sid: 96325, op: 'view' },
      params2 = { sid: 985623 },
      httpGCache = new HttpGCache()
    
    // 发起请求1 ，reject
    httpGCache.request({
      url,
      method: 'GET',
      payload: params1,
      maxAge: 1
    }, ({ url, payload }) => request(url,payload, FAIL))

    // 发起请求1，resolve
    httpGCache.request({
      url,
      method: 'GET',
      payload: params1,
      maxAge: 1
    }, ({ url, payload }) => request(url, payload, SUCCESS))

    assert.ok(requestCount, 2, '应该要发起两次真正的请求')
    // 发起请求2， resolve
    httpGCache.request({
      url,
      method: 'GET',
      payload: params2,
      maxAge: 1.5
    }, ({ url, payload }) => request(url, payload, SUCCESS))

    assert.ok(requestCount, 3, '应该要发起3次真正的请求')

    // 清除请求1的缓存
    httpGCache.removeFilter((u, payload) => url == u && payload.sid == params1.sid)
    // 再次发起请求1, resolve
    httpGCache.request({
      url,
      method: 'GET',
      payload: params1,
      maxAge: 1
    }, ({ url, payload }) => request(url, payload, SUCCESS))

    assert.ok(requestCount, 4, '应该要发起4次真正的请求')

    // 请求1 超时之后再次发起请求1，resolve
    setTimeout(() => {
      httpGCache.request({
        url,
        method: 'GET',
        payload: params1,
        maxAge: 1
      }, ({ url, payload }) => request(url, payload, SUCCESS))
      assert.ok(requestCount, 5, '应该要发起5次真正的请求')
      done()
    }, 3000)
  })
  it('#test3', function(done){
    let httpGCache = new HttpGCache()
    let fn = (size) => Array(size).fill('').map((item, index) => {
      httpGCache.request({
        url: 'http://api.com/site',
        method: 'get',
        payload: {
          sid: index + 8000
        },
        maxAge: 20
      }, () => Promise.resolve())
    })
    fn(500)
    assert.equal(httpGCache.size, 500, '缓存的数量应该是500')
    fn(1000)
    assert.equal(httpGCache.size, 1000, '缓存的数量应该是1000')
    fn(1500)
    assert.equal(httpGCache.size, 1000, '缓存的数量应该是1000')
    done()

  })
})

