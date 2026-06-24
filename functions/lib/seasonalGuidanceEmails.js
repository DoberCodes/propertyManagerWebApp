"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSeasonalGuidanceEmailTest = exports.sendSeasonalGuidanceEmails = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const params_1 = require("firebase-functions/params");
const emailService_1 = require("./emailService");
const RESEND_API_KEY = (0, params_1.defineSecret)(process.env.RESEND_API_KEY_SECRET_NAME || 'RESEND_API_KEY');
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const SEASON_BY_MONTH = {
    2: 'spring',
    5: 'summer',
    8: 'fall',
    11: 'winter',
};
const SEASONAL_TIPS = {
    spring: [
        {
            title: 'Check gutters and drainage',
            body: 'Spring rain can make it easier to notice clogged gutters, grading concerns, or downspout issues worth documenting.',
        },
        {
            title: 'Review exterior seals',
            body: 'Caulk, weatherstripping, and exterior penetrations are useful places to review as the weather changes.',
        },
        {
            title: 'Plan cooling-season service',
            body: 'Many homeowners review HVAC filters and outdoor condenser clearance before warmer weather settles in.',
        },
    ],
    summer: [
        {
            title: 'Watch cooling system performance',
            body: 'Longer run times, weak airflow, or unusual sounds can be useful details to record during warmer months.',
        },
        {
            title: 'Inspect irrigation and hose bibs',
            body: 'Outdoor water use tends to rise in summer, making leaks and damaged fittings easier to notice.',
        },
        {
            title: 'Check dryer and exhaust vents',
            body: 'Exterior vent covers and lint buildup are easy to miss, but they are helpful seasonal review items.',
        },
    ],
    fall: [
        {
            title: 'Prepare for heating season',
            body: 'Fall is a good time to review furnace filters, registers, fireplaces, and any heating-related service notes.',
        },
        {
            title: 'Clean leaves from water paths',
            body: 'Gutters, roof valleys, drains, and window wells can collect debris before colder weather arrives.',
        },
        {
            title: 'Review exterior shutoffs',
            body: 'Hose bibs, irrigation shutoffs, and exposed plumbing are worth checking before freezing temperatures.',
        },
    ],
    winter: [
        {
            title: 'Monitor plumbing risk areas',
            body: 'Basements, crawlspaces, garages, and exterior walls can be useful places to watch during cold snaps.',
        },
        {
            title: 'Check safety devices',
            body: 'Smoke alarms, carbon monoxide alarms, and fire extinguishers are simple winter review items.',
        },
        {
            title: 'Document cold-weather issues',
            body: 'Drafts, condensation, ice buildup, and uneven heating are easier to track while conditions are active.',
        },
    ],
};
const getDisplayName = (user) => {
    const name = (user.firstName || user.displayName || '').trim();
    return name || 'there';
};
const getSeasonForDate = (date) => SEASON_BY_MONTH[date.getMonth()] || 'spring';
const getSeasonLabel = (season) => season.charAt(0).toUpperCase() + season.slice(1);
const getSeasonalGuidanceHtml = ({ name, season, appUrl, }) => {
    const seasonLabel = getSeasonLabel(season);
    const tipMarkup = SEASONAL_TIPS[season]
        .map((tip) => `
				<tr>
					<td style="padding:0 0 14px 0;">
						<div style="border:1px solid #dbe7dc; border-radius:16px; padding:18px; background:#ffffff;">
							<p style="margin:0 0 8px 0; font-size:16px; font-weight:900; color:#10251a;">${(0, emailService_1.escapeHtml)(tip.title)}</p>
							<p style="margin:0; font-size:14px; line-height:1.65; color:#405348;">${(0, emailService_1.escapeHtml)(tip.body)}</p>
						</div>
					</td>
				</tr>
			`)
        .join('');
    return `
		<div style="margin:0; padding:0; background:#edf7ef; font-family:Arial,sans-serif; color:#10251a;">
			<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf7ef; padding:34px 14px;">
				<tr><td align="center">
					<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px; width:100%; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #cfe8d4; box-shadow:0 10px 30px rgba(16,37,26,0.08);">
						<tr>
							<td style="background:#0f766e; color:#ffffff; padding:30px 32px;">
								<div style="font-size:13px; text-transform:uppercase; letter-spacing:0.08em; font-weight:800;">Maintley</div>
								<h1 style="margin:10px 0 0 0; font-size:28px; line-height:1.2;">${seasonLabel} Property Care Notes</h1>
								<p style="margin:10px 0 0 0; font-size:15px; line-height:1.6; color:#eaf8ee;">A few timely prompts to help you keep your property records current.</p>
							</td>
						</tr>
						<tr><td style="padding:32px;">
							<p style="margin:0 0 22px 0; font-size:16px; line-height:1.65; color:#33443a;">Hi ${(0, emailService_1.escapeHtml)(name)}, as ${seasonLabel.toLowerCase()} begins, here are a few common property areas homeowners often choose to review or document in Maintley.</p>
							<div style="font-size:12px; text-transform:uppercase; letter-spacing:0.08em; font-weight:900; color:#0f766e; margin-bottom:12px;">Seasonal prompts</div>
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
								${tipMarkup}
							</table>
							<p style="margin:0 0 22px 0; font-size:13px; line-height:1.65; color:#667085;">These are general record prompts. Property needs vary by age, equipment, location, usage, and manufacturer guidance.</p>
							<a href="${(0, emailService_1.escapeHtml)(appUrl)}" style="display:inline-block; background:#16a34a; color:#ffffff; text-decoration:none; padding:13px 20px; border-radius:12px; font-size:14px; font-weight:900;">Open Maintley</a>
						</td></tr>
						<tr><td style="padding:18px 32px; border-top:1px solid #e5efe7; font-size:12px; line-height:1.6; color:#667085;">Seasonal notes are general prompts, not professional maintenance advice. You can update email preferences anytime in Settings.</td></tr>
					</table>
				</td></tr>
			</table>
		</div>
	`;
};
const sendSeasonalGuidanceForUser = async (userId, season, appUrl) => {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
        return { sent: false, skipped: true, reason: 'user_not_found' };
    }
    const user = userDoc.data();
    if (user.isTeamMemberAccount) {
        return { sent: false, skipped: true, reason: 'team_member_account' };
    }
    const email = String(user.email || '').trim();
    if (!email) {
        return { sent: false, skipped: true, reason: 'missing_email' };
    }
    const resendApiKey = RESEND_API_KEY.value();
    const resend = (0, emailService_1.getResendClient)(resendApiKey);
    if (!resend) {
        throw new Error('Resend client is not configured');
    }
    await (0, emailService_1.sendMaintleyEmail)(resend, {
        to: email,
        subject: `${getSeasonLabel(season)} Property Care Notes from Maintley`,
        html: getSeasonalGuidanceHtml({
            name: getDisplayName(user),
            season,
            appUrl,
        }),
    });
    return { sent: true, skipped: false };
};
exports.sendSeasonalGuidanceEmails = functions
    .runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 540, memory: '256MB' })
    .pubsub.schedule('0 10 1 3,6,9,12 *')
    .timeZone('America/New_York')
    .onRun(async () => {
    const logger = functions.logger;
    const appUrl = process.env.APP_URL || 'https://maintleyapp.com';
    const season = getSeasonForDate(new Date());
    const usersSnapshot = await db
        .collection('users')
        .where('emailPreferences.seasonalGuidance', '==', true)
        .get();
    let sent = 0;
    let skipped = 0;
    let failed = 0;
    for (const userDoc of usersSnapshot.docs) {
        try {
            const result = await sendSeasonalGuidanceForUser(userDoc.id, season, appUrl);
            if (result.sent) {
                sent++;
            }
            else {
                skipped++;
            }
        }
        catch (error) {
            failed++;
            logger.error('Seasonal guidance email failed', {
                userId: userDoc.id,
                season,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    logger.info('Seasonal guidance run complete', {
        season,
        totalCandidates: usersSnapshot.size,
        sent,
        skipped,
        failed,
    });
    return null;
});
exports.sendSeasonalGuidanceEmailTest = functions
    .runWith({ secrets: ['RESEND_API_KEY'], timeoutSeconds: 120, memory: '256MB' })
    .https.onCall(async (_data, context) => {
    var _a;
    if (!((_a = context.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be signed in to send a test seasonal guidance email.');
    }
    const appUrl = process.env.APP_URL || 'https://maintleyapp.com';
    const season = getSeasonForDate(new Date());
    try {
        const result = await sendSeasonalGuidanceForUser(context.auth.uid, season, appUrl);
        if (result.skipped) {
            throw new functions.https.HttpsError('failed-precondition', `Test seasonal guidance email was skipped: ${result.reason || 'unknown_reason'}`);
        }
        return {
            success: true,
            message: 'Test seasonal guidance email sent.',
        };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', error instanceof Error
            ? error.message
            : 'Failed to send test seasonal guidance email.');
    }
});
