export const SuccessCodes = {
  RECORD_FETCHED: { code: "XMC_S2000", message: "Operation done successfully", },
  RECORD_CREATED: { code: "XMC_S2001", message: "Operation done successfully", },
  RECORD_UPDATED: { code: "XMC_S2002", message: "Operation done successfully", },
  RECORD_DELETED: { code: "XMC_S2003", message: "Operation done successfully", },
} as const;

export type SuccessCode =
  (typeof SuccessCodes)[keyof typeof SuccessCodes];