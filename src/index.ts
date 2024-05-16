#! /usr/bin/env node
import { stdin, stdout } from 'node:process';
import { getTsconfig } from 'get-tsconfig';
import wcmatch from 'wildcard-match';

const tsConfig = getTsconfig();

let input = '';
for await (const chunk of stdin) {
	const text = chunk.toString();
	input += text;
}
if (!input) process.exit(0);

const lines = input.split('\n');
let block = '';
let lastBlockLineIndex = 0;
for (let i = 0; i < lines.length; i++) {
	const line = lines[i]!;
	if (isFinalBlockEnd(line)) {
		handleErrorBlockWrite(block);
		block = '';
		lastBlockLineIndex = i;
		break;
	}
	if (isBlockStart(line)) {
		if (block) {
			handleErrorBlockWrite(block);
			block = '';
		}
		block += line + '\n';
	} else {
		block += line + '\n';
	}
}
const foundErrorsLines = lines.slice(lastBlockLineIndex);
const foundErrorsText = buildFoundErrors(foundErrorsLines);
if (!foundErrorsText) process.exit(0);
console.log(foundErrorsText);
process.exit(2);

function isBlockStart(str: string) {
	return str.startsWith('\x1B[96m');
}

function isFinalBlockEnd(str: string) {
	return /Found \d+ errors?/.test(str);
}

function handleErrorBlockWrite(block: string) {
	const parsedBlock = parseBlock(block);
	if (isIgnoredPath(parsedBlock.path)) return;
	stdout.write(block);
}

function parseBlock(block: string) {
	const pathLine = block.split('\n')[0]!;
	const match = pathLine.match(/\x1B\[96m(?<path>.*?)\x1B\[0m/);
	if (!match) throw new Error('Path not found');
	const path = match.groups!.path!;

	return {
		path,
		text: block,
	};
}

function buildFoundErrors(foundErrorsLines: string[]) {
	const parsedPathLines = parseErrorLines(foundErrorsLines);
	const finalPaths = parsedPathLines.filter(item => !isIgnoredPath(item.path));
	if (!finalPaths.length) return null;

	const countErrors = finalPaths.reduce((acc, item) => acc + item.errorCount, 0);

	let output = '';
	if (finalPaths.length > 1) {
		output += `Found ${countErrors} errors in ${finalPaths.length} files.\n\nErrors  Files\n`;
		output += finalPaths.map(item => item.text).join('\n');
	} else {
		const item = finalPaths[0]!;
		if (item.errorCount === 1) {
			output += `Found 1 error in ${item.path}\x1B[90m:5\x1B[0m`;
		} else {
			output += `Found ${item.errorCount} errors in the same file, starting at: ${item.path}\x1B[90m:5\x1B[0m`;
		}
		output += '\n';
	}

	return output;
}

function parseErrorLines(lines: string[]) {
	const isMutliFiles = lines.at(2) === 'Errors  Files';
	if (isMutliFiles) {
		const pathLines = lines.slice(3, -1);
		return pathLines.map(line => {
			const match = line.match(/(?<errorCount>\d+)\s+(?<path>.*?)\x1B\[90m/);
			if (!match) throw new Error('Error line parsed failed');
			const path = match.groups!.path!;
			const errorCount = +match.groups!.errorCount!;
			return {
				errorCount,
				path,
				text: line,
			};
		});
	} else {
		const match = lines.at(0)!.match(/(?<errorCount>\d+).* (?<path>.*?)\x1B\[90m/);
		if (!match) throw new Error('Error line parsed failed');
		const path = match.groups!.path!;
		const errorCount = +match.groups!.errorCount!;
		return [
			{
				errorCount,
				path,
				text: '',
			},
		];
	}
}

function isIgnoredPath(path: string) {
	const IGNORED_PATHS = tsConfig?.config.exclude || [];
	return IGNORED_PATHS.some(ignoredPath => wcmatch(ignoredPath)(path));
}
