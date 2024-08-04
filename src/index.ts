import { GeneratedTypes } from 'payload';
import { Config, Plugin } from 'payload/config';
import { AfterChangeHook, AfterDeleteHook } from 'payload/dist/collections/config/types';
import { CollectionConfig } from 'payload/types';

interface AuditLogOptions {
    collections?: (keyof Omit<GeneratedTypes['collections'], 'audit-logs'>)[];
    includeAuth?: boolean;
}

const defaultOptions: AuditLogOptions = {
    collections: [],
    includeAuth: false,
};

const auditLogPlugin = (options: AuditLogOptions = {}): Plugin => {
    const pluginOptions = { ...defaultOptions, ...options };

    return (config: Config): Config => {
        const auditLogCollection: CollectionConfig = {
            slug: 'audit-logs',
            admin: {
                useAsTitle: 'action',
            },
            access: {
                read: () => true,
            },
            fields: [
                {
                    name: 'collection',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'action',
                    type: 'select',
                    options: ['create', 'update', 'delete', 'read'],
                    required: true,
                },
                {
                    name: 'documentId',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'timestamp',
                    type: 'date',
                    required: true,
                },
                {
                    name: 'user',
                    type: 'relationship',
                    relationTo: config.admin?.user ?? 'users',
                    required: false,
                },
                {
                    name: 'changes',
                    type: 'json',
                    admin: {
                        description: 'Changes made in this operation',
                    },
                },
            ],
        };

        config.collections = [...(config.collections || []), auditLogCollection];

        const collectionsToAudit = [
            ...(pluginOptions.collections ?? []),
            ...(pluginOptions.includeAuth ? [config.admin?.user ?? 'users'] : []),
        ];

        config.collections = config.collections?.map((collection) => {
            if (collectionsToAudit.includes(collection.slug)) {
                const afterChange: AfterChangeHook<any> = async ({
                    req,
                    operation,
                    doc,
                    previousDoc,
                }) => {
                    const action = operation === 'create' ? 'create' : 'update';
                    let changes = null;

                    if (action === 'update' && previousDoc) {
                        changes = Object.keys(doc).reduce((acc, key) => {
                            if (JSON.stringify(doc[key]) !== JSON.stringify(previousDoc[key])) {
                                acc[key] = {
                                    old: previousDoc[key],
                                    new: doc[key],
                                };
                            }
                            return acc;
                        }, {} as Record<string, any>);
                    }

                    await req.payload.create({
                        collection: 'audit-logs',
                        data: {
                            collection: collection.slug,
                            action,
                            documentId: String(doc.id ?? previousDoc?.id ?? ''),
                            timestamp: new Date().toISOString(),
                            user: req.user?.id,
                            changes: action === 'update' ? changes : doc,
                        },
                    });
                    return doc;
                };

                const afterDelete: AfterDeleteHook = async ({ req, doc }) => {
                    await req.payload.create({
                        collection: 'audit-logs',
                        data: {
                            collection: collection.slug,
                            action: 'delete',
                            documentId: String(doc.id ?? ''),
                            timestamp: new Date().toISOString(),
                            user: req.user?.id,
                            changes: doc, // Store the entire document being deleted
                        },
                    });
                };

                const hooks: any = {
                    afterChange: [afterChange, ...(collection.hooks?.afterChange || [])],
                    afterDelete: [afterDelete, ...(collection.hooks?.afterDelete || [])],
                };

                return {
                    ...collection,
                    hooks: {
                        ...collection.hooks,
                        ...hooks,
                    },
                };
            }
            return collection;
        });

        return config;
    };
};

export default auditLogPlugin;
