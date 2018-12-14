@page can-define-singleton

# can-define-singleton

Singleton decorator for can-define/map/map

## Overview

This function is used to extend a DefineMap so that a single value is easily referenced, very much like a singleton. This is useful for situations where you only want access to a single shared instance of a value. The primary use case for this is for referencing a user's session in a client application.

## Usage

```js
import singleton from 'can-define-singleton';
import DefineMap from 'can-define/map/map';

// as a decorator
@singleton
const MyType = DefineMap.extend({ ... });

// or function wrapper
const MyType = singleton(
	DefineMap.extend({ ... })
);
```

## How does it work

Once you have decorated your class, the class will have two new static properties:

- **`MyType.current`** - the current value for the singleton
- **`MyType.currentPromise`** - the promise which should resolve to the value for the singleton

The first time you read either of these properties, the value will be loaded by calling the static `get` method on your class. The `get` method should return a Promise, which will be stored on the static `currentPromise` property of your class:

```js
@singleton
const MyType = DefineMap.extend({ ... });

// define the static "get" method 
// NOTE: the can-map behavior for can-connect does this for you
MyType.get = function() {
  return Promise.resolve('the value');
}

// triggers a call to MyType.get()
MyType.current;  //-> initially undefined

MyType.currentPromise.then(value => {
  MyType.current === value; //-> true
});
```

## Configuration options

By default, the singleton decorator uses the following options:

```js
{
  propertyName: 'current',
  dataMethodName: 'get'
}
```

You can specify your own options using the following syntax:

```js
const options = {
  propertyName: 'foo',
  dataMethodName: 'doFoo'
};

// as a decorator
@singleton( options )
const MyType = DefineMap.extend({ ... });

// or function wrapper
const MyType = singleton( options )(
	DefineMap.extend({ ... })
);
```

Using the above options, your class would be decorated with `foo` and `fooPromise` properties instead of `current` and `currentPromise`, respectively. Furthermore, the `doFoo` method will be invoked instead of the `get` method for loading the singleton data.