/**
 * Score computation service — all UoM-based calculations happen server-side
 */

function computeScore(uomType, target, actual, targetDate, actualDate) {
  if (actual === null || actual === undefined) return null;

  switch (uomType) {
    case "NUMERIC_MIN": {
      // Higher is better: score = actual / target
      if (target === 0) return actual > 0 ? 100 : 0;
      const score = (actual / target) * 100;
      return Math.min(Math.round(score * 100) / 100, 150); // Cap at 150%, 2 decimal places
    }

    case "NUMERIC_MAX": {
      // Lower is better: score = target / actual
      if (actual === 0) return 100;
      const score = (target / actual) * 100;
      return Math.min(Math.round(score * 100) / 100, 150);
    }

    case "TIMELINE": {
      if (!targetDate || !actualDate) return null;
      const deadline = new Date(targetDate);
      const completed = new Date(actualDate);
      if (completed <= deadline) return 100;
      const daysLate = Math.ceil((completed - deadline) / (1000 * 60 * 60 * 24));
      return Math.max(Math.round((100 - daysLate * 5) * 100) / 100, 0);
    }

    case "ZERO": {
      return actual === 0 ? 100 : 0;
    }

    default:
      return null;
  }
}

function computeWeightedScore(goals) {
  let totalWeightedScore = 0;
  let totalWeightage = 0;

  for (const goal of goals) {
    if (goal.achievements && goal.achievements.length > 0) {
      // Use latest quarter's score
      const latestAchievement = goal.achievements
        .filter((a) => a.score !== null)
        .sort((a, b) => {
          const order = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
          return order[b.quarter] - order[a.quarter];
        })[0];

      if (latestAchievement) {
        totalWeightedScore += (latestAchievement.score * goal.weightage) / 100;
        totalWeightage += goal.weightage;
      }
    }
  }

  if (totalWeightage === 0) return null;
  return Math.round((totalWeightedScore / totalWeightage) * 100 * 100) / 100;
}

module.exports = { computeScore, computeWeightedScore };
