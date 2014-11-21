'use strict';

const chai      = require("chai");
const coMocha   = require('co-mocha');
const expect    = chai.expect;
const Tree      = require('shark-tree');
const Logger    = require('shark-logger');
const transformerStylus = require('../');
const path      = require('path');
const VError    = require('verror');
const sprintf   = require('extsprintf').sprintf;

describe('Initialization', function() {
	before(function() {
		this.logger = Logger({
			name: 'SharkTransformerStylus'
		});

		var dest = path.join(__dirname, './fixtures/blocks.css');
		var src = path.join(__dirname, './fixtures/blocks.styl');

		var files = {};
		files[dest] = src;

		this.filesTree = new Tree(files, this.logger);
	});

	it('should output nothing', function *() {
		try {
			var tree = yield transformerStylus.treeToTree(this.filesTree, this.logger);
			yield tree.writeContentToFiles();
		}
		catch (error) {
			console.error(sprintf('%r', error));
			throw new Error('error');
		}
	});
});
