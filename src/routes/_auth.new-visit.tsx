import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Select from "react-select";
import { Button, Form, Modal, Table } from "react-bootstrap";
import {
  FeedbackMessage,
  NewGuestForm,
  GuestSelectSearch,
} from "../lib/components";
import { addGuest, getGuestData } from "../lib/api/guest";
import { addVisit } from "../lib/api/visit";
import { addGuestNotification, toggleGuestNotificationStatus } from "../lib/api/notification";
import {
  readableDateTime,
  trimStringValues,
  convertServiceTypeToOption,
  guestSelectOptFrom,
} from "../lib/utils";

interface LoaderData {
  serviceTypes: ServiceType[];
}

const DEFAULT_SERVICE_NAME = "Courtyard";

export const Route = createFileRoute("/_auth/new-visit")({
  component: NewVisitView,
  loader: async ({ context }): Promise<LoaderData> => {
    let { serviceTypes } = context;
    serviceTypes = serviceTypes ?? [];
    return { serviceTypes };
  },
});

function NewVisitView() {
  const { serviceTypes } = Route.useLoaderData();

  const [feedback, setFeedback] = useState<UserMessage>({
    text: "",
    isError: false,
  });

  const [showNewGuestModal, setShowNewGuestModal] = useState(false);
  const [newGuest, setNewGuest] = useState<Guest | null>(null);

  const [selectedGuestOpt, setSelectedGuestOpt] =
    useState<GuestSelectOption | null>(null);

  const [selectedServicesOpt, setSelectedServicesOpt] = useState<
    ReactSelectOption[]
  >([]); // array bc this Select is set to multi

  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)

  const [notifications, setNotifications] = useState<GuestNotification[]>([]);

  const getDefaultService: () => ServiceType | undefined = () => {
    if (!serviceTypes.length) return;
    let defaultService = serviceTypes.find(
      (s) => s.name === DEFAULT_SERVICE_NAME
    );
    if (!defaultService) defaultService = serviceTypes[0];
    return defaultService;
  };
  const setDefaultService = () => {
    const defaultService = getDefaultService();
    if (!defaultService) {
      setSelectedServicesOpt([]);
    } else {
      setSelectedServicesOpt([convertServiceTypeToOption(defaultService)]);
    }
  };

  // set selected guest + option to new guest if exists
  useEffect(() => {
    if (!newGuest) return;
    setSelectedGuest(newGuest)
    setSelectedGuestOpt(guestSelectOptFrom(newGuest))
  }, [newGuest]);

  // get notifications from selected guest
  useEffect(() => {
    if (!selectedGuestOpt) return;
    getGuestData(+selectedGuestOpt.value).then((g) => {
      if (!g.guest_notifications) return; // new guest is partial, so no notifications key
      setNotifications(
        (g.guest_notifications as GuestNotification[]).filter(
          (n: GuestNotification) => n.status === "Active"
        )
      );
    });
  }, [selectedGuestOpt]);

  // default to the first service being selected
  useEffect(() => {
    if (!serviceTypes.length) return;
    let defaultService = getDefaultService();
    if (!defaultService) {
      defaultService = serviceTypes[0];
    }
    setSelectedServicesOpt([convertServiceTypeToOption(defaultService)]);
  }, []);

  return (
    <>
      <h1 className="mb-4">Add New Visit</h1>

      <div className="d-flex gap-3 justify-content-between">
        <h2>Guest</h2>
        <Button variant="primary" onClick={() => setShowNewGuestModal(true)}>
          New Guest
        </Button>
      </div>

      <FeedbackMessage message={feedback} className="my-3" />

      <Modal show={showNewGuestModal}>
        <NewGuestForm
          onSubmit={onSubmitNewGuestForm}
          onClose={onCloseNewGuestForm}
        />
      </Modal>

      <GuestSelectSearch
        newGuest={newGuest}
        onSelect={onSelectGuest}
        selectedGuestOpt={selectedGuestOpt}
      />

      <Notifications
        notifications={notifications}
        selectedGuestOpt={selectedGuestOpt}
        selectedGuest={selectedGuest}
        setNotifications={setNotifications}
      />

      <RequestedServices />
    </>
  );

  function onSelectGuest(selection: GuestSelectOption) {
    setSelectedGuestOpt(selection);
    setSelectedGuest(selection.guest);
  }

  async function onSubmitNewGuestForm(
    guest: Partial<Guest>
  ): Promise<number | null> {
    trimStringValues(guest);
    const guest_id = await addGuest(guest);
    if (!guest_id) return null;
    setShowNewGuestModal(false);
    setFeedback({
      text: `Guest created successfully! ID: ${guest_id}`,
      isError: false,
    });
    const newGuest: Partial<Guest> = { ...guest, guest_id };
    setNewGuest(newGuest as Guest);
    return guest_id;
  }

  function onCloseNewGuestForm() {
    if (!confirm("Discard the new guest?")) return;
    setShowNewGuestModal(false);
  }


  function RequestedServices({ }) {
    return (
      <div>
        <h2>Requested Services</h2>
        <p>
          <i>Select at least 1</i>
        </p>
        <Select
          isMulti
          options={servicesOpts()}
          value={selectedServicesOpt}
          onChange={(newVal: []) => {
            setSelectedServicesOpt(newVal);
          }}
        />
        <Button
          type="submit"
          onClick={logVisit}
          className="mt-4 d-block m-auto"
          disabled={!selectedServicesOpt.length || !selectedGuestOpt}
        >
          Log Visit
        </Button>
      </div>
    );

    /** Map services to `Select` options */
    function servicesOpts() {
      return (
        serviceTypes?.map((s: ServiceType) => convertServiceTypeToOption(s)) ??
        []
      );
    }

    async function logVisit(e) {
      e.preventDefault();
      if (!selectedServicesOpt.length) return;
      // TODO validate "form"
      const v: Partial<Visit> = {
        guest_id: +selectedGuestOpt!.value,
        service_ids: selectedServicesOpt.map(({ value }) => +value),
      };
      const visitId = await addVisit(v);
      if (!visitId) {
        setFeedback({
          text: "Failed to create the visit. Try again in a few.",
          isError: true,
        });
        return;
      }
      setShowNewGuestModal(false);
      setFeedback({
        text: `Visit created successfully! ID: ${visitId}`,
        isError: false,
      });
      clear();
    }
  }

  function clear() {
    setSelectedGuestOpt(null);
    setSelectedGuest(null);
    setDefaultService();
    setNotifications([]);
  }
}



function Notifications({ notifications, selectedGuestOpt, selectedGuest, setNotifications }) {
  const [showModal, setShowModal] = useState(false)
  return (
    <div className="pb-5">
      <div className="d-flex justify-content-between align-items-center">
        <h2>Notifications ({notifications.length})</h2>
        {selectedGuestOpt &&
          <Button
            onClick={() => setShowModal(true)}
          >
            Add Notification
          </Button>
        }
      </div>
      <Modal show={showModal}>
        <AddNotificationForm
          guest={selectedGuest!}
          selectedGuestOpt={selectedGuestOpt}
          onSubmit={onSubmitNotification}
          onCancel={() => setShowModal(false)}
        />
      </Modal>
      {!!notifications.length &&
        <Table>
          <tbody>
            {notifications.map((n: GuestNotification) => {
              const [date, time] = readableDateTime(n.created_at).split(" ");
              return (
                <tr key={n.notification_id} className="align-middle">
                  <td>
                    {date} <br /> {time}
                  </td>
                  <td>{n.message}</td>
                  <td>
                    <Form.Select
                      onChange={async () =>
                        await updateNotificationStatus(
                          n.notification_id,
                          n.status
                        )
                      }
                      style={{ minWidth: "11ch" }}
                      data-notification-id={n.notification_id}
                    >
                      <option value="Active">ACTIVE</option>
                      <option value="Archived">Archive</option>
                    </Form.Select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      }
    </div>
  );

  function onSubmitNotification() {
    setShowModal(false);
    getGuestData(+selectedGuestOpt.value).then((g) => {
      if (!g.guest_notifications) return; // new guest is partial, so no notifications key
      setNotifications(
        (g.guest_notifications as GuestNotification[]).filter(
          (n: GuestNotification) => n.status === "Active"
        )
      );
    });
  }

  async function updateNotificationStatus(
    notificationId: number,
    status: GuestNotificationStatus
  ) {
    const success = await toggleGuestNotificationStatus(notificationId);
    if (success) return;
    // unsuccessful -> revert value
    const notificationSelect = document.querySelector(
      `[data-notification-id="${notificationId}"]`
    ) as HTMLSelectElement | null;
    notificationSelect!.value = status;
  }
}

interface ANFProps {
  guest: Guest;
  selectedGuestOpt: GuestSelectOption;
  onSubmit: () => void;
  onCancel: () => void;
}
function AddNotificationForm({ guest, selectedGuestOpt, onSubmit, onCancel }: ANFProps) {
  const MESSAGE_MIN_LENGTH = 5
  const MESSAGE_MAX_LENGTH = 500
  const [feedbackMessage, setFeedbackMessage] = useState({
    text: "", isError: false
  })

  return (
    <Form
      onSubmit={async (e) => await onSubmitNotification(e)}
      className="m-3"
    >
      <FeedbackMessage message={feedbackMessage} />
      <h2>New Notification</h2>
      <Form.Group className="mb-3">
        <Form.Label className="fs-4">
          To: {guest.first_name} {guest.last_name}
        </Form.Label>
        <Form.Control
          name="guest_id"
          type="number"
          readOnly
          hidden
          value={guest.guest_id}
          onChange={(e) => {
            // TODO: does this do anything (goal: prevent updates even if user removes readonly)
            e.preventDefault()
            return
          }}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Message</Form.Label>
        <Form.Control
          name="message"
          as="textarea"
          minLength={MESSAGE_MIN_LENGTH}
          maxLength={MESSAGE_MAX_LENGTH}
        />
      </Form.Group>
      <Button
        variant="danger"
        onClick={onCancelNotification}
      >Cancel</Button>
      <Button type="submit" className="float-end">Submit</Button>
    </Form>
  )

  function onCancelNotification() {
    if (!confirm("Discard the new notification?")) return;
    onCancel()
  }

  async function onSubmitNotification(e) {
    e.preventDefault()

    if (!selectedGuestOpt) {
      setFeedbackMessage({
        text: "Notification must include a guest.",
        isError: true
      });
      return;
    }

    const { target: form } = e

    const notification = Object.fromEntries(new FormData(form));

    const success = await addGuestNotification(notification);

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
    // setSelectedGuestOpt(null);
    // form.reset()
    onSubmit()
  }
}
