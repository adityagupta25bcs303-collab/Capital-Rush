const QRCode = require('qrcode');

/**
 * Generates a clean base64 Data URL QR Code containing ONLY the teamId (e.g. "CR-001")
 * Strict requirement: NO passwords, NO balances, NO emails in QR!
 */
const generateTeamQRCode = async (teamId) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(teamId, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      width: 400
    });
    return qrDataUrl;
  } catch (err) {
    console.error(`Error generating QR code for team ${teamId}:`, err);
    return null;
  }
};

module.exports = { generateTeamQRCode };
