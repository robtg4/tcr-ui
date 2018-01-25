import contract from 'truffle-contract'
import abis from '../contracts'
import { getDefaults } from './defaults'

import { decimalConversion, fromToken } from '../libs/units'
import { voteUtils } from '../utils/vote_utils';

class ContractFactory {
  constructor(eth, account, registry, c) {
    return this.initContract(eth, account, registry, c)
  }

  initContract = async (eth, account, registry, c) => {
    const Contract = contract(abis[c])
    console.log('c', c)
    Contract.setProvider(eth.currentProvider)
    Contract.defaults(getDefaults(account))

    this.address = await registry[c].call()
    this.contract = await Contract.at(this.address)

    await this.params(c, account)

    return this
  }

  params = async (c, account) => {
    if (c === 'parameterizer') {
      this.minDeposit = (await this.contract.get('minDeposit')).toString(10)
      this.pMinDeposit = (await this.contract.get('pMinDeposit')).toString(10)
      this.applyStageLen = (await this.contract.get('applyStageLen')).toString(
        10
      )
      this.pApplyStageLen = (await this.contract.get(
        'pApplyStageLen'
      )).toString(10)
      this.commitStageLen = (await this.contract.get(
        'commitStageLen'
      )).toString(10)
      this.pCommitStageLen = (await this.contract.get(
        'pCommitStageLen'
      )).toString(10)
      this.revealStageLen = (await this.contract.get(
        'revealStageLen'
      )).toString(10)
      this.pRevealStageLen = (await this.contract.get(
        'pRevealStageLen'
      )).toString(10)
      this.dispensationPct = (await this.contract.get(
        'dispensationPct'
      )).toString(10)
      this.pDispensationPct = (await this.contract.get(
        'pDispensationPct'
      )).toString(10)
      this.voteQuorum = (await this.contract.get('voteQuorum')).toString(10)
      this.pVoteQuorum = (await this.contract.get('pVoteQuorum')).toString(10)
    } else if (c === 'token') {
      this.name = await this.contract.name.call()
      this.decimals = await this.contract.decimals.call()
      this.symbol = await this.contract.symbol.call()
      this.totalSupply = await this.contract.totalSupply.call()
      this.decimalPower = decimalConversion(this.decimals)
      const tokenBalance = await this.contract.balanceOf(account)
      console.log('tokenBalance', tokenBalance)
      console.log('natural unit balance:', tokenBalance.toString(10))
      this.balance = fromToken(tokenBalance, this.decimalPower).toString(10)
    }
    return
  }

  allowance = async (owner, spender) => {
    const tokensAllowed = await this.contract.allowance.call(owner, spender)
    console.log('tokensAllowed', tokensAllowed.toString(10))
    this.tokensAllowed = fromToken(tokensAllowed, this.decimalPower).toString(10)
    console.log('this.tokensAllowed', this.tokensAllowed)
    const obj = {
      allowance: this.tokensAllowed,
      balance: this.balance
    }
    return obj
  }

  commitVote = async (args) => {
    const receipt = await voteUtils.commitVote(this.contract, ...args)
    return receipt
  }
}

export default ContractFactory
// const ContractFactoryInit = new ContractFactory()

// export default ContractFactoryInit
