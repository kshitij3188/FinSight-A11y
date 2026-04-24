# Model Risk Management Policy

**Source:** https://www.bunq.com/en-nl/documents/model-risk-management-policy
**Document URL:** https://static.bunq.com/website/documents/bunq-policy-model-risk-management-en.pdf

---

## Page 1

bunq Model Risk
Management Policy
May 2025
To our users,
At bunq, we believe in keeping things real and clear. We want to be fully transparent with
you and inform you of anything you may want to know, making sure that what you see is
what you get. We’re all about sharing the information you actually care about, so we work
hard to make our policies openly available to you, wherever we (legally) can!

## Page 2

Table of Contents
Table of Contents 1
1. Introduction 2
2. Legal Framework 3
3. Scope 3
4. Definitions 4
5. Roles and Responsibilities 7
6. Risk Classification & Controls 10
7. Model Lifecycle 16
8. Model Register & Monitoring 18
9. Validation Process 22
10. Model Approval 25
1

## Page 3

1. Introduction
At bunq, we build smart tools to make life easy - from traditional financial models to
advanced AI systems. These models help us assess risks, prevent fraud, price services, and
deliver a faster, more reliable experience for all our users.
But no model is perfect. Even the best tools carry risks - they can reflect outdated
assumptions, miss important patterns, or behave in unexpected ways. That’s why model
risk management is so important: it ensures that the systems we trust are always safe, fair,
and in control.
This policy sets out how we manage those risks. It applies to all models used at bunq -
whether it’s a statistical credit scoring engine, a spreadsheet for reporting, or a machine
learning tool used in fraud detection. We follow a structured governance aligned with our
Risk Management Policy and within the limits of our Risk Appetite Statement (RAS) and
regulatory obligations, including the EU AI Act.
This framework defines how we identify, document, classify, validate, and monitor:
● Traditional Quantitative Models;
● End-User Computing applications (EUCs);
● AI Models and Systems, including those subject to the EU AI Act (Regulation
2024/1689).
It includes:
● Risk-based classification (High / Medium / Low);
● Model lifecycle controls (Design → Implement → Enhance → Maintain);
● Clear roles across the three lines of defense, especially the Model Owner (MO),
Model Validator (MV), and 2nd Line of Defense;
● A central Model Register that tracks every model used at bunq.
By applying consistent and proportional controls, we make sure that:
● High-impact models (like those used for fraud detection or user onboarding) get
more rigorous review;
● Lower-risk tools still meet quality standards — without slowing innovation;
2

## Page 4

● All model risks are documented, monitored, and kept within bunq’s risk appetite.
Ultimately, this policy helps us protect what matters: Eva’s trust, our commitment to
responsible innovation, and our duty to uphold regulatory standards and ethical AI
principles.
2. Legal Framework
At bunq, our approach to model governance is shaped by a robust regulatory foundation.
This policy integrates the key external standards that guide how financial institutions
design, use, and oversee models — especially those that influence financial decisions or
affect Eva directly.
In particular, this policy aligns with:
● The EU AI Act (Regulation (EU) 2024/1689) - which requires risk classification,
transparency, human oversight, and governance of AI systems, especially where
models influence user-facing decisions or sensitive outcomes.
● The ECB Guide to Internal Models (202402) - which outlines how models used for
capital requirements must be developed, validated, and maintained.
Where applicable, the policy is also linked to bunq’s obligations under the Wwft, EBA
Guidelines on Outsourcing, and internal control expectations from the DNB.
Our internal model governance ensures that these external requirements are integrated
with bunq’s Risk Appetite Statement, Compliance Policy, and broader Risk Management
Policy. Together, these create a consistent framework for decision-making, model
validation, and risk reporting.
3. Scope
This policy applies to all models and model-like tools developed or used within bunq,
regardless of function, complexity, or department. This includes:
● Traditional Quantitative Models - such as capital forecasting, stress testing, or
pricing engines.
● End-User Computing (EUC) tools - including spreadsheets, calculators, or code
modules created by individual teams.
3

## Page 5

● AI Models and Systems - including predictive tools, scoring models, LLMs, and
third-party AI integrations.
If a tool uses data to automate or support decision-making - and carries the potential for
harm if it fails - it is considered in scope.
The policy covers the entire model lifecycle, from idea and design to deployment,
monitoring, and decommissioning. This ensures consistent standards around model
documentation, performance tracking, explainability, user impact, and risk mitigation.
It applies across all areas of bunq’s business, including but not limited to:
● Credit and financial risk management;
● Transaction monitoring and fraud detection;
● Regulatory capital reporting;
● User onboarding, support, and personalization.
If a model shapes a decision that affects Eva - we treat it with care.
4. Definitions
What We Mean When We Talk About Models
To manage model risk effectively, we first need to speak the same language. Below are
the key definitions we use at bunq when identifying and governing different types of
models and tools.
4.1 Traditional Quantitative Models
These are models built using statistical, financial, economic, or mathematical methods to
produce quantitative estimates. Their output supports key business decisions, such as
credit approvals, pricing, or regulatory reporting.
A traditional model has three parts:
1. Inputs - data and assumptions that feed the model.
2. Processing logic - the calculations that transform inputs into results.
3. Reporting - outputs that inform decisions or reporting.
4

## Page 6

To be treated as a “traditional model” under this policy, a tool must:
● Estimate or forecast future outcomes, and
● Feed directly or indirectly into external or regulatory reporting, pricing, compliance,
or decisions about risk, capital, or funding.
If a tool does not meet both conditions, it is likely an EUC, not a model.
4.2 End-User Computing (EUC) Tools
EUCs are spreadsheets, scripts, databases, or custom-built files created by employees to
support critical processes. These tools often help teams run daily operations or prepare
financial/regulatory information.
To identify an EUC, we ask: what is the tool used for?
An EUC typically fits into one or more of the following categories:
● Operational - used to support core tasks (e.g. tracking client agreements or
approvals);
● Analytical - used for management decision support;
● Financial - directly influences accounting, balances, or financial statements;
● Regulatory - used to support reports submitted to regulators.
If a file or tool meets any of the above purposes, it is considered in-scope under this policy.
4.3 AI Models
These are advanced tools that use technologies like:
● Machine learning;
● Embeddings and vectorization;
● Predictive analytics;
● Natural Language Processing (NLP).
Because of their complexity, scale, and learning behavior, AI models come with special
oversight requirements - including obligations under the EU AI Act. These models require
5

## Page 7

careful design, testing, documentation, and monitoring to ensure they're used
responsibly.
4.4 AI Systems
An AI System is more than just an algorithm - it’s a full setup that includes:
● One or more AI Models;
● Data pipelines and input systems;
● Decision logic and workflows;
● Interfaces and user-facing elements;
● Human oversight mechanisms.
Together, these components process data to produce decisions, predictions, or
recommendations that may impact Eva, bunq’s operations, or our compliance obligations.
4.5 Provider (as defined by the EU AI Act)
A Provider is the entity that develops or markets an AI System under its own brand.
The Provider is responsible for ensuring that the AI System meets regulatory obligations
across the full lifecycle - from initial design and documentation to risk classification,
transparency, and post-market monitoring.
4.6 Deployer (as defined by the EU AI Act)
A Deployer is the entity that uses or integrates an AI System into its operations.
At bunq, this usually means the teams or functions that apply AI models in real workflows.
As a Deployer, bunq must ensure that:
● AI is used as intended;
● Human oversight is in place;
● Users are informed and protected;
● Monitoring continues during system use.
6

## Page 8

Both roles - Provider and Deployer - are key to keeping AI safe, compliant, and aligned
with bunq’s values.
5. Roles and Responsibilities
At bunq, we believe that models don’t manage themselves - people do. That’s why we’ve
defined clear roles and responsibilities for every model or AI system we use, from idea to
live deployment.
These roles help us ensure that all models are safe, compliant, explainable, and - most
importantly - aligned with our values and Eva’s interests.
5.1 Model User (MU)
A Model User (MU) is any Adam who works with a model, AI system, or EUC as part of their
job.
Depending on the model’s design and use, MUs may have different access levels and
responsibilities - from reviewing outputs to triggering updates. In some cases, the MU and
the Model Owner can be the same person.
5.2 Model Owner (MO)
The Model Owner is responsible for the full lifecycle of a model, EUC, or AI system. That
includes:
● Designing and implementing the model;
● Keeping documentation and controls in place;
● Making sure the model or tool is approved before use (see Section 9);
● Ensuring MUs understand how to use and interpret it correctly;
● Keeping assumptions, inputs, and parameters up to date and traceable;
● Ensuring there's enough backup knowledge in the team to maintain the model.
Every model has exactly one MO - and that person is ultimately accountable for how it’s
built, used, and maintained.
7

## Page 9

5.3 Model Validator (MV)
The Model Validator is responsible for independently validating a model before it’s used -
and reviewing it periodically after that. This includes:
● Assessing the model’s structure and performance;
● Testing its assumptions and outputs;
● Documenting results and raising concerns when needed.
To remain independent, the MV must report separately from the MO - or, for lower-risk
models, be in a separate role at minimum.
5.4 Adam-in-the-Loop
When an AI system makes decisions that could affect Eva’s rights or access to services,
humans stay in the loop.
An Adam-in-the-loop ensures meaningful oversight over High-Risk AI Systems (as defined
in the EU AI Act). This person:
● Understands the system’s strengths and limitations;
● Can intervene, override, or pause decisions when needed;
● Documents how decisions were made - especially those affecting Eva;
● Acts as Eva’s advocate during decisions influenced by AI.
This role is active during the live operation of high-risk systems and focuses on real-time
decision oversight, not technical validation.
5.5 2nd Line of Defense
The 2nd Line of Defense oversees bunq’s model governance framework. This team
ensures:
● The Model Register is complete and up to date;
● Validation plans are scheduled and followed;
● Controls, approvals, and traceability are in place across all risk tiers.
Additional Responsibilities for AI Models & Systems
8

## Page 10

For AI governance - especially under the EU AI Act - the 2nd Line of Defense also:
● Confirms bunq’s role as an AI Provider or Deployer;
● Reviews the Fundamental Rights Impact Assessment (FRIA) for High-Risk AI
Systems;
● Verifies that post-market monitoring and incident reporting are in place.
● Supports the design and ongoing assessment of the Risk Management System
(EU AI Act, Article 9), ensuring that:
○ AI risks are identified and documented;
○ Controls are in place and regularly reviewed;
○ System performance is tested before and during use;
○ Outputs are traceable and auditable;
○ Emerging risks are monitored and addressed continuously.
5.6 Model Approver
The Model Approve is an individual or a Committee - often from the domain where the
model will be used - that reviews and approves:
● The initial use of high-risk models;
● Major updates or redeployments;
● Results from periodic validations.
For High-Risk AI Systems, the Model Approver also approves:
● The Fundamental Rights Impact Assessment;
● The Post-Market Monitoring Plan.
(as required under Article 17 of the EU AI Act).
Depending on the model’s use, the Model Approver can be a specialized group such as
the ALCO - or the Managing Board may serve as the approver when appropriate.
9

## Page 11

5.7 Managing Board (MB)
bunq’s Managing Board has overall responsibility for:
● Our business strategy;
● Setting and maintaining our Risk Appetite;
● Ensuring effective risk management and regulatory compliance.
This includes ultimate responsibility for the safety, prudentiality, and regulatory fitness of
models used in decision-making. While day-to-day ownership is delegated to MOs and
other roles, the MB provides strategic oversight and ensures that the model risk
framework supports bunq’s long-term goals.
6. Risk Classification & Controls
Not every model carries the same risk - so at bunq, we take a tailored approach.
Some models influence daily operations. Others help us decide whether Eva gets a loan or
determine what we report to the regulator. The more impact a model has, the more care
and oversight it requires.
That’s why we classify every model - traditional, AI, or EUC - based on its purpose, its
potential consequences, and its role in our operations.
6.1 bunq’s Model Risk Classification
Every model is rated as High, Medium, or Low Risk using two main factors:
● Purpose - How important is the model’s output? Where is it used? What happens
if the result is wrong?
● Materiality of Risk - What are the consequences if something goes wrong -
financially, operationally, or reputationally?
The highest of the two ratings determines the model’s overall risk level.
Purpose Example Uses Rating
Internal operations, admin tools Tracking internal tasks or support Low
workflows
10

## Page 12

Purpose Example Uses Rating
Business insights or decision Management reporting, Medium
support performance metrics
Decisions impacting Eva or the Regulatory reporting, pricing, High
regulator onboarding, credit scoring
Materiality Examples Rating
Low financial loss (< €25K), no Small-scale tool errors Low
external impact
Moderate losses (€25K–€250K), Business-level mistakes, minor Medium
complaints or audit findings supervisory concern
Major loss, license risk, regulatory Systemic error, harm to Eva or High
action market trust
We also consider:
● Complexity of the model;
● Stage of the model in its lifecycle (e.g. early design vs. live);
● Level of reliance (e.g. embedded in core operations);
● Degree of manual vs. automated control.
6.2 AI Risk Classification (EU AI Act)
For AI Models and Systems, we apply two layers of classification:
1. bunq’s internal model risk rating (High / Medium / Low), based on operational and
financial impact.
2. AI Risk Classification under the EU AI Act (Regulation 2024/1689).
This second layer looks specifically at Eva’s safety and rights, as well as transparency,
human oversight, and decision-making power of the AI system.
High-Risk AI
AI Systems are classified as High-Risk when they fall within the categories listed in Annex
III of the EU AI Act. These systems may affect Eva’s access to essential services or her
fundamental rights. At bunq, this includes:
11

## Page 13

● AI-driven creditworthiness and onboarding decisions;
● AI tools used in hiring or employee evaluation;
● Remote biometric identification (e.g. facial recognition).
High-Risk AI must be reviewed, approved, and monitored in line with Articles 9–17 of the
EU AI Act. This includes a Fundamental Rights Impact Assessment (FRIA) and
post-market monitoring.
Limited-Risk AI
These tools interact with Eva (e.g. chatbots or content generators) but don’t automate
decisions. They’re still governed by internal controls and transparency rules - but not
subject to High-Risk oversight.
Minimal or No Risk AI
Internal support tools that never impact Eva directly (e.g. summarization tools for Adams,
workflow optimizers). These aren’t subject to the EU AI Act - but still follow bunq’s internal
model controls.
NOTE: AI used for fraud, AML, and CFT is excluded from the High-Risk category under
Recital 58 of the AI Act - but still undergoes bunq’s own risk and control processes.
Prohibited AI
bunq does not develop or use AI systems that are banned under the EU AI Act (Article 5).
That includes:
● Social scoring based on personal traits or behavior;
● Real-time biometric tracking in public (unless legally mandated);
● AI targeting vulnerable groups for exploitation.
These systems are not just out of scope - they’re not allowed at all.
6.3 Control Requirements
The higher the risk, the stronger the controls. We apply a standard set of model controls
across the lifecycle - from development to deployment and monitoring. Depending on the
model’s risk tier, controls are scaled in intensity and frequency.
12

## Page 14

Traditional Models and EUCs
Risk rating Control requirements for the Traditional
Quantitative Model / EUC
● Location and backup. Under no
circumstances is a final version stored on
someone’s personal documents folder, the
Low risk local drive of a PC / Mac, or a removable
memory device. The final version must be
stored in either a shared Google Drive folder
or (even better) Gitlab.
All of the above, plus:
● Change Management. Every time the
design (including layout and formatting)
and / or logic of the model / EUC is changed,
the MO documents the date and nature of
the change.
● Version management. Each time changes to
the design and / or logic of the EUC / model
are accepted by the owner, the EUC / model
is saved under a new filename (i.e. the old
file is not overwritten, but a new file is
created) (based on semantic versioning:
1.2.3)
● Expertise. The necessary level of expertise
should be ensured if MO leaves the
organization. In this case, the other member
of the team must have sufficient knowledge
Medium risk
of how the EUC / model works and needs to
be maintained.
● Logic protection. Complex and / or critical
functions should be protected against
(accidental) change or corruption. For
spreadsheet-based EUCs / models, this
means that critical formulas / code should
be protected against accidental change, for
instance through password protection of
worksheets / individual cells or by making
use of list-objects.
● Model Register. Models / EUCs must be
included into the Model Register, a
centralized repository maintained by 2nd
Line of Defense to track and manage
models and EUCs with higher model risk.
See Section 10 for reference.
13

## Page 15

Risk rating Control requirements for the Traditional
Quantitative Model / EUC
All of the above, plus:
● Descriptive documentation. A document
containing all the details on how the model /
EUC is used.
● Access Restriction. Models / EUCs with high
risk are accessible on a “need-to-know”
basis. The exact precautions are left to the
initiative of the owner, but remain subject to
review and approval during the testing.
● Processing workflow. High-risk EUC / Model
High risk must include safety measures that ensure
correct entry and processing of data, and
which help detect errors and fraud. Towards
this end, the EUC / model design should be
structured in such a way that input is
entered in a dedicated worksheet (or table /
form / query).
● Review / Validation. High-risk EUCs / Models
are subject to pre-production or scheduled
repeated review / validation process
described further in Section 9.3
AI Models and Systems (additional control requirements)
Risk rating Control requirements for the AI Model / System
● No additional requirements. Stick to to
general internal MRM controls (location,
Minimal risk
backup, change management, version
management)
● Transparency & Disclosure
- Eva must be clearly informed they
are interacting with an AI system
unless it’s obvious.
Limited risk - Clearly indicate if content (e.g.,
financial insights, investment
advice, recommendations) has
been generated or significantly
modified by AI.
14

## Page 16

Risk rating Control requirements for the AI Model / System
● Data Governance
- Training, validation, and testing
data must be relevant,
representative, accurate, complete,
unbiased, and properly managed.
● Technical Documentation
- Detailed records on design, data,
algorithms, training, testing, and
validation updated on bunq Model
Register (GitLab)
● Record Keeping
- Continuous logging of operations
and outputs (model inference),
specifically to ensure traceability
and post-market monitoring
- Logs must capture input data,
decisions/recommendations, and
human override actions.
● Transparency: Clear instructions on
capabilities and limitations provided to
Adam
- expected human oversight actions
(when to interfere, review
recommendations, training, etc.)
- capabilities and limitations of the
model/system
High risk
● Human Oversight: Effective human
oversight mechanisms to prevent or
mitigate potential harm or errors.
- Define specific roles and
responsibilities for
Adam-in-the-loop
- Implement override and escalation
procedures
- Regularly audit Adam’s
interventions to detect patterns of
human error or systemic bias.
● Accuracy, Robustness, Cybersecurity
- Systems must maintain consistent
performance; be resilient against
attacks or attempts at
manipulation.
- Set KPIs (accuracy, precision, false
positives, deny rate, model drift,
etc.)
● Post-Market Monitoring
- Continuous monitoring of
performance metrics and
model/system behaviour
- Re-validation triggers (e.g. when to
update a model/system, significant
data changes)
15

## Page 17

AI models and systems with potential high-risk classification under the EU AI Act will be
subject to additional AI-specific governance, monitoring, and external validation
processes, as defined in the AI models and systems onboarding template.
7. Model Lifecycle
At bunq, models don’t just go live and disappear - they evolve. That’s why we manage
model risk across the full lifecycle, from early design through to daily use and continuous
improvement.
This approach helps us ensure that every model - whether traditional, AI-driven, or
spreadsheet-based - remains reliable, compliant, and aligned with our mission to protect
Eva.
The lifecycle applies to all models and systems in scope, and each phase comes with its
own level of model risk and required actions by the Model Owner (MO), Model Validator
(MV), Model User (MU), and oversight bodies.
7.1 Design
Risk Level: Low to Medium
Goal: Explore, prototype, and scope the model
● Model development starts when a Team Lead or Head identifies a need - the
responsible employee becomes the first MU.
● A Model Owner (MO) is appointed (can be the same person as the MU).
● The MO defines the model’s scope, assumptions, and objectives, and develops a
prototype.
● If applicable, the MV reviews and challenges the prototype during development.
● If the model is intended to replace another, it may act as a challenger model.
For AI Models & Systems:
● The MO should conduct early risk classification under the EU AI Act;
● If High-Risk AI is likely, the MO consults the 2nd Line of Defense to anticipate
required oversight (e.g. FRIA, post-market plan).
16

## Page 18

7.2 Implement
Risk Level: Highest
Goal: Finalize, validate, and deploy the production model
● The MO finalizes the production-ready version of the model;
● Development and documentation are completed with support from team
members;
● The MU conducts User Acceptance Testing (UAT) to confirm the model works as
intended;
● If required, the MV independently validates the model, producing a Validation
Report;
● The Model Approver reviews the validation and formally approves the model for
use.
At this stage, the model may be replacing an existing tool - so control and validation are
critical.
7.3 Enhance
Risk Level: Medium
Goal: Improve and refine the model after initial deployment
● The MO makes targeted improvements based on feedback or findings from
validations;
● Documentation is updated and MUs are informed of changes;
● The MU runs UAT again, confirming changes meet requirements;
● If enhancements are significant, the MV performs a re-validation and updates the
Validation Report;
● The DC reviews and approves major changes before deployment.
Risk decreases in this phase - but control remains important, especially for complex or
high-impact changes.
17

## Page 19

7.4 Maintain
Risk Level: Low
Goal: Monitor, support, and maintain trusted models
● The MO monitors model performance, ensuring continued accuracy and
alignment with its original purpose;
● The MU continues using the model and reports any issues or bugs;
● Where required, the MV conducts scheduled performance reviews based on model
tier and validation frequency (see Section 9.2);
● Updates and improvements are handled through the Enhance phase as needed.
Mature models are lower risk - but they’re never “set and forget.” Regular oversight
ensures they continue to support Eva and meet all regulatory expectations.
This lifecycle ensures bunq’s models are:
● Built with purpose;
● Approved with care;
● Evolving with oversight;
● Used with confidence.
8. Model Register & Monitoring
To manage model risk effectively, bunq maintains a central Model Register - a structured
system that tracks every model in use, its purpose, risk level, validation status, and lifecycle
stage.
This register ensures transparency, accountability, and regulatory compliance across all
Traditional Quantitative Models, EUCs, and AI Models and Systems. It helps us monitor
whether models are performing safely and whether required controls (like validations or
documentation) are in place.
8.1 Monitoring Model Risk
We track model risk using a combination of quantitative and qualitative KPIs, which are
linked to our Risk Appetite Statement (RAS). These KPIs are monitored as part of bunq’s
18

## Page 20

enterprise risk dashboard and provide early warnings when model risk might be rising -
helping us act before problems affect Eva or our operations.
8.2 Model Register Overview
The Model Register is maintained by the 2nd Line of Defense and hosted in GitLab, bunq’s
internal DevOps platform.
It covers all models, but additional detail is required for those rated Medium or High Risk.
Model Owners (MOs) are responsible for keeping entries up to date - especially when a
model is created, updated, or decommissioned.
Each registered model must have a GitLab entry (an “issue”) with the following
information:
Basic Metadata:
● Model name (also as issue title);
● Purpose and process it supports;
● Type: Traditional Model / EUC / AI Model / AI System;
● Risk classification (Low / Medium / High);
● Lifecycle stage (Design / Implement / Enhance / Maintain);
● Developer (internal or third-party);
● Current version, creation date;
● Model Owner (assigned as issue owner).
Documentation & Control:
● Link to the model, logic, and source code;
● Descriptive documentation (if required);
● Validation history (for High-Risk Models):
○ Last validation date;
○ Validation Report;
19

## Page 21

○ Review score;
○ Re-validation frequency and due date;
○ Validation type (internal or external).
Labels (GitLab):
● Model type;
● Risk rating;
● Lifecycle stage;
● Validation status (Adequate / Minor Deficiencies / Major Deficiencies / Severe
Deficiencies);
● Documentation completeness.
8.3 Descriptive Documentation (High-Risk Models Only)
High-Risk models also require separate Descriptive Documentation, covering:
● Inputs, outputs, and data sources;
● Processing logic and calculation type;
● Functional specifications and settings;
● User guide or manual;
● Intended use cases and limitations;
● Supervisory or regulatory scope;
● Assumptions and version history;
● List of users and access levels (if relevant);
● Summary of last major change and any testing results.
This ensures that the model remains explainable, auditable, and transparent throughout
its use.
20

## Page 22

8.4 AI Model & System Register (EU AI Act Requirements)
AI Models and AI Systems require additional registration steps to meet the obligations of
the EU AI Act - particularly for High-Risk AI. The Model Register entry must include:
General Information:
● Name, version, location, Model Owner.
AI Risk Management Info:
● Primary use and impact;
● Whether it automates decisions;
● Whether it affects Eva’s rights or access.
Technical Details:
● Inputs, outputs, logic;
● Human oversight in place;
● Interaction with Eva (if applicable).
Compliance with EU AI Act:
● Risk classification (Minimal / Limited / High);
● bunq’s role: Provider or Deployer;
● Fundamental Rights Impact Assessment (FRIA) status;
● Human oversight plan;
● Post-market monitoring in place;
● Confirmation of no prohibited AI practices.
8.5 Approval & Ongoing Maintenance (AI Models)
1. The Model Owner completes the AI Registration Template;
2. The 2nd Line of Defense reviews:
○ bunq’s role under the AI Act;
21

## Page 23

○ Risk classification;
○ Controls (FRIA, oversight, transparency, incident handling).
3. Any gaps are documented with a Corrective Action Plan (CAP);
4. The Model Approver approves the AI System if classified as High-Risk
5. Once approved, the system is logged in the Model Register and monitored
continuously.
By maintaining this register - and making it dynamic, auditable, and user-centric - bunq
ensures that every model is not only built well, but stays safe, explainable, and effective
long after go-live.
9. Validation Process
Validation is how we make sure models are safe before - and after - they go live. It’s an
independent check on a model’s design, data, assumptions, and performance, helping us
ensure that models work as intended, comply with regulations, and support responsible
decisions for Eva, Adam, and bunq.
All models rated High Risk must be validated by a qualified, independent Model Validator
(MV). The scope and frequency of validation are tailored to the model’s purpose, maturity,
and previous validation results.
9.1 Validating a New High-Risk Model
Before a High-Risk Model (traditional, AI, or EUC) is used in production:
1. The Model Owner (MO) registers the model with the 2nd Line of Defense,
including:
○ Model details (see Section 8);
○ Proposed validation scope and approach.
2. The 2nd Line of Defense reviews and confirms the registration, ensuring the right
risk classification, documentation, and controls are in place before the model goes
live.
22

## Page 24

9.2 Validating Existing Models
High-Risk models must be re-validated periodically to ensure they remain fit for purpose.
● The default frequency is every 2 years
● This may be shortened or extended based on:
○ Previous validation results;
○ Model lifecycle stage;
○ Regulatory expectations;
○ Emerging risks or system changes.
The MO is responsible for coordinating re-validation. The 2nd Line of Defense tracks
deadlines and sends reminders at least 6 months in advance.
9.3 Assigning the Validator
The MO estimates the expected effort, and works with the 2nd Line to assign a Model
Validator (MV) with the right skills and independence. The MV must:
● Be functionally independent from the MO;
● Not have contributed to the model’s design;
● Be appropriately trained and qualified.
9.4 Setting the Scope of Validation
The scope depends on the model’s complexity and risk level. The three standard scopes
are:
Scope Description
Enhanced Full validation: deep dive, replication of results,
detailed report
Standard Targeted review: key logic, inputs, and assumptions
tested
Light High-level review: documentation and structural
adequacy
The validation should cover the following areas, adapted based on model type:
23

## Page 25

● Design logic and mathematical soundness;
● Data quality and processing;
● Assumptions and sensitivity;
● Predictability and performance;
● Documentation completeness;
● User access and controls;
● Security, compliance, and explainability (esp. for AI systems).
9.5 Validation Reporting & Findings
The MV produces a Validation Report that includes:
● Scope of work;
● Procedures followed;
● Identified findings;
● Remediation recommendations;
● Overall rating.
Each finding is scored based on:
● Impact: High / Medium / Low / Unknown;
● Feasibility of remediation: High / Medium / Low / Not possible.
The Model Owner is responsible for addressing all findings within agreed timelines. These
are tracked in GitLab as Corrective Action Plans (CAPs) and monitored by the 2nd Line.
9.6 Validation Ratings
Each model receives an overall validation rating:
Rating Meaning
A Adequate – no deficiencies
24

## Page 26

Rating Meaning
B Minor deficiencies – improvement areas noted, not
material
C Major deficiencies – remediation required to maintain
usage
D Severe deficiencies – model must be halted or
redeveloped
A “D” rating automatically suspends the model from use until remediation or
redevelopment is complete.
10. Model Approval
Every High-Risk Model or reviewed EUC must be formally approved taking into account
the findings in the Validation Report. For most models this approval is granted by the
CRO. However, for capital and liquidity models specifically, the ALCO assumes this
responsibility.
The Model Approver is responsible for ensuring that:
● The validation has been properly completed;
● Identified issues are well understood;
● The model is safe to use - or to continue using - based on its current risk profile.
If a model receives a validation rating of C (Major Deficiencies) or D (Severe Deficiencies),
the DC cannot grant approval until all findings with High impact have been:
● Fully remediated by the Model Owner, and;
● Verified by the Model Validator.
In short: models that present serious risk must be fixed before they move forward.
Once approved, the model is cleared for deployment or continued use and is tracked in
the Model Register with updated status and documentation.
25