import React, { Component } from 'react'
import PropTypes from 'prop-types'
import debounce from 'lodash/debounce'
import Menu from './Menu'
import noop from 'lodash/noop'
import EventEmitter from 'eventemitter3'
import MenuContextTypes from './MenuContextTypes'

const keyCodes = {
  left: 37,
  up: 38,
  right: 39,
  down: 40,
  esc: 27,
  tab: 9,
  enter: 13,
}

class MenuContainer extends Component {
  constructor (props) {
    super(props)
    this.state = { value: '' }
    this.emitter = new EventEmitter()
    this.reset = debounce(
      () => this.setState({ value: '' })
    , 500, { trailing: true })
  }

  getChildContext () {
    const self = this
    return {
      subscribe (event, handler) {
        self.emitter.on(event, handler)
        return () => self.emitter.removeListener(event, handler)
      },
      setFocus (menuKey) {
        self.setState({ currentFocus: menuKey })
      },
      getFocus () {
        return self.state.currentFocus
      },
      deactivateTopLevelMenu: this.props.deactivate,
      activatePrevTopLevelMenuItem: this.props.activatePrevTopLevelMenuItem,
      activateNextTopLevelMenuItem: this.props.activateNextTopLevelMenuItem,
    }
  }

  componentWillMount () {
    this.deactivateTopLevelMenu = () => { this.props.deactivate() }
    if (this.deactivateTopLevelMenu) window.addEventListener('click', this.deactivateTopLevelMenu)
  }

  componentDidMount () {
    // we use tabindex to render the container a focus trap
    // so that keyboard events can be listened in this scope
    this.containerDOM.focus()
  }

  componentWillUnmount () {
    if (this.deactivateTopLevelMenu) window.removeEventListener('click', this.deactivateTopLevelMenu)
  }

  onKeyPress = (e) => {
    const char = String.fromCharCode(e.charCode)
    const value = this.state.value + char
    this.setState({ value })
    this.reset()
    this.emitter.emit('keyEvent', { type: 'INPUT', value, target: this.state.currentFocus })
  }

  onKeyDown = (e) => {
    const sendKeyEvent = eventType =>
      this.emitter.emit('keyEvent', { type: eventType, target: this.state.currentFocus })
    switch (e.keyCode) {
      case keyCodes.up:
        return sendKeyEvent('UP')
      case keyCodes.down:
        return sendKeyEvent('DOWN')
      case keyCodes.left:
        return sendKeyEvent('LEFT')
      case keyCodes.right:
        return sendKeyEvent('RIGHT')
      case keyCodes.enter:
        return sendKeyEvent('ENTER')

      case keyCodes.esc:
        this.props.deactivate()
        return sendKeyEvent('ESC')

      case keyCodes.tab:
        e.preventDefault()
        if (e.shiftKey) {
          this.props.activatePrevTopLevelMenuItem()
          return sendKeyEvent('SHIFT_TAB')
        } else {
          this.props.activateNextTopLevelMenuItem()
          return sendKeyEvent('TAB')
        }
      default:
        break
    }
    e.stopPropagation()
  }


  onFilterInputChange = (filterValue) => {
    const targetItemName = this.itemNames2Index
      .find(itemName => itemName.startsWith(filterValue.toLowerCase()))
    const targetIndex = this.itemNames2Index.indexOf(targetItemName)
    this.activateItemAtIndex(targetIndex)
  }

  render () {
    const { items, className, style, onMouseEnter, onMouseLeave,
      deactivate  } = this.props
    return (
      <div tabIndex='1'
        ref={r => this.containerDOM = r}
        className={className}
        style={style}
        onClick={e => e.stopPropagation()}
        onMouseEnter={onMouseEnter || (e => e) }
        onMouseLeave={onMouseLeave}
        onKeyDown={this.onKeyDown}
        onKeyPress={this.onKeyPress}
      >
        <Menu items={items}
          className={className}
          deactivate={deactivate}
        />
      </div>
    )
  }
}

MenuContainer.defaultProps = {
  defaultActiveItemIndex: -1,
  activateNextTopLevelMenuItem: noop,
  activatePrevTopLevelMenuItem: noop,
}

MenuContainer.propTypes = {
  deactivate: PropTypes.func.isRequired,
  activateNextTopLevelMenuItem: PropTypes.func.isRequired,
  activatePrevTopLevelMenuItem: PropTypes.func.isRequired,
}

MenuContainer.childContextTypes = MenuContextTypes

export default MenuContainer