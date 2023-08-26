module.exports = function(RED) {
  const logger = require('../resources/logger');
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
  const kCommandReset = 'reset';
  const kSupportedCommands = [kCommandRead, kCommandWrite, kCommandReset];

  const kCommandDefault = kCommandRead;

  const kDeepCloneValueDefault = false;

  const kDynamicControlsDefault = false;
  const kDynamicCommandMsgPropertyDefault = 'command';
  const kDynamicValueMsgPropertyDefault = 'value';

  const kOutputPreviousValueDefault = false; // Do not output the previous value by default
  const kOutputPreviousValueMsgProperty = 'previous_value';

  const kCollectValuesDefault = false; // Do not collect values by default
  const kCollectValuesMsgProperty = 'values';

  const kBlockIfRuleEq = 'eq';
  const kBlockIfRuleNeq = 'neq';

  const kBlockIfEnableDefault = false;
  const kBlockIfRuleDefault = kBlockIfRuleEq;

  const kOutputMetaDataDefault = false; // Do not output the meta data by default
  const kOutputMetaDataMsgPropertyDefault = 'meta';

  // ---- Utility functions -----------------------------------------------------------------------
  function reportIncorrectConfiguration(node) {
    logger.logError(`Incorrect or inconsistent configuration of persistent-values node ` +
                    `'${node.name}' with ID ${node.id}. Skipping further processing.`, node);
  }

  function buildNodeStatus(node, valueConfig, currentValue, blockFlow) {
    let value = currentValue;
    if (valueConfig.datatype === kConfigDatatypeJson) {
      value = `{JSON}`;
    }

    const metaInfos = []; // List of meta-infos shown behind the value

    if (valueConfig !== node.valueConfig) {
      metaInfos.push(valueConfig.name);
    }

    metaInfos.push(kSupportedDatatypesByTypedInput[valueConfig.datatype]);
    metaInfos.push(valueConfig.scope);

    let storage = valueConfig.storage;
    if (storage === kStorageDefault) {
      if (RED.settings.contextStorage !== undefined && RED.settings.contextStorage.default !== undefined) {
        storage += ` (${RED.settings.contextStorage.default})`;
      }
    }
    metaInfos.push(storage);

    node.status({
      fill: `${blockFlow ? 'red' : 'green'}`,
      shape: 'dot',
      text: `${value} [${metaInfos.join(',')}]`,
    });
  }

  function determineValueConfig(node, msg) {
    let valueConfig = node.valueConfig;

    if (node.dynamicControl === true) { // Dynamic controls enabled?
      const msgValue = RED.util.getMessageProperty(msg, node.dynamicValueMsgProperty);
      // value override property set?
      if (msgValue !== undefined) {
        const foundValueConfig = node.valueConfigs.find((value) => value.name === msgValue);
        if (foundValueConfig !== undefined) {
          valueConfig = foundValueConfig;
        } else {
          logger.logWarning(`Persistent value '${msgValue}' dynamically selected with ` +
                            `msg.${node.dynamicValueMsgProperty} not found! ` +
                            `Falling back to configured value '${valueConfig.name}'. ` +
                            `Known persistent values of the configuration '${node.configName}': ` +
                            `${node.valueConfigs.map((value) => {
                              return value.name;
                            }).join(', ')}`, node);
        }
      }
    }
    return valueConfig;
  }

  function determineCommand(node, msg) {
    let command = node.command;

    // Due to backward compatibility with 1.x versions the node.dynamicControl
    // is not necessary to allow dynamic command override.
    // With breaking change 2.x the behaviour will be aligned with dynamic value override.

    // Command overwrite by msg.command property?
    let msgCommand = RED.util.getMessageProperty(msg, node.dynamicCommandMsgProperty);
    if (msgCommand !== undefined) {
      if (typeof msgCommand === 'string') {
        msgCommand = msgCommand.trim().toLowerCase();
      }
      if (kSupportedCommands.includes(msgCommand)) {
        command = msgCommand;
      } else {
        logger.logWarning(`Command '${msgCommand}' set via msg.${node.dynamicCommandMsgProperty} is not known / supported!` +
                          ` Falling back to configured command '${command}'.` +
                          ` Supported commands: ${kSupportedCommands.join(', ')}`
        , node);
      }
    }
    return command;
  }

  function getUsedContext(node, valueConfig) {
    let context = undefined;

    switch (valueConfig.scope) {
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

  function getContextKey(node, valueConfig) {
    return getContextKeyFromNames(node.configName, valueConfig.name);
  }

  function getContextKeyFromNames(configName, valueName) {
    let contextKey = configName + '_' + valueName;
    contextKey = contextKey.replace(/ /g, '_'); // No spaces in context key allowed
    return contextKey;
  }

  function getContext(valueConfig, context, contextKey) {
    let currentValue = undefined;
    if (valueConfig.storage === kStorageDefault) {
      currentValue = context.get(contextKey);
    } else {
      currentValue = context.get(contextKey, valueConfig.storage);
    }

    return currentValue;
  }

  function getDefaultValue(valueConfig) {
    let value = valueConfig.default;

    if (valueConfig.datatype === kConfigDatatypeJson) {
      value = JSON.parse(value);
    }

    return value;
  }

  function setContext(valueConfig, context, contextKey, newValue) {
    if (valueConfig.storage === kStorageDefault) {
      context.set(contextKey, newValue);
    } else {
      context.set(contextKey, newValue, valueConfig.storage);
    }
  }

  function outputPreviousValue(node, msg, previousValue) {
    if (node.outputPreviousValue) {
      RED.util.setMessageProperty(msg, node.outputPreviousValueMsgProperty, previousValue, true);
    }
  }

  function outputMetaData(node, msg, valueConfig, command) {
    if (node.outputMetaData) {
      const metaData = {
        config: node.configName,
        value: valueConfig.name,
        datatype: valueConfig.datatype,
        default: valueConfig.default,
        scope: valueConfig.scope,
        storage: valueConfig.storage,
        description: valueConfig.description !== undefined ? valueConfig.description : '',
        command: command,
      };
      RED.util.setMessageProperty(msg, node.outputMetaDataMsgProperty, metaData, true);
    }
  }

  function updateCollectedValues(node, valueConfig, msg, currentValue, previousValue) {
    if (node.collectValues) {
      let collectedValues = RED.util.getMessageProperty(msg, node.collectValuesMsgProperty);
      if ((collectedValues === undefined) || (typeof collectedValues !== 'object')) {
        if (RED.util.setMessageProperty(msg, node.collectValuesMsgProperty, {}, true)) {
          collectedValues = RED.util.getMessageProperty(msg, node.collectValuesMsgProperty);
        } else {
          logger.logWarning(`Failed to create Object at msg.${node.collectValuesMsgProperty}. ` +
                            `Creation only possible for object types!`, node);
          return;
        }
      }

      const contextKey = getContextKey(node, valueConfig);
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

  function convertToExpectedType(node, valueConfig, value) {
    let convertedValue = undefined;
    switch (valueConfig.datatype) {
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
      logger.logError(`Unsupported or invalid compare value type '${valueConfig.datatype}' configured!`, node);
    }

    if (convertedValue === undefined) {
      logger.logError(`Failed to convert value '${value}' to expected datatype '${valueConfig.datatype}'!`, node);
    }

    return convertedValue;
  }

  function compareToConfiguredDatatype(valueConfig, value) {
    let result = true;

    if (valueConfig.datatype == kConfigDatatypeJson) {
      result = isPureJsonObject(value);
    } else {
      const typeOfValue = typeof value;
      result = kSupportedDatatypesLanguageType.hasOwnProperty(typeOfValue) &&
           (kSupportedDatatypesLanguageType[typeOfValue] === valueConfig.datatype);
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
          logger.logWarning(`Unknown block-if rule '${node.blockIfRule}'. Skipping blocking value check.`, node);
        }
      } else {
        logger.logWarning(`Type mismatch of block flow values. Type of persistent value: ${typeofCurrentValue}. ` +
                          `Type of compare value: ${typeofBlockIfCompareValue}. Skipping blocking value check.`, node);
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

    // ---- Get node settings and referenced config properties ----

    // Retrieve the selected config
    const configNode = RED.nodes.getNode(nodeConfig.valuesConfig);
    if (configNode === null) {
      reportIncorrectConfiguration(node);
      return null;
    }
    node.configName = configNode.name; // Name of the referenced configuration

    // Selected value by ID or name
    node.valueId = nodeConfig.valueId;
    node.valueName = nodeConfig.value;
    if ((node.valueId !== undefined) && (!uuid.validate(node.valueId))) {
      reportIncorrectConfiguration(node);
      return null;
    }
    // Selected value must be referenced via ID or name (deprecated)
    if ((node.valueId === undefined) && (node.valueName === undefined)) {
      reportIncorrectConfiguration(node);
      return null;
    }

    node.valueConfigs = configNode.values; // All available value configurations
    if (node.valueId) {
      node.valueConfig = node.valueConfigs.find((value) => value.id === node.valueId);
      node.valueName = node.valueConfig.name; // Update name again in case of inconsistent value / ID config
    } else {
      // Until version 1.1.0 no ID was existing for every value. Therefore search via value name.
      node.valueConfig = node.valueConfigs.find((value) => value.name === node.valueName);
    }

    node.command = nodeConfig.command || kCommandDefault;
    node.msgProperty = nodeConfig.msgProperty || kMsgPropertyDefault;

    node.deepCloneValue = nodeConfig.deepCloneValue || kDeepCloneValueDefault;

    node.dynamicControl = nodeConfig.dynamicControl || kDynamicControlsDefault;
    node.dynamicCommandMsgProperty = nodeConfig.dynamicCommandMsgProperty || kDynamicCommandMsgPropertyDefault;
    node.dynamicValueMsgProperty = nodeConfig.dynamicValueMsgProperty || kDynamicValueMsgPropertyDefault;

    node.outputPreviousValue = nodeConfig.outputPreviousValue || kOutputPreviousValueDefault;
    node.outputPreviousValueMsgProperty = nodeConfig.outputPreviousValueMsgProperty || kOutputPreviousValueMsgProperty;

    node.collectValues = nodeConfig.collectValues || kCollectValuesDefault;
    node.collectValuesMsgProperty = nodeConfig.collectValuesMsgProperty || kCollectValuesMsgProperty;

    node.blockIfEnable = nodeConfig.blockIfEnable || kBlockIfEnableDefault;
    node.blockIfRule = nodeConfig.blockIfRule || kBlockIfRuleDefault;
    node.blockIfCompareValue = node.blockIfEnable ?
      convertToExpectedType(node, node.valueConfig, nodeConfig.blockIfCompareValue) : undefined;

    node.outputMetaData = nodeConfig.outputMetaData || kOutputMetaDataDefault;
    node.outputMetaDataMsgProperty = nodeConfig.outputMetaDataMsgProperty || kOutputMetaDataMsgPropertyDefault;

    node.on('input', function(msg) {
      // ---- Execute ----

      // Determine selected value config either from configuration or use dynamic msg override
      const valueConfig = determineValueConfig(node, msg);

      const context = getUsedContext(node, valueConfig);
      if (context === undefined) {
        logger.logError(`Failed to get context scope '${valueConfig.scope}' of ${node.configName} / ${valueConfig.name}`, node);
        return;
      }

      const contextKey = getContextKey(node, valueConfig);

      // Get value from context store
      let currentValue = getContext(valueConfig, context, contextKey);

      // If no value is present in context store, get the default value
      const defaultValue = getDefaultValue(valueConfig);
      let currentValueIsDefault = false;
      if (currentValue === undefined) {
        currentValueIsDefault = true;
        currentValue = defaultValue;
      }

      // Deep clone if option is enabled
      currentValue = deepCloneIfEnabled(node, currentValue);

      if (!compareToConfiguredDatatype(valueConfig, currentValue)) {
        logger.logWarning(`Persisted value ${node.configName} / ${valueConfig.name} does not have the configured datatype ` +
                          `'${valueConfig.datatype}'!`, node);
      }

      let onChangeMsg = null;

      // Determine command either from configuration or use dynamic override
      const command = determineCommand(node, msg);
      if (command === kCommandRead) {
        // ---- Command: Read ----
        RED.util.setMessageProperty(msg, node.msgProperty, currentValue, true);
        updateCollectedValues(node, valueConfig, msg, currentValue);
      } else if (command === kCommandWrite) {
        // ---- Command: Write ----
        let inputValue = RED.util.getMessageProperty(msg, node.msgProperty);
        if (inputValue === undefined) {
          logger.logError(`Passed msg does not have the configured input property '${node.msgProperty}'`, node, msg);
          return;
        }

        inputValue = RED.util.getMessageProperty(msg, node.msgProperty);
        inputValue = deepCloneIfEnabled(node, inputValue);

        if (!compareToConfiguredDatatype(valueConfig, inputValue)) {
          logger.logError(`Passed value in msg.${node.msgProperty} does not have the configured datatype ` +
                          `'${valueConfig.datatype}'! ` +
                          `Persistent value config: ${node.configName} / ${valueConfig.name}`, node, msg);
          return;
        }

        outputPreviousValue(node, msg, currentValue);
        updateCollectedValues(node, valueConfig, msg, inputValue, currentValue);

        // Only write context if:
        //  - current value is a default value (allow writing of input values equal to default)
        //  - input value differs from the current value
        if (currentValueIsDefault || (!isDeepStrictEqual(inputValue, currentValue))) {
          setContext(valueConfig, context, contextKey, inputValue);
          onChangeMsg = msg;
        }

        currentValue = inputValue;
      } else if (command === kCommandReset) {
        // ---- Command: Reset ----
        const previousValue = currentValue;
        outputPreviousValue(node, msg, previousValue);

        if (currentValueIsDefault || (!isDeepStrictEqual(currentValue, defaultValue))) {
          setContext(valueConfig, context, contextKey, defaultValue);

          currentValue = deepCloneIfEnabled(node, defaultValue);
          onChangeMsg = msg;
        }

        updateCollectedValues(node, valueConfig, msg, currentValue, previousValue);
        RED.util.setMessageProperty(msg, node.msgProperty, currentValue, true);
      } else {
        // ---- Command: unknown / unsupported ----
        logger.logError(`Unknown or unsupported persistent value command '${command}' used!`, node);
        return null;
      }

      // -- BlockIf --
      const blockFlow = checkBlockIfCondition(node, currentValue);
      if (blockFlow) {
        msg = null;
        onChangeMsg = null;
      }

      // -- Output Meta Data --
      outputMetaData(node, msg, valueConfig, command);

      // ---- Output & Status ----
      buildNodeStatus(node, valueConfig, currentValue, blockFlow);
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
