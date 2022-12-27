"use strict";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export class Outputter {

    public outputDocument (doc: string): boolean {

        console.log('NVL: output document starting...:' + doc);
        // ビルドパス取得
        const rootPath: string = this._getRootPath();
        if (!rootPath) {
            return false;
        }
        const buildPath: string = this._getBuildPath(rootPath);

        // TODO: プロジェクト情報取得

        // ファイル名作成
        const fileName: string = this._createOutputFileName('output');

        // ファイル書き込み
        const isSuccess: boolean = this._writeOutputDocument(
            buildPath, fileName, doc
        );

        console.log('NVL: output document finished');
        return isSuccess;
    }

    public isOutputSuccess (isSuccess: boolean): void {
        if (!isSuccess) {
            vscode.window.showErrorMessage('ERROR in output phase: ファイルが出力できませんでした');
        }
    }

    private _getRootPath (): string {
        if (vscode.workspace.name !== undefined && vscode.workspace.workspaceFolders !== undefined) {
            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            return "";
        }
    }

    private _getBuildPath (rootPath: string): string {
        const buildPath: string = path.join(rootPath, 'build');
        if (!fs.existsSync(buildPath)) {
            fs.mkdirSync(buildPath);
        }
        return buildPath;
    }

    private _createOutputFileName (basename: string, ext: string = 'txt'): string {
        return basename + '.' + ext;
    }

    private _writeOutputDocument(basePath: string, fileName: string, contents: string): boolean {
        if (!contents) {
            return false;
        }
        const buildFilePath: string = path.join(basePath, fileName);
        fs.writeFile(buildFilePath, contents, function (err) {
            if (err) { throw err; }
            console.log(`NVL: create file of ${buildFilePath}`);
            vscode.window.showInformationMessage(`${fileName}が作成されました`);
        });
        return true;
    }
}