'use strict';

const WatcherNonInterruptibleError = require('shark-watcher').NonInterruptibleError;
const SharkTransformer  = require('shark-transformer');
const Stylus            = require('stylus');
const co                = require('co');
const VError            = require('verror');
const extend            = require('node.extend');

module.exports = SharkTransformer.extend({
	init: function() {
		this.options = extend({}, this.optionsDefault, this.options);
	},

	optionsDefault: {
		compress: false,
		imports: [],
		functions: [],
		globals: {},
		paths: [],
		prefix: '',
		filename: null,
		'include css': true,
		'indent spaces': 2,
		'resolve url': null,
		warn: false,

		define: {}
	},

	createStylusInstanceAndSetOptions: function *() {
		this.stylus = Stylus('');

		Object.keys(this.options).forEach(function(optionName) {
			if (['imports', 'define'].indexOf(optionName) === -1) {
				this.stylus.set(optionName, this.options[optionName]);
			}
		}.bind(this));

		Object.keys(this.options.define).forEach(function(varName) {
			this.stylus.define(varName, this.options.define[varName]);
		}.bind(this));

		if (this.options.imports && this.options.imports.length > 0) {
			this.options.imports.forEach(function(filePath) {
				this.stylus.import(filePath);
			}.bind(this));
		}
	},

	transformTree: function *() {
		return this.tree.forEachDestSeries(co.wrap(function *(destPath, srcCollection, done) {
			try {
				yield this.transformTreeConcreteDest(destPath, srcCollection);
				done();
			}
			catch (error) {
				done(new VError(error, 'Stylus#transformTree error'));
			}
		}.bind(this)));
	},

	transformTreeConcreteDest: function *(destPath, srcCollection) {
		srcCollection.forEach(function(srcFile) {
			this.stylus.import(srcFile.getSrc());
		}.bind(this));

		var css = yield this.renderStylus();

		srcCollection.transformToOneToOneWithContent(css);
	},

	renderStylus: function() {
		return new Promise(function(fulfill, reject) {
			this.stylus.render(function (error, css) {
				if (error) {
					reject(new VError(error, 'Stylus error'));
				}
				else {
					fulfill(css);
				}
			})
		}.bind(this));
	},

	treeToTree: function *() {
		yield this.createStylusInstanceAndSetOptions();
		yield this.transformTree();

		return this.tree;
	}
});