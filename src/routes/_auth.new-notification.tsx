import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { FeedbackMessage, GuestSelectSearch } from '../lib/components'
import { Button, Form } from "react-bootstrap";
import { addGuestNotification } from '../lib/api';

export const Route = createFileRoute('/_auth/new-notification')({
  component: NewNotificationView,
})

function NewNotificationView() {

  return (
    <>
      <h1>Add New Notification</h1>
      <AddNewNotificationForm />
    </>
  )
}

function AddNewNotificationForm() {

  const [selectedGuestOpt, setSelectedGuestOpt] = useState<ReactSelectOption | null>();
  const [message, setMessage] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState({
    text: "",
    isError: false
  })

  const handleCreateNotification = async (e) => {
    if (!selectedGuestOpt) {
      setFeedbackMessage({
        text: "Notification must include a guest.",
        isError: true
      });
      return;
    }

    const success = await addGuestNotification({ guest_id: +selectedGuestOpt.value, message });

    if (!success) {
      setFeedbackMessage({
        text: "Oops! The notification couldn't be created. Try again in a few.",
        isError: true
      });
      return;
    }

    setFeedbackMessage({
      text: "Notification created!",
      isError: false
    });
    setSelectedGuestOpt(null);
    setMessage("");
  }

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCreateNotification(e)
    }
  }

  return (
    <>
      <FeedbackMessage
        message={feedbackMessage}
      />

      <GuestSelectSearch
        newGuest={undefined}
        selectedGuestOpt={selectedGuestOpt}
        setSelectedGuestOpt={setSelectedGuestOpt}
      />

      <Form id="new-notification">
        <Form.Group className="mb-3" controlId="message">
          <Form.Control
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleEnter}
            placeholder="Message (optional)"
          />
        </Form.Group>

        <Button variant="primary" onClick={handleCreateNotification}>
          Create Notification
        </Button>
      </Form>
    </>
  )
}
