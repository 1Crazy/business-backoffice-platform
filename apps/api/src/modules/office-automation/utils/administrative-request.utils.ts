/** 行政申请工具：负责把固定流程表单归一化为统一草稿，并生成稳定的申请编号。 */
import { BadRequestException } from "@nestjs/common";
import { AdministrativeRequestType, Prisma } from "@prisma/client";

import { CreateAdministrativeRequestDto } from "../dto/create-administrative-request.dto";

export interface AdministrativeRequestDraft {
  title: string;
  summary: string;
  formData: Prisma.InputJsonValue;
  attachmentNames: string[];
}

export function buildAdministrativeRequestDraft(
  dto: CreateAdministrativeRequestDto
): AdministrativeRequestDraft {
  const attachmentNames = (dto.attachmentNames ?? []).map((item) => item.trim()).filter(Boolean);

  // 第一阶段仍然采用固定流程，因此不同申请类型统一在这里收敛为可持久化草稿。
  switch (dto.type) {
    case AdministrativeRequestType.REIMBURSEMENT: {
      const expenseDate = requireText(dto.expenseDate, "报销日期");
      const expenseCategory = requireText(dto.expenseCategory, "报销类别");
      const payeeName = requireText(dto.payeeName, "报销对象");
      const amount = requireNumber(dto.amount, "报销金额");

      return {
        title: dto.title.trim(),
        summary: `${expenseCategory} / ${payeeName} / ${formatAmount(amount)}`,
        formData: {
          expenseDate: normalizeDateTimeString(expenseDate),
          expenseCategory,
          payeeName,
          amount
        },
        attachmentNames
      };
    }
    case AdministrativeRequestType.TRAVEL: {
      const startAt = parseDateTime(requireText(dto.startAt, "出差开始时间"), "出差开始时间");
      const endAt = parseDateTime(requireText(dto.endAt, "出差结束时间"), "出差结束时间");
      const destination = requireText(dto.destination, "出差目的地");
      const transportation = requireText(dto.transportation, "交通方式");
      const estimatedAmount = requireNumber(dto.estimatedAmount, "预估费用");

      if (startAt.getTime() >= endAt.getTime()) {
        throw new BadRequestException("出差结束时间必须晚于开始时间。");
      }

      return {
        title: dto.title.trim(),
        summary: `${destination} / ${normalizeDateTimeString(dto.startAt!)} 至 ${normalizeDateTimeString(dto.endAt!)} / ${transportation}`,
        formData: {
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          destination,
          transportation,
          estimatedAmount
        },
        attachmentNames
      };
    }
    case AdministrativeRequestType.PURCHASE: {
      const itemName = requireText(dto.itemName, "采购物品");
      const quantity = requireNumber(dto.quantity, "采购数量");
      const budgetAmount = requireNumber(dto.budgetAmount, "预算金额");
      const neededBy = requireText(dto.neededBy, "期望到位时间");

      return {
        title: dto.title.trim(),
        summary: `${itemName} / ${quantity} 件 / ${formatAmount(budgetAmount)}`,
        formData: {
          itemName,
          quantity,
          budgetAmount,
          neededBy: normalizeDateTimeString(neededBy)
        },
        attachmentNames
      };
    }
    case AdministrativeRequestType.SEAL: {
      const documentName = requireText(dto.documentName, "文件名称");
      const sealType = requireText(dto.sealType, "用印类型");
      const useDate = requireText(dto.useDate, "用印时间");
      const copyCount = requireNumber(dto.copyCount, "用印份数");

      return {
        title: dto.title.trim(),
        summary: `${documentName} / ${sealType} / ${copyCount} 份`,
        formData: {
          documentName,
          sealType,
          useDate: normalizeDateTimeString(useDate),
          copyCount
        },
        attachmentNames
      };
    }
    default:
      throw new BadRequestException("暂不支持的申请类型。");
  }
}

export function generateAdministrativeRequestNo(
  type: AdministrativeRequestType,
  now = new Date()
): string {
  const dateSegment = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");
  const typeSegment = type.slice(0, 3);
  const randomSegment = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `AR-${typeSegment}-${dateSegment}-${randomSegment}`;
}

function parseDateTime(value: string, fieldName: string): Date {
  const parsed = new Date(value.replace(" ", "T"));

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${fieldName}格式无效。`);
  }

  return parsed;
}

function normalizeDateTimeString(value: string): string {
  return value.trim().replace("T", " ");
}

function requireText(value: string | undefined, fieldName: string): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new BadRequestException(`${fieldName}不能为空。`);
  }

  return normalizedValue;
}

function requireNumber(value: number | undefined, fieldName: string): number {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    throw new BadRequestException(`${fieldName}必须为有效数字。`);
  }

  return value;
}

function formatAmount(value: number): string {
  return `¥${value.toFixed(2)}`;
}
