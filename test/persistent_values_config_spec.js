// --------------------------------------------------------------------------------------------------------------------
// Tests for node 'persistent values config'
// --------------------------------------------------------------------------------------------------------------------
// Setup Infrastructure:
//   npm install --save-dev
//   npm install ~/.node-red --no-save
// Run tests
//   npm run test
// More docu:
//   - https://www.npmjs.com/package/node-red-node-test-helper
//   - https://sinonjs.org/releases/latest/assertions/
//   - https://www.npmjs.com/package/supertest
// --------------------------------------------------------------------------------------------------------------------
const helper = require('node-red-node-test-helper');
const configNode = require('../nodes/persistent-values-config.js');

describe('persistent values config backen node', function() {
  beforeEach(function() {
    // Nothing to be done
  });
  afterEach(function() {
    helper.unload();
  });

  // ==== Utilities ===================================================================================================
  function matchConfigNode(left, right) {
    left.name.should.match(right.name);
    left.values.should.match(right.values);
  }

  // ==== Constants =====
  const DataTypeBool = 'bool';
  const DataTypeNumber = 'num';
  const DataTypeString = 'str';

  const ScopeGlobal = 'global';
  const ScopeFlow = 'flow';

  const StorageDefault = 'default';
  const StorageMemory = 'memory';
  const StorageFile = 'file';

  const NodeTypePersistentValuesConfig = 'persistent values config';


  // ==== Flow defaults ===============================================================================================

  const ConfigValueBoolean = 'boolean';
  const ConfigValueNumber = 'number';
  const ConfigValueString = 'string';

  const NodeIdConfig1 = 'config1';
  const NodeIdConfig2 = 'config2';

  const ConfigNode1 = {
    id: NodeIdConfig1,
    type: NodeTypePersistentValuesConfig,
    name: 'TestConfig1',
    values: [
      {
        name: ConfigValueBoolean,
        datatype: DataTypeBool,
        default: true,
        scope: ScopeGlobal,
        storage: StorageDefault,
      },
      {
        name: ConfigValueNumber,
        datatype: DataTypeNumber,
        default: 23,
        scope: ScopeGlobal,
        storage: StorageMemory,
      },
      {
        name: ConfigValueString,
        datatype: DataTypeString,
        default: 'my string default value',
        scope: ScopeGlobal,
        storage: StorageFile,
      },
    ],
  };

  const ConfigNode2 = {
    id: NodeIdConfig2,
    type: NodeTypePersistentValuesConfig,
    name: 'TestConfig2',
    values: [
      {
        name: ConfigValueBoolean,
        datatype: DataTypeBool,
        default: true,
        scope: ScopeFlow,
        storage: StorageFile,
      },
    ],
  };

  const FlowIdTestFlow = 'test_flow';
  const TestFlow = [
    ConfigNode1,
    ConfigNode2,
    {id: FlowIdTestFlow, type: 'tab', label: 'Test flow'},
  ];

  const httpPathConfigGet = '/persistentvalues/config/get';
  const httpPathConfigSave = '/persistentvalues/config/save';
  const httpPathConfigDelete = '/persistentvalues/config/delete';


  // ==== Tests =======================================================================================================

  // ==== Get =================================================================

  it(`should return all configurations if no query ID is passed`, function(done) {
    helper.load([configNode], TestFlow, function() {
      helper.request()
        .get(httpPathConfigGet)
        .expect(function(res) {
          const respConfig1 = res._body[NodeIdConfig1];
          matchConfigNode(respConfig1, ConfigNode1);

          const respConfig2 = res._body[NodeIdConfig2];
          matchConfigNode(respConfig2, ConfigNode2);
        })
        .expect(200)
        .end(done);
    });
  });

  it(`should return a specific configuration if query ID is passed`, function(done) {
    helper.load([configNode], TestFlow, function() {
      helper.request()
        .get(httpPathConfigGet)
        .query({id: NodeIdConfig1})
        .expect(function(res) {
          const respConfig1 = res._body;
          matchConfigNode(respConfig1, ConfigNode1);
        })
        .end(function(err, res) {
          if (err) return done(err);
        });

      helper.request()
        .get(httpPathConfigGet)
        .query({id: NodeIdConfig2})
        .expect(function(res) {
          const respConfig2 = res._body;
          matchConfigNode(respConfig2, ConfigNode2);
        })
        .end(function(err, res) {
          if (err) return done(err);
        });

      done();
    });
  });

  it(`should return a 'not found' error if an unknown configuration is queried`, function(done) {
    helper.load([configNode], TestFlow, function() {
      helper.request()
        .get(httpPathConfigGet)
        .query({id: 'unknown config ID'})
        .expect(404)
        .end(done);
    });
  });

  // ==== Save ================================================================

  it(`should save a new configuration`, function(done) {
    helper.load([configNode], TestFlow, function() {
      const newConfig = {
        id: 'new node ID',
        name: 'new config',
        values: [{
          name: 'new value',
          datatype: DataTypeNumber,
          default: 2305,
          scope: ScopeFlow,
          storage: StorageMemory,
        }]};

      // Save a new configuration
      helper.request()
        .post(httpPathConfigSave)
        .send(newConfig)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
        });

      // Query the just saved configuration
      helper.request()
        .get(httpPathConfigGet)
        .query({id: newConfig.id})
        .expect(function(res) {
          const respNewConfig = res._body;
          matchConfigNode(respNewConfig, newConfig);
        })
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
        });

      done();
    });
  });

  it(`should update an existing configuration`, function(done) {
    helper.load([configNode], TestFlow, function() {
      const modifiedConfig = structuredClone(ConfigNode1);
      modifiedConfig.name = 'modified name';
      modifiedConfig.values.pop();

      // Save a new configuration
      helper.request()
        .post(httpPathConfigSave)
        .send(modifiedConfig)
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
        });

      // Query the just saved configuration
      helper.request()
        .get(httpPathConfigGet)
        .query({id: modifiedConfig.id})
        .expect(function(res) {
          const respConfig = res._body;
          matchConfigNode(respConfig, modifiedConfig);
        })
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
        });

      done();
    });
  });

  // ==== Delete ==============================================================

  it(`should delete an existing configuration`, function(done) {
    helper.load([configNode], TestFlow, function() {
      // Delete an existing configuration
      helper.request()
        .post(httpPathConfigDelete)
        .send({id: ConfigNode1.id})
        .expect(200)
        .end(function(err, res) {
          if (err) return done(err);
        });

      // Query the just deleted configuration
      helper.request()
        .get(httpPathConfigGet)
        .query({id: ConfigNode1.id})
        .expect(404)
        .end(function(err, res) {
          if (err) return done(err);
        });

      done();
    });
  });

  it(`should not delete an not existing configuration`, function(done) {
    helper.load([configNode], TestFlow, function() {
      helper.request()
        .post(httpPathConfigDelete)
        .send({id: 'unknown config ID'})
        .expect(404)
        .end(done);
    });
  });
});
