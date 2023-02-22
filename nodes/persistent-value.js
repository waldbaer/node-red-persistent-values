module.exports = function(RED) {
  const uuid = require('uuid');
  const assert = require('assert'); // nodejs assert module

  // ---- elements of the reference config ----

  // Datatypes defined by TypedInput widget
  const kConfigDatatypeBool = 'bool';
  const kConfigDatatypeNumber = 'num';
  const kConfigDatatypeString = 'str';
  const kConfigDatatypeJson = 'json';

  // Lookup table: javascript typeof -> configured type (TypedInput)
  const kSupportedDatatypesLanguageType = {
    [typeof true]: kConfigDatatypeBool,
    [typeof 0]: kConfigDatatypeNumber,
    [typeof '']: kConfigDatatypeString,
    [kConfigDatatypeJson]: kConfigDatatypeJson,
  };
  // Lookup table: configured type (TypedInput) -> javascript typeof
  const kSupportedDatatypesByTypedInput = Object.keys(kSupportedDatatypesLanguageType).reduce((ret, key) => {
    ret[kSupportedDatatypesLanguageType[key]] = key;
    return ret;
  }, {});

  // ---- elements of the node ----
  const kStorageDefault = 'default';
  const kMsgPropertyDefault = 'payload';

  const kCommandRead = 'read';
  const kCommandWrite = 'write';
  const kSupportedCommands = [kCommandRead, kCommandWrite];

  const kCommandDefault = kCommandRead;

  const kDeepCloneValueDefault = false;

  const kOutputPreviousValueDefault = false; // Do not output the previous value by default
  const kOutputPreviousValueMsgProperty = 'previous_value';

  const kCollectValuesDefault = false; // Do not collect values by default
  const kCollectValuesMsgProperty = 'values';

  const kBlockIfRuleEq = 'eq';
  const kBlockIfRuleNeq = 'neq';

  const kBlockIfEnableDefault = false;
  const kBlockIfRuleDefault = kBlockIfRuleEq;

  // ---- Utility functions -----------------------------------------------------------------------
  function reportIncorrectConfiguration(node) {
    node.error(`Incorrect or inconsistent configuration of persistent-values node ` +
               `'${node.name}' with ID ${node.id}. Skipping further processing.`, node);
  }

  function buildNodeStatus(node, currentValue, blockFlow) {
    let value = currentValue;
    if (node.valueConfig.datatype === kConfigDatatypeJson) {
      value = `{JSON}`;
    }

    let storage = node.valueConfig.storage;
    if (storage === kStorageDefault) {
      if (RED.settings.contextStorage !== undefined && RED.settings.contextStorage.default !== undefined) {
        storage += ` (${RED.settings.contextStorage.default})`;
      }
    }

    node.status({
      fill: `${blockFlow ? 'red' : 'green'}`,
      shape: 'dot',
      text: `${value} [${kSupportedDatatypesByTypedInput[node.valueConfig.datatype]},${node.valueConfig.scope},${storage}]`,
    });
  }

  function determineCommand(node, msg) {
    let command = node.command;

    // Command overwrite by msg.command property?
    const commandProperty = 'command';
    if (msg.hasOwnProperty(commandProperty)) {
      let msgCommand = msg[commandProperty];
      if (typeof msgCommand === 'string') {
        msgCommand = msgCommand.trim().toLowerCase();
      }
      if (kSupportedCommands.includes(msgCommand)) {
        command = msgCommand;
      } else {
        node.warn(`Command '${msgCommand}' set via msg.${commandProperty} is not known / supported!` +
        ` Falling back to configured command.` +
        ` Supported commands: ${kSupportedCommands.join(', ')}`
        , msg);
      }
    }
    return command;
  }

  function getUsedContext(node) {
    let context = node.context();
    if (node.valueConfig.scope === 'flow') {
      context = context.flow;
    }
    if (node.valueConfig.scope === 'global') {
      context = context.global;
    }
    return context;
  }

  function getContextKey(node) {
    return getContextKeyFromNames(node.configName, node.value);
  }

  function getContextKeyFromNames(configName, valueName) {
    let contextKey = configName + '_' + valueName;
    contextKey = contextKey.replace(/ /g, '_'); // No spaces in context key allowed
    return contextKey;
  }

  function getContext(node, context, contextKey) {
    let currentValue = undefined;
    if (node.valueConfig.storage === kStorageDefault) {
      currentValue = context.get(contextKey);
    } else {
      currentValue = context.get(contextKey, node.valueConfig.storage);
    }

    // Apply default value if context contains no value
    if (currentValue === undefined) {
      currentValue = node.valueConfig.default;

      if (node.valueConfig.datatype === kConfigDatatypeJson) {
        currentValue = JSON.parse(currentValue);
      }
    }
    return currentValue;
  }

  function setContext(node, context, contextKey, newValue) {
    if (node.valueConfig.storage === kStorageDefault) {
      context.set(contextKey, newValue);
    } else {
      context.set(contextKey, newValue, node.valueConfig.storage);
    }
  }

  function addPreviousValue(node, msg, previousValue) {
    if (node.outputPreviousValue) {
      RED.util.setMessageProperty(msg, node.outputPreviousValueMsgProperty, previousValue, true);
    }
  }

  function updateCollectedValues(node, msg, currentValue, previousValue) {
    if (node.collectValues) {
      let collectedValues = RED.util.getMessageProperty(msg, node.collectValuesMsgProperty);
      if ((collectedValues === undefined) || (typeof collectedValues !== 'object')) {
        if (RED.util.setMessageProperty(msg, node.collectValuesMsgProperty, {}, true)) {
          collectedValues = RED.util.getMessageProperty(msg, node.collectValuesMsgProperty);
        } else {
          node.warn(`Failed to create Object at msg.${node.collectValuesMsgProperty}. Creation only possible for object types!`);
          return;
        }
      }

      const contextKey = getContextKey(node);
      if (node.outputPreviousValue) {
        collectedValues[contextKey] = {
          current: currentValue,
          previous: previousValue,
        };
      } else {
        collectedValues[contextKey] = currentValue;
      }
    }
  }

  function convertToExpectedType(node, value) {
    let convertedValue = undefined;
    switch (node.valueConfig.datatype) {
    case kConfigDatatypeBool:
      if (value === 'true') {
        convertedValue = true;
      } else if (value === 'false') {
        convertedValue = false;
      } else {
        // Unknown boolean value
      }
      break;
    case kConfigDatatypeNumber:
      const tryConversion = Number(value);
      if (!isNaN(tryConversion)) {
        convertedValue = tryConversion;
      }
      break;
    case kConfigDatatypeString:
      if (value !== undefined) {
        convertedValue = value.toString();
      }
      break;
    case kConfigDatatypeJson:
      try {
        convertedValue = JSON.parse(value);
      } catch (e) { }
      break;
    default:
      node.error(`Unsupported or invalid compare value type '${node.valueConfig.datatype}' configured!`);
    }

    if (convertedValue === undefined) {
      node.error(`Failed to convert value '${value}' to expected datatype '${node.valueConfig.datatype}'!`);
    }

    return convertedValue;
  }

  function compareToConfiguredDatatype(node, value) {
    let result = true;

    if (node.valueConfig.datatype == kConfigDatatypeJson) {
      result = isPureJsonObject(value);
    } else {
      const typeOfValue = typeof value;
      result = kSupportedDatatypesLanguageType.hasOwnProperty(typeOfValue) &&
           (kSupportedDatatypesLanguageType[typeOfValue] === node.valueConfig.datatype);
    }
    return result;
  }

  function isPureJsonObject(value) {
    let result = true;
    try {
      // Try to serialize the object. The used replaced will throw
      // an error if the object contains any datatype not supported
      // by pure JSON.
      // Supported JSON datatypes: null, bool, string, number, pure object, array
      JSON.stringify(value, function(key, value) {
        const typeOfValue = typeof value;
        if (value === null ||
            typeOfValue === 'boolean' ||
            typeOfValue === 'string' ||
            typeOfValue === 'number' ||
            Array.isArray(value) ||
            (typeOfValue === 'object' && value.constructor.name === `Object`)) {
          return value; // Continue stringification
        } else {
          throw new Error('Invalid JSON datatype!');
        }
      });
    } catch (e) {
      result = false;
    }
    return result;
  }

  function checkBlockIfCondition(node, currentValue) {
    let blockFlow = false;

    if (node.blockIfEnable === true) {
      const typeofCurrentValue = typeof currentValue;
      const typeofBlockIfCompareValue = typeof node.blockIfCompareValue;

      if (typeofCurrentValue === typeofBlockIfCompareValue) {
        switch (node.blockIfRule) {
        case kBlockIfRuleEq:
          blockFlow = isDeepStrictEqual(currentValue, node.blockIfCompareValue);
          break;
        case kBlockIfRuleNeq:
          blockFlow = !isDeepStrictEqual(currentValue, node.blockIfCompareValue);
          break;
        default:
          node.warn(`Unknown block-if rule '${node.blockIfRule}'. Skipping blocking value check.`);
        }
      } else {
        node.warn(`Type mismatch of block flow values. Type of persistent value: ${typeofCurrentValue}. ` +
                  `Type of compare value: ${typeofBlockIfCompareValue}. Skipping blocking value check.`);
      }
    }

    return blockFlow;
  }

  function isDeepStrictEqual(left, right) {
    let result = true;
    try {
      assert.deepStrictEqual(left, right, '');
    } catch (e) {
      // AssertionError thrown if objects are not equal
      result = false;
    }
    return result;
  }

  function deepCloneIfEnabled(node, value) {
    if (node.deepCloneValue) {
      return RED.util.cloneMessage(value);
    }
    return value;
  }

  // ---- Node main -------------------------------------------------------------------------------
  RED.nodes.registerType('persistent value', function(nodeConfig) {
    RED.nodes.createNode(this, nodeConfig);
    const node = this;

    // ---- Retrieve node properties and referenced config properties ----

    // Retrieve the selected config
    const configNode = RED.nodes.getNode(nodeConfig.valuesConfig);
    if (configNode === null) {
      reportIncorrectConfiguration(node);
      return null;
    }

    // Selected value by ID or name
    node.valueId = nodeConfig.valueId;
    node.value = nodeConfig.value;
    if (node.valueId !== undefined && !uuid.validate(node.valueId)) {
      reportIncorrectConfiguration(node);
      return null;
    }
    // Selectd value must be referenced via ID or name (deprecated)
    if (node.valueId === undefined && (node.value === undefined)) {
      reportIncorrectConfiguration(node);
      return null;
    }

    node.configName = configNode.name; // Name of the referenced configuration
    if (node.valueId) {
      node.valueConfig = configNode.values.find((value) => value.id === node.valueId);
      node.value = node.valueConfig.name; // Update name again in case of inconsistent value / ID config
    } else {
      // Until version 1.1.0 no ID was existing for every value. Therefore search via value name.
      node.valueConfig = configNode.values.find((value) => value.name === node.value);
    }

    node.command = nodeConfig.command || kCommandDefault;
    node.msgProperty = nodeConfig.msgProperty || kMsgPropertyDefault;

    node.deepCloneValue = nodeConfig.deepCloneValue || kDeepCloneValueDefault;

    node.outputPreviousValue = nodeConfig.outputPreviousValue || kOutputPreviousValueDefault;
    node.outputPreviousValueMsgProperty = nodeConfig.outputPreviousValueMsgProperty || kOutputPreviousValueMsgProperty;

    node.collectValues = nodeConfig.collectValues || kCollectValuesDefault;
    node.collectValuesMsgProperty = nodeConfig.collectValuesMsgProperty || kCollectValuesMsgProperty;

    node.blockIfEnable = nodeConfig.blockIfEnable || kBlockIfEnableDefault;
    node.blockIfRule = nodeConfig.blockIfRule || kBlockIfRuleDefault;
    node.blockIfCompareValue = node.blockIfEnable ?
      convertToExpectedType(node, nodeConfig.blockIfCompareValue) : undefined;

    node.on('input', function(msg) {
      // ---- Execute ----
      const context = getUsedContext(node);
      const contextKey = getContextKey(node);

      let currentValue = getContext(node, context, contextKey);
      currentValue = deepCloneIfEnabled(node, currentValue);

      if (!compareToConfiguredDatatype(node, currentValue)) {
        node.warn(`Persisted value ${node.configName} / ${node.value} does not have the configured datatype ` +
                  `'${node.valueConfig.datatype}'!`);
      }

      let onChangeMsg = null;

      // Determine command either from configuration or use dynamic override
      const command = determineCommand(node, msg);
      if (command === kCommandRead) {
        // ---- Command: Read ----
        RED.util.setMessageProperty(msg, node.msgProperty, currentValue, true);
        updateCollectedValues(node, msg, currentValue);
      } else if (command === kCommandWrite) {
        // ---- Command: Write ----
        let inputValue = RED.util.getMessageProperty(msg, node.msgProperty);
        if (inputValue === undefined) {
          node.error(`Passed msg does not have the configured property '${node.msgProperty}'`, msg);
          return;
        }

        inputValue = RED.util.getMessageProperty(msg, node.msgProperty);
        inputValue = deepCloneIfEnabled(node, inputValue);

        if (!compareToConfiguredDatatype(node, inputValue)) {
          node.error(`Passed value in msg.${node.msgProperty} does not have the configured datatype ` +
                     `'${node.valueConfig.datatype}'! Persistent value config: ${node.configName} / ${node.value}`);
          return;
        }

        addPreviousValue(node, msg, currentValue);
        updateCollectedValues(node, msg, inputValue, currentValue);

        if (!isDeepStrictEqual(inputValue, currentValue)) {
          setContext(node, context, contextKey, inputValue);
          onChangeMsg = msg;
        }

        currentValue = inputValue;
      } else {
        // ---- Command: unknown / unsupported ----
        node.error(`Unknown or unsupported persistent value command '${command}' used!`);
        return null;
      }

      // -- BlockIf --
      const blockFlow = checkBlockIfCondition(node, currentValue);
      if (blockFlow) {
        msg = null;
        onChangeMsg = null;
      }

      // ---- Output & Status ----
      buildNodeStatus(node, currentValue, blockFlow);
      node.send([msg, onChangeMsg]);
    });
  });

  // ---- Backend HTTP API ----

  // HTTP API to get the context variable / key name of a persisted value
  RED.httpAdmin.get('/persistentvalues/util/getcontextkey', function(req, res) {
    const configName = req.query.configName;
    const valueName = req.query.valueName;
    const name = getContextKeyFromNames(configName, valueName);
    res.json(name);
  });
}; // module.exports
