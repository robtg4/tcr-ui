import React, { Component } from 'react'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { createStructuredSelector } from 'reselect'
import styled from 'styled-components'
import JSONTree from 'react-json-tree'

import iconSrc from '../../assets/icons/corva.png'
import {
  SidePanel,
  SidePanelSplit,
  SidePanelSeparator,
  Section,
  Button,
  ContextMenu,
  Table,
  TableHeader,
  TableRow,
  TableCell,
  Text,
  TextInput,
  Countdown,
} from '@aragon/ui'

import { Icon } from 'semantic-ui-react'

import Identicon from '../../components/Identicon'

import {
  setupEthereum,
  requestModalMethod,
  sendTransaction,
  callRequested,
} from '../../actions'

import {
  selectEthjs,
  selectAccount,
  selectNetworkID,
  selectBalances,
  selectRegistry,
  selectToken,
  selectVoting,
  selectParameters,
  selectCandidates,
  selectFaceoffs,
  selectWhitelist,
  selectTxnStatus,
  selectError,
  selectTokenMethods,
  selectRegistryMethods,
  selectVotingMethods,
} from '../../selectors'

import { toUnitAmount, toNaturalUnitAmount, withCommas, trimDecimalsThree, toEther } from '../../utils/units_utils';
import translate from '../../translations';
import vote_utils from '../../utils/vote_utils';
import { colors } from '../../colors';
import { dateHasPassed } from '../../utils/format-date';

const jsonTheme = {
  scheme: 'monokai',
  author: 'wimer hazenberg (http://www.monokai.nl)',
  base00: '#272822',
  base01: '#383830',
  base02: '#49483e',
  base03: '#75715e',
  base04: '#a59f85',
  base05: '#f8f8f2',
  base06: '#f5f4f1',
  base07: '#f9f8f5',
  base08: '#f92672',
  base09: '#fd971f',
  base0A: '#f4bf75',
  base0B: '#a6e22e',
  base0C: '#a1efe4',
  base0D: '#66d9ef',
  base0E: '#ae81ff',
  base0F: '#cc6633'
}

const AppBarWrapper = styled.div`
  flex-shrink: 0;
`
const AppBar = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: 4em;
  background-color: ${colors.offWhite};
  border-bottom: 1px solid ${colors.orange};
  padding: 0 3em;
  & > div {
    margin: 0 1em;
  }
`
const MarginDiv = styled.div`
  margin: 1em 0;
`
const OverFlowDiv = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
`
const HomeWrapper = styled.div`
  padding: 2em;
`

class Home extends Component {
  constructor(props) {
    super(props)
    this.state = {
      activeItem: 0,
      opened: false,
      listingName: '',
      numTokens: '',
      openChallenge: false,
      openCommitVote: false,
      openRevealVote: false,
      openCallPanel: false,
      selectedOne: false,
      revealedVote: false,
    }
  }
  componentDidMount() {
    this.props.onSetupEthereum()
  }
  handleCall = (contract, method) => {
    const args = Object.values(this.state[method.name])
    console.log('args', args)
    this.props.onCall({ args, contract, method })
  }
  handleCallInputChange = (e, methodName, inputName) => {
    const value = e.target.value
    this.setState(prevState => ({
      ...prevState,
      [methodName]: {
        ...prevState[methodName],
        [inputName]: value
      }
    }))
  }

  // side panel
  closeSidePanel = () => {
    this.setState({ opened: false, openCallPanel: false, openChallenge: false, openCommitVote: false, openRevealVote: false })
  }
  openCallPanel = (contract) => {
    this.setState({
      openCallPanel: contract,
    })
  }
  openSidePanel = (one, openThis) => {
    if (!openThis) {
      this.setState({
        opened: true
      })
    } else {
      this.setState({
        selectedOne: one,
        [openThis]: true
      })
    }
  }

  // input changes
  handleFileInput = e => {
    const file = e.target.files[0]
    const fr = new window.FileReader()

    fr.onload = () => {
      const contents = fr.result

      try {
        const jsonFC = JSON.parse(contents)
        this.setState({
          revealedVote: jsonFC
        })
        console.log('jsonFC', jsonFC)
      } catch (error) {
        throw new Error('Invalid Commit JSON file')
      }
    }

    fr.readAsText(file)
  }
  handleInputChange = (e, t) => {
    this.setState({
      [t]: e.target.value,
    })
  }

  // token txns
  handleApprove = async (contract) => {
    //   const approved = await this.props.token.contract.approve(this.props[contract].address, toNaturalUnitAmount(this.state.numTokens, 18).toString(10))
    //   console.log('approved!!', approved)
    const method = this.props.token.contract.abi.filter(methI => methI.type === 'function' && methI.name === 'approve')[0]
    this.props.onSendTransaction({
      args: [
        this.props[contract].address,
        toNaturalUnitAmount(this.state.numTokens, 18)
      ],
      method,
      to: this.props.token.address
    })
  }
  handleRequestVotingRights = () => {
    const method = this.props.voting.contract.abi.filter(methI => methI.type === 'function' && methI.name === 'requestVotingRights')[0]
    this.props.onSendTransaction({
      args: [
        this.state.numTokens
      ],
      method,
    })
  }

  // registry txns
  handleApply = () => {
    // this.props.token.contract.transfer('0xeda75f826f12dfb245144769d97bf6d47abd2473', '420000000000000000000000')
    const method = this.props.registry.contract.abi.filter(methI => methI.type === 'function' && methI.name === 'apply')[0]
    this.props.onSendTransaction({
      args: [
        vote_utils.getListingHash(this.state.listingName),
        toNaturalUnitAmount(this.state.numTokens, 18),
        this.state.listingName,
      ],
      method,
    })
  }
  handleDepositWithdraw = (one, methodName) => {
    const method = this.props.registry.contract.abi.filter(methI => methI.type === 'function' && methI.name === methodName)[0]
    this.props.onSendTransaction({
      args: [
        one.get('listingHash'),
        toNaturalUnitAmount(420, 18),
      ],
      method,
    })
  }
  handleChallenge = () => {
    const method = this.props.registry.contract.abi.filter(methI => methI.type === 'function' && methI.name === 'challenge')[0]
    this.props.onSendTransaction({
      args: [
        this.state.selectedOne.get('listingHash'),
        this.state.selectedOne.get('listingString')
      ],
      method,
    })
  }
  handleUpdateStatus = (one) => {
    const method = this.props.registry.contract.abi.filter(methI => methI.type === 'function' && methI.name === 'updateStatus')[0]
    this.props.onSendTransaction({
      args: [
        one.get('listingHash'),
      ],
      method,
    })
  }
  handleRescueTokens = (one) => {
    const method = this.props.voting.contract.abi.filter(methI => methI.type === 'function' && methI.name === 'rescueTokens')[0]
    this.props.onSendTransaction({
      args: [
        one.getIn(['latest', 'pollID'])
      ],
      method,
    })
  }

  // voting txns
  handleCommitVote = (voteOption) => {
    const method = this.props.voting.contract.abi.filter(methI => methI.type === 'function' && methI.name === 'commitVote')[0]
    this.props.onSendTransaction({
      args: [
        this.state.selectedOne.getIn(['latest', 'pollID']),
        voteOption,
        this.state.numTokens
      ],
      listing: this.state.selectedOne.get('listingString'),
      method,
    })
  }
  handleRevealVote = () => {
    const method = this.props.voting.contract.abi.filter(methI => methI.type === 'function' && methI.name === 'revealVote')[0]
    this.props.onSendTransaction({
      args: [
        this.state.selectedOne.getIn(['latest', 'pollID']),
        this.state.revealedVote.voteOption,
        this.state.revealedVote.salt,
      ],
      method,
    })
  }

  render() {
    const {
      error,
      candidates,
      faceoffs,
      whitelist,
      account,
      balances,
      networkID,
      parameters,
      token,
      txnStatus,
      registryMethods,
      votingMethods,
    } = this.props

    return (
      <div>
        <AppBarWrapper>
          {error ? (
            <AppBar>
              <div>{error.message}</div>
            </AppBar>
          ) : (
              <AppBar>
                <div>
                  <Identicon address={account} diameter={30} />
                </div>
                <Text color='red' weight='bold'>{txnStatus && 'MINING'}</Text>
                <OverFlowDiv>
                  {account}
                </OverFlowDiv>
                <div>
                  {`Ether Balance: ${withCommas(balances.get('ETH'))} ΞTH`}
                </div>
                <div>
                  {`${token.name} Balance: ${withCommas(trimDecimalsThree(balances.get('token')))} ${token.symbol}`}
                </div>
              </AppBar>
            )}
        </AppBarWrapper>

        {/* <Grid>
          <Grid.Column width={4}>
          <Menu fluid vertical tabular>
              <Menu.Item name='registry' active={this.state.activeItem === 'bio'} onClick={this.handleItemClick} />
              <Menu.Item name='applications' active={this.state.activeItem === 'pics'} onClick={this.handleItemClick} />
              <Menu.Item name='committing' active={this.state.activeItem === 'companies'} onClick={this.handleItemClick} />
              <Menu.Item name='revealing' active={this.state.activeItem === 'links'} onClick={this.handleItemClick} />
            </Menu>
          </Grid.Column>
        </Grid> */}

        <SidePanel
          title="Apply a Listing into the Registry"
          opened={this.state.opened}
          onClose={this.closeSidePanel}
        >
          <SidePanelSplit children={[
            <Section>
              <Text weight='bold'>{'Application Period'}</Text>
              <h2>{parameters.get('applyStageLen')}{' seconds'}</h2>
            </Section>,
            <Section>
              <Text weight='bold'>{'Minimum Deposit'}</Text>
              <h2>{toUnitAmount(parameters.get('minDeposit'), 18).toString()} {token.symbol}</h2>
            </Section>
          ]} />

          <SidePanelSplit children={[
            <Section>
              <Text weight='bold'>{'Token Balance'}</Text>
              <h2>{withCommas(balances.get('token'))}</h2>
            </Section>,
            <Section>
              <Text weight='bold'>{'Registry Allowance'}</Text>
              <h2>{withCommas(balances.get('registryAllowance'))}</h2>
            </Section>
          ]} />

          <MarginDiv>
            <Icon name='question circle outline' size='small' />
            <Text color='grey' smallcaps>{'QUESTION'}</Text>
          </MarginDiv>
          <MarginDiv>
            <Text>{translate('sidebar_apply_question')}</Text>
          </MarginDiv>
          <MarginDiv>
            <Icon name='check circle' size='small' />
            <Text color='grey' smallcaps>{'INSTRUCTIONS'}</Text>
          </MarginDiv>
          <MarginDiv>
            <Text>{translate('sidebar_apply_instructions')}</Text>
          </MarginDiv>

          <MarginDiv>
            <Text color='grey' smallcaps>{'LISTING NAME'}</Text>
            <TextInput onChange={e => this.handleInputChange(e, 'listingName')} wide type='text' />
          </MarginDiv>

          <MarginDiv>
            <Text color='grey' smallcaps>{'TOKEN AMOUNT'}</Text>
            <TextInput onChange={e => this.handleInputChange(e, 'numTokens')} wide type='number' />
          </MarginDiv>

          <MarginDiv>
            <Button
              onClick={this.handleApply}
              mode='strong'
              wide
            >
              {'Apply Listing'}
            </Button>
          </MarginDiv>

          <MarginDiv>
            {Number(balances.get('registryAllowance')) < toUnitAmount(parameters.get('minDeposit'), 18) &&
              <Text color='grey' smallcaps>{'YOU NEED TO APPROVE'}</Text>
            }
            <Button
              onClick={e => this.handleApprove('registry')}
              mode='strong'
              wide
            >
              {'Approve tokens for Registry'}
            </Button>
          </MarginDiv>
          <SidePanelSeparator />
        </SidePanel>

        <SidePanel
          title="U D A P P"
          opened={this.state.openCallPanel === 'registry'}
          onClose={this.closeSidePanel}
        >
          <MarginDiv>
            <Icon name='check circle' size='small' />
            <Text color='grey' smallcaps>{'INSTRUCTIONS'}</Text>
          </MarginDiv>
          <MarginDiv>
            <Text>{translate('sidebar_udapp_instructions')}</Text>
          </MarginDiv>

          <SidePanelSeparator />

          {registryMethods.map(one => (
            <div key={one.name}>
              <MarginDiv>
                {one.inputs.map(inp => (
                  <TextInput key={inp.name} placeholder={inp.name} onChange={e => this.handleCallInputChange(e, one.name, inp.name)} wide type='text' />
                ))}
                <MarginDiv>
                  <Button
                    onClick={e => this.handleCall('registry', one)}
                    mode='strong'
                    wide
                  >
                    <Text color='white' smallcaps>{one.name}</Text>
                  </Button>
                </MarginDiv>
              </MarginDiv>
            </div>
          ))}
        </SidePanel>

        <SidePanel
          title="U D A P P"
          opened={this.state.openCallPanel === 'voting'}
          onClose={this.closeSidePanel}
        >
          <MarginDiv>
            <Icon name='check circle' size='small' />
            <Text color='grey' smallcaps>{'INSTRUCTIONS'}</Text>
          </MarginDiv>
          <MarginDiv>
            <Text>{translate('sidebar_udapp_instructions')}</Text>
          </MarginDiv>

          <SidePanelSeparator />

          {votingMethods.map(one => (
            <div key={one.name}>
              <MarginDiv>
                {one.inputs.map(inp => (
                  <TextInput key={inp.name} placeholder={inp.name} onChange={e => this.handleCallInputChange(e, one.name, inp.name)} wide type='text' />
                ))}
                <MarginDiv>
                  <Button
                    onClick={e => this.handleCall('voting', one)}
                    mode='strong'
                    wide
                  >
                    <Text color='white' smallcaps>{one.name}</Text>
                  </Button>
                </MarginDiv>
              </MarginDiv>
            </div>
          ))}
        </SidePanel>


        <SidePanel
          title="Challenge listing"
          opened={this.state.openChallenge}
          onClose={this.closeSidePanel}
        >
          <SidePanelSplit children={[
            <Section>
              <Text weight='bold'>{'Challenge Period'}</Text>
              <h1>{`Commit: ${parameters.get('commitStageLen')} seconds & Reveal: ${parameters.get('revealStageLen')} seconds`}</h1>
            </Section>,
            <Section>
              <Text weight='bold'>{'Minimum Deposit'}</Text>
              <h2>{toUnitAmount(parameters.get('minDeposit'), 18).toString()} {token.symbol}</h2>
            </Section>
          ]} />

          <SidePanelSplit children={[
            <Section>
              <Text weight='bold'>{'Token Balance'}</Text>
              <h2>{withCommas(balances.get('token'))}</h2>
            </Section>,
            <Section>
              <Text weight='bold'>{'Registry Allowance'}</Text>
              <h2>{withCommas(balances.get('registryAllowance'))}</h2>
            </Section>
          ]} />

          <MarginDiv>
            <Text color='grey' smallcaps>{'LISTING TO CHALLENGE'}</Text>
          </MarginDiv>
          <MarginDiv>
            <Text>{this.state.selectedOne && this.state.selectedOne.get('listingString')}</Text>
          </MarginDiv>

          <SidePanelSeparator />

          <MarginDiv>
            <Icon name='exclamation triangle' size='small' />
            <Text color='grey' smallcaps>{'WARNING'}</Text>
          </MarginDiv>
          <MarginDiv>
            <Text>{translate('sidebar_challenge_instructions')}</Text>
          </MarginDiv>

          <MarginDiv>
            {Number(balances.get('registryAllowance')) < toUnitAmount(parameters.get('minDeposit'), 18) ?
              <MarginDiv>
                <MarginDiv>
                  <Text color='grey' smallcaps>{'TOKEN AMOUNT TO APPROVE'}</Text>
                  <TextInput onChange={e => this.handleInputChange(e, 'numTokens')} wide type='number' />
                </MarginDiv>
                <MarginDiv>
                  <Button
                    onClick={e => this.handleApprove('registry')}
                    mode='strong'
                    wide
                  >
                    {'Approve tokens for Registry'}
                  </Button>
                </MarginDiv>
              </MarginDiv>
              : <Button
                onClick={this.handleChallenge}
                mode='strong'
                wide
              >
                {'CHALLENGE'}
              </Button>
            }
          </MarginDiv>
        </SidePanel>


        <SidePanel
          title="Commit Vote"
          opened={this.state.openCommitVote}
          onClose={this.closeSidePanel}
        >
          <SidePanelSplit children={[
            <Section>
              <Text weight='bold'>{'Commit Period'}</Text>
              <h1>{`Commit: ${parameters.get('commitStageLen')} seconds`}</h1>
            </Section>,
            <Section>
              <Text weight='bold'>{'POLL ID'}</Text>
              <h2>{this.state.selectedOne && this.state.selectedOne.getIn(['latest', 'pollID'])}</h2>
            </Section>
          ]} />

          <MarginDiv>
            <Icon name='lock' />
            <Text color='grey' smallcaps>{'COMMIT VOTE'}</Text>
          </MarginDiv>
          <MarginDiv>
            <Text>{this.state.selectedOne && this.state.selectedOne.get('listingString')}</Text>
          </MarginDiv>

          <SidePanelSeparator />

          <MarginDiv>
            <Icon name='exclamation triangle' size='small' />
            <Text color='grey' smallcaps>{'WARNING'}</Text>
          </MarginDiv>
          <MarginDiv>
            {balances.get('votingRights') === '0' ? (
              <div>
                <Text>{translate('sidebar_requestVotingRights_instructions')}</Text>
                <TextInput onChange={e => this.handleInputChange(e, 'numTokens')} wide type='number' />
              </div>
            ) : (
                <div>
                  <MarginDiv>
                    <Text>{translate('sidebar_commitVote_instructions')}</Text>
                  </MarginDiv>
                  <MarginDiv>
                    <TextInput onChange={e => this.handleInputChange(e, 'numTokens')} wide type='number' />
                  </MarginDiv>
                </div>
              )}
          </MarginDiv>

          {balances.get('votingRights') === '0' ? (
            <MarginDiv>
              <Button
                onClick={this.handleRequestVotingRights}
                mode='strong'
                wide
              >
                {'Request Voting Rights'}
              </Button>
              <div>
                <Text>{'Number of Tokens to Approve'}</Text>
                <TextInput onChange={e => this.handleInputChange(e, 'numTokens')} wide type='number' />
              </div>
              <Button
                onClick={e => this.handleApprove('voting')}
                mode='strong'
                wide
              >
                {'Approve tokens for Voting'}
              </Button>
            </MarginDiv>
          ) : (
              <MarginDiv>
                <Button
                  onClick={e => this.handleCommitVote(1)}
                  emphasis='positive'
                  mode='strong'
                >
                  {'Support the applicant'}
                </Button>
                {' '}
                <Button
                  onClick={e => this.handleCommitVote(0)}
                  emphasis='negative'
                  mode='strong'
                >
                  {'Oppose the applicant'}
                </Button>
                <Button
                  onClick={e => this.handleApprove('voting')}
                  mode='strong'
                  wide
                >
                  {'Approve tokens for Voting'}
                </Button>
              </MarginDiv>
            )
          }
          <MarginDiv>
            <JSONTree
              invertTheme={false}
              theme={jsonTheme}
              data={balances}
              shouldExpandNode={(keyName, data, level) => false}
            />
          </MarginDiv>
        </SidePanel>

        <SidePanel
          title="Reveal Vote"
          opened={this.state.openRevealVote}
          onClose={this.closeSidePanel}
        >
          <SidePanelSplit children={[
            <Section>
              <Text weight='bold'>{'Reveal Token'}</Text>
              <h1>{`Reveal: ${parameters.get('revealStageLen')} seconds`}</h1>
            </Section>,
            <Section>
              <Text weight='bold'>{'POLL ID'}</Text>
              <h2>{this.state.selectedOne && this.state.selectedOne.getIn(['latest', 'pollID'])}</h2>
            </Section>
          ]} />

          <SidePanelSplit children={[
            <Section>
              <Text weight='bold'>{'Token Balance'}</Text>
              <h2>{withCommas(balances.get('token'))}</h2>
            </Section>,
            <Section>
              <Text weight='bold'>{'Voting Allowance'}</Text>
              <h2>{withCommas(balances.get('votingAllowance'))}</h2>
            </Section>
          ]} />

          <MarginDiv>
            <Icon name='unlock' />
            <Text color='grey' smallcaps>{'REVEAL VOTE'}</Text>
          </MarginDiv>
          <MarginDiv>
            <Text>{this.state.selectedOne && this.state.selectedOne.get('listingString')}</Text>
          </MarginDiv>

          <SidePanelSeparator />

          <MarginDiv>
            <Icon name='check circle' size='small' />
            <Text color='grey' smallcaps>{'INSTRUCTIONS'}</Text>
          </MarginDiv>
          <MarginDiv>
            <Text>{translate('sidebar_revealVote_instructions')}</Text>
          </MarginDiv>
          <MarginDiv>
            {this.state.selectedOne && this.state.selectedOne.getIn(['revealExpiry', 'timeleft']) > 0 && (
              <FileInput
                type='file'
                name='file'
                onChange={this.handleFileInput}
              />
            )}
          </MarginDiv>
          <MarginDiv>
            <Button
              onClick={this.handleRevealVote}
              mode='strong'
              wide
            >
              {'Reveal Vote'}
            </Button>
          </MarginDiv>
        </SidePanel>

        <HomeWrapper>
          {candidates.size > 0 && (
            <div>
              {'CANDIDATES'}
              <Table
                header={
                  <TableRow>
                    <TableHeader title="Listing" />
                    <TableHeader title="Time Remaining" />
                    <TableHeader title="Staked Tokens" />
                    <TableHeader title="Badges" />
                    <TableHeader title="Actions" />
                  </TableRow>
                }
              >
                {candidates.map(one => (
                  <TableRow key={one.get('listingHash')}>
                    {/* stats */}
                    <TableCell>
                      <Text>{one.get('listingString')}</Text>
                    </TableCell>
                    <TableCell>
                      {!dateHasPassed(one.getIn(['appExpiry', 'date'])) ?
                        <Countdown end={one.getIn(['appExpiry', 'date'])} /> :
                        'Ready to update'
                      }
                    </TableCell>
                    <TableCell>
                      <JSONTree
                        invertTheme={false}
                        theme={jsonTheme}
                        data={one}
                        shouldExpandNode={(keyName, data, level) => false}
                      />
                    </TableCell>
                    <TableCell>
                      {one.get('owner') === account ?
                        <div>
                          <Icon name='exclamation circle' size='large' color='yellow' />
                          <Icon name='check circle' size='large' color='blue' />
                        </div>
                        : <Icon name='exclamation circle' size='large' color='yellow' />}
                    </TableCell>
                    {/* actions */}
                    <TableCell>
                      <ContextMenu>
                        {one.get('appExpired') &&
                          <CMItem onClick={e => this.handleUpdateStatus(one)}>
                            <Icon name='magic' size='large' color='purple' />
                            {'Update Status'}
                          </CMItem>
                        }
                        <CMItem onClick={e => this.handleExit(one)}>
                          <Icon name='remove circle outline' size='large' color='orange' />
                          {'Remove Listing'}
                        </CMItem>
                        <CMItem onClick={e => this.handleDepositWithdraw(one, 'deposit')}>
                          <Icon name='angle double up' size='large' color='green' />
                          {'Deposit Tokens'}
                        </CMItem>
                        <CMItem onClick={e => this.handleDepositWithdraw(one, 'withdraw')}>
                          <Icon name='angle double down' size='large' color='yellow' />
                          {'Withdraw Tokens'}
                        </CMItem>
                        <CMItem onClick={e => this.openSidePanel(one, 'openChallenge')}>
                          <Icon name='remove circle outline' size='large' color='orange' />
                          {'Challenge Listing'}
                        </CMItem>
                      </ContextMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>
          )}

          {faceoffs.size > 0 && (
            <div>
              {'FACEOFFS'}
              <Table
                header={
                  <TableRow>
                    <TableHeader title="Listing" />
                    <TableHeader title="Time Remaining" />
                    <TableHeader title="" />
                    {/* <TableHeader title="Number of Tokens Voted" /> */}
                    <TableHeader title="Badges" />
                    <TableHeader title="Actions" />
                  </TableRow>
                }
              >
                {faceoffs.map(one => (
                  <TableRow key={one.get('listingHash')}>
                    <TableCell>
                      <Text>{one.get('listingString')}</Text>
                    </TableCell>

                    <TableCell>
                      {!dateHasPassed(one.getIn(['latest', 'commitEndDate']))
                        ? <Countdown end={one.getIn(['latest', 'commitExpiry'])} />
                        : !dateHasPassed(one.getIn(['latest', 'revealEndDate']))
                          ? <Countdown end={one.getIn(['latest', 'revealExpiry'])} />
                          : 'Ready to update'
                      }
                    </TableCell>

                    <TableCell>
                      <JSONTree
                        invertTheme={false}
                        theme={jsonTheme}
                        data={one}
                        shouldExpandNode={(keyName, data, level) => false}
                      />
                    </TableCell>

                    <TableCell>
                      {one.get('owner') === account ?
                        <div>
                          <Icon name='exclamation circle' size='large' color='orange' />
                          <Icon name='check circle' size='large' color='blue' />
                        </div>
                        : <Icon name='exclamation circle' size='large' color='orange' />}
                    </TableCell>

                    <TableCell>
                      <ContextMenu>
                        {!dateHasPassed(one.getIn(['latest', 'commitEndDate'])) &&
                          <CMItem onClick={e => this.openSidePanel(one, 'openCommitVote')}>
                            <Icon name='check circle' size='large' color='orange' />
                            {'Commit Token Vote'}
                          </CMItem>
                        }
                        {dateHasPassed(one.getIn(['latest', 'commitEndDate'])) && !dateHasPassed(one.getIn(['latest', 'revealEndDate'])) &&
                          <CMItem onClick={e => this.openSidePanel(one, 'openRevealVote')}>
                            <Icon name='unlock' size='large' color='orange' />
                            {'Reveal Token Vote'}
                          </CMItem>
                        }
                        {dateHasPassed(one.getIn(['latest', 'revealEndDate'])) &&
                          <div>
                            <CMItem onClick={e => this.handleUpdateStatus(one)}>
                              <Icon name='magic' size='large' color='purple' />
                              <div>
                                {'Update Status'}
                              </div>
                            </CMItem>
                            <CMItem onClick={e => this.handleRescueTokens(one)}>
                              <Icon name='exclamation circle' size='large' color='orange' />
                              {'Rescue Tokens'}
                            </CMItem>
                          </div>
                        }
                      </ContextMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>
          )}


          {whitelist.size > 0 && (
            <div>
              {'REGISTRY'}
              <Table
                header={
                  <TableRow>
                    <TableHeader title="Listing" />
                    <TableHeader title="Deposit" />
                    <TableHeader title="Registered on block" />
                    <TableHeader title="Actions" />
                  </TableRow>
                }
              >
                {whitelist.map(one => (
                  <TableRow key={one.get('listingHash')}>
                    <TableCell>
                      <Text>{one.get('listingString')}</Text>
                    </TableCell>

                    <TableCell>
                      {one.getIn(['latest', 'numTokens'])}
                    </TableCell>

                    <TableCell>
                      <JSONTree
                        invertTheme={false}
                        theme={jsonTheme}
                        data={one}
                        shouldExpandNode={(keyName, data, level) => false}
                      />
                    </TableCell>

                    <TableCell>
                      <ContextMenu>
                        <CMItem onClick={e => this.openSidePanel(one, 'openChallenge')}>
                          <Icon name='remove circle outline' size='large' color='orange' />
                          {'Challenge Listing'}
                        </CMItem>
                      </ContextMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </div>
          )}

          <Button mode='strong' onClick={this.openSidePanel}>{'Apply Listing'}</Button>
          {' '}
          <Button mode='strong' onClick={e => this.openCallPanel('registry')}>{'Call Registry Methods'}</Button>
          {' '}
          <Button mode='strong' onClick={e => this.openCallPanel('voting')}>{'Call Voting Methods'}</Button>
        </HomeWrapper>
      </div >
    )
  }
}

const CMItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 5px 20px;
  cursor: pointer;
  white-space: nowrap;
  & > div {
    padding: 5px;
  }
`

const FileInput = styled.input`
  padding: 1em;
  border: 2px solid ${colors.prism};
`

function mapDispatchToProps(dispatch) {
  return {
    onSetupEthereum: network => dispatch(setupEthereum(network)),
    onRequestModalMethod: e => dispatch(requestModalMethod(e)),
    onSendTransaction: payload => dispatch(sendTransaction(payload)),
    onCall: payload => dispatch(callRequested(payload)),
  }
}

const mapStateToProps = createStructuredSelector({
  error: selectError,
  ethjs: selectEthjs,
  account: selectAccount,
  networkID: selectNetworkID,

  balances: selectBalances,
  txnStatus: selectTxnStatus,

  registry: selectRegistry,
  token: selectToken,
  voting: selectVoting,

  parameters: selectParameters,

  candidates: selectCandidates,
  faceoffs: selectFaceoffs,
  whitelist: selectWhitelist,
  registryMethods: selectRegistryMethods,
  votingMethods: selectVotingMethods,
})

const withConnect = connect(mapStateToProps, mapDispatchToProps)

export default compose(withConnect)(Home)
