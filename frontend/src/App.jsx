import { HashRouter, ParamsProvider, match, useLocation } from './router.jsx';
import { AuthProvider, useAuth } from './store/Auth.jsx';
import { StoreProvider } from './store/Store.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import LeadDetail from './pages/LeadDetail.jsx';
import RfpSynopsis from './pages/RfpSynopsis.jsx';
import Pipeline from './pages/Pipeline.jsx';
import Opportunity from './pages/Opportunity.jsx';
import Compliance from './pages/Compliance.jsx';
import PrePO from './pages/PrePO.jsx';
import Decisions from './pages/Decisions.jsx';
import PostPO from './pages/PostPO.jsx';

const ROUTES = [
  ['/', Dashboard],
  ['/leads', Leads],
  ['/leads/:id', LeadDetail],
  ['/rfp', RfpSynopsis],
  ['/opportunities', Pipeline],
  ['/opportunities/:id', Opportunity],
  ['/compliance', Compliance],
  ['/pre-po', PrePO],
  ['/decisions', Decisions],
  ['/post-po', PostPO]
];

function Routed() {
  const { vertical, booting } = useAuth();
  const { pathname } = useLocation();
  if (booting) return null;
  if (!vertical) return <Login />;
  let Page = Dashboard;
  let params = {};
  for (const [p, C] of ROUTES) {
    const m = match(p, pathname);
    if (m) { Page = C; params = m; break; }
  }
  return (
    <Layout>
      <ParamsProvider params={params}>
        <Page key={pathname} />
      </ParamsProvider>
    </Layout>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AuthProvider>
        <HashRouter>
          <Routed />
        </HashRouter>
      </AuthProvider>
    </StoreProvider>
  );
}
