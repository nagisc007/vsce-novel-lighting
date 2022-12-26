"use strict";
import * as vscode from 'vscode';
import { CharCounter, CharCountUpdater } from './charcounter';

export function activate(context: vscode.ExtensionContext) {

	// クラス作成
	const counter = new CharCounter();
	const countUpdater = new CharCountUpdater(counter);

	// 登録
	context.subscriptions.push(countUpdater);
    context.subscriptions.push(counter);
	
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
