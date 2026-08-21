// Barrel file: every send*Email function used elsewhere in the app is
// imported from "@/lib/emails" (this file), not from the individual
// template files directly. Add new templates here when you add them.
export { sendEventJoinedEmail, sendPaymentReceiptEmail, sendUpcomingEventEmail, sendEventCancelledEmail, sendEventPostponedEmail, sendRemovedFromEventEmail } from "./event/player";
export { sendNewParticipantEmail, sendEventFullEmail } from "./event/organizer";
export { sendTeamJoinedEmail } from "./team/player";
export { sendWelcomeEmail, sendRoleChangedEmail } from "./account";
export { sendTournamentMemberInviteEmail, sendJoinRequestNotificationEmail, sendTournamentTeamPaymentReceiptEmail, sendTournamentTeamRegisteredEmail } from "./tournament";
export { sendOrganizationInviteEmail } from "./organization";
