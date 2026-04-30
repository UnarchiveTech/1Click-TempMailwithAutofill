# Provider Configuration

This directory contains JSON configurations for email providers used by the JSON-driven EmailService.

## Overview

The EmailService is a configuration-driven HTTP client that reads provider configurations from JSON files instead of using hardcoded provider-specific code. This makes it easy to add new providers without writing TypeScript code.

## Adding a New Provider

1. Create a new JSON file in this directory (e.g., `new-provider.json`)
2. Define the provider configuration following the schema below
3. The provider will be automatically loaded by the `provider-loader.ts` utility

## Provider Configuration Schema

```json
{
  "name": "Provider Name",
  "id": "provider-id",
  "apiUrl": "https://api.example.com",
  "auth": {
    "type": "query_parameter" | "header",
    "paramName": "token",
    "description": "Authentication description"
  },
  "operations": {
    "operationName": {
      "method": "GET" | "POST" | "PUT" | "DELETE",
      "function": "api_function_name",
      "requiredParams": {
        "param1": "value1",
        "param2": "{variable}"
      },
      "optionalParams": {
        "param3": "value3"
      },
      "response": {
        "successPath": "!error",
        "dataPath": "result",
        "fields": {
          "localField": "api_field"
        }
      },
      "errorHandling": {
        "errorPath": "error",
        "errorMessagePath": "error.message"
      }
    }
  },
  "expiry": {
    "duration": 3600000,
    "renewable": true,
    "renewalMethod": "method_name"
  },
  "customEmail": {
    "supported": true,
    "operation": "operation_name"
  },
  "headers": {
    "default": {},
    "credentials": "include",
    "cache": "default"
  },
  "forceNewSession": {
    "enabled": true,
    "params": {
      "_t": "{timestamp}",
      "_r": "{random}",
      "_fresh": "1"
    },
    "headers": {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Requested-With": "XMLHttpRequest"
    },
    "credentials": "omit",
    "cache": "no-cache"
  },
  "multiInstance": {
    "enabled": true,
    "randomSelectionDefault": true
  }
}
```

## Template Variables

The following template variables can be used in parameter values:

- `{auth.token}` - The authentication token from the context
- `{timestamp}` - Current Unix timestamp
- `{random}` - Random string
- `{instanceUrl}` - Dynamic instance URL for multi-instance providers
- `{variableName}` - Custom variable from context

## Path Variables

For RESTful APIs, path variables can be used in the function field:
- `/inbox/{inboxId}` - Replaces {inboxId} with value from context.variables
- `/inbox/{inboxId}/messages` - Multiple path variables

## Path Extraction

Response fields use dot notation for nested path extraction:

- `field` - Top-level field
- `result.email` - Nested field
- `!error` - Negation check (returns true if error is falsy)

## API Styles

### Query Parameter Based (e.g., Guerrilla Mail)
- Uses `f` query parameter to specify function
- Parameters passed as query parameters
- Example: `https://api.example.com/ajax.php?f=get_email_address&ip=127.0.0.1`

### RESTful Path Based (e.g., Burner.kiwi)
- Uses URL path to specify function
- Parameters passed as path variables or query parameters
- Example: `https://api.example.com/api/v2/inbox/{inboxId}/messages`

The EmailService automatically detects the style based on whether the function field starts with `/`.

## Multi-Instance Providers

Some providers (like Burner.kiwi) have multiple instances with different base URLs. The configuration supports this via:
- `apiUrl` can include `{instanceUrl}` template variable
- `multiInstance.enabled` set to `true`
- `multiInstance.randomSelectionDefault` set to `true` for random instance selection

The instance URL is passed via `context.instanceUrl` when calling the service.

## Examples

### Guerrilla Mail
See `guerrilla.json` for a complete example of a query parameter based API.

### Burner.kiwi
See `burner.json` for a complete example of a RESTful API with multi-instance support.

## Using the EmailService

```typescript
import { loadProviderConfig, EmailService } from '@/services/email-service.js';

const config = await loadProviderConfig('guerrilla');
const service = new EmailService(config, browser);

const result = await service.executeOperation('createInbox', {
  auth: { token: '...' },
  variables: { customParam: 'value' },
  instanceUrl: 'https://api.example.com' // For multi-instance providers
});
```

## Provider Registry

Known provider IDs:
- `guerrilla` - Guerrilla Mail
- `burner` - Burner.kiwi (multi-instance with random selection default)
