import React from 'react'
import Link from 'next/link'
import {Text} from '../atoms'
import {withRouter} from 'next/router'

const activeLinkStyle = `
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  `

const NavItem = withRouter(({href, router, children}) => {
  const active = router.pathname === href
  return (
    <Link href={href}>
      <li>
        <a href={href}>{children}</a>
        <style jsx>{`
          li {
            color: rgba(255, 255, 255, 0.5);
            cursor: pointer;
            margin: 0 0 0.5em;
            padding: 0.5em 1em;
            ${active && activeLinkStyle};
          }

          a {
            color: rgba(255, 255, 255, 0.5);
            text-decoration: none;
            ${active && 'color: rgb(255, 255, 255);'};
          }

          a:hover {
            color: rgb(255, 255, 255);
          }
        `}</style>
      </li>
    </Link>
  )
})

export const Nav = ({user}) => (
  <nav>
    <div>
      <img src="../static/logo.svg" />
    </div>
    <ul>
      <Text color="white" padded>
        {user.name}
      </Text>
      <NavItem href="/dashboard">Settings</NavItem>
    </ul>
    <ul>
      <NavItem href="/contacts">Contacts</NavItem>
      <NavItem href="/chats">Chats</NavItem>
      <NavItem href="/wallets">Wallets</NavItem>
      <NavItem href="/dashboard" active>
        My Idena
      </NavItem>
      <NavItem href="/flip">+ flip</NavItem>
    </ul>
    <style jsx>{`
      nav {
        background: rgb(83, 86, 92);
        color: white;
        padding: 2em;
        width: 250px;
        text-align: center;
      }

      ul {
        list-style-type: none;
        padding: 0;
        margin: 3em 0;
        text-align: left;
      }

      img {
        width: 96px;
        filter: invert(1);
      }
    `}</style>
  </nav>
)

export default Nav
