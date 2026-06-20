import { useMozoleum } from './state/useMozoleum';
import { Intro } from './components/Intro';
import { Generator } from './components/Generator';
import { Hall } from './components/Hall';
import { Shop } from './components/Shop';
import { Share } from './components/Share';
import { Celebration } from './components/Celebration';
import { Toast } from './components/Toast';

export function App() {
  const store = useMozoleum();

  return (
    <div style={{ fontFamily: "'Space Grotesk',system-ui,sans-serif", color: '#efe7d4' }}>
      {/* Screens are kept in the DOM via display toggling so animation timers and
          generated state survive navigation, mirroring the prototype. */}
      <div style={{ display: store.screen === 'intro' ? 'block' : 'none' }}>
        <Intro store={store} />
      </div>

      <div style={{ display: store.screen === 'generator' ? 'block' : 'none' }}>
        <Generator store={store} />
        <Celebration store={store} />
        <Shop store={store} />
        <Share store={store} />
      </div>

      <div style={{ display: store.screen === 'hall' ? 'block' : 'none' }}>
        <Hall store={store} />
      </div>

      <Toast store={store} />
    </div>
  );
}
