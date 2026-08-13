import { describe, it, expect } from "vitest";
import { ORG_ROLES, hasPermission, canAssignRole, type OrgPermission } from "./organizer-permissions";

const ALL_PERMISSIONS: OrgPermission[] = [
  "VIEW_DASHBOARD",
  "MANAGE_ORGANIZATION_PROFILE",
  "MANAGE_ADMINISTRATORS",
  "MANAGE_PEOPLE",
  "VIEW_SENSITIVE_PARTICIPANT_DATA",
  "MANAGE_PROGRAMS",
  "MANAGE_REGISTRATIONS",
  "APPROVE_REGISTRATIONS",
  "VIEW_PAYMENTS",
  "MANAGE_PAYMENTS",
  "ISSUE_REFUNDS",
  "PUBLISH_CONTENT",
  "VIEW_REPORTS",
];

describe("hasPermission", () => {
  it("grants OWNER every permission", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(hasPermission("OWNER", permission)).toBe(true);
    }
  });

  it("grants every role VIEW_DASHBOARD", () => {
    for (const role of ORG_ROLES) {
      expect(hasPermission(role, "VIEW_DASHBOARD")).toBe(true);
    }
  });

  it("never grants READ_ONLY any mutating permission", () => {
    const mutating: OrgPermission[] = [
      "MANAGE_ORGANIZATION_PROFILE",
      "MANAGE_ADMINISTRATORS",
      "MANAGE_PEOPLE",
      "MANAGE_PROGRAMS",
      "MANAGE_REGISTRATIONS",
      "APPROVE_REGISTRATIONS",
      "MANAGE_PAYMENTS",
      "ISSUE_REFUNDS",
      "PUBLISH_CONTENT",
    ];
    for (const permission of mutating) {
      expect(hasPermission("READ_ONLY", permission)).toBe(false);
    }
  });

  it("only OWNER and ADMINISTRATOR can manage administrators", () => {
    for (const role of ORG_ROLES) {
      const expected = role === "OWNER" || role === "ADMINISTRATOR";
      expect(hasPermission(role, "MANAGE_ADMINISTRATORS")).toBe(expected);
    }
  });

  it("only OWNER and ADMINISTRATOR can issue refunds", () => {
    for (const role of ORG_ROLES) {
      const expected = role === "OWNER" || role === "ADMINISTRATOR";
      expect(hasPermission(role, "ISSUE_REFUNDS")).toBe(expected);
    }
  });

  it("STAFF cannot view sensitive participant data", () => {
    expect(hasPermission("STAFF", "VIEW_SENSITIVE_PARTICIPANT_DATA")).toBe(false);
  });

  it("COACH can view sensitive participant data but cannot manage payments", () => {
    expect(hasPermission("COACH", "VIEW_SENSITIVE_PARTICIPANT_DATA")).toBe(true);
    expect(hasPermission("COACH", "MANAGE_PAYMENTS")).toBe(false);
  });
});

describe("canAssignRole", () => {
  it("lets STAFF assign every non-admin-tier role", () => {
    for (const role of ["OPERATIONS_MANAGER", "COACH", "STAFF", "READ_ONLY"] as const) {
      expect(canAssignRole("STAFF", role)).toBe(true);
    }
  });

  it("never lets STAFF assign OWNER or ADMINISTRATOR", () => {
    expect(canAssignRole("STAFF", "OWNER")).toBe(false);
    expect(canAssignRole("STAFF", "ADMINISTRATOR")).toBe(false);
  });

  it("lets OWNER and ADMINISTRATOR assign any role including OWNER", () => {
    for (const assigner of ["OWNER", "ADMINISTRATOR"] as const) {
      for (const target of ORG_ROLES) {
        expect(canAssignRole(assigner, target)).toBe(true);
      }
    }
  });

  it("never lets a role without MANAGE_PEOPLE assign anything", () => {
    for (const target of ORG_ROLES) {
      expect(canAssignRole("COACH", target)).toBe(false);
      expect(canAssignRole("READ_ONLY", target)).toBe(false);
    }
  });

  it("OPERATIONS_MANAGER can assign non-admin roles but not admin-tier roles", () => {
    expect(canAssignRole("OPERATIONS_MANAGER", "COACH")).toBe(true);
    expect(canAssignRole("OPERATIONS_MANAGER", "OWNER")).toBe(false);
    expect(canAssignRole("OPERATIONS_MANAGER", "ADMINISTRATOR")).toBe(false);
  });
});
