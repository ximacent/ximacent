import type { EmailMessage } from "./emailProvider";

const APP_NAME = process.env.APP_NAME || "Ximacent";

function wrap(
  bodyHtml: string,
  options?: {
    preheader?: string;
  }
): string {
  const preheader = options?.preheader || "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${APP_NAME}</title>
</head>

<body style="
  margin:0;
  padding:0;
  background-color:#0b0908;
  color:#f5efe7;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;
  -webkit-text-size-adjust:100%;
">

  <!-- Preheader -->
  <div style="
    display:none;
    max-height:0;
    overflow:hidden;
    opacity:0;
    color:transparent;
  ">
    ${preheader}
  </div>

  <table
    role="presentation"
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="background-color:#0b0908;margin:0;padding:0;"
  >
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Main container -->
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:560px;
            background-color:#14110f;
            border:1px solid #2d2722;
            border-radius:14px;
            overflow:hidden;
          "
        >

          <!-- Header -->
          <tr>
            <td style="
              padding:24px 32px;
              border-bottom:1px solid #2d2722;
              background-color:#100e0c;
            ">
              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td align="left">

                    <div style="
                      font-family:Georgia,'Times New Roman',serif;
                      font-size:22px;
                      font-weight:600;
                      letter-spacing:-0.4px;
                      color:#dca968;
                      line-height:1;
                    ">
                      <span style="
                        font-size:25px;
                        vertical-align:-1px;
                      ">𝕏</span>
                      <span style="margin-left:7px;">
                        ${APP_NAME}
                      </span>
                    </div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="
              padding:42px 36px 38px;
              background-color:#14110f;
            ">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="
              padding:24px 32px;
              border-top:1px solid #2d2722;
              background-color:#100e0c;
              text-align:center;
            ">

              <div style="
                font-family:Georgia,'Times New Roman',serif;
                font-size:16px;
                font-weight:600;
                color:#dca968;
                margin-bottom:8px;
              ">
                ${APP_NAME}
              </div>

              <div style="
                font-size:12px;
                line-height:20px;
                color:#817970;
              ">
                Vote with confidence. Celebrate the winners.
              </div>

              <div style="
                font-size:11px;
                line-height:18px;
                color:#5f5852;
                margin-top:10px;
              ">
                This is an automated message from ${APP_NAME}.
                Please do not reply directly to this email.
              </div>

            </td>
          </tr>

        </table>

        <!-- Bottom spacing / branding -->
        <div style="
          padding-top:18px;
          font-size:11px;
          color:#4f4944;
          text-align:center;
        ">
          © ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
        </div>

      </td>
    </tr>
  </table>

</body>
</html>
`;
}

function otpBlock(otp: string): string {
  return `
    <div style="
      margin:28px 0;
      padding:22px 20px;
      background-color:#1c1815;
      border:1px solid #3a3027;
      border-radius:10px;
      text-align:center;
    ">
      <div style="
        font-size:11px;
        font-weight:600;
        letter-spacing:2px;
        text-transform:uppercase;
        color:#968b80;
        margin-bottom:12px;
      ">
        Verification code
      </div>

      <div style="
        font-family:Arial,sans-serif;
        font-size:34px;
        line-height:40px;
        font-weight:700;
        letter-spacing:8px;
        color:#e2b875;
        padding-left:8px;
      ">
        ${otp}
      </div>
    </div>
  `;
}

function heading(title: string, subtitle?: string): string {
  return `
    <div style="margin-bottom:26px;">
      <h1 style="
        margin:0;
        font-family:Georgia,'Times New Roman',serif;
        font-size:28px;
        line-height:36px;
        font-weight:600;
        letter-spacing:-0.5px;
        color:#f7f1e9;
      ">
        ${title}
      </h1>

      ${
        subtitle
          ? `
            <p style="
              margin:10px 0 0;
              font-size:14px;
              line-height:23px;
              color:#9b9188;
            ">
              ${subtitle}
            </p>
          `
          : ""
      }
    </div>
  `;
}

function paragraph(text: string): string {
  return `
    <p style="
      margin:0 0 16px;
      font-size:14px;
      line-height:24px;
      color:#b8afa6;
    ">
      ${text}
    </p>
  `;
}

function strong(text: string): string {
  return `<strong style="color:#eee5da;">${text}</strong>`;
}

export function emailVerificationOTPTemplate(
  otp: string
): Omit<EmailMessage, "to"> {
  return {
    subject: `Your ${APP_NAME} verification code`,
    text: `Your verification code is ${otp}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
    html: wrap(
      `
        ${heading(
          "Verify your email",
          "Use the verification code below to complete your ${APP_NAME} account setup."
        )}

        ${paragraph("Your verification code is:")}

        ${otpBlock(otp)}

        ${paragraph(
          "This code expires in 10 minutes. For your security, never share this code with anyone."
        )}

        ${paragraph(
          "If you didn't request this code, you can safely ignore this email."
        )}
      `,
      {
        preheader: `Your ${APP_NAME} verification code is ${otp}.`,
      }
    ),
  };
}

export function emailVerifiedConfirmationTemplate(): Omit<
  EmailMessage,
  "to"
> {
  return {
    subject: `Your email has been verified`,
    text: `Your email address has been successfully verified.`,
    html: wrap(
      `
        ${heading(
          "Email verified",
          `Your ${APP_NAME} account is now ready.`
        )}

        ${paragraph(
          `Your email address has been successfully verified. Welcome to ${APP_NAME}.`
        )}

        ${paragraph(
          "You can now continue using your account and access the features available to you."
        )}
      `,
      {
        preheader: "Your email has been successfully verified.",
      }
    ),
  };
}

export function roleChangedTemplate(
  newRole: string
): Omit<EmailMessage, "to"> {
  return {
    subject: `Your account role has been updated`,
    text: `Your ${APP_NAME} account role has been changed to "${newRole}" by an administrator. If you weren't expecting this, contact support.`,
    html: wrap(
      `
        ${heading(
          "Account role updated",
          "There has been a change to your ${APP_NAME} account."
        )}

        ${paragraph(
          `Your account role has been changed to ${strong(newRole)} by an administrator.`
        )}

        ${paragraph(
          "If you weren't expecting this change, please contact support."
        )}
      `,
      {
        preheader: `Your ${APP_NAME} account role has been changed to ${newRole}.`,
      }
    ),
  };
}

export function passwordResetOTPTemplate(
  otp: string
): Omit<EmailMessage, "to"> {
  return {
    subject: `Your ${APP_NAME} password reset code`,
    text: `Your password reset code is ${otp}. It expires in 10 minutes. If you didn't request this, you can safely ignore this email — your password will not be changed.`,
    html: wrap(
      `
        ${heading(
          "Reset your password",
          "Use the code below to continue resetting your ${APP_NAME} password."
        )}

        ${otpBlock(otp)}

        ${paragraph(
          "This code expires in 10 minutes and can only be used once."
        )}

        ${paragraph(
          "If you didn't request a password reset, you can safely ignore this email. Your password will not be changed."
        )}
      `,
      {
        preheader: `Your ${APP_NAME} password reset code is ${otp}.`,
      }
    ),
  };
}

export function passwordChangedTemplate(): Omit<EmailMessage, "to"> {
  return {
    subject: `Your password was changed`,
    text: `Your ${APP_NAME} account password was just changed. If this wasn't you, contact support immediately.`,
    html: wrap(
      `
        ${heading(
          "Password changed",
          `Your ${APP_NAME} account password was recently updated.`
        )}

        ${paragraph(
          `Your ${APP_NAME} account password was just changed.`
        )}

        ${paragraph(
          "If you made this change, no further action is required."
        )}

        ${paragraph(
          `${strong(
            "If this wasn't you, contact support immediately."
          )}`
        )}
      `,
      {
        preheader: `Your ${APP_NAME} account password was changed.`,
      }
    ),
  };
}

export function phoneChangedTemplate(
  newPhone: string
): Omit<EmailMessage, "to"> {
  return {
    subject: `Your phone number was changed`,
    text: `Your ${APP_NAME} account phone number was changed to ${newPhone}. If this wasn't you, contact support immediately.`,
    html: wrap(
      `
        ${heading(
          "Phone number changed",
          `Your ${APP_NAME} account phone number was recently updated.`
        )}

        <div style="
          margin:26px 0;
          padding:20px;
          background-color:#1c1815;
          border:1px solid #3a3027;
          border-radius:10px;
        ">
          <div style="
            font-size:11px;
            font-weight:600;
            letter-spacing:1.5px;
            text-transform:uppercase;
            color:#968b80;
            margin-bottom:8px;
          ">
            New phone number
          </div>

          <div style="
            font-family:Arial,sans-serif;
            font-size:18px;
            line-height:28px;
            font-weight:600;
            color:#f0e7dc;
          ">
            ${newPhone}
          </div>
        </div>

        ${paragraph(
          "If you made this change, no further action is required."
        )}

        ${paragraph(
          `${strong(
            "If this wasn't you, contact support immediately."
          )}`
        )}
      `,
      {
        preheader: `Your ${APP_NAME} phone number was changed.`,
      }
    ),
  };
}

// Sent to the OLD email address once a change completes — the old
// address is still the stable, previously-verified channel at the moment
// this fires, same reasoning as phoneChangedTemplate going out before the
// old email could be considered stale.
export function emailChangedTemplate(
  newEmail: string
): Omit<EmailMessage, "to"> {
  return {
    subject: `Your account email was changed`,
    text: `Your ${APP_NAME} account email was changed to ${newEmail}. You'll need to use the new email to log in from now on. If this wasn't you, contact support immediately.`,
    html: wrap(
      `
        ${heading(
          "Email address changed",
          `Your ${APP_NAME} account email address was recently updated.`
        )}

        <div style="
          margin:26px 0;
          padding:20px;
          background-color:#1c1815;
          border:1px solid #3a3027;
          border-radius:10px;
        ">
          <div style="
            font-size:11px;
            font-weight:600;
            letter-spacing:1.5px;
            text-transform:uppercase;
            color:#968b80;
            margin-bottom:8px;
          ">
            New email address
          </div>

          <div style="
            font-family:Arial,sans-serif;
            font-size:17px;
            line-height:28px;
            font-weight:600;
            color:#f0e7dc;
            word-break:break-word;
          ">
            ${newEmail}
          </div>
        </div>

        ${paragraph(
          "You'll need to use this new email address to log in to your ${APP_NAME} account from now on."
        )}

        ${paragraph(
          `${strong(
            "If this wasn't you, contact support immediately."
          )}`
        )}
      `,
      {
        preheader: `Your ${APP_NAME} account email address was changed.`,
      }
    ),
  };
}

export function organizerApplicationSubmittedTemplate(): Omit<
  EmailMessage,
  "to"
> {
  return {
    subject: `Your organizer application has been submitted`,
    text: `We've received your organizer application. Our team will review it and get back to you shortly.`,
    html: wrap(
      `
        ${heading(
          "Application received",
          "We've received your organizer application."
        )}

        ${paragraph(
          `Thanks for applying to become an organizer on ${APP_NAME}.`
        )}

        ${paragraph(
          "Our team will review your application and get back to you shortly."
        )}
      `,
      {
        preheader: "Your organizer application has been received.",
      }
    ),
  };
}

export function organizerApprovedTemplate(): Omit<EmailMessage, "to"> {
  return {
    subject: `Your organizer application has been approved`,
    text: `Congratulations! Your organizer application has been approved. You can now create elections.`,
    html: wrap(
      `
        ${heading(
          "You're approved",
          "Congratulations! Your organizer application has been approved."
        )}

        ${paragraph(
          `Your organizer application has been approved. You can now create and manage elections on ${APP_NAME}.`
        )}

        ${paragraph(
          "Sign in to your organizer dashboard to get started."
        )}
      `,
      {
        preheader: "Your organizer application has been approved.",
      }
    ),
  };
}

export function organizerRejectedTemplate(
  reason: string
): Omit<EmailMessage, "to"> {
  return {
    subject: `Your organizer application needs changes`,
    text: `Your organizer application was not approved. Reason: ${reason}. You can update your information and resubmit.`,
    html: wrap(
      `
        ${heading(
          "Application needs changes",
          "Your organizer application was not approved at this time."
        )}

        ${paragraph(
          "Our team reviewed your application and found that some information needs to be updated."
        )}

        <div style="
          margin:24px 0;
          padding:18px 20px;
          background-color:#1c1815;
          border-left:3px solid #dca968;
          border-radius:6px;
        ">
          <div style="
            font-size:11px;
            font-weight:600;
            letter-spacing:1.5px;
            text-transform:uppercase;
            color:#968b80;
            margin-bottom:8px;
          ">
            Reason
          </div>

          <div style="
            font-size:14px;
            line-height:23px;
            color:#d0c6bc;
          ">
            ${reason}
          </div>
        </div>

        ${paragraph(
          "You can update your information and resubmit your application."
        )}
      `,
      {
        preheader: "Your organizer application needs changes.",
      }
    ),
  };
}

export function organizerSuspendedTemplate(): Omit<EmailMessage, "to"> {
  return {
    subject: `Your organizer account has been suspended`,
    text: `Your organizer account has been suspended. You will not be able to create or manage elections until this is resolved. Contact support for details.`,
    html: wrap(
      `
        ${heading(
          "Organizer account suspended",
          "There has been a change to your organizer account."
        )}

        ${paragraph(
          "Your organizer account has been suspended."
        )}

        ${paragraph(
          "You will not be able to create or manage elections until this issue is resolved."
        )}

        ${paragraph(
          "Please contact support for more information."
        )}
      `,
      {
        preheader: "Your organizer account has been suspended.",
      }
    ),
  };
}

export function lowSmsCreditTemplate(
  creditLeft: number
): Omit<EmailMessage, "to"> {
  return {
    subject: `⚠️ SMS credit running low (${creditLeft} left)`,
    text: `The mNotify SMS account has only ${creditLeft} credits remaining. Phone verification OTPs will stop sending once credits run out. Please top up soon.`,
    html: wrap(
      `
        ${heading(
          "SMS credits running low",
          "Action may be required to keep phone verification working."
        )}

        <div style="
          margin:26px 0;
          padding:22px;
          background-color:#1c1815;
          border:1px solid #3a3027;
          border-radius:10px;
          text-align:center;
        ">
          <div style="
            font-family:Georgia,'Times New Roman',serif;
            font-size:38px;
            line-height:44px;
            font-weight:600;
            color:#dca968;
          ">
            ${creditLeft}
          </div>

          <div style="
            margin-top:5px;
            font-size:11px;
            text-transform:uppercase;
            letter-spacing:1.5px;
            color:#968b80;
          ">
            Credits remaining
          </div>
        </div>

        ${paragraph(
          "The mNotify SMS account has limited credits remaining."
        )}

        ${paragraph(
          "Phone verification OTPs will stop sending once the credits run out. Please top up soon."
        )}
      `,
      {
        preheader: `SMS account has only ${creditLeft} credits remaining.`,
      }
    ),
  };
}

export function electionSubmittedTemplate(
  electionTitle: string
): Omit<EmailMessage, "to"> {
  return {
    subject: `"${electionTitle}" submitted for review`,
    text: `Your election "${electionTitle}" has been submitted for admin review.`,
    html: wrap(
      `
        ${heading(
          "Election submitted",
          "Your election has been sent to the ${APP_NAME} admin team for review."
        )}

        <div style="
          margin:26px 0;
          padding:20px;
          background-color:#1c1815;
          border:1px solid #3a3027;
          border-radius:10px;
        ">
          <div style="
            font-size:11px;
            font-weight:600;
            letter-spacing:1.5px;
            text-transform:uppercase;
            color:#968b80;
            margin-bottom:8px;
          ">
            Election
          </div>

          <div style="
            font-family:Georgia,'Times New Roman',serif;
            font-size:20px;
            line-height:28px;
            color:#f0e7dc;
          ">
            ${electionTitle}
          </div>
        </div>

        ${paragraph(
          "Your election has been submitted for admin review. You'll receive another email when its status is updated."
        )}
      `,
      {
        preheader: `"${electionTitle}" has been submitted for review.`,
      }
    ),
  };
}

export function electionApprovedTemplate(
  electionTitle: string
): Omit<EmailMessage, "to"> {
  return {
    subject: `"${electionTitle}" has been approved`,
    text: `Your election "${electionTitle}" has been approved and is ready to launch.`,
    html: wrap(
      `
        ${heading(
          "Election approved",
          "Your election has been approved and is ready for the next step."
        )}

        <div style="
          margin:26px 0;
          padding:20px;
          background-color:#1c1815;
          border:1px solid #3a3027;
          border-radius:10px;
        ">
          <div style="
            font-size:11px;
            font-weight:600;
            letter-spacing:1.5px;
            text-transform:uppercase;
            color:#968b80;
            margin-bottom:8px;
          ">
            Election
          </div>

          <div style="
            font-family:Georgia,'Times New Roman',serif;
            font-size:20px;
            line-height:28px;
            color:#f0e7dc;
          ">
            ${electionTitle}
          </div>
        </div>

        ${paragraph(
          "Your election has been approved and is ready to launch."
        )}
      `,
      {
        preheader: `"${electionTitle}" has been approved.`,
      }
    ),
  };
}

export function electionRejectedTemplate(
  electionTitle: string,
  reason: string
): Omit<EmailMessage, "to"> {
  return {
    subject: `"${electionTitle}" needs changes`,
    text: `Your election "${electionTitle}" was not approved. Reason: ${reason}.`,
    html: wrap(
      `
        ${heading(
          "Election needs changes",
          "Your election was not approved at this time."
        )}

        <div style="
          margin:26px 0 20px;
          padding:20px;
          background-color:#1c1815;
          border:1px solid #3a3027;
          border-radius:10px;
        ">
          <div style="
            font-size:11px;
            font-weight:600;
            letter-spacing:1.5px;
            text-transform:uppercase;
            color:#968b80;
            margin-bottom:8px;
          ">
            Election
          </div>

          <div style="
            font-family:Georgia,'Times New Roman',serif;
            font-size:20px;
            line-height:28px;
            color:#f0e7dc;
          ">
            ${electionTitle}
          </div>
        </div>

        <div style="
          margin:20px 0;
          padding:18px 20px;
          background-color:#1c1815;
          border-left:3px solid #dca968;
          border-radius:6px;
        ">
          <div style="
            font-size:11px;
            font-weight:600;
            letter-spacing:1.5px;
            text-transform:uppercase;
            color:#968b80;
            margin-bottom:8px;
          ">
            Reason
          </div>

          <div style="
            font-size:14px;
            line-height:23px;
            color:#d0c6bc;
          ">
            ${reason}
          </div>
        </div>

        ${paragraph(
          "Please review the reason above, make the necessary changes, and resubmit your election for review."
        )}
      `,
      {
        preheader: `"${electionTitle}" needs changes before approval.`,
      }
    ),
  };
}