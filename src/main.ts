import './style.css';
import { state } from './state';
import { renderMainView } from './views/MainView';
import { renderResultView } from './views/ResultView';

const app = document.getElementById('app')!;

function render(): void {
  if (state.view === 'main') {
    renderMainView(app);
  } else {
    renderResultView(app);
  }
}

state.on('view', render);

render();
