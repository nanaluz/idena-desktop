import React from 'react'
import theme from '../../theme'

const toEmoji = sender => '🤖'

const fromMe = sender => sender === 'QQ'

const bg = sender => (fromMe(sender) ? theme.colors.primary : theme.colors.gray)

export default ({text, sender, timestamp}) => {
  const own = fromMe(sender)
  return (
    <li>
      <i>{toEmoji(sender)}</i>
      <div>
        <span>{text}</span>
        <small>{new Date(timestamp).toLocaleTimeString()}</small>
      </div>
      <style jsx>{`
        li {
          list-style-type: none;
          display: flex;
          flex-direction: ${own ? 'row-reverse' : 'row'};
          margin: 1em 0;
        }
        i {
          background: ${bg(sender)};
          border-radius: 8px;
          margin: 0 1em;
          padding: 0.5em 0.7em;
          font-style: normal;
        }
        div {
          background: ${bg(sender)};
          border-radius: 8px;
          padding: 0.5em 1em;
          display: flex;
        }
        span {
          color: ${own ? 'rgb(255, 255, 255)' : ''};
          word-break: break-all;
        }
        small {
          color: ${own ? 'rgba(255, 255, 255, 0.8)' : theme.colors.muted};
          font-size: 0.8em;
          align-self: flex-end;
          margin-left: 1em;
        }
      `}</style>
    </li>
  )
}