# PayloadCMS Audit Log Plugin

This plugin adds comprehensive audit logging functionality to your PayloadCMS application. It logs create, update, and delete operations for specified collections, including detailed changes for update operations.

## Features

-   Log create, update, and delete operations for specified collections
-   Detailed change tracking for update operations
-   Option to include the auth collection (users) in the audit
-   Stores full document data for create and delete operations

## Installation

```bash
npm install @rumess/payload-audit-log
```

## Usage

In your Payload configuration file:

```javascript
import { buildConfig } from "payload/config";
import auditLogPlugin from "@rumess/payload-audit-log";

export default buildConfig({
    plugins: [
        auditLogPlugin({
            collections: ["posts", "products"],
            includeAuth: true,
        }),
    ],
    // ... rest of your config
});
```

## Options

-   `collections`: An array of collection slugs to be audited. Default: `[]`
-   `includeAuth`: Whether to include the auth collection (users) in the audit. Default: `false`

## Audit Log Structure

The plugin creates an `audit-logs` collection with the following fields:

-   `collection`: The name of the collection being audited
-   `action`: The type of operation (create, update, delete)
-   `documentId`: The ID of the document being operated on
-   `timestamp`: The time of the operation
-   `user`: The user who performed the operation (if available)
-   `changes`:
    -   For create: The entire new document
    -   For update: An object showing old and new values of changed fields
    -   For delete: The entire deleted document

## Example

After an update operation on a `posts` collection, an audit log entry might look like this:

```json
{
    "collection": "posts",
    "action": "update",
    "documentId": "123456789",
    "timestamp": "2023-05-20T14:30:00Z",
    "user": "user123",
    "changes": {
        "title": {
            "old": "Old Title",
            "new": "New Title"
        },
        "content": {
            "old": "Old content here",
            "new": "Updated content here"
        }
    }
}
```

## License

MIT
