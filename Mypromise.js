;(() => {
  const PENDING = 'pending'
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'

  function MyPromise(executor) {
    const self = this
    self.status = PENDING
    self.data = undefined
    self.callbacks = []
    executor(resolve, reject)

    function resolve(value) {
      if (self.status !== PENDING) return

      self.status = RESOLVED
      self.data = value

      setTimeout(() => {
        self.callbacks.forEach(cbObj => {
          cbObj.onResolved(self.data)
        })
      })
    }

    function reject(reason) {
      if (self.status !== PENDING) return

      self.status = REJECTED
      self.data = reason

      setTimeout(() => {
        self.callbacks.forEach(cbObj => {
          cbObj.onRejected(self.data)
        })
      })
    }
  }

  /**
   * then的返回值：
   *  返回值是一个新的MyPromise实例，该实例的状态、数据由onResolved或onRejected的返回值决定
   *    - 如果onResolved或onRejected抛出异常，新MyPromise实例的状态为rejected，reason为抛出的异常
   *    - 如果返回值是非MyPromise类型的值，新MyPromise实例的状态为resolved，value为该非MyPromise类型的值
   *    - 如果返回值是MyPromise类型，新MyPromise实例的状态和数据与该MyPromise类型一致
   */
  MyPromise.prototype.then = function (onResolved, onRejected) {
    const self = this

    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : reason => {
            throw reason
          }

    onResolved = typeof onResolved === 'function' ? onResolved : value => value

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

  MyPromise.prototype.catch = function (onRejected) {
    return this.then(undefined, onRejected)
  }

  /**
   * 返回值是一个新的MyPromise实例p，该实例的状态和数据由参数决定：
   *  - 如果参数是一个非MyPromise实例的值val，则p的状态为resolved，数据为val
   *  - 如果参数是一个MyPromise实例Q，则p的状态和数据与Q相同
   */
  MyPromise.resolve = function (value) {
    return new MyPromise((resolve, reject) => {
      if (value instanceof MyPromise) {
        value.then(resolve, reject)
      } else {
        resolve(value)
      }
    })
  }

  /**
   * 返回值是一个新的状态为rejected的MyPromise实例p，该实例的数据等于参数
   */
  MyPromise.reject = function (reason) {
    return new MyPromise((resolve, reject) => {
      reject(reason)
    })
  }

  /**
   * 参数是一个数组，数组中每一项都是一个MyPromise实例
   * 返回值是新的MyPromise实例p，p的状态和数据由数组中的MyPromise实例的状态和数据决定
   *  - 遍历数组中所有元素
   *  - 如果遇到一个MyPromise实例状态为rejected，则p的状态和数据和该MyPromise实例相同
   *  - 如果所有元素都是状态为resolved的MyPromise实例，则p的状态为resolved，值为所有value组成的数组
   */
  MyPromise.all = function (myPromiseArr) {
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

  /**
   * 参数是一个数组，数组中每一项都是一个MyPromise实例
   * 返回值是新的MyPromise实例p，p的状态和数据由数组中最先确定状态的MyPromise实例的状态和数据决定
   */
  MyPromise.race = function (myPromiseArr) {
    return new MyPromise((resolve, reject) => {
      myPromiseArr.forEach(myPromise => {
        myPromise.then(resolve, reject)
      })
    })
  }

  window.MyPromise = MyPromise
})()
