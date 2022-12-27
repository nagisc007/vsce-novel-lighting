"use strict";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export const getRootPath = (): string => {
    if (vscode.workspace.name !== undefined && vscode.workspace.workspaceFolders !== undefined) {
        return vscode.workspace.workspaceFolders[0].uri.fsPath;
    } else {
        return "";
    }
};

export const getFilePaths = (dirPath: string, fileTypes: string[] = ['.txt']): FileInfo[] => {
    const filesInDirs = fs.readdirSync(dirPath, {withFileTypes: true});
    let files: FileInfo[] = [];
    if (!filesInDirs) {
        vscode.window.showWarningMessage(`${dirPath}にファイルが存在しません`);
        return files;
    }
    // ファイルパスの取得
    for (const dirent of filesInDirs) {
        if (dirent.isDirectory()) {
            // Directory処理
            // NOTE: 現状は指定フォルダ内のファイルのみ取得。
            // TODO: 再帰的処理で深い階層まで読めるように
            files.push({
                fileType: "dir",
                dir: path.join(dirPath, dirent.name),
                name: dirent.name,
            });
        } else if (dirent.isFile()) {
            // File処理
            if (fileTypes.includes(path.extname(dirent.name))) {
                files.push({
                    fileType: "file",
                    dir: path.join(dirPath, dirent.name),
                    name: dirent.name,
                });
            }
        } else {
            console.warn("Unknown file type.");
        }
    }

    return files;
};

export type FileInfo = {
    fileType?: string;
    dir?: string;
    name?: string;
};
