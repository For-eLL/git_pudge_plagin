// love_me.js
// OneTouchGit: git add . -> git commit -m "msg" -> git push

const vscode = require('vscode');
const { exec } = require('child_process');

function runCommand(command, cwd) {
    return new Promise((resolve, reject) => {
        exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(stderr || stdout || error.message));
                return;
            }
            resolve({ stdout, stderr });
        });
    });
}

// Генерация автоматического сообщения коммита
function makeAutoMessage() {
    const now = new Date();
    const iso = now.toISOString().replace('T', ' ').substring(0, 19);
    return `auto: update (${iso})`;
}

async function oneTouchGit() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Нет открытой папки. Откройте папку с git-репозиторием.');
        return;
    }

    const cwd = workspaceFolders[0].uri.fsPath;

    // 1. Спрашиваем режим
    const mode = await vscode.window.showQuickPick(
        [
            {
                label: 'Автоматический коммит',
                description: 'Сообщение генерируется автоматически'
            },
            {
                label: 'Ручной коммит',
                description: 'Сообщение вводит пользователь'
            }
        ],
        {
            placeHolder: 'Выберите режим коммита OneTouchGit'
        }
    );

    if (!mode) {
        // пользователь нажал Esc
        return;
    }

    let commitMessage;

    if (mode.label === 'Автоматический коммит') {
        // Вариант 1: авто-сообщение
        commitMessage = makeAutoMessage();
    } else {
        // Вариант 2: пользователь сам вводит сообщение
        commitMessage = await vscode.window.showInputBox({
            prompt: 'Введите сообщение коммита',
            placeHolder: 'Например: fix: пофиксил что-то',
            ignoreFocusOut: true
        });

        if (!commitMessage || !commitMessage.trim()) {
            vscode.window.showInformationMessage('Коммит отменён: пустое сообщение.');
            return;
        }
    }

    const safeMessage = commitMessage.replace(/"/g, '\\"');

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'OneTouchGit: выполняю git add / commit / push',
                cancellable: false
            },
            async () => {
                await runCommand('git add .', cwd);
                await runCommand(`git commit -m "${safeMessage}"`, cwd);
                await runCommand('git push', cwd);
            }
        );

        vscode.window.showInformationMessage(
            `OneTouchGit: git add / commit / push выполнены ✅\nСообщение: ${commitMessage}`
        );
    } catch (err) {
        vscode.window.showErrorMessage('OneTouchGit: ошибка при выполнении git-команд: ' + err.message);
    }
}

function activate(context) {
    console.log('OneTouchGit extension activated');
    const disposable = vscode.commands.registerCommand('onetouchgit.run', oneTouchGit);
    context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
