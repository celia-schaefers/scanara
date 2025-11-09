// src/views/reportPanel.js
const vscode = require('vscode');
const config = require('../config');

class ReportPanel {
    static currentPanel = undefined;

    constructor(panel, report, appId) {
        this.panel = panel;
        this.report = report;
        this.appId = appId;

        this.panel.webview.html = this.getHtmlContent();

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'navigateToIssue':
                        this.navigateToIssue(message.file, message.line);
                        break;
                    case 'exportReport':
                        this.exportReport();
                        break;
                    case 'openWeb':
                        const dashboardUrl = config.webUrl + '/audit/' + this.appId;
                        vscode.env.openExternal(vscode.Uri.parse(dashboardUrl));
                        break;
                }
            }
        );

        this.panel.onDidDispose(() => {
            ReportPanel.currentPanel = undefined;
        });
    }

    static render(report, appId) {
        if (ReportPanel.currentPanel) {
            ReportPanel.currentPanel.report = report;
            ReportPanel.currentPanel.appId = appId;
            ReportPanel.currentPanel.panel.webview.html = ReportPanel.currentPanel.getHtmlContent();
            ReportPanel.currentPanel.panel.reveal();
        } else {
            const panel = vscode.window.createWebviewPanel(
                'scanaraReport',
                'HIPAA Compliance Report',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            ReportPanel.currentPanel = new ReportPanel(panel, report, appId);
        }
    }

    async navigateToIssue(file, line) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) return;

        try {
            const uri = vscode.Uri.joinPath(workspaceFolder.uri, file);
            const document = await vscode.workspace.openTextDocument(uri);
            const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.One);

            const position = new vscode.Position(line - 1, 0);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        } catch (error) {
            vscode.window.showErrorMessage(`Could not open file: ${file}`);
        }
    }

    async exportReport() {
        const uri = await vscode.window.showSaveDialog({
            filters: {
                'JSON': ['json'],
                'HTML': ['html']
            },
            defaultUri: vscode.Uri.file(`hipaa-audit-${Date.now()}.json`)
        });

        if (uri) {
            const content = JSON.stringify(this.report, null, 2);
            await vscode.workspace.fs.writeFile(uri, Buffer.from(content));
            vscode.window.showInformationMessage('Report exported successfully');
        }
    }

    getHtmlContent() {
        const { complianceScore, status, summary, findings = [], remediationPlan = [], componentAnalysis = {} } = this.report;

        const getStatusColor = (status) => {
            if (status === 'Compliant') return '#4caf50';
            if (status === 'Needs Attention') return '#ff9800';
            return '#f44336';
        };

        const getSeverityColor = (severity) => {
            switch (severity.toLowerCase()) {
                case 'critical': return '#f44336';
                case 'high': return '#ff5722';
                case 'medium': return '#ff9800';
                case 'low': return '#ffc107';
                default: return '#2196f3';
            }
        };

        const getComponentStatusIcon = (status) => {
            switch (status) {
                case 'compliant': return '✅';
                case 'partial': return '⚠️';
                case 'non_compliant': return '❌';
                case 'not_found': return '❓';
                default: return '•';
            }
        };

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HIPAA Compliance Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--vscode-panel-border);
        }
        .logo {
            font-size: 48px;
            margin-bottom: 10px;
        }
        h1 { font-size: 32px; margin-bottom: 10px; }
        h2 { 
            font-size: 24px; 
            margin: 30px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        h3 { font-size: 18px; margin: 20px 0 10px 0; }
        
        .score-card {
            background: linear-gradient(135deg, ${getStatusColor(status)}22, ${getStatusColor(status)}11);
            border: 2px solid ${getStatusColor(status)};
            border-radius: 12px;
            padding: 30px;
            margin: 20px 0;
            text-align: center;
        }
        .score-value {
            font-size: 72px;
            font-weight: bold;
            color: ${getStatusColor(status)};
            margin: 10px 0;
        }
        .score-status {
            font-size: 24px;
            font-weight: 600;
            color: ${getStatusColor(status)};
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid var(--vscode-textLink-foreground);
        }
        .stat-card.critical { border-left-color: #f44336; }
        .stat-card.high { border-left-color: #ff5722; }
        .stat-card.medium { border-left-color: #ff9800; }
        .stat-card.low { border-left-color: #ffc107; }
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            margin: 5px 0;
        }
        .stat-label {
            font-size: 14px;
            opacity: 0.8;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .finding {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            border-left: 4px solid;
            cursor: pointer;
            transition: all 0.2s;
        }
        .finding:hover {
            background: var(--vscode-list-hoverBackground);
            transform: translateX(5px);
        }
        .finding-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 12px;
        }
        .finding-title {
            font-weight: 600;
            font-size: 16px;
            flex: 1;
        }
        .severity-badge {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .finding-description {
            margin: 10px 0;
            opacity: 0.9;
        }
        .evidence {
            background: var(--vscode-textCodeBlock-background);
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
        }
        
        .component-list {
            margin: 15px 0;
        }
        .component-item {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 3px solid var(--vscode-panel-border);
        }
        .component-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 8px;
        }
        .component-name {
            font-weight: 600;
            flex: 1;
        }
        .component-status {
            font-size: 12px;
            padding: 3px 8px;
            border-radius: 4px;
            background: var(--vscode-badge-background);
        }
        
        .remediation-item {
            background: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textLink-foreground);
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
        }
        .priority-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .actions {
            display: flex;
            gap: 10px;
            margin: 20px 0;
        }
        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        button.secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        button.secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .top-findings {
            margin: 20px 0;
        }
        .top-finding {
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 4px solid;
        }
        
        .collapsible {
            margin: 10px 0;
        }
        .collapsible-header {
            background: var(--vscode-button-secondaryBackground);
            padding: 12px;
            cursor: pointer;
            border-radius: 4px;
            font-weight: 600;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .collapsible-header:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        .collapsible-content {
            display: none;
            padding: 15px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 0 0 4px 4px;
        }
        .collapsible-content.open {
            display: block;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🛡️</div>
        <h1>HIPAA Compliance Audit Report</h1>
        <p>Powered by Scanara AI</p>
    </div>
    
    <div class="actions">
        <button onclick="exportReport()">📥 Export Report</button>
        <button class="secondary" onclick="openWeb()">🌐 View in Web Dashboard</button>
    </div>
    
    <div class="score-card">
        <div class="score-status">${status}</div>
        <div class="score-value">${complianceScore}</div>
        <div>Out of 100</div>
    </div>
    
    <h2>📊 Summary Statistics</h2>
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-label">Total Issues</div>
            <div class="stat-value">${summary.top_issues_count || 0}</div>
        </div>
        <div class="stat-card critical">
            <div class="stat-label">Critical</div>
            <div class="stat-value">${summary.critical || 0}</div>
        </div>
        <div class="stat-card high">
            <div class="stat-label">High</div>
            <div class="stat-value">${summary.high || 0}</div>
        </div>
        <div class="stat-card medium">
            <div class="stat-label">Medium</div>
            <div class="stat-value">${summary.medium || 0}</div>
        </div>
        <div class="stat-card low">
            <div class="stat-label">Low</div>
            <div class="stat-value">${summary.low || 0}</div>
        </div>
    </div>
    
    ${summary.top_3_findings && summary.top_3_findings.length > 0 ? `
    <h2>🔥 Top 3 Critical Findings</h2>
    <div class="top-findings">
        ${summary.top_3_findings.map((finding, idx) => `
            <div class="top-finding" style="border-left-color: ${getSeverityColor(finding.severity)}">
                <div class="finding-header">
                    <div class="finding-title">${idx + 1}. ${finding.title}</div>
                    <span class="severity-badge" style="background: ${getSeverityColor(finding.severity)}; color: white;">
                        ${finding.severity}
                    </span>
                </div>
                <div class="finding-description">${finding.description}</div>
                ${finding.file_paths && finding.file_paths.length > 0 ? `
                    <div style="margin-top: 10px; opacity: 0.8;">
                        📄 ${finding.file_paths.join(', ')}
                    </div>
                ` : ''}
                ${finding.remediation ? `
                    <div style="margin-top: 10px;">
                        <strong>Remediation:</strong> ${finding.remediation}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${Object.keys(componentAnalysis).length > 0 ? `
    <h2>🔍 Component Analysis</h2>
    ${Object.entries(componentAnalysis).map(([key, category]) => `
        <div class="collapsible">
            <div class="collapsible-header" onclick="toggleCollapsible(this)">
                <span>${key.replace(/_/g, ' ').toUpperCase()} - Score: ${category.score}/100</span>
                <span>▼</span>
            </div>
            <div class="collapsible-content">
                ${category.components && category.components.map((comp) => `
                    <div class="component-item">
                        <div class="component-header">
                            <span>${getComponentStatusIcon(comp.status)}</span>
                            <span class="component-name">${comp.name}</span>
                            <span class="component-status">${comp.status}</span>
                        </div>
                        <div>${comp.description}</div>
                        ${comp.remediation && comp.status !== 'compliant' ? `
                            <div style="margin-top: 10px; padding: 10px; background: var(--vscode-textBlockQuote-background); border-radius: 4px;">
                                <strong>Fix:</strong> ${comp.remediation}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('')}
    ` : ''}
    
    ${findings.length > 0 ? `
    <h2>🔎 Detailed Findings (${findings.length})</h2>
    ${findings.slice(0, 20).map(finding => `
        <div class="finding" style="border-left-color: ${getSeverityColor(finding.severity)}"
             onclick="navigateToFirstEvidence('${finding.id}')">
            <div class="finding-header">
                <div class="finding-title">${finding.id}: ${finding.description}</div>
                <span class="severity-badge" style="background: ${getSeverityColor(finding.severity)}; color: white;">
                    ${finding.severity}
                </span>
            </div>
            ${finding.evidence && finding.evidence.length > 0 ? `
                <div class="evidence">
                    📄 ${finding.evidence[0].file}:${finding.evidence[0].line_start}
                    <br>
                    <code>${finding.evidence[0].snippet || 'See file for details'}</code>
                </div>
            ` : ''}
            ${finding.recommended_fix ? `
                <div style="margin-top: 10px;">
                    <strong>Recommended Fix:</strong> ${finding.recommended_fix.patch_example || 'See remediation plan'}
                </div>
            ` : ''}
        </div>
    `).join('')}
    ${findings.length > 20 ? `<p style="text-align: center; opacity: 0.7;">Showing 20 of ${findings.length} findings. Export report for full details.</p>` : ''}
    ` : '<p>✅ No findings - Great work!</p>'}
    
    ${remediationPlan.length > 0 ? `
    <h2>🔧 Remediation Plan (${remediationPlan.length} items)</h2>
    ${remediationPlan.slice(0, 10).map(item => `
        <div class="remediation-item">
            <span class="priority-badge" style="background: ${getSeverityColor(item.priority)}; color: white;">
                ${item.priority}
            </span>
            <h3>${item.title}</h3>
            <ul style="margin: 10px 0 10px 20px;">
                ${item.steps.map(step => `<li>${step}</li>`).join('')}
            </ul>
            <div style="opacity: 0.8;">
                ⏱️ Estimated: ${item.estimated_hours} hours
            </div>
        </div>
    `).join('')}
    ${remediationPlan.length > 10 ? `<p style="text-align: center; opacity: 0.7;">Showing 10 of ${remediationPlan.length} items. Export report for full plan.</p>` : ''}
    ` : ''}
    
    <script>
        const vscode = acquireVsCodeApi();
        
        function navigateToFirstEvidence(findingId) {
            const findings = ${JSON.stringify(findings)};
            const finding = findings.find(f => f.id === findingId);
            if (finding && finding.evidence && finding.evidence.length > 0) {
                vscode.postMessage({
                    command: 'navigateToIssue',
                    file: finding.evidence[0].file,
                    line: finding.evidence[0].line_start
                });
            }
        }
        
        function exportReport() {
            vscode.postMessage({ command: 'exportReport' });
        }
        
        function openWeb() {
            vscode.postMessage({ command: 'openWeb' });
        }
        
        function toggleCollapsible(header) {
            const content = header.nextElementSibling;
            const arrow = header.querySelector('span:last-child');
            content.classList.toggle('open');
            arrow.textContent = content.classList.contains('open') ? '▲' : '▼';
        }
    </script>
</body>
</html>`;
    }
}

module.exports = { ReportPanel };