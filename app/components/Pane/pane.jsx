/* @flow weak */
import React, { Component, PropTypes } from 'react'
import { createStore } from 'redux'
import { Provider, connect } from 'react-redux'
import cx from 'classnames'
import * as PaneActions from './actions'

const Pane = ({id, views, size, flexDirection, parentFlexDirection, resizingListeners, ..._props}) => {
  if (views.length > 1) {
    var content = <PaneAxis views={views} flexDirection={flexDirection} />
  } else {
    var content = views[0]
  }

  var style = {
    flexGrow: size,
    display: _props.display
  }

  return (
    <div id={id} style={style} className={cx('pane-container', parentFlexDirection)}>
      <div className='pane'>{ content }</div>
      <ResizeBar parentFlexDirection={parentFlexDirection}
        sectionId={id} resizingListeners={resizingListeners} />
    </div>
  )
}

let ResizeBar = ({parentFlexDirection, sectionId, startResize}) => {
  var barClass = (parentFlexDirection == 'row') ? 'col-resize' : 'row-resize'
  return (
    <div className={cx('resize-bar', barClass)}
      onMouseDown={e => startResize(sectionId, e)}></div>
  )
}

ResizeBar = connect(null, (dispatch, ownProps) => {
  return {
    startResize: (sectionId, e) => {
      if (e.button !== 0) return // do nothing unless left button pressed
      e.preventDefault()

      // dispatch(PaneActions.setCover(true))
      var [oX, oY] = [e.pageX, e.pageY]

      const handleResize = (e) => {
        var [dX, dY] = [oX - e.pageX, oY - e.pageY]
        ;[oX, oY] = [e.pageX, e.pageY]
        dispatch(PaneActions.resize(sectionId, dX, dY))
        ownProps.resizingListeners.forEach(listener => listener())
      }

      const stopResize = () => {
        window.document.removeEventListener('mousemove', handleResize)
        window.document.removeEventListener('mouseup', stopResize)
        dispatch(PaneActions.confirmResize())
      }

      window.document.addEventListener('mousemove', handleResize)
      window.document.addEventListener('mouseup', stopResize)
    }
  }
})(ResizeBar)


class PaneAxis extends Component {
  static get propTypes () {
    return {
      id: PropTypes.string,
      flexDirection: PropTypes.string,
      views: PropTypes.array,
      size: PropTypes.number
    }
  }

  static get childContextTypes ()  {
    return { onResizing: PropTypes.func }
  }


  getChildContext () {
    return {
      onResizing: this.onResizing.bind(this)
    }
  }

  onResizing (listener) {
    this.resizingListeners.push(listener)
  }

  constructor (props) {
    super(props)
    this.resizingListeners = []
  }

  render () {
    var { views, flexDirection, className, style } = this.props
    if (views.length === 1 && !Array.isArray(views[0].views) ) views = [this.props]
    var Subviews = views.map( _props => {
      return <Pane
        key={_props.id}
        id={_props.id}
        views={_props.views}
        size={_props.size}
        flexDirection={_props.flexDirection}
        parentFlexDirection={flexDirection}
        resizingListeners={this.resizingListeners}
        {..._props}
      />
    })

    return (
      <div className={cx('pane-axis', className)}
        style={{flexDirection: flexDirection, ...style}}>{ Subviews }</div>
    )
  }
}

export default PaneAxis
