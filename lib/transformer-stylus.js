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

	createStylusInstanceAndSetOptions: function(srcCollection) {
		var stylus = Stylus('');
		var options = extend({}, this.options, srcCollection.getOptions().stylus);

		Object.keys(options).forEach(function(optionName) {
			if (['imports', 'define'].indexOf(optionName) === -1) {
				stylus.set(optionName, options[optionName]);
			}
		});

		Object.keys(options.define).forEach(function(varName) {
			stylus.define(varName, options.define[varName]);
		});

		if (options.imports && options.imports.length > 0) {
			options.imports.forEach(function(filePath) {
				stylus.import(filePath);
			});
		}

		return stylus;
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
		var stylus = this.createStylusInstanceAndSetOptions(srcCollection);
		srcCollection.forEach(function(srcFile) {
			stylus.import(srcFile.getSrc());
		});

		var css = yield this.renderStylus(stylus, destPath);

		srcCollection.transformToOneToOneWithContent(css);
	},

	renderStylus: function(stylus, destPath) {
		return new Promise(function(fulfill, reject) {
			var time = this.logger.time();
			this.logger.info({
				opName: loggerOpName,
				opType: this.logger.OP_TYPE.STARTED
			}, path.basename(destPath));
			stylus.render(function (error, css) {
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
		yield this.transformTree();

		return this.tree;
	}
});

SharkTransformerStylus.Stylus = Stylus;

module.exports = SharkTransformerStylus;
