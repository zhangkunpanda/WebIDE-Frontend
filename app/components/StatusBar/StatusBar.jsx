import React from 'react'
import { GitBranchWidget } from 'components/Git'
import { dispatchCommand } from 'commands'
import { EditorWidgets } from 'components/Editor'

const StatusBar = ({ messages=[] }) => {
  return (
    <div className='status-bar'>
      <div className='status-widget-container left'>
        <div className='status-bar-menu-item toggle-layout fa fa-desktop' onClick={e => dispatchCommand('view:toggle_bars')} ></div>
      </div>
      <div className='status-messages'>
        {messages.map(message => <div className='status-message'>{message}</div>)}
      </div>
      <div className='status-widget-container right'>
        <EditorWidgets />
        <GitBranchWidget ref={ com => window.refs.GitBranchWidget = com}
        /></div>
    </div>
  )
}

export default StatusBar
