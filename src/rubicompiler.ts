"use strict";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getRootPath, getFilePaths, FileInfo } from "./common";
const yaml = require('js-yaml');

/** ルビ追加用クラス */
export class RubiCompiler {
    
    public addRubiToDocuments (documents: string): string {

        console.log('NVL: rubi compile starting...');

        // ルートパス取得
        const rootPath: string = getRootPath();
        if (!rootPath) {
            vscode.window.showWarningMessage('Cannot find the project root path.');
            return documents;
        }

        // ルビファイル確認
        if (!this._isExistsRubi(rootPath)) {
            vscode.window.showWarningMessage('No exists rubi folder.');
            return documents;
        }
        // ルビファイルのパス取得
        const rubiPath: string = this._getRubiPath(rootPath);

        // ルビファイル読み取り
        const filePaths: FileInfo[] = getFilePaths(rubiPath, ['.yml', '.yaml']);
        if (!filePaths) {
            vscode.window.showWarningMessage('No exists rubi files.');
            return documents;
        }

        // ルビデータ読み取り＆データ作成
        const rubiData = this._getRubiData(filePaths);

        // ルビ置換
        const formatted = this._compileDocumentWithRubi(documents, rubiData);

        console.log('NVL: rubi compile finished.');

        return formatted;
    }

    private _lowerPath: string = '/rubi';
    private _upperPath: string = '/Rubi';

    private _isExistsRubi (rootPath: string): boolean {
            return fs.existsSync(path.join(rootPath, this._lowerPath))
                || fs.existsSync(path.join(rootPath, this._upperPath));
    }

    private _getRubiPath (rootPath: string): string {
        const lower: string = path.join(rootPath, this._lowerPath);
        const upper: string = path.join(rootPath, this._upperPath);
        if (fs.existsSync(lower)) {
            return lower;
        } else {
            return upper;
        }
    }

    private _getRubiData (filePaths: FileInfo[]): RubiInfo[] {
        let rubiData: RubiInfo[] = [];
        for (const info of filePaths) {
            const yamlData = fs.readFileSync("" + info.dir, 'utf-8');
            if (yamlData) {
                const data = yaml.load(yamlData);
                for (const rubiObj of data) {
                    if (rubiObj.rubi && rubiObj.replace) {
                        rubiData.push({
                            rubi: rubiObj.rubi,
                            replace: rubiObj.replace,
                        });
                    }
                }
            }
        }
        return rubiData;
    }

    private _compileDocumentWithRubi (documents: string, rubiData: RubiInfo[]): string {
        let compiled = documents;

        for (const rubi of rubiData) {
            //const rubiChar: string = rubi.rubi? rubi.rubi: '';
            if (rubi.rubi && rubi.replace) {
                compiled = compiled.replace(`${rubi.rubi}`, `${rubi.replace}`);
            }
        }

        return compiled;
    }
}

type RubiInfo = {
    rubi?: string;
    replace?: string;
    always?: boolean;
    exclusion?: string;
};