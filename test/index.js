'use strict';

const chai      = require('chai');
const coMocha   = require('co-mocha');
const expect    = chai.expect;
const Tree      = require('shark-tree');
const Logger    = require('shark-logger');
const transformerStylus = require('../');
const path      = require('path');
const VError    = require('verror');
const sprintf   = require('extsprintf').sprintf;
const cofse     = require('co-fs-extra');

describe('Transofrmation', function() {
	before(function() {
		this.logger = Logger({
			name: 'SharkTransformerStylus'
		});
	});

	it('should generate and write to file stylus string', function *() {
		var dest = path.join(__dirname, './fixtures/blocks.css');
		var src = path.join(__dirname, './fixtures/blocks.styl');

		var files = {};
		files[dest] = src;

		var filesTree = yield Tree(files, this.logger);

		try {
			var tree = yield transformerStylus.treeToTree(filesTree, this.logger);
			yield tree.writeContentToFiles();
			var contentByStylus = yield cofse.readFile(path.join(__dirname, './fixtures/blocks.css'), {
				encoding: 'utf8'
			});

			var contentShouldBe = yield cofse.readFile(path.join(__dirname, './fixtures/blocks.fixture.css'), {
				encoding: 'utf8'
			});

			expect(contentByStylus).equal(contentShouldBe);
		}
		catch (error) {
			console.error(sprintf('%r', error));
			throw new Error('error');
		}
	});
});
