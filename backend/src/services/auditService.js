const prisma = require("../lib/prisma");

/**
 * Writes an audit log entry whenever a locked goal field changes
 */
async function logAuditChange(goalId, changedById, fieldChanged, oldValue, newValue) {
  await prisma.auditLog.create({
    data: {
      goalId,
      changedById,
      fieldChanged,
      oldValue: oldValue !== null && oldValue !== undefined ? String(oldValue) : null,
      newValue: newValue !== null && newValue !== undefined ? String(newValue) : null,
    },
  });
}

/**
 * Compare old and new goal data and log all changes
 */
async function logGoalChanges(goalId, changedById, oldData, newData) {
  const fieldsToTrack = ["title", "description", "thrustArea", "uomType", "target", "targetDate", "weightage", "status", "locked"];

  for (const field of fieldsToTrack) {
    const oldVal = oldData[field];
    const newVal = newData[field];
    if (oldVal !== newVal && newVal !== undefined) {
      await logAuditChange(goalId, changedById, field, oldVal, newVal);
    }
  }
}

module.exports = { logAuditChange, logGoalChanges };
