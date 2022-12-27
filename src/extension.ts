"use strict";
import * as vscode from 'vscode';
import { CharCounter, CharCountUpdater } from './charcounter';
import { NovelCompiler } from './novelcompiler';
import { Outputter } from './outputter';
import { RubiCompiler } from './rubicompiler';

export function activate(context: vscode.ExtensionContext) {
	console.log('novel-lighting activate.');

	// クラス作成
	const counter = new CharCounter();
	const countUpdater = new CharCountUpdater(counter);
	const compiler = new NovelCompiler();
	const outputter = new Outputter();
	const rubi = new RubiCompiler();

	// 登録
	context.subscriptions.push(countUpdater);
    context.subscriptions.push(counter);

	// コマンド登録
	context.subscriptions.push(
		vscode.commands.registerCommand("NVL.build-to-novel", async () => {
			const doc: string = compiler.compile('novel');
			outputter.isOutputSuccess(outputter.outputDocument(doc));
			// ルビ版
			const rubiDoc: string = rubi.addRubiToDocuments(doc);
			outputter.isOutputSuccess(outputter.outputDocument(rubiDoc, '_rubi'));
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand("NVL.build-to-web-novel", async () => {
			const doc: string = compiler.compile('novel', 'web');
			outputter.isOutputSuccess(outputter.outputDocument(doc));
			// ルビ版
			const rubiDoc: string = rubi.addRubiToDocuments(doc);
			outputter.isOutputSuccess(outputter.outputDocument(rubiDoc, '_rubi'));
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand("NVL.build-to-screenplay", async () => {
			const doc: string = compiler.compile('screenplay', 'screenplay');
			outputter.isOutputSuccess(outputter.outputDocument(doc));
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand("NVL.build-to-audiodrama", async () => {
			const doc: string = compiler.compile('screenplay', 'audiodrama');
			outputter.isOutputSuccess(outputter.outputDocument(doc));
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand("NVL.build-to-plain", async () => {
			const doc: string = compiler.nonCompile();
			outputter.isOutputSuccess(outputter.outputDocument(doc));
		})
	);
	
	// テスト用
	let disposable = vscode.commands.registerCommand('NVL.helloworld', () => {
		// 第二、第三引数でメッセージの右側にボタン表示
		vscode.window.showInformationMessage('Hello World from Novel-Lighting!', '了解', 'キャンセル')
		.then((selected) => {
			console.log(selected);
			// status barにメッセージ表示
			vscode.window.setStatusBarMessage('OK Hello VS Code:' + selected, 3000);
		});
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
