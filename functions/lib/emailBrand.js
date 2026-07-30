"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderMaintleyEmailButton = exports.renderMaintleyEmailShell = exports.EMAIL_FONT_STACK = exports.EMAIL_BRAND = void 0;
exports.EMAIL_BRAND = Object.freeze({
    primary: '#047857',
    accent: '#3FCC7C',
    hover: '#009E71',
    pressed: '#036151',
    slate: '#1F2937',
    canvas: '#FAFAF8',
    white: '#FFFFFF',
});
exports.EMAIL_FONT_STACK = "Manrope, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
const renderMaintleyEmailShell = ({ title, previewText = '', eyebrow = 'Maintley', bodyHtml, footerHtml = 'Keep your property maintenance history and records easy to find with Maintley.', }) => `
	<div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${previewText}</div>
	<div style="margin:0; padding:0; background:${exports.EMAIL_BRAND.canvas}; font-family:${exports.EMAIL_FONT_STACK}; color:${exports.EMAIL_BRAND.slate};">
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${exports.EMAIL_BRAND.canvas}; padding:32px 14px;">
			<tr><td align="center">
				<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px; width:100%; background:${exports.EMAIL_BRAND.white}; border-radius:18px; overflow:hidden; border:1px solid ${exports.EMAIL_BRAND.accent};">
					<tr><td style="background:${exports.EMAIL_BRAND.primary}; color:${exports.EMAIL_BRAND.white}; padding:28px 30px;">
						<div style="font-size:12px; line-height:1.4; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:${exports.EMAIL_BRAND.white};">${eyebrow}</div>
						<h1 style="margin:8px 0 0; font-size:30px; line-height:1.2; font-weight:800; color:${exports.EMAIL_BRAND.white};">${title}</h1>
					</td></tr>
					<tr><td style="padding:28px 30px; color:${exports.EMAIL_BRAND.slate};">${bodyHtml}</td></tr>
					<tr><td style="padding:16px 30px; border-top:1px solid ${exports.EMAIL_BRAND.accent}; font-size:12px; line-height:1.6; color:${exports.EMAIL_BRAND.slate};">${footerHtml}</td></tr>
				</table>
			</td></tr>
		</table>
	</div>
`;
exports.renderMaintleyEmailShell = renderMaintleyEmailShell;
const renderMaintleyEmailButton = (label, href) => `<a href="${href}" style="display:inline-block; background:${exports.EMAIL_BRAND.primary}; color:${exports.EMAIL_BRAND.white}; text-decoration:none; padding:12px 18px; border-radius:9px; font-size:14px; font-weight:800;">${label}</a>`;
exports.renderMaintleyEmailButton = renderMaintleyEmailButton;
