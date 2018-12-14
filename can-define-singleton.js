'use strict';

var DefineMap = require('can-define/map/map');
var DefineList = require('can-define/list/list');
var ObservationRecorder = require('can-observation-recorder');
var zoneStorage = require('./storage/zone-storage');

var defaults = {
	storageKey: 'can-define-singleton',
	propertyName: 'current',
	getMethodName: 'get'
};

function isDefineMapConstructor(Obj) {
	return Obj && Obj.prototype instanceof DefineMap;
}

function makeSingleton(Ctor, { storageKey, propertyName, getMethodName }){
	var helpURL = 'https://canjs.com/doc/can-define-singleton';

	if(!isDefineMapConstructor(Ctor)) {
		throw new Error('The singleton decorator/mixin can only be used for DefineMaps: ' + helpURL);
	}

	Object.defineProperty(Ctor, propertyName + 'Promise', {
		get: function () {
			ObservationRecorder.add(Ctor, 'currentPromise');
			return Ctor[getMethodName]();
		}
	});

	Object.defineProperty(Ctor, propertyName, {
		get: function () {
			ObservationRecorder.add(Ctor, propertyName);

			var result = zoneStorage.getItem(storageKey);
			if(result === null || result === undefined) {
				Ctor.currentPromise.then(function (value) {
					zoneStorage.setItem(storageKey, value);
					Ctor.dispatch(propertyName, [value]);
				})
				.catch(function () {
					zoneStorage.setItem(storageKey, null);
					Ctor.dispatch(propertyName, [null]);
				});
			}

			return result;
		}
	});

	Ctor.on('created', function (ev, value) {
		zoneStorage.setItem(storageKey, value);
		Ctor.dispatch(propertyName, [value]);
	});

	Ctor.on('destroyed', function () {
		var oldVal = zoneStorage.getItem(storageKey);
		zoneStorage.removeItem(storageKey);
		Ctor.dispatch(propertyName, [undefined, oldVal]);
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
	var opts = Object.assign({}, defaults);

	// @singleton
	if(isDefineMapConstructor(Obj)) {
		return makeSingleton(Obj, opts);
	}

	// @singleton({ options })
	return function(Ctor) {
		return makeSingleton(Ctor, Object.assign(opts, Obj));
	};
}

module.exports = singleton;
