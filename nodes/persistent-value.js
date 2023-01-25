module.exports = function(RED) {
  // elements of the reference config
  const kConfigDatatypeBool = 'bool';
  const kConfigDatatypeNumber = 'num';
  const kConfigDatatypeString = 'str';
  const kConfigSupportedDatatype = new Map([
    // java typeof | config typed input
    ['boolean', kConfigDatatypeBool],
    ['number', kConfigDatatypeNumber],
    ['string', kConfigDatatypeString],
  ]);

  // elements of the node
  const kStorageDefault = 'default';
  const kMsgPropertyDefault = 'payload';

  const kCommandRead = 'read';
  const kCommandWrite = 'write';
  const kCommandDefault = kCommandRead;
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

  function buildNodeStatus(node, msgProperty, blockFlow) {
    let storage = node.config.storage;
    if (storage === kStorageDefault) {
      if (RED.settings.contextStorage !== undefined && RED.settings.contextStorage.default !== undefined) {
        storage += ` (${RED.settings.contextStorage.default})`;
      }
    }
    const blocked = blockFlow ? '[blocked]' : '';

    node.status({
      fill: 'green', shape: 'dot',
      text: `${msgProperty} [${node.config.datatype},${node.config.scope},${storage}]${blocked}`,
    });
  }

  function getUsedContext(node) {
    let context = node.context();
    if (node.config.scope === 'flow') {
      context = context.flow;
    }
    if (node.config.scope === 'global') {
      context = context.global;
    }
    return context;
  }

  function buildContextKeyName(node) {
    let contextKey = node.configName + '_' + node.value;
    contextKey = contextKey.replace(/ /g, '_'); // No spaces in context key allowed
    return contextKey;
  }

  function getContext(node, context, contextKey) {
    let currentValue = undefined;
    if (node.config.storage === kStorageDefault) {
      currentValue = context.get(contextKey);
    } else {
      currentValue = context.get(contextKey, node.config.storage);
    }

    // Apply default value if context contains no value
    if (currentValue === undefined) {
      currentValue = node.config.default;
    }
    return currentValue;
  }

  function setContext(node, context, contextKey, newValue) {
    if (node.config.storage === kStorageDefault) {
      context.set(contextKey, newValue);
    } else {
      context.set(contextKey, newValue, node.config.storage);
    }
  }

  function updateCollectedValues(node, msg, currentValue) {
    if (node.collectValues) {
      if (!msg.hasOwnProperty(node.collectValuesMsgProperty) ||
          (typeof msg[node.collectValuesMsgProperty] !== 'object')) {
        msg[node.collectValuesMsgProperty] = {};
      }
      const collectedValues = msg[node.collectValuesMsgProperty];

      const contextKey = buildContextKeyName(node);
      collectedValues[contextKey] = currentValue;
    }
  }

  function convertToExpectedType(node, value) {
    let convertedValue = undefined;
    switch (node.config.datatype) {
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
    default:
      node.error(`Unsupported compare value type '${node.config.datatype}' configured!`);
    }

    if (convertedValue === undefined) {
      node.error(`Failed to convert value '${value}' to expected datatype '${node.config.datatype}'!`);
    }

    return convertedValue;
  }

  function compareToConfiguredDatatype(node, value) {
    const typeOfValue = typeof value;
    return kConfigSupportedDatatype.has(typeOfValue) && (kConfigSupportedDatatype.get(typeOfValue) === node.config.datatype);
  }

  function checkBlockIfCondition(node, currentValue) {
    let blockFlow = false;

    if (node.blockIfEnable === true) {
      const typeofCurrentValue = typeof currentValue;
      const typeofBlockIfCompareValue = typeof node.blockIfCompareValue;

      if (typeofCurrentValue === typeofBlockIfCompareValue) {
        switch (node.blockIfRule) {
        case kBlockIfRuleEq:
          blockFlow = (currentValue === node.blockIfCompareValue);
          break;
        case kBlockIfRuleNeq:
          blockFlow = (currentValue !== node.blockIfCompareValue);
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

  // ---- Node main -------------------------------------------------------------------------------
  const persistentValueNode = function(nodeConfig) {
    RED.nodes.createNode(this, nodeConfig);
    const node = this;

    // ---- Retrieve node properties and referenced config properties ----

    // Retrieve the selected config
    const configNode = RED.nodes.getNode(nodeConfig.valuesConfig);
    if (configNode === null) {
      reportIncorrectConfiguration(node);
      return null;
    }

    node.config = configNode.values.find((value) => value.name === nodeConfig.value);
    node.configName = configNode.name; // Name of the referenced configuration
    node.value = nodeConfig.value; // selected value
    if (node.value === '' || node.value === undefined || node.value === null) {
      reportIncorrectConfiguration(node);
      return null;
    }

    node.command = nodeConfig.command || kCommandDefault;
    node.msgProperty = nodeConfig.msgProperty || kMsgPropertyDefault;

    node.collectValues = nodeConfig.collectValues || kCollectValuesDefault;
    node.collectValuesMsgProperty = nodeConfig.collectValuesMsgProperty || kCollectValuesMsgProperty;

    node.blockIfEnable = nodeConfig.blockIfEnable || kBlockIfEnableDefault;
    node.blockIfRule = nodeConfig.blockIfRule || kBlockIfRuleDefault;
    node.blockIfCompareValue = node.blockIfEnable ?
      convertToExpectedType(node, nodeConfig.blockIfCompareValue) : undefined;


    node.on('input', function(msg) {
      // ---- Execute ----
      const context = getUsedContext(node);
      const contextKey = buildContextKeyName(node);

      let currentValue = getContext(node, context, contextKey);
      if (!compareToConfiguredDatatype(node, currentValue)) {
        node.warn(`Persisted value ${node.configName} / ${node.value} does not have the configured datatype ` +
                  `'${node.config.datatype}'!`);
      }

      let onChangeMsg = null;

      // -- Command: Read --
      if (node.command === kCommandRead) {
        msg[node.msgProperty] = currentValue;
        updateCollectedValues(node, msg, currentValue);
      }
      // -- Command: Write --
      else if (node.command === kCommandWrite) {
        if (!msg.hasOwnProperty(node.msgProperty)) {
          node.error(`Passed msg does not have the configured property '${node.msgProperty}'`, msg);
          return;
        }

        const inputValue = msg[node.msgProperty];

        if (!compareToConfiguredDatatype(node, inputValue)) {
          node.error(`Passed value in msg.${node.msgProperty} does not have the configured datatype ` +
                     `'${node.config.datatype}'! Persistent value config: ${node.configName} / ${node.value}`);
          return;
        }

        updateCollectedValues(node, msg, inputValue);

        if (inputValue !== currentValue) {
          setContext(node, context, contextKey, inputValue);
          onChangeMsg = msg;
        }

        currentValue = inputValue;
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
  };
  RED.nodes.registerType('persistent value', persistentValueNode);
};
