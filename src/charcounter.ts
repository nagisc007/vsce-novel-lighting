"use strict";
import * as vscode from "vscode";

/** （使用中のファイルの）文字数カウント用クラス */
export class CharCounter {
    // メンバー定義
    private _statusBarItem!: vscode.StatusBarItem; // ステータスバーItem

    public update (): void {
        // 情報更新
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this.hide();
            return; // エディタがない →EXIT
        }
        if (!this._isEnableFile(editor)) {
            this.hide();
            return; // カウントするファイルでない　→EXIT
        }

        const text = this._getCurrentText(editor);
        const compText = this._compileText(text);
        const count = this._countText(compText);

        this.show(count);
    }

    public show (count: number): void {
        const sbarItem = this._getStatusBarItem();
        // 文字数をステータスバーに出力し、表示
        sbarItem.text = count !== 1 ? `$(pencil) ${count}c`: `$(pencil)1c`;
        sbarItem.show();
    }

    public hide(): void {
        const sbarItem = this._getStatusBarItem();
        sbarItem.hide();
    }

    public dispose(): void {
        this._statusBarItem.dispose();
    }

    private _getStatusBarItem (): vscode.StatusBarItem {
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }
        return this._statusBarItem;
    }

    private _isEnableFile (editor: vscode.TextEditor): boolean {
        return editor.document.languageId === "markdown" || editor.document.languageId === "plaintext";
    }

    private _getCurrentText (editor: vscode.TextEditor): string {
        let text = editor.document.getText();
        return text;
    }

    private _compileText(text: string): string {
        let compiled = "";
        let lines = text.split('\n');
        for (const line of lines) {
            if (line.match(/^#*\s./)) {
                continue;
            }
            compiled += line;
        }
        compiled = compiled
            .replace(/\s/g, '') // すべての空白文字
            .replace(/《(.+?)》/g, '')  // ルビ範囲指定記号とその中の文字
            .replace(/[\|｜]/g, '')    // ルビ開始記号
            .replace(/<!--(.+?)-->/g, ''); // コメント行
        return compiled;
    }

    private _countText (text: string): number {
        let count = 0;
        if (text !== "") {
            count = text.length;
        }
        return count;
    }

}

/** 文字数Update管理クラス */
export class CharCountUpdater {
    // メンバー定義
    private _counter: CharCounter; // CharCounterクラス
    private _disposable: vscode.Disposable; // dispose用
    // コンストラクタ
    constructor(counter: CharCounter) {
        this._counter = counter;
        this._counter.update();

        // テキスト選択が変更｜アクティブなエディタ変更時にUpdate
        let subscriptions: vscode.Disposable[] = [];
        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        this._disposable = vscode.Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._counter.update();
    }

    public dispose() {
        this._disposable.dispose();
    }
}