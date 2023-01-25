# Persistent Values for NodeRED

[![MIT License](https://img.shields.io/github/license/waldbaer/node-red-persistent-values?style=flat-square)](https://opensource.org/licenses/MIT)
[![GitHub issues open](https://img.shields.io/github/issues/waldbaer/node-red-persistent-values?style=flat-square)](https://github.com/waldbaer/node-red-persistent-values/issues)
[![GitHub Actions](https://github.com/waldbaer/node-red-persistent-values/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/waldbaer/node-red-persistent-values/actions/workflows/node.js.yml)
[![Coverage Status](https://coveralls.io/repos/github/waldbaer/node-red-persistent-values/badge.svg?branch=master)](https://coveralls.io/github/waldbaer/node-red-persistent-values?branch=master)

A user-friendly abstraction of the NodeRED context stores.

The idea behind persistent values is the user-friendly abstraction of the NodeRED core
[context functionality](https://nodered.org/docs/user-guide/context).
Instead of using a string name to access the context storage a central configuration node with
all known persistent values is used.

The persistent values itself can then be comfortably accessed with nodes just referencing the central
configuration and the persistent value to be accessed.

Persistent values are typically states, configuration options etc. which shall survice a restart of NodeRED.

# Installation
[![NPM](https://nodei.co/npm/@waldbaer/node-red-persistent-values.png?downloads=true)](https://www.npmjs.com/package/@waldbaer/node-red-persistent-values)

You can install the nodes using the NodeRED 'Manage palette' in the side bar.

Or run the following command in the root directory of your NodeRED installation

```
npm install @waldbaer/node-red-persistent-values
```

# Changelog
Changes can be followed [here](/CHANGELOG.md).

# Usage
## Examples
See folder [/examples](/examples) or via NodeRED 🠖 Import 🠖 Examples.
