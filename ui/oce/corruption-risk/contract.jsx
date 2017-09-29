import CRDPage from './page';
import Visualization from '../visualization';
import { Map } from 'immutable';
import translatable from '../translatable';

class Info extends translatable(Visualization) {
  getCustomEP(){
    const { id } = this.props;
    return `ocds/release/ocid/${id}`;
  }

  render() {
    const { data } = this.props;
    const title = data.getIn(['tender', 'title']);
    /*
       Contract Description //where do I find it?
       Procuring Entity
       Buyer
       Supplier
       Status
       Amounts
       Dates
     */
    return (
      <section>
        <dl>
          <dt>{this.t('crd:procurementsTable:contractID')}</dt>
          <dd>{data.get('ocid')}</dd>
          {title && <dt>{this.t('crd:general:contract:title')}</dt>}
          {title && <dd>{title}</dd>}
        </dl>
      </section>
    );
  }
}

export default class Contract extends CRDPage {
  constructor(...args){
    super(...args);
    this.state = {
      contract: Map()
    }
  }

  render() {
    const { contract } = this.state;
    const { id, translations } = this.props;
    return (
      <div>
        <Info
          id={id}
          data={contract}
          filters={Map()}
          requestNewData={(_, contract) => this.setState({contract})}
          translations={translations}
        />
      </div>
    );
  }
}