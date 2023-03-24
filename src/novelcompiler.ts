"use strict";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getRootPath, getFilePaths, FileInfo } from "./common";

/** 小説形式コンパイル用クラス */
export class NovelCompiler {

    public compile (
        style: string,
        formatStyle: string = 'default',
        isShowComment: boolean = false
        ): string {
        // members
        let compiledDoc = "";

        console.log('NVL: compile starting...');

        // ルートパス取得
        const rootPath: string = this._getRootPath();
        // draftフォルダ確認　→ないならExit
        if (!this._isExistsDraft(rootPath)) {
            return "";
        }
        const draftPath: string = this._getDraftPath(rootPath);

        // ファイルパスのリスト取得
        const filePaths: FileInfo[] = getFilePaths(draftPath, ['.txt', '.md']);

        // テキストのリスト取得
        const fileTexts: string[] = this._getDraftTexts(filePaths);

        // テキストをDocInfo形式のリストに変換
        const docInfos: DocInfo[] = this._convDocInfo(fileTexts);

        // 指定形式によって、出力用のプレフォーマットに整形
        let isScreenplay = style === 'screenplay';
        const preformatted: string[] =  this._convDocPreFormat(
            docInfos, isScreenplay, isShowComment);

        // 最終フォーマット整形
        const formatted: string = this._formatDocument(preformatted, formatStyle);

        console.log('NVL: compiled success!');

        return formatted;
    }

    public nonCompile () {
        // ルートパス取得
        const rootPath: string = this._getRootPath();
        // draftフォルダ確認　→ないならExit
        if (!this._isExistsDraft(rootPath)) {
            return "";
        }
        const draftPath: string = this._getDraftPath(rootPath);

        // ファイルパスのリスト取得
        const filePaths: FileInfo[] = getFilePaths(draftPath, ['.txt', '.md']);

        // テキストのリスト取得
        const fileTexts: string[] = this._getDraftTexts(filePaths);

        // フォーマットせず、そのまま返す
        let documents = '';
        for (const line of fileTexts) {
            documents += line;
        }
        return documents;
    }

    private _getRootPath (): string {
        if (vscode.workspace.name !== undefined && vscode.workspace.workspaceFolders !== undefined) {
            return vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            return "";
        }
    }

    private _isExistsDraft (path: string): boolean {
        const lower = path + '/draft';
        const upper = path + '/Draft';
            return fs.existsSync(lower) || fs.existsSync(upper);
    }

    private _getDraftPath (path: string): string {
        const lower = path + '/draft';
        const upper = path + '/Draft';
        if (fs.existsSync(lower)) {
            return lower;
        } else {
            return upper;
        }
    }

    private _getDraftTexts (filePaths: FileInfo[]): string[] {
        let contents: string[] = [];
        for (const info of filePaths) {
            let text = fs.readFileSync("" + info.dir, 'utf-8');
            if (text) {
                contents.push(text);
            }
        }
        return contents;
    }

    private _beginHead1 = /^# .*/;
    private _beginHead2 = /^## .*/;
    private _beginHead3Over = /^###* .*/;
    private _beginInstP = /^!P .*/;
    private _beginBracket1 = /^「.*/;
    private _beginBracket2 = /^『.*/;
    private _beginBracket3 = /^（.*/;
    private _beginScriptDialogue = /.*:.*/;
    private _beginScriptNarration = /^N:.*/;
    private _beginScriptMonologue = /^.*M:.*/;
    private _beginComment = /<!--.*-->>/;

    private _convDocInfo (texts: string[]): DocInfo[] {
        let contents: DocInfo[] = [];
        let inDesc = false;
        let inDialogue = false;
        let inScene = false;
        let _reset = (): void => {
            inDesc = false;
            inDialogue = false;
            inScene = false;
        };

        for (const text of texts) {
            const lines = text.split('\n');
            for (const line of lines) {
                if (this._beginHead1.test(line)) {
                    // # Head level 1: Title
                    contents.push({docType: "title", descs: [line]});
                    _reset();
                } else if (this._beginHead2.test(line)) {
                    // ## Head level 2: Scene info
                    contents.push({docType: "scene", descs: [line]});
                    _reset();
                    inScene = true;
                } else if (this._beginHead3Over.test(line)) {
                    // ### Head level 3: Sub info
                    contents.push({docType: "subinfo", descs: [line]});
                    _reset();
                } else if (this._beginInstP.test(line)) {
                    // !P Instruction(plan text)
                    contents.push({docType: "plain", descs: [line.slice(3)]});
                    _reset();
                } else if (this._beginBracket1.test(line)) {
                    // 「Dialogue」
                    // TODO: 「台詞」と思っていた。｜のような例の処理
                    _reset();
                    contents.push({docType: "dialogue", descs: [line]});
                    inDialogue = true;
                } else if (this._beginBracket2.test(line)) {
                    // 『Voice』
                    _reset();
                    contents.push({docType: "voice", descs: [line]});
                    inDialogue = true;
                } else if (this._beginBracket3.test(line)) {
                    // （Thought）
                    _reset();
                    contents.push({docType: "think", descs: [line]});
                    inDialogue = true;
                } else if (this._beginScriptDialogue.test(line)) {
                    // Person: Dialogue (for Screenplay)
                    _reset();
                    let data = line.split(':');
                    contents.push({docType: "dialogue", descs: [data[1]], subject: data[0] + '「'});
                    inDialogue = true;
                } else if (this._beginScriptNarration.test(line)) {
                    // N: Narration (for Screenplay)
                    _reset();
                    let data = line.split(':');
                    contents.push({docType: "narration", descs: [data[1]], subject: 'Ｎ「'});
                    inDialogue = true;
                } else if (this._beginScriptMonologue.test(line)) {
                    // Person-M: Monologue (for Screenplay)
                    _reset();
                    let data = line.split('M:');
                    contents.push({docType: "monologue", descs: [data[1]], subject: data[0] + 'Ｍ「'});
                    inDialogue = true;
                } else if (this._beginComment.test(line)) {
                    // Comment
                    // TODO: about internal comment?
                    contents.push({docType: "comment", descs: [line]});
                    _reset();
                } else if (line !== "") {
                    // General
                    if (inDesc || inDialogue) {
                        // Continue description/dialogue
                        contents[contents.length - 1].descs?.push(line);
                    } else {
                        // New description
                        contents.push({docType: "description", descs: [line]});
                        inDesc = true;
                    }
                } else {
                    // Breakline
                    if (inScene) {
                        inScene = false;
                        continue;
                    } else if (inDialogue || inDesc) {
                        _reset();
                    } else {
                        contents.push({docType: "break", descs: []});
                    }
                }
            }
        }

        return contents;
    }

    private _convDocPreFormat (
        docInfos: DocInfo[],
        isScreenplay: boolean = false,
        isShowComment: boolean = false): string[] {
        let formatted: string[] = [];

        const _safeDesc = (info: DocInfo): string[] => {
            return info.descs ? info.descs: [];
        };

        for (const info of docInfos) {
            const descs = _safeDesc(info);
            if (info.docType === "title") {
                // Title
                formatted.push(descs[0]);
            } else if (info.docType === "scene") {
                // Scene
                if (isScreenplay) {
                    formatted.push(this._convSceneInfoFromDesc(descs[0]));
                } else {
                    continue;
                }
            } else if (info.docType === "subinfo") {
                // Sub info
                continue;
            } else if (info.docType === "plain") {
                // Plain
                formatted.push(descs[0]);
            } else if (info.docType === "dialogue") {
                // Dialogue
                let doc = this._completeDialogue(descs);
                if (isScreenplay) {
                    let subject = info.subject ? info.subject: '？';
                    doc = subject + doc;
                }
                formatted.push(doc);
            } else if (info.docType === "narration") {
                // Narration
                let doc = this._completeDialogue(descs);
                let subject = info.subject ? info.subject: 'Ｎ';
                formatted.push(subject + doc);
            } else if (info.docType === "monologue") {
                // Monologue
                let doc = this._completeDialogue(descs);
                let subject = info.subject ? info.subject: 'Ｍ';
                formatted.push(subject + doc);
            } else if (info.docType === "voice") {
                // Voice
                let doc = this._completeDialogue(descs, '』');
                if (isScreenplay) {
                    let subject = info.subject ? info.subject: '？';
                    doc = subject + doc;
                }
                formatted.push(doc);
            } else if (info.docType === "think") {
                // Think
                let doc = this._completeDialogue(descs, '）');
                if (isScreenplay) {
                    let subject = info.subject ? info.subject: '';
                    doc = subject + 'Ｍ' + doc;
                }
                formatted.push(doc);
            } else if (info.docType === "comment") {
                // Comment
                if (isShowComment) {
                    formatted.push(descs[0]);
                } else {
                    continue;
                }
            } else if (info.docType === "break") {
                // Break
                formatted.push('');
            } else if (info.docType === "description") {
                // Description
                formatted.push('　' + this._completeDesc(descs));
            }
        }

        return formatted;
    }

    private _convSceneInfoFromDesc (desc: string): string {
        let scene = desc;
        scene = scene
            .replace(/^## /, '○');
        return scene;
    }

    private regEndDesc = /(。|、|！|？|」|』|）)$/;
    private regEndMark = /(！|？)$/;
    private regEndMarkSpace = /(！|？)　$/;
    private regEndMaru = /。$/;

    private _completeDialogue (descs: string[], bracket: string = '」'): string {
        let docs = "";
        for (const desc of descs) {
            if (this.regEndDesc.test(desc)) {
                docs += desc;
            } else if (this.regEndMark.test(desc)) {
                docs += desc + '　';
            } else if (desc) {
                docs += desc + "。";
            }
        }
        if (this.regEndMarkSpace.test(docs)) {
            docs = docs.slice(0, -1) + bracket;
        } else if (this.regEndMaru.test(docs)) {
            docs = docs.slice(0, -1) + bracket;
        }
        return docs;
    }


    private _completeDesc (descs: string[]): string {
        let docs = "";
        for (const desc of descs) {
            if (this.regEndDesc.test(desc)) {
                docs += desc;
            } else if (this.regEndMark.test(desc)) {
                docs += desc + '　';
            } else if (desc) {
                docs += desc + "。";
            }
        }
        if (this.regEndMarkSpace.test(docs)) {
            docs = docs.slice(0, -1);
        }
        return docs;
    }

    private _formatDocument (documents: string[], style: string = 'default'): string {
        let formatted = "";
        if (style === 'default') {
            // default breakline
            formatted = this._formatAsDefault(documents);
        } else if (style === 'web') {
            // web style breakline
            // NOTE:
            //      文章と台詞の間は１行空行
            formatted = this._formatAsWebNovel(documents);
        } else if (style === 'screenplay') {
            // screenplay style
            formatted = this._formatAsScreenplay(documents);
        } else if (style === 'audiodrama') {
            // audio drama style
            formatted = this._formatAsAudioDrama(documents);
        }
        return formatted;
    }

    private _formatAsDefault (documents: string[]): string {
        let formatted: string = "";
        for (const line of documents) {
            formatted += line + '\n';
        }
        return formatted;
    }

    private _formatAsWebNovel (documents: string[]): string {
        let formatted: string = "";
        let inDesc = false;
        let inDialogue = false;

        for (const line of documents) {
            if (this._beginBracket1.test(line)) {
                if (inDialogue) {
                    formatted += line + '\n';
                } else {
                    inDialogue = true;
                    formatted += '\n' + line + '\n';
                }
                inDesc = false;
            } else if (this._beginHead1.test(line)) {
                if (!formatted) {
                    formatted = line + '\n\n';
                } else {
                    formatted += '\n' + line + '\n';
                }
                inDesc = inDialogue = false;
            } else if (line) {
                if (inDesc) {
                    formatted += line + '\n';
                } else {
                    inDesc = true;
                    formatted += '\n' + line + '\n';
                }
                inDialogue = false;
            } else {
                formatted += line + '\n';
            }
        }
        return formatted;
    }

    private _beginNarration = /^Ｎ「/;
    private _beginMonologue = /^.*Ｍ「/;
    private _beginScreenplayDialogue = /^.*「/;
    private _beginSceneSpin = /^○.*/;
    private _beginScreenplayDesc = /^　.*/;

    private _formatAsScreenplay (documents: string[]): string {
        let formatted: string = '';

        for (const line of documents) {
            if (this._beginHead1.test(line)) {
                if (!formatted) {
                    formatted = line + '\n\n';
                } else {
                    formatted += '\n' + line + '\n';
                }
            } else if (this._beginSceneSpin.test(line)) {
                formatted += '\n' + line + '\n';
            } else if (this._beginNarration.test(line)) {
                formatted += line + '\n';
            } else if (this._beginMonologue.test(line)) {
                formatted += line + '\n';
            } else if (this._beginScreenplayDialogue.test(line)) {
                formatted += line + '\n';
            } else if (this._beginScreenplayDesc.test(line)) {
                formatted += '　' + line + '\n';
            } else if (line) {
                formatted += line + '\n';
            }
        }

        return formatted;
    }

    private _formatAsAudioDrama (documents: string[]): string {
        let formatted: string = '';

        for (const line of documents) {
            if (this._beginHead1.test(line)) {
                if (!formatted) {
                    formatted = line + '\n\n';
                } else {
                    formatted += '\n' + line + '\n';
                }
            } else if (this._beginSceneSpin.test(line)) {
                continue;
            } else if (this._beginNarration.test(line)) {
                formatted += line + '\n';
            } else if (this._beginMonologue.test(line)) {
                formatted += line + '\n';
            } else if (this._beginScreenplayDialogue.test(line)) {
                formatted += line + '\n';
            } else if (this._beginScreenplayDesc.test(line)) {
                formatted += '　' + line + '\n';
            } else if (line) {
                formatted += line + '\n';
            }
        }

        return formatted;
    }
}

type DocInfo = {
    docType?: string;
    descs?: string[];
    subject?: string;
};