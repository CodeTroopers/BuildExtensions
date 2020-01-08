import fs from 'fs';
import path from 'path';
import { TaskMockRunner } from 'azure-pipelines-task-lib/mock-run';
import { TaskLibAnswers } from 'azure-pipelines-task-lib/mock-answer';
import { setVariable } from 'azure-pipelines-task-lib/task';

const taskPath = path.join(__dirname, "../index.js");
const excelFilePath = path.join(__dirname, 'resources/InstallerFiles.xlsx');

//process.env['Build.BinariesDirectory'] = ''; //replace with mock of setVariable when task-lib has the support
//process.env['Product.Version'] = ''; //replace with mock of setVariable when task-lib has the support
setVariable('Build.BinariesDirectory', __dirname);
setVariable('Product.Version', '0.1.0');

// Mock task
const task: TaskMockRunner = new TaskMockRunner(taskPath);
task.setInput('excelFilePath', excelFilePath);

// Mock answer for excel file path
let answers: TaskLibAnswers = <TaskLibAnswers>{
	"checkPath": {
		[excelFilePath]: fs.existsSync(excelFilePath)
	}
};
task.setAnswers(answers);

task.run();