'use strict';
var vscode = require('vscode');
function activate(context) {
    var commandShuntLeft = vscode.commands.registerTextEditorCommand('extension.shunt_left', function (textEditor, edit) {
        doShuntLeft(textEditor, edit);
    });
    var commandShuntRight = vscode.commands.registerTextEditorCommand('extension.shunt_right', function (textEditor, edit) {
        doShuntRight(textEditor, edit);
    });
    var commandShuntSelect = vscode.commands.registerTextEditorCommand('extension.shunt_select', function (textEditor, edit) {
        doShuntSelect(textEditor, edit);
    });
    context.subscriptions.push(commandShuntLeft);
    context.subscriptions.push(commandShuntRight);
    context.subscriptions.push(commandShuntSelect);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
function doShuntLeft(textEditor, edit) {
    var document = textEditor.document;
    var tabSize = checkTabSize(textEditor);
    var arrSelection = [];
    textEditor.edit(function (editBuilder) {
        textEditor.selections.forEach(function (selection) {
            var minSpaces = Number.MAX_SAFE_INTEGER;
            var arrLineLayout = [];
            for (var lineIndex = selection.start.line; lineIndex <= selection.end.line; lineIndex++) {
                var lineAt = document.lineAt(lineIndex);
                var lineRange = lineAt.range;
                var lineLength = lineAt.text.length;
                if ((lineIndex < selection.end.line) || (lineRange.end.isBeforeOrEqual(selection.end) && (lineLength > 0))) {
                    var firstNonSpace = lineAt.text.search(/\S/);
                    if ((firstNonSpace >= 0) && (firstNonSpace < lineLength)) {
                        var numSpaces = calcLineSize(lineAt.text.substring(0, firstNonSpace), tabSize);
                        if (numSpaces < minSpaces) {
                            minSpaces = numSpaces;
                        }
                    }
                    arrLineLayout.push({
                        numLine: lineIndex,
                        textLine: lineAt,
                        firstNonSpace: firstNonSpace
                    });
                }
            }
            if (minSpaces < Number.MAX_SAFE_INTEGER) {
                var spaces_1 = buildSpaces(minSpaces, tabSize);
                arrLineLayout.forEach(function (layout) {
                    var lineRange = layout.textLine.range;
                    if (layout.firstNonSpace < 0) {
                        if (layout.textLine.text.length > 0) {
                            editBuilder.delete(lineRange);
                        }
                        editBuilder.insert(lineRange.start, spaces_1);
                        arrSelection.push(new vscode.Selection(lineRange.start.translate(0, spaces_1.length), lineRange.start.translate(0, spaces_1.length)));
                    }
                    else {
                        var lineIndex = calcLineIndex(layout.textLine.text, minSpaces, tabSize);
                        arrSelection.push(new vscode.Selection(lineRange.start.translate(0, lineIndex), lineRange.start.translate(0, lineIndex)));
                    }
                });
            }
        });
    }).then(function () {
        textEditor.selections;
        textEditor.selections = arrSelection;
    });
}
function doShuntRight(textEditor, edit) {
    var document = textEditor.document;
    var tabSize = checkTabSize(textEditor);
    var arrSelection = [];
    textEditor.edit(function (editBuilder) {
        textEditor.selections.forEach(function (selection) {
            var maxLineLength = -1;
            var arrLineLayout = [];
            for (var lineIndex = selection.start.line; lineIndex <= selection.end.line; lineIndex++) {
                var lineAt = document.lineAt(lineIndex);
                var lineText = lineAt.text;
                var charactersInLine = lineAt.range.end.character - lineAt.range.start.character;
                var documentPos = lineAt.range.end;
                if ((lineIndex < selection.end.line) || (lineAt.range.end.isBeforeOrEqual(selection.end) && (charactersInLine > 0))) {
                    var lineColumns = calcLineSize(lineText, tabSize);
                    if (lineColumns > maxLineLength) {
                        maxLineLength = lineColumns;
                    }
                    arrLineLayout.push({
                        numLine: lineIndex,
                        length: lineColumns,
                        lastCharPos: documentPos
                    });
                }
            }
            arrLineLayout.forEach(function (layout) {
                if (layout.length < maxLineLength) {
                    var spaces = buildSpaces(maxLineLength - layout.length, tabSize, layout.length);
                    editBuilder.insert(layout.lastCharPos, spaces);
                }
                arrSelection.push(new vscode.Selection(new vscode.Position(layout.numLine, maxLineLength), new vscode.Position(layout.numLine, maxLineLength)));
            });
        });
    }).then(function () {
        textEditor.selections;
        textEditor.selections = arrSelection;
    });
}
function doShuntSelect(textEditor, edit) {
    var document = textEditor.document;
    var arrSelection = [];
    textEditor.edit(function (editBuilder) {
        textEditor.selections.forEach(function (selection) {
            for (var lineIndex = selection.start.line; lineIndex <= selection.end.line; lineIndex++) {
                var lineAt = document.lineAt(lineIndex);
                if ((lineIndex < selection.end.line) || (lineAt.range.end.isBeforeOrEqual(selection.end) && (lineAt.text.length > 0))) {
                    if (!lineAt.isEmptyOrWhitespace) {
                        arrSelection.push(new vscode.Selection(lineAt.range.start.translate(0, lineAt.firstNonWhitespaceCharacterIndex), lineAt.range.end));
                    }
                }
            }
        });
    }).then(function () {
        textEditor.selections;
        textEditor.selections = arrSelection;
    });
}
function calcLineSize(text, tabSize) {
    var charactersInLine = text.length;
    var lineColumns = 0;
    if (tabSize > 1) {
        var lineChar = 0;
        while (true) {
            var prevIndex = lineChar;
            lineChar = text.indexOf("\t", prevIndex);
            if (lineChar >= 0) {
                lineColumns += lineChar - prevIndex;
                lineColumns += tabSize - (lineColumns % tabSize);
                lineChar++;
            }
            else {
                lineColumns += charactersInLine - prevIndex;
                break;
            }
        }
    }
    else {
        lineColumns = charactersInLine;
    }
    return lineColumns;
}
function calcLineIndex(text, position, tabSize) {
    if (tabSize > 1) {
        var lineColumns = 0;
        for (var textIndex = 0; textIndex < text.length; textIndex++) {
            if (text.charAt(textIndex) == "\t") {
                lineColumns += tabSize - (lineColumns % tabSize);
            }
            else {
                lineColumns++;
            }
            if (lineColumns == position) {
                return textIndex + 1;
            }
            else if (lineColumns > position) {
                return textIndex;
            }
        }
        return text.length;
    }
    else {
        return position;
    }
}
function buildSpaces(size, tabSize, startColumn) {
    if (startColumn === void 0) { startColumn = 0; }
    if (!isNaN(tabSize) && (tabSize > 1)) {
        if ((startColumn % 4) > 0) {
            if (size < tabSize) {
                return ' '.repeat(size);
            }
            else {
                var remainder = size - (4 - (startColumn % 4));
                return "\t" + "\t".repeat(Math.trunc(remainder / tabSize)) + ' '.repeat(remainder % tabSize);
            }
        }
        else {
            return "\t".repeat(Math.trunc(size / tabSize)) + ' '.repeat(size % tabSize);
        }
    }
    else {
        return ' '.repeat(size);
    }
}
function checkTabSize(textEditor) {
    if (textEditor.options.insertSpaces == true) {
        return 1;
    }
    else if ((!isNaN(Number(textEditor.options.tabSize))) && (textEditor.options.tabSize > 1)) {
        return Number(textEditor.options.tabSize);
    }
    else {
        return 1;
    }
}
//# sourceMappingURL=extension.js.map