import FrontendYearFilterableChart from "./frontend-filterable";
import {response2obj, pluckImm} from "../../tools";
import {Map} from "immutable";

class CostEffectiveness extends FrontendYearFilterableChart{
  transform([tenderResponse, awardResponse]){
    let tender = response2obj('totalTenderAmount', tenderResponse);
    let award = response2obj('totalAwardAmount', awardResponse);
    return Object.keys(tender).map(year => ({
      year: year,
      tender: tender[year],
      diff: tender[year] - award[year]
    }))
  }

  getData(){
    let data = super.getData();
    if(!data) return [];
    var years = data.map(pluckImm('year')).toArray();

    return [{
      x: years,
      y: data.map(pluckImm('tender')).toArray(),
      name: this.__('Bid price'),
      type: 'bar'
    }, {
      x: years,
      y: data.map(pluckImm('diff')).toArray(),
      name: this.__('Difference'),
      type: 'bar'
    }];
  }

  getLayout(){
    return {
      barmode: "stack",
      xaxis: {
        title: this.__("Years"),
        type: "category",
        titlefont: {
          color: "#cc3c3b"
        }
      },
      yaxis: {
        title: this.__("Amount"),
        titlefont: {
          color: "#cc3c3b"
        }
      }
    }
  }
}

CostEffectiveness.getName = __ => __('Cost effectiveness');
CostEffectiveness.endpoints = ['costEffectivenessTenderAmount', 'costEffectivenessAwardAmount'];
CostEffectiveness.getFillerDatum = year => Map({
  year,
  tender: 0,
  diff: 0
});

CostEffectiveness.getMaxField = imm => imm.get('tender') + imm.get('diff');

export default CostEffectiveness;