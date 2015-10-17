'use babel'
import React from 'react'
import { Link } from 'react-router'
import { RenameModalBtn, FlagUserModalBtn } from './modals'
import { UserLink } from './index'
import app from '../lib/app'
import u from '../lib/util'
import social from '../lib/social-graph'

export default class UserInfo extends React.Component {
  constructor(props) {
    super(props)
    this.state = this.computeState()

    // helpers to refresh state and render after making changes
    this.refreshState = (pid) => this.setState(this.computeState(pid))
    let reload = () => { app.fetchLatestState(this.refreshState) }

    // event handlers
    this.on = {
      toggleFollow: () => {
        if (this.state.isSelf) return
        // publish contact msg
        let msg = (this.state.isFollowing) ? schemas.unfollow(this.props.pid) : schemas.follow(this.props.pid)
        app.ssb.publish(msg, (err) => {
          if (err) return app.issue('Failed to publish contact msg', err, 'Profile view onToggleFollow')
          reload()
        })
      },
      rename: (name) => {
        if (name === this.state.name)
          return
        // publish about msg
        app.ssb.publish(schemas.name(this.props.pid, name), (err) => {
          if (err) return app.issue('Failed to publish about msg', err, 'Profile view onRename')
          reload()
        })
      },
      flag: (flag, reason) => {
        // prep text
        mentionslib.extract(reason, (err, mentions) => {
          if (err) {
            if (err.conflict)
              app.issue('Error While Publishing', 'You follow multiple people with the name "'+err.name+'." Go to the homepage to resolve this before publishing.')
            else
              app.issue('Error While Publishing', err, 'This error occurred while trying to extract the mentions from the text of a flag post.')
            return
          }

          // publish flag and contact msgs
          var done = multicb({ pluck: 1, spread: true })
          app.ssb.publish(schemas.block(this.props.pid), done())
          app.ssb.publish(schemas.flag(this.props.pid, flag||'other'), done())
          done((err, blockMsg, flagMsg) => {
            if (err) return app.issue('Failed to publish flag msgs', err, 'Profile view onFlag')

            // publish a post with the reason
            if (reason.trim()) {
              app.ssb.publish(schemas.post(reason, flagMsg.key, flagMsg.key, (mentions.length) ? mentions : null), function (err) {
                if (err) return app.issue('Failed to publish flag reason msg', err, 'Profile view onFlag')
                reload()
              })
            } else
              reload()
          })
        })
      },
      unflag: () => {
        var done = multicb()
        app.ssb.publish(schemas.unblock(this.props.pid), done())
        app.ssb.publish(schemas.unflag(this.props.pid), done())
        done((err) => {
          if (err) return app.issue('Failed to publish unflag msgs', err, 'Profile view onUnflag')
          reload()
        })
      }
    }
  }
  componentDidMount() {
    this.refreshState() // trigger render update
    app.on('update:all', this.refreshState) // re-render on app state updates
  }

  componentWillReceiveProps(newProps) {
    this.refreshState(newProps.pid) // trigger render update
  }
  componentWillUnmount() {
    app.removeListener('update:all', this.refreshState)    
  }

  computeState(pid) {
    pid = pid || this.props.pid
    return {
      profile:     app.users.profiles[pid],
      name:        app.users.names[pid] || u.shortString(pid, 6),
      isSelf:      (pid == app.user.id),
      isFollowing: social.follows(app.user.id, pid),
      followsYou:  social.follows(pid, app.user.id),
      hasFlagged:  social.flags(app.user.id, pid),
      hasBlocked:  social.blocks(app.user.id, pid),
      followers1:  social.followedFollowers(app.user.id, pid, true),
      followers2:  social.unfollowedFollowers(app.user.id, pid),
      followeds:   social.followeds(pid),
      flaggers:    social.followedFlaggers(app.user.id, pid, true)
    }
  }

  render() {
    // name conflict controls
    var nameConflictDlg
    var nameConflicts = []
    for (var id in app.users.names) {
      if (id != this.props.pid && app.users.names[id] == app.users.names[this.props.pid])
        nameConflicts.push(id)
    }
    if (nameConflicts.length) {
      // :TODO:
      // nameConflictDlg = h('.well.white', { style: 'margin: -10px 15px 15px' },
      //   h('p', { style: 'margin-bottom: 10px' }, h('strong', 'Other users named "'+app.users.names[pid]+'":')),
      //   h('ul.list-inline', nameConflicts.map(function (id) { return h('li', com.user(id)) })),
      //   h('p', h('small', 'ProTip: You can rename users to avoid getting confused!'))
      // )
    }

    // flag controls
    var flagMsgs
    if (this.state.flaggers.length) {
      // :TODO:
      // flagMsgs = h('.profile-flags.message-feed')
      // flaggers.forEach(function (id) {
      //   var flag = social.flags(id, pid)
      //   if (flag.reason && flag.key) {
      //     app.ssb.get(flag.key, function (err, flagMsg) {
      //       if (err) console.error(err)
      //       if (flagMsg) flagMsgs.appendChild(com.message({ key: flag.key, value: flagMsg }))
      //     })
      //   }
      // })
    }

    return <div className="user-info">
      <div>
        <img src={u.profilePicUrl(this.props.pid)} />
        <div>
          {(this.state.isSelf) ?
            <a className="btn" onClick={()=>{app.emit('modal:setup', true)}}><i className="fa fa-wrench" /> Edit Profile</a> :
            <span className="btn-group">
              { (this.state.hasBlocked) ?
                'BLOCKED' :
                <a className="btn"
                  onClick={this.on.toggleFollow}>
                  {(this.state.isFollowing) ?
                    <span><i className="fa fa-user-times" /> Unfollow</span> :
                    <span><i className="fa fa-user-plus" /> Follow</span> }
                </a> }
              <RenameModalBtn name={this.state.name} onSubmit={this.on.rename} className="btn" />
              { (!this.state.hasFlagged) ?
                <FlagUserModalBtn name={this.state.name} onSubmit={this.on.flag} className="btn" /> :
                <a className="btn" onClick={this.on.unflag}>Unflag</a> }
            </span>
          }
        </div>
      </div>
      <div>
        <h1>{this.state.name}</h1>
        <table>
          <tr><td>{this.state.followers1.length + this.state.followers2.length}</td><td>followers</td></tr>
          <tr><td>{this.state.flaggers.length}</td><td>flags</td></tr>
        </table>
        <table>
          <tr>
            <td>
              {this.state.followers1.length > 0 ? <h3>followers</h3> : ''}
              {this.state.followers1.map((id, i) => <div key={'follower'+i}><UserLink id={id} /></div>)}
            </td>
            <td>
              {this.state.followeds.length > 0 ? <h3>following</h3> : ''}
              {this.state.followeds.map((id, i) => <div key={'follower'+i}><UserLink id={id} /></div>)}
            </td>
          </tr>
        </table>
      </div>
    </div>
  }
}