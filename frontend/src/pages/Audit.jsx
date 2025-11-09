import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCurrentUser } from '../services/auth';
import { getApps } from '../services/apps';
import { runAudit, getAudits } from '../services/audit';
import './Audit.css';

const Audit = () => {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [auditHistory, setAuditHistory] = useState([]);
  const [currentAudit, setCurrentAudit] = useState(null);
  const [error, setError] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [expandedFindings, setExpandedFindings] = useState(new Set());

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    setUser(currentUser);
    fetchApp();
    fetchAudits();
  }, [appId, navigate]);

  const fetchApp = async () => {
    try {
      const apps = await getApps();
      const foundApp = apps.find(a => a.id === appId);
      if (foundApp) {
        setApp(foundApp);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching app:', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchAudits = async () => {
    try {
      const audits = await getAudits(appId);
      setAuditHistory(audits);
      if (audits.length > 0) {
        setCurrentAudit(audits[0]); // Set latest audit
      }
    } catch (err) {
      console.error('Error fetching audits:', err);
    }
  };

  const handleRunAudit = async () => {
    try {
      setRunning(true);
      setError('');
      const result = await runAudit(appId);
      console.log('Audit result:', result);
      
      // Ensure result has required fields
      if (result) {
        // Normalize the result structure
        const normalizedResult = {
          id: result.auditId || result.id,
          complianceScore: result.complianceScore || result.scores?.overall_score || 0,
          status: result.status || 'Unknown',
          scores: result.scores || {},
          summary: result.summary || {},
          findings: result.findings || result.detailedFindings || [],
          metrics: result.metrics || {},
          remediationPlan: result.remediationPlan || [],
          actionsRequired: result.actionsRequired || {},
          componentAnalysis: result.componentAnalysis || {},
          createdAt: new Date().toISOString(),
        };
        setCurrentAudit(normalizedResult);
      }
      
      // Refresh audit history
      await fetchAudits();
    } catch (err) {
      setError(err.message || 'Failed to run audit. Please try again.');
      console.error('Error running audit:', err);
      setCurrentAudit(null);
    } finally {
      setRunning(false);
    }
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const toggleFinding = (findingId) => {
    const newExpanded = new Set(expandedFindings);
    if (newExpanded.has(findingId)) {
      newExpanded.delete(findingId);
    } else {
      newExpanded.add(findingId);
    }
    setExpandedFindings(newExpanded);
  };

  const getFilteredFindings = () => {
    if (!currentAudit || !currentAudit.findings) return [];
    if (selectedSeverity === 'all') return currentAudit.findings;
    return currentAudit.findings.filter(f => 
      f.severity?.toLowerCase() === selectedSeverity.toLowerCase()
    );
  };

  const getFindingsBySeverity = (severity) => {
    if (!currentAudit || !currentAudit.findings) return 0;
    return currentAudit.findings.filter(f => 
      f.severity?.toLowerCase() === severity.toLowerCase()
    ).length;
  };

  // Default component structure if not provided by backend
  const getDefaultComponentAnalysis = () => {
    return {
      technical_safeguards: {
        status: 'non_compliant',
        score: 0,
        components: [
          { name: 'Encryption at Rest', status: 'not_found', description: 'Encryption at rest not properly configured', evidence: 'Database or storage encryption not found', remediation: 'Enable AES-256 encryption for all PHI storage. Configure database encryption (PostgreSQL, S3, EBS) and use KMS for key management.', files: [] },
          { name: 'Encryption in Transit', status: 'not_found', description: 'TLS/HTTPS not properly enforced', evidence: 'HTTP endpoints or missing TLS configuration found', remediation: 'Enforce HTTPS/TLS 1.2+ for all PHI transmission. Use SSL certificates (Let\'s Encrypt or AWS ACM) and enable HSTS.', files: [] },
          { name: 'Unique User IDs', status: 'not_found', description: 'Shared accounts or duplicate IDs found', evidence: 'No unique user ID implementation found', remediation: 'Ensure each user has a unique login credential. Use UUIDs for user IDs and prevent shared accounts.', files: [] },
          { name: 'Authentication', status: 'not_found', description: 'Weak authentication found', evidence: 'No OAuth2, JWT, or strong authentication found', remediation: 'Implement strong authentication (OAuth2, JWT, or OpenID Connect). Require MFA for admin/doctor access.', files: [] },
          { name: 'Role-Based Access Control (RBAC)', status: 'not_found', description: 'RBAC not properly implemented', evidence: 'No RBAC middleware or policy-based access found', remediation: 'Implement RBAC middleware or policy-based access in backend. Ensure users can only access what their role allows.', files: [] },
          { name: 'Multi-Factor Authentication (MFA)', status: 'not_found', description: 'MFA not required', evidence: 'No MFA requirement found for sensitive roles', remediation: 'Require MFA for admin and doctor roles. Implement MFA using services like Auth0, AWS Cognito, or similar.', files: [] },
          { name: 'Audit Logging', status: 'not_found', description: 'Insufficient audit logging', evidence: 'PHI access events not properly logged', remediation: 'Record all PHI-related access, edits, and deletions. Store logs securely (e.g., AWS CloudWatch, ELK Stack) with user ID, timestamp, and action.', files: [] },
          { name: 'Data Integrity Verification', status: 'not_found', description: 'No data integrity checks found', evidence: 'No hash verification or digital signatures found', remediation: 'Implement hash verification or digital signatures to ensure PHI is not altered improperly.', files: [] },
          { name: 'Session Management', status: 'not_found', description: 'Weak session management', evidence: 'No JWT expiration or CSRF protection found', remediation: 'Implement short-lived JWTs, refresh tokens, and CSRF protection. Set appropriate token expiration times.', files: [] },
          { name: 'Automatic Logout', status: 'not_found', description: 'No automatic logout found', evidence: 'No session timeout implementation found', remediation: 'Implement session timeout after inactivity. Use token expiration or idle timer to automatically log out users.', files: [] }
        ]
      },
      physical_safeguards: {
        status: 'non_compliant',
        score: 0,
        components: [
          { name: 'Server Access Control', status: 'not_found', description: 'Server access not properly controlled', evidence: 'No server access control configuration found', remediation: 'Use HIPAA-compliant cloud providers (AWS, Azure, GCP) and restrict physical access to servers storing PHI.', files: [] },
          { name: 'Workstation Security', status: 'not_found', description: 'Workstation security not configured', evidence: 'No workstation security measures found', remediation: 'Secure endpoints used by staff with disk encryption and automatic screen lock.', files: [] },
          { name: 'Device & Media Control', status: 'not_found', description: 'No device control policy found', evidence: 'No removable storage policies found', remediation: 'Implement policies for removable storage and backups. Disable USB data ports on workstations if needed.', files: [] },
          { name: 'Backup Security', status: 'not_found', description: 'Backups not properly secured', evidence: 'No encrypted backup configuration found', remediation: 'Ensure offsite backups are encrypted and access-controlled. Use cloud-based encrypted storage for backups.', files: [] }
        ]
      },
      data_handling: {
        status: 'non_compliant',
        score: 0,
        components: [
          { name: 'PHI in Logs', status: 'not_found', description: 'PHI may be logged', evidence: 'console.log or print statements found that may contain PHI', remediation: 'Remove PHI from logs or mask sensitive fields. Use structured logging with field filtering to prevent PHI exposure.', files: [] },
          { name: 'PHI in URLs', status: 'not_found', description: 'PHI may be exposed in URLs', evidence: 'URLs may contain PHI or sensitive identifiers', remediation: 'Use secure tokens or IDs instead of PHI in URLs. Implement proper URL parameter sanitization.', files: [] },
          { name: 'Input Sanitization', status: 'not_found', description: 'Input sanitization may be insufficient', evidence: 'No input sanitization found', remediation: 'Sanitize all inputs to prevent XSS/SQL injection. Use libraries like DOMPurify for XSS and parameterized queries for SQL injection.', files: [] },
          { name: 'Secrets Management', status: 'not_found', description: 'Secrets may be hardcoded', evidence: 'Hardcoded secrets or API keys found', remediation: 'Use environment variables for all secrets. Never hardcode API keys, passwords, or private keys. Use secret management services.', files: [] },
          { name: 'Dependency Security', status: 'not_found', description: 'Vulnerable dependencies may exist', evidence: 'No dependency security scanning found', remediation: 'Regularly run npm audit, pip-audit, or similar tools. Update vulnerable dependencies and use secure dependency management.', files: [] }
        ]
      },
      administrative_safeguards: {
        status: 'non_compliant',
        score: 0,
        components: [
          { name: 'HIPAA Compliance Officer', status: 'not_found', description: 'No compliance officer designation found', evidence: 'No documentation found', remediation: 'Designate a HIPAA Compliance Officer and document their role in your organization.', files: [] },
          { name: 'Employee Training', status: 'not_found', description: 'No training documentation found', evidence: 'No training logs or documentation found', remediation: 'Implement employee training program and maintain signed training logs for all staff who access PHI.', files: [] },
          { name: 'Access Control Policy', status: 'not_found', description: 'No access control policy found', evidence: 'No RBAC implementation or policy documentation found', remediation: 'Define user roles (patient, doctor, admin) and implement least-privilege access rules in code.', files: [] },
          { name: 'Risk Analysis & Management', status: 'not_found', description: 'No risk analysis found', evidence: 'No risk assessment documentation found', remediation: 'Conduct periodic risk assessments of system vulnerabilities and document results with mitigation plans.', files: [] },
          { name: 'Incident Response Plan', status: 'not_found', description: 'No incident response plan found', evidence: 'No incident response documentation found', remediation: 'Create written incident response plan with steps for handling data breaches, unauthorized access, or loss. Include team contact list.', files: [] },
          { name: 'Business Associate Agreements', status: 'not_found', description: 'No BAA references found', evidence: 'No BAA documentation found for third-party vendors', remediation: 'Obtain signed BAAs from all third-party vendors who handle PHI (e.g., AWS, Twilio, SendGrid). Store copies securely.', files: [] },
          { name: 'Audit Policy', status: 'not_found', description: 'No audit policy found', evidence: 'No audit logging policy found', remediation: 'Implement audit logging for PHI access and changes. Maintain system-level and database audit logs.', files: [] },
          { name: 'Data Retention & Disposal Policy', status: 'not_found', description: 'No retention policy found', evidence: 'No data retention or disposal policy found', remediation: 'Define how long PHI is kept and securely deleted. Implement scheduled automatic purging and encryption key rotation.', files: [] },
          { name: 'Security Management Process', status: 'not_found', description: 'No security management plan found', evidence: 'No security management documentation found', remediation: 'Implement a written security management plan and store policies in internal documentation.', files: [] }
        ]
      }
    };
  };

  if (loading) {
    return (
      <div className="audit-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading audit...</p>
        </div>
      </div>
    );
  }

  if (!app) {
    return null;
  }

  return (
    <div className="audit-container">
      <div className="audit-header">
        <button className="btn-back" onClick={handleBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          Back to Dashboard
        </button>
        <div className="audit-header-content">
          <h1 className="audit-title">Compliance Audit for {app.name}</h1>
          <p className="audit-subtitle">Run HIPAA compliance scans and view audit history</p>
        </div>
      </div>

      <div className="audit-content">
        <div className="audit-actions">
          <div className="audit-card">
            <div className="audit-card-header">
              <h2>Run Compliance Audit</h2>
              <p>Scan your codebase for HIPAA compliance violations</p>
            </div>
            <button 
              className="btn-run-audit" 
              onClick={handleRunAudit}
              disabled={running}
            >
              {running ? (
                <>
                  <div className="loading-spinner-small"></div>
                  Running Audit...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Run Audit
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="error-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              {error}
            </div>
          )}

          {currentAudit && (
            <div className="audit-stats-new">
              {/* Overall Score Card - Large */}
              <div className="stat-card-new stat-card-hero">
                <div className="stat-icon-new">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                <div className="stat-content-new">
                  <h3 className="stat-title-new">Overall HIPAA Score</h3>
                  <div className="stat-value-container">
                    <span className="stat-value-new stat-value-hero">{currentAudit.complianceScore || 0}</span>
                    <span className="stat-value-unit">/ 100</span>
                  </div>
                  <span className={`status-badge-new ${currentAudit.status === 'Compliant' ? 'compliant' : currentAudit.status === 'Needs Attention' ? 'needs-attention' : 'non-compliant'}`}>
                    {currentAudit.status || 'Unknown'}
                  </span>
                  {currentAudit.metrics && (
                    <div className="stat-metrics-preview">
                      <span>Encryption: {currentAudit.metrics.encryption_coverage_percent?.toFixed(0) || 0}%</span>
                      <span>•</span>
                      <span>MFA: {currentAudit.metrics.mfa_coverage_percent?.toFixed(0) || 0}%</span>
                      <span>•</span>
                      <span>BAAs: {currentAudit.metrics.baas_coverage_percent?.toFixed(0) || 0}%</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Mini Cards Row */}
              <div className="stat-card-new">
                <div className="stat-icon-new">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="15" x2="15" y2="15"></line>
                  </svg>
                </div>
                <div className="stat-content-new">
                  <h3 className="stat-title-new">Technical</h3>
                  <span className="stat-value-new">{currentAudit.scores?.technical_safeguards_score?.toFixed(1) || 0}</span>
                  <p className="stat-label-new">Safeguards score</p>
                </div>
              </div>

              <div className="stat-card-new">
                <div className="stat-icon-new">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div className="stat-content-new">
                  <h3 className="stat-title-new">Administrative</h3>
                  <span className="stat-value-new">{currentAudit.scores?.administrative_safeguards_score?.toFixed(1) || 0}</span>
                  <p className="stat-label-new">Safeguards score</p>
                </div>
              </div>

              <div className="stat-card-new">
                <div className="stat-icon-new">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                </div>
                <div className="stat-content-new">
                  <h3 className="stat-title-new">Issues Found</h3>
                  <span className="stat-value-new">{currentAudit.findings?.length || 0}</span>
                  <p className="stat-label-new">
                    {currentAudit.summary?.critical ? `${currentAudit.summary.critical} critical` : ''}
                    {currentAudit.summary?.high ? ` • ${currentAudit.summary.high} high` : ''}
                  </p>
                </div>
              </div>

              <div className="stat-card-new">
                <div className="stat-icon-new">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className="stat-content-new">
                  <h3 className="stat-title-new">Encryption</h3>
                  <span className="stat-value-new">{typeof currentAudit.metrics?.encryption_coverage_percent === 'number' ? currentAudit.metrics.encryption_coverage_percent.toFixed(0) : 0}%</span>
                  <p className="stat-label-new">Coverage</p>
                </div>
              </div>

              <div className="stat-card-new">
                <div className="stat-icon-new">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <div className="stat-content-new">
                  <h3 className="stat-title-new">MFA</h3>
                  <span className="stat-value-new">{typeof currentAudit.metrics?.mfa_coverage_percent === 'number' ? currentAudit.metrics.mfa_coverage_percent.toFixed(0) : 0}%</span>
                  <p className="stat-label-new">Coverage</p>
                </div>
              </div>

              <div className="stat-card-new">
                <div className="stat-icon-new">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </svg>
                </div>
                <div className="stat-content-new">
                  <h3 className="stat-title-new">Secrets</h3>
                  <span className="stat-value-new">{currentAudit.metrics?.secrets_in_code_count || 0}</span>
                  <p className="stat-label-new">In code</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HIPAA Component Analysis */}
        {currentAudit && currentAudit.complianceScore !== undefined && (
          <div className="component-analysis-section">
            <h2 className="section-title">HIPAA Component Analysis</h2>
            <p className="section-subtitle">Detailed breakdown of each HIPAA safeguard component - showing what's good, what's bad, and how to fix issues</p>

            {(() => {
              // Use componentAnalysis from audit if available, otherwise use default structure
              const componentAnalysis = currentAudit.componentAnalysis && Object.keys(currentAudit.componentAnalysis).length > 0 
                ? currentAudit.componentAnalysis 
                : getDefaultComponentAnalysis();
              
              return Object.entries(componentAnalysis).map(([category, categoryData]) => {
                if (!categoryData || !categoryData.components || categoryData.components.length === 0) {
                  return null;
                }
                
                return (
                  <div key={category} className="component-category">
                    <div className="category-header">
                      <h3 className="category-title">
                        {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <div className="category-status">
                        <span className={`status-indicator ${categoryData.status === 'compliant' ? 'compliant' : categoryData.status === 'partial' ? 'partial' : 'non-compliant'}`}>
                          {categoryData.status === 'compliant' ? '✓ Compliant' : categoryData.status === 'partial' ? '⚠ Partial' : '✗ Non-Compliant'}
                        </span>
                        {categoryData.score !== undefined && typeof categoryData.score === 'number' && (
                          <span className="category-score">{categoryData.score.toFixed(1)}%</span>
                        )}
                      </div>
                    </div>

                    <div className="components-grid">
                      {categoryData.components.map((component, idx) => {
                        if (!component || !component.name) return null;
                        
                        const status = component.status || 'not_found';
                        const isCompliant = status === 'compliant';
                        const isPartial = status === 'partial';
                        
                        return (
                          <div key={idx} className={`component-card ${isCompliant ? 'compliant' : isPartial ? 'partial' : 'non-compliant'}`}>
                            <div className="component-header">
                              <h4 className="component-name">{component.name}</h4>
                              <span className={`component-status-badge status-${status}`}>
                                {isCompliant ? '✓ Good' : isPartial ? '⚠ Partial' : status === 'not_found' ? '✗ Not Found' : '✗ Bad'}
                              </span>
                            </div>
                            
                            {component.description && (
                              <p className="component-description">{component.description}</p>
                            )}

                            {component.evidence && (
                              <div className="component-evidence">
                                <strong>Evidence:</strong> {component.evidence}
                              </div>
                            )}

                            {!isCompliant && component.remediation && (
                              <div className="component-remediation">
                                <strong>How to Fix:</strong>
                                <p>{component.remediation}</p>
                                {component.files && component.files.length > 0 && component.files[0] && (
                                  <div className="component-files">
                                    <strong>Files to check:</strong>
                                    <ul>
                                      {component.files.filter(f => f).map((file, fileIdx) => (
                                        <li key={fileIdx} className="component-file">{file}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            {isCompliant && (
                              <div className="component-compliant">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                                <span>This component is compliant</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* Complete Findings Report */}
        {currentAudit && currentAudit.findings && currentAudit.findings.length > 0 && (
          <div className="complete-findings-section">
            <div className="findings-header">
              <div className="findings-header-left">
                <h2 className="section-title">Complete Audit Report</h2>
                <p className="findings-subtitle">
                  {currentAudit.findings.length} total findings • 
                  {getFindingsBySeverity('critical')} Critical • 
                  {getFindingsBySeverity('high')} High • 
                  {getFindingsBySeverity('medium')} Medium • 
                  {getFindingsBySeverity('low')} Low
                </p>
              </div>
              <div className="severity-filters">
                <button 
                  className={`filter-btn ${selectedSeverity === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedSeverity('all')}
                >
                  All ({currentAudit.findings.length})
                </button>
                <button 
                  className={`filter-btn filter-critical ${selectedSeverity === 'critical' ? 'active' : ''}`}
                  onClick={() => setSelectedSeverity('critical')}
                >
                  Critical ({getFindingsBySeverity('critical')})
                </button>
                <button 
                  className={`filter-btn filter-high ${selectedSeverity === 'high' ? 'active' : ''}`}
                  onClick={() => setSelectedSeverity('high')}
                >
                  High ({getFindingsBySeverity('high')})
                </button>
                <button 
                  className={`filter-btn filter-medium ${selectedSeverity === 'medium' ? 'active' : ''}`}
                  onClick={() => setSelectedSeverity('medium')}
                >
                  Medium ({getFindingsBySeverity('medium')})
                </button>
                <button 
                  className={`filter-btn filter-low ${selectedSeverity === 'low' ? 'active' : ''}`}
                  onClick={() => setSelectedSeverity('low')}
                >
                  Low ({getFindingsBySeverity('low')})
                </button>
              </div>
            </div>

            <div className="findings-container">
              {getFilteredFindings().map((finding, idx) => {
                const findingId = finding.id || `finding-${idx}`;
                const isExpanded = expandedFindings.has(findingId);
                const severity = finding.severity?.toLowerCase() || 'info';
                
                return (
                  <div key={findingId} className={`finding-card finding-${severity}`}>
                    <div className="finding-card-header" onClick={() => toggleFinding(findingId)}>
                      <div className="finding-card-left">
                        <span className={`finding-severity-badge severity-${severity}`}>
                          {finding.severity || 'Info'}
                        </span>
                        <div className="finding-title-section">
                          <h3 className="finding-title">
                            {finding.id || `F-${String(idx + 1).padStart(4, '0')}`}: {finding.description || finding.issue || 'Finding'}
                          </h3>
                          {finding.category && (
                            <span className="finding-category-badge">
                              {finding.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="finding-card-right">
                        {finding.evidence && finding.evidence.length > 0 && (
                          <span className="finding-file-badge">
                            {finding.evidence[0].file}
                            {finding.evidence[0].line_start && `:${finding.evidence[0].line_start}`}
                          </span>
                        )}
                        <svg 
                          className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="finding-card-content">
                        {finding.evidence && finding.evidence.length > 0 && (
                          <div className="finding-evidence">
                            <h4 className="finding-section-title">Evidence</h4>
                            {finding.evidence.map((ev, evIdx) => (
                              <div key={evIdx} className="evidence-item">
                                <div className="evidence-header">
                                  <span className="evidence-file">{ev.file}</span>
                                  {ev.line_start && (
                                    <span className="evidence-lines">
                                      Lines {ev.line_start}{ev.line_end && ev.line_end !== ev.line_start ? `-${ev.line_end}` : ''}
                                    </span>
                                  )}
                                </div>
                                {ev.snippet && (
                                  <pre className="evidence-snippet">{ev.snippet}</pre>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {finding.recommended_fix && (
                          <div className="finding-fix">
                            <h4 className="finding-section-title">Recommended Fix</h4>
                            <div className="fix-type-badge">
                              Type: {finding.recommended_fix.type || 'code'}
                            </div>
                            
                            {finding.recommended_fix.patch_example && (
                              <div className="fix-patch">
                                <div className="fix-patch-header">
                                  <span>Code Patch</span>
                                  <button 
                                    className="copy-btn"
                                    onClick={() => {
                                      navigator.clipboard.writeText(finding.recommended_fix.patch_example);
                                    }}
                                  >
                                    Copy
                                  </button>
                                </div>
                                <pre className="fix-code">{finding.recommended_fix.patch_example}</pre>
                              </div>
                            )}

                            {finding.recommended_fix.commands && finding.recommended_fix.commands.length > 0 && (
                              <div className="fix-commands">
                                <div className="fix-commands-header">
                                  <span>Commands</span>
                                </div>
                                {finding.recommended_fix.commands.map((cmd, cmdIdx) => (
                                  <div key={cmdIdx} className="command-item">
                                    <code className="command-code">{cmd}</code>
                                    <button 
                                      className="copy-btn-small"
                                      onClick={() => {
                                        navigator.clipboard.writeText(cmd);
                                      }}
                                    >
                                      Copy
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {finding.recommended_fix.estimated_hours && (
                              <div className="fix-effort">
                                <strong>Estimated Effort:</strong> {finding.recommended_fix.estimated_hours} hours
                              </div>
                            )}
                          </div>
                        )}

                        {finding.suggestion && !finding.recommended_fix && (
                          <div className="finding-suggestion">
                            <h4 className="finding-section-title">Suggestion</h4>
                            <p>{finding.suggestion}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="audit-history">
          <h2 className="section-title">Audit History</h2>
          {auditHistory.length === 0 ? (
            <div className="empty-history">
              <div className="empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </div>
              <h3>No audits yet</h3>
              <p>Run your first compliance audit to see results here</p>
            </div>
          ) : (
            <div className="history-list">
              {auditHistory.map((audit) => (
                <div key={audit.id} className={`audit-item ${currentAudit?.id === audit.id ? 'active' : ''}`}>
                  <div className="audit-item-header">
                    <div className="audit-item-info">
                      <h3 className="audit-item-title">
                        Audit #{auditHistory.indexOf(audit) + 1}
                        {currentAudit?.id === audit.id && <span className="latest-badge">Latest</span>}
                      </h3>
                      <p className="audit-item-date">
                        {new Date(audit.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="audit-item-score">
                      <span className={`score-badge ${audit.complianceScore >= 80 ? 'high' : audit.complianceScore >= 60 ? 'medium' : 'low'}`}>
                        {audit.complianceScore}%
                      </span>
                      <span className={`status-badge ${audit.status === 'Compliant' ? 'compliant' : 'non-compliant'}`}>
                        {audit.status}
                      </span>
                    </div>
                  </div>
                  {audit.summary && typeof audit.summary === 'object' && audit.summary.top_3_findings && (
                    <div className="audit-item-summary">
                      <p><strong>Top Issues:</strong> {audit.summary.top_issues_count || 0} total ({audit.summary.critical || 0} critical, {audit.summary.high || 0} high, {audit.summary.medium || 0} medium, {audit.summary.low || 0} low)</p>
                    </div>
                  )}
                  {audit.summary && typeof audit.summary === 'string' && (
                    <p className="audit-item-summary">{audit.summary}</p>
                  )}
                  {audit.findings && audit.findings.length > 0 && (
                    <div className="audit-item-findings">
                      <h4>Findings Summary ({audit.findings.length} total)</h4>
                      <div className="findings-summary-grid">
                        <div className="summary-stat">
                          <span className="summary-label">Critical</span>
                          <span className="summary-value critical">{audit.findings.filter(f => f.severity?.toLowerCase() === 'critical').length}</span>
                        </div>
                        <div className="summary-stat">
                          <span className="summary-label">High</span>
                          <span className="summary-value high">{audit.findings.filter(f => f.severity?.toLowerCase() === 'high').length}</span>
                        </div>
                        <div className="summary-stat">
                          <span className="summary-label">Medium</span>
                          <span className="summary-value medium">{audit.findings.filter(f => f.severity?.toLowerCase() === 'medium').length}</span>
                        </div>
                        <div className="summary-stat">
                          <span className="summary-label">Low</span>
                          <span className="summary-value low">{audit.findings.filter(f => f.severity?.toLowerCase() === 'low').length}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Audit;

