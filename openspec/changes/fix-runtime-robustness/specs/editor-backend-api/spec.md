# Spec Delta

## MODIFIED Requirements

### Requirement: Configurations are mirrored in the backend

The configuration node SHALL keep a process-global registry of deployed configurations,
keyed by node id and holding `name` and `values`. The registry SHALL be updated when a
configuration node is instantiated and through the save and delete endpoints, so that the
value node's edit dialog can offer the values of a configuration that has not been deployed
yet. When a deploy removes a configuration node, its entry SHALL be removed from the
registry. A configuration node that is only restarted, by a modified deploy or by a
shutdown, SHALL keep its entry.

#### Scenario: Deployed configuration is registered
- **WHEN** a `persistent values config` node is deployed
- **THEN** it is retrievable through the get endpoint under its node id

#### Scenario: Configuration removed by a deploy is unregistered
- **WHEN** a deploy removes a deployed `persistent values config` node
- **THEN** the get endpoint answers its node id with HTTP 404

#### Scenario: Restarted configuration stays registered
- **WHEN** a deployed `persistent values config` node is stopped without being removed
- **THEN** it is still retrievable through the get endpoint under its node id
