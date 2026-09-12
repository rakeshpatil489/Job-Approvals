# Multi-Approver Requisition Chains — Interactive Prototype

A fully interactive prototype for multi-approver requisition workflows in softgarden's ATS. Built to validate complex enterprise approval patterns before committing to production — covering admin configuration, requester submission, approver decision-making, and full audit trails across sequential and alternative chain types.

# Tech details
* Stack: HTML, CSS (custom properties), vanilla JavaScript
* Design tokens: 34 CSS custom properties for colour, shadow, radius, spacing
* Screens:	7 connected views across admin, requester, and approver flows
* Tour system:	7-step guided walkthrough with keyboard-accessible navigation
* Dev server:	Node.js with SSE-based live reload for local development
* AI tooling:	Built with Claude as a design and prototyping partner

# Context

Enterprise customers operate under rigid, often legally mandated approval processes for hiring. A requisition for a senior role must pass through a specific sequence — Team Lead → Department Head → CFO. These chains aren't preferences; they're company policy.

softgarden's existing approval flow supports only a single approver per requisition. In practice, any approver can forward the requisition to someone else, creating an informal chain — but it isn't configurable, isn't enforceable, and leaves no structured audit trail of "the right people approved in the right order."

This feature closes that gap: admins configure approval chains directly on a form template (sequential or alternative) and lock them in for every requisition submitted against that form.


# What this prototype covers

The prototype walks through 7 connected screens representing the full end-to-end workflow across three user roles (admin, requester, approver):

Admin: Chain Configuration Settings view where admins define approval chains on requisition form templates. Supports both sequential chains (Step 1 → Step 2 → Step 3, in order) and alternative chains (any one of three approvers can decide — first response wins). Each form template can have its own chain, and forms are tagged as managed or custom.

Requester: Submit with Chain Preview Before submitting, the requester sees the locked approval chain — who will approve, in what order, and what type of chain applies. No ambiguity about what happens next. After submission, a confirmation screen shows who has been notified first.

Approver: Decision & Action The approver's detail view shows the full requisition alongside their decision options: approve and forward to the next step, or reject and return to the requester with a comment. The sequential chain view highlights the current step and completed steps. The alternative chain view shows all eligible approvers and who acted first.

Final State: Approved with Audit Trail A completed requisition with full approval history — who approved, when, and in what order. This is the audit trail that enterprise compliance requires.

Legacy Compatibility A read-only view showing how existing single-approver requisitions appear alongside the new multi-approver chains, so the transition is non-disruptive.


# Interaction patterns defined

Several interaction patterns were designed and tested through this prototype:

* Admin/User mode toggle — global switch that changes available actions and visible configuration options without a page reload, so stakeholders could quickly compare both perspectives during review sessions
* Sequential vs. alternative chain visualisation — two distinct visual treatments for chain progress: a stepped vertical timeline (sequential) vs. a grouped card layout (alternative) where any approver can act
* Guided tour overlay — a 7-step walkthrough banner with navigation controls, allowing stakeholders and PMs to step through the full user journey without needing instructions
* Status chip system — consistent colour-coded chips (pending, approved, rejected) used across list views, detail views, and activity logs to maintain scanability in information-dense layouts
* Reject & return modal — scoped action modal with a required comment field, reinforcing that rejection is a deliberate decision with context for the requester

Run locally
* git clone https://github.com/rakeshpatil489/Job-Approvals.git
* cd Job-Approvals
* npm start

No dependencies to install. The dev server includes live reload — edit any file and the browser refreshes automatically.

Author 
Rakesh Patil — Senior Product Designer & Design Engineer GitHub

This prototype is a design exploration for softgarden's multi-approver requisition feature. It is not production code and is not affiliated with or endorsed by softgarden.
