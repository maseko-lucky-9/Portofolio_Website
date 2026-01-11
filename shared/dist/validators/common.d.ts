import { z } from 'zod';
export declare const uuidSchema: z.ZodString;
export declare const slugSchema: z.ZodString;
export declare const emailSchema: z.ZodString;
export declare const urlSchema: z.ZodString;
export declare const isoDateSchema: z.ZodString;
export declare const paginationParamsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const paginationMetaSchema: z.ZodObject<{
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    pages: z.ZodNumber;
    hasNext: z.ZodBoolean;
    hasPrev: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
}, {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
}>;
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const slugParamSchema: z.ZodObject<{
    slug: z.ZodString;
}, "strip", z.ZodTypeAny, {
    slug: string;
}, {
    slug: string;
}>;
export declare const searchParamsSchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    q?: string | undefined;
    search?: string | undefined;
}, {
    q?: string | undefined;
    search?: string | undefined;
}>;
export declare const filterParamsSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    featured: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    category?: string | undefined;
    tag?: string | undefined;
    featured?: boolean | undefined;
}, {
    status?: string | undefined;
    category?: string | undefined;
    tag?: string | undefined;
    featured?: boolean | undefined;
}>;
export declare const queryParamsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
} & {
    q: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
} & {
    status: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    tag: z.ZodOptional<z.ZodString>;
    featured: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
    status?: string | undefined;
    q?: string | undefined;
    search?: string | undefined;
    category?: string | undefined;
    tag?: string | undefined;
    featured?: boolean | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    status?: string | undefined;
    q?: string | undefined;
    search?: string | undefined;
    category?: string | undefined;
    tag?: string | undefined;
    featured?: boolean | undefined;
}>;
export declare const apiResponseSchema: <T extends z.ZodType>(dataSchema: T) => z.ZodObject<{
    data: T;
    meta: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        requestId?: string | undefined;
        version?: string | undefined;
    }, {
        timestamp: string;
        requestId?: string | undefined;
        version?: string | undefined;
    }>>;
    links: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    data: T;
    meta: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        requestId?: string | undefined;
        version?: string | undefined;
    }, {
        timestamp: string;
        requestId?: string | undefined;
        version?: string | undefined;
    }>>;
    links: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    data: T;
    meta: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
        version: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        requestId?: string | undefined;
        version?: string | undefined;
    }, {
        timestamp: string;
        requestId?: string | undefined;
        version?: string | undefined;
    }>>;
    links: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare const errorResponseSchema: z.ZodObject<{
    error: z.ZodObject<{
        statusCode: z.ZodNumber;
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodUnknown>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        statusCode: number;
        details?: unknown;
    }, {
        code: string;
        message: string;
        statusCode: number;
        details?: unknown;
    }>;
    meta: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        timestamp: string;
        requestId?: string | undefined;
    }, {
        timestamp: string;
        requestId?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    error: {
        code: string;
        message: string;
        statusCode: number;
        details?: unknown;
    };
    meta?: {
        timestamp: string;
        requestId?: string | undefined;
    } | undefined;
}, {
    error: {
        code: string;
        message: string;
        statusCode: number;
        details?: unknown;
    };
    meta?: {
        timestamp: string;
        requestId?: string | undefined;
    } | undefined;
}>;
export declare const paginatedResponseSchema: <T extends z.ZodType>(itemSchema: T) => z.ZodObject<{
    data: z.ZodArray<T, "many">;
    meta: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        pages: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
    links: z.ZodOptional<z.ZodObject<{
        first: z.ZodOptional<z.ZodString>;
        prev: z.ZodOptional<z.ZodString>;
        next: z.ZodOptional<z.ZodString>;
        last: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        first?: string | undefined;
        prev?: string | undefined;
        next?: string | undefined;
        last?: string | undefined;
    }, {
        first?: string | undefined;
        prev?: string | undefined;
        next?: string | undefined;
        last?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    data: T["_output"][];
    meta: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    links?: {
        first?: string | undefined;
        prev?: string | undefined;
        next?: string | undefined;
        last?: string | undefined;
    } | undefined;
}, {
    data: T["_input"][];
    meta: {
        page: number;
        limit: number;
        total: number;
        pages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    links?: {
        first?: string | undefined;
        prev?: string | undefined;
        next?: string | undefined;
        last?: string | undefined;
    } | undefined;
}>;
export declare const projectStatusSchema: z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>;
export declare const articleStatusSchema: z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>;
export declare const userRoleSchema: z.ZodEnum<["VIEWER", "EDITOR", "ADMIN"]>;
export declare const eventTypeSchema: z.ZodEnum<["PAGE_VIEW", "PROJECT_VIEW", "ARTICLE_VIEW", "LIKE", "SHARE", "CONTACT_SUBMIT", "NEWSLETTER_SUBSCRIBE", "DOWNLOAD", "EXTERNAL_LINK_CLICK"]>;
//# sourceMappingURL=common.d.ts.map