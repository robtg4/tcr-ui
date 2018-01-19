import React, { Component } from 'react'
import ReactModal from 'react-modal'
import styled from 'styled-components'
import UDapp from '../UDapp'


import { colors } from '../../components/Colors'
import H2 from '../../components/H2'

const Wrapper = styled.div`
  /* position: absolute;
  top: 50;
  left: 50; */

  padding: 1em;
  border: 2px solid ${colors.darkBlue};
`
const ModalMessage = styled.div`
  padding: 0 2em 2em;
`

const modalStyles = {
  overlay: {
    position: 'absolute',
    top: '0',
    left: '15vw',
    right: '15vw',
    backgroundColor: 'rgba(255, 255, 255, 1)',
    border: '1px solid black',
    boxShadow: '6px 6px 6px rgba(0, 0, 0, .2)',
    zIndex: '5',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    border: '1px solid red',
  },
}

class Modal extends Component {
  constructor(props) {
    super(props)
    this.state = {
      modalIsOpen: false,
    }
  }

  handleOpenModal = () => {
    console.log('open modal event')
    this.setState({
      modalIsOpen: true,
    })
  }

  handleCloseModal = () => {
    console.log('close modal event')
    this.setState({
      modalIsOpen: false,
    })
  }

  handleAfterOpen = () => {
    console.log('open', this)
  }

  handleRequestClose = () => {
    console.log('close', this)
    this.setState({
      modalIsOpen: false,
    })
  }

  render() {
    return (
      <Wrapper>
        <ReactModal
          isOpen={this.state.modalIsOpen}
          onAfterOpen={this.handleAfterOpen}
          onRequestClose={this.handleRequestClose}
          style={modalStyles}
          contentLabel="Notification Modal"
          portalClassName="NotificationModalPortal"
          overlayClassName="NotificationModal__Overlay"
          className="NotificationModal__Content"
          bodyOpenClassName="NotificationModal__Body--open"
          ariaHideApp={false}
          shouldFocusAfterRender={true}
          shouldCloseOnOverlayClick={false}
          shouldCloseOnEsc={true}
          shouldReturnFocusAfterClose={true}
          role="dialog"
        >
          <H2>{this.props.messages.heading}</H2>
          <ModalMessage>{this.props.messages.default}</ModalMessage>

          <UDapp />
        </ReactModal>

        <div onClick={this.handleOpenModal}>UDapp Transaction Modal</div>
      </Wrapper>
    )
  }
}

export default Modal
