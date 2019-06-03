'use strict';

var QUnit = require('steal-qunit');
var DefineMap = require('can-define/map/map');
var singleton = require('./can-define-connected-singleton');

QUnit.module('can-define-connected-singleton');

QUnit.test('Works as a simple class @decorator', function(){
	var MyType = DefineMap.extend({});
	var Decorated = singleton(MyType);

	QUnit.equal(MyType, Decorated);
	QUnit.ok(Decorated.hasOwnProperty('current'));
	QUnit.ok(Decorated.hasOwnProperty('currentPromise'));
});

QUnit.test('Works as a @decorator({ with_options })', function(){
	var MyType = DefineMap.extend({});
	var factory = singleton({});
	var Decorated = factory(MyType);

	QUnit.equal(MyType, Decorated);
	QUnit.ok(Decorated.hasOwnProperty('current'));
	QUnit.ok(Decorated.hasOwnProperty('currentPromise'));
});

QUnit.test('Allows configurable property name', function(){
	var MyType = DefineMap.extend({});
	var Decorated = singleton({ currentPropertyName: 'foo' })(MyType);

	QUnit.ok(Decorated.hasOwnProperty('foo'));
	QUnit.ok(Decorated.hasOwnProperty('fooPromise'));
	QUnit.notOk(Decorated.hasOwnProperty('current'));
	QUnit.notOk(Decorated.hasOwnProperty('currentPromise'));
});

QUnit.test('Calling "current" makes call to Type.get()', function(assert){
	// ensure that get() is only called once
	assert.expect(3);
	var done = assert.async();
	var MyType = DefineMap.extend({
		get: function() {
			QUnit.ok(true, 'get was called');
			return Promise.resolve('the value!');
		}
	}, {});

	var Decorated = singleton(MyType);

	QUnit.equal(Decorated.current, undefined, 'initially undefined');
	Decorated.currentPromise.then(function() {
		QUnit.equal(Decorated.current, 'the value!', 'has the expected value');
		done();
	});
});

QUnit.test('Allows for configurable data method name', function(assert){
	assert.expect(3);
	var done = assert.async();
	var MyType = DefineMap.extend({
		doFooBar: function() {
			QUnit.ok(true, 'doFooBar was called');
			return Promise.resolve('the value!');
		}
	}, {});

	var Decorated = singleton({ fetchMethodName: 'doFooBar' })(MyType);

	QUnit.equal(Decorated.current, undefined, 'initially undefined');
	Decorated.currentPromise.then(function() {
		QUnit.equal(Decorated.current, 'the value!', 'has the expected value');
		done();
	});
});

// TODO: test configurable saving param, saving method & destroy method

QUnit.test('Saving a new instance updates the "current" property', function(assert){
	assert.expect(4);
	var done = assert.async();
	var MyType = singleton(
		DefineMap.extend({ 
			get: function() {
				assert.ok(true, 'Get called but returns undefined. Should only happen once during this test.');
				return Promise.resolve(undefined);
			},
		}, {
			save: function() {
				return Promise.resolve(this);
			}
		})
	);

	var instance = new MyType();
	QUnit.notEqual(MyType.current, instance);

	instance.save().then(() => {
		QUnit.equal(MyType.current, instance);

		MyType.currentPromise.then(function(value) {
			QUnit.equal(value, instance);
			done();
		});
	});
});

QUnit.test('Destroying sets the "current" property to undefined, with rejected promise', function(assert){
	assert.expect(2);
	var done = assert.async();
	var MyType = singleton(
		DefineMap.extend({ 
			get: function() {
				return Promise.resolve();
			}
		}, {
			save: function() {
				return Promise.resolve(this);
			},
			destroy: function() {
				return Promise.resolve();
			}
		})
	);

	var instance = new MyType();
	
	instance.save().then(() => {
		instance.destroy().then(() => {
			QUnit.equal(MyType.current, undefined);

			MyType.currentPromise.then(function() {
				QUnit.notOk(true, 'should not get here');
				done();
			}).catch(function(value) {
				QUnit.equal(value, 'Singleton instance has been destroyed. Save a new instance to reinitialize the singleton.');
				done();
			});
		});
	});
});
