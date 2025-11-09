// src/extension.js
const vscode = require('vscode');
const { AuthManager } = require('./auth/authManager');
const { ApiClient } = require('./api/apiClient');
const { ReportPanel } = require('./views/reportPanel');
const config = require('./config');

let authManager;
let apiClient;
let statusBarItem;
let currentAppId;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('Scanara HIPAA Compliance extension is now active');

    // Initialize managers
    authManager = new AuthManager(context);
    apiClient = new ApiClient(authManager);

    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.command = 'scanara.analyze';
    updateStatusBar();
    statusBarItem.show();

    // Register commands
    const loginCommand = vscode.commands.registerCommand(
        'scanara.login',
        async () => {
            try {
                await authManager.login();
                vscode.window.showInformationMessage('Successfully logged in to Scanara!');
                updateStatusBar();
            } catch (error) {
                vscode.window.showErrorMessage(`Login failed: ${error.message}`);
            }
        }
    );

    const logoutCommand = vscode.commands.registerCommand(
        'scanara.logout',
        async () => {
            await authManager.logout();
            currentAppId = undefined;
            await context.workspaceState.update('currentAppId', undefined);
            vscode.window.showInformationMessage('Logged out successfully');
            updateStatusBar();
        }
    );

    const setupAppCommand = vscode.commands.registerCommand(
        'scanara.setupApp',
        async () => {
            if (!authManager.isAuthenticated()) {
                const result = await vscode.window.showWarningMessage(
                    'Please login first',
                    'Login'
                );
                if (result === 'Login') {
                    await vscode.commands.executeCommand('scanara.login');
                }
                return;
            }

            await setupApp(context);
        }
    );

    const analyzeCommand = vscode.commands.registerCommand(
        'scanara.analyze',
        async () => {
            if (!authManager.isAuthenticated()) {
                const result = await vscode.window.showWarningMessage(
                    'Please login first',
                    'Login'
                );
                if (result === 'Login') {
                    await vscode.commands.executeCommand('scanara.login');
                }
                return;
            }

            // Check if app is set up
            if (!currentAppId) {
                const result = await vscode.window.showWarningMessage(
                    'Please set up an app for this workspace first',
                    'Set Up App'
                );
                if (result === 'Set Up App') {
                    await vscode.commands.executeCommand('scanara.setupApp');
                }
                return;
            }

            await analyzeWorkspace(context);
        }
    );

    const viewReportsCommand = vscode.commands.registerCommand(
        'scanara.viewReports',
        async () => {
            if (!authManager.isAuthenticated()) {
                vscode.window.showWarningMessage('Please login first');
                return;
            }

            if (!currentAppId) {
                vscode.window.showWarningMessage('No app configured for this workspace. Please set up an app first.');
                return;
            }

            // Construct the URL to the specific audit page
            const dashboardUrl = config.webUrl + '/audit/' + currentAppId;
            console.log('Debug - config object:', config);
            console.log('Debug - config.webUrl:', config.webUrl);
            console.log('Debug - dashboardUrl:', dashboardUrl);
            vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
        }
    );

    const viewAuditHistoryCommand = vscode.commands.registerCommand(
        'scanara.viewAuditHistory',
        async () => {
            if (!authManager.isAuthenticated()) {
                const result = await vscode.window.showWarningMessage(
                    'Please login first',
                    'Login'
                );
                if (result === 'Login') {
                    await vscode.commands.executeCommand('scanara.login');
                }
                return;
            }

            if (!currentAppId) {
                vscode.window.showWarningMessage('No app configured for this workspace');
                return;
            }

            await viewAuditHistory();
        }
    );

    context.subscriptions.push(
        loginCommand,
        logoutCommand,
        setupAppCommand,
        analyzeCommand,
        viewReportsCommand,
        viewAuditHistoryCommand,
        statusBarItem
    );

    // Restore app ID from workspace state
    currentAppId = context.workspaceState.get('currentAppId');
}

async function setupApp(context) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    // Check if app already exists for this workspace
    const existingAppId = context.workspaceState.get('currentAppId');
    
    if (existingAppId) {
        const choice = await vscode.window.showQuickPick(
            ['Use Existing App', 'Create New App'],
            { placeHolder: 'This workspace already has an app configured' }
        );

        if (choice === 'Use Existing App') {
            currentAppId = existingAppId;
            vscode.window.showInformationMessage('Using existing app configuration');
            updateStatusBar();
            return;
        }
    }

    // Suggest workspace folder name
    const defaultName = workspaceFolder.name;
    const appName = await vscode.window.showInputBox({
        prompt: 'Enter a name for your app',
        value: defaultName,
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'App name cannot be empty';
            }
            if (value.length > 100) {
                return 'App name must be less than 100 characters';
            }
            return null;
        }
    });

    if (!appName) {
        return;
    }

    try {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Creating app...',
            },
            async () => {
                const result = await apiClient.createApp(appName.trim());
                currentAppId = result.app.id;
                await context.workspaceState.update('currentAppId', currentAppId);
                
                vscode.window.showInformationMessage(
                    `App "${appName}" created successfully!`
                );
                updateStatusBar();
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to create app: ${error.message}`);
    }
}

async function viewAuditHistory() {
    try {
        const audits = await apiClient.getAuditHistory(currentAppId);

        if (!audits || audits.length === 0) {
            vscode.window.showInformationMessage('No audit history found for this app');
            return;
        }

        // Create quick pick items from audit history
        const auditMap = new Map();
        const items = audits.map(function(audit) {
            const date = new Date(audit.createdAt).toLocaleString();
            const statusIcon = audit.status === 'Compliant' ? '✓' :
                              audit.status === 'Needs Attention' ? '⚠' : '✗';
            const label = statusIcon + ' ' + audit.status + ' - Score: ' + audit.complianceScore + '/100';

            // Store audit in map with label as key
            auditMap.set(label, audit);

            return {
                label: label,
                description: date,
                detail: (audit.findings ? audit.findings.length : 0) + ' findings'
            };
        });

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select an audit to view',
            matchOnDescription: true,
            matchOnDetail: true
        });

        if (selected) {
            // Retrieve the audit from the map using the label
            const label = selected['label'] || selected;
            const selectedAudit = auditMap.get(label);
            if (selectedAudit) {
                ReportPanel.render(selectedAudit, currentAppId);
            }
        }
    } catch (error) {
        vscode.window.showErrorMessage('Failed to fetch audit history: ' + error.message);
    }
}

async function analyzeWorkspace(context) {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    if (!currentAppId) {
        vscode.window.showErrorMessage('No app configured for this workspace');
        return;
    }

    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: 'Running HIPAA compliance audit...',
            cancellable: true,
        },
        async (progress, token) => {
            try {
                progress.report({ increment: 10, message: 'Collecting files...' });

                // Get all relevant code files
                const files = await vscode.workspace.findFiles(
                    '**/*.{js,jsx,ts,tsx,py,java,cpp,c,cs,go,rs,php,rb,swift,kt,scala,dart,vue,svelte}',
                    '{**/node_modules/**,**/venv/**,**/env/**,**/.venv/**,**/dist/**,**/build/**,**/.git/**}'
                );

                if (token.isCancellationRequested) return;

                if (files.length === 0) {
                    vscode.window.showWarningMessage('No code files found in workspace');
                    return;
                }

                progress.report({ increment: 20, message: `Reading ${files.length} files...` });

                // Read file contents (limit to 100 files)
                const filesToAnalyze = files.slice(0, 100);
                const fileContents = await Promise.all(
                    filesToAnalyze.map(async (file) => ({
                        path: vscode.workspace.asRelativePath(file),
                        content: (await vscode.workspace.fs.readFile(file)).toString(),
                    }))
                );

                if (token.isCancellationRequested) return;

                progress.report({ increment: 20, message: 'Uploading codebase...' });

                // Upload codebase
                await apiClient.uploadCodebase(
                    currentAppId,
                    fileContents,
                    workspaceFolder.name
                );

                if (token.isCancellationRequested) return;

                progress.report({ increment: 30, message: 'Analyzing for HIPAA compliance...' });

                // Run audit
                const report = await apiClient.runAudit(currentAppId);

                if (token.isCancellationRequested) return;

                progress.report({ increment: 20, message: 'Complete!' });

                // Update status bar with score
                updateStatusBar(report.complianceScore, report.status);

                // Show report
                ReportPanel.render(report, currentAppId);

                vscode.window.showInformationMessage(
                    `Audit complete! Score: ${report.complianceScore}/100 - ${report.status}`
                );
            } catch (error) {
                vscode.window.showErrorMessage(`Analysis failed: ${error.message}`);
            }
        }
    );
}

function updateStatusBar(score, status) {
    if (!authManager.isAuthenticated()) {
        statusBarItem.text = '$(shield) Scanara: Not Logged In';
        statusBarItem.tooltip = 'Click to login';
        statusBarItem.command = 'scanara.login';
        return;
    }

    if (score !== undefined && status !== undefined) {
        const icon = status === 'Compliant' ? '$(pass-filled)' : 
                     status === 'Needs Attention' ? '$(warning)' : '$(error)';
        statusBarItem.text = `${icon} HIPAA: ${score}/100`;
        statusBarItem.tooltip = `Compliance Status: ${status}\nClick to run new audit`;
    } else {
        statusBarItem.text = '$(shield) Run HIPAA Audit';
        statusBarItem.tooltip = 'Click to analyze workspace for HIPAA compliance';
    }
    
    statusBarItem.command = 'scanara.analyze';
}

function deactivate() {
    if (statusBarItem) {
        statusBarItem.dispose();
    }
}

module.exports = {
    activate,
    deactivate
};