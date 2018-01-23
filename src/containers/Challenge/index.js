import React, { Component } from 'react'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'
import styled from 'styled-components'

import Modal from '../Modal'
import messages from '../../config/messages'

import H2 from '../../components/H2'
import UserInfo from '../../components/UserInfo'

import Event from '../../components/Event'
import FlexContainer from '../../components/FlexContainer'
import Section from '../../components/Section'

import {
  setupEthereum,
} from '../../actions'

import {
  selectParameters,
  selectWallet,
  selectCandidates,
  selectFaceoffs,
  selectWhitelist,
  selectError,
  selectAccount,
  selectAllListings,
  selectContracts,
} from '../../selectors'
import methods from '../../config/methods';

const ChallengeWrapper = styled.div`
  padding: 1em;
`

class Challenge extends Component {
  constructor() {
    super()
    this.state = {
      listing: '',
    }
  }

  componentDidMount() {
    console.log('Challenge props:', this.props)
    this.props.onSetupEthereum()
  }

  selectNetwork(network) {
    this.props.onSetupEthereum(network)
  }

  render() {
    const {
      wallet,
      account,
      candidates,
      faceoffs,
      whitelist,
      parameters,
      match,
      error,
      contracts,
    } = this.props

    return (
      <ChallengeWrapper>
        <UserInfo
          account={account}
          error={error}
          onSelectNetwork={this.selectNetwork}
          wallet={wallet}
          contracts={contracts}
        />

        <Modal messages={messages.challenge} actions={methods.challenge.actions} />

        <H2>{'Applicants ('}{candidates.size}{')'}</H2>
        <FlexContainer>
          {candidates.size > 0 &&
            candidates.map(log => (
              <Section key={log.get('listing')}>
                <Event
                  latest={log.get('latest')}
                  owner={log.get('owner')}
                  listing={log.get('listing')}
                  whitelisted={log.getIn(['latest', 'whitelisted'])}
                />
              </Section>
            ))}
        </FlexContainer>

        <H2>{'Registry ('}{whitelist.size}{')'}</H2>
        <FlexContainer>
          {whitelist.size > 0 &&
            whitelist.map(log => (
              <Section key={log.get('listing')}>
                <Event
                  latest={log.get('latest')}
                  owner={log.get('owner')}
                  listing={log.get('listing')}
                  whitelisted={log.getIn(['latest', 'whitelisted'])}
                />
              </Section>
            ))}
        </FlexContainer>
      </ChallengeWrapper>
    )
  }
}

function mapDispatchToProps(dispatch) {
  return {
    onSetupEthereum: (network) => dispatch(setupEthereum(network)),
  }
}

const mapStateToProps = createStructuredSelector({
  parameters: selectParameters,
  wallet: selectWallet,
  contracts: selectContracts,
  account: selectAccount,
  candidates: selectCandidates,
  listings: selectAllListings,
  whitelist: selectWhitelist,
  error: selectError,
})

const withConnect = connect(mapStateToProps, mapDispatchToProps)

export default compose(withConnect)(Challenge)

