export const ErrorCodes = {
  // ── General / system ─────────────────────────────────────────
  GENERAL_SYSTEM_ERROR:          { code: "XMC_E0001", label: "GENERAL_SYSTEM_ERROR" },
  INVALID_INPUT:                 { code: "XMC_E0002", label: "INVALID_INPUT" },
  VALIDATION_FAILED:             { code: "XMC_E0003", label: "VALIDATION_FAILED" },
  EMPTY_REQUEST:                 { code: "XMC_E0004", label: "EMPTY_REQUEST" },
  ID_REQUIRED:                   { code: "XMC_E0005", label: "ID_REQUIRED" },
  INPUT_REQUIRED:                { code: "XMC_E0006", label: "INPUT_REQUIRED" },
  RESOURCE_NOT_FOUND:            { code: "XMC_E0007", label: "RESOURCE_NOT_FOUND" },
  RECORD_NOT_FOUND:              { code: "XMC_E0008", label: "RECORD_NOT_FOUND" },
  RECORD_ALREADY_EXISTS:         { code: "XMC_E0009", label: "RECORD_ALREADY_EXISTS" },
  DUPLICATE_RESOURCE:            { code: "XMC_E0010", label: "DUPLICATE_RESOURCE" },
  DATABASE_ERROR:                { code: "XMC_E0011", label: "DATABASE_ERROR" },
  INTEGRITY_CONSTRAINT_VIOLATION:{ code: "XMC_E0012", label: "INTEGRITY_CONSTRAINT_VIOLATION" },
  CONCURRENT_MODIFICATION:       { code: "XMC_E0013", label: "CONCURRENT_MODIFICATION" },
  PRECONDITION_FAILED:           { code: "XMC_E0014", label: "PRECONDITION_FAILED" },
  INVALID_STATE:                 { code: "XMC_E0015", label: "INVALID_STATE" },
  OPERATION_TIMEOUT:             { code: "XMC_E0016", label: "OPERATION_TIMEOUT" },
  SERVICE_UNAVAILABLE:           { code: "XMC_E0017", label: "SERVICE_UNAVAILABLE" },
  UNSUPPORTED_OPERATION:         { code: "XMC_E0018", label: "UNSUPPORTED_OPERATION" },
  RATE_LIMIT_EXCEEDED:           { code: "XMC_E0019", label: "RATE_LIMIT_EXCEEDED" },
  CONFIGURATION_ERROR:           { code: "XMC_E0020", label: "CONFIGURATION_ERROR" },
  DEPENDENCY_CONFLICT:           { code: "XMC_E0021", label: "DEPENDENCY_CONFLICT" },

  // ── Generic CRUD ─────────────────────────────────────────────
  CREATION_FAILED:               { code: "XMC_E0100", label: "CREATION_FAILED" },
  UPDATE_FAILED:                 { code: "XMC_E0101", label: "UPDATE_FAILED" },
  DELETION_FAILED:               { code: "XMC_E0102", label: "DELETION_FAILED" },
  RETRIEVAL_FAILED:              { code: "XMC_E0103", label: "RETRIEVAL_FAILED" },
  BULK_REQUEST_ERROR:            { code: "XMC_E0104", label: "SOME_FIELDS_FAILED_TO_PROCESS" },

  // ── Auth ─────────────────────────────────────────────────────
  UNAUTHORIZED_ACCESS:           { code: "XMC_E0200", label: "UNAUTHORIZED_ACCESS" },
  PERMISSION_DENIED:             { code: "XMC_E0201", label: "PERMISSION_DENIED" },
  INVALID_CREDENTIALS:           { code: "XMC_E0202", label: "INVALID_CREDENTIALS" },
  SESSION_EXPIRED:               { code: "XMC_E0203", label: "SESSION_EXPIRED" },
  INVALID_TOKEN:                 { code: "XMC_E0204", label: "INVALID_TOKEN" },
  TOKEN_EXPIRED:                 { code: "XMC_E0205", label: "TOKEN_EXPIRED" },
  TOKEN_NOT_MATCH:                { code: "XMC_E0206", label: "TOKEN_NOT_MATCH" },
  INVALID_REFRESH_TOKEN:         { code: "XMC_E0207", label: "INVALID_REFRESH_TOKEN" },
  REFRESH_TOKEN_REUSE:           { code: "XMC_E0208", label: "REFRESH_TOKEN_REUSE" },
  ACCESS_REVOKED:                { code: "XMC_E0209", label: "ACCESS_REVOKED" },
  WRONG_TOKEN_TYPE:              { code: "XMC_E0210", label: "WRONG_TOKEN_TYPE" },
  INVALID_OTP:                   { code: "XMC_E0211", label: "INVALID_OTP" },
  INVALID_RESET_TOKEN:            { code: "XMC_E0212", label: "INVALID_RESET_TOKEN" },
  SAME_PASSWORD:                 { code: "XMC_E0213", label: "SAME_PASSWORD" },

  // ── Account status ───────────────────────────────────────────
  ACCOUNT_LOCKED:                { code: "XMC_E0300", label: "ACCOUNT_LOCKED" },
  ACCOUNT_INACTIVE:              { code: "XMC_E0301", label: "ACCOUNT_INACTIVE" },
  ACCOUNT_SUSPENDED:              { code: "XMC_E0302", label: "ACCOUNT_SUSPENDED" },
  ACCOUNT_DEACTIVATED:           { code: "XMC_E0303", label: "ACCOUNT_DEACTIVATED" },
  ACCOUNT_PENDING:               { code: "XMC_E0304", label: "ACCOUNT_PENDING" },
  ACCOUNT_BLOCKED:                { code: "XMC_E0305", label: "ACCOUNT_BLOCKED" },
  ACCOUNT_DELETED:               { code: "XMC_E0306", label: "ACCOUNT_DELETED" },
  USER_NOT_FOUND:                 { code: "XMC_E0307", label: "USER_NOT_FOUND" },

  // ── Tutor profile & verification ────────────────────────────
  TUTOR_NOT_FOUND:               { code: "XMC_E0400", label: "TUTOR_NOT_FOUND" },
  TUTOR_NOT_VERIFIED:            { code: "XMC_E0401", label: "TUTOR_NOT_VERIFIED" },
  VERIFICATION_ALREADY_SUBMITTED:{ code: "XMC_E0402", label: "VERIFICATION_ALREADY_SUBMITTED" },
  VERIFICATION_REJECTED:         { code: "XMC_E0403", label: "VERIFICATION_REJECTED" },
  INVALID_HOURLY_RATE:            { code: "XMC_E0404", label: "INVALID_HOURLY_RATE" },
  SERVICE_AREA_NOT_FOUND:        { code: "XMC_E0405", label: "SERVICE_AREA_NOT_FOUND" },
  DUPLICATE_TUTOR_SUBJECT:       { code: "XMC_E0406", label: "DUPLICATE_TUTOR_SUBJECT" },
  DUPLICATE_SERVICE_AREA:        { code: "XMC_E0407", label: "DUPLICATE_SERVICE_AREA" },
  INVALID_VERIFICATION_STATE:        { code: "XMC_E0407", label: "INVALID_VERIFICATION_STATE" },

  // ── Student profile ──────────────────────────────────────────
  STUDENT_NOT_FOUND:             { code: "XMC_E0500", label: "STUDENT_NOT_FOUND" },
  PROFILE_INCOMPLETE:            { code: "XMC_E0501", label: "PROFILE_INCOMPLETE" },
  GUARDIAN_INFO_MISSING:         { code: "XMC_E0502", label: "GUARDIAN_INFO_MISSING" },

  // ── Subjects & availability ──────────────────────────────────
  SUBJECT_NOT_FOUND:             { code: "XMC_E0600", label: "SUBJECT_NOT_FOUND" },
  INVALID_TIME_SLOT:             { code: "XMC_E0601", label: "INVALID_TIME_SLOT" },
  INVALID_DATE_RANGE:            { code: "XMC_E0602", label: "INVALID_DATE_RANGE" },
  SCHEDULE_CONFLICT:             { code: "XMC_E0603", label: "SCHEDULE_CONFLICT" },
  TUTOR_UNAVAILABLE:              { code: "XMC_E0604", label: "TUTOR_UNAVAILABLE" },
  AVAILABILITY_OVERLAP:              { code: "XMC_E0605", label: "AVAILABILITY_OVERLAP" },

  // ── Lesson requests & confirmations ─────────────────────────
  LESSON_REQUEST_NOT_FOUND: { code: "XMC_E00XX", label: "LESSON_REQUEST_NOT_FOUND" },
  LESSON_NOT_COMPLETED: { code: "XMC_E00XX", label: "LESSON_NOT_COMPLETED" },
  INVALID_LESSON_REQUEST_STATE: { code: "XMC_E00XX", label: "INVALID_LESSON_REQUEST_STATE" },
  SLOT_ALREADY_REQUESTED: { code: "XMC_E00XX", label: "SLOT_ALREADY_REQUESTED" },
  MODE_NOT_OFFERED: { code: "XMC_E00XX", label: "MODE_NOT_OFFERED" },
  TIME_OUTSIDE_AVAILABILITY: { code: "XMC_E00XX", label: "TIME_OUTSIDE_AVAILABILITY" },

  // ── Reviews ──────────────────────────────────────────────────
  REVIEW_NOT_FOUND:              { code: "XMC_E0800", label: "REVIEW_NOT_FOUND" },
  REVIEW_ALREADY_EXISTS:         { code: "XMC_E0801", label: "REVIEW_ALREADY_EXISTS" },
  INVALID_RATING:                { code: "XMC_E0802", label: "INVALID_RATING" },
  REVIEW_FLAGGED:                { code: "XMC_E0803", label: "REVIEW_FLAGGED" },

  // ── Payments (GHS) ───────────────────────────────────────────
  PAYMENT_INSUFFICIENT_FUNDS:    { code: "XMC_E0900", label: "PAYMENT_INSUFFICIENT_FUNDS" },
  PAYMENT_DECLINED:               { code: "XMC_E0901", label: "PAYMENT_DECLINED" },
  INVALID_PAYMENT_METHOD:        { code: "XMC_E0902", label: "INVALID_PAYMENT_METHOD" },
  TRANSACTION_FAILED:            { code: "XMC_E0903", label: "TRANSACTION_FAILED" },
  REFUND_FAILED:                 { code: "XMC_E0904", label: "REFUND_FAILED" },
  INVOICE_GENERATION_FAILED:     { code: "XMC_E0905", label: "INVOICE_GENERATION_FAILED" },

  // ── Notifications / messaging ───────────────────────────────
  SMS_FAILED:                    { code: "XMC_E1000", label: "SMS_FAILED" },
  EMAIL_FAILED:                  { code: "XMC_E1001", label: "EMAIL_FAILED" },
  NOTIFICATION_FAILED:           { code: "XMC_E1002", label: "NOTIFICATION_FAILED" },
  MESSAGE_DELIVERY_FAILED:       { code: "XMC_E1003", label: "MESSAGE_DELIVERY_FAILED" },
  BROADCAST_LIMIT_REACHED:       { code: "XMC_E1004", label: "BROADCAST_LIMIT_REACHED" },

  // ── Files (verification documents, profile photos) ─────────
  FILE_OPERATION_FAILED:         { code: "XMC_E1100", label: "FILE_OPERATION_FAILED" },
  FILE_SIZE_EXCEEDED:            { code: "XMC_E1101", label: "FILE_SIZE_EXCEEDED" },
  INVALID_FILE_TYPE:             { code: "XMC_E1102", label: "INVALID_FILE_TYPE" },
  FILE_COUNT_EXCEEDED:           { code: "XMC_E1103", label: "FILE_COUNT_EXCEEDED" },

  // ── Admin ────────────────────────────────────────────────────
  ADMIN_ACTION_FAILED:            { code: "XMC_E1200", label: "ADMIN_ACTION_FAILED" },
  DISCIPLINARY_ACTION_FAILED:    { code: "XMC_E1201", label: "DISCIPLINARY_ACTION_FAILED" },

  // ── Fallback ─────────────────────────────────────────────────
  INTERNAL_SERVER_ERROR:         { code: "XMC_E9999", label: "INTERNAL_SERVER_ERROR" },
  EXTERNAL_SERVER_ERROR:          { code: "XMC_E9998", label: "EXTERNAL_SERVER_ERROR" },
  UNEXPECTED_RUNTIME_ERROR:      { code: "XMC_E9997", label: "UNEXPECTED_RUNTIME_ERROR" },
} as const;

export type ErrorCodeKey = keyof typeof ErrorCodes;