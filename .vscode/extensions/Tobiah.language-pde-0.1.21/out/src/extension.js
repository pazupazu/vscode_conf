"use strict";
var vscode = require('vscode');
var fs = require("fs");
var open = require("open");
var child_process = require("child_process");
function copyFile(source, target, cb) {
    var cbCalled = false;
    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
    var rd = fs.createReadStream(source);
    rd.on("error", function (err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function (err) {
        done(err);
    });
    wr.on("close", function (ex) {
        done();
    });
    rd.pipe(wr);
}
function remindAddToPath() {
    return vscode.window.showInformationMessage("Remember to add Processing to your path!", "Learn More").then(function (item) {
        if (item === "Learn More") {
            //Open a URL using the npm module "open"
            open("https://github.com/TobiahZ/processing-vscode#add-processing-to-path");
        }
    });
}
function checkIfProjectOpen(callback) {
    var root = vscode.workspace.rootPath;
    var fileFound = false;
    if (root == undefined) {
        vscode.window.showErrorMessage("Open project folder first");
    }
    else {
        var name = root.replace(/^.*[\\\/]/, '');
        fs.stat(root + "/" + name + ".pde", function (err, stats) {
            if (err && err.code === 'ENOENT') {
                // Named file doesn't exist.
                vscode.window.showErrorMessage("Create a " + name + ".pde file first!");
            }
            else if (err) {
                vscode.window.showErrorMessage("When checking if " + name + ".pde exists: " + err);
            }
            else if (stats.isFile()) {
                callback();
            }
        });
    }
}
function activate(context) {
    console.log('Processing language extension is now active!');
    var create_task_file = vscode.commands.registerCommand('extension.processingCreateTaskFile', function () {
        var pdeTaskFile = context.extensionPath + "/ProcessingTasks.json";
        checkIfProjectOpen(function () {
            var taskPath = vscode.workspace.rootPath + "/.vscode/";
            function copyTaskFile(p) {
                copyFile(pdeTaskFile, p, function (err) {
                    if (err) {
                        return console.log(err);
                    }
                    remindAddToPath();
                });
            }
            fs.stat(taskPath, function (err, stats) {
                if (err && err.code === 'ENOENT') {
                    // .vscode doesn't exist, creating it
                    try {
                        fs.mkdirSync(taskPath);
                    }
                    catch (e) {
                        if (e.code != 'EEXIST')
                            throw e;
                    }
                    copyTaskFile(taskPath + "tasks.json");
                }
                else if (err) {
                    vscode.window.showErrorMessage("When checking if .vscode/ exists: " + err);
                }
                else if (stats.isDirectory()) {
                    taskPath = taskPath + "tasks.json";
                    fs.stat(taskPath, function (err, stats) {
                        if (err && err.code === 'ENOENT') {
                            // Task file doesn't exist, creating it
                            copyTaskFile(taskPath);
                        }
                        else if (err) {
                            vscode.window.showErrorMessage("When checking if tasks.json exists: " + err);
                        }
                        else if (stats.isFile()) {
                            return vscode.window.showErrorMessage("tasks.json already exists. Overwrite it?", "Yes").then(function (item) {
                                if (item === "Yes") {
                                    copyTaskFile(taskPath);
                                }
                            });
                        }
                    });
                }
            });
        });
    });
    context.subscriptions.push(create_task_file);
    var run_task_file = vscode.commands.registerCommand('extension.processingRunTaskFile', function () {
        checkIfProjectOpen(function () {
            var root = vscode.workspace.rootPath;
            var cmd = "\"C:\\Program Files\\processing-3.0.1\\processing-java\" --force --sketch=\"" + root + "\" --output=\"" + root + "\\out\" --run";
            child_process.exec(cmd, function (err, stdout, stderr) {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log(stdout);
            });
        });
    });
    context.subscriptions.push(run_task_file);
    var open_documentation = vscode.commands.registerCommand('extension.processingOpenDocumentation', function () {
        open("https://github.com/TobiahZ/processing-vscode#processing-for-visual-studio-code");
    });
    context.subscriptions.push(open_documentation);
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map