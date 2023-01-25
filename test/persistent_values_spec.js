// --------------------------------------------------------------------------------------------------------------------
// Tests for node-red-persistent-values
// --------------------------------------------------------------------------------------------------------------------
// Setup Infrastructure:
//   npm install --save-dev
//   npm install ~/.node-red --no-save
// Run tests
//   npm run test
// More docu:
//   - https://www.npmjs.com/package/node-red-node-test-helper
//   - https://sinonjs.org/releases/latest/assertions/
// --------------------------------------------------------------------------------------------------------------------
const helper = require('node-red-node-test-helper');
const valueNode = require('../nodes/persistent-value.js');
const configNode = require('../nodes/persistent-values-config.js');

describe('persistent value node', function() {
  beforeEach(function() {
    // Nothing to be done
  });
  afterEach(function() {
    helper.unload();
  });

  // ==== Utilities ===================================================================================================
  function buildContextKeyName(node) {
    return node.configName + '_' + node.value;
  }

  function getContext(node) {
    let context = node.context();
    if (node.config.scope === 'flow') {
      context = context.flow;
    }
    if (node.config.scope === 'global') {
      context = context.global;
    }
    return context;
  }

  function getContextValue(node, storage = undefined) {
    if (storage !== undefined) {
      return getContext(node).get(buildContextKeyName(node), storage);
    } else {
      return getContext(node).get(buildContextKeyName(node));
    }
  }

  function setContextValue(node, value, storage = undefined) {
    if (storage !== undefined) {
      getContext(node).set(buildContextKeyName(node), value, storage);
    } else {
      getContext(node).set(buildContextKeyName(node), value);
    }
  }

  // ==== Constants =====
  const InputFunction = 'input';
  const PropertyPayload = 'payload';

  const AnyInputString = 'any input string';

  const DataTypeBool = 'bool';
  const DataTypeNumber = 'num';
  const DataTypeString = 'str';

  const ScopeGlobal = 'global';
  const ScopeFlow = 'flow';

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

  const ConfigValueBoolean = 'boolean';
  const ConfigValueNumber = 'number';
  const ConfigValueString = 'string';

  const NodeHelperCurrentValue = {id: NodeIdHelperCurrentValue, z: FlowIdTestFlow, type: NodeTypeHelper};
  const NodeHelperOnChange = {id: NodeIdHelperOnChange, z: FlowIdTestFlow, type: NodeTypeHelper};

  const ConfigNodeAllVariants = {
    id: NodeIdConfig,
    type: NodeTypePersistentValuesConfig,
    name: 'TestConfig',
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
        storage: StorageDefault,
      },
      {
        name: ConfigValueString,
        datatype: DataTypeString,
        default: 'my string default value',
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

  // ==== NodeRED settings ============================================================================================

  helper.settings({
    contextStorage: {
      default: 'memory',
      memory: {module: 'memory'},
      file: {module: 'localfilesystem'},
    },
  });

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

  // ==== Read Tests ==========================================================

  it('should read the default value - boolean', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueBoolean;

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
    flow[0].value = ConfigValueString;

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


  it('should read the context value - boolean', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueBoolean;

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
    flow[0].value = ConfigValueNumber;

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
    flow[0].value = ConfigValueNumber;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedValue = '❤ NodeRED';
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
    flow[0].value = ConfigValueNumber;
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

  it('should read the context value to non-default msg property', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    const OutputMsgProperty = 'non_default_output_property';
    flow[0].msgProperty = OutputMsgProperty;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedValue = '❤ NodeRED';
      setContextValue(v, simulatedValue);

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(OutputMsgProperty, simulatedValue);
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
    flow[0].value = ConfigValueNumber;

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
    flow[0].value = ConfigValueString;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, '');
      const simulatedValue = 'NodeRED';

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
    flow[0].value = ConfigValueString;
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
    });
  });

  it('should write to the context storage - file', function(done) {
    const testedStorage = StorageFile;

    const flow = structuredClone(FlowNodeAllVariants);
    flow[1].values[2].storage = testedStorage;
    flow[0].value = ConfigValueString;
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
    });
  });

  it('should write to the context storage with scope flow', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueString;
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

  it('should write to the context storage from non-default input msg property', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueString;
    flow[0].command = CommandWrite;
    const InputMsgProperty = 'non_default_input_property';
    flow[0].msgProperty = InputMsgProperty;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      setContextValue(v, '');
      const simulatedValue = 'NodeRED';

      h.on(InputFunction, function(msg) {
        try {
          msg.should.have.property(InputMsgProperty, simulatedValue);

          const contextValue = getContextValue(v);
          contextValue.should.equal(simulatedValue);
          done();
        } catch (err) {
          done(err);
        }
      });

      const msg = {};
      msg[InputMsgProperty] = simulatedValue;
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
      v.error.should.be.calledWithMatch(`Passed msg does not have the configured property '${InputMsgProperty}'`);
      v.send.should.have.callCount(0);
      done();
    });
  });

  it('should write to the context storage and notify about changed value', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueString;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperOnChange);

      setContextValue(v, '');
      const simulatedValue = 'OnChange NodeRED';

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
    flow[0].value = ConfigValueString;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      const simulatedValue = 'Not changed context value';
      setContextValue(v, simulatedValue);

      const msg = {payload: simulatedValue};
      v.receive(msg);
      v.send.should.be.calledWithExactly([msg, null]); // no onChange message expected
      done();
    });
  });

  it('should abort if input value datatype is not matching to configured datatype', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueString;
    flow[0].command = CommandWrite;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      v.receive({payload: true}); // not matching to configured type 'string'
      v.error.should.be.calledWithMatch(`Passed value in msg.payload does not have the configured datatype 'str'`);
      v.send.should.have.callCount(0);
      done();
    });
  });

  // ==== Collect Values Tests ================================================

  it('should collect the read values', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueNumber;
    const CollectedValuesProperty = 'collected_values';
    flow[0].collectValues = true;
    flow[0].collectValuesMsgProperty = CollectedValuesProperty;

    // Insert before the default node another persistent value node
    const FirstPersistentvalueNode = structuredClone(PersistentValueNodeDefault);
    FirstPersistentvalueNode.id= NodeIdPersistentValue + '2';
    FirstPersistentvalueNode.value = ConfigValueString;
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
    flow[0].value = ConfigValueString;
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

  // ==== Blocker Further Flow Processing Tests ===============================

  it('should block further processing if equal rule matches to boolean value', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueBoolean;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    const BlockIfCompareValue = true;
    flow[0].blockIfCompareValue = BlockIfCompareValue.toString(); // Stored as string by typed input


    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      setContextValue(v, BlockIfCompareValue);

      v.receive({payload: AnyInputString});
      v.send.should.calledWithExactly([null, null]);
      done();
    });
  });

  it('should block further processing if equal rule matches to number value', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueNumber;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    const BlockIfCompareValue = 2305;
    flow[0].blockIfCompareValue = BlockIfCompareValue;


    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      setContextValue(v, BlockIfCompareValue);

      v.receive({payload: AnyInputString});
      v.send.should.calledWithExactly([null, null]);
      done();
    });
  });

  it('should block further processing if equal rule matches to string value', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueString;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    const BlockIfCompareValue = 'match me';
    flow[0].blockIfCompareValue = BlockIfCompareValue;


    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      setContextValue(v, BlockIfCompareValue);

      v.receive({payload: AnyInputString});
      v.send.should.calledWithExactly([null, null]);
      done();
    });
  });

  it('should block further processing if not-equal rule matches', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueBoolean;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleNotEqual;
    const BlockIfCompareValue = false;
    flow[0].blockIfCompareValue = BlockIfCompareValue.toString(); // Stored as string by typed input


    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);

      setContextValue(v, !BlockIfCompareValue);

      v.receive({payload: AnyInputString});
      v.send.should.calledWithExactly([null, null]);
      done();
    });
  });

  it('should not block further processing if equal rule does not match', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueString;
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
    flow[0].value = ConfigValueString;
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
    flow[0].value = ConfigValueBoolean;
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
    flow[0].value = ConfigValueNumber;
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
    flow[0].value = ConfigValueNumber;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    const BlockIfCompareValue = "not a number";
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

  it('should not block further processing if compare value type cannot be parsed - string', function(done) {
    const flow = structuredClone(FlowNodeAllVariants);
    flow[0].value = ConfigValueString;
    flow[0].blockIfEnable = true;
    flow[0].blockIfRule = BlockIfRuleEqual;
    flow[0].blockIfCompareValue = undefined;

    helper.load([configNode, valueNode], flow, function() {
      const v = helper.getNode(NodeIdPersistentValue);
      const h = helper.getNode(NodeIdHelperCurrentValue);

      const simulatedContextValue = "valid string";
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
    flow[0].value = ConfigValueString;
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
});
