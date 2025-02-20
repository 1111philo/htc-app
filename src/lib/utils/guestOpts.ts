/** Make string for option label */
export function guestOptLabel(g: Guest) {
  return `${g.guest_id} : ${g.first_name} ${g.last_name} : ${g.dob}`;
}

/** Map guests to `Select` options */
export function guestLookupOpts(guests: Guest[]): ReactSelectOption[] {
  return guests.map((g) => guestSelectOptFrom(g));
}

/** Given a Guest, return a Guest select option. */
export function guestSelectOptFrom(guest: Guest): GuestSelectOption {
  return {
    value: String(guest.guest_id),
    label: guestOptLabel(guest),
    guest
  };
}
