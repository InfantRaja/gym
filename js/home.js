import { renderShell, setPageTitle } from './app.js';
import './dashboard-feed.js';

const shell = renderShell('feed');
shell.innerHTML = setPageTitle('Home', 'LimitBreak / Your training circle');
document.body.classList.add('social-home-page');
