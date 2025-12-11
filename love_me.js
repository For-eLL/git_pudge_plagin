const vscode = require('vscode');
const { exec } = require('child_process');

function runGit(args, cwd) {
    return new Promise((resolve, reject) => {
        exec(`git ${args.join(' ')}`, { cwd }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr || stdout || error.message));
                return;
            }
            resolve();
        });
    });
}

async function oneTouchGit() {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage('OneTouchGit: сначала откройте папку с git-репозиторием.');
        return;
    }
    const cwd = folders[0].uri.fsPath;
    const mode = await vscode.window.showQuickPick(
        ['Автокоммит', 'Ручной коммит'],
        { placeHolder: 'Выберите режим коммита OneTouchGit' } //
    ); 
    if (!mode) { 
        return; 
    }
    let message;
    if (mode === 'Автокоммит') {
        const now = new Date().toLocaleString();
        message = `auto: update (${now})`;
    } else {
        message = await vscode.window.showInputBox({
            prompt: 'Сообщение коммита',
            placeHolder: 'Например: fix: я легендарный коммит, который исправляет всё',
        });
        if (!message || !message.trim()) {
            vscode.window.showInformationMessage('OneTouchGit: пустое сообщение, коммит отменён.');
            return;
        }
    }
    message = message.replace(/"/g, '\'');
    try {
        await runGit(['add', '.'], cwd);
        await runGit(['commit', '-m', `"${message}"`], cwd);
        await runGit(['push'], cwd);

        vscode.window.showInformationMessage('OneTouchGit: изменения отправлены в репозиторий.');
    } catch (err) {
        vscode.window.showErrorMessage('OneTouchGit: ошибка при выполнении git-команд: ' + err.message);
    }
}
function activate(context) {
    const disposable = vscode.commands.registerCommand('onetouchgit.run', oneTouchGit);
    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };
