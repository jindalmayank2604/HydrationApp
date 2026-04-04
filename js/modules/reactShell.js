const ReactShell = (() => {
  const h = React.createElement;
  const screens = [
    {
      key: 'home',
      label: 'Home',
      mobileLabel: 'Home',
      rootId: 'home-root',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
    },
    {
      key: 'history',
      label: 'History',
      mobileLabel: 'History',
      rootId: 'history-root',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>',
    },
    {
      key: 'analytics',
      label: 'Analytics',
      mobileLabel: 'Analytics',
      rootId: 'analytics-root',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg>',
    },
    {
      key: 'achievements',
      label: 'Achievements',
      mobileLabel: 'Achieve',
      rootId: 'achievements-root',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
    },
    {
      key: 'reminder',
      label: 'Reminder',
      mobileLabel: 'Remind',
      rootId: 'reminder-root',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>',
    },
    {
      key: 'shop',
      label: 'Shop',
      mobileLabel: 'Shop',
      rootId: 'shop-root',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
    },
    {
      key: 'settings',
      label: 'Settings',
      mobileLabel: 'Settings',
      rootId: 'settings-root',
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    },
  ];

  const iconNode = (svg) => h('span', {
    dangerouslySetInnerHTML: { __html: svg },
  });

  function NavButton({ screen, active, mobile, onClick }) {
    const className = mobile
      ? `mobile-orbit-item${active ? ' orbit-active' : ''}`
      : `nav-item${active ? ' active' : ''}`;
    return h(
      'button',
      {
        className,
        'data-screen': screen.key,
        'data-label': screen.label,
        'aria-label': screen.label,
        onClick: () => onClick(screen.key),
      },
      mobile
        ? [
            h('span', { key: 'icon', dangerouslySetInnerHTML: { __html: screen.icon } }),
            h('span', { key: 'label', className: 'mobile-orbit-label' }, screen.mobileLabel),
          ]
        : [
            h('div', { key: 'icon', className: 'nav-icon' }, iconNode(screen.icon)),
            h('span', { key: 'label', className: 'nav-label' }, screen.label),
          ]
    );
  }

  function AppShell() {
    const [currentScreen, setCurrentScreen] = React.useState(
      window.Router?.getCurrent?.() || 'home'
    );
    const [navExpanded, setNavExpanded] = React.useState(
      localStorage.getItem('wt_nav_expanded') === 'true'
    );
    const [orbitOpen, setOrbitOpen] = React.useState(false);
    const [darkMode, setDarkMode] = React.useState(
      document.body.classList.contains('dark-mode')
    );
    React.useEffect(() => {
      if (!window.Router?.subscribe) return undefined;
      return window.Router.subscribe((screen) => {
        setCurrentScreen(screen);
        setOrbitOpen(false);
      });
    }, []);

    React.useEffect(() => {
      document.body.classList.toggle('nav-expanded', navExpanded);
      localStorage.setItem('wt_nav_expanded', navExpanded ? 'true' : 'false');
    }, [navExpanded]);

    React.useEffect(() => {
      document.body.classList.toggle('dark-mode', darkMode);
      localStorage.setItem('wt_dark_mode', darkMode ? 'true' : 'false');
    }, [darkMode]);

    React.useEffect(() => {
      const onKeyDown = (event) => {
        if (event.key === 'Escape') setOrbitOpen(false);
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }, []);

    const navigate = (screen) => {
      window.Router?.navigate?.(screen);
      if (navigator.vibrate) navigator.vibrate(8);
    };

    return h(
      React.Fragment,
      null,
      h(
        'nav',
        { className: 'bottom-nav', role: 'navigation' },
        [
          h(
            'button',
            {
              key: 'desktop-toggle',
              className: 'desktop-nav-toggle',
              id: 'desktopNavToggle',
              'aria-label': navExpanded ? 'Collapse sidebar' : 'Expand sidebar',
              title: navExpanded ? 'Collapse sidebar' : 'Expand sidebar',
              onClick: () => setNavExpanded((value) => !value),
            },
            [h('span', { key: 1 }), h('span', { key: 2 }), h('span', { key: 3 })]
          ),
          ...screens.map((screen) =>
            h(NavButton, {
              key: screen.key,
              screen,
              active: currentScreen === screen.key,
              mobile: false,
              onClick: navigate,
            })
          ),
        ]
      ),
      h(
        'div',
        { id: 'mobileOrbitNav', className: orbitOpen ? 'open' : '', 'aria-label': 'Navigation menu' },
        [
          h(
            'button',
            {
              key: 'trigger',
              className: 'mobile-orbit-trigger',
              id: 'orbitTrigger',
              'aria-label': orbitOpen ? 'Close navigation' : 'Open navigation',
              'aria-expanded': orbitOpen ? 'true' : 'false',
              onClick: (event) => {
                event.stopPropagation();
                setOrbitOpen((value) => !value);
              },
            },
            [
              h(
                'span',
                {
                  key: 'open',
                  className: 'orbit-trigger-icon orbit-trigger-icon--open',
                },
                [
                  h('span', {
                    key: 'open-icon',
                    dangerouslySetInnerHTML: {
                      __html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>',
                    },
                  }),
                  h('span', { key: 'open-text', className: 'orbit-btn-text' }, 'Menu'),
                ]
              ),
              h(
                'span',
                {
                  key: 'close',
                  className: 'orbit-trigger-icon orbit-trigger-icon--close',
                },
                [
                  h('span', {
                    key: 'close-icon',
                    dangerouslySetInnerHTML: {
                      __html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
                    },
                  }),
                  h('span', { key: 'close-text', className: 'orbit-btn-text' }, 'Close'),
                ]
              ),
            ]
          ),
          h(
            'div',
            { key: 'items', className: 'mobile-orbit-items', id: 'orbitItems' },
            screens.map((screen) =>
              h(NavButton, {
                key: screen.key,
                screen,
                active: currentScreen === screen.key,
                mobile: true,
                onClick: navigate,
              })
            )
          ),
        ]
      ),
      h('div', {
        id: 'orbitBackdrop',
        className: `orbit-backdrop${orbitOpen ? ' active' : ''}`,
        onClick: () => setOrbitOpen(false),
      }),
      h(
        'div',
        { className: 'content-col' },
        [
          h(
            'header',
            { key: 'header', className: 'app-header', id: 'appHeader' },
            [
              h(
                'div',
                { key: 'left', className: 'header-left' },
                [
                  h(
                    'div',
                    {
                      key: 'avatar',
                      id: 'headerAvatar',
                      className: 'header-avatar',
                      style: {
                        overflow: 'visible',
                        borderRadius: '50%',
                        position: 'relative',
                        cursor: 'pointer',
                      },
                      title: 'Go to Settings',
                      onClick: () => navigate('settings'),
                    },
                    null
                  ),
                  h(
                    'div',
                    { key: 'text', className: 'header-text' },
                    [
                      h(
                        'div',
                        {
                          key: 'greeting',
                          className: 'header-greeting',
                          id: 'greeting',
                          style: { cursor: 'pointer' },
                          title: 'Go to Home',
                          onClick: () => navigate('home'),
                        },
                        null
                      ),
                      h('div', { key: 'date', className: 'header-date', id: 'headerDate' }),
                    ]
                  ),
                ]
              ),
              h(
                'div',
                { key: 'right', className: 'header-right' },
                [
                  h(
                    'div',
                    {
                      key: 'coins',
                      className: 'header-coin-chip',
                      id: 'headerCoinChip',
                      title: 'View Shop',
                    },
                    [
                      h('span', { key: 'coin-icon', className: 'header-coin-icon' }, '\uD83E\uDE99'),
                      h('span', { key: 'coin-value', className: 'header-coin-value', id: 'headerCoinValue' }),
                    ]
                  ),
                  h(
                    'button',
                    {
                      key: 'dark-toggle',
                      id: 'darkModeToggle',
                      'aria-label': 'Toggle dark mode',
                      title: 'Toggle dark/light mode',
                      style: {
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '22px',
                        padding: '6px',
                        borderRadius: '50%',
                        transition: 'background 150ms',
                      },
                      onClick: () => setDarkMode((value) => !value),
                    },
                    darkMode ? '\u2600\uFE0F' : '\uD83C\uDF19'
                  ),
                ]
              ),
            ]
          ),
          h(
            'main',
            { key: 'main', className: 'app-main' },
            screens.map((screen) =>
              h(
                'section',
                {
                  key: screen.key,
                  className: `screen${currentScreen === screen.key ? ' active' : ''}`,
                  id: `screen-${screen.key}`,
                },
                h('div', { id: screen.rootId })
              )
            )
          ),
        ]
      ),
      h('div', { className: 'toast', id: 'toast', role: 'alert', 'aria-live': 'polite' })
    );
  }

  let root = null;

  const mount = () => {
    const container = document.getElementById('react-root');
    if (!container) return;
    if (!root) root = ReactDOM.createRoot(container);
    if (ReactDOM.flushSync) {
      ReactDOM.flushSync(() => root.render(h(AppShell)));
    } else {
      root.render(h(AppShell));
    }
  };

  return { mount };
})();

window.ReactShell = ReactShell;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ReactShell.mount());
} else {
  ReactShell.mount();
}
