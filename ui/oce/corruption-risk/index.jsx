import cn from 'classnames';
import URI from 'urijs';
import { Map, Set } from 'immutable';
import PropTypes from 'prop-types';
import { fetchJson, debounce, cacheFn, range, pluck, callFunc } from '../tools';
import OverviewPage from './overview-page';
import CorruptionTypePage from './corruption-type';
import IndividualIndicatorPage from './individual-indicator';
import ContractsPage from './contracts';
import ContractPage from './contracts/single';
import Filters from './filters';
import TotalFlags from './total-flags';
import LandingPopup from './landing-popup';
import { LOGIN_URL } from './constants';
// eslint-disable-next-line no-unused-vars
import style from './style.less';

const CORRUPTION_TYPES = ['FRAUD', 'RIGGING', 'COLLUSION'];

// eslint-disable-next-line no-undef
class CorruptionRiskDashboard extends React.Component {
  constructor(...args) {
    super(...args);
    this.state = {
      dashboardSwitcherOpen: false,
      user: {
        loggedIn: false,
        isAdmin: false,
      },
      indicatorTypesMapping: {},
      currentFiltersState: Map(),
      appliedFilters: Map(),
      filterBoxIndex: null,
      allMonths: range(1, 12),
      allYears: [],
      width: 0,
      data: Map(),
      showLandingPopup: !localStorage.alreadyVisited,
    };
    const { oceLocale } = localStorage;
    if (oceLocale && this.constructor.TRANSLATIONS[oceLocale]) {
      this.state.locale = oceLocale;
    } else {
      this.state.locale = 'en_US';
    }

    localStorage.alreadyVisited = true;

    this.destructFilters = cacheFn(filters => ({
      filters: filters.delete('years').delete('months'),
      years: filters.get('years', Set()),
      months: filters.get('months', Set()),
    }));
  }

  componentDidMount() {
    this.fetchUserInfo();
    this.fetchIndicatorTypesMapping();
    this.fetchYears();

    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({
      width: document.querySelector('.content').offsetWidth - 30,
    });

    window.addEventListener('resize', debounce(() => {
      this.setState({
        width: document.querySelector('.content').offsetWidth - 30,
      });
    }));
  }

  languageSwitcher() {
    const { TRANSLATIONS } = this.constructor;
    const { locale: selectedLocale } = this.state;
    if (Object.keys(TRANSLATIONS).length <= 1) return null;
    return Object.keys(TRANSLATIONS).map(locale => (
      <a
        href="javascript:void(0);"
        onClick={() => this.setLocale(locale)}
        className={cn({active: locale === selectedLocale})}
      >
        {locale.split('_')[0]}
      </a>
    ));
      /* return Object.keys(TRANSLATIONS).map(locale =>
       *   (
       *     <img
       *     className="icon"
       *     src={`assets/flags/${locale}.png`}
       *     alt={`${locale} flag`}
       *     
       *     key={locale}
       *   />),
       * );*/
  }

  setLocale(locale) {
    this.setState({ locale });
    localStorage.oceLocale = locale;
  }

  getPage() {
    const { route, navigate } = this.props;
    const translations = this.getTranslations();
    const styling = this.constructor.STYLING || this.props.styling;
    const [page] = route;

    const { appliedFilters, indicatorTypesMapping, width } = this.state;

    const { filters, years, months } = this.destructFilters(appliedFilters);
    const monthly = years.count() === 1;

    if (page === 'type') {
      const [, corruptionType] = route;

      const indicators =
        Object.keys(indicatorTypesMapping).filter(key =>
          indicatorTypesMapping[key].types.indexOf(corruptionType) > -1);

      return (
        <CorruptionTypePage
          indicators={indicators}
          onGotoIndicator={individualIndicator => navigate('indicator', corruptionType, individualIndicator)}
          filters={filters}
          translations={translations}
          corruptionType={corruptionType}
          years={years}
          monthly={monthly}
          months={months}
          width={width}
          styling={styling}
        />
      );
    } else if (page === 'indicator') {
      const [, corruptionType, individualIndicator] = route;
      return (
        <IndividualIndicatorPage
          indicator={individualIndicator}
          corruptionType={corruptionType}
          filters={filters}
          translations={translations}
          years={years}
          monthly={monthly}
          months={months}
          width={width}
          styling={styling}
        />
      );
    } else if (page === 'contracts') {
      const [, searchQuery] = route;
      return (
        <ContractsPage
          filters={filters}
          navigate={navigate}
          translations={translations}
          searchQuery={searchQuery}
          doSearch={query => navigate('contracts', query)}
        />
      );
    } else if (page === 'contract') {
      const [, contractId] = route;
      return (
        <ContractPage
          id={contractId}
          translations={translations}
          doSearch={query => navigate('contracts', query)}
        />
      )
    } else {
      return (
        <OverviewPage
          filters={filters}
          translations={translations}
          years={years}
          monthly={monthly}
          months={months}
          indicatorTypesMapping={indicatorTypesMapping}
          styling={styling}
          width={width}
        />
      );
    }
  }

  loginBox() {
    if (this.state.user.loggedIn) {
      return (
        <a href="/preLogout?referrer=/ui/index.html?corruption-risk-dashboard">
          <button className="btn btn-success">
            {this.t('general:logout')}
          </button>
        </a>
      );
    }
    return (<a href={LOGIN_URL}>
      <button className="btn btn-success">
        {this.t('general:login')}
      </button>
    </a>);
  }

  toggleDashboardSwitcher(e) {
    e.stopPropagation();
    const { dashboardSwitcherOpen } = this.state;
    this.setState({ dashboardSwitcherOpen: !dashboardSwitcherOpen });
  }

  fetchYears() {
    fetchJson('/api/tendersAwardsYears').then((data) => {
      const years = data.map(pluck('_id'));
      const { allMonths, currentFiltersState, appliedFilters } = this.state;
      this.setState({
        currentFiltersState: currentFiltersState
          .set('years', Set(years))
          .set('months', Set(allMonths)),
        appliedFilters: appliedFilters
          .set('years', Set(years))
          .set('months', Set(allMonths)),
        allYears: years,
      });
    });
  }

  fetchIndicatorTypesMapping() {
    fetchJson('/api/indicatorTypesMapping').then(data => this.setState({ indicatorTypesMapping: data }));
  }

  fetchUserInfo() {
    const noCacheUrl = new URI('/isAuthenticated').addSearch('time', Date.now());
    fetchJson(noCacheUrl).then(({ authenticated, disabledApiSecurity }) => {
      this.setState({
        user: {
          loggedIn: authenticated,
        },
        showLandingPopup: !authenticated || disabledApiSecurity,
        disabledApiSecurity,
      });
    });
  }

  t(str) {
    const { locale } = this.state;
    const { TRANSLATIONS } = this.constructor;
    return TRANSLATIONS[locale][str] || TRANSLATIONS.en_US[str] || str;
  }

  getTranslations(){
    const { TRANSLATIONS } = this.constructor;
    const { locale } = this.state;
    return TRANSLATIONS[locale];
  }

  render() {
    const { dashboardSwitcherOpen, filterBoxIndex, currentFiltersState,
      appliedFilters, data, indicatorTypesMapping, allYears, allMonths, showLandingPopup,
      disabledApiSecurity } = this.state;
    const { onSwitch, route, navigate } = this.props;
    const translations = this.getTranslations();
    const [page] = route;

    const { filters, years, months } = this.destructFilters(appliedFilters);
    const monthly = years.count() === 1;

    return (
      <div
        className="container-fluid dashboard-corruption-risk"
        onMouseDown={() => this.setState({ dashboardSwitcherOpen: false, filterBoxIndex: null })}
      >
        {showLandingPopup &&
          <LandingPopup
            redirectToLogin={!disabledApiSecurity}
            requestClosing={() => this.setState({ showLandingPopup: false })}
            translations={translations}
            languageSwitcher={this.languageSwitcher.bind(this)}
          />
        }
        <header className="branding row">
          <div className="col-sm-9 logo-wrapper">
            <img src="assets/dg-logo.svg" alt="DG logo" />
            <div className={cn('dash-switcher-wrapper', { open: dashboardSwitcherOpen })}>
              <h1
                className="corruption-dash-title"
                onClick={(e) => this.toggleDashboardSwitcher(e)}
              >
                {this.t('crd:title')}
                <i className="glyphicon glyphicon-menu-down" />
              </h1>
              {dashboardSwitcherOpen &&
                <div className="dashboard-switcher">
                  <a href="javascript:void(0);" onClick={() => onSwitch('m-and-e')} onMouseDown={callFunc('stopPropagation')}>
                    M&E Toolkit
                  </a>
                </div>
              }
            </div>
          </div>
          <div className="col-sm-1 language-switcher">
            {this.languageSwitcher()}
          </div>
          <div className="col-sm-1 login-wrapper">
            {!disabledApiSecurity && this.loginBox()}
          </div>
          <div className="col-sm-1" />
        </header>
        <Filters
          onUpdate={currentFiltersState => this.setState({ currentFiltersState })}
          onApply={filtersToApply => this.setState({
              filterBoxIndex: null,
              appliedFilters: filtersToApply,
              currentFiltersState: filtersToApply,
          })}
          translations={translations}
          currentBoxIndex={filterBoxIndex}
          requestNewBox={index => this.setState({ filterBoxIndex: index })}
          state={currentFiltersState}
          appliedFilters={appliedFilters}
          allYears={allYears}
          allMonths={allMonths}
        />
        <aside className="col-xs-4 col-md-4 col-lg-3" id="crd-sidebar">
          <div className="crd-description-text">
            <h4 className="crd-overview-link" onClick={() => navigate('overview')}>
              {this.t('crd:overview')}
              <i className="glyphicon glyphicon-info-sign" />
            </h4>
            <p className="small">
              {this.t('crd:description')}
            </p>
          </div>
          <section role="navigation" className="row">
            <a
              href="javascript:void(0);"
              onClick={() => navigate()}
              className={cn({ active: !page })}
            >
              <img className="blue" src={`assets/icons/blue/overview.svg`} alt="Overview icon" />
              <img className="white" src={`assets/icons/white/overview.svg`} alt="Overview icon" />
              {this.t('tabs:overview:title')}
              <i className="glyphicon glyphicon-info-sign" />
            </a>

            {CORRUPTION_TYPES.map((slug) => {
               const count = Object.keys(indicatorTypesMapping)
                 .filter(key => indicatorTypesMapping[key].types.indexOf(slug) > -1)
                 .length;

               let corruptionType;
               if (page === 'type') {
                 [, corruptionType] = route;
               }

               return (
                 <a
                   href="javascript:void(0);"
                   onClick={() => navigate('type', slug)}
                   className={cn({ active: slug === corruptionType })}
                   key={slug}
                   >
                   <img className="blue" src={`assets/icons/blue/${slug}.svg`} alt="Tab icon" />
                   <img className="white" src={`assets/icons/white/${slug}.svg`} alt="Tab icon" />
                   {this.t(`crd:corruptionType:${slug}:name`)} <span className="count">({count})</span>
                 </a>
               );
            })}
            <a
              href="javascript:void(0);"
              onClick={() => navigate('suppliers')}
              className={cn('archive-link', { active: page === 'suppliers' })}
              key="suppliers"
            >
              <img className="blue" src={`assets/icons/blue/suppliers.svg`} alt="Suppliers icon" />
              <img className="white" src={`assets/icons/white/suppliers.svg`} alt="Suppliers icon" />
              {this.t('crd:contracts:baseInfo:suppliers')}
            </a>
            <a
              href="javascript:void(0);"
              onClick={() => navigate('procuring-entities')}
              className={cn('archive-link', { active: page === 'procuring-entities' })}
              key="procuring-entities"
            >
              <img className="blue" src={`assets/icons/blue/procuring-entities.svg`} alt="Procuring entities icon" />
              <img className="white" src={`assets/icons/white/procuring-entities.svg`} alt="Procuring entities icon" />
              {this.t('crd:contracts:menu:procuringEntities')}
            </a>
            <a
              href="javascript:void(0);"
              onClick={() => navigate('contracts')}
              className={cn('archive-link', 'contracts-link', { active: page === 'contracts' })}
              key="contracts"
            >
              <img className="blue" src={`assets/icons/blue/contracts.svg`} alt="Contracts icon" />
              <img className="white" src={`assets/icons/white/contracts.svg`} alt="Contracts icon" />
              {this.t('crd:general:contracts')}
            </a>
          </section>
          <TotalFlags
            filters={filters}
            requestNewData={(path, newData) =>
              this.setState({ data: this.state.data.setIn(['totalFlags'].concat(path), newData) })}
            translations={translations}
            data={data.get('totalFlags', Map())}
            years={years}
            months={months}
            monthly={monthly}
          />
        </aside>
        <div className="col-xs-offset-4 col-md-offset-4 col-lg-offset-3 col-xs-8 col-md-8 col-lg-9 content">
          {this.getPage()}
        </div>
      </div>
    );
  }
}

CorruptionRiskDashboard.propTypes = {
  translations: PropTypes.object.isRequired,
  styling: PropTypes.object.isRequired,
  onSwitch: PropTypes.func.isRequired,
  route: PropTypes.array.isRequired,
  navigate: PropTypes.func.isRequired
};

CorruptionRiskDashboard.TRANSLATIONS = {
  en_US: require('../../../web/public/languages/en_US.json'),
  es_ES: require('../../../web/public/languages/es_ES.json'),
}

export default CorruptionRiskDashboard;
