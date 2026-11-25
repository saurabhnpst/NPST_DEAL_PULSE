import { Injectable } from '@nestjs/common';
import {
  amountFirstYear,
  category,
  dealValue,
  tcv,
} from '../common/opportunity-calculations';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { UpdateRevenueDto } from './dto/update-revenue.dto';

/** Revenue view of an opportunity. Writes go through OpportunitiesService.update. */
@Injectable()
export class OpportunityRevenueService {
  constructor(private readonly opportunities: OpportunitiesService) {}

  async get(id: string) {
    const o = await this.opportunities.findEntity(id);
    const amount = amountFirstYear(o.arr, o.oneTime);
    return {
      arr: o.arr,
      oneTime: o.oneTime,
      updatedArr: o.updatedArr,
      year2: o.year2,
      year3: o.year3,
      year4: o.year4,
      year5: o.year5,
      updatedCloseDate: o.updatedCloseDate,
      latestFollowupDate: o.latestFollowupDate,
      followupDetails: o.followupDetails,
      _amount: amount,
      _tcv: tcv(o.arr, o.oneTime, o.year2, o.year3, o.year4, o.year5),
      dealCategory: category(amount),
      dealValue: dealValue(o.arr, o.oneTime),
    };
  }

  async update(id: string, dto: UpdateRevenueDto, actorId?: number) {
    const { id: pk } = await this.opportunities.update(id, dto, actorId);
    return this.get(pk);
  }
}
