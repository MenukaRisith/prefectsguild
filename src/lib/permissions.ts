import type { Role } from "@prisma/client";

export const allStaffRoles: Role[] = ["TEACHER", "ADMIN", "SUPER_ADMIN"];
export const verificationRoles: Role[] = ["ADMIN", "SUPER_ADMIN"];
export const dutyManagerRoles: Role[] = ["TEACHER", "SUPER_ADMIN"];
export const assignmentRoles: Role[] = ["ADMIN", "SUPER_ADMIN"];
export const announcementRoles: Role[] = ["ADMIN", "SUPER_ADMIN"];

export function hasRole(userRole: Role, allowedRoles: Role[]) {
  return allowedRoles.includes(userRole);
}

export function isStaff(userRole: Role) {
  return allStaffRoles.includes(userRole);
}
