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
const uuid = require('uuid');
const configNode = require('../nodes/persistent-values-config.js');

describe('persistent values config backend node', function() {
  beforeEach(function() {
    // Nothing to be done
  });
  afterEach(function() {
    helper.unload();
  });

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

  const httpPathGenerateUUID = '/persistentvalues/config/generate_uuid';

  // ==== Tests =======================================================================================================

  // ==== Generated UUID ======================================================

  it(`should generate a new UUID`, function(done) {
    helper.load([configNode], TestFlow, function() {
      helper.request()
        .get(httpPathGenerateUUID)
        .expect(function(res) {
          const respUuid = res._body;
          uuid.validate(respUuid).should.be.true;
        })
        .expect(200)
        .end(done);
    });
  });
});
