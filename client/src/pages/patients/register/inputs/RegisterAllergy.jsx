import PropTypes from 'prop-types';
import {
  TextInput,
  Button,
  Alert,
  Modal,
  Transition,
  Text,
  Select,
} from '@mantine/core';
import { useForm, isNotEmpty } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { useMutation } from '@tanstack/react-query';
import LifelineAPI from '../../LifelineAPI.js';
import { StatusCodes } from 'http-status-codes';
import { useTranslation } from 'react-i18next';

import classes from './RegisterAllergy.module.css';

const registerAllergyProps = {
  setAllergy: PropTypes.func.isRequired,
  registerAllergyOpened: PropTypes.bool.isRequired,
  closeRegisterAllergy: PropTypes.func.isRequired,
  fetchOptions: PropTypes.func.isRequired,
};

export default function RegisterAllergy({
  setAllergy,
  registerAllergyOpened,
  closeRegisterAllergy,
  fetchOptions,
}) {
  const { t } = useTranslation();
  const [
    confirmationModalOpened,
    { open: openConfirmationModal, close: closeConfirmationModal },
  ] = useDisclosure(false);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      name: '',
      type: 'OTHER',
    },
    validate: {
      name: isNotEmpty('Allergy name is required'),
      type: isNotEmpty('Allergy type is required'),
    },
  });

  const {
    error,
    reset: mutationReset,
    mutateAsync,
  } = useMutation({
    mutationKey: ['allergy'],
    mutationFn: async (data) => {
      const res = await LifelineAPI.registerAllergy(data);
      if (res.status === StatusCodes.CREATED) {
        return await res.json();
      } else {
        const { message } = await res.json();
        throw new Error(message);
      }
    },
  });

  const handleSubmit = async (values) => {
    try {
      const result = await mutateAsync({
        ...values,
        system: 'SNOMED',
        code: 'CUSTOM'
      });
      setAllergy(result.id, result.name);
      fetchOptions(result.name);
      form.reset();
      mutationReset();
      closeRegisterAllergy();
    } catch (error) {
      console.error(error.message);
    }
  };

  const confirmClose = (confirmed) => {
    if (form.isDirty() && confirmed) {
      closeConfirmationModal();
      form.reset();
      mutationReset();
    }
    if (form.isDirty()) {
      openConfirmationModal();
    } else {
      form.reset();
      closeRegisterAllergy();
    }
  };

  return (
    <>
      <Modal
        opened={registerAllergyOpened}
        onClose={confirmClose}
        title="Add custom allergy"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Transition
            mounted={error}
            transition="slide-right"
            duration={400}
            timingFunction="ease"
          >
            {(transitionStyle) => (
              <Alert
                title="Failed to add allergy"
                color="red"
                style={{ ...transitionStyle }}
              >
                {error?.message}
              </Alert>
            )}
          </Transition>
          <TextInput
            label="Allergy Name"
            placeholder="Enter allergy name"
            withAsterisk
            key={form.key('name')}
            {...form.getInputProps('name')}
          />
          <Select
            label="Allergy Type"
            placeholder="Select allergy type"
            withAsterisk
            data={[
              { value: 'DRUG', label: t('AllergyType.DRUG') },
              { value: 'OTHER', label: t('AllergyType.OTHER') },
            ]}
            key={form.key('type')}
            {...form.getInputProps('type')}
          />
          <Button
            style={{ marginTop: '1rem' }}
            color="gray"
            fullWidth
            onClick={form.onSubmit(handleSubmit)}
          >
            Add Allergy
          </Button>
        </form>
      </Modal>
      <Modal
        opened={confirmationModalOpened}
        onClose={closeConfirmationModal}
        classNames={{
          title: classes.title,
        }}
        title='This form has unsaved changes.'
        yOffset='16vh'
      >
        <Text fw={600}>
          Are you sure you want to close this form without submitting?
        </Text>
        <Button
          classNames={{ root: classes.button }}
          color='red'
          fullWidth
          onClick={() => confirmClose(true)}
        >
          Yes, close without saving
        </Button>
      </Modal>
    </>
  );
}

RegisterAllergy.propTypes = registerAllergyProps; 