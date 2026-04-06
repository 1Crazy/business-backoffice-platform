/** 商机领域常量：负责集中维护阶段枚举衍生规则，避免在 service、repository 和前端契约里重复散落。 */
import { OpportunityStage } from "@prisma/client";

export enum OpportunityResultStatus {
  IN_PROGRESS = "IN_PROGRESS",
  WON = "WON",
  LOST = "LOST"
}

export const OPPORTUNITY_OPEN_STAGES: OpportunityStage[] = [
  OpportunityStage.DISCOVERY,
  OpportunityStage.QUALIFICATION,
  OpportunityStage.PROPOSAL,
  OpportunityStage.NEGOTIATION
] as OpportunityStage[];

export const OPPORTUNITY_CLOSED_STAGES: OpportunityStage[] = [
  OpportunityStage.CLOSED_WON,
  OpportunityStage.CLOSED_LOST
] as OpportunityStage[];

export function resolveOpportunityResultStatus(stage: OpportunityStage): OpportunityResultStatus {
  if (stage === OpportunityStage.CLOSED_WON) {
    return OpportunityResultStatus.WON;
  }

  if (stage === OpportunityStage.CLOSED_LOST) {
    return OpportunityResultStatus.LOST;
  }

  return OpportunityResultStatus.IN_PROGRESS;
}
