export const PERMISSIONS = {
  // Student / CTV gated features
  OFFICE_DUTY_PORTAL: [
    "MOD_DEPT_OFFICE",
    "MOD_DEPT_OFFICE_LEAD",
    "MOD_UNIT_HR_INTERNAL",
    "duty:register",
    "duty:checkin"
  ],

  // Arts portal restricted to Deputy Team Lead (Tổ phó Ban Văn nghệ) and above
  ARTS_LEAD_PORTAL: [
    "MOD_DEPT_ARTS_LEAD",
    "arts:lead",
    "performance:approve",
    "ROLE_ARTS_DEPUTY_TEAM_LEAD",
    "ROLE_ARTS_TEAM_LEAD",
    "ROLE_ARTS_DEPUTY_HEAD",
    "ROLE_ARTS_HEAD"
  ],

  // Stage LED surface
  STAGE_CONTROL: [
    "MOD_QUIZ_EXAM_HOST",
    "MOD_EVENT_OPS",
    "MOD_ATTENDANCE_STAFF",
    "minigame:host",
    "liveqa:moderate",
    "voting:host",
    "stage:control"
  ],

  // Admin modules (each accepts BOTH dynamic MOD_* packages AND fine-grained resource:action)
  ADMIN_IAM_ROSTER: ["rbac:manage", "roster:manage"],
  ADMIN_IAM_RBAC: ["rbac:manage"],
  ADMIN_IAM_UNIT_HR: ["MOD_UNIT_HR_INTERNAL", "unit_hr:manage"],
  ADMIN_IAM_RESTRUCTURING: ["rbac:manage", "org:restructure"],

  ADMIN_EVENTS: [
    "MOD_EVENT_OPS",
    "MOD_DEPT_EVENT_MEDIA",
    "event:create",
    "event:update",
    "internal_event:create"
  ],
  ADMIN_ATTENDANCE: [
    "MOD_ATTENDANCE_STAFF",
    "MOD_EVENT_OPS",
    "attendance:scan_barcode",
    "attendance:review"
  ],
  ADMIN_CERTIFICATES: ["certificate:manage", "MOD_EVENT_OPS"],
  ADMIN_AUDIT: ["MOD_AUDIT_VIEWER", "audit:view"],

  ADMIN_CMS: ["MOD_CMS_EDITORIAL", "cms:edit", "cms:publish"],
  CMS_CONTRIBUTE: [
    "MOD_CMS_EDITORIAL",
    "MOD_DEPT_EVENT_MEDIA",
    "cms:contribute",
    "cms:create",
    "cms:edit",
    "cms:publish"
  ],
  ADMIN_SV5T: ["MOD_DEPT_SV5T", "sv5t:review", "award:manage"],
  ADMIN_SURVEYS: ["MOD_SURVEY_POLL", "survey:manage"],
  ADMIN_LIVEQA: ["MOD_QUIZ_EXAM_HOST", "MOD_LIVEQA_UNMASK", "liveqa:moderate", "liveqa:unmask"],
  ADMIN_VOTING: ["MOD_SURVEY_POLL", "MOD_QUIZ_EXAM_HOST", "voting:manage", "voting:host"],
  ADMIN_OFFICE: ["MOD_DEPT_OFFICE", "MOD_DEPT_OFFICE_LEAD", "inventory:scan_barcode", "duty:manage"],
  ADMIN_STORE: ["MOD_STORE_MANAGER", "MOD_STORE_BOOTH", "store:manage", "store:scan_barcode", "store:fulfill"],
  ADMIN_EXAMS_MINIGAME: [
    "MOD_QUIZ_EXAM_HOST",
    "MOD_EVENT_OPS",
    "minigame:create",
    "minigame:host",
    "exam:manage"
  ],
  ADMIN_YITBOT: ["MOD_YITBOT_CURATOR", "MOD_YITBOT_FULL", "yitbot:curate", "yitbot:approve"],
  ADMIN_ARTS: ["MOD_DEPT_ARTS", "MOD_DEPT_ARTS_LEAD", "performance:approve", "performance:view"],
  ADMIN_INBOX: ["MOD_QA_MESSENGER", "qachat:reply", "qachat:manage"],
  ADMIN_OJ: ["MOD_OJ_MANAGER", "oj:manage"]
};

export const ALL_ADMIN_AUTHORITIES = Array.from(
  new Set([
    ...PERMISSIONS.ADMIN_IAM_ROSTER,
    ...PERMISSIONS.ADMIN_IAM_RBAC,
    ...PERMISSIONS.ADMIN_IAM_UNIT_HR,
    ...PERMISSIONS.ADMIN_IAM_RESTRUCTURING,
    ...PERMISSIONS.ADMIN_EVENTS,
    ...PERMISSIONS.ADMIN_ATTENDANCE,
    ...PERMISSIONS.ADMIN_CERTIFICATES,
    ...PERMISSIONS.ADMIN_AUDIT,
    ...PERMISSIONS.ADMIN_CMS,
    ...PERMISSIONS.ADMIN_SV5T,
    ...PERMISSIONS.ADMIN_SURVEYS,
    ...PERMISSIONS.ADMIN_LIVEQA,
    ...PERMISSIONS.ADMIN_VOTING,
    ...PERMISSIONS.ADMIN_OFFICE,
    ...PERMISSIONS.ADMIN_STORE,
    ...PERMISSIONS.ADMIN_EXAMS_MINIGAME,
    ...PERMISSIONS.ADMIN_YITBOT,
    ...PERMISSIONS.ADMIN_ARTS,
    ...PERMISSIONS.ADMIN_INBOX,
    ...PERMISSIONS.ADMIN_OJ
  ])
);

/**
 * Checks whether the current user's granted authorities satisfy at least one required permission.
 * Never checks hardcoded role names — only explicit granted authorities (plus Standing Committee full-scope wildcard).
 */
export function hasAnyPermission(
  grantedAuthorities,
  required
) {
  if (!required || required.length === 0) return true;
  if (grantedAuthorities.includes("ROLE_STANDING_COMMITTEE")) return true;
  return required.some((perm) => grantedAuthorities.includes(perm));
}

export function canAccessAdminWorkspace(
  isAuthenticated,
  grantedAuthorities
) {
  if (!isAuthenticated) return false;
  return hasAnyPermission(grantedAuthorities, ALL_ADMIN_AUTHORITIES);
}

export function canAccessStageWorkspace(
  isAuthenticated,
  grantedAuthorities
) {
  if (!isAuthenticated) return false;
  return hasAnyPermission(grantedAuthorities, PERMISSIONS.STAGE_CONTROL);
}

const INTERNAL_CTV_AUTHORITIES = [
  ...PERMISSIONS.OFFICE_DUTY_PORTAL,
  "internal_event:view",
  "internal_event:create",
  "internal_event:update",
  "internal_event:attendance",
  "ROLE_CTV",
  "ROLE_COLLABORATOR",
  "ROLE_BCH",
  "ROLE_SYSTEM_ADMIN"
];

export function canViewInternalCtvEvents(
  isAuthenticated,
  grantedAuthorities,
  roleScopes = []
) {
  if (!isAuthenticated) return false;
  if (roleScopes.length > 0) return true;
  if (canAccessAdminWorkspace(isAuthenticated, grantedAuthorities)) return true;
  return hasAnyPermission(grantedAuthorities, INTERNAL_CTV_AUTHORITIES);
}
