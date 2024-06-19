!function(fn) {
    if ( typeof exports === "object" && typeof module !== "undefined" ) {
        module.exports = fn();

    } else if ( typeof define === "function" && define.amd ) {
        define([], fn);

    } else {
        var f;
        typeof window !== "undefined" ? f = window : 
            typeof global !== "undefined" ? f = global : 
                typeof self !== "undefined" ? f = self : f = {}, f.Promise = fn();
    }

}(function(undefined) {
    'use strict';

    var Utils = {
        runAsync: function(fn) {
            setTimeout(fn);
        },
        isFunc: function (v) {
            return typeof v === 'function';
        },
        isObj: function (v) {
            return v && typeof v === 'object';
        }
    };

    return typeof Promise !== 'undefined' && Utils.isFunc(Promise) ? Promise : (function() {
        var validStates = {
            PENDING: 'pending',
            FULFILLED: 'fulfilled',
            REJECTED: 'rejected'
        };

        //内部创建Promise的标识
        var INTERNAL = function () {};

        /**
         * 构造方法
         * @global
         * @constructor 
         * @param {function} executor 一个函数，用于初始化任务及决定promise何时被解决或被拒绝，executor函数会被立即执行。<br />
         *                            执行时传入两个函数参数：resolve和reject, 分别用于完成或拒绝相关联的Promise对象。<br />
         *                            其中resolve接收一个单一的参数，该参数将作为相关联的Promise对象的最终值；<br />
         *                            reject也接收一个单一的参数，该参数将作为相关联的Promise对象的拒因，通常是一个Error对象；<br />
         */
        function Promise(executor) {
            if (!Utils.isFunc(executor)) {
                throw new TypeError('the promise constructor requires a executor function\u000a\u000a    See http://goo.gl/EC22Yn\u000a');
            }
            if (this.constructor !== Promise) {//当以函数形式被调用时,即: Promise()
                throw new TypeError('the promise constructor cannot be invoked directly\u000a\u000a    See http://goo.gl/KsIlge\u000a');
            }
            
            var promise = this;
            this._state = validStates.PENDING;
            this._value = undefined;
            this._queue = []; //subsequent promises
            this._handlers = {
                fulfill: null,
                reject: null
            };

            if(executor !== INTERNAL) {
                executor(function(value) {
                    resolve(promise, value);
                }, function(value) {
                    reject(promise, value);
                });
            }
        }

        /**
         * 以指定值解决一个Promise对象
         * 
         * @memberOf Promise
         * @param  {Any} value 用于解决被返回的Promise对象的值, 当该值为Promise或thenbale时, 返回的Promise将接受其状态
         * @return {Promise} 一个以参数为值被解决的新的Promise对象
         */
        Promise.resolve = function(value) {
            if (this !== Promise) {//如 var f = Promise.all; f(); 则this为window或undefined
                throw new TypeError('Promise.all expects its this value refers to Promise!');
            }

            return new Promise(function (resolve) {
                resolve(value);
            });
        };

        /**
         * 以指定原因拒绝一个Promise对象
         * 
         * @memberOf Promise
         * @param  {Any} reason 拒因,用于拒绝被返回的Promise对象, 通常应为一个Error对象
         * @return {Promise} 一个以参数为因被拒绝的新的Promise对象
         */
        Promise.reject = function(reason) {
            if (this !== Promise) {//如 var f = Promise.all; f(); 则this为window或undefined
                throw new TypeError('Promise.all expects its this value refers to Promise!');
            }
            
            return new Promise(function (resolve, reject) {
                reject(reason);
            });
        };

        /**
         * 接受一组Promise(下文称为promises)作为参数, 返回一个新的Promise对象(称为p): <br />
         *     当promises中所有Promise都被完成时, p以一个数组作为结果被完成, 数组元素为promises中各Promise的值, 位置与Promise在promises中的位置一致; <br />
         *     当promises中任一Promise被拒绝时, p以相同的原因被拒绝.
         *     
         *     注：如果promises为空, 返回的Promise将立即被解决，值为空数组
         *     
         * @memberOf Promise
         * @param  {Array} promiseArray 需要等待的一组Promise
         * @return {Promise} 一个新的promise对象
         */
        Promise.all = function(promiseArray) {
            if (this !== Promise) {//如 var f = Promise.all; f(); 则this为window或undefined
                throw new TypeError('Promise.all expects its this value refers to Promise!');
            }

            var promise = new Promise(INTERNAL);
            if( !(promiseArray instanceof Array) ) {
                reject(promise, new TypeError('Invalid arguments to Promise.all, expect an array.'));
                return promise;
            }
            
            var result = [], 
                i = 0,
                length = promiseArray.length, //2
                needWait = length,
                rejectPromise = function(reason) {
                    reject(promise, reason);
                    needWait = 0;
                },
                addWait = function(elem, i) {
                    Promise.resolve(elem).then(function(value) {
                        result[i] = value;
                        needWait--;
                        if(!needWait) {
                            resolve(promise, result);
                        }

                    }, rejectPromise);
                };
            if(!length) {
                resolve(promise, []); 

            } else {
                for(; i < length; i++) {            
                    addWait(promiseArray[i], i);
                }
            }

            return promise;
        };

        /**
         * 接受一组Promise(下文称为promises)作为参数, 返回一个新的Promise对象(称为p), promises中的所有Promsie均处于竞争状态: <br />
         *     当promises中任一Promise被完成时, p以相同的值被完成; <br />
         *     当promises中任一Promise被拒绝时, p以相同的原因被拒绝. <br />
         *     
         *     注：如果promises为空 或 promises中没有任何Promise被解决，返回的Promise将永远不会被解决
         *
         * @memberOf Promise
         * @param  {Array} promiseArray 一组处于竞争状态的Promise
         * @return {Promise} 一个新的promise对象
         */
        Promise.race = function(promiseArray) {
            if (this !== Promise) {//如 var f = Promise.all; f(); 则this为window或undefined
                throw new TypeError('Promise.all expects its this value refers to Promise!');
            }
            
            var promise = new Promise(INTERNAL);
            if( !(promiseArray instanceof Array) ) {
                reject(promise, new TypeError('Invalid arguments to Promise.all, expect an array.'));
                return promise;
            }

            var i = 0,
                length = promiseArray.length,
                resolved = false,
                resolvePromise = function(value) {
                    if(!resolved) {
                        resolve(promise, value);
                        resolved = true; 
                    }
                },
                rejectPromise = function(reason) {
                    if(!resolved) {
                        reject(promise, reason);
                        resolved = true;
                    }
                };
            if(length) {
                for(; i < length; i++) {           
                    Promise.resolve(promiseArray[i]).then(resolvePromise, rejectPromise);
                }
            }

            return promise;
        };

        Promise.prototype = {
            constructor: Promise,

            /**
             * 为promise添加完成及拒绝回调, 返回一个新的promis
             * 
             * @memberOf Promise#
             * @param  {function} onFulfilled 完成回调，接受一个参数，参数值为Promise的结果
             * @param  {function} onRejected 拒绝回调, 接受一个参数，参数值为Promise的拒因
             * @return {Promise}  一个新的Promise对象
             */
            then: function(onFulfilled, onRejected) {
                var queuedPromise = new Promise(INTERNAL);

                if (Utils.isFunc(onFulfilled)) {
                    queuedPromise._handlers.fulfill = onFulfilled;
                }

                if (Utils.isFunc(onRejected)) {
                    queuedPromise._handlers.reject = onRejected;
                }

                this._queue.push(queuedPromise);
                process(this);

                return queuedPromise;
            },
            
            /**
             * 为promise添加拒绝回调, 返回一个新的promis
             * 
             * @memberOf Promise#
             * @param  {function} onRejected 拒绝回调, 接受一个参数，参数值为Promise的拒因
             * @return {Promise}  一个新的Promise对象
             */
            "catch": function( onRejected) {//ie6下catch直接写会报错
                return this.then(null, onRejected);
            }
        };

        //解决：实现或拒绝
        function resolve(promise, x) {
            if(x === promise) {
                reject(promise, new TypeError('The promise and its value refer to the same object'));
                            
            } else if(x instanceof Promise) {     
                if(x._state === validStates.PENDING) {
                    x.then(function(value) {
                        fulfill(promise, value);

                    }, function(reason) {
                        reject(promise, reason);
                    });

                } else {
                    transit(promise, x._state, x._value);
                }

            } else if(Utils.isObj(x) || Utils.isFunc(x)) {
                var called = false,
                    then;

                try {
                    then = x.then;
                    if (Utils.isFunc(then)) {   
                        then.call(x, function(y) {
                            if(!called) {
                                resolve(promise, y); 
                                called = true;
                            }
                        }, function(r) {
                            if(!called) {
                                reject(promise, r);
                                called = true;
                            }
                        });

                    } else {
                        fulfill(promise, x);
                    }   

                } catch(e) {
                    if(!called) {
                        reject(promise, e);
                        called = true;
                    }
                }

            } else {
                fulfill(promise, x);
            }           
        }

        //以value为值完成promise
        function fulfill(promise, value) {
            transit(promise, validStates.FULFILLED, value);
        }

        //以reason为因拒绝promise
        function reject(promise, reason) {
            transit(promise, validStates.REJECTED, reason);
        }

        //转换状态
        function transit(promise, state, value) {
            if (promise._state !== validStates.PENDING || !(state === validStates.REJECTED || state === validStates.FULFILLED)) {
                return;
            }

            promise._state = state;
            promise._value = value;
            process(promise);
        }

        //处理回调
        function process(promise) {
            if (promise._state === validStates.PENDING) {
                return;
            }

            var fulfillFallback = function (value) {
                    return value;
                },
                rejectFallback = function (reason) {
                    throw reason;
                },
                queuedPromise, 
                handler, 
                value;

            Utils.runAsync(function() {
                while(promise._queue.length) {
                    queuedPromise = promise._queue.shift();
                    handler = promise._state === validStates.FULFILLED ? 
                        (queuedPromise._handlers.fulfill || fulfillFallback) : (queuedPromise._handlers.reject || rejectFallback);

                    try {
                        value = handler(promise._value);
                    } catch(e) {
                        reject(queuedPromise, e);
                        continue;
                    }

                    resolve(queuedPromise, value);
                }
            });
        }

        return Promise;
    })();
});