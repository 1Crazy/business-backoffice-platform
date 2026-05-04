import type { OpenAPIObject } from "@nestjs/swagger";

export type SchemaDescriptionModule = {
  schemaDescriptions?: Record<string, string>;
  propertyDescriptions?: Record<string, string>;
  enumDescriptions?: Record<string, Record<string, string>>;
};

const COMMON_PROPERTY_DESCRIPTION_FALLBACKS: Record<string, string> = {
  id: "记录 ID。",
  name: "名称。",
  code: "编码。",
  title: "标题。",
  description: "说明。",
  status: "状态。",
  type: "类型。",
  content: "内容。",
  comment: "备注。",
  createdAt: "创建时间。",
  updatedAt: "更新时间。",
  submittedAt: "提交时间。",
  completedAt: "完成时间。",
  success: "是否执行成功。",
  enabled: "是否启用。",
  pending: "是否存在待确认状态。",
  page: "当前页码。",
  pageSize: "每页条数。",
  total: "总记录数。",
  totalPages: "总页数。",
  items: "当前页数据列表。",
  sortBy: "实际生效的排序字段。",
  sortOrder: "实际生效的排序方向。",
  user: "当前用户信息。",
  permissions: "权限编码列表。",
  roleCodes: "角色编码列表。",
  dataScopes: "数据范围编码列表。",
  recoveryCodes: "恢复码列表。",
  challenge: "挑战信息。",
  formData: "表单数据。",
  fileName: "文件名。",
  mimeType: "文件 MIME 类型。"
};

function mergeSchemaDescriptions(modules: SchemaDescriptionModule[]): Record<string, string> {
  const merged = Object.assign({}, ...modules.map((module) => module.schemaDescriptions ?? {}));

  for (const module of modules) {
    for (const [enumName, descriptionMap] of Object.entries(module.enumDescriptions ?? {})) {
      merged[enumName] = Object.entries(descriptionMap)
        .map(([value, description]) => `${value}: ${description}`)
        .join("\n");
    }
  }

  return merged;
}

function mergePropertyDescriptions(modules: SchemaDescriptionModule[]): Record<string, string> {
  return Object.assign({}, ...modules.map((module) => module.propertyDescriptions ?? {}));
}

export function applySchemaDescriptionModules(document: OpenAPIObject, ...modules: SchemaDescriptionModule[]): void {
  const schemaDescriptions = mergeSchemaDescriptions(modules);
  const propertyDescriptions = mergePropertyDescriptions(modules);
  const schemas = document.components?.schemas ?? {};

  for (const [schemaName, schema] of Object.entries(schemas as Record<string, any>)) {
    if (!schema || typeof schema !== "object") {
      continue;
    }

    if (!schema.description && schemaDescriptions[schemaName]) {
      schema.description = schemaDescriptions[schemaName];
    }

    const properties = schema.properties as Record<string, any> | undefined;
    if (!properties) {
      continue;
    }

    for (const [propertyName, propertySchema] of Object.entries(properties)) {
      if (!propertySchema || typeof propertySchema !== "object") {
        continue;
      }

      const explicitDescription = propertyDescriptions[`${schemaName}.${propertyName}`];
      const fallbackDescription = COMMON_PROPERTY_DESCRIPTION_FALLBACKS[propertyName];

      if (explicitDescription) {
        propertySchema.description = explicitDescription;
        continue;
      }

      if (!propertySchema.description && fallbackDescription) {
        propertySchema.description = fallbackDescription;
      }
    }
  }
}
