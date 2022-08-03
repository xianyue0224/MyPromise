;(() => {
  const PENDING = 'pending'
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'

  class MyPromise {
    self = this

    constructor(executor) {
      this.status = PENDING
      this.data = undefined
      this.callbacks = []
      executor(this.#resolve, this.#reject)
    }

    #resolve(value) {
      if (self.status !== PENDING) return

      self.status = RESOLVED
      self.data = value

      setTimeout(() => {
        self.callbacks.forEach(cbObj => {
          cbObj.onResolved(self.data)
        })
      })
    }

    #reject(reason) {
      if (self.status !== PENDING) return

      self.status = REJECTED
      self.data = reason

      setTimeout(() => {
        self.callbacks.forEach(cbObj => {
          cbObj.onRejected(self.data)
        })
      })
    }

    then(onResolved, onRejected) {
      const self = this

      onRejected =
        typeof onRejected === 'function'
          ? onRejected
          : reason => {
              throw reason
            }

      onResolved =
        typeof onResolved === 'function' ? onResolved : value => value

      return new MyPromise((resolve, reject) => {
        function handle(cb) {
          try {
            let result = cb(self.data)
            if (result instanceof MyPromise) {
              result.then(resolve, reject)
            } else {
              resolve(result)
            }
          } catch (error) {
            reject(error)
          }
        }

        if (self.status === RESOLVED) {
          setTimeout(() => {
            handle(onResolved)
          })
        } else if (self.status === REJECTED) {
          setTimeout(() => {
            handle(onRejected)
          })
        } else {
          self.callbacks.push({
            onResolved: function () {
              handle(onResolved)
            },
            onRejected: function () {
              handle(onRejected)
            }
          })
        }
      })
    }

    catch(onRejected) {
      return this.then(undefined, onRejected)
    }

    static resolve(value) {
      return new MyPromise((resolve, reject) => {
        if (value instanceof MyPromise) {
          value.then(resolve, reject)
        } else {
          resolve(value)
        }
      })
    }

    static reject(reason) {
      return new MyPromise((resolve, reject) => {
        reject(reason)
      })
    }

    static all(myPromiseArr) {
      return new MyPromise((resolve, reject) => {
        let resolvedCount = 0
        let values = []
        myPromiseArr.forEach((myPromise, idx) => {
          myPromise.then(
            value => {
              resolvedCount++
              values[idx] = value
              if (resolvedCount === myPromiseArr.length) {
                resolve(values)
              }
            },
            reason => {
              reject(reason)
            }
          )
        })
      })
    }

    static race(myPromiseArr) {
      return new MyPromise((resolve, reject) => {
        myPromiseArr.forEach(myPromise => {
          myPromise.then(resolve, reject)
        })
      })
    }
  }

  window.MyPromise = MyPromise
})()
