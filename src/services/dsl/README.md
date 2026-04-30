# DSL (Domain Specific Language) Documentation

This directory contains the modular DSL engine components for the JSON-driven EmailService.

## Architecture

The DSL engine is split into focused, testable modules:

- **template-resolver.ts** - Resolves template variables like `{auth.token}`, `{timestamp}`, `{random}`
- **path-extractor.ts** - Extracts values from nested objects using dot notation
- **request-builder.ts** - Builds HTTP requests based on operation configuration
- **response-parser.ts** - Parses API responses based on configuration

## Template Variables

Supported template variables in parameter values:

- `{auth.token}` - Authentication token from context
- `{timestamp}` - Current Unix timestamp
- `{random}` - Random string (9 characters)
- `{instanceUrl}` - Dynamic instance URL for multi-instance providers
- `{variableName}` - Custom variable from context.variables

### Example

```json
{
  "requiredParams": {
    "sid_token": "{auth.token}",
    "_t": "{timestamp}",
    "_r": "{random}"
  }
}
```

## Path Extraction

Response fields use dot notation for nested path extraction:

- `field` - Top-level field
- `result.email` - Nested field
- `result.email.address` - Deeply nested field

### Special Paths

- `!error` - Negation check (returns true if error is falsy)
- `` (empty string) - Returns the entire object

### Example

```json
{
  "response": {
    "successPath": "!error",
    "dataPath": "result",
    "fields": {
      "address": "email.address",
      "id": "email.id",
      "token": "token"
    }
  }
}
```

## API Styles

### Query Parameter Based (e.g., Guerrilla Mail)

Uses `f` query parameter to specify function:

```json
{
  "function": "get_email_address"
}
```

Generates: `https://api.example.com/ajax.php?f=get_email_address&ip=127.0.0.1`

### RESTful Path Based (e.g., Burner.kiwi)

Uses URL path to specify function:

```json
{
  "function": "/inbox/{inboxId}/messages"
}
```

Generates: `https://api.example.com/inbox/abc123/messages`

The EmailService automatically detects the style based on whether the function field starts with `/`.

## Authentication Types

### Query Parameter Authentication

```json
{
  "auth": {
    "type": "query_parameter",
    "paramName": "sid_token"
  }
}
```

Adds token as query parameter: `?sid_token=abc123`

### Header Authentication

```json
{
  "auth": {
    "type": "header",
    "paramName": "X-Burner-Key"
  }
}
```

Adds token as header: `X-Burner-Key: abc123`

## Multi-Instance Providers

Configuration for providers with multiple instances:

```json
{
  "apiUrl": "{instanceUrl}",
  "multiInstance": {
    "enabled": true,
    "randomSelectionDefault": true
  }
}
```

The instance URL is passed via `context.instanceUrl` when calling the service.

## Force New Session

Configuration for cache-busting and forcing new sessions:

```json
{
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
  }
}
```

## Error Handling

Configuration for error detection:

```json
{
  "errorHandling": {
    "errorPath": "error",
    "errorMessagePath": "error.message"
  }
}
```

## Using the DSL Components

### Template Resolver

```typescript
import { resolveTemplateValue } from '@/services/dsl/template-resolver.js';

const value = resolveTemplateValue('{auth.token}', {
  auth: { token: 'abc123' }
});
// Returns: 'abc123'
```

### Path Extractor

```typescript
import { extractPath } from '@/services/dsl/path-extractor.js';

const data = { result: { email: { address: 'test@example.com' } } };
const value = extractPath(data, 'result.email.address');
// Returns: 'test@example.com'
```

### Request Builder

```typescript
import { buildRequest } from '@/services/dsl/request-builder.js';

const { url, options } = buildRequest(config, operation, context);
```

### Response Parser

```typescript
import { parseResponse, checkForErrors } from '@/services/dsl/response-parser.js';

checkForErrors(data, operation.errorHandling);
const result = parseResponse(data, operation.response);
```

## Testing

Each module is designed to be easily unit testable:

```typescript
import { resolveTemplateValue } from '@/services/dsl/template-resolver.js';

describe('resolveTemplateValue', () => {
  it('should resolve {auth.token}', () => {
    const result = resolveTemplateValue('{auth.token}', {
      auth: { token: 'test' }
    });
    expect(result).toBe('test');
  });
});
```

## Benefits of Modular DSL

1. **Testability** - Each module can be tested independently
2. **Maintainability** - Changes to one aspect don't affect others
3. **Reusability** - Modules can be used in other contexts
4. **Clarity** - Each module has a single, well-defined responsibility
5. **Performance** - Smaller modules can be tree-shaken if needed
