const DIFFICULTY = 3;
const MINE_RATE = 3000;

// Valid case lifecycle transitions
const VALID_TRANSITIONS = {
  case_registered: ["under_investigation", "charge_framing"],
  under_investigation: ["charge_framing", "closed"],
  charge_framing: ["trial"],
  trial: ["arguments", "adjourned"],
  adjourned: ["trial", "arguments"],
  arguments: ["judgment"],
  judgment: ["judgment_delivered"],
  judgment_delivered: ["appeal", "closed"],
  appeal: ["trial", "closed"],
};

// Valid action types for blockchain logging
const ACTION_TYPES = [
  "case_registered",
  "status_change",
  "stage_change",
  "hearing_scheduled",
  "hearing_completed",
  "hearing_updated",
  "hearing_rescheduled",
  "judgment_delivered",
  "advocate_assigned",
  "advocate_removed",
  "person_added",
  "person_removed",
  "person_updated",
  "person_status_update",
  "person_status_verified",
  "section_added",
  "section_removed",
  "detention_updated",
  "evidence_submitted",
  "bail_granted",
  "bail_denied",
  "case_transferred",
  "case_closed",
  "case_deactivated",
  "case_reopened",
  "fir_updated",
  "judge_assigned",
];

module.exports = { DIFFICULTY, MINE_RATE, VALID_TRANSITIONS, ACTION_TYPES };
