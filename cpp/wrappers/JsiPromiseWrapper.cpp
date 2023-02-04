#include "JsiPromiseWrapper.h"

#include "JsiObjectWrapper.h"
#include "JsiWorkletContext.h"

#include <utility>

namespace RNWorklet {

namespace jsi = facebook::jsi;

size_t JsiPromiseWrapper::Counter = 1000;

JsiPromiseWrapper::JsiPromiseWrapper(
    jsi::Runtime &runtime,
    std::function<void(
        jsi::Runtime &runtime,
        std::function<void(jsi::Runtime &runtime, const jsi::Value &val)>
            resolve,
        std::function<void(jsi::Runtime &runtime, const jsi::Value &reason)>
            reject)>
        computation)
    : JsiWrapper(runtime, jsi::Value::undefined(), nullptr) {

  _counter = ++Counter;
  printf("promise: CTOR JsiPromiseWrapper %zu\n", _counter);

  // Set type
  setType(JsiWrapperType::Promise);

  // Run the compute function to start resolving the promise
  auto resolve = std::bind(&JsiPromiseWrapper::onFulfilled, this,
                           std::placeholders::_1, std::placeholders::_2);

  auto reject = std::bind(&JsiPromiseWrapper::onRejected, this,
                          std::placeholders::_1, std::placeholders::_2);
  try {
    computation(runtime, resolve, reject);
  } catch (const jsi::JSError &err) {
    // TODO: Handle Stack!!
    reject(runtime, jsi::String::createFromUtf8(runtime, err.getMessage()));
  } catch (const std::exception &err) {
    std::string a = typeid(err).name();
    std::string b = typeid(jsi::JSError).name();
    if (a == b) {
      const auto *jsError = static_cast<const jsi::JSError *>(&err);
      auto message = jsError->getMessage();
      // TODO: Handle Stack!!
      reject(runtime, jsi::String::createFromUtf8(runtime, message));
    } else {
      // TODO: Handle Stack!!
      reject(runtime, jsi::String::createFromUtf8(runtime, err.what()));
    }
  } catch (...) {
    reject(runtime, jsi::String::createFromUtf8(
                        runtime, "Unknown error in promise constructor."));
  }
}

JsiPromiseWrapper::~JsiPromiseWrapper() {
  printf("promise: Dtor JsiPromiseWrapper %zu\n", _counter);
}

/**
 Returns true if the object is a thenable object - ie. an object with a then
 function. Which is basically what a promise is.
 */
bool JsiPromiseWrapper::isThenable(jsi::Runtime &runtime, jsi::Object &obj) {
  auto then = obj.getProperty(runtime, ThenPropName);
  if (then.isObject() && then.asObject(runtime).isFunction(runtime)) {
    return true;
  }
  return false;
}

/**
 Returns true if the object is a thenable object - ie. an object with a then
 function. Which is basically what a promise is.
 */
bool JsiPromiseWrapper::isThenable(jsi::Runtime &runtime, jsi::Value &value) {
  if (value.isObject()) {
    auto then = value.asObject(runtime).getProperty(runtime, ThenPropName);
    if (then.isObject() && then.asObject(runtime).isFunction(runtime)) {
      return true;
    }
    return false;
  }
  return false;
}

/**
 Creates a wrapped promise that is resolved with the given value
 */
std::shared_ptr<JsiPromiseWrapper>
JsiPromiseWrapper::resolve(jsi::Runtime &runtime,
                           std::shared_ptr<JsiWrapper> value) {
  auto retVal = std::make_shared<JsiPromiseWrapper>(
      runtime, jsi::Value::undefined(), nullptr);
  retVal->setType(JsiWrapperType::Promise);
  retVal->onFulfilled(runtime, value->unwrap(runtime));
  return retVal;
}

/**
 Creates a wrapped promise that is rejected with the given reason
 */
std::shared_ptr<JsiPromiseWrapper>
JsiPromiseWrapper::reject(jsi::Runtime &runtime,
                          std::shared_ptr<JsiWrapper> reason) {
  auto retVal = std::make_shared<JsiPromiseWrapper>(
      runtime, jsi::Value::undefined(), nullptr);
  retVal->setType(JsiWrapperType::Promise);
  retVal->onRejected(runtime, reason->unwrap(runtime));
  return retVal;
}

jsi::Value JsiPromiseWrapper::then(jsi::Runtime &runtime,
                                   const jsi::Value &thisValue,
                                   const jsi::Value *thenFn,
                                   const jsi::Value *catchFn) {
  auto rtPtr = &runtime;
  auto thisWrapper = JsiWrapper::wrap(runtime, thisValue);
  auto thenHostFn = [rtPtr, func = std::make_shared<jsi::Function>(
                                thenFn->asObject(runtime).asFunction(runtime))](
                        jsi::Runtime &runtime, const jsi::Value &thisValue,
                        const jsi::Value *arguments, size_t count) {
    assert(&runtime == rtPtr && "Expected same runtime ptr!");
    return func->call(runtime, arguments, count);
  };

  jsi::HostFunctionType catchHostFn;
  if (catchFn && catchFn->isObject() &&
      catchFn->asObject(runtime).isFunction(runtime)) {
    catchHostFn = [func = std::make_shared<jsi::Function>(
                       catchFn->asObject(runtime).asFunction(runtime))](
                      jsi::Runtime &runtime, const jsi::Value &thisValue,
                      const jsi::Value *arguments, size_t count) {
      return func->call(runtime, arguments, count);
    };
  }

  return jsi::Object::createFromHostObject(
      runtime, then(runtime, std::move(thisWrapper), std::move(thenHostFn),
                    std::move(catchHostFn)));
}

std::shared_ptr<JsiPromiseWrapper> JsiPromiseWrapper::then(
    jsi::Runtime &runtime, std::shared_ptr<JsiWrapper> thisValue,
    const jsi::HostFunctionType &thenFn, const jsi::HostFunctionType &catchFn) {

  auto controlledPromise = std::make_shared<JsiPromiseWrapper>(runtime, this);

  _thenQueue.push_back({
      .controlledPromise = controlledPromise,
      .fulfilledFn = std::move(thenFn),
      .catchFn = std::move(catchFn),
  });

  if (_state == PromiseState::Fulfilled) {
    propagateFulfilled(runtime);
  } else if (_state == PromiseState::Rejected) {
    propagateRejected(runtime);
  }

  return controlledPromise;
}

jsi::Value JsiPromiseWrapper::finally(jsi::Runtime &runtime,
                                      const jsi::Value &thisValue,
                                      const jsi::Value *sideEffectFn) {
  // FIXME: Align with then()
  if (_state != PromiseState::Pending) {
    if (sideEffectFn && sideEffectFn->isObject() &&
        sideEffectFn->asObject(runtime).isFunction(runtime)) {
      auto fn = sideEffectFn->asObject(runtime).asFunction(runtime);
      if (thisValue.isObject()) {
        fn.callWithThis(runtime, thisValue.asObject(runtime));
      } else {
        fn.call(runtime);
      }
    }

    return _state == PromiseState::Fulfilled
               ? JsiPromiseWrapper::resolve(runtime, _value)->unwrap(runtime)
               : JsiPromiseWrapper::reject(runtime, _reason)->unwrap(runtime);
  }

  auto controlledPromise = std::make_shared<JsiPromiseWrapper>(runtime, this);

  _finallyQueue.push_back({
      .controlledPromise = controlledPromise,
      .sideEffectFn =
          sideEffectFn
              ? std::make_shared<jsi::Function>(
                    sideEffectFn->asObject(runtime).asFunction(runtime))
              : nullptr,
  });

  return jsi::Object::createFromHostObject(runtime, controlledPromise);
}

/*
 Converts to a promise
 */
jsi::Value JsiPromiseWrapper::getValue(jsi::Runtime &runtime) {
  return jsi::Object::createFromHostObject(runtime, shared_from_this());
}

/**
 Converts from a promise
 */
void JsiPromiseWrapper::setValue(jsi::Runtime &runtime,
                                 const jsi::Value &value) {
  setType(JsiWrapperType::Promise);

  auto obj = value.asObject(runtime);

  auto callingContext = JsiWorkletContext::getCurrent();

  auto maybeThenFunc = obj.getProperty(runtime, ThenPropName);
  if (!maybeThenFunc.isObject() ||
      !maybeThenFunc.asObject(runtime).isFunction(runtime)) {
    throw jsi::JSError(runtime, "Expected a thenable object.");
  }
  auto thenFn = callingContext->createCallInContext(runtime, maybeThenFunc);

  auto maybeCatchFunc = obj.getProperty(runtime, CatchPropName);
  if (maybeCatchFunc.isObject() &&
      maybeCatchFunc.asObject(runtime).isFunction(runtime)) {
    // We have catch and then
    auto catchFn = callingContext->createCallInContext(runtime, maybeCatchFunc);
    then(runtime, JsiWrapper::wrap(runtime, jsi::Value::undefined()), thenFn,
         catchFn);
  } else {
    // Only have then function
    then(runtime, JsiWrapper::wrap(runtime, jsi::Value::undefined()), thenFn,
         nullptr);
  }
}

void JsiPromiseWrapper::propagateFulfilled(jsi::Runtime &runtime) {
  printf("promise %zu: propagateFulfilled queue: %zu\n", _counter,
         _thenQueue.size());

  for (auto &item : _thenQueue) {
    if (item.fulfilledFn != nullptr) {
      // Function
      auto arg = _value->unwrap(runtime);
      jsi::Value valueOrPromise =
          item.fulfilledFn(runtime, jsi::Value::undefined(),
                           static_cast<const jsi::Value *>(&arg), 1);

      if (isThenable(runtime, valueOrPromise)) {
        auto thenFn = valueOrPromise.asObject(runtime).getPropertyAsFunction(
            runtime, ThenPropName);

        auto resolve = jsi::Function::createFromHostFunction(
            runtime, jsi::PropNameID::forUtf8(runtime, ThenPropName), 1,
            [controlledPromise = item.controlledPromise](
                jsi::Runtime &runtime, const jsi::Value &thisValue,
                const jsi::Value *arguments, size_t count) {
              controlledPromise->onFulfilled(runtime, arguments[0]);
              return jsi::Value::undefined();
            });

        auto reject = jsi::Function::createFromHostFunction(
            runtime, jsi::PropNameID::forUtf8(runtime, CatchPropName), 1,
            [controlledPromise = item.controlledPromise](
                jsi::Runtime &runtime, const jsi::Value &thisValue,
                const jsi::Value *arguments, size_t count) {
              controlledPromise->onRejected(runtime, arguments[0]);
              return jsi::Value::undefined();
            });

        thenFn.call(runtime, resolve, reject);
      } else {
        item.controlledPromise->onFulfilled(runtime, valueOrPromise);
      }
    } else {
      item.controlledPromise->onFulfilled(runtime,
                                          std::move(_value->unwrap(runtime)));
    }
  }

  for (auto &item : _finallyQueue) {
    item.sideEffectFn->call(runtime);
    item.controlledPromise->onFulfilled(runtime,
                                        std::move(_value->unwrap(runtime)));
  }

  _thenQueue.clear();
  _finallyQueue.clear();
}

void JsiPromiseWrapper::propagateRejected(jsi::Runtime &runtime) {
  printf("promise %zu: propagateRejected queue: %zu\n", _counter,
         _thenQueue.size());

  for (auto &item : _thenQueue) {
    if (item.catchFn != nullptr) {
      // Function
      auto arg = _reason->unwrap(runtime);
      jsi::Value valueOrPromise =
          item.catchFn(runtime, jsi::Value::undefined(),
                       static_cast<const jsi::Value *>(&arg), 1);

      if (isThenable(runtime, valueOrPromise)) {
        auto thenFn = valueOrPromise.asObject(runtime).getPropertyAsFunction(
            runtime, ThenPropName);

        auto resolve = jsi::Function::createFromHostFunction(
            runtime, jsi::PropNameID::forUtf8(runtime, ThenPropName), 1,
            [controlledPromise = item.controlledPromise](
                jsi::Runtime &runtime, const jsi::Value &thisValue,
                const jsi::Value *arguments, size_t count) {
              controlledPromise->onFulfilled(runtime, arguments[0]);
              return jsi::Value::undefined();
            });

        auto reject = jsi::Function::createFromHostFunction(
            runtime, jsi::PropNameID::forUtf8(runtime, CatchPropName), 1,
            [controlledPromise = item.controlledPromise](
                jsi::Runtime &runtime, const jsi::Value &thisValue,
                const jsi::Value *arguments, size_t count) {
              controlledPromise->onRejected(runtime, arguments[0]);
              return jsi::Value::undefined();
            });

        thenFn.call(runtime, resolve, reject);
      } else {
        item.controlledPromise->onFulfilled(runtime, valueOrPromise);
      }
    } else {
      item.controlledPromise->onRejected(runtime,
                                         std::move(_reason->unwrap(runtime)));
    }
  }

  for (auto &item : _finallyQueue) {
    item.sideEffectFn->call(runtime);
    item.controlledPromise->onRejected(runtime,
                                       std::move(_reason->unwrap(runtime)));
  }

  _thenQueue.clear();
  _finallyQueue.clear();
}

void JsiPromiseWrapper::onFulfilled(jsi::Runtime &runtime,
                                    const jsi::Value &val) {
  if (_state == PromiseState::Pending) {
    _state = PromiseState::Fulfilled;
    _value = JsiWrapper::wrap(runtime, val);
    printf("promise %zu: onFulfilled: %s\n", _counter,
           _value->toString(runtime).c_str());
    propagateFulfilled(runtime);
  }
}

void JsiPromiseWrapper::onRejected(jsi::Runtime &runtime,
                                   const jsi::Value &reason) {
  if (_state == PromiseState::Pending) {
    _state = PromiseState::Rejected;
    _reason = JsiWrapper::wrap(runtime, reason);
    printf("promise %zu: onRejected: %s\n", _counter,
           _reason->toString(runtime).c_str());
    propagateRejected(runtime);
  }
}

} // namespace RNWorklet
