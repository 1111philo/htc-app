/** API calls related to Services */

import * as API from "aws-amplify/api";

export async function fetchServiceByID(serviceId: number) {
  const serviceResponse = await (
    API.post({
      apiName: "auth",
      path: "/getServices",
      options: {
        body: {
          service_id: serviceId
        }
      }
    }).response
  )
  const [service,]: ServiceType[] = (await serviceResponse.body.json())!.rows
  return service;
}

export async function fetchServices() {
  const servicesResponse = await (
    API.post({
      apiName: "auth",
      path: "/getServices"
    }).response
  )
  const services: ServiceType[] = (await servicesResponse.body.json())!.rows
  return services;
}

export async function fetchServiceGuestsSlotted(serviceId: number): Guest[] {
  const guestsSlotted = await (
    await API.post({
      apiName: "auth",
      path: "/serviceGuestsSlotted",
      options: {
        body: {
          service_id: serviceId
        }
      }
    }).response
  ).body.json()
  return guestsSlotted;
}

export async function fetchServiceGuestsQueued(serviceId: number) {
  const guestsQueuedResponse = await (
    API.post({
      apiName: "auth",
      path: "/serviceGuestsQueued",
      options: {
        body: {
          service_id: serviceId
        }
      }
    }).response
  )
  const guestsQueued = (await guestsQueuedResponse.body.json())
  return guestsQueued;
}

export async function fetchServiceGuestsCompleted(serviceId: number) {
  const guestsCompletedResponse = await (
    API.post({
      apiName: "auth",
      path: "/serviceGuestsCompleted",
      options: {
        body: {
          service_id: serviceId
        }
      }
    }).response
  )
  const guestsCompleted = (await guestsCompletedResponse.body.json())!
  return guestsCompleted;
}

// send api call to /updateGuestServiceStatus
export async function updateGuestServiceStatus(
  service: ServiceType,
  newStatus: string,
  guestId: number,
  slotNum: number | null
) {
  const updateGuestServiceStatusResponse = await (
    await API.post({
      apiName: "auth",
      path: "/updateGuestServiceStatus",
      options: {
        body: {
          status: newStatus,
          guest_id: guestId,
          service_id: service.service_id,
          slot_id: slotNum ?? null
        }
      }
    }).response
  ).statusCode
  return updateGuestServiceStatusResponse;
}