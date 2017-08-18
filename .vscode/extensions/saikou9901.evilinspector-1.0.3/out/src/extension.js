'use strict';
const vscode = require('vscode');
var decChars;
function activate(context) {
    let cmdInspect = vscode.commands.registerCommand('extension.inspect', () => {
        inspect();
    });
    let cmdSearchEvil = vscode.commands.registerCommand('extension.searchevil', () => {
        growl();
    });
    context.subscriptions.push(cmdInspect);
    context.subscriptions.push(cmdSearchEvil);
    // Also trigger an update on changing the editor
    vscode.window.onDidChangeActiveTextEditor(editor => {
        decorate();
    }, null, context.subscriptions);
    // And when modifying the document
    vscode.workspace.onDidChangeTextDocument(event => {
        decorate();
    }, null, context.subscriptions);
    decorate();
    // functions
    function decorate() {
        var editor = vscode.window.activeTextEditor;
        var src = editor.document.getText();
        vscode.window.setStatusBarMessage('');
        if (decChars != undefined) {
            decChars.decorator.dispose();
        }
        var regex = new RegExp('　', 'gm');
        var match;
        decChars = {
            'chars': [],
            'decorator': vscode.window.createTextEditorDecorationType({
                'borderWidth': '1px',
                'borderRadius': '2px',
                'borderStyle': 'solid',
                'light': {
                    'backgroundColor': 'rgba(58, 70, 101, 0.3)',
                    'borderColor': 'rgba(58, 70, 101, 0.4)'
                },
                'dark': {
                    'backgroundColor': 'rgba(117, 141, 203, 0.3)',
                    'borderColor': 'rgba(117, 141, 203, 0.4)'
                }
            })
        };
        while (match = regex.exec(src)) {
            var startPos = editor.document.positionAt(match.index);
            var endPos = editor.document.positionAt(match.index + match[0].length);
            var range = new vscode.Range(startPos, endPos);
            decChars.chars.push(range);
        }
        editor.setDecorations(decChars.decorator, decChars.chars);
    }
    function inspect() {
        if (decChars == undefined) {
            return;
        }
        var editor = vscode.window.activeTextEditor;
        var nowPosition = editor.selection.active;
        var targetRange = null;
        for (var i in decChars.chars) {
            if (nowPosition.compareTo(decChars.chars[i].start) <= 0) {
                targetRange = decChars.chars[i];
                break;
            }
        }
        if (targetRange == null) {
            targetRange = decChars.chars[0];
        }
        moveto(editor, targetRange);
    }
    function moveto(editor, targetRange) {
        editor.revealRange(targetRange); // texteditor scroll
        editor.selection = new vscode.Selection(targetRange.start, targetRange.end); // move cursor
    }
    function growl() {
        if (decChars == undefined) {
            return;
        }
        vscode.window.setStatusBarMessage(decChars.chars.length + ' evils! growl!');
    }
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
class DecChars {
}
//# sourceMappingURL=extension.js.map