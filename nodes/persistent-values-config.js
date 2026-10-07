module.exports = function(RED) {
  const uuid = require('uuid');

  // ---- Node main -------------------------------------------------------------------------------
  RED.nodes.registerType('persistent values config', function(config) {
    // eslint-disable-next-line no-invalid-this
    const node = this;
    RED.nodes.createNode(node, config);

    node.name = config.name;
    node.values = config.values;
  });

  // HTTP API to generate a new UUID
  RED.httpAdmin.get('/persistentvalues/config/generate_uuid', function(req, res) {
    res.json(uuid.v1());
  });
};
