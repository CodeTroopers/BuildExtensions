import { TaskResult, VariableInfo, IssueType, getPathInput, setResult, getVariables, logIssue } from 'azure-pipelines-task-lib/task';
import xlsx from 'xlsx';
import os from 'os';
import path from 'path';
import copy from 'copy';
import { promisify } from 'util';
import File from 'vinyl';

// Required column in excel file
const requiredColumns = ['SourcePath', 'Pattern', 'TargetPath'];

// Regex to extract variable in strings
const variableRegex = /\$\(([\w\.]+)\)/g;

// Variables
let variables: VariableInfo[] = [];

// Run the task
async function run() {
	try {
		// Get variables
		variables = getVariables();

		// Get excel file path
		const filePath = getPathInput('excelFilePath', true, true);
		if (!filePath) {
			setResult(TaskResult.Failed, 'Excel file path is not a valid file path');
			return;
		}

		// Open excel file
		console.log(`Open Excel file ${filePath}`);
		const workbook = xlsx.readFile(filePath);
		if (!workbook.SheetNames.length) {
			setResult(TaskResult.Failed, 'Excel file has no sheet');
			return;
		}

		// Get sheet name
		const sheetName = workbook.SheetNames[0];
		console.log(`Read sheet ${sheetName}`);

		// Get headers
		const headers = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], {
			header: 1,
			range: 'A1:ZZ1'
		})[0] as any[];
		console.log(`Headers found in sheet ${headers}`);

		// Ensure required columns exist
		let message: string = '';
		for (const requiredColumn of requiredColumns) {
			if (!headers.includes(requiredColumn)) {
				message += `The ${requiredColumn} column is required${os.EOL}`;
			}
		}
		if (message && message.length > 0) {
			setResult(TaskResult.Failed, message);
			return;
		}

		// Get rows
		const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
		console.log(`${rows.length} rows loaded`);

		// Read rows
		let promise: Promise<CopyResult> = Promise.resolve(new CopyResult());
		for (const row of rows) {
			// Get details of row
			const { SourcePath: sourcePath, Pattern: pattern, TargetPath: targetPath } = row as { SourcePath: string, Pattern: string, TargetPath: string };
			if (sourcePath && targetPath) {
				// Get the full source path
				const fullSourcePath = pattern ? path.join(sourcePath, pattern) : sourcePath;
				// Copy from full source path to target path
				promise = promise.then((result) => aggregateCopyAsync(result, resolveVariables(fullSourcePath), resolveVariables(targetPath)));
			}
		}

		// Wait all copies
		return promise.then(
			(result: CopyResult) => {
				if (result.errors.length === 0)
					console.log(`Copy task executed successfully with ${result.files.length} file(s) copied`);
				else
					throw new Error(`Copy task has failed with ${result.errors.length} error(s)`);
			}
		).catch((reason) => {
			setResult(TaskResult.Failed, reason);
		});
	}
	catch (error) {
		setResult(TaskResult.Failed, error.message);
	}
}

// Copy from source path to target path and return promise of files array and errors array
async function copyAsync(sourcePath: string, targetPath: string) {
	// Convert copy to promise and call copy as promise
	return promisify((sourcePath: string, targetPath: string, callback: copy.Callback) => {
		console.log(`Copy ${sourcePath} to ${targetPath}`);
		copy(sourcePath, targetPath, callback);
	})(sourcePath, targetPath).then((files?: File[]) => {
		if (!files || files.length === 0) {
			throw new Error(`No file copied from ${sourcePath}`);
		}
		console.log(`${files.length} file(s) copied to ${targetPath}`);
		return files as File[];
	}).catch((error) => {
		logIssue(IssueType.Error, error?.message || error);
		throw error;
	});
}

// Define a result of copy
class CopyResult {
	constructor() {
		this.files = [];
		this.errors = [];
	}
	files: File[]
	errors: Error[]
}

async function aggregateCopyAsync(result: CopyResult, sourcePath: string, targetPath: string) {
	// Call copy and aggregate result of copy and errors
	return copyAsync(sourcePath, targetPath).then((files: File[]) => {
		result.files = result.files.concat(files);
		return result;
	}).catch((error) => {
		result.errors.push(error);
		return result;
	});
}

// Resolve variables in a string
function resolveVariables(input: string): string {
	// Replace $(...) with the variable value if exists
	return input.replace(variableRegex, (interpolationString, name) => {
		const value = variables.find((variable) => variable.name.localeCompare(name, undefined, { sensitivity: 'base' }) === 0)?.value || interpolationString;
		return value;
	})
}

run();