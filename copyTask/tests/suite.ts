import path from 'path';
import { should } from 'chai';
import { MockTestRunner } from 'azure-pipelines-task-lib/mock-test';

// Modify Object.prototype to include should
should();

describe('Copy task tests', function () {

	before(function () {

	});

	after(() => {

	});

	it('should succeed with simple inputs', function () {
		const testFilePath = path.join(__dirname, 'success.js');
		console.log(testFilePath);
		const testRunner: MockTestRunner = new MockTestRunner(testFilePath);
		console.log("Start");
		testRunner.run();
		console.log(testRunner.stdout);
		testRunner.succeeded.should.be.true;
		testRunner.errorIssues.should.have.lengthOf(0);
	});
});