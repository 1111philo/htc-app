import { useState } from 'react';
import Select from 'react-select';
import { useDebouncedCallback } from "use-debounce";
import { getGuestsWithQuery } from '../api';
import { guestLookupOpts, guestSelectOptFrom } from '../utils';

import { Form } from 'react-bootstrap';

interface Props {
  newGuest?: Guest | null;
  onSelect: (selection: GuestSelectOption) => void;
  selectedGuestOpt: GuestSelectOption | null;
}
export default function GuestSelectSearch({
  newGuest,
  onSelect,
  selectedGuestOpt
}: Props) {
  const [guestSelectOpts, setGuestSelectOpts] = useState<
    { value: string; label: string }[]
  >([]);

  const [searchText, setSearchText] = useState("");

  const executeSearch = useDebouncedCallback((searchText) => {
    getGuestsWithQuery(searchText.trim()).then((guestsResponse) => {
      setGuestSelectOpts(guestLookupOpts(guestsResponse.rows));
    });
  }, 500);

  return (
    <Form className="mt-3 my-5">
      <Form.Group className="mb-3" controlId="formUID">
        <Form.Label>
          <i>Search by UID, Name, or Birthday (YYYY-MM-DD):</i>
        </Form.Label>
        <Select
          id="user-dropdown"
          options={
            newGuest
              ? [guestSelectOptFrom(newGuest)]
              : guestSelectOpts
          }
          defaultValue={selectedGuestOpt}
          defaultInputValue={searchText}
          value={selectedGuestOpt}
          onChange={(newVal) => onSelect(newVal)}
          onInputChange={onChangeInput}
          menuIsOpen={!!searchText}
          placeholder={"Search for a guest..."}
        />
      </Form.Group>
    </Form>
  );

  function onChangeInput(val) {
    setSearchText(val);
    val && executeSearch(val.trim());
  }
}
