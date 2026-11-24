import WorkspaceNav from '../components/WorkspaceNav';
import WorkspaceHome from './WorkspaceHome';
import './workspace.css';
import '../experience.css';
export default function Page(){return <div className="d4-app-shell suite-shell"><WorkspaceNav active="home"/><main className="suite-main xp-dashboard"><WorkspaceHome/></main></div>}
