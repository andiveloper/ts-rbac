export type Scope = {
    name: string;
    weight: number;
};

export const NO_SCOPE: Scope = { name: 'no_scope', weight: -1 };

export const DEFAULT_SCOPES: { [key: string]: Scope } = {
    self: { name: 'self', weight: 1 },
    group: { name: 'group', weight: 2 },
    org: { name: 'org', weight: 3 },
    all: { name: 'all', weight: 4 },
};