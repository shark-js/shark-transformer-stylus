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
	before(function *() {
		this.logger = Logger({
			name: 'SharkTransformerStylus'
		});

		var destA = path.join(__dirname, './fixtures/blocks-a.dest.css');
		this.destA = destA;
		this.destExpectA = path.join(__dirname, './fixtures/blocks-a.expect.css');
		var srcA = path.join(__dirname, './fixtures/blocks-a.styl');

		var destB = path.join(__dirname, './fixtures/blocks-b.dest.css');
		this.destB = destB;
		this.destExpectB = path.join(__dirname, './fixtures/blocks-b.expect.css');
		var srcB = path.join(__dirname, './fixtures/blocks-b.styl');

		var files = {};
		files[destA] = {
			files: [srcA, srcB],
			options: {
				define: {
					'$ie8': new transformerStylus.Stylus.nodes.Boolean(false)
				}
			}
		};
		files[destB] = srcB;

		this.filesTree = yield Tree(files, this.logger);
	});

	it('should generate and write to file stylus string', function *() {
		try {
			var tree = yield transformerStylus.treeToTree(this.filesTree, this.logger, {
				define: {
					'$ie8': new transformerStylus.Stylus.nodes.Boolean(true)
				}
			});

			yield tree.writeContentToFiles();

			var contentByPipeA = yield cofse.readFile(this.destA, { encoding: 'utf8' });
			var contentShouldBeA = yield cofse.readFile(this.destExpectA, { encoding: 'utf8' });

			var contentByPipeB = yield cofse.readFile(this.destA, { encoding: 'utf8' });
			var contentShouldBeB = yield cofse.readFile(this.destExpectA, { encoding: 'utf8' });

			expect(contentByPipeA).equal(contentShouldBeA);
			expect(contentByPipeB).equal(contentShouldBeB);
		}
		catch (error) {
			console.error(sprintf('%r', error));
			throw new Error('error');
		}
	});
});
