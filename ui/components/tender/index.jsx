import React from "react";
import Component from "../pure-render-component";
import CostEffectiveness from "./cost-effectiveness";
import FundingByBidType from "./funding-by-bid-type";
import BiddingPeriod from "./bidding-period";
import Cancelled from "./cancelled";
import {toImmutable} from "nuclear-js";

export default class Tender extends Component{
  render(){
    var {state} = this.props;
    var globalState = state.get('globalState');
    var selectedYears = globalState.get('selectedYears');
    var width = globalState.get('contentWidth');
    var data = globalState.get('data');
    var year = globalState.get('year');
    return (
        <div className="col-sm-12 content">
          <CostEffectiveness
              width={width}
              data={data.get('costEffectiveness')}/>

          <BiddingPeriod
              width={width}
              data={data.get('bidPeriod')}
          />

          {data.has('bidType') ?
            <FundingByBidType
                width={width}
                data={data.get('bidType')
                    .groupBy(bidType => bidType.get('procurementMethodDetails'))
                    .map(bidTypes => bidTypes.reduce((reducedBidType, bidType) => {
                      return {
                        _id: bidType.get('procurementMethodDetails') || "unspecified",
                        totalTenderAmount: reducedBidType.totalTenderAmount + bidType.get('totalTenderAmount')
                      }
                    }, {
                      totalTenderAmount: 0
                    }))
                    .toArray()
                }
            />
          : null}

          <Cancelled
              width={width}
              data={data.get('cancelled')}
          />
        </div>
    )
  }
}