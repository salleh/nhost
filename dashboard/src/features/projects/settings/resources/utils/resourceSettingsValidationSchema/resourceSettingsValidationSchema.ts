import {
  RESOURCE_MEMORY_MULTIPLIER,
  RESOURCE_VCPU_MEMORY_RATIO,
  RESOURCE_VCPU_MULTIPLIER,
} from '@/utils/CONSTANTS';
import * as Yup from 'yup';

/**
 * The minimum total CPU that has to be allocated.
 */
export const MIN_TOTAL_VCPU = 1 * RESOURCE_VCPU_MULTIPLIER;

/**
 * The minimum amount of memory that has to be allocated in total.
 */
export const MIN_TOTAL_MEMORY =
  (MIN_TOTAL_VCPU / RESOURCE_VCPU_MULTIPLIER) *
  RESOURCE_VCPU_MEMORY_RATIO *
  RESOURCE_MEMORY_MULTIPLIER;

/**
 * The maximum total CPU that can be allocated.
 */
export const MAX_TOTAL_VCPU = 60 * RESOURCE_VCPU_MULTIPLIER;

/**
 * The maximum amount of memory that can be allocated in total.
 */
export const MAX_TOTAL_MEMORY = MAX_TOTAL_VCPU * RESOURCE_VCPU_MEMORY_RATIO;

/**
 * The minimum amount of replicas that has to be allocated per service.
 */
export const MIN_SERVICE_REPLICAS = 1;

/**
 * The maximum amount of replicas that can be allocated per service.
 */
export const MAX_SERVICE_REPLICAS = 32;

/**
 * The minimum amount of CPU that has to be allocated per service.
 */
export const MIN_SERVICE_VCPU = 0.25 * RESOURCE_VCPU_MULTIPLIER;

/**
 * The maximum amount of CPU that can be allocated per service.
 */
export const MAX_SERVICE_VCPU = 15 * RESOURCE_VCPU_MULTIPLIER;

/**
 * The minimum amount of memory that has to be allocated per service.
 */
export const MIN_SERVICE_MEMORY = 128;

/**
 * The maximum amount of memory that can be allocated per service.
 */
export const MAX_SERVICE_MEMORY =
  (MAX_SERVICE_VCPU / RESOURCE_VCPU_MULTIPLIER) *
  RESOURCE_VCPU_MEMORY_RATIO *
  RESOURCE_MEMORY_MULTIPLIER;

const serviceValidationSchema = Yup.object({
  replicas: Yup.number()
    .label('Replicas')
    .required()
    .min(1)
    .max(MAX_SERVICE_REPLICAS)
    .test(
      'is-matching-ratio',
      `vCPU and Memory for this service must match the 1:${RESOURCE_VCPU_MEMORY_RATIO} ratio if more than one replica is selected.`,
      (replicas: number, { parent }) => {
        if (replicas === 1) {
          return true;
        }

        return (
          parent.memory /
            RESOURCE_MEMORY_MULTIPLIER /
            (parent.vcpu / RESOURCE_VCPU_MULTIPLIER) ===
          RESOURCE_VCPU_MEMORY_RATIO
        );
      },
    ),
  vcpu: Yup.number()
    .label('vCPUs')
    .required()
    .min(MIN_SERVICE_VCPU)
    .max(MAX_SERVICE_VCPU),
  memory: Yup.number()
    .required()
    .min(MIN_SERVICE_MEMORY)
    .max(MAX_SERVICE_MEMORY),
});

export const resourceSettingsValidationSchema = Yup.object({
  enabled: Yup.boolean(),
  totalAvailableVCPU: Yup.number()
    .label('Total Available vCPUs')
    .required()
    .min(MIN_TOTAL_VCPU)
    .max(MAX_TOTAL_VCPU)
    .test(
      'is-equal-to-services',
      'Total vCPUs must be equal to the sum of all services.',
      (totalAvailableVCPU: number, { parent }) =>
        parent.database.vcpu +
          parent.hasura.vcpu +
          parent.auth.vcpu +
          parent.storage.vcpu ===
        totalAvailableVCPU,
    ),
  totalAvailableMemory: Yup.number()
    .label('Available Memory')
    .required()
    .min(MIN_TOTAL_MEMORY)
    .max(MAX_TOTAL_MEMORY)
    .test(
      'is-equal-to-services',
      'Total memory must be equal to the sum of all services.',
      (totalAvailableMemory: number, { parent }) =>
        parent.database.memory +
          parent.hasura.memory +
          parent.auth.memory +
          parent.storage.memory ===
        totalAvailableMemory,
    ),
  database: serviceValidationSchema.required(),
  hasura: serviceValidationSchema.required(),
  auth: serviceValidationSchema.required(),
  storage: serviceValidationSchema.required(),
});

export type ResourceSettingsFormValues = Yup.InferType<
  typeof resourceSettingsValidationSchema
>;
