import { useFlags } from 'src/hooks/useFlags';
import { useAccount } from 'src/queries/account/account';
import { isFeatureEnabledV2 } from 'src/utilities/accountCapabilities';
import { arrayToList } from 'src/utilities/arrayToList';

import {
  DEDICATED_512_GB_PLAN,
  LIMITED_AVAILABILITY_COPY,
  PLAN_IS_CURRENTLY_UNAVAILABLE_COPY,
  PLAN_IS_SMALLER_THAN_USAGE_COPY,
  PLAN_IS_TOO_SMALL_FOR_APL_COPY,
  PLAN_NOT_AVAILABLE_IN_REGION_COPY,
  PREMIUM_512_GB_PLAN,
  SMALLER_PLAN_DISABLED_COPY,
  TIKTOK_MTC_CUSTOM_PLANS_AVAILABILITY_REGIONS,
} from './constants';

import type {
  DisabledTooltipReasons,
  PlanSelectionType,
  PlanWithAvailability,
} from './types';
import type {
  Capabilities,
  LinodeTypeClass,
  Region,
  RegionAvailability,
} from '@linode/api-v4';
import type { Flags } from 'src/featureFlags';
import type { ExtendedType } from 'src/utilities/extendType';

export type PlansTypes<T> = Record<LinodeTypeClass, T[]>;

interface PlansByType<T> extends Omit<PlansTypes<T>, 'nanode' | 'standard'> {
  shared: T[];
}

// We could update this to add or remove any new or existing plan tabs.
export const planTypeOrder: (
  | 'shared'
  | Exclude<LinodeTypeClass, 'nanode' | 'standard'>
)[] = [
  'prodedicated',
  'dedicated',
  'shared',
  'highmem',
  'gpu',
  'metal',
  'premium',
  'accelerated',
];

export const useIsAcceleratedPlansEnabled = () => {
  const flags = useFlags();

  const { data: account } = useAccount();

  const isAcceleratedLinodePlans = Boolean(
    flags?.acceleratedPlans?.linodePlans
  );
  const isAcceleratedLKEPlans = Boolean(flags?.acceleratedPlans?.lkePlans);

  const isAcceleratedLinodePlansEnabled = isFeatureEnabledV2(
    'NETINT Quadra T1U',
    isAcceleratedLinodePlans,
    account?.capabilities ?? []
  );
  const isAcceleratedLKEPlansEnabled = isFeatureEnabledV2(
    'NETINT Quadra T1U',
    isAcceleratedLKEPlans,
    account?.capabilities ?? []
  );

  return { isAcceleratedLKEPlansEnabled, isAcceleratedLinodePlansEnabled };
};

export const useIsTikTokMTCPlansEnabled = (
  selectedRegion: string | undefined
) => {
  const flags = useFlags();

  const { data: account } = useAccount();

  // const isTikTokMTCLinodePlans = Boolean(flags?.tiktokMTCPlans?.linodePlans);
  // const isTikTokLKEPlans = Boolean(flags?.tiktokMTCPlans?.lkePlans);

  const isTikTokMTCLinodePlans = Boolean(flags?.tiktokMTCPlans);
  const isTikTokLKEPlans = Boolean(flags?.tiktokMTCPlans);

  const isTikTokMTCLinodePlansEnabled = isFeatureEnabledV2(
    'TikTok MTC Plans',
    isTikTokMTCLinodePlans,
    account?.capabilities ?? []
  );
  const isTikTokMTCLKEPlansEnabled = isFeatureEnabledV2(
    'TikTok MTC Plans',
    isTikTokLKEPlans,
    account?.capabilities ?? []
  );

  const isTikTokMTCLinodePlansEnabledRegion = Boolean(
    selectedRegion &&
      TIKTOK_MTC_CUSTOM_PLANS_AVAILABILITY_REGIONS.includes(selectedRegion) &&
      isTikTokMTCLinodePlansEnabled
  );

  const isTikTokMTCLKEPlansEnabledRegion = Boolean(
    selectedRegion &&
      TIKTOK_MTC_CUSTOM_PLANS_AVAILABILITY_REGIONS.includes(selectedRegion) &&
      isTikTokMTCLKEPlansEnabled
  );

  return {
    isTikTokMTCLKEPlansEnabled,
    isTikTokMTCLKEPlansEnabledRegion,
    isTikTokMTCLinodePlansEnabled,
    isTikTokMTCLinodePlansEnabledRegion,
  };
};

/**
 * getPlanSelectionsByPlanType function takes an array of types, groups
 * them based on their class property into different plan types, filters out empty
 * plan types, and returns an object containing the filtered plan selections.
 * getPlanSelectionsByPlanType is common util funtion used to provide plans by
 * type to Linode, Database and LKE plan tables.
 * The planTypeOrder array specifies the order in which the Linode types should be processed.
 * Any change to the order can result in incorrect rendering of plan tabs.
 */

export const getPlanSelectionsByPlanType = <
  T extends { class: LinodeTypeClass }
>(
  types: T[]
): Partial<PlansByType<T>> => {
  const plansByType: PlansByType<T> = planTypeOrder.reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {} as PlansByType<T>);

  // group plans by type
  for (const type of types) {
    switch (type.class) {
      case 'nanode':
      case 'standard':
        plansByType['shared'].push(type);
        break;
      default:
        if (plansByType.hasOwnProperty(type.class)) {
          plansByType[type.class].push(type);
        }
        break;
    }
  }

  // filter empty plan group
  return Object.keys(plansByType).reduce<Partial<PlansByType<T>>>(
    (acc, key) => {
      if (plansByType[key as keyof PlansByType<T>].length > 0) {
        acc[key as keyof PlansByType<T>] =
          plansByType[key as keyof PlansByType<T>];
      }
      return acc;
    },
    {} as PlansByType<T>
  );
};

export const determineInitialPlanCategoryTab = (
  types: (ExtendedType | PlanSelectionType)[],
  selectedId?: string,
  currentPlanHeading?: string
): number => {
  const plans = getPlanSelectionsByPlanType(types);

  const tabOrder: LinodeTypeClass[] = Object.keys(plans).map((plan) =>
    plan === 'shared' ? 'standard' : (plan as LinodeTypeClass)
  );

  // Determine initial plan category tab based on current plan selection
  // (if there is one).
  const _selectedTypeClass =
    types.find(
      (type) => type.id === selectedId || type.heading === currentPlanHeading
    )?.class ?? 'dedicated';

  // We don't have a "Nanodes" tab anymore, so use `standard` (labeled as "Shared CPU").
  const selectedTypeClass =
    _selectedTypeClass === 'nanode' ? 'standard' : _selectedTypeClass;

  return tabOrder.indexOf(selectedTypeClass);
};

export const getRegionsWithCapability = (
  capability: Capabilities,
  regions: Region[]
) => {
  const withCapability = regions
    ?.filter((thisRegion: Region) =>
      thisRegion.capabilities.includes(capability)
    )
    .map((thisRegion: Region) => thisRegion.label);
  return arrayToList(withCapability ?? []);
};

interface LimitedAvailabilityPlanStatusOptions {
  plan: PlanSelectionType;
  regionAvailabilities: RegionAvailability[] | undefined;
  selectedRegionId: Region['id'] | undefined;
}

/**
 * Utility to determine if a plan is limited availability based on a region's availability.
 */
export const getIsLimitedAvailability = ({
  plan,
  regionAvailabilities,
  selectedRegionId,
}: LimitedAvailabilityPlanStatusOptions): boolean => {
  if (!regionAvailabilities || !selectedRegionId) {
    return false;
  }

  const availability = regionAvailabilities?.find((regionAvailability) => {
    const regionMatch = regionAvailability?.region === selectedRegionId;

    if (!regionMatch) {
      return false;
    }

    if (regionAvailability.plan === plan.id) {
      return regionAvailability.available === false;
    }

    return false;
  });

  return !!availability;
};

export const planTabInfoContent = {
  accelerated: {
    dataId: 'data-qa-accelerated',
    key: 'accelerated',
    title: 'Accelerated',
    typography:
      'Accelerated instances leverage ASICs to accelerate specialized tasks such as video transcoding, media processing, and other compute heavy workloads.',
  },
  dedicated: {
    dataId: 'data-qa-dedicated',
    key: 'dedicated',
    title: 'Dedicated CPU',
    typography:
      'Dedicated CPU instances are good for full-duty workloads where consistent performance is important.',
  },
  gpu: {
    dataId: 'data-qa-gpu',
    key: 'gpu',
    title: 'GPU',
    typography:
      'Linodes with dedicated GPUs accelerate highly specialized applications such as machine learning, AI, and video transcoding.',
  },
  highmem: {
    dataId: 'data-qa-highmem',
    key: 'highmem',
    title: 'High Memory',
    typography:
      'High Memory instances favor RAM over other resources, and can be good for memory hungry use cases like caching and in-memory databases. All High Memory plans use dedicated CPU cores.',
  },
  metal: {
    dataId: 'data-qa-metal',
    key: 'metal',
    title: 'Bare Metal',
    typography:
      'Bare Metal Linodes give you full, dedicated access to a single physical machine. Some services, including backups, VLANs, and disk management, are not available with these plans.',
  },
  premium: {
    dataId: 'data-qa-premium',
    key: 'premium',
    title: 'Premium CPU',
    typography:
      'Premium CPU instances guarantee a minimum processor generation of AMD EPYC\u2122 Milan or newer to ensure consistent high performance for more demanding workloads.',
  },
  prodedicated: {
    dataId: 'data-qa-prodedi',
    key: 'prodedicated',
    title: 'Pro Dedicated CPU',
    typography:
      'Pro Dedicated CPU instances are for very demanding workloads. They only have AMD 2nd generation processors or newer.',
  },
  shared: {
    dataId: 'data-qa-standard',
    key: 'shared',
    title: 'Shared CPU',
    typography:
      'Shared CPU instances are good for medium-duty workloads and are a good mix of performance, resources, and price.',
  },
};

/**
 * If the Dedicated 512 GB plan is present in the response, overwrite it.
 * If it isn't, insert a placeholder at the end of the array.
 */
export const replaceOrAppendPlaceholder512GbPlans = (
  types: (ExtendedType | PlanSelectionType)[]
) => {
  // DBaaS does not currently offer a 512 GB plan
  const isInDatabasesFlow = types.some((type) => type.label.includes('DBaaS'));
  if (isInDatabasesFlow) {
    return types;
  }

  // Function to replace or append a specific plan
  const replaceOrAppendPlan = <T extends ExtendedType | PlanSelectionType>(
    planLabel: string,
    planData: T
  ) => {
    const index = types.findIndex((type) => type.label === planLabel);

    if (index !== -1) {
      types[index] = planData;
    } else {
      types.push(planData);
    }
  };

  // For Linodes and LKE
  replaceOrAppendPlan('Dedicated 512GB', DEDICATED_512_GB_PLAN);
  replaceOrAppendPlan('Premium 512GB', PREMIUM_512_GB_PLAN);

  return types;
};

// export const getPlanTypes = (
//   types: (ExtendedType | PlanSelectionType)[],
//   isTikTokMTCPlansEnabled: boolean
// ) => {
//   const tiktokMTCPlanTypes = types.filter((type) => isTikTokMTCPlansEnabled && type.label.includes('512GB'));
//   const nonTiktokMTClanTypes = types.filter((type) => isTikTokMTCPlansEnabled && type.label.includes('512GB'));

//   if (isTikTokMTCPlansEnabled) {
//     return types
//   }
// };

// interface IsPlanDisabledProps {
//   disableLargestGbPlansFlag?: boolean;
//   isTikTokMTCPlansEnabled?: boolean;
//   plan: ExtendedType | PlanSelectionType;
//   selectedRegionId?: string;
// }

// export const isPlanDisabled = ({
//   disableLargestGbPlansFlag,
//   isTikTokMTCPlansEnabled,
//   plan,
//   selectedRegionId,
// }: IsPlanDisabledProps) => {
//   if (
//     selectedRegionId &&
//     plan.label.includes('512GB') &&
//     isTikTokMTCPlansEnabled &&
//     ['us-iad'].includes(selectedRegionId)
//   ) {
//     return false;
//   }
//   return (
//     plan.label.includes('512GB') &&
//     Boolean(disableLargestGbPlansFlag) &&
//     // new Ada GPU plans are actually available
//     plan.class !== 'gpu'
//   );
// };

// export const isPlanDisabled = ({
//   disableLargestGbPlansFlag,
//   isTikTokMTCPlansEnabled,
//   plan,
//   selectedRegionId,
// }: IsPlanDisabledProps) => {
//   const is512GB = plan.label.includes('512GB');
//   const is512GBor128GB =
//     plan.label.includes('512GB') || plan.label.includes('128GB');
//   const isOsloOrIADRegion =
//     selectedRegionId === 'us-iad' || selectedRegionId === 'oslo';

//   // If TikTok is enabled, and the plan is 512GB/128GB in us-iad or oslo, enable the button
//   if (isOsloOrIADRegion && is512GBor128GB && isTikTokMTCPlansEnabled) {
//     return false;
//   }

//   // If TikTok is not enabled, we should prioritize disableLargestGbPlansFlag
//   if (isOsloOrIADRegion && is512GBor128GB && !isTikTokMTCPlansEnabled) {
//     return Boolean(disableLargestGbPlansFlag);
//   }

//   // new Ada GPU plans are actually available
//   if (is512GB && Boolean(disableLargestGbPlansFlag) && plan.class !== 'gpu') {
//     return true;
//   }

//   // For all other cases (not 512GB/128GB), enable the button
//   return false;
// };

export const getTikTokMTCCustomPlanTypes = (
  types: (ExtendedType | PlanSelectionType)[],
  useIsTikTokMTCPlansEnabled: boolean
) => {
  return types.filter(
    (type) =>
      useIsTikTokMTCPlansEnabled &&
      (type.label.includes('512GB') || type.label.includes('128GB'))
  );
};

interface ExtractPlansInformationProps {
  disableLargestGbPlansFlag: Flags['disableLargestGbPlans'] | undefined;
  disabledClasses?: LinodeTypeClass[];
  disabledSmallerPlans?: PlanSelectionType[];
  isAPLEnabled?: boolean;
  isLegacyDatabase?: boolean;
  isTikTokMTCPlansEnabledRegion?: boolean;
  plans: PlanSelectionType[];
  regionAvailabilities: RegionAvailability[] | undefined;
  selectedRegionId: Region['id'] | undefined;
}

/**
 * Extracts plan information and determines if any plans are disabled.
 * Used for Linode and Kubernetes selection Plan tables and notices.
 *
 * @param disableLargestGbPlansFlag The flag to disable the largest GB plans.
 * @param disabledClasses The disabled classes (aka linode types).
 * @param plans The plans for the Linode type class.
 * @param regionAvailabilities The region availabilities.
 * @param selectedRegionId The selected region ID.
 *
 * @returns An object containing the plan information and disabled logic.
 */
export const extractPlansInformation = ({
  disableLargestGbPlansFlag,
  disabledClasses,
  disabledSmallerPlans,
  isAPLEnabled,
  isLegacyDatabase,
  isTikTokMTCPlansEnabledRegion,
  plans,
  regionAvailabilities,
  selectedRegionId,
}: ExtractPlansInformationProps) => {
  const plansForThisLinodeTypeClass: PlanWithAvailability[] = plans.map(
    (plan) => {
      // const planIsDisabled512Gb
      // const planIsDisabled512Gb = isPlanDisabled({
      //   disableLargestGbPlansFlag,
      //   isTikTokMTCPlansEnabled,
      //   plan,
      //   selectedRegionId,
      // });

      // Disable 512GB plans if not GPU or not in 'oslo' or 'us-iad' regions
      // 1. new Ada GPU plans are actually available.
      // 2. 512GB TikTok MTC plans are available in specific regions.
      const planIsDisabled512Gb =
        plan.label.includes('512GB') &&
        Boolean(disableLargestGbPlansFlag) &&
        !(plan.class === 'gpu' || isTikTokMTCPlansEnabledRegion);

      // TikTok MTC 512/128GB plans are available for `us-iad` & `oslo` regions
      const planIsLimitedToTikTokMTCRegions =
        (plan.label.includes('512GB') || plan.label.includes('128GB')) &&
        !Boolean(isTikTokMTCPlansEnabledRegion);

      const planIsSoldOutInTikTokMTCRegions =
        (plan.label.includes('512GB') || plan.label.includes('128GB')) &&
        Boolean(isTikTokMTCPlansEnabledRegion);

      const planHasLimitedAvailability = getIsLimitedAvailability({
        plan,
        regionAvailabilities,
        selectedRegionId,
      });
      const planBelongsToDisabledClass = Boolean(
        disabledClasses?.includes(plan.class)
      );
      const disabledPlans = Boolean(
        disabledSmallerPlans?.find(
          (disabledPlan) => disabledPlan.id === plan.id
        )
      );
      const planIsTooSmall = Boolean(isLegacyDatabase && disabledPlans);
      const planIsSmallerThanUsage = Boolean(
        !isLegacyDatabase && disabledPlans
      );

      const planIsTooSmallForAPL =
        isAPLEnabled && Boolean(plan.memory < 8000 || plan.vcpus < 4);

      return {
        ...plan,
        planBelongsToDisabledClass,
        planHasLimitedAvailability,
        planIsDisabled512Gb,
        planIsLimitedToTikTokMTCRegions,
        planIsSmallerThanUsage,
        planIsSoldOutInTikTokMTCRegions,
        planIsTooSmall,
        planIsTooSmallForAPL,
      };
    }
  );

  const allDisabledPlans = plansForThisLinodeTypeClass.reduce((acc, plan) => {
    const {
      planBelongsToDisabledClass,
      planHasLimitedAvailability,
      planIsDisabled512Gb,
      planIsLimitedToTikTokMTCRegions,
      planIsSmallerThanUsage,
      planIsSoldOutInTikTokMTCRegions,
      planIsTooSmall,
      planIsTooSmallForAPL,
    } = plan;

    // Determine if the plan should be disabled due to
    // - belonging to a disabled class
    // - having limited availability (API based)
    // - being a 512GB plan (hard coded)
    if (
      planBelongsToDisabledClass ||
      planHasLimitedAvailability ||
      planIsDisabled512Gb ||
      planIsTooSmall ||
      planIsSmallerThanUsage ||
      planIsTooSmallForAPL ||
      planIsLimitedToTikTokMTCRegions ||
      planIsSoldOutInTikTokMTCRegions
    ) {
      return [...acc, plan];
    }

    return acc;
  }, []);
  const hasDisabledPlans = allDisabledPlans.length > 0;
  const hasMajorityOfPlansDisabled =
    allDisabledPlans.length > plansForThisLinodeTypeClass.length / 2;

  return {
    allDisabledPlans,
    hasDisabledPlans,
    hasMajorityOfPlansDisabled,
    plansForThisLinodeTypeClass,
  };
};

/**
 * A utility function to determine what the disabled plan reason is.
 * Defaults to the currently unavailable copy.
 */
export const getDisabledPlanReasonCopy = ({
  planBelongsToDisabledClass,
  planHasLimitedAvailability,
  planIsDisabled512Gb,
  planIsLimitedToTikTokMTCRegions,
  planIsSmallerThanUsage,
  planIsSoldOutInTikTokMTCRegions,
  planIsTooSmall,
  planIsTooSmallForAPL,
  wholePanelIsDisabled,
}: {
  planBelongsToDisabledClass: DisabledTooltipReasons['planBelongsToDisabledClass'];
  planHasLimitedAvailability: DisabledTooltipReasons['planHasLimitedAvailability'];
  planIsDisabled512Gb: DisabledTooltipReasons['planIsDisabled512Gb'];
  planIsLimitedToTikTokMTCRegions?: DisabledTooltipReasons['planIsLimitedToTikTokMTCRegions'];
  planIsSmallerThanUsage?: DisabledTooltipReasons['planIsSmallerThanUsage'];
  planIsSoldOutInTikTokMTCRegions?: DisabledTooltipReasons['planIsSoldOutInTikTokMTCRegions'];
  planIsTooSmall: DisabledTooltipReasons['planIsTooSmall'];
  planIsTooSmallForAPL?: DisabledTooltipReasons['planIsTooSmallForAPL'];
  wholePanelIsDisabled?: DisabledTooltipReasons['wholePanelIsDisabled'];
}): string => {
  if (wholePanelIsDisabled || planIsLimitedToTikTokMTCRegions) {
    return PLAN_NOT_AVAILABLE_IN_REGION_COPY;
  }

  if (planBelongsToDisabledClass || planIsSoldOutInTikTokMTCRegions) {
    return PLAN_IS_CURRENTLY_UNAVAILABLE_COPY;
  }

  if (planIsTooSmall) {
    return SMALLER_PLAN_DISABLED_COPY;
  } else if (planIsSmallerThanUsage) {
    return PLAN_IS_SMALLER_THAN_USAGE_COPY;
  }

  if (planIsTooSmallForAPL) {
    return PLAN_IS_TOO_SMALL_FOR_APL_COPY;
  }

  if (planHasLimitedAvailability || planIsDisabled512Gb) {
    return LIMITED_AVAILABILITY_COPY;
  }

  // if (planIsLimitedToTikTokMTCRegions) {
  //   return PLAN_IS_SOLD_OUT_TIKTOK_MTC_COPY;
  // }

  return PLAN_IS_CURRENTLY_UNAVAILABLE_COPY;
};
