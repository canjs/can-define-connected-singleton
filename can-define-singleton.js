'use strict';

var DefineMap = require('can-define/map/map');
var DefineList = require('can-define/list/list');
var ObservationRecorder = require('can-observation-recorder');
var zoneStorage = require('./util/zone-storage');
var helpers = require('./util/helpers');

var defaults = {
	storagePrefix: 'can-define-singleton',
	propertyName: 'current',
	dataMethodName: 'get'
};

function isDefineMapConstructor(Obj) {
	return Obj && Obj.prototype instanceof DefineMap;
}

function makeSingleton(Ctor, { storagePrefix, propertyName, dataMethodName }){
	var helpURL = 'https://canjs.com/doc/can-define-singleton';

	if(!isDefineMapConstructor(Ctor)) {
		throw new Error('The singleton decorator/mixin can only be used for DefineMaps: ' + helpURL);
	}

	var propertyNamePromise = propertyName + 'Promise';
	var storageKey = storagePrefix + '-' + Ctor.name + '-' + propertyName;
	var storageKeyPromise = storageKey + '-promise';

	if(zoneStorage.getItem(storageKey) || zoneStorage.getItem(storageKeyPromise)){
		console.warn('can-define-singleton: Removing existing values from zone storage. You are likely configuring a singleton twice.');
		zoneStorage.removeItem(storageKey);
		zoneStorage.removeItem(storageKeyPromise);
	}

	// This ensures that the promise is not invoked twice
	function getCurrentAndPromise() {
		var current = zoneStorage.getItem(storageKey);
		var promise = zoneStorage.getItem(storageKeyPromise);
		
		if(promise === undefined) {
			promise = Ctor[ dataMethodName ]();
			zoneStorage.setItem(storageKeyPromise, promise);

			promise.then(function (value) {
				zoneStorage.setItem(storageKey, value);
				Ctor.dispatch(propertyName, [value]);
			})
			.catch(function () {
				zoneStorage.setItem(storageKey, null);
				Ctor.dispatch(propertyName, [null]);
			});
		}

		return {
			current: current,
			promise: promise
		};
	}

	Object.defineProperty(Ctor, propertyNamePromise, {
		get: function () {
			ObservationRecorder.add(Ctor, propertyNamePromise);
			return getCurrentAndPromise().promise;
		}
	});

	Object.defineProperty(Ctor, propertyName, {
		get: function () {
			ObservationRecorder.add(Ctor, propertyName);
			return getCurrentAndPromise().current;
		}
	});

	Ctor.on('created', function (ev, value) {
		var promise = Promise.resolve(value);

		zoneStorage.setItem(storageKey, value);
		zoneStorage.setItem(storageKeyPromise, promise);

		// todo: batch
		Ctor.dispatch(propertyName, [value]);
		Ctor.dispatch(propertyNamePromise, [value]);
	});

	Ctor.on('destroyed', function (ev, value) {
		var oldVal = zoneStorage.getItem(storageKey);
		var promise = Promise.reject();

		if(value !== oldVal) {
			console.warn('can-define-singleton: An instance was destroyed which was not the singleton. This is not good.');
		}

		zoneStorage.removeItem(storageKey);
		zoneStorage.setItem(storageKeyPromise, promise);

		// todo: batch
		Ctor.dispatch(propertyName, [undefined, value]);
		Ctor.dispatch(propertyNamePromise, [undefined, value]);
	});

	// This can be removed whenever can-connect allows
	// types to not have a List definition.
	if(!Ctor.List) {
		Ctor.List = DefineList.extend({
			'#': Ctor
		});
	}

	return Ctor;
}

function singleton(Obj) {
	var opts = helpers.assign({}, defaults);

	// @singleton
	if(isDefineMapConstructor(Obj)) {
		return makeSingleton(Obj, opts);
	}

	// @singleton(options)
	return function(Ctor) {
		return makeSingleton(Ctor, helpers.assign(opts, Obj));
	};
}

module.exports = singleton;
