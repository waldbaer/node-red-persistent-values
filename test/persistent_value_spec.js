// --------------------------------------------------------------------------------------------------------------------
// Tests for node 'persistent value'
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
const nodejsAssert = require('assert');

const valueNode = require('../nodes/persistent-value.js');
const configNode = require('../nodes/persistent-values-config.js');

describe('persistent value node', function() {
  beforeEach(function() {
    // Update context storage settings
    helper.settings({
      contextStorage: {
        default: 'memory',
        memory: {module: 'memory'},
        file: {module: 'localfilesystem'},
      },
    });
  });
  afterEach(function() {
    helper.unload();
  });

  // ==== Utilities ===================================================================================================
  function buildContextKeyName(node, valueName = undefined) {
    if (valueName === undefined) {
      valueName = node.valueName; // Use configured value if not explicitely set
    }
    return node.configName + '_' + valueName;
  }

  function getContext(node) {
    let context = undefined;

    switch (node.valueConfig.scope) {
    case 'node':
      context = node.context();
      break;
    case 'flow':
      context = node.context().flow;
      break;
    case 'global':
      context = node.context().global;
      break;
    default:
      context = undefined;
    }

    return context;
  }

  function getContextValue(node, storage = undefined, valueName = undefined) {
    const contextKeyName = buildContextKeyName(node, valueName);

    if (storage !== undefined) {
      return getContext(node).get(contextKeyName, storage);
    } else {
      return getContext(node).get(contextKeyName);
    }
  }

  function setContextValue(node, value, storage = undefined, valueName = undefined) {
    const contextKeyName = buildContextKeyName(node, valueName);

    if (storage !== undefined) {
      getContext(node).set(contextKeyName, value, storage);
    } else {
      getContext(node).set(contextKeyName, value);
    }
  }

  // ==== Constants =====
  const InputFunction = 'input';
  const PropertyPayload = 'payload';

  const AnyInputString = 'any input string';

  const DataTypeBool = 'bool';
  const DataTypeNumber = 'num';
  const DataTypeString = 'str';
  const DataTypeJson = 'json';

  const ScopeGlobal = 'global';
  const ScopeFlow = 'flow';
  const ScopeNode = 'node';

  const StorageDefault = 'default';
  const StorageMemory = 'memory';
  const StorageFile = 'file';

  const CommandRead = 'read';
  const CommandWrite = 'write';

  const BlockIfRuleEqual = 'eq';
  const BlockIfRuleNotEqual = 'neq';

  const NodeTypePersistentValue = 'persistent value';
  const NodeTypePersistentValuesConfig = 'persistent values config';
  const NodeTypeHelper = 'helper';


  // ==== Flow defaults ===============================================================================================
  const FlowIdTestFlow = 'test_flow';

  const NodeIdConfig = 'config';
  const NodeIdPersistentValue = 'pv';
  const NodeIdHelperCurrentValue = 'helper_current_value';
  const NodeIdHelperOnChange = 'helper_onchange';

  const ConfigValueIdBoolean = 'c956bfe0-a591-11ed-b2b6-471886667bd8';
  const ConfigValueBoolean = 'boolean';

  const ConfigValueIdNumber = 'cb644320-a591-11ed-b2b6-471886667bd8';
  const ConfigValueNumber = 'number';

  const ConfigValueIdString = 'cc9c4df0-a591-11ed-b2b6-471886667bd8';
  const ConfigValueString = 'string';

  const ConfigValueIdJson = 'ae9c4df0-a591-11ed-b2b6-471886667bd8';
  const ConfigValueJson = 'json';

  const NodeHelperCurrentValue = {id: NodeIdHelperCurrentValue, z: FlowIdTestFlow, type: NodeTypeHelper};
  const NodeHelperOnChange = {id: NodeIdHelperOnChange, z: FlowIdTestFlow, type: NodeTypeHelper};

  const ConfigNodeAllVariants = {
    id: NodeIdConfig,
    type: NodeTypePersistentValuesConfig,
    name: 'TestConfig',
    values: [
      {
        id: ConfigValueIdBoolean,
        name: ConfigValueBoolean,
        datatype: DataTypeBool,
        default: true,
        scope: ScopeGlobal,
        storage: StorageDefault,
        description: 'boolean value, default true, scope global, storage default',
      },
      {
        id: ConfigValueIdNumber,
        name: ConfigValueNumber,
        datatype: DataTypeNumber,
        default: 23,
        scope: ScopeGlobal,
        storage: StorageDefault,
        description: 'number value, default 23, scope global, storage default',
      },
      {
        id: ConfigValueIdString,
        name: ConfigValueString,
        datatype: DataTypeString,
        default: 'my string default value',
        scope: ScopeGlobal,
        storage: StorageDefault,

      },
      {
        id: ConfigValueIdJson,
        name: ConfigValueJson,
        datatype: DataTypeJson,
        default: `{"boolean":false, "number":0, "string":"empty"}`,
        scope: ScopeGlobal,
        storage: StorageDefault,
      },
    ],
  };

  const PersistentValueNodeDefault = {
    id: NodeIdPersistentValue,
    z: FlowIdTestFlow,
    name: 'persistent value node test',
    type: NodeTypePersistentValue,
    valuesConfig: NodeIdConfig,
    valueId: ConfigValueIdBoolean,
    value: ConfigValueBoolean,
    command: CommandRead,
    wires: [[NodeIdHelperCurrentValue], [NodeIdHelperOnChange]],
  };

  const FlowNodeAllVariants = [
    PersistentValueNodeDefault,
    ConfigNodeAllVariants,
    NodeHelperCurrentValue,
    NodeHelperOnChange,
    {id: FlowIdTestFlow, type: 'tab', label: 'Test flow'},
  ];

  // ==== Tests =======================================================================================================

  // ==== Load Tests ==========================================================

  it('should be loaded with reference to configuration', function(done) {
    helper.load([configNode, valueNode], FlowNodeAllVariants, function() {
      const config = helper.getNode(NodeIdConfig);
      const pv = helper.getNode(NodeIdPersistentValue);
      config.should.have.property('name', 'TestConfig');
      pv.should.have.property('name', 'persistent value node test');
      pv.should.have.property('configName', 'TestConfig');
      done();
    });
  });

  it('should be loaded with deprecated missing reference to configuration', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    delete flow[0].valueId;

    helper.load([configNode, valueNode], flow, function() {
      const config = helper.getNode(NodeIdConfig);
      const pv = helper.getNode(NodeIdPersistentValue);
      config.should.have.property('name', 'TestConfig');
      pv.should.have.property('name', 'persistent value node test');
      pv.should.have.property('configName', 'TestConfig');
      done();
    });
  });

  it('should be not loaded without configuration', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valuesConfig = ''; // No persistent value configuration selected

    helper.load([configNode, valueNode], flow, function() {
      const pv = helper.getNode(NodeIdPersistentValue);
      pv.should.have.property('_inputCallback', null);
      pv.should.have.property('_inputCallbacks', null);
      pv.error.should.be.calledWithMatch('Incorrect or inconsistent configuration');
      done();
    });
  });

  it('should be not loaded with an invalid selected value UUID', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = 'NOT~AN~UUID'; // No persistent value configuration selected

    helper.load([configNode, valueNode], flow, function() {
      const pv = helper.getNode(NodeIdPersistentValue);
      pv.should.have.property('_inputCallback', null);
      pv.should.have.property('_inputCallbacks', null);
      pv.error.should.be.calledWithMatch('Incorrect or inconsistent configuration');
      done();
    });
  });

  it('should be not loaded without selected value UUID and without selected value name', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    delete flow[0].valueId; // No value selected by ID
    delete flow[0].value; // No value selected by name

    helper.load([configNode, valueNode], flow, function() {
      const pv = helper.getNode(NodeIdPersistentValue);
      pv.should.have.property('_inputCallback', null);
      pv.should.have.property('_inputCallbacks', null);
      pv.error.should.be.calledWithMatch('Incorrect or inconsistent configuration');
      done();
    });
  });

  // ==== Node Status =========================================================
  it('should show status without default storage if no default context is configured', function(done) {
    // Remove any context storage setting.
    helper.settings({
      contextStorage: {},
    });

    helper.load([configNode, valueNode], FlowNodeAllVariants, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      v.receive({payload: AnyInputString});
      v.status.should.be.calledWithMatch({
        fill: 'green',
        shape: 'dot',
        text: `true [boolean,global,default]`,
      });
      done();
    });
  });

  // ==== Read Tests ==========================================================

  it('should read the default value - boolean', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdBoolean;
    delete flow[0].value; // extra test: Reference selected value by name must be optional.

    helper.load([configNode, valueNode], flow, function() {
      const c = helper.getNode(NodeIdConfig);
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, c.values[0].default);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should read the default value - number', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);

    // extra test: backward compatibility <= 1.1.0: selected value not referenced via ID.
    delete flow[0].valueId;
    flow[0].value = ConfigValueNumber;

    helper.load([configNode, valueNode], flow, function() {
      const c = helper.getNode(NodeIdConfig);
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, c.values[1].default);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should read the default value - string', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = undefined; // Extra test variant: Force usage of default command (read)

    helper.load([configNode, valueNode], flow, function() {
      const c = helper.getNode(NodeIdConfig);
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, c.values[2].default);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should read the default value - JSON', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);

    flow[0].valueId = ConfigValueIdJson;

    helper.load([configNode, valueNode], flow, function() {
      const c = helper.getNode(NodeIdConfig);
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const expectedDefault = JSON.parse(c.values[3].default);
      h.on(InputFunction, function(msg) {
        try {
          nodejsAssert.deepStrictEqual(msg[PropertyPayload], expectedDefault);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should read the context value - boolean', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdBoolean;

    helper.load([configNode, valueNode], flow, function() {
      const c = helper.getNode(NodeIdConfig);
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedValue = !c.values[0].default; // use inverted the default
      setContextValue(v, simulatedValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should read the context value - number', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdNumber;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedValue = 2305;
      setContextValue(v, simulatedValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should read the context value - string', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedValue = '❤ Node-RED';
      setContextValue(v, simulatedValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should read the context value - JSON', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdJson;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedValue = {'array': [1, 2, 3], 'obj': {'bool': false}};
      setContextValue(v, simulatedValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should read the context value from scope flow', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdNumber;
    flow[1].values[1].scope = ScopeFlow;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedValue = 3.14159265359;
      setContextValue(v, simulatedValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should read the context value from scope node', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdNumber;
    flow[1].values[1].scope = ScopeNode;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedValue = 23.05;
      setContextValue(v, simulatedValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should abort if an invalid scope is configured', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdNumber;
    const kInvalidScopeName = 'invalidScope';
    flow[1].values[1].scope = kInvalidScopeName;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      v.receive({payload: {invalidBigInt: BigInt(123)}});
      v.error.should.be.calledWithMatch(`Failed to get context scope '${kInvalidScopeName}'`);
      v.send.should.have.callCount(0);
      done();
    });
  });

  it('should read the context value to non-default msg property', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    const OutputMsgProperty = 'output.non_default_output_property';
    flow[0].msgProperty = OutputMsgProperty;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedValue = '❤ Node-RED';
      setContextValue(v, simulatedValue);

      h.on(InputFunction, function(msg) {
        try {
          nodejsAssert.deepStrictEqual(msg.output, {non_default_output_property: simulatedValue});
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should warn persisted value datatype is not matching to configured datatype', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdNumber;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedValue = true; // not matching configured type 'number'
      setContextValue(v, simulatedValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);
          v.warn.should.be.calledWithMatch(`Persisted value TestConfig / number does not have the configured datatype 'num'`);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  // ==== Write Tests =========================================================

  it('should write to the context storage - default', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, '');
      const simulatedValue = 'Node-RED';

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);

          const contextValue = getContextValue(v);
          contextValue.should.equal(simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: simulatedValue});
    });
  });

  it('should write to the context storage - memory', function(done) {
    const testedStorage = StorageMemory;

    const flow = structuredClone(FlowNodeAllVariants);
    flow[1].values[2].storage = testedStorage;
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperOnChange);

      setContextValue(v, '', testedStorage);
      const simulatedValue = 'Store it to memory context';

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);

          const contextValue = getContextValue(v, testedStorage);
          contextValue.should.be.equal(simulatedValue);

          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: simulatedValue});
    });
  });

  it('should write to the context storage - file', function(done) {
    const testedStorage = StorageFile;

    const flow = structuredClone(FlowNodeAllVariants);
    flow[1].values[2].storage = testedStorage;
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperOnChange);

      setContextValue(v, '', testedStorage);
      const simulatedValue = 'Store it to file context';

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);

          const contextValue = getContextValue(v, testedStorage);
          contextValue.should.equal(simulatedValue);

          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: simulatedValue});
      v.status.should.be.calledWithMatch({
        fill: 'red', shape: 'dot',
        text: `${simulatedValue} [str,global,file]`,
      });
    });
  });

  it('should write pure JSON object', function(done) {
    const testedStorage = StorageFile;

    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdJson;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, '', testedStorage);
      const pureJsonObject = {
        null: null,
        boolean: true,
        string: 'persistentValues❤JSON',
        number: 2.34567,
        array: [
          'test1',
          'test2',
        ],
        object: {
          nested1: null,
          nested2: [22, 7, 2016],
        },
      };

      h.on(InputFunction, function(msg) {
        try {
          nodejsAssert.deepStrictEqual(msg[PropertyPayload], pureJsonObject);

          const contextValue = getContextValue(v, testedStorage);
          nodejsAssert.deepStrictEqual(contextValue, pureJsonObject);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: pureJsonObject});
      v.error.callCount.should.be(0);
    });
  });

  it('should abort if an invalid JSON object is passed', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdJson;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      v.receive({payload: {invalidBigInt: BigInt(123)}});
      v.error.should.be.calledWithMatch(`does not have the configured datatype 'json'`);
      v.send.should.have.callCount(0);
      done();
    });
  });

  it('should write to the context storage with scope flow', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;
    flow[1].values[1].scope = ScopeFlow;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, '');
      const simulatedValue = 'write with scope flow';

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);

          const contextValue = getContextValue(v);
          contextValue.should.equal(simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: simulatedValue});
    });
  });

  it('should write to the context storage with scope node', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;
    flow[1].values[1].scope = ScopeNode;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, '');
      const simulatedValue = 'write with scope node';

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);

          const contextValue = getContextValue(v);
          contextValue.should.equal(simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: simulatedValue});
    });
  });

  it('should write to the context storage even if the input value is equal to the default value', function(done) {
    const testedStorage = StorageMemory;

    const flow = structuredClone(FlowNodeAllVariants);
    flow[1].values[2].storage = testedStorage;
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedInput = flow[1].values[2].default; // Equal to default value

      setContextValue(v, undefined, testedStorage); // Clear the context

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedInput);
          const contextValue = getContextValue(v, testedStorage);
          contextValue.should.be.equal(simulatedInput);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: simulatedInput});
    });
  });

  it('should write to the context storage from non-default input msg property', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;
    const InputMsgProperty = 'input.non_default_input_property';
    flow[0].msgProperty = InputMsgProperty;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, '');
      const simulatedValue = 'Node-RED';

      h.on(InputFunction, function(msg) {
        try {
          nodejsAssert.deepStrictEqual(msg.input, {non_default_input_property: simulatedValue});

          const contextValue = getContextValue(v);
          contextValue.should.equal(simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });

      const msg = {input: {non_default_input_property: simulatedValue}};
      v.receive(msg);
    });
  });

  it('should abort if non-existing input msg property is used', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].command = CommandWrite;
    const InputMsgProperty = 'non_default_input_property';
    flow[0].msgProperty = InputMsgProperty;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      v.receive({incorrect_msg_property: false});
      v.error.should.be.calledWithMatch(`Passed msg does not have the configured input property '${InputMsgProperty}'`);
      v.send.should.have.callCount(0);
      done();
    });
  });

  it('should write to the context storage and notify about changed value', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperOnChange);

      setContextValue(v, '');
      const simulatedValue = 'OnChange Node-RED';

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: simulatedValue});
    });
  });

  it('should not write to the context storage and not notify about changed value if value is not modified', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdJson;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      const simulatedValue = {text: 'Not changed context value', extra: 123};
      setContextValue(v, simulatedValue);

      // Enforce write operation with cloned input to test deep strict equal comparison
      const simulatedValueClone = {text: simulatedValue.text, extra: simulatedValue.extra};
      const msg = {payload: simulatedValueClone};
      v.receive(msg);
      v.send.should.be.calledWithExactly([msg, null]); // no onChange message expected
      done();
    });
  });

  it('should abort if input value datatype is not matching to configured datatype', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      v.receive({payload: true}); // not matching to configured type 'string'
      v.error.should.be.calledWithMatch(`Passed value in msg.payload does not have the configured datatype 'str'`);
      v.send.should.have.callCount(0);
      done();
    });
  });

  // ==== Dynamic Control - Value override (msg.value) Test ===================

  it('should use the dynamic value override to read the context value with meta data', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].dynamicControl = true; // enable dynamic controls
    flow[0].dynamicValueMsgProperty = 'override_topic'; // custom msg property
    flow[0].outputMetaData = true; // enable output of meta data
    const kMetaDataMsgProperty = 'meta_data';
    flow[0].outputMetaDataMsgProperty = kMetaDataMsgProperty;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const configuredValue = 'Original configured value';
      setContextValue(v, configuredValue);

      const overrideValueName = ConfigValueNumber;
      const overrideValue = 2305;
      const storage = undefined; // use default
      setContextValue(v, overrideValue, storage, overrideValueName);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, overrideValue);

          // check additional meta data
          msg.should.have.property(kMetaDataMsgProperty,
            {
              config: 'TestConfig',
              value: overrideValueName,
              datatype: DataTypeNumber,
              default: 23,
              scope: ScopeGlobal,
              storage: StorageDefault,
              description: 'number value, default 23, scope global, storage default',
              command: CommandRead,
            });
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({
        payload: AnyInputString,
        override_topic: overrideValueName});
    });
  });

  it('should use the dynamic value override to write the context value with meta data', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdNumber;
    flow[0].command = CommandRead;
    flow[0].dynamicControl = true;
    flow[0].dynamicCommandMsgProperty = 'cmd'; // Use also dyn. command to test meta data output
    flow[0].dynamicValueMsgProperty = 'override_topic';
    flow[0].outputMetaData = true;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, '');

      const overrideValueName = ConfigValueString;
      const overrideValue = 'dynamic override value';
      const storage = undefined; // use default

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, overrideValue);
          // check additional meta data
          msg.should.have.property('meta',
            {
              config: 'TestConfig',
              value: overrideValueName,
              datatype: DataTypeString,
              default: 'my string default value',
              scope: ScopeGlobal,
              storage: StorageDefault,
              description: '', // undefined must be converted to empty string
              command: CommandWrite,
            });

          const contextValue = getContextValue(v, storage, overrideValueName);
          contextValue.should.equal(overrideValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({
        payload: overrideValue,
        cmd: CommandWrite,
        override_topic: overrideValueName});
    });
  });

  it('should fall back to configured value if dynamic value override is invalid', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].dynamicControl = true;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const configuredValue = 'Original configured value';
      setContextValue(v, configuredValue);

      const overrideValueName = ConfigValueNumber;
      const overrideValue = 2305;
      const storage = undefined; // use default
      setContextValue(v, overrideValue, storage, overrideValueName);

      const invalidOverrideValue = false;

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, configuredValue);
          v.warn.should.be.calledWithMatch(
            new RegExp(`'${invalidOverrideValue}'.*not found.*falling back.*${ConfigValueString}.*`, 'i'));
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({
        payload: AnyInputString,
        value: invalidOverrideValue,
      });
    });
  });

  it('should ignore the dynamic value override if dynamic control is disabled', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].dynamicControl = false; // disable dynamic controls
    flow[0].dynamicValueMsgProperty = 'override_topic'; // custom msg property

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const configuredValue = 'Original configured value';
      setContextValue(v, configuredValue);

      const overrideValueName = ConfigValueNumber;
      const overrideValue = 2305;
      const storage = undefined; // use default
      setContextValue(v, overrideValue, storage, overrideValueName);

      h.on(InputFunction, function(msg) {
        try {
          // Value of configured instead of overridden value expected
          msg.should.have.property(PropertyPayload, configuredValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({
        payload: AnyInputString,
        override_topic: overrideValueName});
    });
  });

  it('should use configure value if dynamic value override is enabled but msg property not set', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdNumber;
    flow[0].command = CommandWrite;
    flow[0].dynamicControl = true;
    flow[0].dynamicValueMsgProperty = 'override_topic';

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, '');
      const simulatedValue = 4223;

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);
          const contextValue = getContextValue(v);
          contextValue.should.equal(simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: simulatedValue});
    });
  });

  // ==== Dynamic Control - Command override (msg.command) Tests ==============

  it(`should use 'read' command override`, function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;
    // extra test: Due to backward compatibility with 1.x the dynamic controls
    //             must not be activated to support dynamic command overrides.
    flow[0].dynamicControl = false;
    flow[0].dynamicCommandMsgProperty = 'override_command'; // Custom msg property

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const persistedValue = 'Use the read command override';
      setContextValue(v, persistedValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, persistedValue);

          const contextValue = getContextValue(v);
          contextValue.should.equal(persistedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({
        payload: AnyInputString,
        override_command: CommandRead,
      });
    });
  });

  it(`should use 'write' command override`, function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    delete flow[0].command; // extra test: No command configured. -> fallback to default command

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedValue = 'Use the write command override';
      setContextValue(v, '');

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedValue);

          const contextValue = getContextValue(v);
          contextValue.should.equal(simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({
        payload: simulatedValue,
        command: `   ${CommandWrite.toUpperCase()}    `, // test also trim and lowercase
      });
    });
  });

  it(`should use the configured command if an unknown override is used`, function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].command = CommandRead;

    helper.load([configNode, valueNode], flow, function() {
      const c = helper.getNode(NodeIdConfig);
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, c.values[0].default);
          v.warn.should.be.calledWithMatch('not known / supported');
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({
        payload: AnyInputString,
        command: {invalid_command: 'string instead of object type expected'},
      });
    });
  });

  // ==== Deep Clone Tests ====================================================

  it('should deep clone read JSON value', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdJson;
    flow[0].deepCloneValue = true;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const contextValue = {boolean: true};
      const contextValueClone = {boolean: contextValue.boolean};
      setContextValue(v, contextValue);

      h.on(InputFunction, function(msg) {
        try {
          const msgValue = msg[PropertyPayload];
          nodejsAssert.deepStrictEqual(msgValue, contextValue);

          // without deep clone option the following msg propery modification
          // would also modify the context store.
          msgValue.boolean = !contextValue.boolean;

          // Due to deep clone option the context value must remain unchanged.
          const contextValueAfterMsgModify = getContextValue(v);
          nodejsAssert.deepStrictEqual(contextValueAfterMsgModify, contextValueClone);

          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should deep clone written JSON value', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdJson;
    flow[0].command = CommandWrite;
    flow[0].deepCloneValue = true;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const inputValue = {boolean: true};
      const inputValueClone = {boolean: inputValue.boolean};

      h.on(InputFunction, function(msg) {
        try {
          const contextValue = getContextValue(v);
          nodejsAssert.deepStrictEqual(contextValue, inputValueClone);

          // Context value must not be modified by a modification of the original input
          inputValue.boolean = !inputValue.boolean;
          nodejsAssert.deepStrictEqual(contextValue, inputValueClone);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: inputValue});
    });
  });

  // ==== Output Previous Value Test ==========================================

  it('should store the previous persisted value', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;
    flow[0].outputPreviousValue = true;
    const previousValueMsgProperty = 'output.store_previous_value';
    flow[0].outputPreviousValueMsgProperty = previousValueMsgProperty;

    const CollectedValuesProperty = 'output.collected_values';
    flow[0].collectValues = true;
    flow[0].collectValuesMsgProperty = CollectedValuesProperty;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperOnChange);

      const expectedPreviousValue = 'my previousvalue';
      setContextValue(v, expectedPreviousValue);
      const newValue = 'my new value';

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, newValue);

          const contextValue = getContextValue(v);
          contextValue.should.equal(newValue);

          const expectedOutputProperty = {
            store_previous_value: expectedPreviousValue,
            collected_values: {},
          };
          expectedOutputProperty.collected_values[buildContextKeyName(v)] = {
            current: newValue,
            previous: expectedPreviousValue,
          };
          nodejsAssert.deepStrictEqual(msg.output, expectedOutputProperty);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: newValue});
    });
  });

  // ==== Collect Values Tests ================================================

  it('should collect the read values', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdNumber;
    const CollectedValuesProperty = 'collected_values';
    flow[0].collectValues = true;
    flow[0].collectValuesMsgProperty = CollectedValuesProperty;

    // Insert before the default node another persistent value node
    const FirstPersistentvalueNode = structuredClone(PersistentValueNodeDefault);
    FirstPersistentvalueNode.id = NodeIdPersistentValue + '2';
    FirstPersistentvalueNode.valueId = ConfigValueIdString;
    FirstPersistentvalueNode.collectValues = true;
    FirstPersistentvalueNode.collectValuesMsgProperty = CollectedValuesProperty;
    FirstPersistentvalueNode.wires = [[NodeIdPersistentValue]], // Connect to other persisten value node
    flow.push(FirstPersistentvalueNode);

    helper.load([configNode, valueNode], flow, function() {
      const v1 = helper.getNode(FirstPersistentvalueNode.id);
      const v2 = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedStringValue = 'My collected string value';
      setContextValue(v1, simulatedStringValue);
      const simulatedNumberValue = 98;
      setContextValue(v2, simulatedNumberValue);

      h.on(InputFunction, function(msg) {
        try {
          const ExpectedCollectedValues = {};
          ExpectedCollectedValues[buildContextKeyName(v1)] = simulatedStringValue;
          ExpectedCollectedValues[buildContextKeyName(v2)] = simulatedNumberValue;

          msg.should.have.property(CollectedValuesProperty, ExpectedCollectedValues);
          done();
        } catch (err) {
          done(err);
        }
      });
      v1.receive({payload: AnyInputString});
    });
  });

  it('should collect the written values', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;
    flow[0].collectValues = true;
    const CollectedValuesProperty = 'collected_values';
    flow[0].collectValuesMsgProperty = CollectedValuesProperty;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, '');
      const simulatedValue = 'Collect written values';

      h.on(InputFunction, function(msg) {
        try {
          const ExpectedCollectedValues = {};
          ExpectedCollectedValues[buildContextKeyName(v)] = simulatedValue;
          msg.should.have.property(CollectedValuesProperty, ExpectedCollectedValues);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: simulatedValue});
    });
  });

  it('should skip value collection if msg property cannot be created', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdNumber;
    flow[0].msgProperty = 'output';
    const CollectedValuesProperty = 'payload.collected_values';
    flow[0].collectValues = true;
    flow[0].collectValuesMsgProperty = CollectedValuesProperty;

    helper.load([configNode, valueNode], flow, function() {
      const c = helper.getNode(NodeIdConfig);
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property('output', c.values[1].default);
          msg.payload.should.not.have.property('collected_values');
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
      v.warn.should.be.calledWithMatch(`Failed to create Object at msg.${CollectedValuesProperty}`);
    });
  });

  // ==== Blocker Further Flow Processing Tests ===============================

  it('should block further processing if equal rule matches to boolean value', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdBoolean;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    const BlockIfCompareValue = true;
    flow[0].blockIfCompareValue = BlockIfCompareValue.toString(); // Stored as string by typed input

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      setContextValue(v, BlockIfCompareValue);

      v.receive({payload: AnyInputString});
      v.send.should.be.calledWithExactly([null, null]);
      done();
    });
  });

  it('should block further processing if equal rule matches to number value', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdNumber;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    const BlockIfCompareValue = 2305;
    flow[0].blockIfCompareValue = BlockIfCompareValue;


    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      setContextValue(v, BlockIfCompareValue);

      v.receive({payload: AnyInputString});
      v.send.should.be.calledWithExactly([null, null]);
      done();
    });
  });

  it('should block further processing if equal rule matches to string value', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    const BlockIfCompareValue = 'match me';
    flow[0].blockIfCompareValue = BlockIfCompareValue;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      setContextValue(v, BlockIfCompareValue);

      v.receive({payload: AnyInputString});
      v.send.should.be.calledWithExactly([null, null]);
      v.status.should.be.calledWithMatch({
        fill: 'red',
        shape: 'dot',
        text: `${BlockIfCompareValue} [string,global,default (memory)]`,
      });
      done();
    });
  });

  it('should block further processing if equal rule matches to JSON value', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdJson;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    const BlockIfCompareValue = {boolean: true, string: 'match me'};
    flow[0].blockIfCompareValue = JSON.stringify(BlockIfCompareValue, null, 2);

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      setContextValue(v, BlockIfCompareValue);

      v.receive({payload: AnyInputString});
      v.send.should.be.calledWithExactly([null, null]);
      v.status.should.be.calledWithMatch({
        fill: 'red',
        shape: 'dot',
        text: `{JSON} [json,global,default (memory)]`,
      });
      done();
    });
  });

  it('should block further processing if not-equal rule matches', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdBoolean;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleNotEqual;
    const BlockIfCompareValue = false;
    flow[0].blockIfCompareValue = BlockIfCompareValue.toString(); // Stored as string by typed input


    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      setContextValue(v, !BlockIfCompareValue);

      v.receive({payload: AnyInputString});
      v.send.should.be.calledWithExactly([null, null]);
      done();
    });
  });

  it('should not block further processing if equal rule does not match', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    const BlockIfCompareValue = 'does not match';
    flow[0].blockIfCompareValue = BlockIfCompareValue;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, AnyInputString);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should not block further processing if not-equal rule does not match', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].command = CommandWrite;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleNotEqual;
    const BlockIfCompareValue = 'does not match';
    flow[0].blockIfCompareValue = BlockIfCompareValue;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, BlockIfCompareValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: BlockIfCompareValue});
    });
  });

  it('should not block further processing if not matching compare value type is configured', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdBoolean;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    const BlockIfCompareValue = 2305; // 'number' instead of expected type 'boolean'
    flow[0].blockIfCompareValue = BlockIfCompareValue;


    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, BlockIfCompareValue);

      h.on(InputFunction, function(msg) {
        try {
          v.warn.should.be.calledWithMatch('Type mismatch of block flow values');
          msg.should.have.property(PropertyPayload, BlockIfCompareValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should not block further processing if an unknown rule is configured', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdNumber;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual + 'NOT_SUPPORTED_RULE';
    const BlockIfCompareValue = 2305;
    flow[0].blockIfCompareValue = BlockIfCompareValue;


    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, BlockIfCompareValue);

      h.on(InputFunction, function(msg) {
        try {
          v.warn.should.be.calledWithMatch('Unknown block-if rule');
          msg.should.have.property(PropertyPayload, BlockIfCompareValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should not block further processing if compare value type cannot be parsed - number', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdNumber;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    const BlockIfCompareValue = 'not a number';
    flow[0].blockIfCompareValue = BlockIfCompareValue;


    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, BlockIfCompareValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, BlockIfCompareValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should not block further processing if compare value type cannot be parsed - JSON', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdJson;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    flow[0].blockIfCompareValue = '{ incomplete JSON: X';

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedContextValue = {valid: 'JSON object'};
      setContextValue(v, simulatedContextValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedContextValue);
          v.error.should.be.calledWithMatch(`Failed to convert value`);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should not block further processing if compare value type cannot be parsed - string', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    flow[0].blockIfCompareValue = undefined;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedContextValue = 'valid string';
      setContextValue(v, simulatedContextValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedContextValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  it('should not block further processing if not supported compare value type is used', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].valueId = ConfigValueIdString;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    flow[0].blockIfCompareValue = true;
    flow[1].values[2].datatype = 'not supported datatype';

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedContextValue = true;
      setContextValue(v, simulatedContextValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(PropertyPayload, simulatedContextValue);
          done();
        } catch (err) {
          done(err);
        }
      });
      v.receive({payload: AnyInputString});
    });
  });

  // ==== Backend HTTP API ====================================================
  const httpPathGetContextKey = '/persistentvalues/util/getcontextkey';

  it(`backend API should return the context key`, function(done) {
    helper.load([valueNode], FlowNodeAllVariants, function() {
      const testConfigName = 'test/ Configuration';
      const testPersistedValueName = 'Persisted~Value';

      let expectedContexKey = testConfigName + '_' + testPersistedValueName;
      expectedContexKey = expectedContexKey.replace(/ /g, '_');

      helper.request()
        .get(httpPathGetContextKey)
        .query({configName: testConfigName, valueName: testPersistedValueName})
        .expect(function(res) {
          const contextKeyName = res._body;
          contextKeyName.should.be.equal(expectedContexKey);
        })
        .expect(200)
        .end(done);
    });
  });

  // ==== Other / Error Handling Tests ========================================

  it('should reject unknown / unsupported commands', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    const unsupportedCommand = 'unsupported command';
    flow[0].command = unsupportedCommand;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      v.receive({payload: AnyInputString});

      v.error.should.be.calledWithMatch(`Unknown or unsupported persistent value command '${unsupportedCommand}' used!`);
      v.send.should.have.callCount(0);
      done();
    });
  });
});
