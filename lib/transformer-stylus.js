'use strict';

const WatcherNonInterruptibleError = require('shark-watcher').NonInterruptibleError;
const SharkTransformer  = require('shark-transformer');
const Stylus            = require('stylus');
const co                = require('co');
const VError            = require('verror');
const extend            = require('node.extend');
const path              = require('path');

const loggerOpName = 'transformer-stylus';

var SharkTransformerStylus = SharkTransformer.extend({
	init: function() {
		this.options = extend({}, this.optionsDefault, this.options);
	},

	optionsDefault: {
		compress: false,
		imports: [],
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

		var css = yield this.renderStylus(destPath);

		srcCollection.transformToOneToOneWithContent(css);
	},

	renderStylus: function(destPath) {
		return new Promise(function(fulfill, reject) {
			var time = this.logger.time();
			this.logger.info({
				opName: loggerOpName,
				opType: this.logger.OP_TYPE.STARTED
			}, path.basename(destPath));
			this.stylus.render(function (error, css) {
				if (error) {
					this.logger.warn({
						opName: loggerOpName,
						opType: this.logger.OP_TYPE.FINISHED_ERROR,
						duration: time.delta()
					}, path.basename(destPath), error.message);
					reject(new VError(error, 'Stylus error'));
				}
				else {
					this.logger.info({
						opName: loggerOpName,
						opType: this.logger.OP_TYPE.FINISHED_SUCCESS,
						duration: time.delta(),
						size: css.length
					}, path.basename(destPath));
					fulfill(css);
				}
			}.bind(this))
		}.bind(this));
	},

	treeToTree: function *() {
		yield this.createStylusInstanceAndSetOptions();
		yield this.transformTree();

		return this.tree;
	}
});

SharkTransformerStylus.Stylus = Stylus;

module.exports = SharkTransformerStylus;
