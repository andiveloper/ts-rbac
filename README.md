# ts-rbac

Use `ts-rbac` if you need role-based access control in your TypeScript application, independent from your internal architecture: It works with REST endpoints in NodeJS, function calls triggered by Kafka or any other framework.

# Installation

```
npm install andiveloper/ts-rbac
```

# Concept

`ts-rbac` assumes that a user belongs to different groups within an organization. 
For authorization `roles` and `actions` are used. The following relations apply:

- A `subject` (person or service) can have many `roles`
- A `role` can inherit from other roles
- A `role` consists of many `actions`
- `Actions` are architecture-independent and can for example be named after use cases (e.g. "UploadImage") or after endpoints in a REST API (e.g.: "PostImage")
- `Actions` contain a `scope` which defines what entities can be accessed
- You can either define your own `scopes` or use a set of default `scopes`: "self", "group", "org" and "all":
  - "self" means only entities created by the user himself can be accessed
  - "group" means only entities that are owned by a group to which the user belongs can be accessed
  - "org" means all entities of the organization can be accessed
  - "all" means all entities of all organizations can be accessed ("superadmin")
- `scopes` have weights which determine the rank of the `scope`, e.g. the default scope "all" has the highest weight which means if access to a lower ranked scope is requested, e.g. "group" it is also granted
- When accessing an endpoint/use case:
  - Your API authenticates the user, e.g. for example through a JWT token or a session cookie
  - Your API retrieves the roles of the user from the JWT token, a database, ...
  - `ts-rbac` is used to calculate the actions of all the roles and inherited roles the user owns and checks if a action exists for the specific action needed to perform the action
  - On data access the "scope" must be checked by your action/use case or database query, for example: 
  ```
  (action.scope.self AND entity.createdBy === user.id) 
  OR (action.scope.group AND entity.ownerGroup in user.groups) 
  OR (action.scope.org AND entity.ownerOrg === user.organization)
  ```

# Usage
See `samples/sample.ts` and `test/sample.test.ts`

# Future work
- Add entity "attribute"-level actions:
  - Actions could contain a field called "attributes" which is an array of attributes of the entity that are allowed or denied to be accessed
  - For example: `{"attributes": ["!id", "modifiedTime", "!comments", "metadata.location"]}`, default is `[*]`
  
