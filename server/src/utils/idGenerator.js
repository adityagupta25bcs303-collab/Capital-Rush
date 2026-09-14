const crypto = require('crypto');

const generateTransactionId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TXN-${timestamp}-${randomStr}`;
};

const generateTransferId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `TRF-${timestamp}-${randomStr}`;
};

const formatTeamId = (number) => {
  return `CR-${String(number).padStart(3, '0')}`;
};

module.exports = {
  generateTransactionId,
  generateTransferId,
  formatTeamId
};
