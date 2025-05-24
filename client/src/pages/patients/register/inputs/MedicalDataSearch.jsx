import PropTypes from 'prop-types';

import { useState, useRef, useEffect } from 'react';
import { Box, Combobox, useCombobox, Pill, ScrollArea, Button, Text } from '@mantine/core';
import { useDebouncedCallback } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

import SearchDatabaseInputField from './SearchDatabaseInputField';
import LifelineAPI from '../../LifelineAPI';
import RegisterAllergy from './RegisterAllergy';

const API_PATHS = {
  allergies: 'allergy',
  medications: 'medication',
  conditions: 'condition',
};

const medicalDataSearchProps = {
  category: PropTypes.string.isRequired,
  form: PropTypes.object.isRequired,
  initialMedicalData: PropTypes.array,
};

/**
 *  Medical Data Search component for Medical Data section of patient form
 * @param {PropTypes.InferProps<typeof medicalDataSearchProps>} props
 */
export default function MedicalDataSearch ({
  category,
  form,
  initialMedicalData,
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [value, setValue] = useState(initialMedicalData);
  const [empty, setEmpty] = useState(false);
  const [search, setSearch] = useState('');
  const abortController = useRef();
  const [registerAllergyOpened, { open: openRegisterAllergy, close: closeRegisterAllergy }] = useDisclosure(false);

  useEffect(() => {
    if (initialMedicalData !== undefined) {
      setValue(initialMedicalData);
    }
  }, [initialMedicalData]);

  const fetchOptions = useDebouncedCallback(async (query) => {
    abortController.current?.abort();
    abortController.current = new AbortController();
    setLoading(true);

    try {
      const result = await LifelineAPI.getMedicalData(
        category,
        API_PATHS[category],
        query
      );
      setData(result);
      setLoading(false);
      setEmpty(result.length === 0);
      abortController.current = undefined;
    } catch (error) {
      console.error(error);
      notifications.show({
        title: 'Error',
        message: 'Issue with fetching data from server',
        color: 'red',
      });
      abortController.current = undefined;
      setLoading(false);
    }
  }, 500);

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex('active'),
  });

  const handleSelectValue = (id, key) => {
    if (id === '$register' && category === 'allergies') {
      openRegisterAllergy();
      return;
    }

    const name = key.children;
    setValue((current) =>
      current.includes(id)
        ? current.filter((v) => v.id !== id)
        : [...current, { id, name }]
    );

    form.setFieldValue(`medicalData.${category}`, (current) => [
      ...current,
      id,
    ]);
    combobox.closeDropdown();
    setSearch('');
  };

  const handleValueRemove = (val) => {
    setValue((current) => current.filter((v) => v.id !== val));
    form.setFieldValue(`medicalData.${category}`, (current) =>
      current.filter((v) => v !== val)
    );
  };

  const values = value?.map((item) => {
    return (
      <Pill
        key={item?.id}
        withRemoveButton
        radius='md'
        size='md'
        onRemove={() => handleValueRemove(item?.id)}
      >
        {item?.name}
      </Pill>
    );
  });

  const options = (data || [])
    .filter((item) => !value.some((v) => v.id === item.id))
    .map((item) => (
      <Combobox.Option
        value={item.id}
        key={item.id}
        active={value.includes(item.name)}
      >
        {item.name}
      </Combobox.Option>
    ));

  const handleNewAllergy = (id, name) => {
    setValue((current) => [...current, { id, name }]);
    form.setFieldValue(`medicalData.${category}`, (current) => [...current, id]);
    setSearch('');
    closeRegisterAllergy();
  };

  /**
   *
   * Conditional rendering of combobox content
   */
  function renderComboxContent () {
    if (data.length === 0) {
      return (
        <>
          {category === 'allergies' && (
            <Combobox.Option value="$register">
              <Text fw={700} size="sm">
                + Add allergies
              </Text>
            </Combobox.Option>
          )}
          <Combobox.Empty>Start typing to search</Combobox.Empty>
        </>
      );
    }

    if (options.length === 0) {
      return (
        <>
          {category === 'allergies' && (
            <Combobox.Option value="$register">
              <Text fw={700} size="sm">
                + Add allergies
              </Text>
            </Combobox.Option>
          )}
          <Combobox.Empty>All options selected</Combobox.Empty>
        </>
      );
    }

    return (
      <ScrollArea.Autosize type='scroll' mah={200}>
        {category === 'allergies' && (
          <Combobox.Option value="$register">
            <Text fw={700} size="sm">
              + Add allergies
            </Text>
          </Combobox.Option>
        )}
        {options}
      </ScrollArea.Autosize>
    );
  }

  return (
    <Box>
      <SearchDatabaseInputField
        data={data}
        loading={loading}
        combobox={combobox}
        label={category.charAt(0).toUpperCase() + category.slice(1)}
        searchQuery={search}
        handleSelectValue={handleSelectValue}
        fetchOptions={fetchOptions}
        comboboxOptions={renderComboxContent}
        handleSearch={setSearch}
      >
        <Pill.Group style={{ marginTop: '6px' }}>{values}</Pill.Group>
      </SearchDatabaseInputField>
      {category === 'allergies' && (
        <RegisterAllergy
          setAllergy={handleNewAllergy}
          registerAllergyOpened={registerAllergyOpened}
          closeRegisterAllergy={closeRegisterAllergy}
          fetchOptions={fetchOptions}
        />
      )}
    </Box>
  );
}

MedicalDataSearch.propTypes = medicalDataSearchProps;
