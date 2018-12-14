import QUnit from 'steal-qunit';
import DefineMap from 'can-define/map/map';
import singleton from './can-define-singleton';

QUnit.module('can-define-singleton');

QUnit.test('Works as a simple class @decorator', function(){
	const MyType = DefineMap.extend({});
	const Decorated = singleton(MyType);

	QUnit.ok(MyType === Decorated);
	QUnit.equal(Decorated.hasOwnProperty('current'), true);
	QUnit.equal(Decorated.hasOwnProperty('currentPromise'), true);
});

QUnit.test('Works as a @decorator({ with_options })', function(){
	const MyType = DefineMap.extend({});
	const factory = singleton({});
	QUnit.ok(MyType !== factory);

	const Decorated = factory(MyType);
	QUnit.ok(MyType === Decorated);
	QUnit.equal(Decorated.hasOwnProperty('current'), true);
	QUnit.equal(Decorated.hasOwnProperty('currentPromise'), true);
});

QUnit.test('Allows configurable property name', function(){
	const MyType = DefineMap.extend({});
	const Decorated = singleton({ propertyName: 'foo' })(MyType);

	QUnit.equal(Decorated.hasOwnProperty('foo'), true);
	QUnit.equal(Decorated.hasOwnProperty('fooPromise'), true);
	QUnit.equal(Decorated.hasOwnProperty('current'), false);
	QUnit.equal(Decorated.hasOwnProperty('currentPromise'), false);
});

QUnit.test('Calling "current" makes call to Type.get()', function(assert){
	assert.expect(3);
	const done = assert.async();
	const MyType = DefineMap.extend({});

	MyType.get = function() {
		QUnit.ok(true, 'get was called');
		return Promise.resolve('the value!');
	};

	const Decorated = singleton(MyType);

	QUnit.equal(Decorated.current, undefined, 'initially undefined');
	Decorated.currentPromise.then(() => {
		QUnit.equal(Decorated.current, 'the value!', 'has a value');
		done();
	});
});

QUnit.test('Allows for configurable data method name', function(assert){
	assert.expect(3);
	const done = assert.async();
	const MyType = DefineMap.extend({});

	MyType.doFooBar = function() {
		QUnit.ok(true, 'doFooBar was called');
		return Promise.resolve('the value!');
	};

	const Decorated = singleton({ dataMethodName: 'doFooBar' })(MyType);

	QUnit.equal(Decorated.current, undefined, 'initially undefined');
	Decorated.currentPromise.then(() => {
		QUnit.equal(Decorated.current, 'the value!', 'has a value');
		done();
	});
});

QUnit.skip('Creating/saving a new instance updates the "current" property', function(assert){
	assert.expect(2);
	const done = assert.async();
	const MyType = singleton(
		DefineMap.extend({})
	);

	const instance = new MyType();
	MyType.dispatch('created', [null, instance]);
	QUnit.equal(instance, MyType.current);

	MyType.currentPromise.then(value => {
		QUnit.equal(value, instance);
		done();
	});
});
