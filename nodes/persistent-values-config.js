
// Global list of config nodes. Required for immediate drop-down population in values node.
const configs = {};

module.exports = function(RED) {
  const {v1: uuidv1} = require('uuid');

  // ---- Node main -------------------------------------------------------------------------------
  function PersistentValuesConfigNode(config) {
    RED.nodes.createNode(this, config);

    this.name = config.name;
    this.values = config.values;

    // Store config in global configs object for HTTP query API.
    configs[this.id] = {name: config.name, values: config.values};
  }
  RED.nodes.registerType('persistent values config', PersistentValuesConfigNode);

  // https://stackoverflow.com/questions/37265230/node-red-get-configuration-node-value-in-admin-ui

  // HTTP API to get a config
  RED.httpAdmin.get('/persistentvalues/config/get', function(req, res) {
    if (req.query.hasOwnProperty('id')) {
      const id = req.query.id;
      if (configs.hasOwnProperty(id)) {
        res.json(configs[id]);
      } else {
        res.sendStatus(404); // not found
      }
    } else {
      // Return all available configs if no ID is passed.
      res.json(configs);
    }
  });

  // HTTP API to save or update a config
  RED.httpAdmin.post('/persistentvalues/config/save', function(req, res) {
    const id = req.body.id;
    const config = {name: req.body.name, values: req.body.values};

    configs[id] = config;
    res.sendStatus(200);
  });

  // HTTP API to delete an existing config
  RED.httpAdmin.post('/persistentvalues/config/delete', function(req, res) {
    const id = req.body.id;
    if (configs.hasOwnProperty(id)) {
      delete configs[id];
      res.sendStatus(200);
    } else {
      res.sendStatus(404); // not found
    }
  });

  // HTTP API to generate a new UUID
  RED.httpAdmin.get('/persistentvalues/config/generate_uuid', function(req, res) {
    res.json(uuidv1());
  });
};
