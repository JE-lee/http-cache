let OneTimer = require('one-timer')

class HttpGConfig{
  constructor({url, payload, maxAge, method }){
    this.key = this.generateKey({ url, payload })
    this.url = url
    this.payload = payload
    this.method = method
    this.maxAge = maxAge
  }
  generateKey(){
    return JSON.stringify(arguments[0])
  }
  isEqual(httpConfig){
    return httpConfig.key === this.key
  }
}

module.exports =  class HttpGCache{
  constructor(){
    this.store = new Map()
    this.timer = new OneTimer()
  }
  /**
   * 
   * @param {*} maxAge | 单位s 
   * @param {*} request | 发起http请求的回调函数，接受一个参数{url, method, payload, maxAge }
   */
  // eslint-disable-next-line no-unused-vars
  request({url, method, payload, maxAge = 0 }, request){
    // 限定只对'GET' 请求做缓存
    if(method.toUpperCase() != 'GET') return Promise.reject('request method must be GET')
    let httpConfig = new HttpGConfig(arguments[0]),
      { key, ...config } = httpConfig
    // 如果有缓存， 直接返回缓存的结果
    if(this.store.has(key)) return this.store.get(key).promise
    let promise = request(arguments[0]).catch(() => {
      this.remove(key)
      return Promise.reject(arguments[0])
    })
    this.push(key, {
      ...config,
      // 发起真正的请求
      promise,
      // 设定超时
      timerid: this.timer.setTimeout(() => this.remove(key),maxAge * 1000),
      request
    })
    return promise
  }
  push(key, value){
    // 限定存储1000个
    const max = 1000, deleteCount = 100
    if (this.store.size >= max){
      let count = 0
      for(let key of this.store.keys()){
        this.store.delete(key)
        if(++count >= deleteCount) break
      }
    }
    this.store.set(key, value)
  }
  remove(key){
    if(this.store.has(key)){
      // 清空超时设置
      this.timer.clearTimeout(this.store.get(key).timerid)
      this.store.delete(key)
    }
  }
  /**
   * 
   * @param {Function} callback | removeFilter(callback(url, payload, method)) 
   * payload 相当于GET请求的params
   */
  removeFilter(callback){
    let httpConfigs = []
    for(let [key, { url, method, payload }] of this.store){
      if(callback(url, payload, method)){
        httpConfigs.push(this.store.get(key))
        //this.store.delete(key)
        this.remove(key)
      }
    }
    return httpConfigs
  }
  get size(){
    return this.store.size
  }
}
