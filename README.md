# NetIQ IDM Validator Skill Builder

This project is a specialized skill designed for the **NetIQ IDM Validator 2.0** platform. 

It provides a structured framework for building, managing, and executing integration test suites within NetIQ Identity Manager environments. By leveraging this skill, developers can efficiently orchestrate actions across multiple connectors (such as eDirectory, LDAP, Active Directory, HTTP, and JDBC), define robust retry-aware assertions, and create reusable test templates.

## What's Inside
- **Connector & Action Reference**: A comprehensive mapping of available connectors and their supported actions based on the Validator schema.
- **Test Authoring Patterns**: Best practices for structuring test suites (PRETEST, TEST, POSTTEST phases) to ensure isolation and reliability.
- **Integration Validation Tools**: Utilities like the WS Listener to black-box validate payloads emitted by downstream systems.
- **Assertion Semantics**: Guidelines for using comparison operators, retry logic, and variable expansion effectively.
This skill streamlines the process of creating Validator JSON test suites, ensuring they align with the semantic model and capabilities of the NetIQ IDM Validator 2.0 runtime.