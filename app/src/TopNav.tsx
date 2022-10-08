import React, { FC } from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { PathPrefixProps } from './types/types';

const TopNav: FC<PathPrefixProps> = ({ pathPrefix }) => {
  return (
    <Navbar variant="light" expand="md">
      <Container fluid style={{ padding: 0 }}>
        <Navbar.Brand href={`${pathPrefix}/`} className="ml-1">
          <img src={`${pathPrefix}/promlens_logo.svg`} height="30" className="d-inline-block align-top" alt=""></img>
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="ml-auto">
            <NavDropdown alignRight title="Resources" id="resources-dropdown">
              <NavDropdown.Item href="https://promlabs.com/promql-cheat-sheet">PromQL Cheat Sheet</NavDropdown.Item>
              <NavDropdown.Item href="https://training.promlabs.com/">Prometheus &amp; PromQL Training</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default TopNav;
