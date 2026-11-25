import { Opportunity } from '../entities/opportunity.entity';
import { OpportunityProduct } from '../entities/opportunity-product.entity';

const joinMulti = (modules?: string[] | null): string =>
  (modules ?? []).filter((m) => m && m !== '—').join('; ');

/** View object with frontend property names for stage validation (`Opportunity.jsx` / GROUPS). */
export type StageView = Record<string, unknown>;

export function toStageView(opp: Opportunity, products: OpportunityProduct[]): StageView {
  const slot1 = products.find((p) => p.productSlot === 1);
  const slot2 = products.find((p) => p.productSlot === 2);
  const slot3 = products.find((p) => p.productSlot === 3);
  const slot4 = products.find((p) => p.productSlot === 4);

  return {
    name: opp.name,
    owner: opp.ownerUserId ?? '',
    account: opp.accountName,
    closeDate: opp.closeDate,
    currency: opp.currency,
    productTsp: slot1?.productTsp ?? '',
    module: joinMulti(slot1?.modules),
    productTsp2: slot2?.productTsp ?? '—',
    module2: joinMulti(slot2?.modules),
    productTsp3: slot3?.productTsp ?? '—',
    module3: joinMulti(slot3?.modules),
    productTsp4: slot4?.productTsp ?? '—',
    module4: joinMulti(slot4?.modules),
    arr: opp.arr,
    oneTime: opp.oneTime,
    compellingEvent: opp.compellingEvent,
    reqReceived: opp.reqReceived,
    presalesInvolved: opp.presalesInvolved,
    presalesName: opp.presalesName,
    demoDone: opp.demoDone,
    sow: opp.sow,
    proposalDate: opp.proposalDate,
    contractSigned: opp.contractSigned,
    signDate: opp.signDate,
    criteriaKnown: opp.criteriaKnown,
    stage: opp.stage,
    recordType: opp.recordType,
  };
}