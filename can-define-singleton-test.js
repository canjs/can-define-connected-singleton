import QUnit from 'steal-qunit';
import DefineMap from 'can-define/map/map';
import plugin from './can-define-singleton';

QUnit.module('can-define-singleton');

QUnit.test('Works as a simple class @decorator', function(){
  const MyType = DefineMap.extend({});
  const Decorated = plugin(MyType);

  QUnit.ok(MyType === Decorated);
  QUnit.equal(Decorated.hasOwnProperty('current'), true);
  QUnit.equal(Decorated.hasOwnProperty('currentPromise'), true);
});

QUnit.test('Works as a @decorator({ with_options })', function(){
  const MyType = DefineMap.extend({});
  const factory = plugin({});
  QUnit.ok(MyType !== factory);

  const Decorated = factory(MyType);
  QUnit.ok(MyType === Decorated);
  QUnit.equal(Decorated.hasOwnProperty('current'), true);
  QUnit.equal(Decorated.hasOwnProperty('currentPromise'), true);
});

QUnit.test('Allows configurable property name', function(){
  const MyType = DefineMap.extend({});
  const Decorated = plugin({ propertyName: 'foo' })(MyType);

  QUnit.equal(Decorated.hasOwnProperty('foo'), true);
  QUnit.equal(Decorated.hasOwnProperty('fooPromise'), true);
  QUnit.equal(Decorated.hasOwnProperty('current'), false);
  QUnit.equal(Decorated.hasOwnProperty('currentPromise'), false);
});

QUnit.test('Calling "current" makes call to Type.get()', function(assert){
  const done = assert.async()
  const MyType = DefineMap.extend({});

  MyType.get = function() {
  	QUnit.ok(true, 'get was called');
  	return Promise.resolve('the value!')
  };

  const Decorated = plugin(MyType);

  QUnit.expect(Decorated.current, undefined, 'initially undefined');
  Decorated.currentPromise.then(() => {
  	QUnit.expect(Decorated.current, 'the value!', 'has a value');
  	done();
  })
});

QUnit.test('Allows for configurable "get" method name', function(assert){
  const done = assert.async()
  const MyType = DefineMap.extend({});

  MyType.doFooBar = function() {
  	QUnit.ok(true, 'getSomething was called');
  	return Promise.resolve('the value!')
  };

  const Decorated = plugin({ getMethodName: 'doFooBar' })(MyType);

  QUnit.expect(Decorated.current, undefined, 'initially undefined');
  Decorated.currentPromise.then(() => {
  	QUnit.expect(Decorated.current, 'the value!', 'has a value');
  	done();
  })
});
