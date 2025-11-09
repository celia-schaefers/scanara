import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { db } from '../config/firebase-admin.js';
import axios from 'axios';

const router = express.Router();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Create HIPAA compliance analysis prompt
 */
function createHIPAAAnalysisPrompt(codebase, repoName = 'unknown') {
  return `You are an automated HIPAA Compliance Auditor for codebases. Your job is to **scan the
entire repository** (files under REPO_ROOT) and return a structured, evidence-backed HIPAA
readiness report. You **must not** modify any files. You **must not** access or output any real
Protected Health Information (PHI). If sample data or environment contains PHI, treat it as
sensitive and redact it; replace with synthetic placeholders. Use only the code and configuration
files available in the repository and any metadata the runtime provides (file paths, commit
history, CI config). If you need to verify an uncertain external vendor or service, list it as
&quot;requires manual verification&quot; and provide instructions on what to verify and where.
SCOPE:
- Scan: all source files, infra-as-code (Terraform/CloudFormation), Dockerfiles, CI/CD pipelines
(GitHub Actions/GitLab/Bitbucket), config files (.env, .yml, .json), package manifests
(package.json, requirements.txt, go.mod), infra config (aws/*.tf, azure/*.bicep), Kubernetes
manifests, playbooks, and README/security docs.
- Exclude/ignore: /node_modules, /vendor, build artifacts, .git directories.
- Do not attempt to decrypt secrets or fetch external systems.
OBJECTIVES (order of priority):
1. Identify PHI handling surfaces and classify them (ingest, store, transmit, display, log).
2. Evaluate Technical Safeguards: encryption at rest/in transit, auth, RBAC, MFA, session
management, logging, tamper-resistance.
3. Evaluate Administrative Safeguards: documented policies, BAAs referenced in docs, training
artifacts, role definitions, incident response artifacts.
4. Evaluate Physical/Infrastructure Safeguards: hosting provider config, storage controls,
backups, key management references.
5. Evaluate DevOps &amp; CI/CD: secrets in code, test data with PHI, environment segregation,
automated scans, dependency vulnerabilities, deployment policies.
6. Produce prioritized remediation items (code changes, infra changes, process changes), with
severity (Critical/High/Medium/Low), exact file locations, recommended code
snippets/commands, and estimated effort (in hours).
7. Output machine-readable JSON (schema below) and a human summary.
CHECKLIST / RULES TO APPLY:

- Encryption at rest: check database config, S3/EBS encryption flags, libs using encryption,
KMS usage.
- Encryption in transit: check HTTP endpoints, TLS enforcement in config, HSTS, secure cookie
flags.
- Auth: check for OAuth, password hashing (bcrypt/Argon2), MFA requirement for admin roles,
role definitions in code.
- Secrets: search for hardcoded secrets, API keys, private keys, .env files checked into repo, or
credentials in CI logs.
- Logging: search for console.log / print statements and structured logging that may include PHI
fields; check log redaction patterns.
- Data minimization &amp; masking: check front-end templates/APIs for direct PHI exposure; check
for use of identifiers vs PII.
- Audit logging: ensure access events are logged with user id, timestamp, action, resource.
- BAAs: search docs for vendor names (AWS, GCP, Twilio, SendGrid, Stripe, Okta) and
whether repo has references to BAAs or privacy/terms docs. If vendor used and no BAA
reference, flag.
- Backups &amp; retention: look for backup config or lifecycle rules; retention policy notes.
- CI/CD: check for pipeline steps that publish artifacts to public repos, deploy from unreviewed
branches, or run tests with production credentials.
- Third-party dependencies: list direct deps and flag those with known security issues (report
package name &amp; version — do not fetch external vulnerability DB; provide commands to run
e.g., \`npm audit\`, \`pip-audit\`).
- Tests &amp; environments: flag usage of production DB in tests or staging using real data. Ensure
non-production environments use synthetic data.
- Infrastructure isolation: check network/security group references (open 0.0.0.0/0 on DB ports),
public S3 buckets, and unauthenticated API endpoints.
- Tamper-resistance: identify WORM or immutability in logs/backups (if present).
- Documentation: check for security policies, incident response, training docs. If missing, mark
administrative gap.

OUTPUT FORMAT:
Return a JSON object exactly matching the schema below. After JSON output, provide a plain-
language executive summary (≤ 300 words) and a prioritized remediation list with code/infra
examples. For each evidence item include file path + line numbers or snippet references. For
any vendor, include explicit &quot;BAA : yes/no/unknown&quot; and what to do next.
SAFETY:
- Redact any suspected PHI in your output. Represent redactions with the token
&quot;[REDACTED_PHI]&quot;. Do not print real SSNs, phone numbers, names or medical records.
**Codebase to Analyze:**
${codebase}
**IMPORTANT:** Return ONLY valid JSON matching this exact schema:
{
&quot;metadata&quot;: {
&quot;repo&quot;: &quot;${repoName}&quot;,
&quot;scan_date&quot;: &quot;${new Date().toISOString()}&quot;,
&quot;scanned_by&quot;: &quot;scanara-ai-v1&quot;
},
&quot;scores&quot;: {
&quot;overall_score&quot;: 0.0,
&quot;technical_safeguards_score&quot;: 0.0,
&quot;administrative_safeguards_score&quot;: 0.0,
&quot;physical_safeguards_score&quot;: 0.0,
&quot;audit_coverage_score&quot;: 0.0,
&quot;encryption_coverage_percent&quot;: 0.0
},
&quot;summary&quot;: {
&quot;top_issues_count&quot;: 0,
&quot;critical&quot;: 0,
&quot;high&quot;: 0,
&quot;medium&quot;: 0,
&quot;low&quot;: 0,
&quot;top_3_findings&quot;: [
{
&quot;title&quot;: &quot;&quot;,
&quot;severity&quot;: &quot;&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;file_paths&quot;: [&quot;&quot;],

&quot;line_refs&quot;: [&quot;&quot;],
&quot;remediation&quot;: &quot;&quot;
}
]
},
&quot;detailed_findings&quot;: [
{
&quot;id&quot;: &quot;F-0001&quot;,
&quot;category&quot;: &quot;encryption_at_rest&quot;,
&quot;severity&quot;: &quot;critical&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: [
{&quot;file&quot;: &quot;&quot;, &quot;line_start&quot;: 0, &quot;line_end&quot;: 0, &quot;snippet&quot;: &quot;&quot;}
],
&quot;recommended_fix&quot;: {
&quot;type&quot;: &quot;code/infra/process&quot;,
&quot;patch_example&quot;: &quot;&quot;,
&quot;commands&quot;: [&quot;&quot;],
&quot;estimated_hours&quot;: 0.0
}
}
],
&quot;metrics&quot;: {
&quot;mfa_coverage_percent&quot;: 0.0,
&quot;rbac_coverage_percent&quot;: 0.0,
&quot;secrets_in_code_count&quot;: 0,
&quot;baas_coverage_percent&quot;: 0.0,
&quot;log_redaction_coverage_percent&quot;: 0.0,
&quot;immutable_logs_enabled&quot;: false,
&quot;public_bucket_count&quot;: 0,
&quot;tls_enforced&quot;: true,
&quot;test_data_with_real_phi_count&quot;: 0,
&quot;ci_secrets_exposed_count&quot;: 0,
&quot;dependency_vulnerabilities_count&quot;: 0
},
&quot;remediation_plan&quot;: [
{
&quot;id&quot;: &quot;R-0001&quot;,
&quot;title&quot;: &quot;Example fix&quot;,
&quot;priority&quot;: &quot;critical&quot;,
&quot;steps&quot;: [&quot;step1&quot;, &quot;step2&quot;],
&quot;files_to_change&quot;: [&quot;&quot;],
&quot;estimated_hours&quot;: 2.5
}

],
&quot;actions_&quot;: {
&quot;manual_verification&quot;: [
{
&quot;issue_id&quot;: &quot;F-XXXX&quot;,
&quot;action&quot;: &quot;Verify BAA with SendGrid (or Paubox)&quot;,
&quot;how_to_verify&quot;: &quot;Check account management console, request signed BAA PDF, store
copy in secure compliance folder&quot;
}
]
},
&quot;component_analysis&quot;: {
&quot;administrative_safeguards&quot;: {
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;score&quot;: 0.0,
&quot;components&quot;: [
{
&quot;name&quot;: &quot;HIPAA Compliance Officer&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/not_found&quot;,
&quot;description&quot;: &quot;Brief description of compliance status&quot;,
&quot;evidence&quot;: &quot;What was found or missing&quot;,
&quot;remediation&quot;: &quot;How to fix if non-compliant&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Employee Training&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/not_found&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Access Control Policy&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/not_found&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Risk Analysis &amp; Management&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/not_found&quot;,
&quot;description&quot;: &quot;&quot;,

&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Incident Response Plan&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/not_found&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Business Associate Agreements&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/not_found&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Audit Policy&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/not_found&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Data Retention &amp; Disposal Policy&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/not_found&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Security Management Process&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/not_found&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
}

]
},
&quot;technical_safeguards&quot;: {
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;score&quot;: 0.0,
&quot;components&quot;: [
{
&quot;name&quot;: &quot;Encryption at Rest&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Encryption in Transit&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Unique User IDs&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Authentication&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Role-Based Access Control (RBAC)&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,

&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Multi-Factor Authentication (MFA)&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Audit Logging&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Data Integrity Verification&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Session Management&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Automatic Logout&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
}
]
},

&quot;physical_safeguards&quot;: {
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;score&quot;: 0.0,
&quot;components&quot;: [
{
&quot;name&quot;: &quot;Server Access Control&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Workstation Security&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Device &amp; Media Control&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Backup Security&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
}
]
},
&quot;data_handling&quot;: {
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;score&quot;: 0.0,
&quot;components&quot;: [
{
&quot;name&quot;: &quot;PHI in Logs&quot;,

&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;PHI in URLs&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Input Sanitization&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Secrets Management&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
},
{
&quot;name&quot;: &quot;Dependency Security&quot;,
&quot;status&quot;: &quot;compliant/non_compliant/partial&quot;,
&quot;description&quot;: &quot;&quot;,
&quot;evidence&quot;: &quot;&quot;,
&quot;remediation&quot;: &quot;&quot;,
&quot;files&quot;: [&quot;&quot;]
}
]
}
}
}
**Scoring Algorithm:**

Overall Score (0–100) = weighted sum:
- Technical Safeguards (45% of score)
- Administrative Safeguards (30%)
- Physical Safeguards (10%)
- Audit &amp; Logging Coverage (10%)
- CI/CD &amp; DevOps Hygiene (5%)
Compute each subscore (0–100) from binary and continuous checks. Round scores to 1
decimal place.
**CRITICAL: Component Analysis Requirement**
You MUST provide a detailed component_analysis section that evaluates EACH individual
HIPAA component:
1. **Administrative Safeguards** - Evaluate all 9 components and each sub-component:
a. Security management process.
I. Risk analysis
II. Risk management
III. Sanction policy
IV. Information system activity review
b. Assigned security responsibility.
I. Identify the security official who is responsible for the development and
implementation of the policies and procedures

c. Workforce security.
I. Authorization and/or supervision
II. Workforce clearance procedure to determine that the access of a workforce
member to electronic protected health information is appropriate.
III. Termination procedures for terminating access to electronic protected health
information when the employment of, or other arrangement with, a workforce
member ends.

d. Information access management.
I. Isolating health care clearinghouse functions: If a health care clearinghouse is
part of a larger organization, check for policies and procedures that protect the
electronic protected health information of the clearinghouse from unauthorized
access by the larger organization.
II. Access authorization for example, granting access to a workstation, transaction,
program, process, or other mechanism.
III. Access establishment and modification: based upon the covered entity&#39;s or the
business associate&#39;s access authorization policies, establish, document, review,
and modify a user&#39;s right of access to a workstation, transaction, program, or
process.

e. Security awareness and training.
I. Security reminders
II. Protection from malicious software

III. Log-in monitoring
IV. Password management
f. Security incident procedures.
I. Response and reporting
g. Contingency plan
I. Data backup plan
II. Disaster recovery plan
III. Emergency mode operation plan
IV. Testing and revision procedures
V. Applications and data criticality analysis
h. Evaluation
I. Periodic technical and nontechnical evaluation
i. Business associate contracts and other arrangements
I. Written contract or other arrangement included

2. **Technical Safeguards** - Evaluate all 5 components and subcomponents:
a. Strategy: Access control:
I. Unique user identification . Check for a unique name and/or number for identifying
and tracking user identity.
II. Emergency access procedure . Procedures for obtaining necessary electronic
protected health information during an emergency.
III. Automatic logoff . Procedures electronic procedures that terminate an electronic
session after a predetermined time of inactivity.
IV. Encryption and decryption . Mechanisms to encrypt and decrypt electronic protected
health information.
b. Strategy: Audit controls.
I. Hardware, software, and/or procedural mechanisms that record and examine
activity in information systems that contain or use electronic protected health
information.
c. Strategy: Integrity.
I. Mechanism to authenticate electronic protected health information: electronic
mechanisms to corroborate that electronic protected health information has not
been altered or destroyed in an unauthorized manner.

d. Strategy: Person or entity authentication
e. Strategy: Transmission security

I. Integrity controls: security measures to ensure that electronically transmitted
electronic protected health information is not improperly modified without
detection until disposed of.
II. Encryption: a mechanism to encrypt electronic protected health information
whenever deemed appropriate.

3. **Physical Safeguards** - Evaluate all 4 components and sub-components:
A. Standard: Facility access controls
I. Contingency operations: Procedures that allow facility access in support of
restoration of lost data under the disaster recovery plan and emergency mode
operations plan in the event of an emergency.
II. Facility security plan: Policies and procedures to safeguard the facility and the
equipment therein from unauthorized physical access, tampering, and theft.
III. Access control and validation procedures
IV. Maintenance records
B. Standard: Workstation use.

I. Policies and procedures that specify the proper functions to be performed, the
manner in which those functions are to be performed, and the physical attributes
of the surroundings of a specific workstation or class of workstation that can
access electronic protected health information.

C. Standard: Workstation security.

I. Physical safeguards for all workstations that access electronic protected health
information to restrict access to authorized users.

D. Standard: Device and media controls.

I. Disposal: Policies and procedures to address the final disposition of electronic
protected health information, and/or the hardware or electronic media on which it
is stored.
II. Media re-use: Procedures for the removal of electronic protected health
information from electronic media before the media are made available for re-
use.
III. Accountability: Maintenance of a record of the movements of hardware and
electronic media and any person responsible therefore.
IV. Data backup and storage. A retrievable, exact copy of electronic protected health
information, when needed, before the movement of equipment.

4. **Data Handling** - Evaluate all 5 components:
- PHI in Logs (check for PHI in console.log/print)

- PHI in URLs (check for PHI exposure in URLs)
- Input Sanitization (check XSS/SQL injection prevention)
- Secrets Management (check for hardcoded secrets)
- Dependency Security (check for vulnerable dependencies)
For EACH component, provide:
- status: &quot;compliant&quot; if fully compliant, &quot;partial&quot; if partially compliant, &quot;non_compliant&quot; or
&quot;not_found&quot; if missing
- description: Brief explanation of current state
- evidence: What was found in the codebase (or what&#39;s missing)
- remediation: Step-by-step instructions on how to fix if non-compliant according to the checklist
above
- files: Array of file paths where issues were found or where fixes should be applied
Provide a comprehensive analysis focusing on actionable, specific issues with exact file paths
and line numbers.`}

/**
 * POST /api/audit/run
 * Run HIPAA compliance audit on codebase
 */
router.post('/run', verifyToken, async (req, res) => {
  try {
    const { appId } = req.body;
    const userId = req.user.uid;

    if (!appId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'appId is required'
      });
    }

    // Get app to verify ownership
    const appsRef = db.collection('apps');
    const appDoc = await appsRef.doc(appId).get();

    if (!appDoc.exists) {
      return res.status(404).json({
        error: 'Not found',
        message: 'App not found'
      });
    }

    const appData = appDoc.data();
    if (appData.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this app'
      });
    }

    // Get codebase from Firestore
    const codebaseId = appData.codebaseId;
    if (!codebaseId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'No codebase found for this app. Please import a repository first.'
      });
    }

    const codebaseRef = db.collection('codebases');
    const codebaseDoc = await codebaseRef.doc(codebaseId).get();

    if (!codebaseDoc.exists) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Codebase not found'
      });
    }

    const codebaseData = codebaseDoc.data();
    const files = codebaseData.files || [];

    if (files.length === 0) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Codebase is empty'
      });
    }

    // Prepare codebase for analysis (limit to first 100 files to avoid token limits)
    const filesToAnalyze = files.slice(0, 100);
    const codebaseText = filesToAnalyze.map(file => {
      return `=== File: ${file.path} ===\n${file.content}\n`;
    }).join('\n\n');

    // Create audit record
    const auditRef = db.collection('audits');
    const auditDoc = await auditRef.add({
      appId: appId,
      userId: userId,
      status: 'running',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Send to OpenAI for analysis
    try {
      const prompt = createHIPAAAnalysisPrompt(codebaseText, appData.name || 'unknown');

      const openaiResponse = await axios.post(
        OPENAI_API_URL,
        {
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a HIPAA compliance expert. Analyze code and return structured JSON with compliance findings.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 8000,
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let analysisResult;
      try {
        const content = openaiResponse.data.choices[0].message.content;
        // Extract JSON from response (handle cases where there's text before/after JSON)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in OpenAI response');
        }
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        throw new Error('Failed to parse analysis results');
      }

      // Determine compliance status based on overall score
      const overallScore = analysisResult.scores?.overall_score || 0;
      let complianceStatus = 'Non-Compliant';
      if (overallScore >= 80) {
        complianceStatus = 'Compliant';
      } else if (overallScore >= 60) {
        complianceStatus = 'Needs Attention';
      }

      // Update audit record with results (store full analysis)
      await auditRef.doc(auditDoc.id).update({
        status: 'completed',
        complianceScore: overallScore,
        complianceStatus: complianceStatus,
        // Store full analysis result
        metadata: analysisResult.metadata || {},
        scores: analysisResult.scores || {},
        summary: analysisResult.summary || {},
        detailedFindings: analysisResult.detailed_findings || [],
        metrics: analysisResult.metrics || {},
        remediationPlan: analysisResult.remediation_plan || [],
        actionsRequired: analysisResult.actions_required || {},
        componentAnalysis: analysisResult.component_analysis || {},
        // Legacy fields for backward compatibility
        findings: analysisResult.detailed_findings || [],
        categories: {
          technicalSafeguards: { score: analysisResult.scores?.technical_safeguards_score || 0 },
          administrativeSafeguards: { score: analysisResult.scores?.administrative_safeguards_score || 0 },
          physicalSafeguards: { score: analysisResult.scores?.physical_safeguards_score || 0 },
          auditCoverage: { score: analysisResult.scores?.audit_coverage_score || 0 }
        },
        updatedAt: new Date().toISOString(),
      });

      // Update app with latest audit
      await appsRef.doc(appId).update({
        latestAuditId: auditDoc.id,
        latestAuditScore: overallScore,
        updatedAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        auditId: auditDoc.id,
        complianceScore: overallScore,
        status: complianceStatus,
        scores: analysisResult.scores || {},
        summary: analysisResult.summary || {},
        findings: analysisResult.detailed_findings || [],
        metrics: analysisResult.metrics || {},
        remediationPlan: analysisResult.remediation_plan || [],
        actionsRequired: analysisResult.actions_required || {},
        componentAnalysis: analysisResult.component_analysis || {},
        message: 'Audit completed successfully'
      });
    } catch (openaiError) {
      console.error('OpenAI API error:', openaiError);
      
      // Update audit record with error
      await auditRef.doc(auditDoc.id).update({
        status: 'failed',
        error: openaiError.message || 'Failed to analyze codebase',
        updatedAt: new Date().toISOString(),
      });

      throw new Error(`OpenAI API error: ${openaiError.message || 'Failed to analyze codebase'}`);
    }
  } catch (error) {
    console.error('Error running audit:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to run audit'
    });
  }
});

/**
 * GET /api/audit/history/:appId
 * Get audit history for an app
 */
router.get('/history/:appId', verifyToken, async (req, res) => {
  try {
    const { appId } = req.params;
    const userId = req.user.uid;

    // Verify app ownership
    const appsRef = db.collection('apps');
    const appDoc = await appsRef.doc(appId).get();

    if (!appDoc.exists) {
      return res.status(404).json({
        error: 'Not found',
        message: 'App not found'
      });
    }

    const appData = appDoc.data();
    if (appData.userId !== userId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have access to this app'
      });
    }

    // Get all audits for this app
    const auditsRef = db.collection('audits');
    const snapshot = await auditsRef.where('appId', '==', appId).get();

      const audits = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        audits.push({
          id: doc.id,
          complianceScore: data.complianceScore || 0,
          status: data.complianceStatus || data.status || 'Unknown',
          summary: data.summary || {},
          findings: data.detailedFindings || data.findings || [],
          scores: data.scores || {},
          metrics: data.metrics || {},
          remediationPlan: data.remediationPlan || [],
          actionsRequired: data.actionsRequired || {},
          componentAnalysis: data.componentAnalysis || {},
          categories: data.categories || {},
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });

    // Sort by creation date (newest first)
    audits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      audits: audits
    });
  } catch (error) {
    console.error('Error fetching audits:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'Failed to fetch audits'
    });
  }
});

export default router;

