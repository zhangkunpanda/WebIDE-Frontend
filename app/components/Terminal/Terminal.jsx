// Hence the naming: http://askubuntu.com/questions/111144/are-terminal-and-shell-the-same
import React, { Component, PropTypes } from 'react'
import Terminal from 'sh.js'
import _ from 'lodash';
import { emitter, E } from 'utils'

import TerminalManager from './terminal-client';
import * as TabActions from 'components/Tab/actions';
import SettingState from 'components/Setting/state'

class Term extends Component {
  constructor(props) {
    super(props);
    this.setTheme = this.setTheme.bind(this)
  }

  componentDidMount() {
    var _this = this;
    var terminalManager = new TerminalManager()
    const uiTheme = SettingState.settings.theme.ui_theme.value
    let themeName = 'terminal_basic'
    if (uiTheme === 'dark') {
      themeName = 'default'
    }
    var terminal = this.terminal = new Terminal({
      theme: themeName,
      cols: 80,
      rows:24
    })

    // fixme: this `TabActions` is for edtor tabs, not for terminal tabs
    terminalManager.setActions(TabActions)

    terminal.tabId = this.props.tab.id;
    this.props.tab.terminal = terminal
    terminal.open(this.termDOM);
    terminal.id = this.sessionId = _.uniqueId('term_');

    terminal.on('resize', (cols, rows) => {
      terminalManager.resize(terminal, cols, rows);
    });
    setTimeout(() => terminal.sizeToFit(), 0)
    emitter.on(E.PANEL_RESIZED, this.onResize.bind(this))
    emitter.on(E.THEME_CHANGED, this.onTheme.bind(this))

    terminalManager.add(terminal);
    terminal.on('data', data => {
      terminalManager.getSocket().emit('term.input', {id: terminal.id, input: data})
    });
    terminal.on('title', _.debounce(title => {
      _this.props.tab.title = title
    }, 300));
  }

  componentWillUnmount() {
    emitter.removeListener(E.PANEL_RESIZED, this.onResize)
    emitter.removeListener(E.THEME_CHANGED, this.onTheme)
  }

  render() {
    const {tab} = this.props;
    return (
      <div className='ide-terminal'>
        <div className='terminal-container'>
          <div className='terminal-body' data-droppable="TERMINAL" ref={r=>this.termDOM=r}></div>
        </div>
      </div>
    );
  }

  onResize () {
    this.terminal.sizeToFit()
  }

  onTheme (nextThemeId) {
    let themeName = 'terminal_basic'
    if (nextThemeId === 'dark') {
      themeName = 'default'
    }
    this.setTheme(themeName)
  }

  setTheme(themeName) {
    var theme = Terminal.themes.defaults[themeName];
    var terminal = this.terminal;
    terminal.colors = Terminal.themes.colors(theme);

    // if (themeName == 'terminal_basic') terminal.colors[256] = '#fffff7';
    terminal.element.style.backgroundColor = terminal.colors[256];
    terminal.element.style.color = terminal.colors[257];
    terminal.refresh(0, terminal.rows - 1)
  }
}

export default Term;
