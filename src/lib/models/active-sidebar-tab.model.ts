import {
  toTypedRxJsonSchema,
  type ExtractDocumentTypeFromTypedRxJsonSchema,
  type RxJsonSchema,
} from "rxdb";

export const activeSideBarTabSchemaLiteral = {
  title: "activeSideBarTab",
  primaryKey: "activeTabId",
  type: "object",
  version: 4,
  properties: {
    activeTabId: {
      type: "string",
      default: "activeTabId",
      maxlength: 100,
    },
    activeTabName: {
      type: "string",
    },
  },
  required: ["activeTabName"],
} as const;

const schemaTyped = toTypedRxJsonSchema(activeSideBarTabSchemaLiteral);

export type ActiveSideBarTabDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

export const activeSideBarTabSchema: RxJsonSchema<ActiveSideBarTabDocType> =
  activeSideBarTabSchemaLiteral;