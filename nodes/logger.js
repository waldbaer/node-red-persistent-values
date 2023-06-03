
const LoggerNodeName = `Persistent Values`;

function logWarning(node, message) {
  node.warn(`[${LoggerNodeName}] ${message}`);
}

function logError(node, message) {
  node.error(`[${LoggerNodeName}] ${message}`);
}

module.exports = {
  logWarning,
  logError,
};
